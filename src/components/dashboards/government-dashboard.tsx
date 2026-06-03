'use client'

import { StatCard, ChartCard, QuickActions, RecentList } from './dashboard-widgets'
import { FileText, Landmark, ScrollText, ShieldCheck, Plus, Search, Upload } from 'lucide-react'
import { statusLabels } from '@/lib/constants'

interface GovernmentDashboardProps {
  stats: {
    totalDocs?: number
    draftDocs?: number
    pendingDocs?: number
    approvedDocs?: number
    totalUsers?: number
    labelProcedures?: number
    labelDecrets?: number
    labelArretes?: number
  }
  recentDocs?: { id: string; title: string; author?: { name: string }; status: string }[]
  docsByType?: { type: string; count: number }[]
}

export function GovernmentDashboard({ stats, recentDocs = [], docsByType = [] }: GovernmentDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de Bord — Gouvernement</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble des procédures et décrets</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Procédures" value={stats.labelProcedures || 0} icon={ScrollText} description="Procédures actives" />
        <StatCard title="Décrets" value={stats.labelDecrets || 0} icon={Landmark} description="Décrets publiés" />
        <StatCard title="Arrêtés" value={stats.labelArretes || 0} icon={FileText} description="Arrêtés en vigueur" />
        <StatCard title="Conformité" value="95%" icon={ShieldCheck} description="Taux de conformité" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Documents par ministère" description="Répartition par département">
          <div className="space-y-3">
            {docsByType.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>}
            {docsByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm">{item.type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: `${Math.min(item.count * 20, 100)}px` }} />
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <RecentList
          title="Procédures récentes"
          items={recentDocs.map((doc) => ({
            id: doc.id,
            label: doc.title,
            sublabel: doc.author?.name,
            badge: statusLabels[doc.status as keyof typeof statusLabels] || doc.status,
            badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
          }))}
        />
      </div>

      <QuickActions
        actions={[
          { label: 'Nouvelle procédure', icon: Plus, onClick: () => {} },
          { label: 'Recherche', icon: Search, onClick: () => {} },
          { label: 'Importer', icon: Upload, onClick: () => {} },
        ]}
      />
    </div>
  )
}
