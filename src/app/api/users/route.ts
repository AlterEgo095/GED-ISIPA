import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission, getRoleLevel } from '@/lib/permissions'
import { createUserSchema, validateBody } from '@/lib/validation'
import type { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'

const SALT_ROUNDS = 12

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string
  const role = token.role as Role

  if (!hasPermission(role, 'users', 'read')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const departmentId = searchParams.get('departmentId') || ''

  const where: Record<string, unknown> = { organizationId: orgId }
  if (search) where.name = { contains: search }
  if (departmentId) where.departmentId = departmentId

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const role = token.role as Role
  if (!hasPermission(role, 'users', 'create')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validation = validateBody(createUserSchema, body)
    if (validation.error) return validation.error

    const { email, name, password, role: newRole, departmentId } = validation.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
    }

    // Role escalation guard: cannot assign a role higher than your own
    const assignedRole: Role = (newRole || 'USER') as Role
    if (getRoleLevel(assignedRole) >= getRoleLevel(role)) {
      return NextResponse.json({ error: 'Vous ne pouvez pas assigner un rôle égal ou supérieur au vôtre' }, { status: 403 })
    }

    // Hash password with bcrypt before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: assignedRole,
        organizationId: token.organizationId as string,
        departmentId: departmentId || null,
      },
      include: { organization: { select: { name: true } } },
    })

    // Send welcome email (fire-and-forget — never blocks the response)
    const orgName = user.organization?.name || 'AEIP'
    sendWelcomeEmail(user.email, user.name, orgName, password).catch((err) => {
      console.error('[users] Welcome email failed:', err)
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }, { status: 201 })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
