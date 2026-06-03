import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string
  const role = token.role as Role
  const userId = token.id as string

  if (!hasPermission(role, 'documents', 'publish')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const doc = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  if (doc.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Le document doit être approuvé avant publication' }, { status: 400 })
  }

  const document = await db.document.update({
    where: { id },
    data: { status: 'PUBLISHED' },
  })

  await db.auditLog.create({
    data: {
      action: 'APPROVE',
      entityType: 'Document',
      entityId: id,
      details: `Document "${doc.title}" publié`,
      organizationId: orgId,
      userId,
      documentId: id,
    },
  })

  return NextResponse.json(document)
}
