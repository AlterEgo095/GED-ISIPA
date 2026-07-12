import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import crypto from 'crypto'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string, { id } = await params
    const shares = await db.documentShare.findMany({ where: { documentId: id, isActive: true }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ shares })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'share')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    const body = await request.json()
    const shareType = body.shareType || 'LINK'
    const link = shareType === 'LINK' ? crypto.randomBytes(16).toString('hex') : null
    const share = await db.documentShare.create({ data: { documentId: id, sharedBy: userId, sharedWith: body.sharedWith || null, shareType, link, password: body.password || null, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null, downloadLimit: body.downloadLimit || null, permissions: body.permissions || ['READ'] } })
    await db.auditLog.create({ data: { action: 'SHARE_CREATE', entityType: 'Document', entityId: id, details: `Document partage: ${doc.title}`, organizationId: orgId, userId, documentId: id } })
    return NextResponse.json({ share }, { status: 201 })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
