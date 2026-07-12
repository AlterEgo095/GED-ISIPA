import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { seedPlanFeatures, getPlanFeatures } from '@/lib/saas/plan-features'
import type { SubscriptionPlan } from '@prisma/client'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const plan = searchParams.get('plan') as SubscriptionPlan | null

  if (plan) {
    const features = await getPlanFeatures(plan)
    return NextResponse.json({ features })
  }

  // All plans
  const allFeatures = await Promise.all([
    getPlanFeatures('FREE'),
    getPlanFeatures('STARTER'),
    getPlanFeatures('PROFESSIONAL'),
    getPlanFeatures('ENTERPRISE'),
  ])

  return NextResponse.json({
    plans: {
      FREE: allFeatures[0],
      STARTER: allFeatures[1],
      PROFESSIONAL: allFeatures[2],
      ENTERPRISE: allFeatures[3],
    },
  })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  await seedPlanFeatures()
  return NextResponse.json({ success: true, message: 'Features des plans initialisées' })
}
