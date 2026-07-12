'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Key,
  Plus,
  Trash2,
  Ban,
  Copy,
  CheckCircle2,
  Loader2,
  Shield,
  BookOpen,
  Activity,
  ArrowRight,
  Lock,
  Zap,
  Code2,
  Terminal,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

// ============ TYPES ============
interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  rateLimit: number
  status: string
  expiresAt: string | null
  lastUsedAt: string | null
  requestCount: number
  createdAt: string
}

interface UsageData {
  apiCalls: number
  documentUploads: number
  aiOcrCalls: number
  aiChatCalls: number
  aiClassificationCalls: number
  storageUsed: number
}

// ============ PLAN CONFIG ============
const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuit',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professionnel',
  ENTERPRISE: 'Entreprise',
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  STARTER: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800',
  PROFESSIONAL: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  ENTERPRISE: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
}

const SCOPE_OPTIONS = [
  { value: 'read', label: 'Lecture', description: 'Accès en lecture aux documents et données' },
  { value: 'write', label: 'Écriture', description: 'Création et modification de documents' },
  { value: 'admin', label: 'Administration', description: 'Accès complet incluant la gestion' },
]

// ============ STATUS BADGE ============
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
          Actif
        </Badge>
      )
    case 'REVOKED':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">
          Révoqué
        </Badge>
      )
    case 'EXPIRED':
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800">
          Expiré
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

// ============ SCOPE BADGE ============
function ScopeBadge({ scope }: { scope: string }) {
  const scopeConfig: Record<string, { label: string; className: string }> = {
    read: {
      label: 'Lecture',
      className: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800',
    },
    write: {
      label: 'Écriture',
      className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800',
    },
    admin: {
      label: 'Admin',
      className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
    },
  }

  const config = scopeConfig[scope] || {
    label: scope,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  }

  return (
    <Badge className={`text-[10px] px-1.5 py-0 ${config.className}`}>
      {config.label}
    </Badge>
  )
}

// ============ DATE FORMATTING ============
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return formatDate(dateStr)
}

