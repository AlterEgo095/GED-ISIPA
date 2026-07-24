import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import { fileExists, readDecryptedFile } from '@/lib/storage'
import fs from 'fs'
import path from 'path'
import type { Role } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Authenticate user
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const role = token.role as Role
  if (!hasPermission(role, 'documents', 'read')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const orgId = token.organizationId as string
  const userId = token.id as string

  try {
    const { id } = await params

    // Find document with org isolation
    const document = await db.document.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    }

    // Check if file exists on disk
    const filePath = document.filePath
    // Always resolve relative to cwd - strip leading slashes so /docs/file.pdf -> cwd/docs/file.pdf
    const relativePath = filePath.replace(/^\/+/g, '')
    const absolutePath = path.join(process.cwd(), relativePath)

    if (!(await fileExists(absolutePath))) {
      return NextResponse.json({ error: 'Fichier introuvable sur le serveur' }, { status: 404 })
    }

    // Read and decrypt file (handles both encrypted and plaintext)
    const fileBuffer = await readDecryptedFile(absolutePath)

    // Create audit log for download
    await db.auditLog.create({
      data: {
        action: 'DOWNLOAD',
        entityType: 'Document',
        entityId: document.id,
        details: `Document "${document.title}" téléchargé`,
        organizationId: orgId,
        userId,
        documentId: document.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // Create access log
    await db.accessLog.create({
      data: {
        documentId: document.id,
        userId,
        action: 'DOWNLOAD',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    // Encode filename for Content-Disposition (handle non-ASCII)
    const encodedFileName = encodeURIComponent(document.fileName)

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 })
  }
}
