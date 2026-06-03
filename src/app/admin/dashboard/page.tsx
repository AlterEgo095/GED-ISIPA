'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/dashboards/dashboard-widgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, FileText, Workflow, Loader2 } from 'lucide-react'

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/platform')
      .then(res => res.json())
      .then(data => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
  }

  const s = stats?.stats as Record<string, number> || {}
  const recentOrgs = (stats?.recentOrgs as Record<string, unknown>[]) || []
  const orgsByType = (stats?.orgsByType as Record<string, unknown>[]) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vue Plateforme</h1>
        <p className="text-muted-foreground">Statistiques globales de la plateforme AEIP</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Organisations" value={s.totalOrgs || 0} icon={Building2} description={`${s.activeOrgs || 0} actives`} />
        <StatCard title="Utilisateurs" value={s.totalUsers || 0} icon={Users} />
        <StatCard title="Documents" value={s.totalDocs || 0} icon={FileText} />
        <StatCard title="Workflows" value={s.totalWorkflows || 0} icon={Workflow} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisations par type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orgsByType.map((item) => (
              <div key={item.type as string} className="flex items-center justify-between">
                <span className="text-sm">{item.type as string}</span>
                <span className="font-medium">{item.count as number}</span>
              </div>
            ))}
            {orgsByType.length === 0 && <p className="text-sm text-muted-foreground text-center">Aucune donnée</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisations récentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrgs.map((org) => {
              const count = org._count as Record<string, number>
              return (
                <div key={org.id as string} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{org.name as string}</p>
                    <p className="text-xs text-muted-foreground">{org.code as string}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{count?.users || 0} utilisateurs</p>
                  </div>
                </div>
              )
            })}
            {recentOrgs.length === 0 && <p className="text-sm text-muted-foreground text-center">Aucune donnée</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
