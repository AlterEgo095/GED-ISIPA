import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { fileExists } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

/**
 * GET /api/documents/[id]/versions/download?version=N
 * Download a specific version of a document.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const userId = token.id as string
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const versionNum = parseInt(searchParams.get('version') || '0')

    if (!versionNum) {
      return NextResponse.json({ error: 'Numéro de version requis (?version=N)' }, { status: 400 })
    }

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const version = await db.documentVersion.findFirst({
      where: { documentId: id, version: versionNum },
    })
    if (!version) return NextResponse.json({ error: `Version ${versionNum} introuvable` }, { status: 404 })

    // Check if file exists
    const exists = await fileExists(version.filePath)
    if (!exists) {
      return NextResponse.json({ error: 'Le fichier de cette version n\'existe plus sur le serveur' }, { status: 404 })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'DOWNLOAD',
        entityType: 'Document',
        entityId: id,
        details: `Téléchargement de la version ${versionNum} du document: ${doc.title}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // Read and return the file
    const fileBuffer = await fs.readFile(version.filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': version.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${version.fileName}"`,
        'Content-Length': version.fileSize.toString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du téléchargement'
    console.error('Version download error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
