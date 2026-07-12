import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const status = searchParams.get('status')?.split(',').filter(Boolean) || []
    const type = searchParams.get('type')?.split(',').filter(Boolean) || []
    const classification = searchParams.get('classification')?.split(',').filter(Boolean) || []
    const authorId = searchParams.get('authorId') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const folderId = searchParams.get('folderId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    const where: any = { organizationId: orgId, isDeleted: false, isArchived: false }
    if (q) where.title = { contains: q, mode: 'insensitive' }
    if (status.length) where.status = { in: status }
    if (type.length) where.type = { in: type }
    if (classification.length) where.classification = { in: classification }
    if (authorId) where.authorId = authorId
    if (departmentId) where.departmentId = departmentId
    if (folderId) where.folderId = folderId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    if (tags.length) {
      where.tagAssignments = { some: { tag: { name: { in: tags } } } }
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        include: { author: { select: { id: true, name: true, email: true } }, department: { select: { id: true, name: true } } },
        orderBy: { [sort]: order === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.document.count({ where }),
    ])

    return NextResponse.json({ documents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) {
    console.error('Advanced search error:', error)
    return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 })
  }
}
