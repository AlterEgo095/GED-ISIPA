import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'delete')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: true } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable dans la corbeille' }, { status: 404 })
    const updated = await db.document.update({ where: { id }, data: { isDeleted: false, deletedAt: null, deletedBy: null } })
    await db.auditLog.create({ data: { action: 'RESTORE_DELETED', entityType: 'Document', entityId: id, details: `Document restaure depuis la corbeille: ${doc.title}`, organizationId: orgId, userId, documentId: id, ipAddress: request.headers.get('x-forwarded-for') || null, userAgent: request.headers.get('user-agent') || null } })
    return NextResponse.json({ document: updated })
  } catch (error: any) { console.error('Restore deleted error:', error); return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
