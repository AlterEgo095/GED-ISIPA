'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, Building2, Users, FileText, Boxes, Ban, CheckCircle, Pencil, Save, CreditCard, Shield } from 'lucide-react'
import { organizationTypeLabels, orgStatusLabels, planLabels, roleLabels, planPricing, moduleStatusLabels, moduleLabels } from '@/lib/constants'
import type { OrganizationType, OrganizationStatus, SubscriptionPlan, Role, ModuleStatus } from '@prisma/client'
import { toast } from 'sonner'

export default function OrgDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const [org, setOrg] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editMaxUsers, setEditMaxUsers] = useState(0)
  const [editMaxStorage, setEditMaxStorage] = useState(0)
  const [editStatus, setEditStatus] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [modules, setModules] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [orgRes, modRes, auditRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}`),
        fetch(`/api/organizations/${orgId}/modules`),
        fetch(`/api/audit?organizationId=${orgId}&limit=30`),
      ])
      if (orgRes.ok) setOrg(await orgRes.json())
      if (modRes.ok) setModules(await modRes.json())
      if (auditRes.ok) { const d = await auditRes.json(); setAuditLogs(d.logs || []) }
      setLoading(false)
    }
    load()
  }, [orgId])

  async function orgUpdate(data: Record<string, any>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { setOrg(await (await fetch(`/api/organizations/${orgId}`)).json()); setEditOpen(false); setPlanOpen(false); toast.success('Organisation mise à jour') }
      else { const d = await res.json(); toast.error(d.error || 'Erreur') }
    } finally { setSaving(false) }
  }

  async function moduleAction(moduleKey: string, action: string) {
    const res = await fetch(`/api/organizations/${orgId}/modules`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleKey, action }),
    })
    if (res.ok) { setModules(await (await fetch(`/api/organizations/${orgId}/modules`)).json()); toast.success('Action exécutée') }
    else { const d = await res.json(); toast.error(d.error || 'Erreur') }
  }

  function openEdit() {
    if (!org) return
    setEditName(org.name); setEditMaxUsers(org.maxUsers); setEditMaxStorage(org.maxStorage); setEditStatus(org.status); setEditOpen(true)
  }

  function openPlanChange() {
    if (!org) return
    setSelectedPlan(org.plan); setPlanOpen(true)
  }

  async function applyPlan() {
    const planKey = selectedPlan as SubscriptionPlan
    const pricing = planPricing[planKey]
    await orgUpdate({ plan: planKey, maxUsers: pricing.maxUsers, maxStorage: pricing.maxStorage })
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
  if (!org) return <div className="text-center py-12 text-muted-foreground">Organisation introuvable</div>

  const count = org._count as Record<string, number>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/organizations')}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6 text-purple-600" />{org.name}</h1>
          <p className="text-muted-foreground">{org.code} &bull; {organizationTypeLabels[org.type as OrganizationType]}</p>
        </div>
        <div className="flex gap-2">
          {org.status === 'ACTIVE' && <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => orgUpdate({ status: 'SUSPENDED' })}><Ban className="mr-2 h-4 w-4" />Suspendre</Button>}
          {org.status !== 'ACTIVE' && <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => orgUpdate({ status: 'ACTIVE' })}><CheckCircle className="mr-2 h-4 w-4" />Activer</Button>}
          <Button variant="outline" onClick={openEdit}><Pencil className="mr-2 h-4 w-4" />Modifier</Button>
          <Button variant="outline" onClick={openPlanChange}><CreditCard className="mr-2 h-4 w-4" />Changer plan</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-hover"><CardContent className="pt-4"><div className="text-2xl font-bold text-purple-600">{count?.users || 0}</div><p className="text-xs text-muted-foreground">Utilisateurs</p></CardContent></Card>
        <Card className="card-hover"><CardContent className="pt-4"><div className="text-2xl font-bold text-purple-600">{count?.documents || 0}</div><p className="text-xs text-muted-foreground">Documents</p></CardContent></Card>
        <Card className="card-hover"><CardContent className="pt-4"><div className="text-2xl font-bold text-purple-600">{count?.departments || 0}</div><p className="text-xs text-muted-foreground">Départements</p></CardContent></Card>
        <Card className="card-hover"><CardContent className="pt-4"><div className="text-2xl font-bold text-purple-600">{org.maxUsers > 0 ? `${org.maxUsers}` : '∞'}</div><p className="text-xs text-muted-foreground">Max utilisateurs</p></CardContent></Card>
      </div>

      <Card className="card-hover"><CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
        <CardContent><div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Statut</span><p><Badge variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}>{orgStatusLabels[org.status as OrganizationStatus]}</Badge></p></div>
          <div><span className="text-muted-foreground">Plan</span><p><Badge variant="outline">{planLabels[org.plan as SubscriptionPlan]}</Badge></p></div>
          <div><span className="text-muted-foreground">Stockage max</span><p className="font-medium">{org.maxStorage > 0 ? (org.maxStorage / 1073741824).toFixed(1) + ' Go' : 'Illimité'}</p></div>
          <div><span className="text-muted-foreground">Couleur primaire</span><div className="flex items-center gap-2"><div className="h-5 w-5 rounded-full border" style={{ backgroundColor: org.primaryColor }} /><span className="font-mono text-xs">{org.primaryColor}</span></div></div>
          <div><span className="text-muted-foreground">Fin d&apos;essai</span><p className="font-medium">{org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString('fr-FR') : '-'}</p></div>
          <div><span className="text-muted-foreground">Fin abonnement</span><p className="font-medium">{org.subscriptionEndsAt ? new Date(org.subscriptionEndsAt).toLocaleDateString('fr-FR') : '-'}</p></div>
        </div></CardContent>
      </Card>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules"><Boxes className="h-4 w-4 mr-1" />Modules</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Utilisateurs</TabsTrigger>
          <TabsTrigger value="audit"><Shield className="h-4 w-4 mr-1" />Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="modules"><Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Statut</TableHead><TableHead>Activé le</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{modules.map((mod: any) => (
            <TableRow key={mod.id}>
              <TableCell className="font-medium">{mod.name || moduleLabels[mod.moduleKey as keyof typeof moduleLabels] || mod.moduleKey}</TableCell>
              <TableCell><Badge variant={mod.status === 'ACTIVE' ? 'default' : 'secondary'}>{moduleStatusLabels[mod.status as ModuleStatus]}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{mod.activatedAt ? new Date(mod.activatedAt).toLocaleDateString('fr-FR') : '-'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {mod.status !== 'ACTIVE' && <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => moduleAction(mod.moduleKey, 'activate')}><CheckCircle className="h-3 w-3 mr-1" />Activer</Button>}
                  {mod.status === 'ACTIVE' && <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => moduleAction(mod.moduleKey, 'suspend')}><Ban className="h-3 w-3 mr-1" />Suspendre</Button>}
                  {mod.status === 'ACTIVE' && <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => moduleAction(mod.moduleKey, 'deactivate')}><Ban className="h-3 w-3 mr-1" />Désactiver</Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {modules.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun module</TableCell></TableRow>}
          </TableBody></Table>
        </CardContent></Card></TabsContent>

        <TabsContent value="users"><Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
          <TableBody>{(org.users || []).map((u: any) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell className="text-sm">{u.email}</TableCell>
              <TableCell><Badge variant="outline">{roleLabels[u.role as Role]}</Badge></TableCell>
              <TableCell><Badge variant={u.isActive ? 'default' : 'secondary'}>{u.isActive ? 'Actif' : 'Inactif'}</Badge></TableCell>
            </TableRow>
          ))}
          {(!org.users || org.users.length === 0) && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun utilisateur</TableCell></TableRow>}
          </TableBody></Table>
        </CardContent></Card></TabsContent>

        <TabsContent value="audit"><Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Utilisateur</TableHead><TableHead>Détails</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>{auditLogs.map((log: any) => (
            <TableRow key={log.id}>
              <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
              <TableCell className="text-sm">{log.user?.name || '-'}</TableCell>
              <TableCell className="text-sm max-w-md truncate">{log.details || '-'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
            </TableRow>
          ))}
          {auditLogs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucune entrée</TableCell></TableRow>}
          </TableBody></Table>
        </CardContent></Card></TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent><DialogHeader><DialogTitle>Modifier l&apos;organisation</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nom</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
          <div><Label>Statut</Label><Select value={editStatus} onValueChange={setEditStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(orgStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Max utilisateurs</Label><Input type="number" value={editMaxUsers} onChange={e => setEditMaxUsers(parseInt(e.target.value) || 0)} /></div>
          <div><Label>Max stockage (octets)</Label><Input type="number" value={editMaxStorage} onChange={e => setEditMaxStorage(parseInt(e.target.value) || 0)} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button><Button onClick={() => orgUpdate({ name: editName, status: editStatus, maxUsers: editMaxUsers, maxStorage: editMaxStorage })} disabled={saving} className="bg-purple-600 hover:bg-purple-700"><Save className="mr-2 h-4 w-4" />Sauvegarder</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}><DialogContent><DialogHeader><DialogTitle>Changer le plan</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(planLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v} - {planPricing[k as SubscriptionPlan].price}$</SelectItem>)}</SelectContent></Select>
          {selectedPlan && <div className="p-3 bg-muted rounded-lg text-sm">
            <p>Max utilisateurs: {planPricing[selectedPlan as SubscriptionPlan].maxUsers > 0 ? planPricing[selectedPlan as SubscriptionPlan].maxUsers : 'Illimité'}</p>
            <p>Max stockage: {planPricing[selectedPlan as SubscriptionPlan].maxStorage > 0 ? (planPricing[selectedPlan as SubscriptionPlan].maxStorage / 1073741824).toFixed(1) + ' Go' : 'Illimité'}</p>
          </div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setPlanOpen(false)}>Annuler</Button><Button onClick={applyPlan} className="bg-purple-600 hover:bg-purple-700">Appliquer</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  )
}
