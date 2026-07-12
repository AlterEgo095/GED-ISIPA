import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  const integrations = await db.externalIntegration.findMany({
    include: { organization: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ integrations: integrations.map(i => ({
    id: i.id,
    type: i.type,
    name: i.name,
    status: i.status,
    lastSyncAt: i.lastSyncAt,
    errorMessage: i.errorMessage,
    organization: i.organization,
    createdAt: i.createdAt,
  })) })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { organizationId, type, name, config } = body
    
    if (!organizationId || !type || !name) {
      return NextResponse.json({ error: 'Organisation, type et nom requis' }, { status: 400 })
    }
    
    const integration = await db.externalIntegration.create({
      data: {
        organizationId,
        type,
        name,
        config: JSON.stringify(config || {}),
        status: 'PENDING',
      },
    })
    
    return NextResponse.json({ success: true, integration })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Intégration de ce type déjà existante' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
