import { db } from '@/lib/db'
import { createHmac } from 'crypto'
import type { WebhookEvent } from '@prisma/client'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
  organizationId: string
}

export async function fireWebhooks(organizationId: string, event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
  const webhooks = await db.webhook.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      events: { contains: event },
    },
  })
  
  for (const webhook of webhooks) {
    await deliverWebhook(webhook.id, webhook.url, webhook.secret, webhook.headers, {
      event,
      timestamp: new Date().toISOString(),
      data,
      organizationId,
    })
  }
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  customHeaders: string,
  payload: WebhookPayload
): Promise<void> {
  const startTime = Date.now()
  const body = JSON.stringify(payload)
  
  // Sign payload with HMAC
  const signature = createHmac('sha256', secret).update(body).digest('hex')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-GED-Signature': `sha256=${signature}`,
    'X-GED-Event': payload.event,
    'X-GED-Delivery': webhookId,
    ...JSON.parse(customHeaders || '{}'),
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    })
    
    const responseTimeMs = Date.now() - startTime
    const responseBody = await response.text().catch(() => '')
    
    await db.webhookDelivery.create({
      data: {
        webhookId,
        event: payload.event,
        payload: body,
        responseCode: response.status,
        responseBody: responseBody.substring(0, 5000),
        responseTimeMs,
        isSuccess: response.status >= 200 && response.status < 300,
      },
    })
    
    // Update webhook stats
    if (response.status >= 200 && response.status < 300) {
      await db.webhook.update({
        where: { id: webhookId },
        data: {
          lastTriggeredAt: new Date(),
          successCount: { increment: 1 },
          failureCount: 0,
        },
      })
    } else {
      const webhook = await db.webhook.findUnique({ where: { id: webhookId } })
      const newFailureCount = (webhook?.failureCount || 0) + 1
      
      await db.webhook.update({
        where: { id: webhookId },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: newFailureCount,
          status: newFailureCount >= 10 ? 'FAILED' : 'ACTIVE',
        },
      })
    }
  } catch (error: any) {
    await db.webhookDelivery.create({
      data: {
        webhookId,
        event: payload.event,
        payload: body,
        isSuccess: false,
        error: error.message,
        responseTimeMs: Date.now() - startTime,
      },
    })
    
    const webhook = await db.webhook.findUnique({ where: { id: webhookId } })
    const newFailureCount = (webhook?.failureCount || 0) + 1
    await db.webhook.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: newFailureCount,
        status: newFailureCount >= 10 ? 'FAILED' : 'ACTIVE',
      },
    })
  }
}
