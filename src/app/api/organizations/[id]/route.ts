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

  const organization = await db.organization.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, documents: true, departments: true, workflows: true, modules: true } },
      modules: true,
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  if (!organization) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  }

  return NextResponse.json(organization)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  if (token.role !== 'SUPER_ADMIN' && token.organizationId !== id) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const organization = await db.organization.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.logo !== undefined && { logo: body.logo }),
        ...(body.primaryColor && { primaryColor: body.primaryColor }),
        ...(body.accentColor !== undefined && { accentColor: body.accentColor }),
        ...(body.settings && { settings: JSON.stringify(body.settings) }),
        ...(body.status && token.role === 'SUPER_ADMIN' && { status: body.status }),
        ...(body.plan && token.role === 'SUPER_ADMIN' && { plan: body.plan }),
        ...(body.maxUsers !== undefined && token.role === 'SUPER_ADMIN' && { maxUsers: body.maxUsers }),
        ...(body.maxStorage !== undefined && token.role === 'SUPER_ADMIN' && { maxStorage: body.maxStorage }),
      },
    })

    return NextResponse.json(organization)
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id } = await params

  try {
    await db.organization.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    })

    await db.auditLog.create({
      data: {
        action: 'ORGANIZATION_SUSPEND',
        entityType: 'Organization',
        entityId: id,
        details: 'Organisation suspendue',
        organizationId: id,
        userId: token.id as string,
      },
    })

    return NextResponse.json({ message: 'Organisation suspendue' })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suspension' }, { status: 500 })
  }
}
