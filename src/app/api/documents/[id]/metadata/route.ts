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
    const metadata = await db.documentMetadata.findMany({ where: { documentId: id }, orderBy: { category: 'asc' } })
    return NextResponse.json({ metadata })
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
    if (!body.key || body.value === undefined) return NextResponse.json({ error: 'Cle et valeur requises' }, { status: 400 })
    const meta = await db.documentMetadata.upsert({ where: { documentId_key: { documentId: id, key: body.key } }, update: { value: String(body.value), type: body.type || 'TEXT', category: body.category || null }, create: { documentId: id, key: body.key, value: String(body.value), type: body.type || 'TEXT', required: body.required || false, category: body.category || null } })
    await db.auditLog.create({ data: { action: 'METADATA_UPDATE', entityType: 'Document', entityId: id, details: `Metadonnee mise a jour: ${body.key}`, organizationId: orgId, userId, documentId: id } })
    return NextResponse.json({ metadata: meta })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
