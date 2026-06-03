import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  if (token.role !== 'SUPER_ADMIN' && token.organizationId !== (await db.user.findUnique({ where: { id } }))?.organizationId) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
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

  // Allow self-update for basic info, admin for role changes
  if (id !== token.id && !hasPermission(role, 'users', 'update')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    
    if (body.name) data.name = body.name
    if (body.departmentId !== undefined) data.departmentId = body.departmentId || null
    
    // Only admins can change role and active status
    if (hasPermission(role, 'users', 'manage')) {
      if (body.role) data.role = body.role
      if (body.isActive !== undefined) data.isActive = body.isActive
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}
