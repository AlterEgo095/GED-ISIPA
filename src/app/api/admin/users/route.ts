import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import type { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createUserSchema, validateBody, sanitizeString } from '@/lib/validation'

const SALT_ROUNDS = 12

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const isActive = searchParams.get('isActive') || ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (role) where.role = role
  if (isActive !== '') where.isActive = isActive === 'true'

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        organization: { select: { id: true, name: true, code: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.count({ where }),
  ])

  // Compute stats
  const [totalUsers, activeUsers, superAdmins, recentUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { role: 'SUPER_ADMIN' } }),
    db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
  ])

  return NextResponse.json({
    users,
    stats: { totalUsers, activeUsers, superAdmins, recentUsers },
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
    
    // Validate with Zod schema (includes role enum validation + XSS sanitize)
    const validation = validateBody(createUserSchema, body)
    if (validation.error) return validation.error

    const { name, email, password, role, organizationId } = validation.data

    // Verify sanitized name is not empty
    if (!sanitizeString(name)) {
      return NextResponse.json({ error: 'Le nom est invalide après nettoyage' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await db.user.create({
      data: { name, email, password: hashedPassword, role, organizationId },
      include: { organization: { select: { name: true, code: true } } },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
