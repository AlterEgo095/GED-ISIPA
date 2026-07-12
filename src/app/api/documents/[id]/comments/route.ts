import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string, { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    const comments = await db.documentComment.findMany({ where: { documentId: id }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ comments })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string, userId = token.id as string, { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    const body = await request.json()
    if (!body.content) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
    const comment = await db.documentComment.create({ data: { documentId: id, userId, content: body.content, parentId: body.parentId || null, mentions: body.mentions || [] } })
    await db.auditLog.create({ data: { action: 'COMMENT_ADD', entityType: 'Document', entityId: id, details: `Commentaire ajoute sur: ${doc.title}`, organizationId: orgId, userId, documentId: id } })
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
