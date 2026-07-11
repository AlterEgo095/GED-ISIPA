'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Building2,
  Users,
  FileText,
  Archive,
  Workflow,
  UserCheck,
  UserX,
  AlertTriangle,
  Activity,
  HardDrive,
  Database,
  ShieldAlert,
  Clock,
  TrendingUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Server,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  statusLabels,
  classificationLabels,
  organizationTypeLabels,
  planLabels,
  actionLabels,
} from '@/lib/constants'

// ============ COLOR PALETTES ============
const CHART_COLORS = [
  '#7c3aed',
  '#0d9488',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
]

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#9ca3af',
  PENDING_REVIEW: '#f59e0b',
  APPROVED: '#10b981',
  PUBLISHED: '#14b8a6',
  ARCHIVED: '#64748b',
  REJECTED: '#ef4444',
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  PUBLIC: '#22c55e',
  INTERNAL: '#3b82f6',
  CONFIDENTIAL: '#f97316',
  RESTRICTED: '#ef4444',
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  READ: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  ARCHIVE: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  RESTORE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  DOWNLOAD: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  SHARE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  APPROVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECT: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  LOGIN: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  MODULE_ACTIVATE: 'bg-emerald-100 text-emerald-800',
  MODULE_SUSPEND: 'bg-amber-100 text-amber-800',
  WORKFLOW_EXECUTE: 'bg-violet-100 text-violet-800',
  ORGANIZATION_CREATE: 'bg-teal-100 text-teal-800',
  ORGANIZATION_SUSPEND: 'bg-red-100 text-red-800',
  USER_CREATED: 'bg-emerald-100 text-emerald-800',
  USER_VALIDATED: 'bg-green-100 text-green-800',
  USER_REJECTED: 'bg-rose-100 text-rose-800',
  USER_SUSPENDED: 'bg-amber-100 text-amber-800',
  USER_ACTIVATED: 'bg-emerald-100 text-emerald-800',
  ACCOUNT_APPROVE: 'bg-green-100 text-green-800',
  ACCOUNT_REJECT: 'bg-rose-100 text-rose-800',
  ACCOUNT_SUSPEND: 'bg-amber-100 text-amber-800',
}

// ============ TYPES ============
interface DashboardData {
  stats: {
    totalOrgs: number
    activeOrgs: number
    totalUsers: number
    activeUsers: number
    totalDocs: number
    archivedDocs: number
    activeWorkflows: number
    pendingAccounts: number
  }
  orgsByType: { type: string; count: number }[]
  orgsByPlan: { plan: string; count: number }[]
  docsByStatus: { status: string; count: number }[]
  docsByClassification: { classification: string; count: number }[]
  growth: {
    usersPerMonth: { month: string; count: number }[]
    docsPerMonth: { month: string; count: number }[]
    orgsPerMonth: { month: string; count: number }[]
  }
  recentAuditLogs: {
    id: string
    action: string
    entityType: string
    entityId: string
    details: string
    userName: string
    userEmail: string
    orgName: string
    createdAt: string
  }[]
  alerts: {
    suspendedOrgs: { id: string; name: string; code: string; status: string }[]
    trialExpiringSoon: { id: string; name: string; code: string; trialEndsAt: string }[]
    pendingAccounts: number
  }
  storageUsage: {
    organizationId: string
    organizationName: string
    totalFileSize: number
    documentCount: number
    maxStorage: number
    usagePercent: number
  }[]
}

interface HealthData {
  status: string
  timestamp: string
  checks: Record<string, 'ok' | 'error'>
}

// ============ HELPERS ============
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o'
  const k = 1024
  const sizes = ['o', 'Ko', 'Mo', 'Go', 'To']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============ MAIN COMPONENT ============
