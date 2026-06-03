'use client'

import { StatCard, ChartCard, QuickActions, RecentList } from './dashboard-widgets'
import { FileText, DollarSign, Users, TrendingUp, Plus, Search, Upload } from 'lucide-react'
import { statusLabels } from '@/lib/constants'

interface SmeDashboardProps {
  stats: {
    totalDocs?: number
    draftDocs?: number
    totalUsers?: number
    labelDocuments?: number
  }
  recentDocs?: { id: string; title: string; author?: { name: string }; status: string }[]
  docsByType?: { type: string; count: number }[]
}

export function SmeDashboard({ stats, recentDocs = [], docsByType = [] }: SmeDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de Bord — PME</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de votre espace documentaire</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Documents" value={stats.totalDocs || 0} icon={FileText} description="Total des documents" />
        <StatCard title="Collaborateurs" value={stats.totalUsers || 0} icon={Users} description="Utilisateurs actifs" />
        <StatCard title="Brouillons" value={stats.draftDocs || 0} icon={TrendingUp} description="En attente" />
        <StatCard title="Finance" value={stats.labelDocuments || 0} icon={DollarSign} description="Documents financiers" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Documents par type" description="Répartition des documents">
          <div className="space-y-3">
            {docsByType.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>}
            {docsByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm">{item.type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.min(item.count * 20, 100)}px` }} />
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <RecentList
          title="Documents récents"
          items={recentDocs.map((doc) => ({
            id: doc.id,
            label: doc.title,
            sublabel: doc.author?.name,
            badge: statusLabels[doc.status as keyof typeof statusLabels] || doc.status,
            badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
          }))}
        />
      </div>

      <QuickActions
        actions={[
          { label: 'Nouveau document', icon: Plus, onClick: () => {} },
          { label: 'Recherche', icon: Search, onClick: () => {} },
          { label: 'Importer', icon: Upload, onClick: () => {} },
        ]}
      />
    </div>
  )
}
