'use client'

import { StatCard, ChartCard, QuickActions, RecentList } from './dashboard-widgets'
import { FileText, GraduationCap, BookOpen, Users, Plus, Search, Upload } from 'lucide-react'
import { statusLabels } from '@/lib/constants'

interface UniversityDashboardProps {
  stats: {
    totalDocs?: number
    draftDocs?: number
    pendingDocs?: number
    approvedDocs?: number
    publishedDocs?: number
    totalUsers?: number
    totalDepts?: number
    labelEtudiants?: number
    labelCours?: number
    labelRecherches?: number
  }
  recentDocs?: { id: string; title: string; author?: { name: string }; status: string }[]
  docsByType?: { type: string; count: number }[]
}

export function UniversityDashboard({ stats, recentDocs = [], docsByType = [] }: UniversityDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord — Université</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de votre espace académique</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Documents Académiques" value={stats.totalDocs || 0} icon={FileText} description="Total des documents" />
        <StatCard title="Étudiants" value={stats.labelEtudiants || stats.totalUsers || 0} icon={Users} description="Utilisateurs enregistrés" />
        <StatCard title="Cours" value={stats.labelCours || 0} icon={BookOpen} description="Programmes actifs" />
        <StatCard title="Recherches" value={stats.labelRecherches || 0} icon={GraduationCap} description="Projets de recherche" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Documents par type" description="Répartition des documents académiques">
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
            href: `/documents/${doc.id}`,
          }))}
        />
      </div>

      <QuickActions
        actions={[
          { label: 'Nouveau dossier', icon: Plus, onClick: () => {} },
          { label: 'Rechercher un étudiant', icon: Search, onClick: () => {} },
          { label: 'Importer document', icon: Upload, onClick: () => {} },
        ]}
      />
    </div>
  )
}
