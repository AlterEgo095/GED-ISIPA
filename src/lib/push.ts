/**
 * Web Push utility — sends push notifications to subscribed devices.
 */
import webpush from 'web-push'
import { db } from '@/lib/db'

// Configure VAPID details
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:noreply@ged.aenews.net'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export interface PushMessage {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

/** Send a push notification to all active subscriptions of a user. */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<{
  sent: number
  failed: number
}> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured — push notifications disabled')
    return { sent: 0, failed: 0 }
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId, isActive: true },
  })

  let sent = 0
  let failed = 0

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url || '/',
    tag: message.tag || 'ged-notification',
    icon: message.icon || '/icon-192.png',
  })

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
        sent++
      } catch (error: any) {
        // If subscription is expired (410 Gone), deactivate it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          }).catch(() => {})
        }
        failed++
      }
    })
  )

  return { sent, failed }
}

/** Send push to multiple users (e.g., all users in an org). */
export async function sendPushToUsers(userIds: string[], message: PushMessage): Promise<{
  sent: number
  failed: number
}> {
  let totalSent = 0
  let totalFailed = 0
  for (const userId of userIds) {
    const result = await sendPushToUser(userId, message)
    totalSent += result.sent
    totalFailed += result.failed
  }
  return { sent: totalSent, failed: totalFailed }
}

/** Get the VAPID public key for client-side subscription. */
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || ''
}
