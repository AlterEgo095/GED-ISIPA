import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/soft-delete
 * Soft delete: move document to recycle bin (corbeille).
 * Sets isDeleted=true, deletedAt, deletedBy, and saves previousStatus for restoration.
 * Physical files are preserved until permanent deletion via trash purge.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const orgId = token.organizationId as string
    const role = token.role as Role
    const userId = token.id as string

    if (!hasPermission(role, 'documents', 'delete')) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const existing = await db.document.findFirst({ 
      where: { id, organizationId: orgId, isDeleted: false } 
    })
    if (!existing) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Cannot soft-delete archived documents
    if (existing.isArchived) {
      return NextResponse.json({ 
        error: 'Les documents archivés ne peuvent pas être mis en corbeille. Restaurez-les ou utilisez la destruction contrôlée.' 
      }, { status: 400 })
    }

    // Save current status for potential restoration
    const updated = await db.document.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        previousStatus: existing.status,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Document',
        entityId: id,
        details: `Document "${existing.title}" (${existing.reference}) déplacé vers la corbeille`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ 
      document: updated,
      message: 'Document déplacé vers la corbeille. Il pourra être restauré dans les 30 jours.' 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
    console.error('Soft delete error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}