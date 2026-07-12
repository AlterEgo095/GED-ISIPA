import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { validateTransition } from '@/lib/document-lifecycle'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/complete-review
 * Transition: IN_REVIEW → PENDING_APPROVAL
 * Reviewer has completed review, sends for approval.
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
    const validation = validateTransition(doc.status, 'complete-review', role, doc.isDeleted)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Optional: reviewer can add a comment
    let reviewComment: string | null = null
    try {
      const body = await request.json()
      reviewComment = body.comment || null
    } catch {
      // No body is fine
    }

    // Update document status
    const updated = await db.document.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        reviewComment: reviewComment || doc.reviewComment,
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
      const approvalState = workflow.states.find(s => 
        s.name.toLowerCase().includes('approbation') || 
        s.name.toLowerCase().includes('approval') ||
        s.name.toLowerCase().includes('attente')
      )
      if (approvalState) {
        await db.document.update({
          where: { id },
          data: { workflowStateId: approvalState.id },
        })
      }
    }

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Révision complétée pour "${doc.title}". ${reviewComment ? `Commentaire: ${reviewComment}` : 'Transmis pour approbation.'}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ document: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la complétion de la révision'
    console.error('Complete review error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
