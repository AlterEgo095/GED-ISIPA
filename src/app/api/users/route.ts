import { NextResponse } from 'next/server'
import { db, dbTransaction } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission, getRoleLevel, isSuperAdmin } from '@/lib/permissions'
import { createUserSchema, validateBody } from '@/lib/validation'
import type { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'

const SALT_ROUNDS = 12

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const role = token.role as Role
  const isPlatformAdm = token.isPlatformAdmin as boolean

  if (!hasPermission(role, 'users', 'read')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const departmentId = searchParams.get('departmentId') || ''
  const organizationId = searchParams.get('organizationId') || ''
  const accountStatus = searchParams.get('accountStatus') || ''

  // SUPER_ADMIN / isPlatformAdmin can see ALL users across ALL orgs
  // Other users see only their org
  const where: Record<string, unknown> = {}
  if (isPlatformAdm || isSuperAdmin(role)) {
    // Platform admin: can filter by org or see all
    if (organizationId) where.organizationId = organizationId
  } else {
    where.organizationId = token.organizationId as string
  }
  if (search) where.name = { contains: search }
  if (departmentId) where.departmentId = departmentId
  if (accountStatus) where.accountStatus = accountStatus

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
        isPlatformAdmin: true,
        accountStatus: true,
        emailVerified: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, code: true, type: true } },
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
  if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const role = token.role as Role
  const isPlatformAdm = token.isPlatformAdmin as boolean

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
      return NextResponse.json({ error: 'Email deja utilise' }, { status: 409 })
    }

    // Role escalation guard: cannot assign a role higher than your own
    // SUPER_ADMIN/isPlatformAdmin CAN assign any role including SUPER_ADMIN
    const assignedRole: Role = (newRole || 'USER') as Role
    if (!isPlatformAdm && !isSuperAdmin(role)) {
      if (getRoleLevel(assignedRole) >= getRoleLevel(role)) {
        return NextResponse.json({ error: 'Vous ne pouvez pas assigner un role egal ou superieur au votre' }, { status: 403 })
      }
    }

    // Hash password with bcrypt before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Determine organizationId — platform admin can create in any org
    const targetOrgId = isPlatformAdm ? (body.organizationId || token.organizationId) : token.organizationId as string

    const user = await dbTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: assignedRole,
          organizationId: targetOrgId,
          departmentId: departmentId || null,
          accountStatus: isPlatformAdm ? 'ACTIVE' : 'PENDING_VALIDATION',
          emailVerified: isPlatformAdm ? true : false,
        },
        include: { organization: { select: { name: true } } },
      })

      await tx.auditLog.create({
        data: {
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: user.id,
          details: `Created by ${token.email as string}. Role: ${assignedRole}`,
          organizationId: targetOrgId,
          userId: token.id as string,
        },
      })

      return user
    })

    // Send welcome email (fire-and-forget)
    const orgName = user.organization?.name || 'AEIP'
    sendWelcomeEmail(user.email, user.name, orgName, password).catch((err) => {
      console.error('[users] Welcome email failed:', err)
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      accountStatus: user.accountStatus,
    }, { status: 201 })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la creation' }, { status: 500 })
  }
}
