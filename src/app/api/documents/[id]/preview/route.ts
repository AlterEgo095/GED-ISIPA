import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { fileExists } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

const PREVIEWABLE_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'text',
  'text/csv': 'text',
  'text/markdown': 'text',
  'application/json': 'text',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'application/msword': 'office-word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'office-word',
  'application/vnd.ms-excel': 'office-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'office-excel',
  'application/vnd.ms-powerpoint': 'office-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'office-powerpoint',
}

const TEXT_PREVIEW_MAX_SIZE = 2 * 1024 * 1024 // 2 MB max for text preview

/**
 * GET /api/documents/[id]/preview
 * Generate a preview for a document based on its MIME type.
 * Returns either:
 *   - The file content directly (images, text)
 *   - A preview info object (PDF, Office docs)
 *   - An error if preview is not supported
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const userId = token.id as string
    const { id } = await params

    const doc = await db.document.findFirst({ 
      where: { id, organizationId: orgId, isDeleted: false, isArchived: false },
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Check if file exists
    const exists = await fileExists(doc.filePath)
    if (!exists) return NextResponse.json({ error: 'Fichier physique introuvable' }, { status: 404 })

    // Check if MIME type is previewable
    const previewType = PREVIEWABLE_MIME_TYPES[doc.mimeType]
    if (!previewType) {
      return NextResponse.json({ 
        previewable: false,
        mimeType: doc.mimeType,
        message: `La prévisualisation n'est pas disponible pour ce type de fichier: ${doc.mimeType}`,
        downloadUrl: `/api/documents/${id}/download`,
      })
    }

    // Update view count
    await db.document.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    // Log preview access
    await db.auditLog.create({
      data: {
        action: 'PREVIEW',
        entityType: 'Document',
        entityId: id,
        details: `Prévisualisation du document: ${doc.title} (${doc.mimeType})`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // Handle different preview types
    if (previewType === 'image') {
      // Return the image directly
      const fileBuffer = await fs.readFile(doc.filePath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': doc.mimeType,
          'Content-Length': doc.fileSize.toString(),
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    if (previewType === 'text') {
      // Return text content (with size limit)
      if (doc.fileSize > TEXT_PREVIEW_MAX_SIZE) {
        // Return first 100KB of text
        const fileHandle = await fs.open(doc.filePath, 'r')
        const buffer = Buffer.alloc(100 * 1024)
        await fileHandle.read(buffer, 0, 100 * 1024, 0)
        await fileHandle.close()
        const textContent = buffer.toString('utf-8')
        
        return NextResponse.json({
          previewable: true,
          type: 'text',
          content: textContent,
          truncated: true,
          totalSize: doc.fileSize,
          previewSize: 100 * 1024,
          mimeType: doc.mimeType,
        })
      }
      
      const textContent = await fs.readFile(doc.filePath, 'utf-8')
      return NextResponse.json({
        previewable: true,
        type: 'text',
        content: textContent,
        truncated: false,
        totalSize: doc.fileSize,
        mimeType: doc.mimeType,
      })
    }

    if (previewType === 'pdf') {
      // Return the PDF directly for browser rendering
      const fileBuffer = await fs.readFile(doc.filePath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': doc.fileSize.toString(),
          'Content-Disposition': `inline; filename="${doc.fileName}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    // Office documents - return metadata for client-side rendering
    if (previewType.startsWith('office-')) {
      // For Office docs, we provide info for the client to use an embedded viewer
      return NextResponse.json({
        previewable: true,
        type: previewType,
        mimeType: doc.mimeType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        downloadUrl: `/api/documents/${id}/download`,
        // For Office docs, we'll use Microsoft Office Online Viewer or a similar service
        externalViewerUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/documents/${id}/download`)}`,
        message: 'Utilisez le visualiseur externe pour les documents Office',
      })
    }

    return NextResponse.json({
      previewable: false,
      mimeType: doc.mimeType,
      downloadUrl: `/api/documents/${id}/download`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la prévisualisation'
    console.error('Preview error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
