import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string, userId = token.id as string
    const { id, commentId } = await params
    const comment = await db.documentComment.findFirst({ where: { id: commentId, documentId: id } })
    if (!comment) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })
    const body = await request.json()
    const updated = await db.documentComment.update({ where: { id: commentId }, data: { isResolved: body.isResolved !== undefined ? body.isResolved : true, resolvedBy: body.isResolved !== false ? userId : null, resolvedAt: body.isResolved !== false ? new Date() : null } })
    await db.auditLog.create({ data: { action: 'COMMENT_RESOLVE', entityType: 'DocumentComment', entityId: commentId, details: `Commentaire ${body.isResolved !== false ? 'resolu' : 'reouvert'}`, organizationId: orgId, userId } })
    return NextResponse.json({ comment: updated })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const { commentId } = await params
    await db.documentComment.delete({ where: { id: commentId } })
    return NextResponse.json({ success: true })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
