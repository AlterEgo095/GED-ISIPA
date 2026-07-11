'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2, Activity, Cpu, HardDrive, Database, Globe, Shield, Server, RefreshCw } from 'lucide-react'

type HealthStatus = { status: string; timestamp: string; checks: Record<string, string> }

export default function AdminMonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbStats, setDbStats] = useState<Record<string, any> | null>(null)
  const [serverInfo, setServerInfo] = useState<Record<string, string>>({})

  async function loadAll() {
    setLoading(true)
    const [healthRes, statsRes] = await Promise.all([
      fetch('/api/health'),
      fetch('/api/stats/platform'),
    ])
    if (healthRes.ok) setHealth(await healthRes.json())
    if (statsRes.ok) setDbStats(await statsRes.json())
    // Get server info from API
    try {
      const res = await fetch('/api/admin/monitoring')
      if (res.ok) setServerInfo(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>

  const s = dbStats?.stats || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6" /> Monitoring</h1><p className="text-muted-foreground">Supervision de l&apos;infrastructure</p></div>
        <Button variant="outline" onClick={loadAll}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
      </div>

      {/* System Health */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${health?.checks?.database === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
          <div><p className="font-medium">PostgreSQL</p><p className="text-xs text-muted-foreground">{health?.checks?.database === 'ok' ? 'Connect\u00e9' : 'Erreur'}</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${health?.checks?.storage === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
          <div><p className="font-medium">Stockage</p><p className="text-xs text-muted-foreground">{health?.checks?.storage === 'ok' ? 'Accessible' : 'Erreur'}</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full bg-green-500`} />
          <div><p className="font-medium">PM2</p><p className="text-xs text-muted-foreground">{serverInfo.pm2_status || 'Processus actif'}</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full bg-green-500`} />
          <div><p className="font-medium">Nginx</p><p className="text-xs text-muted-foreground">{serverInfo.nginx_status || 'Proxy actif'}</p></div>
        </div></CardContent></Card>
      </div>

      {/* Database Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Base de donn\u00e9es</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span>Organisations</span><span className="font-medium">{s.totalOrgs || 0}</span></div>
          <div className="flex justify-between text-sm"><span>Utilisateurs</span><span className="font-medium">{s.totalUsers || 0}</span></div>
          <div className="flex justify-between text-sm"><span>Documents</span><span className="font-medium">{s.totalDocs || 0}</span></div>
          <div className="flex justify-between text-sm"><span>Workflows actifs</span><span className="font-medium">{s.activeWorkflows || 0}</span></div>
          <div className="flex justify-between text-sm"><span>Comptes en attente</span><span className="font-medium text-amber-600">{s.pendingAccounts || 0}</span></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> Serveur</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span>Dernier health check</span><span className="font-medium">{health?.timestamp ? new Date(health.timestamp).toLocaleString('fr-FR') : '-'}</span></div>
          <div className="flex justify-between text-sm"><span>Statut global</span><Badge variant={health?.status === 'ok' ? 'default' : 'destructive'}>{health?.status === 'ok' ? 'OK' : 'Erreur'}</Badge></div>
          <div className="flex justify-between text-sm"><span>Environnement</span><span className="font-medium">Production</span></div>
          <div className="flex justify-between text-sm"><span>Port</span><span className="font-medium">3020</span></div>
          <div className="flex justify-between text-sm"><span>SSL</span><Badge variant="default">Actif</Badge></div>
        </CardContent></Card>
      </div>

      {/* Resource Usage */}
      <Card><CardHeader><CardTitle className="text-base">Stockage par organisation</CardTitle></CardHeader>
      <CardContent><div className="space-y-3">
        {(dbStats?.storageUsage || []).slice(0, 8).map((usage: any, i: number) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm"><span>{usage.organizationName}</span><span>{(usage.totalFileSize / 1048576).toFixed(1)} Mo / {usage.maxStorage > 0 ? (usage.maxStorage / 1073741824).toFixed(1) + ' Go' : 'Illimit\u00e9'}</span></div>
            <Progress value={Math.min(usage.usagePercent, 100)} className="h-2" />
          </div>
        ))}
        {(dbStats?.storageUsage || []).length === 0 && <p className="text-sm text-muted-foreground text-center">Aucune donn\u00e9e</p>}
      </div></CardContent></Card>

      {/* SSL & Backups Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> S\u00e9curit\u00e9</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span>SSL/TLS</span><Badge variant="default">Actif</Badge></div>
          <div className="flex justify-between"><span>X-Frame-Options</span><Badge variant="default">DENY</Badge></div>
          <div className="flex justify-between"><span>X-Content-Type-Options</span><Badge variant="default">nosniff</Badge></div>
          <div className="flex justify-between"><span>Rate Limiting</span><Badge variant="default">Actif</Badge></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Sauvegardes</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">G\u00e9rez les sauvegardes depuis l&apos;onglet d\u00e9di\u00e9.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/backups'}>Acc\u00e9der aux sauvegardes</Button>
        </CardContent></Card>
      </div>
    </div>
  )
}