export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/stats/platform').then((r) => r.json()),
      fetch('/api/health').then((r) => r.json()).catch(() => ({ status: 'error', checks: {} })),
    ])
      .then(([statsData, healthData]) => {
        setData(statsData)
        setHealth(healthData)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Impossible de charger les données du tableau de bord</p>
      </div>
    )
  }

  const s = data.stats
  const hasAlerts =
    data.alerts.pendingAccounts > 0 ||
    data.alerts.suspendedOrgs.length > 0 ||
    data.alerts.trialExpiringSoon.length > 0

  return (
    <div className="space-y-6 pb-8">
      {/* ====== HEADER ====== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-teal-600 bg-clip-text text-transparent">
            Centre de Commandement
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d&apos;ensemble de la plateforme AEIP
          </p>
        </div>
        {hasAlerts && (
          <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1.5">
            <AlertTriangle className="h-4 w-4" />
            {data.alerts.pendingAccounts + data.alerts.suspendedOrgs.length + data.alerts.trialExpiringSoon.length} alerte(s)
          </Badge>
        )}
      </div>

      {/* ====== TOP STATS ROW (8 cards) ====== */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <StatCard
          title="Organisations"
          value={s.totalOrgs}
          icon={Building2}
          description={`${s.activeOrgs} actives`}
          iconColor="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-950/30"
        />
        <StatCard
          title="Utilisateurs"
          value={s.totalUsers}
          icon={Users}
          description={`${s.activeUsers} actifs`}
          iconColor="text-teal-600"
          bgColor="bg-teal-50 dark:bg-teal-950/30"
        />
        <StatCard
          title="Documents"
          value={s.totalDocs}
          icon={FileText}
          description={`${s.archivedDocs} archivés`}
          iconColor="text-amber-600"
          bgColor="bg-amber-50 dark:bg-amber-950/30"
        />
        <StatCard
          title="Workflows Actifs"
          value={s.activeWorkflows}
          icon={Workflow}
          description="Workflows actifs"
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          title="Orgs Actives"
          value={s.activeOrgs}
          icon={Building2}
          description={`sur ${s.totalOrgs} total`}
          iconColor="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-950/30"
        />
        <StatCard
          title="Utilisateurs Actifs"
          value={s.activeUsers}
          icon={UserCheck}
          description={`sur ${s.totalUsers} total`}
          iconColor="text-teal-600"
          bgColor="bg-teal-50 dark:bg-teal-950/30"
        />
        <StatCard
          title="Docs Archivés"
          value={s.archivedDocs}
          icon={Archive}
          description={`sur ${s.totalDocs} total`}
          iconColor="text-slate-600"
          bgColor="bg-slate-50 dark:bg-slate-950/30"
        />
        <StatCard
          title="Comptes en Attente"
          value={s.pendingAccounts}
          icon={UserX}
          description="En attente de validation"
          iconColor={s.pendingAccounts > 0 ? 'text-red-600' : 'text-gray-500'}
          bgColor={s.pendingAccounts > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-950/30'}
        />
      </div>

      {/* ====== GROWTH SECTION ====== */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Croissance
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* New Users per Month - Line Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Utilisateurs / Mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.growth.usersPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ fill: '#7c3aed', r: 4 }}
                    name="Utilisateurs"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* New Documents per Month - Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Documents / Mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.growth.docsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Documents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* New Organizations per Month - Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nouvelles Organisations / Mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.growth.orgsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Organisations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ====== ACTIVITY SECTION ====== */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-600" />
          Activité
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recent Audit Logs */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Journal d&apos;Audit Récent</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[340px]">
                {data.recentAuditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune activité récente</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {(actionLabels as Record<string, string>)[log.action] || log.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{log.entityType}</span>
                          </div>
                          <p className="text-sm font-medium truncate mt-1">
                            {log.userName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {log.orgName} — {log.details?.substring(0, 60)}{log.details && log.details.length > 60 ? '...' : ''}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Documents by Status - Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Documents par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              {data.docsByStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun document</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.docsByStatus.map((d) => ({
                          name: (statusLabels as Record<string, string>)[d.status] || d.status,
                          value: d.count,
                          color: STATUS_COLORS[d.status] || '#9ca3af',
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.docsByStatus.map((d, i) => (
                          <Cell
                            key={i}
                            fill={STATUS_COLORS[d.status] || CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {data.docsByStatus.map((d) => (
                      <div key={d.status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[d.status] || '#9ca3af' }}
                          />
                          <span>{(statusLabels as Record<string, string>)[d.status] || d.status}</span>
                        </div>
                        <span className="font-medium">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents by Classification */}
        {data.docsByClassification.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Documents par Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.docsByClassification.map((d) => ({
                  name: (classificationLabels as Record<string, string>)[d.classification] || d.classification,
                  count: d.count,
                  color: CLASSIFICATION_COLORS[d.classification] || '#9ca3af',
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Documents">
                    {data.docsByClassification.map((d, i) => (
                      <Cell
                        key={i}
                        fill={CLASSIFICATION_COLORS[d.classification] || CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ====== ORGANIZATION INSIGHTS ====== */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-600" />
          Vue Organisations
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Orgs by Type - Horizontal Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Organisations par Type</CardTitle>
            </CardHeader>
            <CardContent>
              {data.orgsByType.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune organisation</p>
              ) : (
                <ResponsiveContainer width="100%" height={data.orgsByType.length * 36 + 20}>
                  <BarChart
                    data={data.orgsByType.map((o) => ({
                      name: (organizationTypeLabels as Record<string, string>)[o.type] || o.type,
                      count: o.count,
                    }))}
                    layout="vertical"
                    margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Organisations" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orgs by Plan - Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Organisations par Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {data.orgsByPlan.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune organisation</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.orgsByPlan.map((o) => ({
                          name: (planLabels as Record<string, string>)[o.plan] || o.plan,
                          value: o.count,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.orgsByPlan.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {data.orgsByPlan.map((o, i) => (
                      <div key={o.plan} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span>{(planLabels as Record<string, string>)[o.plan] || o.plan}</span>
                        </div>
                        <span className="font-medium">{o.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Storage Usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Utilisation Stockage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                {data.storageUsage.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée de stockage</p>
                ) : (
                  <div className="space-y-3">
                    {data.storageUsage.map((org) => (
                      <div key={org.organizationId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium truncate max-w-[140px]">{org.organizationName}</span>
                          <span className="text-muted-foreground">
                            {formatBytes(org.totalFileSize)} / {formatBytes(org.maxStorage)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(org.usagePercent, 100)}
                          className="h-2"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{org.documentCount} documents</span>
                          <span className={org.usagePercent > 80 ? 'text-red-600 font-medium' : ''}>
                            {org.usagePercent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ====== ALERTS SECTION ====== */}
      {hasAlerts && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertes
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Pending Accounts */}
            <Card className={data.alerts.pendingAccounts > 0 ? 'border-red-200 dark:border-red-900' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UserX className={`h-4 w-4 ${data.alerts.pendingAccounts > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                  Comptes en Attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{data.alerts.pendingAccounts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  En attente de validation
                </p>
                {data.alerts.pendingAccounts > 0 && (
                  <a
                    href="/admin/accounts?status=PENDING_VALIDATION"
                    className="text-xs text-purple-600 hover:underline mt-2 inline-block"
                  >
                    Voir les comptes →
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Suspended Organizations */}
            <Card className={data.alerts.suspendedOrgs.length > 0 ? 'border-amber-200 dark:border-amber-900' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldAlert className={`h-4 w-4 ${data.alerts.suspendedOrgs.length > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                  Organisations Suspendues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{data.alerts.suspendedOrgs.length}</div>
                {data.alerts.suspendedOrgs.length > 0 ? (
                  <ScrollArea className="h-[80px] mt-2">
                    <div className="space-y-1">
                      {data.alerts.suspendedOrgs.map((org) => (
                        <div key={org.id} className="text-xs flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span className="truncate">{org.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Aucune organisation suspendue</p>
                )}
              </CardContent>
            </Card>

            {/* Trial Expiring Soon */}
            <Card className={data.alerts.trialExpiringSoon.length > 0 ? 'border-amber-200 dark:border-amber-900' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${data.alerts.trialExpiringSoon.length > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                  Essais Expirant Bientôt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{data.alerts.trialExpiringSoon.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Dans les 7 prochains jours</p>
                {data.alerts.trialExpiringSoon.length > 0 && (
                  <ScrollArea className="h-[80px] mt-2">
                    <div className="space-y-1">
                      {data.alerts.trialExpiringSoon.map((org) => (
                        <div key={org.id} className="text-xs flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span className="truncate">{org.name}</span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            — {org.trialEndsAt ? formatDate(org.trialEndsAt) : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ====== SYSTEM HEALTH ====== */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Server className="h-5 w-5 text-teal-600" />
          Santé Système
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${health?.checks.database === 'ok' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                  <Database className={`h-6 w-6 ${health?.checks.database === 'ok' ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="font-medium">Base de Données</p>
                  <div className="flex items-center gap-1.5">
                    {health?.checks.database === 'ok' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600">Opérationnelle</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Indisponible</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${health?.checks.storage === 'ok' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                  <HardDrive className={`h-6 w-6 ${health?.checks.storage === 'ok' ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="font-medium">Stockage Fichiers</p>
                  <div className="flex items-center gap-1.5">
                    {health?.checks.storage === 'ok' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600">Accessible</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Indisponible</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

// ============ STAT CARD SUB-COMPONENT ============
function StatCard({
  title,
  value,
  icon: Icon,
  description,
  iconColor,
  bgColor,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  description?: string
  iconColor?: string
  bgColor?: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString('fr-FR')}</p>
            {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${bgColor || 'bg-gray-50 dark:bg-gray-950/30'}`}>
            <Icon className={`h-5 w-5 ${iconColor || 'text-gray-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
