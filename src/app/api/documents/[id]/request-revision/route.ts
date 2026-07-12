import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'
const revisionSchema = z.object({ comment: z.string().min(1, 'Le commentaire est requis').max(1000) })
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'reject')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { id } = await params
    const body = await request.json()
    const validation = revisionSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message || 'Donnees invalides' }, { status: 400 })
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    if (!['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED'].includes(doc.status)) return NextResponse.json({ error: 'Le document doit etre en cours de revision ou approuve pour demander une revision' }, { status: 400 })
    const updated = await db.document.update({ where: { id }, data: { status: 'PENDING_REVISION', reviewComment: validation.data.comment, reviewedBy: userId, reviewedAt: new Date() } })
    await db.auditLog.create({ data: { action: 'REQUEST_REVISION', entityType: 'Document', entityId: id, details: `Revision demandee: ${doc.title}. Commentaire: ${validation.data.comment}`, organizationId: orgId, userId, documentId: id, ipAddress: request.headers.get('x-forwarded-for') || null, userAgent: request.headers.get('user-agent') || null } })
    return NextResponse.json({ document: updated })
  } catch (error: any) { console.error('Request revision error:', error); return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
