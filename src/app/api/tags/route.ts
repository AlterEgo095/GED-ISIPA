import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string
    const tags = await db.documentTag.findMany({ where: { organizationId: orgId }, include: { _count: { select: { documents: true } } }, orderBy: { name: 'asc' } })
    return NextResponse.json({ tags })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string, userId = token.id as string
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Nom du tag requis' }, { status: 400 })
    const tag = await db.documentTag.create({ data: { name: body.name, organizationId: orgId, color: body.color || '#6b7280' } })
    await db.auditLog.create({ data: { action: 'TAG_ASSIGN', entityType: 'DocumentTag', entityId: tag.id, details: `Tag cree: ${body.name}`, organizationId: orgId, userId } })
    return NextResponse.json({ tag }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Ce tag existe deja' }, { status: 409 })
    return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 })
  }
}
