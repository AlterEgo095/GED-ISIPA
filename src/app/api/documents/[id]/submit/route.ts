import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { validateTransition } from '@/lib/document-lifecycle'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/submit
 * Transition: DRAFT/REJECTED → PENDING_REVIEW
 * Updated to use lifecycle state machine for validation.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Use lifecycle state machine for validation
  const validation = validateTransition(doc.status, 'submit', role, doc.isDeleted)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Find the workflow and get the review state
  const workflow = await db.workflow.findFirst({
    where: { organizationId: orgId, isActive: true },
    include: {
      states: { orderBy: { order: 'asc' } },
      transitions: { include: { fromState: true, toState: true } },
    },
  })

  let workflowStateId: string | null = null
  if (workflow) {
    const reviewState = workflow.states.find(s => s.name === 'En révision' || s.name.toLowerCase().includes('review'))
    if (reviewState) workflowStateId = reviewState.id
  }

  // Clear rejection data when resubmitting
  const updateData: Record<string, unknown> = {
    status: 'PENDING_REVIEW',
    workflowStateId,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  }

  const updated = await db.document.update({
    where: { id },
    data: updateData,
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
      details: `Document "${doc.title}" soumis pour validation`,
      organizationId: orgId,
      userId,
      documentId: id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
    },
  })

  return NextResponse.json({ document: updated, message: 'Document soumis pour validation' })
}
