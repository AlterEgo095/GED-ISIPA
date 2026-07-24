'use client'

import { StatCard, ChartCard, QuickActions, RecentList } from './dashboard-widgets'
import { FileText, Scale, Users, Receipt, Plus, Search, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { statusLabels } from '@/lib/constants'

interface LawFirmDashboardProps {
  stats: {
    totalDocs?: number
    draftDocs?: number
    pendingDocs?: number
    totalUsers?: number
    labelDossiers?: number
    labelPlaidoiries?: number
    labelClients?: number
  }
  recentDocs?: { id: string; title: string; author?: { name: string }; status: string }[]
  docsByType?: { type: string; count: number }[]
}

export function LawFirmDashboard({ stats, recentDocs = [], docsByType = [] }: LawFirmDashboardProps) {
  const router = useRouter()
    return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de Bord — Cabinet Juridique</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de vos dossiers et plaidoiries</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Dossiers" value={stats.labelDossiers || 0} icon={Scale} description="Dossiers actifs" />
        <StatCard title="Plaidoiries" value={stats.labelPlaidoiries || 0} icon={FileText} description="Plaidoiries préparées" />
        <StatCard title="Clients" value={stats.labelClients || 0} icon={Users} description="Clients enregistrés" />
        <StatCard title="Facturation" value={stats.totalDocs || 0} icon={Receipt} description="Documents de facturation" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Dossiers par type" description="Répartition des dossiers juridiques">
          <div className="space-y-3">
            {docsByType.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>}
            {docsByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm">{item.type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-rose-500" style={{ width: `${Math.min(item.count * 20, 100)}px` }} />
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <RecentList
          title="Dossiers récents"
          items={recentDocs.map((doc) => ({
            id: doc.id,
            label: doc.title,
            sublabel: doc.author?.name,
            badge: statusLabels[doc.status as keyof typeof statusLabels] || doc.status,
            badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
          }))}
        />
      </div>

      <QuickActions
        actions={[
          { label: 'Nouveau dossier', icon: Plus, onClick: () => router.push('/documents/upload') },
          { label: 'Recherche client', icon: Search, onClick: () => router.push('/documents') },
          { label: 'Importer', icon: Upload, onClick: () => router.push('/documents/upload') },
        ]}
      />
    </div>
  )
}
