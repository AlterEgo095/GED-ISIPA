'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Shield, Search, Download, Filter } from 'lucide-react'
import { actionLabels, organizationTypeLabels } from '@/lib/constants'
import type { AuditAction } from '@prisma/client'

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [search, setSearch] = useState('')
  const [orgs, setOrgs] = useState<any[]>([])

  useEffect(() => { fetch('/api/organizations?limit=100').then(r => r.json()).then(d => setOrgs(d.organizations || [])) }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (actionFilter && actionFilter !== '__all__') params.set('action', actionFilter)
    if (entityFilter && entityFilter !== '__all__') params.set('entityType', entityFilter)
    if (orgFilter && orgFilter !== '__all__') params.set('organizationId', orgFilter)
    fetch(`/api/audit?${params}`).then(r => r.json()).then(d => { setLogs(d.logs || []); setTotal(d.pagination?.total || 0) }).finally(() => setLoading(false))
  }, [page, actionFilter, entityFilter, orgFilter])

  function exportCSV() {
    const headers = ['Date', 'Action', 'Utilisateur', 'Organisation', 'Entit\u00e9', 'ID Entit\u00e9', 'D\u00e9tails', 'IP']
    const rows = logs.map(l => [new Date(l.createdAt).toLocaleString('fr-FR'), l.action, l.user?.name || '-', l.organization?.name || '-', l.entityType, l.entityId, (l.details || '').replace(/,/g, ';'), l.ipAddress || ''].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'audit_logs.csv'; a.click()
  }

  const actionOptions = Object.entries(actionLabels).slice(0, 20)
  const entityTypes = ['User', 'Document', 'Organization', 'OrganizationModule', 'Workflow', 'WorkflowState', 'WorkflowTransition', 'Department']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> Journal d&apos;audit</h1><p className="text-muted-foreground">Tra\u00e7abilit\u00e9 compl\u00e8te des actions</p></div>
        <Button variant="outline" onClick={exportCSV} disabled={logs.length === 0}><Download className="mr-2 h-4 w-4" />Exporter CSV</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]"><Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1) }}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Action" /></SelectTrigger><SelectContent><SelectItem value="__all__">Toutes</SelectItem>{actionOptions.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
        <Select value={entityFilter} onValueChange={v => { setEntityFilter(v); setPage(1) }}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Entit\u00e9" /></SelectTrigger><SelectContent><SelectItem value="__all__">Toutes</SelectItem>{entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Select value={orgFilter} onValueChange={v => { setOrgFilter(v); setPage(1) }}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Organisation" /></SelectTrigger><SelectContent><SelectItem value="__all__">Toutes</SelectItem>{orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div> : (
        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Action</TableHead><TableHead>Utilisateur</TableHead><TableHead>Organisation</TableHead><TableHead>Entit\u00e9</TableHead><TableHead>D\u00e9tails</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
        <TableBody>{logs.filter(l => !search || (l.details || '').toLowerCase().includes(search.toLowerCase()) || (l.user?.name || '').toLowerCase().includes(search.toLowerCase())).map(log => (
          <TableRow key={log.id}>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
            <TableCell><Badge variant="outline" className="text-xs">{actionLabels[log.action as AuditAction] || log.action}</Badge></TableCell>
            <TableCell className="text-sm">{log.user?.name || '-'}<br/><span className="text-xs text-muted-foreground">{log.user?.email || ''}</span></TableCell>
            <TableCell className="text-sm">{log.organization?.name || '-'}</TableCell>
            <TableCell className="text-sm">{log.entityType}<br/><span className="text-xs text-muted-foreground">{log.entityId}</span></TableCell>
            <TableCell className="text-xs max-w-xs truncate">{log.details || '-'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{log.ipAddress || '-'}</TableCell>
          </TableRow>
        ))}
        {logs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune entr\u00e9e</TableCell></TableRow>}
        </TableBody></Table>)}
      </CardContent></Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} entr\u00e9e(s)</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Pr\u00e9c\u00e9dent</Button>
          <span>Page {page}/{Math.max(1, Math.ceil(total / 50))}</span>
          <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Suivant</Button>
        </div>
      </div>
    </div>
  )
}
