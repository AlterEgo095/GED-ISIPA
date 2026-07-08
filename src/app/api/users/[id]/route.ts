import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission, getRoleLevel } from '@/lib/permissions'
import type { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  // Check org isolation for non-SUPER_ADMIN
  if (token.role !== 'SUPER_ADMIN') {
    const targetUser = await db.user.findUnique({ where: { id }, select: { organizationId: true } })
    if (!targetUser || targetUser.organizationId !== token.organizationId) {
      // Return 404 instead of 403 to prevent user enumeration across orgs
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }
  }

  const user = await db.user.findUnique({
    where: { id },
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
  })

  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const role = token.role as Role

  // Check org isolation: target user must belong to same org (unless SUPER_ADMIN)
  if (role !== 'SUPER_ADMIN') {
    const targetUser = await db.user.findUnique({ where: { id }, select: { organizationId: true } })
    if (!targetUser || targetUser.organizationId !== token.organizationId) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }
  }

  // Allow self-update for basic info, admin for role changes
  if (id !== token.id && !hasPermission(role, 'users', 'update')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name) data.name = body.name
    if (body.departmentId !== undefined) data.departmentId = body.departmentId || null

    // Password change support
    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
      }
      data.password = await bcrypt.hash(body.password, SALT_ROUNDS)
    }

    // Only admins can change role and active status
    if (hasPermission(role, 'users', 'manage')) {
      if (body.role) {
        // Role escalation guard: cannot assign a role equal to or higher than your own level
        const targetRole = body.role as Role
        if (getRoleLevel(targetRole) >= getRoleLevel(role)) {
          return NextResponse.json({ error: 'Vous ne pouvez pas assigner un rôle égal ou supérieur au vôtre' }, { status: 403 })
        }
        data.role = targetRole
      }
      if (body.isActive !== undefined) data.isActive = body.isActive
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const role = token.role as Role

  if (!hasPermission(role, 'users', 'delete')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  // Org isolation check
  if (role !== 'SUPER_ADMIN') {
    const targetUser = await db.user.findUnique({ where: { id }, select: { organizationId: true } })
    if (!targetUser || targetUser.organizationId !== token.organizationId) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }
  }

  try {
    // Soft delete: deactivate instead of removing
    const user = await db.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, name: true, isActive: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('User deactivation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la désactivation' }, { status: 500 })
  }
}
