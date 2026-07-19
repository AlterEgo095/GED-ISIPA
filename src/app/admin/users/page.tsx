'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Users, Search, Plus, Pencil, Trash2, Shield, UserCheck, UserX, Loader2, CheckCircle, Ban,
} from 'lucide-react'
import { toast } from 'sonner'
import { roleLabels, roleColors, organizationTypeLabels } from '@/lib/constants'
import type { Role } from '@prisma/client'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface OrgMini { id: string; name: string; code: string; type: string }

interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  organizationId: string
  organization: OrgMini
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  superAdmins: number
  recentUsers: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function roleBadge(role: Role) {
  const label = roleLabels[role] ?? role
  const color = roleColors[role] ?? 'bg-gray-100 text-gray-700'
  return <Badge className={`${color} border-0 font-medium`}>{label}</Badge>
}

function statusBadge(isActive: boolean) {
  return isActive
    ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>
    : <Badge className="bg-red-50 text-red-700 border-red-200 border font-medium"><Ban className="h-3 w-3 mr-1" />Inactif</Badge>
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function AdminUsersPage() {
  /* state */
  const [users, setUsers] = useState<UserRow[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editRole, setEditRole] = useState<Role>('USER')
  const [editActive, setEditActive] = useState(true)
  const [editSaving, setEditSaving] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' as Role, organizationId: '' })

  const [organizations, setOrganizations] = useState<OrgMini[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* fetch */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter) params.set('isActive', statusFilter)
      params.set('page', '1')
      params.set('limit', '50')

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users ?? [])
        setStats(data.stats ?? null)
        setPagination(data.pagination ?? null)
      } else {
        // Fallback: aggregate from /api/organizations
        const orgRes = await fetch('/api/organizations')
        if (orgRes.ok) {
          const orgData = await orgRes.json()
          const orgs: OrgMini[] = Array.isArray(orgData) ? orgData : orgData.organizations ?? []
          setOrganizations(orgs)
          // Flatten users from organizations
          const allUsers: UserRow[] = []
          let tU = 0, aU = 0, sA = 0, rU = 0
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          orgs.forEach((org: any) => {
            const members: any[] = org.members ?? org.users ?? []
            members.forEach((m: any) => {
              allUsers.push({
                id: m.id,
                name: m.name ?? m.email,
                email: m.email,
                role: m.role ?? 'USER',
                isActive: m.isActive ?? true,
                lastLogin: m.lastLogin ?? null,
                createdAt: m.createdAt ?? new Date().toISOString(),
                organizationId: org.id,
                organization: { id: org.id, name: org.name, code: org.code ?? '', type: org.type ?? '' },
              })
              tU++
              if (m.isActive) aU++
              if (m.role === 'SUPER_ADMIN') sA++
              if (m.createdAt && new Date(m.createdAt) >= thirtyDaysAgo) rU++
            })
          })
          setUsers(allUsers)
          setStats({ totalUsers: tU, activeUsers: aU, superAdmins: sA, recentUsers: rU })
        }
      }
    } catch {
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter])

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations')
      if (res.ok) {
        const data = await res.json()
        setOrganizations(Array.isArray(data) ? data : data.organizations ?? [])
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchOrganizations()
  }, [fetchUsers, fetchOrganizations])

  /* handlers */
  const handleEditSave = async () => {
    if (!editUser) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole, isActive: editActive }),
      })
      if (res.ok) {
        toast.success('Utilisateur mis à jour avec succès')
        setEditUser(null)
        fetchUsers()
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setEditSaving(false)
    }
  }

  const handleCreate = async () => {
    setCreateSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Utilisateur créé avec succès')
        setCreateOpen(false)
        setForm({ name: '', email: '', password: '', role: 'USER', organizationId: '' })
        fetchUsers()
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Erreur lors de la création')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setCreateSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Utilisateur supprimé')
        setDeleteId(null)
        fetchUsers()
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (user: UserRow) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (res.ok) {
        toast.success(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé')
        fetchUsers()
      } else {
        toast.error('Erreur lors du changement de statut')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  /* stat cards */
  const statCards = stats
    ? [
        { label: 'Total utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-purple-600 bg-purple-50' },
        { label: 'Utilisateurs actifs', value: stats.activeUsers, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Super Admins', value: stats.superAdmins, icon: Shield, color: 'text-amber-600 bg-amber-50' },
        { label: 'Nouveaux (30j)', value: stats.recentUsers, icon: UserX, color: 'text-blue-600 bg-blue-50' },
      ]
    : []

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-sm text-gray-500">Gérez les utilisateurs de la plateforme</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <Card key={i} className="card-hover">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : statCards.map((s) => (
              <Card key={s.label} className="card-hover">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))
        }
      </div>

      {/* Filters */}
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les rôles</SelectItem>
                {(Object.entries(roleLabels) as [Role, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les statuts</SelectItem>
                <SelectItem value="true">Actif</SelectItem>
                <SelectItem value="false">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="card-hover overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Liste des utilisateurs</CardTitle>
          <CardDescription>
            {pagination ? `${pagination.total} utilisateur(s) trouvé(s)` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton />
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
              <p className="text-sm">Modifiez vos filtres ou créez un nouvel utilisateur</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-purple-50/30 transition-colors">
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-gray-500">{u.email}</TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.organization ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{u.organization.name}</span>
                          {u.organization.type && (
                            <span className="text-xs text-gray-400">
                              {organizationTypeLabels[u.organization.type] ?? u.organization.type}
                            </span>
                          )}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{statusBadge(u.isActive)}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{fmtDate(u.lastLogin)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-purple-600"
                          onClick={() => {
                            setEditUser(u)
                            setEditRole(u.role)
                            setEditActive(u.isActive)
                          }}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${u.isActive ? 'text-emerald-500 hover:text-red-500' : 'text-red-400 hover:text-emerald-500'}`}
                          onClick={() => handleToggleActive(u)}
                          title={u.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {u.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                          onClick={() => setDeleteId(u.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-purple-600" />
              Modifier l'utilisateur
            </DialogTitle>
            <DialogDescription>
              Modifier le rôle et le statut de {editUser?.name}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(roleLabels) as [Role, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <p className="text-xs text-gray-500">
                  {editActive ? 'L\'utilisateur peut se connecter' : 'L\'utilisateur est désactivé'}
                </p>
              </div>
              <Button
                variant={editActive ? 'destructive' : 'default'}
                size="sm"
                onClick={() => setEditActive(!editActive)}
                className={editActive ? '' : 'bg-emerald-600 hover:bg-emerald-700'}
              >
                {editActive ? 'Désactiver' : 'Activer'}
              </Button>
            </div>
          </div>
          <Separator />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditUser(null)}>Annuler</Button>
            <Button onClick={handleEditSave} disabled={editSaving} className="bg-purple-600 hover:bg-purple-700 text-white">
              {editSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Nouvel utilisateur
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un nouvel utilisateur
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nom complet</Label>
                <Input
                  id="create-name"
                  placeholder="Jean Dupont"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="jean@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Mot de passe</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(roleLabels) as [Role, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Organisation</Label>
                <Select value={form.organizationId} onValueChange={(v) => setForm({ ...form, organizationId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Separator />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              onClick={handleCreate}
              disabled={createSaving || !form.name || !form.email || !form.password || !form.organizationId}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {createSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'utilisateur et toutes ses données associées seront supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
