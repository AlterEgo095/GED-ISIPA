'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Loader2, Users, Search, UserPlus, Check, X, Shield, MoreHorizontal, KeyRound, Ban, CheckCircle, Eye, UserCog } from 'lucide-react'
import Link from 'next/link'
import { roleLabels } from '@/lib/constants'
import type { Role, AccountStatus } from '@prisma/client'

type OrgInfo = { id: string; name: string; code: string; type: string }
type UserInfo = {
  id: string; email: string; name: string; role: Role; isActive: boolean;
  isPlatformAdmin: boolean; accountStatus: AccountStatus; emailVerified: boolean;
  department?: { id: string; name: string }; organization?: OrgInfo;
  lastLogin: string | null; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800', PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800', REJECTED: 'bg-gray-100 text-gray-800',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif', PENDING_VALIDATION: 'En attente', SUSPENDED: 'Suspendu', REJECTED: 'Rejete',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [orgs, setOrgs] = useState<OrgInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [resetDialog, setResetDialog] = useState<{userId: string; userName: string} | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('USER')
  const [newOrgId, setNewOrgId] = useState('')
  const [creating, setCreating] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25' })
    if (search) params.set('search', search)
    if (orgFilter && orgFilter !== '__all__') params.set('organizationId', orgFilter)
    if (statusFilter && statusFilter !== '__all__') params.set('accountStatus', statusFilter)
    if (roleFilter && roleFilter !== '__all__') params.set('role', roleFilter)
    const res = await fetch('/api/users?' + params.toString())
    if (res.ok) { const data = await res.json(); setUsers(data.users || []); setTotal(data.pagination?.total || 0) }
    setLoading(false)
  }, [search, orgFilter, statusFilter, roleFilter, page])

  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => { fetch('/api/organizations').then(r => r.json()).then(d => setOrgs((d.organizations || []).map((o: any) => ({ id: o.id, name: o.name, code: o.code, type: o.type })))) }, [])

  async function userAction(userId: string, action: string) {
    const res = await fetch('/api/admin/users/' + userId, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    if (res.ok) loadUsers(); else { const d = await res.json(); alert(d.error || 'Erreur') }
  }

  async function handleResetPassword(userId: string) {
    const res = await fetch('/api/admin/users/' + userId + '/reset-password', { method: 'POST' })
    if (res.ok) { const data = await res.json(); setTempPassword(data.temporaryPassword) }
    else { const d = await res.json(); alert(d.error || 'Erreur') }
  }

  async function handleBulkAction(action: string) {
    if (selectedIds.size === 0) return
    await Promise.all(Array.from(selectedIds).map(id => fetch('/api/admin/users/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })))
    setSelectedIds(new Set()); loadUsers()
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault(); setCreating(true)
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newEmail, name: newName, password: newPassword, role: newRole, organizationId: newOrgId || undefined }) })
      if (res.ok) { setCreateOpen(false); setNewEmail(''); setNewName(''); setNewPassword(''); setNewRole('USER'); setNewOrgId(''); loadUsers() }
      else { const d = await res.json(); alert(d.error || 'Erreur') }
    } finally { setCreating(false) }
  }

  function toggleSelect(id: string) { const next = new Set(selectedIds); if (next.has(id)) next.delete(id); else next.add(id); setSelectedIds(next) }
  function toggleSelectAll() { if (selectedIds.size === users.length) setSelectedIds(new Set()); else setSelectedIds(new Set(users.map(u => u.id))) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Gestion des Utilisateurs</h1><p className="text-muted-foreground">Administration complete des utilisateurs</p></div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button className="bg-purple-600 hover:bg-purple-700"><UserPlus className="mr-2 h-4 w-4" />Creer</Button></DialogTrigger>
        <DialogContent><DialogHeader><DialogTitle>Creer un utilisateur</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div><Label>Email</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} required type="email" /></div>
            <div><Label>Nom</Label><Input value={newName} onChange={e => setNewName(e.target.value)} required /></div>
            <div><Label>Mot de passe</Label><Input value={newPassword} onChange={e => setNewPassword(e.target.value)} required type="password" minLength={8} /></div>
            <div><Label>Organisation</Label><Select value={newOrgId} onValueChange={setNewOrgId}><SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger><SelectContent>{orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Role</Label><Select value={newRole} onValueChange={setNewRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <Button type="submit" disabled={creating} className="w-full bg-purple-600 hover:bg-purple-700">{creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Creer</Button>
          </form>
        </DialogContent></Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{total}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{users.filter(u => u.accountStatus === 'ACTIVE').length}</div><p className="text-xs text-muted-foreground">Actifs</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{users.filter(u => u.accountStatus === 'PENDING_VALIDATION').length}</div><p className="text-xs text-muted-foreground">En attente</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{users.filter(u => u.accountStatus === 'SUSPENDED').length}</div><p className="text-xs text-muted-foreground">Suspendus</p></CardContent></Card>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <span className="text-sm font-medium">{selectedIds.size} selectionne(s)</span>
          <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleBulkAction('validate')}><CheckCircle className="h-3 w-3 mr-1" />Valider</Button>
          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleBulkAction('suspend')}><Ban className="h-3 w-3 mr-1" />Suspendre</Button>
          <Button size="sm" variant="outline" className="text-blue-600" onClick={() => handleBulkAction('activate')}><Check className="h-3 w-3 mr-1" />Activer</Button>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]"><Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /></div>
        <Select value={orgFilter} onValueChange={v => { setOrgFilter(v); setPage(1) }}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Organisation" /></SelectTrigger><SelectContent><SelectItem value="__all__">Toutes</SelectItem>{orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger><SelectContent><SelectItem value="__all__">Tous</SelectItem><SelectItem value="ACTIVE">Actif</SelectItem><SelectItem value="PENDING_VALIDATION">En attente</SelectItem><SelectItem value="SUSPENDED">Suspendu</SelectItem><SelectItem value="REJECTED">Rejete</SelectItem></SelectContent></Select>
        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1) }}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="__all__">Tous</SelectItem>{Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div> : (
        <Table><TableHeader><TableRow>
          <TableHead className="w-10"><input type="checkbox" checked={selectedIds.size === users.length && users.length > 0} onChange={toggleSelectAll} className="rounded" /></TableHead>
          <TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Organisation</TableHead><TableHead>Role</TableHead><TableHead>Statut</TableHead><TableHead>Admin</TableHead><TableHead>Derniere connexion</TableHead><TableHead className="w-12"></TableHead>
        </TableRow></TableHeader>
        <TableBody>{users.map(u => (
          <TableRow key={u.id} className={selectedIds.has(u.id) ? 'bg-purple-50' : ''}>
            <TableCell><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded" /></TableCell>
            <TableCell className="font-medium">{u.name}</TableCell>
            <TableCell className="text-sm">{u.email}</TableCell>
            <TableCell><span className="text-sm">{u.organization?.name || '-'}</span></TableCell>
            <TableCell><Badge variant="outline">{roleLabels[u.role] || u.role}</Badge></TableCell>
            <TableCell><span className={'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ' + (STATUS_COLORS[u.accountStatus] || '')}>{STATUS_LABELS[u.accountStatus] || u.accountStatus}</span></TableCell>
            <TableCell>{u.isPlatformAdmin && <Shield className="h-4 w-4 text-purple-600" />}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}</TableCell>
            <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link href={'/admin/users/' + u.id}><Eye className="mr-2 h-4 w-4" />Details</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                {u.accountStatus === 'PENDING_VALIDATION' && <><DropdownMenuItem onClick={() => userAction(u.id, 'validate')}><CheckCircle className="mr-2 h-4 w-4 text-green-600" />Valider</DropdownMenuItem><DropdownMenuItem onClick={() => userAction(u.id, 'reject')}><X className="mr-2 h-4 w-4 text-red-600" />Rejeter</DropdownMenuItem></>}
                {u.accountStatus === 'ACTIVE' && <DropdownMenuItem onClick={() => userAction(u.id, 'suspend')}><Ban className="mr-2 h-4 w-4 text-orange-600" />Suspendre</DropdownMenuItem>}
                {(u.accountStatus === 'SUSPENDED' || u.accountStatus === 'REJECTED') && <DropdownMenuItem onClick={() => userAction(u.id, 'activate')}><CheckCircle className="mr-2 h-4 w-4 text-green-600" />Activer</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => { setResetDialog({userId: u.id, userName: u.name}); setTempPassword(null) }}><KeyRound className="mr-2 h-4 w-4 text-blue-600" />Reinitialiser MDP</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu></TableCell>
          </TableRow>
        ))}
        {users.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Aucun utilisateur</TableCell></TableRow>}
        </TableBody></Table>)}
      </CardContent></Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} utilisateur(s)</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Precedent</Button>
          <span className="py-1 px-2">Page {page}/{Math.max(1, Math.ceil(total / 25))}</span>
          <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)}>Suivant</Button>
        </div>
      </div>

      <Dialog open={!!resetDialog} onOpenChange={() => setResetDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle>Reinitialiser le mot de passe</DialogTitle></DialogHeader>
          {tempPassword ? (
            <div className="space-y-3">
              <p className="text-sm">Mot de passe de {resetDialog?.userName} reinitialise.</p>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Nouveau mot de passe :</p>
                <p className="text-lg font-mono font-bold text-green-900 mt-1">{tempPassword}</p>
              </div>
            </div>
          ) : (
            <DialogDescription>Reinitialiser le mot de passe de {resetDialog?.userName || ''} ?</DialogDescription>
          )}
          <DialogFooter>
            {!tempPassword && <Button onClick={() => handleResetPassword(resetDialog!.userId)} className="bg-purple-600 hover:bg-purple-700">Reinitialiser</Button>}
            <Button variant="outline" onClick={() => { setResetDialog(null); setTempPassword(null) }}>{tempPassword ? 'Fermer' : 'Annuler'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
