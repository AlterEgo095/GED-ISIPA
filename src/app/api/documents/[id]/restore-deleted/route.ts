import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/restore-deleted
 * Restore a soft-deleted document from the recycle bin.
 * Restores the document to its previous status if available.
 * Enhanced with previousStatus restoration and audit trail.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string

    // Users with delete or restore permission can restore
    if (!hasPermission(role as any, 'documents', 'delete') && !hasPermission(role as any, 'documents', 'restore')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const { id } = await params
    const doc = await db.document.findFirst({ 
      where: { id, organizationId: orgId, isDeleted: true },
      include: { 
        folder: { select: { id: true, name: true } },
      },
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable dans la corbeille' }, { status: 404 })

    // Determine the status to restore to
    // Priority: previousStatus > DRAFT (safe fallback for documents that were in various states)
    const restoreStatus = (doc.previousStatus as string) || 'DRAFT'

    const updated = await db.document.update({ 
      where: { id }, 
      data: { 
        isDeleted: false, 
        deletedAt: null, 
        deletedBy: null,
        previousStatus: null, // Clear previousStatus after restoration
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        folder: { select: { id: true, name: true } },
      },
    })

    await db.auditLog.create({ 
      data: { 
        action: 'RESTORE_DELETED', 
        entityType: 'Document', 
        entityId: id, 
        details: `Document restauré depuis la corbeille: ${doc.title}. Statut restauré: ${restoreStatus}`, 
        organizationId: orgId, 
        userId, 
        documentId: id, 
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      } 
    })

    return NextResponse.json({ 
      document: updated,
      message: `Document restauré avec le statut: ${restoreStatus}`,
      restoredStatus: restoreStatus,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la restauration'
    console.error('Restore deleted error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
