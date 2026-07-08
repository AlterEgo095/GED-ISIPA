import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string
  const role = token.role as Role

  if (!hasPermission(role, 'audit', 'read')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const action = searchParams.get('action') || ''
  const entityType = searchParams.get('entityType') || ''
  const targetOrgId = searchParams.get('organizationId') || ''

  // SUPER_ADMIN can see all orgs' logs; others are scoped to their own org
  const where: Record<string, unknown> = {}
  if (role !== 'SUPER_ADMIN') {
    where.organizationId = orgId
  } else if (targetOrgId) {
    // SUPER_ADMIN can filter by specific org
    where.organizationId = targetOrgId
  }
  if (action) where.action = action
  if (entityType) where.entityType = entityType

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.auditLog.count({ where }),
  ])

  return NextResponse.json({
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
