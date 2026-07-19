import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { createOrganizationSchema, validateBody, sanitizeString } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''

  const where: Record<string, unknown> = {}
  if (search) where.name = { contains: search }
  if (type) where.type = type
  if (status) where.status = status

  const [organizations, total] = await Promise.all([
    db.organization.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { users: true, documents: true, departments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.organization.count({ where }),
  ])

  return NextResponse.json({
    organizations,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validation = validateBody(createOrganizationSchema, body)
    if (validation.error) return validation.error

    const { name, slug, code, type, primaryColor } = validation.data


    const existing = await db.organization.findFirst({
      where: { OR: [{ slug }, { code }] },
    })
    if (existing) {
      return NextResponse.json({ error: 'Slug ou code déjà utilisé' }, { status: 409 })
    }

    const organization = await db.organization.create({
      data: {
        name,
        slug,
        code,
        type,
        primaryColor: primaryColor || '#0d9488',
        status: 'TRIAL',
        plan: 'FREE',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    await db.auditLog.create({
      data: {
        action: 'ORGANIZATION_CREATE',
        entityType: 'Organization',
        entityId: organization.id,
        details: `Organisation ${name} créée`,
        organizationId: organization.id,
        userId: token.id as string,
      },
    })

    return NextResponse.json(organization, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