// ============ MAIN PAGE ============
export default function ApiKeysPage() {
  const { data: session } = useSession()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hasApiAccess, setHasApiAccess] = useState(false)
  const [plan, setPlan] = useState<string>('FREE')
  const [orgName, setOrgName] = useState<string>('')
  const [usage, setUsage] = useState<UsageData | null>(null)

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formScopes, setFormScopes] = useState<string[]>(['read'])
  const [formExpiresIn, setFormExpiresIn] = useState('0')

  // Raw key dialog state
  const [rawKeyDialogOpen, setRawKeyDialogOpen] = useState(false)
  const [rawKey, setRawKey] = useState('')
  const [rawKeyName, setRawKeyName] = useState('')
  const [copied, setCopied] = useState(false)

  // Revoke confirmation dialog
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)

  // ============ FETCH DATA ============
  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/api-keys')
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setApiKeys(data.apiKeys || [])
      setHasApiAccess(data.hasApiAccess ?? false)
      setPlan(data.plan || 'FREE')
      setOrgName(data.organization?.name || '')
    } catch {
      toast.error('Impossible de charger les clés API')
    }
  }, [])

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/billing')
      if (!res.ok) return
      // billing returns org info; we also try admin usage with org filter
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchApiKeys(), fetchUsage()]).finally(() =>
      setLoading(false)
    )
  }, [fetchApiKeys, fetchUsage])

  // ============ CREATE API KEY ============
  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis')
      return
    }
    if (formScopes.length === 0) {
      toast.error('Veuillez sélectionner au moins une permission')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          scopes: formScopes,
          expiresInDays: parseInt(formExpiresIn) || 0,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la création')
        return
      }

      toast.success('Clé API créée avec succès')
      setCreateOpen(false)
      setFormName('')
      setFormScopes(['read'])
      setFormExpiresIn('0')

      // Show raw key dialog
      setRawKey(data.rawKey)
      setRawKeyName(data.apiKey.name)
      setRawKeyDialogOpen(true)
      setCopied(false)

      fetchApiKeys()
    } catch {
      toast.error('Erreur lors de la création de la clé API')
    } finally {
      setCreating(false)
    }
  }

  // ============ REVOKE API KEY ============
  const handleRevoke = async (key: ApiKey) => {
    setRevokingId(key.id)
    try {
      const res = await fetch(`/api/api-keys/${key.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la révocation')
        return
      }
      toast.success(`Clé "${key.name}" révoquée`)
      fetchApiKeys()
    } catch {
      toast.error('Erreur lors de la révocation')
    } finally {
      setRevokingId(null)
      setRevokeDialogOpen(false)
      setRevokeTarget(null)
    }
  }

  // ============ ACTIVATE API KEY ============
  const handleActivate = async (key: ApiKey) => {
    try {
      const res = await fetch(`/api/api-keys/${key.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'activation")
        return
      }
      toast.success(`Clé "${key.name}" activée`)
      fetchApiKeys()
    } catch {
      toast.error("Erreur lors de l'activation")
    }
  }

  // ============ DELETE API KEY ============
  const handleDelete = async (key: ApiKey) => {
    setDeletingId(key.id)
    try {
      const res = await fetch(`/api/api-keys/${key.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la suppression')
        return
      }
      toast.success(`Clé "${key.name}" supprimée`)
      fetchApiKeys()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ============ COPY RAW KEY ============
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(rawKey)
      setCopied(true)
      toast.success('Clé copiée dans le presse-papier')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('Impossible de copier la clé')
    }
  }

  // ============ TOGGLE SCOPE ============
  const toggleScope = (scope: string) => {
    if (scope === 'admin') {
      setFormScopes(['admin'])
      return
    }
    if (formScopes.includes('admin')) {
      setFormScopes([scope])
      return
    }
    setFormScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    )
  }

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeKeys = apiKeys.filter(k => k.status === 'ACTIVE').length
  const totalRequests = apiKeys.reduce((sum, k) => sum + k.requestCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-teal-600" />
            Accès API
          </h1>
          <p className="text-muted-foreground">
            Gérez les clés API de votre organisation — {orgName}
          </p>
        </div>
        {hasApiAccess && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle clé API
          </Button>
        )}
      </div>

      {/* Plan Status Card */}
      <Card className={hasApiAccess ? 'border-emerald-200 dark:border-emerald-800' : 'border-amber-200 dark:border-amber-800'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className={`h-5 w-5 ${hasApiAccess ? 'text-emerald-600' : 'text-amber-600'}`} />
            Statut de votre plan
          </CardTitle>
          <CardDescription>
            Fonctionnalités API disponibles selon votre abonnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Badge className={`text-sm px-3 py-1 ${PLAN_COLORS[plan] || PLAN_COLORS.FREE}`}>
              {PLAN_LABELS[plan] || plan}
            </Badge>
            {hasApiAccess ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Accès API inclus dans votre plan</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Accès API non disponible avec le plan Gratuit</span>
              </div>
            )}
          </div>

          {!hasApiAccess && (
            <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Mise à niveau requise
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Pour accéder à l&apos;API GED-ISIPA, passez au plan Starter ou supérieur.
                    Vous bénéficierez de clés API, d&apos;une documentation complète et d&apos;un quota adapté.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                    <ArrowRight className="h-3 w-3" />
                    Voir les offres
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {hasApiAccess && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                  <Key className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clés actives</p>
                  <p className="text-2xl font-bold">{activeKeys}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requêtes totales</p>
                  <p className="text-2xl font-bold">{totalRequests.toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/40">
                  <Shield className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total clés</p>
                  <p className="text-2xl font-bold">{apiKeys.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs: Keys / Documentation / Usage */}
      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Clés API</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Documentation</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisation</span>
          </TabsTrigger>
        </TabsList>

        {/* === KEYS TAB === */}
        <TabsContent value="keys" className="space-y-4">
          {!hasApiAccess ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Accès API verrouillé</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Les clés API sont disponibles à partir du plan Starter.
                    Mettez à niveau votre abonnement pour accéder à l&apos;API GED-ISIPA.
                  </p>
                  <Button variant="outline" className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Demander l&apos;accès API
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-teal-100 dark:bg-teal-900/40">
                    <Key className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Aucune clé API</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Créez votre première clé API pour accéder à l&apos;API GED-ISIPA
                    depuis vos applications externes.
                  </p>
                  <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer une clé API
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Vos clés API</CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchApiKeys} className="gap-1">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Préfixe</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernière utilisation</TableHead>
                        <TableHead>Requêtes</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {key.keyPrefix}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {key.scopes.map(scope => (
                                <ScopeBadge key={scope} scope={scope} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={key.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatRelativeDate(key.lastUsedAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {key.requestCount.toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {key.expiresAt ? formatDate(key.expiresAt) : 'Jamais'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {key.status === 'ACTIVE' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setRevokeTarget(key)
                                    setRevokeDialogOpen(true)
                                  }}
                                  disabled={revokingId === key.id}
                                  className="h-8 gap-1 text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                >
                                  {revokingId === key.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Ban className="h-3.5 w-3.5" />
                                  )}
                                  <span className="hidden sm:inline">Révoquer</span>
                                </Button>
                              )}
                              {key.status === 'REVOKED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleActivate(key)}
                                  className="h-8 gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Activer</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget(key)
                                  setDeleteDialogOpen(true)
                                }}
                                disabled={deletingId === key.id}
                                className="h-8 gap-1 text-red-700 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                              >
                                {deletingId === key.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                <span className="hidden sm:inline">Supprimer</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === DOCUMENTATION TAB === */}
        <TabsContent value="docs" className="space-y-4">
          {/* Base URL & Auth */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-teal-600" />
                Configuration de base
              </CardTitle>
              <CardDescription>
                Informations essentielles pour se connecter à l&apos;API GED-ISIPA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">URL de base</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono">
                    https://ged.aenews.net/api/v1
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText('https://ged.aenews.net/api/v1')
                      toast.success('URL copiée')
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Authentification</Label>
                <p className="text-sm text-muted-foreground">
                  Toutes les requêtes API nécessitent un en-tête Authorization avec votre clé API Bearer.
                </p>
                <div className="bg-muted rounded-md p-3">
                  <pre className="text-sm font-mono overflow-x-auto">
                    <code>
{`Authorization: Bearer ged_votre_cle_api_ici`}
                    </code>
                  </pre>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Format des réponses</Label>
                <p className="text-sm text-muted-foreground">
                  L&apos;API renvoie des réponses au format JSON. Toutes les dates sont au format ISO 8601.
                </p>
                <div className="bg-muted rounded-md p-3">
                  <pre className="text-sm font-mono overflow-x-auto">
                    <code>
{`Content-Type: application/json
Accept: application/json`}
                    </code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-teal-600" />
                Endpoints disponibles
              </CardTitle>
              <CardDescription>
                Liste des endpoints accessibles via l&apos;API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  method: 'GET',
                  path: '/documents',
                  description: 'Liste des documents de l\'organisation',
                  scope: 'read',
                },
                {
                  method: 'GET',
                  path: '/documents/:id',
                  description: 'Détails d\'un document spécifique',
                  scope: 'read',
                },
                {
                  method: 'POST',
                  path: '/documents',
                  description: 'Créer un nouveau document',
                  scope: 'write',
                },
                {
                  method: 'GET',
                  path: '/search',
                  description: 'Recherche sémantique dans les documents',
                  scope: 'read',
                },
                {
                  method: 'GET',
                  path: '/organizations',
                  description: 'Informations sur l\'organisation',
                  scope: 'read',
                },
                {
                  method: 'GET',
                  path: '/stats',
                  description: 'Statistiques d\'utilisation',
                  scope: 'read',
                },
              ].map((endpoint, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border bg-background"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      className={`text-[10px] px-2 py-0.5 font-mono shrink-0 ${
                        endpoint.method === 'GET'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800'
                      }`}
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono text-foreground truncate">
                      {endpoint.path}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <span className="text-sm text-muted-foreground hidden md:inline">
                      {endpoint.description}
                    </span>
                    <ScopeBadge scope={endpoint.scope} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Example curl commands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-teal-600" />
                Exemples de requêtes
              </CardTitle>
              <CardDescription>
                Exemples concrets avec curl pour démarrer rapidement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Badge className="text-[10px] px-2 py-0.5 font-mono bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
                    GET
                  </Badge>
                  Lister les documents
                </Label>
                <div className="bg-muted rounded-md p-3 relative group">
                  <pre className="text-sm font-mono overflow-x-auto">
                    <code>{`curl -X GET "https://ged.aenews.net/api/v1/documents" \\
  -H "Authorization: Bearer ged_votre_cle_api" \\
  -H "Accept: application/json"`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `curl -X GET "https://ged.aenews.net/api/v1/documents" \\\n  -H "Authorization: Bearer ged_votre_cle_api" \\\n  -H "Accept: application/json"`
                      )
                      toast.success('Commande copiée')
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Badge className="text-[10px] px-2 py-0.5 font-mono bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
                    GET
                  </Badge>
                  Rechercher des documents
                </Label>
                <div className="bg-muted rounded-md p-3 relative group">
                  <pre className="text-sm font-mono overflow-x-auto">
                    <code>{`curl -X GET "https://ged.aenews.net/api/v1/search?q=contrat&limit=10" \\
  -H "Authorization: Bearer ged_votre_cle_api" \\
  -H "Accept: application/json"`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `curl -X GET "https://ged.aenews.net/api/v1/search?q=contrat&limit=10" \\\n  -H "Authorization: Bearer ged_votre_cle_api" \\\n  -H "Accept: application/json"`
                      )
                      toast.success('Commande copiée')
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Badge className="text-[10px] px-2 py-0.5 font-mono bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800">
                    POST
                  </Badge>
                  Créer un document
                </Label>
                <div className="bg-muted rounded-md p-3 relative group">
                  <pre className="text-sm font-mono overflow-x-auto">
                    <code>{`curl -X POST "https://ged.aenews.net/api/v1/documents" \\
  -H "Authorization: Bearer ged_votre_cle_api" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Nouveau contrat", "type": "CONTRACT"}'`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `curl -X POST "https://ged.aenews.net/api/v1/documents" \\\n  -H "Authorization: Bearer ged_votre_cle_api" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title": "Nouveau contrat", "type": "CONTRACT"}'`
                      )
                      toast.success('Commande copiée')
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Badge className="text-[10px] px-2 py-0.5 font-mono bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
                    GET
                  </Badge>
                  Statistiques d&apos;utilisation
                </Label>
                <div className="bg-muted rounded-md p-3 relative group">
                  <pre className="text-sm font-mono overflow-x-auto">
                    <code>{`curl -X GET "https://ged.aenews.net/api/v1/stats" \\
  -H "Authorization: Bearer ged_votre_cle_api" \\
  -H "Accept: application/json"`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `curl -X GET "https://ged.aenews.net/api/v1/stats" \\\n  -H "Authorization: Bearer ged_votre_cle_api" \\\n  -H "Accept: application/json"`
                      )
                      toast.success('Commande copiée')
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error codes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Codes d&apos;erreur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { code: '200', label: 'OK', description: 'Requête réussie' },
                  { code: '400', label: 'Bad Request', description: 'Paramètres invalides' },
                  { code: '401', label: 'Unauthorized', description: 'Clé API manquante ou invalide' },
                  { code: '403', label: 'Forbidden', description: 'Permissions insuffisantes' },
                  { code: '404', label: 'Not Found', description: 'Ressource introuvable' },
                  { code: '429', label: 'Too Many Requests', description: 'Limite de requêtes atteinte' },
                  { code: '500', label: 'Server Error', description: 'Erreur interne du serveur' },
                ].map(err => (
                  <div key={err.code} className="flex items-center gap-3 py-1.5">
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded w-12 text-center shrink-0">
                      {err.code}
                    </code>
                    <span className="text-sm font-medium min-w-[140px]">{err.label}</span>
                    <span className="text-sm text-muted-foreground">{err.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === USAGE TAB === */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                Utilisation ce mois
              </CardTitle>
              <CardDescription>
                Consommation de votre quota API pour le mois en cours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  label: 'Appels API',
                  current: totalRequests,
                  max: plan === 'ENTERPRISE' ? -1 : plan === 'PROFESSIONAL' ? 10000 : plan === 'STARTER' ? 1000 : 100,
                  unit: 'req',
                  color: 'bg-teal-500',
                },
                {
                  label: 'Clés API actives',
                  current: activeKeys,
                  max: plan === 'ENTERPRISE' ? -1 : plan === 'PROFESSIONAL' ? 10 : plan === 'STARTER' ? 2 : 0,
                  unit: 'clés',
                  color: 'bg-emerald-500',
                },
              ].map((item, i) => {
                const isUnlimited = item.max === -1
                const percentage = isUnlimited ? 0 : item.max > 0 ? Math.min((item.current / item.max) * 100, 100) : 0
                const isNearLimit = !isUnlimited && percentage >= 80
                const isAtLimit = !isUnlimited && percentage >= 100

                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{item.label}</Label>
                      <span className={`text-sm font-mono ${
                        isAtLimit ? 'text-red-600 dark:text-red-400' :
                        isNearLimit ? 'text-amber-600 dark:text-amber-400' :
                        'text-muted-foreground'
                      }`}>
                        {item.current.toLocaleString('fr-FR')} / {isUnlimited ? 'Illimité' : `${item.max.toLocaleString('fr-FR')} ${item.unit}`}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <Progress
                        value={percentage}
                        className={`h-2 ${isAtLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
                      />
                    )}
                    {isUnlimited && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: '15%' }} />
                      </div>
                    )}
                  </div>
                )
              })}

              <Separator />

              {/* Per-key usage breakdown */}
              {apiKeys.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Utilisation par clé</Label>
                  <div className="space-y-2">
                    {apiKeys.map(key => (
                      <div key={key.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-2 min-w-0">
                          <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{key.name}</span>
                          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">
                            {key.keyPrefix}...
                          </code>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={key.status} />
                          <span className="text-sm font-mono text-muted-foreground">
                            {key.requestCount.toLocaleString('fr-FR')} req
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rate limits info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Limites de requêtes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Limite par minute</p>
                    <p className="text-xs text-muted-foreground">Par clé API</p>
                  </div>
                  <Badge className="text-sm px-3 py-1 bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800">
                    {plan === 'ENTERPRISE' ? 'Illimité' : plan === 'PROFESSIONAL' ? '300/min' : plan === 'STARTER' ? '60/min' : '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Quota mensuel</p>
                    <p className="text-xs text-muted-foreground">Appels API par organisation</p>
                  </div>
                  <Badge className="text-sm px-3 py-1 bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800">
                    {plan === 'ENTERPRISE' ? 'Illimité' : plan === 'PROFESSIONAL' ? '10 000' : plan === 'STARTER' ? '1 000' : '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Taille maximale de requête</p>
                    <p className="text-xs text-muted-foreground">Upload de documents</p>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    10 MB
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ CREATE DIALOG ============ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nouvelle clé API
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle clé API pour accéder à l&apos;API GED-ISIPA.
              La clé ne sera affichée qu&apos;une seule fois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Nom de la clé</Label>
              <Input
                id="key-name"
                placeholder="Ex: Application mobile, Intégration CRM..."
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Choisissez un nom descriptif pour identifier cette clé
              </p>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {SCOPE_OPTIONS.map(scope => (
                  <div key={scope.value} className="flex items-start gap-2">
                    <Checkbox
                      id={`scope-${scope.value}`}
                      checked={formScopes.includes(scope.value)}
                      onCheckedChange={() => toggleScope(scope.value)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor={`scope-${scope.value}`} className="text-sm font-medium cursor-pointer">
                        {scope.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {scope.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Durée de validité</Label>
              <Select value={formExpiresIn} onValueChange={setFormExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sans expiration</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                  <SelectItem value="180">180 jours</SelectItem>
                  <SelectItem value="365">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer la clé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ RAW KEY DIALOG ============ */}
      <Dialog open={rawKeyDialogOpen} onOpenChange={setRawKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-teal-600" />
              Clé API créée
            </DialogTitle>
            <DialogDescription>
              Copiez votre clé API maintenant. Elle ne sera plus jamais affichée.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <p className="text-sm font-medium">{rawKeyName}</p>
            </div>

            <div className="space-y-2">
              <Label>Clé API</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-md p-3 overflow-x-auto">
                  <code className="text-sm font-mono break-all">{rawKey}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyKey}
                  className="shrink-0 gap-1"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Conservez cette clé en lieu sûr. Si vous la perdez, vous devrez en créer une nouvelle.
                  Ne partagez jamais votre clé API publiquement.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setRawKeyDialogOpen(false)}>
              J&apos;ai copié la clé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ REVOKE CONFIRMATION DIALOG ============ */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-amber-600" />
              Révoquer la clé API
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir révoquer cette clé ? Les applications qui l&apos;utilisent perdront immédiatement l&apos;accès.
            </DialogDescription>
          </DialogHeader>

          {revokeTarget && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">{revokeTarget.name}</p>
              <code className="text-xs font-mono">{revokeTarget.keyPrefix}...</code>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeTarget && handleRevoke(revokeTarget)}
              disabled={!!revokingId}
              className="gap-2"
            >
              {revokingId && <Loader2 className="h-4 w-4 animate-spin" />}
              Révoquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DELETE CONFIRMATION DIALOG ============ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Supprimer la clé API
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La clé sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">{deleteTarget.name}</p>
              <code className="text-xs font-mono">{deleteTarget.keyPrefix}...</code>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={!!deletingId}
              className="gap-2"
            >
              {deletingId && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
