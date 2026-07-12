import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { getAvailableTransitions, LIFECYCLE_STEPS, getLifecycleStep } from '@/lib/document-lifecycle'
import type { Role, DocumentStatus } from '@prisma/client'

/**
 * GET /api/documents/[id]/lifecycle
 * Returns the document lifecycle state: current step, available transitions, and full timeline.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const orgId = token.organizationId as string
    const role = token.role as Role

    const doc = await db.document.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
      include: {
        author: { select: { id: true, name: true, email: true } },
        versions: { orderBy: { version: 'desc' }, take: 5 },
      },
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const currentStatus = doc.status as DocumentStatus
    const currentStep = getLifecycleStep(currentStatus)
    const availableTransitions = getAvailableTransitions(currentStatus, role, doc.isDeleted, doc.isArchived)

    // Build audit timeline for this document
    const auditTimeline = await db.auditLog.findMany({
      where: { documentId: id, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    // Build lifecycle steps with completion info
    const lifecycleSteps = LIFECYCLE_STEPS.map(step => ({
      ...step,
      completed: step.statuses.includes(currentStatus) || currentStep > step.step,
      current: step.statuses.includes(currentStatus),
    }))

    return NextResponse.json({
      currentStatus,
      currentStep,
      currentPhase: getLifecycleStep(currentStatus) > 0 
        ? LIFECYCLE_STEPS.find(s => s.statuses.includes(currentStatus))?.label 
        : 'Inconnu',
      availableTransitions,
      lifecycleSteps,
      auditTimeline,
      document: {
        id: doc.id,
        title: doc.title,
        reference: doc.reference,
        status: doc.status,
        isArchived: doc.isArchived,
        isDeleted: doc.isDeleted,
        destructionApproved: doc.destructionApproved,
        retentionPolicy: doc.retentionPolicy,
        destroyAt: doc.destroyAt,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        archivedAt: doc.archivedAt,
        archivedBy: doc.archivedBy,
        reviewedBy: doc.reviewedBy,
        reviewedAt: doc.reviewedAt,
        rejectedBy: doc.rejectedBy,
        rejectedAt: doc.rejectedAt,
        destroyedAt: doc.destroyedAt,
        destroyedBy: doc.destroyedBy,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement du cycle de vie'
    console.error('Lifecycle error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
