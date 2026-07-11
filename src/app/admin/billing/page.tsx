'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, CreditCard, Building2, Receipt, Calendar, DollarSign } from 'lucide-react'
import { planLabels, planPricing, orgStatusLabels, subscriptionStatusLabels } from '@/lib/constants'
import type { SubscriptionPlan, OrganizationStatus, SubscriptionStatus } from '@prisma/client'

export default function AdminBillingPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [planOpen, setPlanOpen] = useState<{orgId: string; orgName: string; currentPlan: string} | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/organizations?limit=100').then(r => r.json()).then(d => { setOrganizations(d.organizations || []); setLoading(false) })
  }, [])

  async function changePlan() {
    if (!planOpen) return
    setSaving(true)
    try {
      const planKey = selectedPlan as SubscriptionPlan
      const pricing = planPricing[planKey]
      const res = await fetch(`/api/organizations/${planOpen.orgId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, maxUsers: pricing.maxUsers, maxStorage: pricing.maxStorage }),
      })
      if (res.ok) { setPlanOpen(null); const r = await fetch('/api/organizations?limit=100'); const d = await r.json(); setOrganizations(d.organizations || []) }
      else { const d = await res.json(); alert(d.error || 'Erreur') }
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>

  const totalRevenue = organizations.filter(o => o.plan !== 'FREE').reduce((sum, o) => sum + (planPricing[o.plan as SubscriptionPlan]?.price || 0), 0)
  const planCounts: Record<string, number> = {}
  organizations.forEach(o => { planCounts[o.plan] = (planCounts[o.plan] || 0) + 1 })

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6" /> Facturation</h1><p className="text-muted-foreground">Gestion des abonnements et de la facturation</p></div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">{totalRevenue}$</p><p className="text-xs text-muted-foreground">Revenu mensuel</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{planCounts.ENTERPRISE || 0}</div><p className="text-xs text-muted-foreground">Enterprise</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{planCounts.PROFESSIONAL || 0}</div><p className="text-xs text-muted-foreground">Professionnel</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{planCounts.STARTER || 0}</div><p className="text-xs text-muted-foreground">D\u00e9butant</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Abonnements par organisation</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Organisation</TableHead><TableHead>Plan</TableHead><TableHead>Statut</TableHead><TableHead>Prix</TableHead><TableHead>Max utilisateurs</TableHead><TableHead>Max stockage</TableHead><TableHead>Fin d&apos;essai</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>{organizations.map(org => (
          <TableRow key={org.id}>
            <TableCell className="font-medium">{org.name}</TableCell>
            <TableCell><Badge variant="outline">{planLabels[org.plan as SubscriptionPlan]}</Badge></TableCell>
            <TableCell><Badge variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}>{orgStatusLabels[org.status as OrganizationStatus]}</Badge></TableCell>
            <TableCell className="font-medium">{planPricing[org.plan as SubscriptionPlan]?.price || 0}$</TableCell>
            <TableCell>{org.maxUsers > 0 ? org.maxUsers : '\u221e'}</TableCell>
            <TableCell>{org.maxStorage > 0 ? (org.maxStorage / 1073741824).toFixed(1) + ' Go' : 'Illimit\u00e9'}</TableCell>
            <TableCell className="text-sm">{org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString('fr-FR') : '-'}</TableCell>
            <TableCell><Button size="sm" variant="outline" onClick={() => { setPlanOpen({orgId: org.id, orgName: org.name, currentPlan: org.plan}); setSelectedPlan(org.plan) }}><CreditCard className="h-3 w-3 mr-1" />Plan</Button></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">D\u00e9tails des plans</CardTitle></CardHeader>
      <CardContent><div className="grid gap-4 sm:grid-cols-4">
        {Object.entries(planPricing).map(([key, pricing]) => (
          <Card key={key} className="border-2"><CardContent className="pt-4 text-center">
            <p className="font-bold text-lg">{planLabels[key as SubscriptionPlan]}</p>
            <p className="text-3xl font-bold text-purple-600 my-2">{pricing.price}$<span className="text-sm text-muted-foreground">/mois</span></p>
            <p className="text-sm text-muted-foreground">{pricing.maxUsers > 0 ? pricing.maxUsers + ' utilisateurs' : 'Illimit\u00e9'}</p>
            <p className="text-sm text-muted-foreground">{pricing.maxStorage > 0 ? (pricing.maxStorage / 1073741824).toFixed(1) + ' Go' : 'Illimit\u00e9'}</p>
          </CardContent></Card>
        ))}
      </div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Passerelles de paiement</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">Int\u00e9gration future avec M-Pesa et autres passerelles \u00e0 configurer lors d&apos;une mission ult\u00e9rieure.</p>
        <div className="flex gap-3">
          <Badge variant="outline" className="py-2 px-4">M-Pesa (pr\u00e9vu)</Badge>
          <Badge variant="outline" className="py-2 px-4">Stripe (pr\u00e9vu)</Badge>
          <Badge variant="outline" className="py-2 px-4">PayPal (pr\u00e9vu)</Badge>
        </div>
      </CardContent></Card>

      <Dialog open={!!planOpen} onOpenChange={() => setPlanOpen(null)}>
        <DialogContent><DialogHeader><DialogTitle>Changer le plan - {planOpen?.orgName}</DialogTitle></DialogHeader>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(planLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v} - {planPricing[k as SubscriptionPlan].price}$/mois</SelectItem>)}</SelectContent></Select>
          {selectedPlan && <div className="p-3 bg-muted rounded-lg text-sm"><p>Max utilisateurs: {planPricing[selectedPlan as SubscriptionPlan].maxUsers > 0 ? planPricing[selectedPlan as SubscriptionPlan].maxUsers : 'Illimit\u00e9'}</p><p>Max stockage: {planPricing[selectedPlan as SubscriptionPlan].maxStorage > 0 ? (planPricing[selectedPlan as SubscriptionPlan].maxStorage / 1073741824).toFixed(1) + ' Go' : 'Illimit\u00e9'}</p></div>}
          <DialogFooter><Button variant="outline" onClick={() => setPlanOpen(null)}>Annuler</Button><Button onClick={changePlan} disabled={saving} className="bg-purple-600 hover:bg-purple-700">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Appliquer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
