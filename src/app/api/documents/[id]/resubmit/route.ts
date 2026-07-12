import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { validateTransition } from '@/lib/document-lifecycle'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/resubmit
 * Transition: PENDING_REVISION → DRAFT
 * Author re-takes the document after revision was requested, to apply changes.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const orgId = token.organizationId as string
    const userId = token.id as string
    const role = token.role as Role

    const doc = await db.document.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Validate transition
    const validation = validateTransition(doc.status, 'resubmit', role, doc.isDeleted)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Only the original author can resubmit (unless admin/manager)
    if (doc.authorId !== userId && !['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(role)) {
      return NextResponse.json({ 
        error: 'Seul l\'auteur du document peut reprendre l\'édition' 
      }, { status: 403 })
    }

    // Reset to DRAFT so the author can make changes
    const updated = await db.document.update({
      where: { id },
      data: {
        status: 'DRAFT',
        reviewComment: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    })

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Document "${doc.title}" repris pour modification par l'auteur`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ document: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la reprise du document'
    console.error('Resubmit error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
