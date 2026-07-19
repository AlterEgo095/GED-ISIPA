'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Smartphone, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { haptic } from '@/lib/haptics'

export function PushNotificationSettings() {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    haptic('light')
    try {
      if (isSubscribed) {
        const ok = await unsubscribe()
        if (ok) toast.success('Notifications push désactivées')
        else toast.error('Erreur lors de la désactivation')
      } else {
        const ok = await subscribe()
        if (ok) toast.success('Notifications push activées')
        else toast.error('Erreur: autorisation refusée ou non supportée')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setLoading(true)
    haptic('medium')
    try {
      const res = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test GED-ISIPA',
          body: 'Ceci est une notification de test.',
          url: '/notifications',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Notification envoyée (${data.sent} reçue(s), ${data.failed} échouée(s))`)
      } else {
        toast.error('Erreur lors de l\'envoi du test')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold">Notifications push</h3>
            <p className="text-sm text-muted-foreground">
              Les notifications push ne sont pas supportées par ce navigateur.
              Installez l'application pour activer cette fonctionnalité.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/50">
            <Bell className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold flex items-center gap-2">
              Notifications push
              {isSubscribed && (
                <Badge variant="default" className="bg-teal-600">Actif</Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              Recevez des notifications push sur cet appareil pour les nouveaux documents,
              validations et alertes.
            </p>
          </div>
        </div>
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
      </div>

      {isSubscribed && (
        <div className="flex items-center gap-3 pt-3 border-t">
          <Button onClick={handleTest} variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
            Envoyer un test
          </Button>
          <span className="text-xs text-muted-foreground">
            Permission: {permission === 'granted' ? '✓ accordée' : permission}
          </span>
        </div>
      )}
    </Card>
  )
}
