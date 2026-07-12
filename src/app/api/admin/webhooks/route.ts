import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { logAdminAction, getClientInfo } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  const webhooks = await db.webhook.findMany({
    include: { 
      organization: { select: { name: true, code: true } },
      _count: { select: { deliveries: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ webhooks: webhooks.map(w => ({
    id: w.id,
    name: w.name,
    url: w.url,
    events: JSON.parse(w.events || '[]'),
    headers: Object.keys(JSON.parse(w.headers || '{}')).length > 0 ? 'Configuré' : 'Aucun',
    status: w.status,
    lastTriggeredAt: w.lastTriggeredAt,
    failureCount: w.failureCount,
    successCount: w.successCount,
    totalDeliveries: w._count.deliveries,
    organization: w.organization,
    createdAt: w.createdAt,
  })) })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { organizationId, name, url, events, headers } = body
    
    if (!organizationId || !name || !url || !events?.length) {
      return NextResponse.json({ error: 'Organisation, nom, URL et événements requis' }, { status: 400 })
    }
    
    const crypto = await import('crypto')
    const secret = crypto.randomBytes(32).toString('hex')
    
    const webhook = await db.webhook.create({
      data: {
        organizationId,
        name,
        url,
        secret,
        events: JSON.stringify(events),
        headers: JSON.stringify(headers || {}),
      },
    })
    
    const clientInfo = getClientInfo(request)
    await logAdminAction({
      action: 'WEBHOOK_FIRE',
      entityType: 'Webhook',
      entityId: webhook.id,
      details: `Webhook "${webhook.name}" créé`,
      organizationId: webhook.organizationId || (token.organizationId as string),
      userId: token.id as string,
      ...clientInfo,
    })

    return NextResponse.json({ success: true, webhook: { id: webhook.id, name: webhook.name, secret } })
  } catch (error) {
    console.error('Webhook creation error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
