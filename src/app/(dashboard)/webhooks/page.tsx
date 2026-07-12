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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'

// ============ TYPES ============
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
export default function OrgWebhooksPage() {
  const { data: session, status: sessionStatus } = useSession()
  const userRole = session?.user?.role as string | undefined
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isOrgAdmin = userRole === 'ORG_ADMIN'

  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [accessVerified, setAccessVerified] = useState(false)
  const [accessError, setAccessError] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>([])
  const [formHeaders, setFormHeaders] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' },
  ])

  // ============ VERIFY ACCESS ============
  useEffect(() => {
    async function verifyAccess() {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) {
          if (res.status === 401) {
            setAccessError('Vous devez être connecté pour accéder à cette page.')
          } else if (res.status === 403) {
            setAccessError('Permissions insuffisantes pour gérer les webhooks.')
          } else {
            setAccessError('Erreur lors de la vérification des accès.')
          }
          return
        }
        setAccessVerified(true)
      } catch {
        setAccessError('Impossible de vérifier les accès. Veuillez réessayer.')
      } finally {
        setLoading(false)
      }
    }

    if (sessionStatus !== 'loading') {
      verifyAccess()
    }
  }, [sessionStatus])

  // ============ FETCH WEBHOOKS (SUPER_ADMIN) ============
  const fetchWebhooks = useCallback(async () => {
    if (!isSuperAdmin) return
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
  }, [isSuperAdmin])

  useEffect(() => {
    if (accessVerified && isSuperAdmin) {
      fetchWebhooks()
    }
  }, [accessVerified, isSuperAdmin, fetchWebhooks])

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
    setFormName('')
    setFormUrl('')
    setFormEvents([])
    setFormHeaders([{ key: '', value: '' }])
  }

  // ============ CREATE WEBHOOK ============
  const handleCreate = async () => {
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
      setCreateOpen(false)
      resetForm()
      fetchWebhooks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  // ============ LOADING STATE ============
  if (sessionStatus === 'loading' || (loading && !accessVerified)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-teal-600" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    )
  }

  // ============ ACCESS ERROR ============
  if (accessError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="mt-2">Accès refusé</CardTitle>
            <CardDescription>{accessError}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // ============ ORG_ADMIN VIEW ============
  if (isOrgAdmin && !isSuperAdmin) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <Webhook className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
            <p className="text-sm text-muted-foreground">
              Configuration des webhooks de votre organisation
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <CardTitle className="text-base">Qu&apos;est-ce qu&apos;un webhook ?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Les webhooks permettent à votre organisation de recevoir des notifications en temps réel
                lorsque certains événements se produisent dans GED-ISIPA.
              </p>
              <p>
                Par exemple, vous pouvez être notifié automatiquement quand un document est créé,
                approuvé ou archivé, sans avoir à vérifier manuellement la plateforme.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {WEBHOOK_EVENTS.slice(0, 4).map((event) => (
                  <Badge
                    key={event.value}
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 font-medium ${EVENT_COLORS[event.value] || ''}`}
                  >
                    {event.label}
                  </Badge>
                ))}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{WEBHOOK_EVENTS.length - 4}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-base">Accès réservé</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                La configuration des webhooks est gérée par l&apos;administrateur général de la plateforme.
                En tant qu&apos;administrateur d&apos;organisation, vous pouvez demander l&apos;activation
                de webhooks pour votre structure.
              </p>
              <p>
                Contactez l&apos;administrateur général pour :
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Créer un nouveau webhook pour votre organisation</li>
                <li>Modifier les événements écoutés</li>
                <li>Modifier l&apos;URL de destination</li>
                <li>Résoudre un problème de livraison</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Contact Card */}
        <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-900/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-base">Contacter l&apos;administrateur</CardTitle>
            </div>
            <CardDescription>
              Demandez la configuration ou la modification de vos webhooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pour demander la création ou la modification d&apos;un webhook, veuillez contacter
              l&apos;administrateur général de la plateforme GED-ISIPA en lui fournissant les
              informations suivantes :
            </p>

            <div className="rounded-lg border bg-background p-4 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Informations à fournir
                </Label>
                <ul className="ml-4 list-disc space-y-1.5 text-sm">
                  <li>
                    <span className="font-medium">Nom du webhook</span> — un identifiant clair
                    (ex : « Notification documents approuvés »)
                  </li>
                  <li>
                    <span className="font-medium">URL de destination</span> — l&apos;adresse
                    HTTPS qui recevra les notifications
                  </li>
                  <li>
                    <span className="font-medium">Événements souhaités</span> — les types
                    d&apos;événements à écouter
                  </li>
                  <li>
                    <span className="font-medium">En-têtes personnalisés</span> — si votre
                    endpoint nécessite une authentification spécifique
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Événements disponibles
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {WEBHOOK_EVENTS.map((event) => (
                    <Badge
                      key={event.value}
                      variant="secondary"
                      className={`text-[10px] px-2 py-0.5 font-medium ${EVENT_COLORS[event.value] || ''}`}
                    >
                      {event.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                const subject = encodeURIComponent('Demande de configuration webhook - GED-ISIPA')
                const body = encodeURIComponent(
                  `Bonjour,\n\nJe souhaite configurer un webhook pour mon organisation.\n\nNom du webhook :\nURL de destination :\nÉvénements souhaités :\nEn-têtes personnalisés :\n\nCordialement`
                )
                window.open(`mailto:admin@ged-isipa.org?subject=${subject}&body=${body}`)
              }}
            >
              <Mail className="h-4 w-4" />
              Envoyer un courriel à l&apos;administrateur
            </Button>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comment fonctionnent les webhooks ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center gap-2 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium">1. Événement déclenché</p>
                <p className="text-xs text-muted-foreground">
                  Une action se produit dans GED-ISIPA (création, approbation…)
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-2 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm font-medium">2. Notification envoyée</p>
                <p className="text-xs text-muted-foreground">
                  GED-ISIPA envoie une requête HTTP POST à votre URL configurée
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-2 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
                  <ExternalLink className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm font-medium">3. Votre système réagit</p>
                <p className="text-xs text-muted-foreground">
                  Votre application traite la notification et exécute les actions souhaitées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============ SUPER_ADMIN VIEW ============
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
          <Button
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Créer un webhook
          </Button>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un nouveau webhook</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Nom *</Label>
                <Input
                  id="webhook-name"
                  placeholder="Ex : Notification document"
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
                {creating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
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
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-teal-600" />
                <p className="text-sm text-muted-foreground">Chargement des webhooks…</p>
              </div>
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
    </div>
  )
}
