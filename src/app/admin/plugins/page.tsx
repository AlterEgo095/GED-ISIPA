'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Boxes,
  Brain,
  Mail,
  MessageSquare,
  Cloud,
  Clock,
  Layers,
  KeyRound,
  Search,
  Download,
  Star,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────

interface Plugin {
  id: string
  key: string
  name: string
  description: string | null
  version: string
  author: string | null
  icon: string | null
  category: string
  tags: string[]
  status: string
  downloads: number
  rating: number
  totalInstallations: number
  createdAt: string
}

// ── Icon mapping ─────────────────────────────────────────────────────────────

const iconLookup: Record<string, LucideIcon> = {
  Brain,
  Mail,
  MessageSquare,
  Cloud,
  Clock,
  Layers,
  KeyRound,
}

function PluginIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Comp = (icon && iconLookup[icon]) || Boxes
  return <Comp className={className} />
}

// ── Category helpers ─────────────────────────────────────────────────────────

const categoryLabels: Record<string, string> = {
  ai: 'IA',
  integration: 'Intégrations',
  utility: 'Utilitaires',
}

const categoryColors: Record<string, string> = {
  ai: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  integration: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  utility: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
}

// ── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Note : ${rating} sur 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
      {hasHalf && <Star className="h-3.5 w-3.5 fill-amber-400/50 text-amber-400" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </span>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SuperAdminPluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // ── Fetch plugins ────────────────────────────────────────────────────────

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/plugins')
      if (!res.ok) throw new Error('Erreur lors du chargement des plugins')
      const data = await res.json()
      setPlugins(data.plugins as Plugin[])
    } catch {
      toast.error('Impossible de charger les plugins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlugins()
  }, [fetchPlugins])

  // ── Initialize builtin plugins ──────────────────────────────────────────

  const handleInitialize = async () => {
    try {
      setInitializing(true)
      const res = await fetch('/api/admin/plugins', { method: 'POST' })
      if (!res.ok) throw new Error('Erreur lors de l&apos;initialisation')
      const data = await res.json()
      toast.success(data.message || 'Plugins intégrés initialisés avec succès')
      await fetchPlugins()
    } catch {
      toast.error("Échec de l'initialisation des plugins intégrés")
    } finally {
      setInitializing(false)
    }
  }

  // ── Filtering ───────────────────────────────────────────────────────────

  const filtered = plugins.filter((p) => {
    // Category filter
    if (activeTab !== 'all' && p.category !== activeTab) return false

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      const inName = p.name.toLowerCase().includes(q)
      const inDesc = (p.description ?? '').toLowerCase().includes(q)
      const inTags = p.tags.some((t) => t.toLowerCase().includes(q))
      if (!inName && !inDesc && !inTags) return false
    }

    return true
  })

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Boxes className="h-6 w-6" />
            Plugins
          </h1>
          <p className="text-muted-foreground">
            Gérez les plugins disponibles sur la plateforme GED-ISIPA
          </p>
        </div>

        <Button
          onClick={handleInitialize}
          disabled={initializing}
          className="shrink-0"
        >
          {initializing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Initialiser les plugins intégrés
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, description ou tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
          <TabsTrigger value="integration">Intégrations</TabsTrigger>
          <TabsTrigger value="utility">Utilitaires</TabsTrigger>
        </TabsList>

        {/* Shared grid for every tab — the filtering handles visibility */}
        {['all', 'ai', 'integration', 'utility'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-28 rounded bg-muted" />
                          <div className="h-3 w-20 rounded bg-muted" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-3/4 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Boxes className="h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  Aucun plugin trouvé
                </p>
                <p className="text-sm text-muted-foreground">
                  Essayez de modifier vos critères de recherche ou initialisez les plugins intégrés.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((plugin) => (
                  <Card key={plugin.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <PluginIcon icon={plugin.icon} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base truncate">
                              {plugin.name}
                            </CardTitle>
                            <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                              v{plugin.version}
                            </Badge>
                          </div>
                          {plugin.author && (
                            <CardDescription className="truncate">
                              par {plugin.author}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-3">
                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {plugin.description || 'Aucune description disponible.'}
                      </p>

                      {/* Category badge */}
                      <div>
                        <Badge
                          className={`text-[11px] ${
                            categoryColors[plugin.category] || 'bg-muted text-muted-foreground'
                          } border-0`}
                        >
                          {categoryLabels[plugin.category] || plugin.category}
                        </Badge>
                      </div>

                      {/* Tags */}
                      {plugin.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {plugin.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" />
                          {plugin.downloads.toLocaleString('fr-FR')}
                        </span>
                        <StarRating rating={plugin.rating} />
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {plugin.totalInstallations} install.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
