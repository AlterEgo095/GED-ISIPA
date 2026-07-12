import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { saveFile } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'create')) {
      return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    }
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || ''
    const type = formData.get('type') as string
    const classification = (formData.get('classification') as string) || 'INTERNAL'
    const departmentId = formData.get('departmentId') as string
    const tags = (formData.get('tags') as string) || ''
    const retentionPolicy = formData.get('retentionPolicy') as string | null
    const folderId = formData.get('folderId') as string | null
    const runAi = formData.get('runAi') as string | null // New: trigger AI pipeline

    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    if (!title) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
    if (!type) return NextResponse.json({ error: 'Type de document requis' }, { status: 400 })
    if (!departmentId) return NextResponse.json({ error: 'Departement requis' }, { status: 400 })

    const saved = await saveFile(orgId, file, file.name)
    const reference = `DOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    let destroyAt: Date | null = null
    if (retentionPolicy === 'SHORT_TERM') destroyAt = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
    else if (retentionPolicy === 'MEDIUM_TERM') destroyAt = new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000)
    else if (retentionPolicy === 'LONG_TERM') destroyAt = new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000)

    const document = await db.document.create({
      data: {
        title, description, reference, type: type as any, classification: classification as any,
        filePath: saved.filePath, fileName: file.name, fileSize: saved.fileSize,
        mimeType: saved.mimeType, fileHash: saved.fileHash, version: 1, tags,
        organizationId: orgId, authorId: userId, departmentId,
        retentionPolicy: retentionPolicy as any, destroyAt, folderId: folderId || null, status: 'DRAFT',
      },
      include: { author: { select: { id: true, name: true, email: true } }, department: { select: { id: true, name: true, code: true } } },
    })

    await db.documentVersion.create({
      data: { documentId: document.id, version: 1, filePath: saved.filePath, fileName: file.name,
        fileSize: saved.fileSize, fileHash: saved.fileHash, mimeType: saved.mimeType,
        changeType: 'CREATE', changeLog: 'Creation du document', createdBy: userId },
    })

    await db.auditLog.create({
      data: { action: 'CREATE', entityType: 'Document', entityId: document.id,
        details: `Document cree: ${title} (${reference})`, organizationId: orgId, userId,
        documentId: document.id, ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null },
    })

    // Run AI pipeline in background if requested (non-blocking)
    let aiResult: { status: string; message: string } | null = null
    if (runAi !== 'false' && process.env.AI_API_KEY) {
      // AI pipeline managed via superadmin Config IA
      aiResult = { status: 'available', message: 'IA disponible via configuration admin' }
    }

    return NextResponse.json({ document, ai: aiResult }, { status: 201 })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de l upload' }, { status: 500 })
  }
}
