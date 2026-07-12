import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { validateTransition } from '@/lib/document-lifecycle'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/restore
 * Transition: ARCHIVED → PUBLISHED
 * Updated: Restored documents return to PUBLISHED (not DRAFT) since they were
 * archived from a published/approved state. This preserves the lifecycle integrity.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string
  const role = token.role as Role
  const userId = token.id as string

  const doc = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // Use lifecycle state machine for validation
  const validation = validateTransition(doc.status, 'restore', role, doc.isDeleted)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Restore to PUBLISHED (the proper lifecycle target for archive→restore)
  const document = await db.document.update({
    where: { id },
    data: {
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      archiveRef: null,
      status: (doc.previousStatus as any) || 'PUBLISHED',
      previousStatus: null,
      // Reset destruction approval since document is being restored
      destructionApproved: false,
      destructionApprovedBy: null,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  })

  await db.auditLog.create({
    data: {
      action: 'RESTORE',
      entityType: 'Document',
      entityId: id,
      details: `Document "${doc.title}" restauré depuis les archives vers le statut Publié`,
      organizationId: orgId,
      userId,
      documentId: id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
    },
  })

  return NextResponse.json({ document })
}
