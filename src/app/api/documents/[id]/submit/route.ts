import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import { hasPermission } from '@/lib/permissions'
import type { NextRequest } from 'next/server'
import type { Role } from '@prisma/client'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string
  const userId = token.id as string
  const role = token.role as Role

  // RBAC: Must have 'create' or 'update' permission on documents to submit
  if (!hasPermission(role, 'documents', 'create') && !hasPermission(role, 'documents', 'update')) {
    return NextResponse.json({ error: 'Permissions insuffisantes pour soumettre un document' }, { status: 403 })
  }

  const doc = await db.document.findFirst({
    where: { id, organizationId: orgId, isDeleted: false },
    include: { workflowState: true },
  })
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // Ownership: Only author or admin can submit
  if (doc.authorId !== userId && !['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(role)) {
    return NextResponse.json({ error: 'Seul l\'auteur ou un administrateur peut soumettre ce document' }, { status: 403 })
  }

  if (doc.status !== 'DRAFT' && doc.status !== 'REJECTED') {
    return NextResponse.json({ error: 'Seuls les brouillons ou documents rejetés peuvent être soumis' }, { status: 400 })
  }

  // Find the workflow and get the first transition (Draft → Review)
  const workflow = await db.workflow.findFirst({
    where: { organizationId: orgId, isActive: true },
    include: {
      states: { orderBy: { order: 'asc' } },
      transitions: { include: { fromState: true, toState: true } },
    },
  })

  if (workflow) {
    const initialState = workflow.states.find(s => s.isInitial)
    const reviewState = workflow.states.find(s => s.name === 'En révision')

    if (initialState && reviewState) {
      await db.document.update({
        where: { id },
        data: {
          status: 'PENDING_REVIEW',
          workflowStateId: reviewState.id,
        },
      })
    } else {
      await db.document.update({
        where: { id },
        data: { status: 'PENDING_REVIEW' },
      })
    }
  } else {
    await db.document.update({
      where: { id },
      data: { status: 'PENDING_REVIEW' },
    })
  }

  await db.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'Document',
      entityId: id,
      details: `Document "${doc.title}" soumis pour révision`,
      organizationId: orgId,
      userId,
      documentId: id,
    },
  })

  return NextResponse.json({ message: 'Document soumis pour révision' })
}
