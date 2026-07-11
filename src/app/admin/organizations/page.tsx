'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Loader2, Building2, Search, Plus, Eye, MoreHorizontal, Ban, CheckCircle, Pencil } from 'lucide-react'
import Link from 'next/link'
import { organizationTypeLabels, orgStatusLabels, planLabels, planPricing } from '@/lib/constants'
import type { OrganizationType, OrganizationStatus, SubscriptionPlan } from '@prisma/client'

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState('UNIVERSITY')
  const [creating, setCreating] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25' })
    if (search) params.set('search', search)
    if (typeFilter && typeFilter !== '__all__') params.set('type', typeFilter)
    if (statusFilter && statusFilter !== '__all__') params.set('status', statusFilter)
    if (planFilter && planFilter !== '__all__') params.set('plan', planFilter)
    const res = await fetch(`/api/organizations?${params}`)
    if (res.ok) { const d = await res.json(); setOrganizations(d.organizations || []); setTotal(d.pagination?.total || 0) }
    setLoading(false)
  }, [search, typeFilter, statusFilter, planFilter, page])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreating(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, slug: newSlug, code: newCode, type: newType }),
      })
      if (res.ok) { setCreateOpen(false); setNewName(''); setNewSlug(''); setNewCode(''); setNewType('UNIVERSITY'); loadData() }
      else { const d = await res.json(); alert(d.error || 'Erreur') }
    } finally { setCreating(false) }
  }

  async function orgAction(orgId: string, action: string) {
    const res = await fetch(`/api/organizations/${orgId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action }),
    })
    if (res.ok) loadData(); else { const d = await res.json(); alert(d.error || 'Erreur') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" /> Organisations</h1><p className="text-muted-foreground">Gestion compl\u00e8te des organisations</p></div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button className="bg-purple-600 hover:bg-purple-700"><Plus className="mr-2 h-4 w-4" />Cr\u00e9er</Button></DialogTrigger>
        <DialogContent><DialogHeader><DialogTitle>Cr\u00e9er une organisation</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Nom</Label><Input value={newName} onChange={e => setNewName(e.target.value)} required /></div>
            <div><Label>Slug</Label><Input value={newSlug} onChange={e => setNewSlug(e.target.value)} required placeholder="mon-organisation" /></div>
            <div><Label>Code</Label><Input value={newCode} onChange={e => setNewCode(e.target.value)} required placeholder="MONORG" /></div>
            <div><Label>Type</Label><Select value={newType} onValueChange={setNewType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(organizationTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <Button type="submit" disabled={creating} className="w-full bg-purple-600 hover:bg-purple-700">{creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Cr\u00e9er</Button>
          </form>
        </DialogContent></Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{total}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{organizations.filter(o => o.status === 'ACTIVE').length}</div><p className="text-xs text-muted-foreground">Actives</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{organizations.filter(o => o.status === 'TRIAL').length}</div><p className="text-xs text-muted-foreground">Essai</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{organizations.filter(o => o.status === 'SUSPENDED').length}</div><p className="text-xs text-muted-foreground">Suspendues</p></CardContent></Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]"><Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /></div>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1) }}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="__all__">Tous</SelectItem>{Object.entries(organizationTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger><SelectContent><SelectItem value="__all__">Tous</SelectItem>{Object.entries(orgStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
        <Select value={planFilter} onValueChange={v => { setPlanFilter(v); setPage(1) }}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Plan" /></SelectTrigger><SelectContent><SelectItem value="__all__">Tous</SelectItem>{Object.entries(planLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div> : (
        <Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Plan</TableHead><TableHead>Statut</TableHead><TableHead className="hidden md:table-cell">Utilisateurs</TableHead><TableHead className="hidden md:table-cell">Documents</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
        <TableBody>{organizations.map(org => {
          const count = org._count as Record<string, number>
          return (
            <TableRow key={org.id}>
              <TableCell className="font-medium">{org.name}</TableCell>
              <TableCell><code className="text-xs bg-accent px-1.5 py-0.5 rounded">{org.code}</code></TableCell>
              <TableCell>{organizationTypeLabels[org.type as OrganizationType]}</TableCell>
              <TableCell><Badge variant="outline">{planLabels[org.plan as SubscriptionPlan]}</Badge></TableCell>
              <TableCell><Badge variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}>{orgStatusLabels[org.status as OrganizationStatus]}</Badge></TableCell>
              <TableCell className="hidden md:table-cell">{count?.users || 0}</TableCell>
              <TableCell className="hidden md:table-cell">{count?.documents || 0}</TableCell>
              <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link href={`/admin/organizations/${org.id}`}><Eye className="mr-2 h-4 w-4" />D\u00e9tails</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {org.status === 'ACTIVE' && <DropdownMenuItem onClick={() => orgAction(org.id, 'SUSPENDED')}><Ban className="mr-2 h-4 w-4 text-orange-600" />Suspendre</DropdownMenuItem>}
                  {(org.status === 'SUSPENDED' || org.status === 'TRIAL') && <DropdownMenuItem onClick={() => orgAction(org.id, 'ACTIVE')}><CheckCircle className="mr-2 h-4 w-4 text-green-600" />Activer</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu></TableCell>
            </TableRow>
          )
        })}
        {organizations.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucune organisation</TableCell></TableRow>}
        </TableBody></Table>)}
      </CardContent></Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} organisation(s)</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Pr\u00e9c\u00e9dent</Button>
          <span className="py-1 px-2">Page {page}/{Math.max(1, Math.ceil(total / 25))}</span>
          <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)}>Suivant</Button>
        </div>
      </div>
    </div>
  )
}
