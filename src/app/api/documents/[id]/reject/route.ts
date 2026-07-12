import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'
const rejectSchema = z.object({ reason: z.string().min(1, 'La raison du rejet est requise').max(500) })
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'reject')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { id } = await params
    const body = await request.json()
    const validation = rejectSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message || 'Donnees invalides' }, { status: 400 })
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    if (!['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(doc.status)) return NextResponse.json({ error: 'Le document doit etre en attente de revision ou approbation pour etre rejete' }, { status: 400 })
    const updated = await db.document.update({ where: { id }, data: { status: 'REJECTED', rejectedBy: userId, rejectedAt: new Date(), rejectionReason: validation.data.reason } })
    await db.auditLog.create({ data: { action: 'REJECT', entityType: 'Document', entityId: id, details: `Document rejetee: ${doc.title}. Raison: ${validation.data.reason}`, organizationId: orgId, userId, documentId: id, ipAddress: request.headers.get('x-forwarded-for') || null, userAgent: request.headers.get('user-agent') || null } })
    return NextResponse.json({ document: updated })
  } catch (error: any) { console.error('Reject error:', error); return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
