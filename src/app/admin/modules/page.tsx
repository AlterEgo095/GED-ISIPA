'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Boxes, CheckCircle, Ban, Power } from 'lucide-react'
import { AVAILABLE_MODULES, getModulesForOrgType, activateModule, suspendModule, deactivateModule } from '@/lib/module-engine'
import { organizationTypeLabels, moduleStatusLabels, moduleLabels } from '@/lib/constants'
import type { OrganizationType, ModuleStatus } from '@prisma/client'

type OrgModuleInfo = { id: string; name: string; moduleKey: string; status: ModuleStatus; activatedAt: string | null; organization: { id: string; name: string; code: string; type: OrganizationType } }

export default function SuperAdminModulesPage() {
  const [orgModules, setOrgModules] = useState<OrgModuleInfo[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState('')

  useEffect(() => {
    fetch('/api/organizations').then(r => r.json()).then(d => setOrgs(d.organizations || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedOrg || selectedOrg === '__all__') { setOrgModules([]); return }
    fetch(`/api/organizations/${selectedOrg}/modules`).then(r => r.json()).then(d => {
      const modsWithOrg = (Array.isArray(d) ? d : []).map((m: any) => ({
        ...m, organization: orgs.find((o: any) => o.id === selectedOrg) || { id: selectedOrg, name: 'Inconnu', code: '?', type: 'INSTITUTION' }
      }))
      setOrgModules(modsWithOrg)
    })
  }, [selectedOrg, orgs])

  async function handleModuleAction(orgId: string, moduleKey: string, action: string) {
    const res = await fetch(`/api/organizations/${orgId}/modules`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleKey, action }),
    })
    if (res.ok) {
      // Refresh
      fetch(`/api/organizations/${selectedOrg}/modules`).then(r => r.json()).then(d => {
        const modsWithOrg = (Array.isArray(d) ? d : []).map((m: any) => ({
          ...m, organization: orgs.find((o: any) => o.id === selectedOrg) || { id: selectedOrg, name: 'Inconnu', code: '?', type: 'INSTITUTION' }
        }))
        setOrgModules(modsWithOrg)
      })
    } else { const d = await res.json(); alert(d.error || 'Erreur') }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Boxes className="h-6 w-6" /> Modules Plateforme</h1><p className="text-muted-foreground">Activer, d\u00e9sactiver et configurer les modules par organisation</p></div>

      <div className="flex gap-3 items-end">
        <div className="flex-1"><label className="text-sm font-medium">Organisation</label>
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger><SelectValue placeholder="S\u00e9lectionner une organisation" /></SelectTrigger>
            <SelectContent><SelectItem value="__all__">Vue g\u00e9n\u00e9rale</SelectItem>{orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name} ({o.code})</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {selectedOrg && selectedOrg !== '__all__' ? (
        <Card><CardHeader><CardTitle className="text-base">Modules de l&apos;organisation</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Cl\u00e9</TableHead><TableHead>Statut</TableHead><TableHead>Activ\u00e9 le</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {orgModules.map(mod => (
              <TableRow key={mod.id}>
                <TableCell className="font-medium">{mod.name || moduleLabels[mod.moduleKey] || mod.moduleKey}</TableCell>
                <TableCell><code className="text-xs bg-accent px-1.5 py-0.5 rounded">{mod.moduleKey}</code></TableCell>
                <TableCell><Badge variant={mod.status === 'ACTIVE' ? 'default' : 'secondary'}>{moduleStatusLabels[mod.status]}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{mod.activatedAt ? new Date(mod.activatedAt).toLocaleDateString('fr-FR') : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {mod.status !== 'ACTIVE' && <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleModuleAction(selectedOrg, mod.moduleKey, 'activate')}><CheckCircle className="h-3 w-3 mr-1" />Activer</Button>}
                    {mod.status === 'ACTIVE' && <Button size="sm" variant="outline" className="text-amber-600" onClick={() => handleModuleAction(selectedOrg, mod.moduleKey, 'suspend')}><Ban className="h-3 w-3 mr-1" />Suspendre</Button>}
                    {mod.status === 'ACTIVE' && <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleModuleAction(selectedOrg, mod.moduleKey, 'deactivate')}><Power className="h-3 w-3 mr-1" />D\u00e9sactiver</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {orgModules.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">S\u00e9lectionnez une organisation pour voir ses modules</TableCell></TableRow>}
          </TableBody></Table>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Vue g\u00e9n\u00e9rale des modules disponibles par type d&apos;organisation :</p>
          {Object.entries(organizationTypeLabels).map(([type, label]) => {
            const mods = getModulesForOrgType(type as OrganizationType)
            return (
              <Card key={type}><CardHeader><CardTitle className="text-base">{label}</CardTitle></CardHeader>
              <CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {mods.map(mod => (
                  <div key={mod.key} className="flex items-center gap-2 rounded-lg border p-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div><p className="text-sm font-medium">{mod.name}</p><p className="text-xs text-muted-foreground">{mod.key}</p></div>
                  </div>
                ))}
              </div></CardContent></Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
