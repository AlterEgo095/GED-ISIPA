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
import { Separator } from '@/components/ui/separator'
import {
  Puzzle,
  MessageSquare,
  Mail,
  Cloud,
  HardDrive,
  Globe,
  Lock,
  Shield,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

// ============ TYPES ============
interface Organization {
  id: string
  name: string
  code: string
  type: string
}

interface Integration {
  id: string
  type: IntegrationType
  name: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING'
  lastSyncAt: string | null
  errorMessage: string | null
  organization: { name: string; code: string }
  createdAt: string
}

type IntegrationType =
  | 'SLACK'
  | 'EMAIL_SMTP'
  | 'S3_STORAGE'
  | 'GOOGLE_DRIVE'
  | 'ONEDRIVE'
  | 'WEBDAV'
  | 'LDAP'
  | 'SAML_SSO'

// ============ INTEGRATION TYPE CONFIG ============
const INTEGRATION_TYPES: Record<
  IntegrationType,
  {
    label: string
    description: string
    icon: React.ElementType
    available: boolean
    color: string
  }
> = {
  SLACK: {
    label: 'Slack',
    description: 'Notifications et alertes via Slack',
    icon: MessageSquare,
    available: true,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300',
  },
  EMAIL_SMTP: {
    label: 'Email SMTP',
    description: 'Envoi d\'emails via serveur SMTP',
    icon: Mail,
    available: true,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300',
  },
  S3_STORAGE: {
    label: 'Amazon S3',
    description: 'Stockage de fichiers sur Amazon S3',
    icon: Cloud,
    available: true,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300',
  },
  GOOGLE_DRIVE: {
    label: 'Google Drive',
    description: 'Synchronisation avec Google Drive',
    icon: HardDrive,
    available: true,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  ONEDRIVE: {
    label: 'OneDrive',
    description: 'Intégration Microsoft OneDrive',
    icon: Cloud,
    available: true,
    color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300',
  },
  WEBDAV: {
    label: 'WebDAV',
    description: 'Connexion via protocole WebDAV',
    icon: Globe,
    available: true,
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300',
  },
  LDAP: {
    label: 'LDAP',
    description: 'Authentification et annuaire LDAP',
    icon: Lock,
    available: true,
    color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300',
  },
  SAML_SSO: {
    label: 'SAML SSO',
    description: 'Authentification unique SAML 2.0',
    icon: Shield,
    available: true,
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
}

// ============ CONFIG FIELDS PER TYPE ============
const CONFIG_FIELDS: Record<
  IntegrationType,
  { key: string; label: string; type: string; placeholder: string }[]
> = {
  SLACK: [
    { key: 'webhookUrl', label: 'URL du Webhook', type: 'url', placeholder: 'https://hooks.slack.com/services/...' },
    { key: 'channel', label: 'Canal', type: 'text', placeholder: '#general' },
  ],
  EMAIL_SMTP: [
    { key: 'host', label: 'Hôte SMTP', type: 'text', placeholder: 'smtp.example.com' },
    { key: 'port', label: 'Port', type: 'text', placeholder: '587' },
    { key: 'user', label: 'Utilisateur', type: 'text', placeholder: 'user@example.com' },
    { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
    { key: 'fromEmail', label: 'Email d\'expédition', type: 'email', placeholder: 'noreply@example.com' },
  ],
  S3_STORAGE: [
    { key: 'bucket', label: 'Bucket', type: 'text', placeholder: 'mon-bucket-ged' },
    { key: 'region', label: 'Région', type: 'text', placeholder: 'eu-west-1' },
    { key: 'accessKey', label: 'Clé d\'accès', type: 'text', placeholder: 'AKIA...' },
    { key: 'secretKey', label: 'Clé secrète', type: 'password', placeholder: '••••••••' },
  ],
  GOOGLE_DRIVE: [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'xxxx.apps.googleusercontent.com' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: '••••••••' },
    { key: 'folderId', label: 'ID du dossier', type: 'text', placeholder: '1aBc...xYz' },
  ],
  ONEDRIVE: [
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: '••••••••' },
    { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx' },
  ],
  WEBDAV: [
    { key: 'serverUrl', label: 'URL du serveur', type: 'url', placeholder: 'https://dav.example.com' },
    { key: 'username', label: 'Nom d\'utilisateur', type: 'text', placeholder: 'utilisateur' },
    { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
  ],
  LDAP: [
    { key: 'serverUrl', label: 'URL du serveur', type: 'url', placeholder: 'ldap://ldap.example.com:389' },
    { key: 'baseDn', label: 'Base DN', type: 'text', placeholder: 'dc=example,dc=com' },
    { key: 'bindDn', label: 'Bind DN', type: 'text', placeholder: 'cn=admin,dc=example,dc=com' },
    { key: 'bindPassword', label: 'Mot de passe Bind', type: 'password', placeholder: '••••••••' },
  ],
  SAML_SSO: [
    { key: 'entityId', label: 'Entity ID', type: 'text', placeholder: 'https://ged-isipa.example.com' },
    { key: 'ssoUrl', label: 'URL SSO', type: 'url', placeholder: 'https://idp.example.com/sso' },
    { key: 'certificate', label: 'Certificat', type: 'text', placeholder: 'MIICxjCCA...' },
  ],
}

// ============ STATUS BADGE ============
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'CONNECTED':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Connecté
        </Badge>
      )
    case 'DISCONNECTED':
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700 gap-1">
          <XCircle className="h-3 w-3" />
          Déconnecté
        </Badge>
      )
    case 'ERROR':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800 gap-1">
          <AlertCircle className="h-3 w-3" />
          Erreur
        </Badge>
      )
    case 'PENDING':
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 gap-1">
          <RefreshCw className="h-3 w-3" />
          En attente
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

// ============ TYPE ICON ============
function TypeIcon({ type, className }: { type: IntegrationType; className?: string }) {
  const config = INTEGRATION_TYPES[type]
  if (!config) return <Puzzle className={className} />
  const Icon = config.icon
  return <Icon className={className} />
}

// ============ FORMAT DATE ============
function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Jamais'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============ MAIN PAGE ============
export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formOrgId, setFormOrgId] = useState('')
  const [formType, setFormType] = useState<IntegrationType | ''>('')
  const [formName, setFormName] = useState('')
  const [formConfig, setFormConfig] = useState<Record<string, string>>({})

  // ============ FETCH DATA ============
  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/integrations')
      if (!res.ok) throw new Error('Erreur de chargement')
      const data = await res.json()
      setIntegrations(data.integrations)
    } catch {
      toast.error('Erreur lors du chargement des intégrations')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations?limit=100')
      if (!res.ok) throw new Error('Erreur de chargement')
      const data = await res.json()
      setOrganizations(data.organizations || [])
    } catch {
      toast.error('Erreur lors du chargement des organisations')
    }
  }, [])

  useEffect(() => {
    fetchIntegrations()
    fetchOrganizations()
  }, [fetchIntegrations, fetchOrganizations])

  // ============ FORM HANDLERS ============
  const handleTypeChange = (type: IntegrationType) => {
    setFormType(type)
    // Reset config when type changes
    const defaultConfig: Record<string, string> = {}
    CONFIG_FIELDS[type].forEach((field) => {
      defaultConfig[field.key] = ''
    })
    setFormConfig(defaultConfig)
    // Auto-set name
    if (!formName) {
      setFormName(INTEGRATION_TYPES[type].label)
    }
  }

  const handleConfigChange = (key: string, value: string) => {
    setFormConfig((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setFormOrgId('')
    setFormType('')
    setFormName('')
    setFormConfig({})
  }

  const handleSubmit = async () => {
    if (!formOrgId || !formType || !formName) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Validate config fields
    const requiredFields = CONFIG_FIELDS[formType as IntegrationType]
    const missingFields = requiredFields.filter(
      (field) => !formConfig[field.key]?.trim()
    )
    if (missingFields.length > 0) {
      toast.error(`Configuration incomplète : ${missingFields.map((f) => f.label).join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: formOrgId,
          type: formType,
          name: formName,
          config: formConfig,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      toast.success(`Intégration "${formName}" créée avec succès`)
      resetForm()
      setDialogOpen(false)
      fetchIntegrations()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création de l\'intégration')
    } finally {
      setSubmitting(false)
    }
  }

  // ============ COUNT INTEGRATIONS BY TYPE ============
  const integrationsByType = integrations.reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1
      return acc
    },
    {}
  )

  // ============ RENDER ============
  return (
    <div className="space-y-8">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <Puzzle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Intégrations Externes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez les connexions aux services externes pour votre plateforme
              GED-ISIPA
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Ajouter une intégration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle intégration</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
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

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type-select">Type d&apos;intégration *</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => handleTypeChange(v as IntegrationType)}
                >
                  <SelectTrigger id="type-select">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTEGRATION_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="int-name">Nom de l&apos;intégration *</Label>
                <Input
                  id="int-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Slack Production"
                />
              </div>

              {/* Config fields */}
              {formType && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Configuration — {INTEGRATION_TYPES[formType as IntegrationType]?.label}
                    </h4>
                    {CONFIG_FIELDS[formType as IntegrationType]?.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`config-${field.key}`}>
                          {field.label} *
                        </Label>
                        <Input
                          id={`config-${field.key}`}
                          type={field.type}
                          value={formConfig[field.key] || ''}
                          onChange={(e) =>
                            handleConfigChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer l&apos;intégration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ============ INTEGRATION TYPES GRID ============ */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Types d&apos;intégrations disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(INTEGRATION_TYPES).map(([typeKey, config]) => {
            const Icon = config.icon
            const count = integrationsByType[typeKey] || 0
            return (
              <Card
                key={typeKey}
                className="group hover:shadow-md transition-shadow cursor-default"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {config.label}
                        </h3>
                        {config.available ? (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          >
                            Disponible
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Bientôt
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {config.description}
                      </p>
                      {count > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {count} instance{count > 1 ? 's' : ''} configurée{count > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* ============ EXISTING INTEGRATIONS LIST ============ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Intégrations configurées
            {integrations.length > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({integrations.length})
              </span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={fetchIntegrations}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : integrations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Puzzle className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold text-muted-foreground">
                Aucune intégration configurée
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Commencez par ajouter une intégration pour connecter vos
                services externes
              </p>
              <Button
                className="mt-6 gap-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Ajouter une intégration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => {
              const typeConfig = INTEGRATION_TYPES[integration.type]
              const TypeIconComp = typeConfig?.icon || Puzzle
              const typeColor = typeConfig?.color || 'text-gray-600 bg-gray-100 dark:bg-gray-800/40 dark:text-gray-300'

              return (
                <Card key={integration.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Icon + Name + Org */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColor}`}
                        >
                          <TypeIconComp className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">
                              {integration.name}
                            </h3>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                              {typeConfig?.label || integration.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {integration.organization.name} ({integration.organization.code})
                          </p>
                        </div>
                      </div>

                      {/* Status + Sync + Actions */}
                      <div className="flex items-center gap-4 sm:shrink-0">
                        <StatusBadge status={integration.status} />

                        <div className="text-xs text-muted-foreground hidden md:block">
                          <span className="font-medium">Dernière sync :</span>{' '}
                          {formatDate(integration.lastSyncAt)}
                        </div>

                        <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Détails</span>
                        </Button>
                      </div>
                    </div>

                    {/* Error message */}
                    {integration.status === 'ERROR' && integration.errorMessage && (
                      <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 dark:bg-red-900/20">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {integration.errorMessage}
                        </p>
                      </div>
                    )}

                    {/* Mobile sync info */}
                    <div className="mt-2 md:hidden text-xs text-muted-foreground">
                      <span className="font-medium">Dernière sync :</span>{' '}
                      {formatDate(integration.lastSyncAt)}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
