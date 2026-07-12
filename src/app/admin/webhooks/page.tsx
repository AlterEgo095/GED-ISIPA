'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Webhook,
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Zap,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

// ============ TYPES ============
interface Organization {
  id: string
  name: string
  code: string
}

interface WebhookItem {
  id: string
  name: string
  url: string
  events: string[]
  headers: string
  status: string
  lastTriggeredAt: string | null
  failureCount: number
  successCount: number
  totalDeliveries: number
  organization: { name: string; code: string }
  createdAt: string
}

// ============ CONSTANTS ============
const WEBHOOK_EVENTS = [
  { value: 'DOCUMENT_CREATED', label: 'Document créé' },
  { value: 'DOCUMENT_UPDATED', label: 'Document mis à jour' },
  { value: 'DOCUMENT_APPROVED', label: 'Document approuvé' },
  { value: 'DOCUMENT_ARCHIVED', label: 'Document archivé' },
  { value: 'WORKFLOW_COMPLETED', label: 'Workflow terminé' },
  { value: 'USER_CREATED', label: 'Utilisateur créé' },
  { value: 'USER_DEACTIVATED', label: 'Utilisateur désactivé' },
  { value: 'SUBSCRIPTION_CHANGED', label: 'Abonnement modifié' },
  { value: 'AI_PROCESS_COMPLETED', label: 'Processus IA terminé' },
] as const

const EVENT_COLORS: Record<string, string> = {
  DOCUMENT_CREATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DOCUMENT_UPDATED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DOCUMENT_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DOCUMENT_ARCHIVED: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400',
  WORKFLOW_COMPLETED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  USER_CREATED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  USER_DEACTIVATED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  SUBSCRIPTION_CHANGED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  AI_PROCESS_COMPLETED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

// ============ STATUS BADGE ============
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    ACTIVE: {
      label: 'Actif',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    PAUSED: {
      label: 'En pause',
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: <Clock className="h-3 w-3" />,
    },
    FAILED: {
      label: 'En erreur',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: <XCircle className="h-3 w-3" />,
    },
  }

  const c = config[status] || config.ACTIVE

  return (
    <Badge variant="secondary" className={`gap-1 font-medium ${c.className}`}>
      {c.icon}
      {c.label}
    </Badge>
  )
}

