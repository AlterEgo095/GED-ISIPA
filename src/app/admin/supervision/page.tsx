'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, FileText, Eye, Clock, Activity } from 'lucide-react'
import { roleLabels } from '@/lib/constants'
import type { Role } from '@prisma/client'

export default function GlobalSupervisionPage() {
  const [data, setData] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/supervision?section=' + activeTab)
      .then(res => res.json())
      .then(d => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeTab])

  if (loading || !data) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
  const s = (data.stats || {}) as Record<string, number>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Eye className="h-6 w-6" />Supervision globale</h1>
        <p className="text-muted-foreground">Vue complete de toute l'activite de la plateforme</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-1" />Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="all-documents"><FileText className="h-4 w-4 mr-1" />Tous les documents</TabsTrigger>
          <TabsTrigger value="all-users"><Users className="h-4 w-4 mr-1" />Tous les utilisateurs</TabsTrigger>
          <TabsTrigger value="audit-logs"><Clock className="h-4 w-4 mr-1" />Journal d'audit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Organisations</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.totalOrgs || 0}</div><p className="text-xs text-muted-foreground">{s.activeOrgs || 0} actives</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Utilisateurs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.totalUsers || 0}</div><p className="text-xs text-muted-foreground">{s.activeUsers || 0} actifs</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Documents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.totalDocs || 0}</div><p className="text-xs text-muted-foreground">sur la plateforme</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">Comptes en attente</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{s.pendingAccounts || 0}</div><p className="text-xs text-muted-foreground">a valider</p></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle className="text-base">Activite recente</CardTitle></CardHeader><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Utilisateur</TableHead><TableHead>Organisation</TableHead><TableHead>Details</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data.recentAuditLogs || []).map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                  <TableCell className="text-sm">{log.user?.name || '-'} <span className="text-muted-foreground">({log.user?.email})</span></TableCell>
                  <TableCell className="text-sm">{log.organization?.name || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{log.details || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="all-documents"><Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Organisation</TableHead><TableHead>Auteur</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data.documents || []).map((doc: any) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell className="text-sm">{doc.organization?.name || '-'}</TableCell>
                <TableCell className="text-sm">{doc.author?.name || '-'}</TableCell>
                <TableCell><Badge variant="outline">{doc.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</TableCell>
              </TableRow>
            ))}
            {(data.documents || []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun document</TableCell></TableRow>}
          </TableBody></Table>
        </CardContent></Card></TabsContent>
        <TabsContent value="all-users"><Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Organisation</TableHead><TableHead>Statut</TableHead><TableHead>Derniere connexion</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data.users || []).map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-sm">{user.email}</TableCell>
                <TableCell><Badge>{roleLabels[user.role as Role]}</Badge></TableCell>
                <TableCell className="text-sm">{user.organization?.name || '-'}</TableCell>
                <TableCell><Badge variant={user.accountStatus === 'ACTIVE' ? 'default' : 'secondary'}>{user.accountStatus}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </CardContent></Card></TabsContent>
        <TabsContent value="audit-logs"><Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Utilisateur</TableHead><TableHead>Organisation</TableHead><TableHead>Entite</TableHead><TableHead>Details</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data.logs || []).map((log: any) => (
              <TableRow key={log.id}>
                <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                <TableCell className="text-sm">{log.user?.name || '-'} ({log.user?.role})</TableCell>
                <TableCell className="text-sm">{log.organization?.name || '-'}</TableCell>
                <TableCell className="text-sm">{log.entityType}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{log.details || '-'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </CardContent></Card></TabsContent>
      </Tabs>
    </div>
  )
}
