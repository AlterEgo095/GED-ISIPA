import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string, { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const annotations = await db.documentAnnotation.findMany({ where: { documentId: id, ...(page ? { page } : {}) }, include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ annotations })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string, userId = token.id as string, { id } = await params
    const body = await request.json()
    if (!body.position) return NextResponse.json({ error: 'Position requise' }, { status: 400 })
    const annotation = await db.documentAnnotation.create({ data: { documentId: id, userId, page: body.page || 1, type: body.type || 'HIGHLIGHT', position: body.position, content: body.content || null, color: body.color || '#ffff00' } })
    await db.auditLog.create({ data: { action: 'ANNOTATION_ADD', entityType: 'Document', entityId: id, details: `Annotation ajoutee (page ${body.page || 1})`, organizationId: orgId, userId, documentId: id } })
    return NextResponse.json({ annotation }, { status: 201 })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