// ============ FORMAT DATE ============
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============ MAIN PAGE ============
export default function WebhooksManagementPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [secretOpen, setSecretOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<{ name: string; secret: string } | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form state
  const [formOrgId, setFormOrgId] = useState('')
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>([])
  const [formHeaders, setFormHeaders] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' },
  ])

  // ============ FETCH DATA ============
  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/webhooks')
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setWebhooks(data.webhooks || [])
    } catch {
      toast.error('Impossible de charger les webhooks')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations?limit=100')
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setOrganizations(data.organizations || [])
    } catch {
      toast.error('Impossible de charger les organisations')
    }
  }, [])

  useEffect(() => {
    fetchWebhooks()
    fetchOrganizations()
  }, [fetchWebhooks, fetchOrganizations])

  // ============ STATS ============
  const totalWebhooks = webhooks.length
  const activeWebhooks = webhooks.filter((w) => w.status === 'ACTIVE').length
  const failedWebhooks = webhooks.filter((w) => w.status === 'FAILED').length
  const totalDeliveries = webhooks.reduce((acc, w) => acc + w.totalDeliveries, 0)

  // ============ EVENT TOGGLE ============
  const toggleEvent = (eventValue: string) => {
    setFormEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue]
    )
  }

  // ============ HEADER ROW HANDLERS ============
  const addHeaderRow = () => {
    setFormHeaders([...formHeaders, { key: '', value: '' }])
  }

  const removeHeaderRow = (index: number) => {
    if (formHeaders.length <= 1) return
    setFormHeaders(formHeaders.filter((_, i) => i !== index))
  }

  const updateHeaderRow = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...formHeaders]
    updated[index][field] = val
    setFormHeaders(updated)
  }

  // ============ RESET FORM ============
  const resetForm = () => {
    setFormOrgId('')
    setFormName('')
    setFormUrl('')
    setFormEvents([])
    setFormHeaders([{ key: '', value: '' }])
  }

  // ============ CREATE WEBHOOK ============
  const handleCreate = async () => {
    if (!formOrgId) {
      toast.error('Veuillez sélectionner une organisation')
      return
    }
    if (!formName.trim()) {
      toast.error('Veuillez saisir un nom')
      return
    }
    if (!formUrl.trim()) {
      toast.error('Veuillez saisir une URL')
      return
    }
    if (formEvents.length === 0) {
      toast.error('Veuillez sélectionner au moins un événement')
      return
    }

    // Build headers object
    const headersObj: Record<string, string> = {}
    for (const h of formHeaders) {
      if (h.key.trim() && h.value.trim()) {
        headersObj[h.key.trim()] = h.value.trim()
      }
    }

    try {
      setCreating(true)
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: formOrgId,
          name: formName.trim(),
          url: formUrl.trim(),
          events: formEvents,
          headers: headersObj,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      toast.success(`Webhook "${data.webhook.name}" créé avec succès`)
      setCreatedSecret({ name: data.webhook.name, secret: data.webhook.secret })
      setCreateOpen(false)
      setSecretOpen(true)
      resetForm()
      fetchWebhooks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  // ============ COPY SECRET ============
  const copySecret = async () => {
    if (!createdSecret) return
    try {
      await navigator.clipboard.writeText(createdSecret.secret)
      setCopied(true)
      toast.success('Secret copié dans le presse-papiers')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier le secret')
    }
  }

  // ============ RENDER ============
  return (
    <div className="space-y-6 p-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <Webhook className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
            <p className="text-sm text-muted-foreground">
              Gérez les webhooks pour recevoir des notifications en temps réel sur les événements de la plateforme
            </p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="h-4 w-4" />
              Créer un webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un nouveau webhook</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Organization */}
              <div className="space-y-2">
                <Label htmlFor="org-select">Organisation *</Label>
                <Select value={formOrgId} onValueChange={setFormOrgId}>
                  <SelectTrigger id="org-select">
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

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Nom *</Label>
                <Input
                  id="webhook-name"
                  placeholder="Ex: Notification document"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL de destination *</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://exemple.com/webhook"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
              </div>

              <Separator />

              {/* Events */}
              <div className="space-y-3">
                <Label>Événements *</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`event-${event.value}`}
                        checked={formEvents.includes(event.value)}
                        onCheckedChange={() => toggleEvent(event.value)}
                      />
                      <label
                        htmlFor={`event-${event.value}`}
                        className="text-sm leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Headers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>En-têtes personnalisés</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={addHeaderRow}
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-2">
                  {formHeaders.map((header, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Clé"
                        value={header.key}
                        onChange={(e) => updateHeaderRow(index, 'key', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Valeur"
                        value={header.value}
                        onChange={(e) => updateHeaderRow(index, 'value', e.target.value)}
                        className="flex-1"
                      />
                      {formHeaders.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => removeHeaderRow(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>
                Annuler
              </Button>
              <Button
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer le webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total webhooks
            </CardTitle>
            <Webhook className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWebhooks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actifs
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeWebhooks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En erreur
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{failedWebhooks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Livraisons totales
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries.toLocaleString('fr-FR')}</div>
          </CardContent>
        </Card>
      </div>

      {/* ===== WEBHOOKS TABLE ===== */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                Aucun webhook configuré
              </p>
              <p className="text-xs text-muted-foreground">
                Créez votre premier webhook pour recevoir des notifications en temps réel
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Événements</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Succès/Échec</TableHead>
                    <TableHead>Dernier déclenchement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((wh) => (
                    <TableRow key={wh.id}>
                      {/* Name */}
                      <TableCell className="font-medium max-w-[180px]">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{wh.name}</span>
                        </div>
                      </TableCell>

                      {/* URL */}
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-sm text-muted-foreground">{wh.url}</span>
                          <a
                            href={wh.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-teal-600 transition-colors" />
                          </a>
                        </div>
                      </TableCell>

                      {/* Organization */}
                      <TableCell>
                        <span className="text-sm">{wh.organization.name}</span>
                        <span className="ml-1 text-xs text-muted-foreground">({wh.organization.code})</span>
                      </TableCell>

                      {/* Events */}
                      <TableCell>
                        <div className="flex max-w-[260px] flex-wrap gap-1">
                          {wh.events.slice(0, 3).map((event) => (
                            <Badge
                              key={event}
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 font-medium ${EVENT_COLORS[event] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}
                            >
                              {WEBHOOK_EVENTS.find((e) => e.value === event)?.label || event}
                            </Badge>
                          ))}
                          {wh.events.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              +{wh.events.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={wh.status} />
                      </TableCell>

                      {/* Success/Failure */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="text-green-600 dark:text-green-400">
                            {wh.successCount}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600 dark:text-red-400">
                            {wh.failureCount}
                          </span>
                        </div>
                      </TableCell>

                      {/* Last Triggered */}
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(wh.lastTriggeredAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-teal-600">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== SECRET DIALOG ===== */}
      <Dialog open={secretOpen} onOpenChange={setSecretOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Secret du webhook
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Warning */}
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  Attention : ce secret ne sera plus jamais affiché
                </p>
                <p className="mt-1 text-amber-700 dark:text-amber-400">
                  Copiez-le maintenant et stockez-le en lieu sûr. Vous en aurez besoin pour vérifier la signature des webhooks entrants.
                </p>
              </div>
            </div>

            {/* Webhook name */}
            <div>
              <Label className="text-muted-foreground">Webhook</Label>
              <p className="font-medium">{createdSecret?.name}</p>
            </div>

            {/* Secret value */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Secret</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
                  {createdSecret?.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={copySecret}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => setSecretOpen(false)}
            >
              J&apos;ai copié le secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
