import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { readDecryptedFile, fileExists } from '@/lib/storage'
import { extractDocumentContent, chunkText } from '@/lib/ai/extractor'
import { indexDocumentChunks } from '@/lib/ai/qdrant'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!hasPermission(token.role as any, 'documents', 'update')) {
    return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
  }

  const orgId = token.organizationId as string
  const { id } = await params

  const document = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!document) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const forceOcr = body.forceOcr === true
  const ocrLang = body.ocrLang || 'fra+eng'
  const indexVectors = body.indexVectors !== false

  try {
    const filePath = path.isAbsolute(document.filePath)
      ? document.filePath
      : path.join(process.cwd(), document.filePath)

    if (!(await fileExists(filePath))) {
      return NextResponse.json({ error: 'Fichier introuvable sur le serveur' }, { status: 404 })
    }

    // For extraction, we need the decrypted file on disk (if encrypted)
    let extractPath = filePath
    const isEncrypted = filePath.endsWith('.enc')
    if (isEncrypted) {
      const buffer = await readDecryptedFile(filePath)
      const tmpDir = await mkdir(path.join(os.tmpdir(), 'ged-extract'), { recursive: true }).then(() =>
        path.join(os.tmpdir(), 'ged-extract')
      )
      extractPath = path.join(tmpDir, document.fileName || `doc-${id}`)
      await writeFile(extractPath, buffer)
    }

    // Extract text
    const result = await extractDocumentContent(extractPath, document.mimeType, { forceOcr, ocrLang })

    // Cleanup temp
    if (isEncrypted) {
      try { await writeFile(extractPath, '') } catch {}
    }

    // Store extraction results as metadata
    await db.documentMetadata.upsert({
      where: { documentId_key: { documentId: id, key: 'extracted_text' } },
      update: { value: result.text.slice(0, 50000), type: 'TEXT' },
      create: { documentId: id, key: 'extracted_text', value: result.text.slice(0, 50000), type: 'TEXT' },
    })
    await db.documentMetadata.upsert({
      where: { documentId_key: { documentId: id, key: 'extraction_method' } },
      update: { value: result.method, type: 'TEXT' },
      create: { documentId: id, key: 'extraction_method', value: result.method, type: 'TEXT' },
    })
    await db.documentMetadata.upsert({
      where: { documentId_key: { documentId: id, key: 'word_count' } },
      update: { value: String(result.text.split(/\s+/).filter(Boolean).length), type: 'NUMBER' },
      create: { documentId: id, key: 'word_count', value: String(result.text.split(/\s+/).filter(Boolean).length), type: 'NUMBER' },
    })
    if (result.language) {
      await db.documentMetadata.upsert({
        where: { documentId_key: { documentId: id, key: 'language' } },
        update: { value: result.language, type: 'TEXT' },
        create: { documentId: id, key: 'language', value: result.language, type: 'TEXT' },
      })
    }
    if (result.confidence !== undefined) {
      await db.documentMetadata.upsert({
        where: { documentId_key: { documentId: id, key: 'ocr_confidence' } },
        update: { value: String(result.confidence), type: 'NUMBER' },
        create: { documentId: id, key: 'ocr_confidence', value: String(result.confidence), type: 'NUMBER' },
      })
    }

    // Index chunks into Qdrant for semantic search
    let indexingResult = { indexed: 0, errors: 0 }
    if (indexVectors && result.text.length > 10) {
      const chunks = chunkText(result.text, 1500, 200)
      indexingResult = await indexDocumentChunks({
        documentId: id,
        organizationId: orgId,
        title: document.title,
        type: document.type,
        departmentId: document.departmentId,
        tags: document.tags,
        chunks,
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Extraction texte: méthode=${result.method}, mots=${result.text.split(/\s+/).filter(Boolean).length}, chunks indexés=${indexingResult.indexed}`,
        organizationId: orgId,
        userId: token.id as string,
        documentId: id,
      },
    })

    return NextResponse.json({
      success: true,
      extraction: {
        method: result.method,
        wordCount: result.text.split(/\s+/).filter(Boolean).length,
        pages: result.pages,
        language: result.language,
        confidence: result.confidence,
        textPreview: result.text.slice(0, 500),
      },
      indexing: indexingResult,
    })
  } catch (error: any) {
    console.error('Extract error:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'extraction' }, { status: 500 })
  }
}

// GET: retrieve extracted text
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!hasPermission(token.role as any, 'documents', 'read')) {
    return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
  }

  const orgId = token.organizationId as string
  const { id } = await params
  const document = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!document) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  const metadata = await db.documentMetadata.findMany({
    where: { documentId: id, key: { in: ['extracted_text', 'extraction_method', 'word_count', 'language', 'ocr_confidence'] } },
  })

  const map: Record<string, string> = {}
  for (const m of metadata) map[m.key] = m.value

  return NextResponse.json({
    extracted: map.extracted_text || null,
    method: map.extraction_method || null,
    wordCount: map.word_count ? parseInt(map.word_count) : 0,
    language: map.language || null,
    confidence: map.ocr_confidence ? parseFloat(map.ocr_confidence) : null,
  })
}
