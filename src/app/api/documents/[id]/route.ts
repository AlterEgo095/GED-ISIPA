import { NextResponse } from 'next/server'
import { db, softDelete } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string

  const document = await db.document.findFirst({
    where: { id, organizationId: orgId, isDeleted: false },
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

  const existing = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
  if (!existing) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  try {
    const body = await request.json()

    // Validate enum fields against Prisma enums
    const validTypes = ['ACADEMIC_RECORD', 'ADMINISTRATIVE', 'FINANCIAL', 'CORRESPONDENCE', 'REPORT', 'CONTRACT', 'CERTIFICATE', 'MEMO', 'POLICY', 'MEDICAL_RECORD', 'LEGAL_BRIEF', 'INVOICE', 'PROPOSAL', 'OTHER']
    const validClassifications = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']

    const updateData: Record<string, unknown> = {}
    if (body.title) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.type && validTypes.includes(body.type)) updateData.type = body.type
    if (body.classification && validClassifications.includes(body.classification)) updateData.classification = body.classification
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.metadata) updateData.metadata = body.metadata
    if (body.departmentId) updateData.departmentId = body.departmentId
    updateData.version = { increment: 1 }

    const document = await db.document.update({
      where: { id },
      data: updateData,
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

  if (!hasPermission(role, 'documents', 'delete')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const existing = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
  if (!existing) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  await db.document.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy: token.id as string, previousStatus: existing.status } })

  await db.auditLog.create({
    data: {
      action: 'DELETE',
      entityType: 'Document',
      entityId: id,
      details: `Document "${existing.title}" supprimé`,
      organizationId: orgId,
      userId: token.id as string,
    },
  })

  return NextResponse.json({ message: 'Document supprimé' })
}
