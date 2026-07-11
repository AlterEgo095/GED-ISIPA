import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  if (token.role !== 'SUPER_ADMIN' && token.organizationId !== id) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where: { organizationId: id, isDeleted: false },
      select: {
        id: true, title: true, type: true, status: true, classification: true,
        createdAt: true, updatedAt: true, version: true,
        author: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.document.count({ where: { organizationId: id, isDeleted: false } }),
  ])

  // Stats
  const stats = await db.document.groupBy({
    by: ['status'],
    where: { organizationId: id, isDeleted: false },
    _count: { status: true },
  })

  return NextResponse.json({ documents, stats, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}
