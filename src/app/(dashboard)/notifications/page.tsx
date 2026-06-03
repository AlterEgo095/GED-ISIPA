'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      })
      .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge>{unreadCount} non lues</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Vos alertes et messages</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune notification</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id as string}
              className={`cursor-pointer transition-colors ${!notif.isRead ? 'border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/20' : ''}`}
              onClick={() => !notif.isRead && markRead(notif.id as string)}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div className={`h-2 w-2 mt-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-teal-500' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notif.title as string}</p>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message as string}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notif.createdAt as string).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
