import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { validateTransition } from '@/lib/document-lifecycle'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/archive
 * Transition: PUBLISHED/APPROVED/REJECTED → ARCHIVED
 * Updated to use lifecycle state machine for validation.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string
  const role = token.role as Role
  const userId = token.id as string

  const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // Use lifecycle state machine for validation
  const validation = validateTransition(doc.status, 'archive', role, doc.isDeleted)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const archiveRef = `ARCH-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`

  const document = await db.document.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archivedBy: userId,
      archiveRef,
      previousStatus: doc.status,
      status: 'ARCHIVED',
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  })

  await db.auditLog.create({
    data: {
      action: 'ARCHIVE',
      entityType: 'Document',
      entityId: id,
      details: `Document "${doc.title}" archivé (${archiveRef})`,
      organizationId: orgId,
      userId,
      documentId: id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
    },
  })

  return NextResponse.json({ document })
}
