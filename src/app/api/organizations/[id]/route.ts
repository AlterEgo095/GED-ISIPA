import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { planPricing } from '@/lib/constants'
import type { SubscriptionPlan } from '@prisma/client'

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
      modules: { orderBy: { moduleKey: 'asc' } },
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 10 },
      users: {
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, department: { select: { id: true, name: true } } },
        take: 100,
        orderBy: { createdAt: 'desc' },
      },
      departments: { orderBy: { name: 'asc' } },
      auditLogs: {
        select: { id: true, action: true, entityType: true, entityId: true, details: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
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
    const updateData: Record<string, unknown> = {}
    const auditMessages: string[] = []

    // Basic fields
    if (body.name) { updateData.name = body.name; auditMessages.push('nom modifié vers "' + body.name + '"') }
    if (body.slug) { updateData.slug = body.slug; auditMessages.push('slug modifié vers "' + body.slug + '"') }
    if (body.logo !== undefined) { updateData.logo = body.logo; auditMessages.push('logo modifié') }
    if (body.primaryColor) { updateData.primaryColor = body.primaryColor; auditMessages.push('couleur primaire modifiée vers "' + body.primaryColor + '"') }
    if (body.accentColor !== undefined) { updateData.accentColor = body.accentColor; auditMessages.push("couleur d'accent modifiée") }
    if (body.settings) { updateData.settings = body.settings; auditMessages.push('paramètres modifiés') }

    // Status change (SUPER_ADMIN only)
    if (body.status && token.role === 'SUPER_ADMIN') {
      const prev = await db.organization.findUnique({ where: { id }, select: { status: true, plan: true } })
      updateData.status = body.status
      auditMessages.push('statut modifié de "' + (prev?.status || 'N/A') + '" vers "' + body.status + '"')
      // If setting TRIAL, set trialEndsAt if not already set
      if (body.status === 'TRIAL' && !body.trialEndsAt) {
        updateData.trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }

    // Plan change (SUPER_ADMIN only) — auto-update quotas
    if (body.plan && token.role === 'SUPER_ADMIN') {
      const prev = await db.organization.findUnique({ where: { id }, select: { plan: true, status: true } })
      updateData.plan = body.plan
      auditMessages.push('plan modifié de "' + (prev?.plan || 'N/A') + '" vers "' + body.plan + '"')
      // Auto-update quotas from planPricing
      const planKey = body.plan as SubscriptionPlan
      const pricing = planPricing[planKey]
      if (pricing) {
        if (body.maxUsers === undefined) updateData.maxUsers = pricing.maxUsers
        if (body.maxStorage === undefined) updateData.maxStorage = pricing.maxStorage
        // Create subscription record
        await db.subscription.create({
          data: {
            organizationId: id,
            plan: planKey,
            status: body.status === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            amount: pricing.price,
            currency: 'USD',
          },
        })
      }
      // If moving from TRIAL to a paid plan, set status to ACTIVE
      if (prev?.status === 'TRIAL' && body.plan !== 'FREE' && !body.status) {
        updateData.status = 'ACTIVE'
        auditMessages.push('statut passé à ACTIF suite au changement de plan')
      }
    }

    // Explicit quota overrides (SUPER_ADMIN only)
    if (body.maxUsers !== undefined && token.role === 'SUPER_ADMIN') {
      updateData.maxUsers = body.maxUsers
      if (!auditMessages.some(m => m.includes('maxUsers') || m.includes('plan modifié'))) {
        auditMessages.push('maxUsers modifié vers ' + body.maxUsers)
      }
    }
    if (body.maxStorage !== undefined && token.role === 'SUPER_ADMIN') {
      updateData.maxStorage = body.maxStorage
      if (!auditMessages.some(m => m.includes('maxStorage') || m.includes('plan modifié'))) {
        auditMessages.push('maxStorage modifié vers ' + body.maxStorage)
      }
    }

    // Trial/subscription dates
    if (body.trialEndsAt) { updateData.trialEndsAt = new Date(body.trialEndsAt) }
    if (body.subscriptionEndsAt) { updateData.subscriptionEndsAt = new Date(body.subscriptionEndsAt) }

    const organization = await db.organization.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    if (auditMessages.length > 0 && token.id) {
      await db.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'Organization',
          entityId: id,
          details: 'Organisation mise à jour: ' + auditMessages.join(', '),
          organizationId: id,
          userId: token.id as string,
        },
      })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('[PUT /api/organizations/[id]]', error)
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
