import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId') || null
    const folders = await db.folder.findMany({
      where: { organizationId: orgId, isDeleted: false, parentId: parentId as string | null },
      include: { _count: { select: { children: true, documents: true } } },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ folders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'create')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'Nom du dossier requis' }, { status: 400 })
    const folder = await db.folder.create({
      data: { name: body.name, description: body.description || null, parentId: body.parentId || null, organizationId: orgId, createdBy: userId, color: body.color || '#6b7280', icon: body.icon || null, order: body.order || 0 },
    })
    await db.auditLog.create({ data: { action: 'FOLDER_CREATE', entityType: 'Folder', entityId: folder.id, details: `Dossier cree: ${body.name}`, organizationId: orgId, userId } })
    return NextResponse.json({ folder }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 })
  }
}
