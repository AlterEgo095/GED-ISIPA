'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Loader2, ArrowLeft, Shield, Calendar, KeyRound, Ban, CheckCircle, X, UserCog, Activity, Clock } from 'lucide-react'
import { roleLabels, actionLabels } from '@/lib/constants'
import type { Role } from '@prisma/client'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800', PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800', REJECTED: 'bg-gray-100 text-gray-800',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif', PENDING_VALIDATION: 'En attente', SUSPENDED: 'Suspendu', REJECTED: 'Rejete',
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [user, setUser] = useState<Record<string, any> | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editOrgId, setEditOrgId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [userRes, auditRes, orgRes] = await Promise.all([
        fetch('/api/users/' + userId),
        fetch('/api/audit?entityType=User&limit=50'),
        fetch('/api/organizations'),
      ])
      if (userRes.ok) setUser(await userRes.json())
      if (auditRes.ok) { const d = await auditRes.json(); setAuditLogs((d.logs || []).filter((l: any) => l.entityId === userId)) }
      if (orgRes.ok) { const d = await orgRes.json(); setOrgs(d.organizations || []) }
      setLoading(false)
    }
    load()
  }, [userId])

  async function userAction(action: string) {
    const res = await fetch('/api/admin/users/' + userId, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    if (res.ok) { setUser(await (await fetch('/api/users/' + userId)).json()) }
    else { const d = await res.json(); alert(d.error || 'Erreur') }
  }

  async function handleResetPassword() {
    const res = await fetch('/api/admin/users/' + userId + '/reset-password', { method: 'POST' })
    if (res.ok) { const d = await res.json(); setTempPassword(d.temporaryPassword) }
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const res = await fetch('/api/users/' + userId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName, role: editRole, organizationId: editOrgId }) })
      if (res.ok) { setEditOpen(false); setUser(await (await fetch('/api/users/' + userId)).json()) }
      else { const d = await res.json(); alert(d.error || 'Erreur') }
    } finally { setSaving(false) }
  }

  function openEdit() {
    if (!user) return
    setEditName(user.name || ''); setEditRole(user.role || ''); setEditOrgId(user.organizationId || user.organization?.id || ''); setEditOpen(true)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
  if (!user) return <div className="text-center py-12 text-muted-foreground">Utilisateur introuvable</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1"><h1 className="text-2xl font-bold">{user.name}</h1><p className="text-muted-foreground">{user.email}</p></div>
        <div className="flex gap-2">
          {user.accountStatus === 'PENDING_VALIDATION' && <><Button className="bg-green-600 hover:bg-green-700" onClick={() => userAction('validate')}><CheckCircle className="mr-2 h-4 w-4" />Valider</Button><Button variant="destructive" onClick={() => userAction('reject')}><X className="mr-2 h-4 w-4" />Rejeter</Button></>}
          {user.accountStatus === 'ACTIVE' && <Button variant="outline" className="text-orange-600" onClick={() => userAction('suspend')}><Ban className="mr-2 h-4 w-4" />Suspendre</Button>}
          {(user.accountStatus === 'SUSPENDED' || user.accountStatus === 'REJECTED') && <Button className="bg-green-600 hover:bg-green-700" onClick={() => userAction('activate')}><CheckCircle className="mr-2 h-4 w-4" />Activer</Button>}
          <Button variant="outline" onClick={openEdit}><UserCog className="mr-2 h-4 w-4" />Modifier</Button>
          <Button variant="outline" onClick={() => { setResetOpen(true); setTempPassword(null) }}><KeyRound className="mr-2 h-4 w-4" />Reinit MDP</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2"><CardHeader><CardTitle className="text-base">Profil</CardTitle></CardHeader>
          <CardContent><div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Role</span><p><Badge variant="outline">{roleLabels[user.role as Role] || user.role}</Badge></p></div>
            <div><span className="text-muted-foreground">Statut</span><p><span className={'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ' + (STATUS_COLORS[user.accountStatus] || '')}>{STATUS_LABELS[user.accountStatus] || user.accountStatus}</span></p></div>
            <div><span className="text-muted-foreground">Organisation</span><p className="font-medium">{user.organization?.name || '-'}</p></div>
            <div><span className="text-muted-foreground">Departement</span><p className="font-medium">{user.department?.name || '-'}</p></div>
            <div><span className="text-muted-foreground">Email verifie</span><p className="font-medium">{user.emailVerified ? 'Oui' : 'Non'}</p></div>
            <div><span className="text-muted-foreground">Admin plateforme</span><p>{user.isPlatformAdmin ? <Shield className="h-4 w-4 text-purple-600 inline" /> : 'Non'}</p></div>
          </div></CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-base">Activite</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Cree: {new Date(user.createdAt).toLocaleDateString('fr-FR')}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />Derniere connexion: {user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}</div>
            <Separator />
            <div><span className="text-muted-foreground">Actions audit</span><p className="text-xl font-bold">{auditLogs.length}</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit">
        <TabsList><TabsTrigger value="audit"><Activity className="h-4 w-4 mr-1" />Historique</TabsTrigger></TabsList>
        <TabsContent value="audit"><Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Details</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {auditLogs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell><Badge variant="outline">{actionLabels[log.action as keyof typeof actionLabels] || log.action}</Badge></TableCell>
                <TableCell className="text-sm max-w-md truncate">{log.details || '-'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
              </TableRow>
            ))}
            {auditLogs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucune activite</TableCell></TableRow>}
          </TableBody></Table>
        </CardContent></Card></TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent><DialogHeader><DialogTitle>Modifier l utilisateur</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nom</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
          <div><Label>Role</Label><Select value={editRole} onValueChange={setEditRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Organisation</Label><Select value={editOrgId} onValueChange={setEditOrgId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button><Button onClick={handleSaveEdit} disabled={saving} className="bg-purple-600 hover:bg-purple-700">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sauvegarder</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}><DialogContent><DialogHeader><DialogTitle>Reinitialiser le mot de passe</DialogTitle></DialogHeader>
        {tempPassword ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">Nouveau mot de passe :</p>
            <p className="text-lg font-mono font-bold text-green-900 mt-1">{tempPassword}</p>
          </div>
        ) : (
          <DialogDescription>Generer un nouveau mot de passe temporaire pour cet utilisateur ?</DialogDescription>
        )}
        <DialogFooter>
          {!tempPassword && <Button onClick={handleResetPassword} className="bg-purple-600 hover:bg-purple-700">Generer</Button>}
          <Button variant="outline" onClick={() => { setResetOpen(false); setTempPassword(null) }}>{tempPassword ? 'Fermer' : 'Annuler'}</Button>
        </DialogFooter>
      </DialogContent></Dialog>
    </div>
  )
}
