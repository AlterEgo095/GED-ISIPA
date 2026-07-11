'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Settings, Save, Mail, Shield, Server, Bell, Key, Wrench } from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => { setSettings(d || {}); setLoading(false) })
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
      if (res.ok) setSaved(true)
      else { const d = await res.json(); alert(d.error || 'Erreur') }
    } finally { setSaving(false) }
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Param\u00e8tres</h1><p className="text-muted-foreground">Configuration globale de la plateforme</p></div>
        <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}{saved ? 'Sauvegard\u00e9 !' : 'Sauvegarder'}</Button>
      </div>

      <Tabs defaultValue="smtp">
        <TabsList>
          <TabsTrigger value="smtp"><Mail className="h-4 w-4 mr-1" />SMTP</TabsTrigger>
          <TabsTrigger value="auth"><Shield className="h-4 w-4 mr-1" />Auth</TabsTrigger>
          <TabsTrigger value="platform"><Server className="h-4 w-4 mr-1" />Plateforme</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" />Notifications</TabsTrigger>
          <TabsTrigger value="api"><Key className="h-4 w-4 mr-1" />API</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 mr-1" />Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Configuration SMTP</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>H\u00f4te SMTP</Label><Input value={settings.smtp_host || ''} onChange={e => updateSetting('smtp_host', e.target.value)} placeholder="smtp.example.com" /></div>
            <div><Label>Port</Label><Input value={settings.smtp_port || '587'} onChange={e => updateSetting('smtp_port', e.target.value)} /></div>
            <div><Label>Utilisateur</Label><Input value={settings.smtp_user || ''} onChange={e => updateSetting('smtp_user', e.target.value)} /></div>
            <div><Label>Mot de passe</Label><Input type="password" value={settings.smtp_pass || ''} onChange={e => updateSetting('smtp_pass', e.target.value)} /></div>
            <div><Label>Adresse d&apos;envoi</Label><Input value={settings.smtp_from || ''} onChange={e => updateSetting('smtp_from', e.target.value)} placeholder="noreply@example.com" /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Authentification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Dur\u00e9e session JWT (heures)</Label><Input type="number" value={settings.jwt_max_age_hours || '24'} onChange={e => updateSetting('jwt_max_age_hours', e.target.value)} /></div>
            <div><Label>Inscription ouverte</Label><Input value={settings.registration_open || 'true'} onChange={e => updateSetting('registration_open', e.target.value)} placeholder="true/false" /></div>
            <div><Label>Validation compte requise</Label><Input value={settings.account_validation_required || 'true'} onChange={e => updateSetting('account_validation_required', e.target.value)} /></div>
            <div><Label>Longueur minimale mot de passe</Label><Input type="number" value={settings.min_password_length || '8'} onChange={e => updateSetting('min_password_length', e.target.value)} /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="platform" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Plateforme</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nom de la plateforme</Label><Input value={settings.platform_name || 'AEIP'} onChange={e => updateSetting('platform_name', e.target.value)} /></div>
            <div><Label>URL</Label><Input value={settings.platform_url || ''} onChange={e => updateSetting('platform_url', e.target.value)} /></div>
            <div><Label>Limite de d\u00e9bit (requ\u00eates/min)</Label><Input type="number" value={settings.global_rate_limit || '100'} onChange={e => updateSetting('global_rate_limit', e.target.value)} /></div>
            <div><Label>Taille max upload (Mo)</Label><Input type="number" value={settings.max_upload_size_mb || '50'} onChange={e => updateSetting('max_upload_size_mb', e.target.value)} /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Notifications email</Label><Input value={settings.email_notifications_enabled || 'true'} onChange={e => updateSetting('email_notifications_enabled', e.target.value)} /></div>
            <div><Label>Notifications in-app</Label><Input value={settings.in_app_notifications_enabled || 'true'} onChange={e => updateSetting('in_app_notifications_enabled', e.target.value)} /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Cl\u00e9s API</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Cl\u00e9 API publique</Label><Input value={settings.api_public_key || ''} onChange={e => updateSetting('api_public_key', e.target.value)} /></div>
            <div><Label>Cl\u00e9 API secr\u00e8te</Label><Input type="password" value={settings.api_secret_key || ''} onChange={e => updateSetting('api_secret_key', e.target.value)} /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Maintenance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Mode maintenance</Label><Input value={settings.maintenance_enabled || 'false'} onChange={e => updateSetting('maintenance_enabled', e.target.value)} placeholder="true/false" /></div>
            <div><Label>Message de maintenance</Label><Input value={settings.maintenance_message || ''} onChange={e => updateSetting('maintenance_message', e.target.value)} placeholder="Plateforme en maintenance..." /></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
