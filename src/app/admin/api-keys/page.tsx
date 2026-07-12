'use client'

import { useState, useEffect, useCallback } from 'react'
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
  DialogTrigger,
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
import {
  Key,
  Plus,
  Trash2,
  Ban,
  Copy,
  CheckCircle2,
  Loader2,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'

// ============ TYPES ============
interface Organization {
  id: string
  name: string
  code: string
  type: string
}

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  organization: { name: string; code: string }
  scopes: string[]
  rateLimit: number
  status: string
  expiresAt: string | null
  lastUsedAt: string | null
  requestCount: number
  createdAt: string
}

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

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return formatDate(dateStr)
}

// ============ MAIN PAGE ============
export default function SuperAdminApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formOrgId, setFormOrgId] = useState('')
  const [formScopes, setFormScopes] = useState<string[]>(['read'])
  const [formRateLimit, setFormRateLimit] = useState('100')
  const [formExpiresIn, setFormExpiresIn] = useState('0')

  // Raw key dialog state
  const [rawKeyDialogOpen, setRawKeyDialogOpen] = useState(false)
  const [rawKey, setRawKey] = useState('')
  const [rawKeyName, setRawKeyName] = useState('')
  const [copied, setCopied] = useState(false)

  // Revoke confirmation dialog state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)

  // ============ FETCH DATA ============
  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/api-keys')
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setApiKeys(data.apiKeys || [])
    } catch {
      toast.error('Impossible de charger les clés API')
    }
  }, [])

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations')
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setOrganizations(data.organizations || [])
    } catch {
      toast.error('Impossible de charger les organisations')
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchApiKeys(), fetchOrganizations()]).finally(() =>
      setLoading(false)
    )
  }, [fetchApiKeys, fetchOrganizations])

  // ============ CREATE API KEY ============
  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis')
      return
    }
    if (!formOrgId) {
      toast.error('Veuillez sélectionner une organisation')
      return
    }
    if (formScopes.length === 0) {
      toast.error('Veuillez sélectionner au moins un scope')
      return
    }

    const rateLimit = parseInt(formRateLimit)
    if (isNaN(rateLimit) || rateLimit < 1) {
      toast.error('La limite de requêtes doit être un nombre positif')
      return
    }

    setCreating(true)
    try {
      const expiresInDays = formExpiresIn === '0' ? null : parseInt(formExpiresIn)
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          organizationId: formOrgId,
          scopes: formScopes,
          rateLimit,
          expiresInDays,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erreur lors de la création')
      }

      const data = await res.json()

      // Show raw key dialog
      setRawKey(data.rawKey)
      setRawKeyName(data.apiKey.name)
      setRawKeyDialogOpen(true)

      // Reset form
      setFormName('')
      setFormOrgId('')
      setFormScopes(['read'])
      setFormRateLimit('100')
      setFormExpiresIn('0')
      setCreateOpen(false)

      // Refresh list
      await fetchApiKeys()
      toast.success('Clé API créée avec succès')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  // ============ SCOPE TOGGLE ============
  const toggleScope = (scope: string) => {
    setFormScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    )
  }

  // ============ COPY RAW KEY ============
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(rawKey)
      setCopied(true)
      toast.success('Clé copiée dans le presse-papiers')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier la clé')
    }
  }

  // ============ REVOKE API KEY ============
  const handleRevoke = async (apiKey: ApiKey) => {
    setRevokeTarget(apiKey)
    setRevokeDialogOpen(true)
  }

  const confirmRevoke = async () => {
    if (!revokeTarget) return
    setRevokingId(revokeTarget.id)
    setRevokeDialogOpen(false)
    try {
      const res = await fetch(`/api/admin/api-keys/${revokeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      })
      if (!res.ok) throw new Error('Erreur lors de la révocation')
      toast.success(`Clé "${revokeTarget.name}" révoquée avec succès`)
      await fetchApiKeys()
    } catch {
      toast.error('Impossible de révoquer la clé')
    } finally {
      setRevokingId(null)
      setRevokeTarget(null)
    }
  }

  // ============ DELETE API KEY ============
  const handleDelete = (apiKey: ApiKey) => {
    setDeleteTarget(apiKey)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    setDeleteDialogOpen(false)
    try {
      const res = await fetch(`/api/admin/api-keys/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      toast.success(`Clé "${deleteTarget.name}" supprimée avec succès`)
      await fetchApiKeys()
    } catch {
      toast.error('Impossible de supprimer la clé')
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-muted-foreground">Chargement des clés API...</p>
        </div>
      </div>
    )
  }

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-purple-600" />
            Clés API
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les clés d&apos;accès API pour les organisations de la plateforme
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Créer une clé API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Nouvelle clé API
              </DialogTitle>
              <DialogDescription>
                Créez une nouvelle clé d&apos;accès pour une organisation. La clé ne sera affichée qu&apos;une seule fois après sa création.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Nom de la clé</Label>
                <Input
                  id="api-key-name"
                  placeholder="Ex: Production API Key"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              {/* Organization */}
              <div className="space-y-2">
                <Label>Organisation</Label>
                <Select value={formOrgId} onValueChange={setFormOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} ({org.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Scopes */}
              <div className="space-y-3">
                <Label>Permissions (Scopes)</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="scope-read"
                      checked={formScopes.includes('read')}
                      onCheckedChange={() => toggleScope('read')}
                    />
                    <label
                      htmlFor="scope-read"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Lecture (read) — Accès en lecture aux données
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="scope-write"
                      checked={formScopes.includes('write')}
                      onCheckedChange={() => toggleScope('write')}
                    />
                    <label
                      htmlFor="scope-write"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Écriture (write) — Création et modification des données
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="scope-admin"
                      checked={formScopes.includes('admin')}
                      onCheckedChange={() => toggleScope('admin')}
                    />
                    <label
                      htmlFor="scope-admin"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Admin (admin) — Accès complet à l&apos;administration
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Rate Limit */}
              <div className="space-y-2">
                <Label htmlFor="api-key-rate-limit">Limite de requêtes (par minute)</Label>
                <Input
                  id="api-key-rate-limit"
                  type="number"
                  min="1"
                  value={formRateLimit}
                  onChange={(e) => setFormRateLimit(e.target.value)}
                />
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label>Expiration</Label>
                <Select value={formExpiresIn} onValueChange={setFormExpiresIn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Jamais</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                    <SelectItem value="365">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Créer la clé
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total des clés</p>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
              </div>
              <Key className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clés actives</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {apiKeys.filter((k) => k.status === 'ACTIVE').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clés révoquées / expirées</p>
                <p className="text-2xl font-bold text-red-600">
                  {apiKeys.filter((k) => k.status === 'REVOKED' || k.status === 'EXPIRED').length}
                </p>
              </div>
              <Ban className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des clés API</CardTitle>
          <CardDescription>
            Toutes les clés d&apos;accès API de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Key className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Aucune clé API</p>
              <p className="text-sm text-muted-foreground mt-1">
                Créez votre première clé API pour permettre l&apos;accès externe à la plateforme
              </p>
              <Button
                className="mt-4 gap-2"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Créer une clé API
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Préfixe</TableHead>
                    <TableHead className="hidden md:table-cell">Organisation</TableHead>
                    <TableHead className="hidden lg:table-cell">Scopes</TableHead>
                    <TableHead className="hidden lg:table-cell">Limite</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden xl:table-cell">Dernière utilisation</TableHead>
                    <TableHead className="hidden xl:table-cell">Requêtes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{apiKey.name}</span>
                          <span className="text-xs text-muted-foreground md:hidden">
                            {apiKey.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {apiKey.keyPrefix}••••••
                        </code>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm">{apiKey.organization.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {apiKey.organization.code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {apiKey.scopes.map((scope) => (
                            <ScopeBadge key={scope} scope={scope} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm">{apiKey.rateLimit}/min</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={apiKey.status} />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground" title={formatDate(apiKey.lastUsedAt)}>
                          {formatRelativeDate(apiKey.lastUsedAt)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm tabular-nums">
                          {apiKey.requestCount.toLocaleString('fr-FR')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {apiKey.status === 'ACTIVE' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              onClick={() => handleRevoke(apiKey)}
                              disabled={revokingId === apiKey.id}
                              title="Révoquer"
                            >
                              {revokingId === apiKey.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleDelete(apiKey)}
                            disabled={deletingId === apiKey.id}
                            title="Supprimer"
                          >
                            {deletingId === apiKey.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Key Dialog */}
      <Dialog open={rawKeyDialogOpen} onOpenChange={setRawKeyDialogOpen}>
        <DialogContent className="sm:max-w-[550px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Shield className="h-5 w-5" />
              Clé API créée — Copiez-la maintenant !
            </DialogTitle>
            <DialogDescription>
              Cette clé ne sera plus jamais affichée. Assurez-vous de la copier et de la stocker en toute sécurité.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom de la clé</Label>
              <p className="text-sm font-medium">{rawKeyName}</p>
            </div>

            <div className="space-y-2">
              <Label>Clé API complète</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5 rounded font-mono break-all select-all">
                  {rawKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-9 gap-1.5"
                  onClick={handleCopyKey}
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

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Attention — Sécurité
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Ne partagez jamais cette clé publiquement (code source, dépôt Git, etc.). 
                    Traitez-la comme un mot de passe. Si elle est compromise, révoquez-la immédiatement 
                    et créez-en une nouvelle.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setRawKeyDialogOpen(false)
                setRawKey('')
                setRawKeyName('')
                setCopied(false)
              }}
            >
              J&apos;ai copié la clé — Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Ban className="h-5 w-5" />
              Révoquer la clé API
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir révoquer cette clé ? Cette action désactivera immédiatement 
              l&apos;accès API pour cette clé. Les applications utilisant cette clé perdront leur accès.
            </DialogDescription>
          </DialogHeader>

          {revokeTarget && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nom</span>
                <span className="text-sm font-medium">{revokeTarget.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Préfixe</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  {revokeTarget.keyPrefix}••••••
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Organisation</span>
                <span className="text-sm font-medium">{revokeTarget.organization.name}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevokeDialogOpen(false)
                setRevokeTarget(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRevoke}
            >
              <Ban className="h-4 w-4 mr-2" />
              Révoquer la clé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Supprimer la clé API
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement cette clé ? Cette action est irréversible. 
              Toutes les données associées à cette clé seront perdues.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nom</span>
                <span className="text-sm font-medium">{deleteTarget.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Préfixe</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  {deleteTarget.keyPrefix}••••••
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Organisation</span>
                <span className="text-sm font-medium">{deleteTarget.organization.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Requêtes</span>
                <span className="text-sm font-medium">{deleteTarget.requestCount.toLocaleString('fr-FR')}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteTarget(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
