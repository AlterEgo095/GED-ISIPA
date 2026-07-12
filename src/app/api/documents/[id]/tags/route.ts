import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const { id } = await params
    const assignments = await db.documentTagAssignment.findMany({ where: { documentId: id }, include: { tag: true } })
    return NextResponse.json({ tags: assignments.map(a => a.tag) })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const userId = token.id as string, orgId = token.organizationId as string, { id } = await params
    const body = await request.json()
    if (!body.tagId) return NextResponse.json({ error: 'tagId requis' }, { status: 400 })
    const assignment = await db.documentTagAssignment.create({ data: { documentId: id, tagId: body.tagId, assignedBy: userId } })
    await db.auditLog.create({ data: { action: 'TAG_ASSIGN', entityType: 'Document', entityId: id, details: `Tag assigne`, organizationId: orgId, userId, documentId: id } })
    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Tag deja assigne' }, { status: 409 })
    return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    if (!body.tagId) return NextResponse.json({ error: 'tagId requis' }, { status: 400 })
    await db.documentTagAssignment.deleteMany({ where: { documentId: id, tagId: body.tagId } })
    return NextResponse.json({ success: true })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
