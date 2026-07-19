'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Shield, Search, Download, Loader2, FileText, Filter, Activity } from 'lucide-react'
import { actionLabels, roleLabels } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AuditAction, Role } from '@prisma/client'

interface AuditLog {
  id: string
  action: AuditAction
  entityType: string
  entityId: string
  details: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: { name: string; email: string; role: string } | null
}

// Action color mapping for visual differentiation
const actionColorMap: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  METADATA_UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  APPROVE: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  REJECT: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  ARCHIVE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  RESTORE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  REQUEST_REVISION: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SOFT_DELETE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
}

// Entity type icon indicator
const entityTypeColor: Record<string, string> = {
  Document: 'text-teal-600 dark:text-teal-400',
  User: 'text-indigo-600 dark:text-indigo-400',
  Organization: 'text-purple-600 dark:text-purple-400',
  Department: 'text-amber-600 dark:text-amber-400',
  Workflow: 'text-blue-600 dark:text-blue-400',
  Module: 'text-emerald-600 dark:text-emerald-400',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [filterAction, setFilterAction] = useState('all')
  const [filterEntityType, setFilterEntityType] = useState('all')
  const [searchDetails, setSearchDetails] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...(filterAction !== 'all' ? { action: filterAction } : {}),
        ...(filterEntityType !== 'all' ? { entityType: filterEntityType } : {}),
      })
      const res = await fetch(`/api/audit?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotal(data.pagination?.total || 0)
      }
    } catch (error) {
      toast.error('Erreur de chargement', { description: 'Impossible de charger le journal d\'audit' })
    } finally {
      setLoading(false)
    }
  }, [page, filterAction, filterEntityType])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleExport = async () => {
    try {
      const res = await fetch('/api/audit?limit=10000')
      if (res.ok) {
        const data = await res.json()
        const csvRows = ['Action,Entité,Entité ID,Détails,Utilisateur,Date,IP']
        for (const log of data.logs || []) {
          csvRows.push([
            log.action,
            log.entityType,
            log.entityId,
            `"${(log.details || '').replace(/"/g, '""')}"`,
            log.user?.name || 'Système',
            new Date(log.createdAt).toISOString(),
            log.ipAddress || '',
          ].join(','))
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Export réussi', { description: 'Le fichier CSV a été téléchargé' })
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
  }

  // Filter by search on client side for details
  const filteredLogs = searchDetails
    ? logs.filter(log => log.details?.toLowerCase().includes(searchDetails.toLowerCase()) || log.user?.name?.toLowerCase().includes(searchDetails.toLowerCase()))
    : logs

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Journal d&apos;audit
          </h1>
          <p className="text-muted-foreground mt-1">
            Traçabilité complète de toutes les actions{' '}
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
              <Activity className="h-3 w-3" />
              {total} entrée(s)
            </span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="btn-premium">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les détails ou utilisateur..."
            value={searchDetails}
            onChange={(e) => setSearchDetails(e.target.value)}
            className="pl-9 input-premium"
          />
        </div>
        <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Filtrer par action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            {Object.entries(actionLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEntityType} onValueChange={(v) => { setFilterEntityType(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type d'entité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="Document">Document</SelectItem>
            <SelectItem value="User">Utilisateur</SelectItem>
            <SelectItem value="Organization">Organisation</SelectItem>
            <SelectItem value="Department">Département</SelectItem>
            <SelectItem value="Workflow">Workflow</SelectItem>
            <SelectItem value="Module">Module</SelectItem>
          </SelectContent>
        </Select>
        {(filterAction !== 'all' || filterEntityType !== 'all' || searchDetails) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterAction('all'); setFilterEntityType('all'); setSearchDetails(''); setPage(1) }} className="btn-premium">
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Table */}
      {loading && logs.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 py-3 px-4">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Entité</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Détails</TableHead>
                    <TableHead className="font-semibold">Utilisateur</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">IP</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <div className="empty-state-icon mx-auto">
                          <Shield className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mt-2">Aucune entrée d&apos;audit</h3>
                        <p className="text-muted-foreground mt-1">Les actions réalisées apparaîtront ici</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredLogs.map((log, idx) => {
                    const user = log.user
                    return (
                      <TableRow key={log.id} className={cn("table-row-hover animate-fade-in-up", "stagger-" + ((idx % 8) + 1))}>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium badge-premium",
                            actionColorMap[log.action] || 'bg-gray-100 text-gray-700'
                          )}>
                            {(actionLabels as Record<string, string>)[log.action] || log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className={cn("text-sm font-medium", entityTypeColor[log.entityType] || '')}>{log.entityType}</span>
                            <p className="text-xs text-muted-foreground font-mono">{log.entityId?.substring(0, 12)}...</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm truncate max-w-[300px]">{log.details}</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{user?.name || 'Système'}</p>
                            {user?.role && <p className="text-xs text-muted-foreground">{(roleLabels as Record<string, string>)[user.role] || user.role}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                          {log.ipAddress || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-premium">
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} sur {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-premium">
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}