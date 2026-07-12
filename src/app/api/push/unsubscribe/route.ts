import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint requis' }, { status: 400 })
    }

    const userId = token.id as string

    // IDOR fix: Verify the subscription belongs to the authenticated user
    const subscription = await db.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 })
    }

    if (subscription.userId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await db.pushSubscription.update({
      where: { endpoint },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
