import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import { updateDocumentSchema } from '@/lib/validation'
import type { Role } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string

  const document = await db.document.findFirst({
    where: { id, organizationId: orgId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
      workflowState: true,
      versions: { orderBy: { version: 'desc' } },
    },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
  }

  // Create access log
  await db.accessLog.create({
    data: {
      documentId: id,
      userId: token.id as string,
      action: 'READ',
    },
  })

  return NextResponse.json(document)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string
  const role = token.role as Role
  const userId = token.id as string

  if (!hasPermission(role, 'documents', 'update')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const existing = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  try {
    const body = await request.json()
    const parsed = updateDocumentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
    }
    const validated = parsed.data
    const document = await db.document.update({
      where: { id },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.type && { type: validated.type }),
        ...(validated.classification && { classification: validated.classification }),
        ...(validated.tags !== undefined && { tags: validated.tags }),
        ...(validated.metadata && { metadata: JSON.stringify(validated.metadata) }),
        ...(validated.departmentId && { departmentId: validated.departmentId }),
        ...(validated.folderId !== undefined && { folderId: validated.folderId }),
        version: { increment: 1 },
      },
    })

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Document "${document.title}" modifié`,
        organizationId: orgId,
        userId,
        documentId: id,
      },
    })

    return NextResponse.json(document)
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string
  const role = token.role as Role
  const userId = token.id as string

  if (!hasPermission(role, 'documents', 'delete')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const existing = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
  if (!existing) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // Soft delete: mark document as deleted instead of removing from DB
  await db.document.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
    },
  })

  // Note: Physical files are NOT deleted on soft delete.
  // They will be permanently removed when the trash is purged (via /api/documents/trash purge endpoint)
  // or after the retention period expires.

  await db.auditLog.create({
    data: {
      action: 'DELETE',
      entityType: 'Document',
      entityId: id,
      details: `Document "${existing.title}" déplacé vers la corbeille (soft delete)`,
      organizationId: orgId,
      userId,
      documentId: id,
    },
  })

  return NextResponse.json({ message: 'Document déplacé vers la corbeille' })
}
