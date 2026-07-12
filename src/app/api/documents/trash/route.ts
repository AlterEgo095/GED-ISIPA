import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string
    if (!hasPermission(role as any, 'documents', 'delete')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1'), limit = parseInt(searchParams.get('limit') || '20'), search = searchParams.get('search') || ''
    const where: any = { organizationId: orgId, isDeleted: true, ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}) }
    const [documents, total] = await Promise.all([
      db.document.findMany({ where, include: { author: { select: { id: true, name: true, email: true } }, department: { select: { id: true, name: true } } }, orderBy: { deletedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.document.count({ where }),
    ])
    return NextResponse.json({ documents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) { console.error('Trash list error:', error); return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
