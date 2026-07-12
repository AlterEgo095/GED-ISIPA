import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { deleteFile } from '@/lib/storage'
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(role)) return NextResponse.json({ error: 'Permission refusee: seul un administrateur peut supprimer definitivement' }, { status: 403 })
    const { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: true }, include: { versions: true } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable dans la corbeille' }, { status: 404 })
    try { await deleteFile(doc.filePath) } catch {}
    for (const v of doc.versions) { try { await deleteFile(v.filePath) } catch {} }
    await db.auditLog.create({ data: { action: 'PERMANENT_DELETE', entityType: 'Document', entityId: id, details: `Document supprime definitivement: ${doc.title} (${doc.reference})`, organizationId: orgId, userId, ipAddress: request.headers.get('x-forwarded-for') || null, userAgent: request.headers.get('user-agent') || null } })
    await db.document.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Document supprime definitivement' })
  } catch (error: any) { console.error('Permanent delete error:', error); return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
