import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { saveFile, fileExists } from '@/lib/storage'
import { z } from 'zod'
import type { Role } from '@prisma/client'

const restoreSchema = z.object({
  versionNumber: z.number().int().positive(),
  reason: z.string().min(1, 'La raison est requise').max(500),
})

/**
 * POST /api/documents/[id]/versions/restore
 * Restore a previous version as the current version.
 * Creates a NEW version entry with changeType=RESTORE pointing to the old file.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string

    if (!hasPermission(role as any, 'documents', 'update')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = restoreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
    }

    const { versionNumber, reason } = parsed.data

    // Find the document
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Find the version to restore
    const targetVersion = await db.documentVersion.findFirst({
      where: { documentId: id, version: versionNumber },
    })
    if (!targetVersion) return NextResponse.json({ error: `Version ${versionNumber} introuvable` }, { status: 404 })

    // Don't restore if it's already the current version
    if (targetVersion.version === doc.version) {
      return NextResponse.json({ error: `La version ${versionNumber} est déjà la version actuelle` }, { status: 400 })
    }

    // Verify the file still exists
    const fileStillExists = await fileExists(targetVersion.filePath)
    if (!fileStillExists) {
      return NextResponse.json({ error: `Le fichier de la version ${versionNumber} n'existe plus sur le serveur` }, { status: 400 })
    }

    // Find previous version for linking
    const previousVersion = await db.documentVersion.findFirst({
      where: { documentId: id, version: doc.version },
      select: { id: true },
    })

    // Create a new version entry that points to the old file
    const newVersionNum = doc.version + 1
    await db.documentVersion.create({
      data: {
        documentId: id,
        version: newVersionNum,
        filePath: targetVersion.filePath,
        fileName: targetVersion.fileName,
        fileSize: targetVersion.fileSize,
        fileHash: targetVersion.fileHash,
        mimeType: targetVersion.mimeType,
        changeType: 'RESTORE',
        changeLog: `Restauration de la version ${versionNumber}. Raison: ${reason}`,
        createdBy: userId,
        previousVersionId: previousVersion?.id || null,
      },
    })

    // Update the main document to point to the restored version
    const updated = await db.document.update({
      where: { id },
      data: {
        version: newVersionNum,
        filePath: targetVersion.filePath,
        fileName: targetVersion.fileName,
        fileSize: targetVersion.fileSize,
        fileHash: targetVersion.fileHash,
        mimeType: targetVersion.mimeType,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    })

    await db.auditLog.create({
      data: {
        action: 'VERSION_UPLOAD',
        entityType: 'Document',
        entityId: id,
        details: `Version ${versionNumber} restaurée comme version ${newVersionNum}. Raison: ${reason}. Fichier: ${targetVersion.fileName}, Hash: ${targetVersion.fileHash.substring(0, 16)}...`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({
      document: updated,
      restoredFrom: versionNumber,
      newVersion: newVersionNum,
      message: `Version ${versionNumber} restaurée comme version ${newVersionNum}`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la restauration de version'
    console.error('Version restore error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
