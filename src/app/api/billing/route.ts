import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string

  const subscription = await db.subscription.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  })

  const organization = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, status: true, trialEndsAt: true, subscriptionEndsAt: true, maxUsers: true, maxStorage: true },
  })

  const currentUsers = await db.user.count({ where: { organizationId: orgId } })

  return NextResponse.json({
    subscription,
    plan: organization?.plan,
    status: organization?.status,
    trialEndsAt: organization?.trialEndsAt,
    subscriptionEndsAt: organization?.subscriptionEndsAt,
    usage: {
      users: currentUsers,
      maxUsers: organization?.maxUsers,
      maxStorage: organization?.maxStorage,
    },
  })
}
