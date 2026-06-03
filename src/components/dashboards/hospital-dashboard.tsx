'use client'

import { StatCard, ChartCard, QuickActions, RecentList } from './dashboard-widgets'
import { FileText, Stethoscope, Users, Heart, Plus, Search, Upload } from 'lucide-react'
import { statusLabels } from '@/lib/constants'

interface HospitalDashboardProps {
  stats: {
    totalDocs?: number
    draftDocs?: number
    pendingDocs?: number
    totalUsers?: number
    labelPatients?: number
    labelConsultations?: number
    labelUrgences?: number
  }
  recentDocs?: { id: string; title: string; author?: { name: string }; status: string }[]
  docsByType?: { type: string; count: number }[]
}

export function HospitalDashboard({ stats, recentDocs = [], docsByType = [] }: HospitalDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de Bord — Hôpital</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de votre établissement médical</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Dossiers Médicaux" value={stats.totalDocs || 0} icon={FileText} description="Total des dossiers" />
        <StatCard title="Patients" value={stats.labelPatients || 0} icon={Users} description="Patients enregistrés" />
        <StatCard title="Consultations" value={stats.labelConsultations || 0} icon={Stethoscope} description="Ce mois" />
        <StatCard title="Urgences" value={stats.labelUrgences || 0} icon={Heart} description="Cas urgents" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Dossiers par service" description="Répartition par département médical">
          <div className="space-y-3">
            {docsByType.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>}
            {docsByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm">{item.type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(item.count * 20, 100)}px` }} />
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
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
          }))}
        />
      </div>

      <QuickActions
        actions={[
          { label: 'Nouveau dossier patient', icon: Plus, onClick: () => {} },
          { label: 'Recherche patient', icon: Search, onClick: () => {} },
          { label: 'Importer dossier', icon: Upload, onClick: () => {} },
        ]}
      />
    </div>
  )
}
