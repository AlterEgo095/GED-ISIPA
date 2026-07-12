import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { validateTransition } from '@/lib/document-lifecycle'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/start-review
 * Transition: PENDING_REVIEW → IN_REVIEW
 * Reviewer takes ownership of the document for examination.
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
      include: { workflowState: true },
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Validate transition using lifecycle state machine
    const validation = validateTransition(doc.status, 'start-review', role, doc.isDeleted)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Update document status and assign reviewer
    const updated = await db.document.update({
      where: { id },
      data: {
        status: 'IN_REVIEW',
        reviewedById: userId,
        reviewedAt: new Date(),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    })

    // Update workflow state if workflow exists
    const workflow = await db.workflow.findFirst({
      where: { organizationId: orgId, isActive: true },
      include: {
        states: { orderBy: { order: 'asc' } },
      },
    })
    if (workflow) {
      const reviewState = workflow.states.find(s => s.name.toLowerCase().includes('révision') || s.name.toLowerCase().includes('review'))
      if (reviewState) {
        await db.document.update({
          where: { id },
          data: { workflowStateId: reviewState.id },
        })
      }
    }

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Document "${doc.title}" pris en charge pour révision par ${userId}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ document: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du démarrage de la révision'
    console.error('Start review error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
