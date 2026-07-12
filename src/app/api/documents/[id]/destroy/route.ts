import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { deleteFile } from '@/lib/storage'
import { z } from 'zod'
const destroySchema = z.object({ confirmation: z.string().min(1, 'La confirmation est requise') })
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'destroy')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { id } = await params
    const body = await request.json()
    const validation = destroySchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message || 'Donnees invalides' }, { status: 400 })
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    if (doc.status !== 'ARCHIVED') return NextResponse.json({ error: 'Le document doit etre archive pour etre detruit' }, { status: 400 })
    if (!doc.destructionApproved) return NextResponse.json({ error: 'La destruction doit etre approuvee au prealable' }, { status: 400 })
    if (validation.data.confirmation !== doc.reference) return NextResponse.json({ error: 'La confirmation ne correspond pas a la reference du document' }, { status: 400 })
    try { await deleteFile(doc.filePath) } catch {}
    const updated = await db.document.update({ where: { id }, data: { status: 'DESTROYED', destroyedAt: new Date(), destroyedBy: userId, filePath: '', fileSize: 0 } })
    await db.auditLog.create({ data: { action: 'DESTROY', entityType: 'Document', entityId: id, details: `Document detruit: ${doc.title} (${doc.reference})`, organizationId: orgId, userId, documentId: id, ipAddress: request.headers.get('x-forwarded-for') || null, userAgent: request.headers.get('user-agent') || null } })
    return NextResponse.json({ document: updated })
  } catch (error: any) { console.error('Destroy error:', error); return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
