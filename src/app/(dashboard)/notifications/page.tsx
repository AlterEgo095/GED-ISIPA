'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Record<string, any>[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      })
      .catch(() => {
        toast.error('Erreur de chargement des notifications')
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
    toast.success('Toutes les notifications marquées comme lues')
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
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-teal-600 text-white ml-1">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Vos alertes et messages</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className="btn-premium">
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="py-4"><div className="skeleton h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="empty-state-icon">
              <Inbox className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mt-2">Aucune notification</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              Vous serez notifié des actions importantes concernant vos documents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, idx) => (
            <Card
              key={notif.id as string}
              className={cn(
                "card-interactive animate-fade-in-up stagger-" + ((idx % 8) + 1),
                !notif.isRead && 'border-l-4 border-l-teal-500 bg-teal-50/30 dark:bg-teal-950/10'
              )}
              onClick={() => !notif.isRead && markRead(notif.id as string)}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div className={cn(
                  "mt-1 h-2.5 w-2.5 rounded-full shrink-0 transition-colors",
                  !notif.isRead ? 'bg-teal-500' : 'bg-transparent border border-muted-foreground/20'
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", !notif.isRead && "font-semibold")}>{notif.title as string}</p>
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