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
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Settings,
  ArrowRight,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

// ============ TYPES ============
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
    setupInstructions: string[]
    category: string
  }
> = {
  SLACK: {
    label: 'Slack',
    description: 'Notifications et alertes via Slack pour votre organisation',
    icon: MessageSquare,
    available: true,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300',
    setupInstructions: [
      'Créez une application Slack dans votre espace de travail',
      'Configurez le webhook entrant pour le canal souhaité',
      'Copiez l\'URL du webhook et collez-la dans la configuration',
      'Sélectionnez le canal de notification (#general, #ged-alerts...)',
    ],
    category: 'Communication',
  },
  EMAIL_SMTP: {
    label: 'Email SMTP',
    description: 'Envoi d\'emails via votre serveur SMTP personnalisé',
    icon: Mail,
    available: true,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300',
    setupInstructions: [
      'Renseignez l\'hôte et le port de votre serveur SMTP',
      'Indiquez les identifiants de connexion (utilisateur/mot de passe)',
      'Configurez l\'adresse email d\'expédition',
      'Vérifiez que le port 587 (TLS) ou 465 (SSL) est ouvert',
    ],
    category: 'Communication',
  },
  S3_STORAGE: {
    label: 'Amazon S3',
    description: 'Stockage de fichiers sur Amazon S3 pour la sauvegarde',
    icon: Cloud,
    available: true,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300',
    setupInstructions: [
      'Créez un bucket S3 dans la région de votre choix',
      'Générez une paire de clés d\'accès IAM avec permissions S3',
      'Notez le nom du bucket et la région (ex: eu-west-1)',
      'Assurez-vous que la politique du bucket autorise les accès nécessaires',
    ],
    category: 'Stockage',
  },
  GOOGLE_DRIVE: {
    label: 'Google Drive',
    description: 'Synchronisation bidirectionnelle avec Google Drive',
    icon: HardDrive,
    available: true,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300',
    setupInstructions: [
      'Créez un projet dans Google Cloud Console',
      'Activez l\'API Google Drive pour le projet',
      'Créez des identifiants OAuth 2.0 (Client ID + Secret)',
      'Partagez le dossier Google Drive avec le compte de service',
    ],
    category: 'Stockage',
  },
  ONEDRIVE: {
    label: 'OneDrive',
    description: 'Intégration Microsoft OneDrive / SharePoint',
    icon: Cloud,
    available: true,
    color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300',
    setupInstructions: [
      'Enregistrez une application dans Azure Active Directory',
      'Configurez les permissions API Microsoft Graph (Files.ReadWrite.All)',
      'Notez le Client ID, Client Secret et Tenant ID',
      'Définissez l\'URL de redirection dans la configuration Azure',
    ],
    category: 'Stockage',
  },
  WEBDAV: {
    label: 'WebDAV',
    description: 'Connexion via protocole WebDAV pour le stockage distribué',
    icon: Globe,
    available: true,
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300',
    setupInstructions: [
      'Renseignez l\'URL de votre serveur WebDAV',
      'Indiquez les identifiants d\'authentification',
      'Vérifiez que le serveur supporte les méthodes PROPFIND, PUT, GET',
      'Testez la connexion avec un client WebDAV avant de configurer',
    ],
    category: 'Stockage',
  },
  LDAP: {
    label: 'LDAP',
    description: 'Authentification et synchronisation d\'annuaire LDAP / AD',
    icon: Lock,
    available: true,
    color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300',
    setupInstructions: [
      'Renseignez l\'URL du serveur LDAP (ldap:// ou ldaps://)',
      'Indiquez le Base DN de votre annuaire (ex: dc=ged,dc=isipa,dc=org)',
      'Configurez le Bind DN et le mot de passe pour la connexion',
      'Vérifiez que les filtres LDAP permettent la recherche d\'utilisateurs',
    ],
    category: 'Authentification',
  },
  SAML_SSO: {
    label: 'SAML SSO',
    description: 'Authentification unique SAML 2.0 pour fédération d\'identité',
    icon: Shield,
    available: true,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300',
    setupInstructions: [
      'Renseignez l\'Entity ID du fournisseur de service (SP)',
      'Indiquez l\'URL SSO du fournisseur d\'identité (IdP)',
      'Importez le certificat X.509 de l\'IdP',
      'Configurez l\'URL ACS (Assertion Consumer Service) dans l\'IdP',
    ],
    category: 'Authentification',
  },
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
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isOrgAdmin = role === 'ORG_ADMIN'
  const isAdmin = isSuperAdmin || isOrgAdmin

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState<IntegrationType | null>(null)

  // ============ FETCH DATA ============
  const fetchIntegrations = useCallback(async () => {
    if (!isAdmin) return
    try {
      setLoading(true)
      const res = await fetch('/api/admin/integrations')
      if (!res.ok) {
        if (res.status === 403 && isOrgAdmin) {
          // Expected — ORG_ADMIN can't access this endpoint
          return
        }
        throw new Error('Erreur de chargement')
      }
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch {
      // ORG_ADMIN gracefully handles the forbidden response
      if (isSuperAdmin) {
        toast.error('Erreur lors du chargement des intégrations')
      }
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isSuperAdmin, isOrgAdmin])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  // ============ COUNT INTEGRATIONS BY TYPE ============
  const integrationsByType = integrations.reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1
      return acc
    },
    {}
  )

  // ============ GROUP BY CATEGORY ============
  const categories = [...new Set(Object.values(INTEGRATION_TYPES).map((t) => t.category))]

  // ============ CONNECTED INTEGRATIONS (for ORG_ADMIN view) ============
  const connectedIntegrations = integrations.filter(
    (i) => i.status === 'CONNECTED' || i.status === 'PENDING'
  )
  const disconnectedIntegrations = integrations.filter(
    (i) => i.status === 'DISCONNECTED' || i.status === 'ERROR'
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
              Intégrations
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSuperAdmin
                ? 'Gérez les connexions aux services externes pour toutes les organisations'
                : isOrgAdmin
                  ? 'Consultez les intégrations disponibles pour votre organisation GED-ISIPA'
                  : 'Intégrations externes de la plateforme GED-ISIPA'}
            </p>
          </div>
        </div>
        {isSuperAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={fetchIntegrations}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        )}
      </div>

      {/* ============ ROLE INFO BANNER ============ */}
      {isOrgAdmin && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                  Accès restreint
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  La configuration des intégrations est réservée au Super Administrateur de la plateforme.
                  Pour activer une intégration, veuillez contacter l&apos;administration GED-ISIPA.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ AVAILABLE INTEGRATIONS GRID ============ */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Intégrations disponibles
        </h2>

        {categories.map((category) => (
          <div key={category} className="mb-6 last:mb-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(INTEGRATION_TYPES)
                .filter(([, config]) => config.category === category)
                .map(([typeKey, config]) => {
                  const Icon = config.icon
                  const count = integrationsByType[typeKey] || 0
                  const isExpanded = expandedCard === typeKey

                  return (
                    <Card
                      key={typeKey}
                      className="group hover:shadow-md transition-shadow"
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
                              <h4 className="font-semibold text-sm truncate">
                                {config.label}
                              </h4>
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
                            {count > 0 && isSuperAdmin && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {count} instance{count > 1 ? 's' : ''} configurée{count > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="mt-3 pt-3 border-t">
                          {isSuperAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 text-xs h-8"
                              onClick={() => setExpandedCard(isExpanded ? null : (typeKey as IntegrationType))}
                            >
                              <Settings className="h-3.5 w-3.5" />
                              Configurer
                              <ArrowRight className={`h-3.5 w-3.5 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 text-xs h-8"
                              onClick={() => setExpandedCard(isExpanded ? null : (typeKey as IntegrationType))}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Contacter l&apos;admin
                              <ArrowRight className={`h-3.5 w-3.5 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </Button>
                          )}
                        </div>

                        {/* Expanded setup instructions */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            {isOrgAdmin ? (
                              <>
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                  Pour activer cette intégration :
                                </p>
                                <ol className="space-y-1.5">
                                  {config.setupInstructions.map((step, idx) => (
                                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                      <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold">
                                        {idx + 1}
                                      </span>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  Contactez le Super Admin pour finaliser la configuration.
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs font-medium text-muted-foreground">
                                  Étapes de configuration :
                                </p>
                                <ol className="space-y-1.5">
                                  {config.setupInstructions.map((step, idx) => (
                                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                      <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 text-[10px] font-bold">
                                        {idx + 1}
                                      </span>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Accédez au panneau d&apos;administration pour créer cette intégration.
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* ============ CONNECTED INTEGRATIONS LIST ============ */}
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
          {isSuperAdmin && (
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
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !isAdmin ? (
          /* Non-admin users */
          <Card>
            <CardContent className="py-16 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold text-muted-foreground">
                Accès restreint
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Seuls les administrateurs peuvent consulter les intégrations configurées.
              </p>
            </CardContent>
          </Card>
        ) : isOrgAdmin && integrations.length === 0 ? (
          /* ORG_ADMIN with no integrations visible */
          <Card>
            <CardContent className="py-12 text-center">
              <Puzzle className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-base font-semibold text-muted-foreground">
                Aucune intégration visible
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Votre organisation n&apos;a pas encore d&apos;intégrations configurées.
                Contactez le Super Administrateur pour en activer une.
              </p>
            </CardContent>
          </Card>
        ) : integrations.length === 0 ? (
          /* SUPER_ADMIN with no integrations */
          <Card>
            <CardContent className="py-16 text-center">
              <Puzzle className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold text-muted-foreground">
                Aucune intégration configurée
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Commencez par configurer une intégration pour connecter vos
                services externes via le panneau d&apos;administration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Connected / Active integrations */}
            {connectedIntegrations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Actives ({connectedIntegrations.length})
                </h3>
                <div className="space-y-3">
                  {connectedIntegrations.map((integration) => {
                    const typeConfig = INTEGRATION_TYPES[integration.type]
                    const TypeIcon = typeConfig?.icon || Puzzle
                    const typeColor =
                      typeConfig?.color ||
                      'text-gray-600 bg-gray-100 dark:bg-gray-800/40 dark:text-gray-300'

                    return (
                      <Card
                        key={integration.id}
                        className="hover:shadow-sm transition-shadow"
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Icon + Name + Org */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColor}`}
                              >
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm truncate">
                                    {integration.name}
                                  </h4>
                                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                    {typeConfig?.label || integration.type}
                                  </span>
                                </div>
                                {isSuperAdmin && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {integration.organization.name} ({integration.organization.code})
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status + Sync */}
                            <div className="flex items-center gap-4 sm:shrink-0">
                              <StatusBadge status={integration.status} />
                              <div className="text-xs text-muted-foreground hidden md:block">
                                <span className="font-medium">Dernière sync :</span>{' '}
                                {formatDate(integration.lastSyncAt)}
                              </div>
                              {isSuperAdmin && (
                                <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Détails</span>
                                </Button>
                              )}
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
              </div>
            )}

            {/* Disconnected / Error integrations */}
            {disconnectedIntegrations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Inactives ({disconnectedIntegrations.length})
                </h3>
                <div className="space-y-3">
                  {disconnectedIntegrations.map((integration) => {
                    const typeConfig = INTEGRATION_TYPES[integration.type]
                    const TypeIcon = typeConfig?.icon || Puzzle
                    const typeColor =
                      typeConfig?.color ||
                      'text-gray-600 bg-gray-100 dark:bg-gray-800/40 dark:text-gray-300'

                    return (
                      <Card
                        key={integration.id}
                        className="hover:shadow-sm transition-shadow opacity-75"
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Icon + Name + Org */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColor}`}
                              >
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm truncate">
                                    {integration.name}
                                  </h4>
                                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                    {typeConfig?.label || integration.type}
                                  </span>
                                </div>
                                {isSuperAdmin && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {integration.organization.name} ({integration.organization.code})
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status + Actions */}
                            <div className="flex items-center gap-4 sm:shrink-0">
                              <StatusBadge status={integration.status} />
                              {isSuperAdmin && (
                                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                                  <Settings className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Reconfigurer</span>
                                </Button>
                              )}
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
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============ ADMIN LINK (for SUPER_ADMIN) ============ */}
      {isSuperAdmin && (
        <>
          <Separator />
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.href = '/admin/integrations'}
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir le panneau d&apos;administration des intégrations
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
