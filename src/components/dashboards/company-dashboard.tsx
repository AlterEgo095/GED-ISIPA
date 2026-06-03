'use client'

import { StatCard, ChartCard, QuickActions, RecentList } from './dashboard-widgets'
import { FileText, Briefcase, DollarSign, Users, Plus, Search, Upload } from 'lucide-react'
import { statusLabels } from '@/lib/constants'

interface CompanyDashboardProps {
  stats: {
    totalDocs?: number
    draftDocs?: number
    approvedDocs?: number
    totalUsers?: number
    labelContrats?: number
    labelFactures?: number
    labelProjets?: number
  }
  recentDocs?: { id: string; title: string; author?: { name: string }; status: string }[]
  docsByType?: { type: string; count: number }[]
}

export function CompanyDashboard({ stats, recentDocs = [], docsByType = [] }: CompanyDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de Bord — Entreprise</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de votre espace documentaire</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Contrats" value={stats.labelContrats || 0} icon={Briefcase} description="Contrats actifs" />
        <StatCard title="Factures" value={stats.labelFactures || 0} icon={DollarSign} description="Factures émises" />
        <StatCard title="Projets" value={stats.labelProjets || 0} icon={FileText} description="Projets en cours" />
        <StatCard title="Collaborateurs" value={stats.totalUsers || 0} icon={Users} description="Utilisateurs actifs" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Documents par type" description="Répartition des documents">
          <div className="space-y-3">
            {docsByType.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>}
            {docsByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm">{item.type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(item.count * 20, 100)}px` }} />
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
            badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          }))}
        />
      </div>

      <QuickActions
        actions={[
          { label: 'Nouveau contrat', icon: Plus, onClick: () => {} },
          { label: 'Recherche', icon: Search, onClick: () => {} },
          { label: 'Importer', icon: Upload, onClick: () => {} },
        ]}
      />
    </div>
  )
}
