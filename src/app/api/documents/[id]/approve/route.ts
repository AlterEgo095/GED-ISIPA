import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string
  const role = token.role as Role
  const userId = token.id as string

  if (!hasPermission(role, 'documents', 'approve')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  if (!['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(doc.status)) {
    return NextResponse.json({ error: 'Le document doit etre en attente de revision ou approbation pour etre approuve' }, { status: 400 })
  }

  const document = await db.document.update({
    where: { id },
    data: { status: 'APPROVED', reviewedBy: userId, reviewedAt: new Date() },
  })

  await db.auditLog.create({
    data: {
      action: 'APPROVE',
      entityType: 'Document',
      entityId: id,
      details: 'Document approuve: ' + doc.title,
      organizationId: orgId,
      userId,
      documentId: id,
    },
  })

  return NextResponse.json(document)
}
