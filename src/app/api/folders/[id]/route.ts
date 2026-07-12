import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'update')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { id } = await params
    const folder = await db.folder.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!folder) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
    const body = await request.json()
    const updated = await db.folder.update({ where: { id }, data: { name: body.name || folder.name, description: body.description !== undefined ? body.description : folder.description, color: body.color || folder.color, icon: body.icon !== undefined ? body.icon : folder.icon, order: body.order !== undefined ? body.order : folder.order, parentId: body.parentId !== undefined ? body.parentId : folder.parentId } })
    await db.auditLog.create({ data: { action: 'FOLDER_MOVE', entityType: 'Folder', entityId: id, details: `Dossier modifie: ${updated.name}`, organizationId: orgId, userId } })
    return NextResponse.json({ folder: updated })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'delete')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { id } = await params
    const folder = await db.folder.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!folder) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
    await db.folder.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
