import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { validateBody, createDepartmentSchema } from '@/lib/validation'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string

  const departments = await db.department.findMany({
    where: { organizationId: orgId, isDeleted: false },
    include: { _count: { select: { users: true, documents: true } } },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(departments)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const role = token.role as Role
  if (!hasPermission(role, 'departments', 'create')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const validation = validateBody(createDepartmentSchema, body)
    if (validation.error) return validation.error
    const { name, code, description } = validation.data

    const department = await db.department.create({
      data: {
        name,
        code,
        description: description || null,
        organizationId: token.organizationId as string,
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
