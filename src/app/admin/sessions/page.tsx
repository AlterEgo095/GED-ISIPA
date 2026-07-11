'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Monitor, Smartphone, Globe, LogOut, Clock, MapPin } from 'lucide-react'
import { roleLabels } from '@/lib/constants'
import type { Role } from '@prisma/client'

export default function AdminSessionsPage() {
  const [loginLogs, setLoginLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/audit?action=LOGIN&limit=50&page=${page}`).then(r => r.json()).then(d => {
      setLoginLogs(d.logs || []); setTotal(d.pagination?.total || 0)
    }).finally(() => setLoading(false))
  }, [page])

  // Group logins by user to show "sessions"
  const sessions = loginLogs.reduce((acc: Record<string, any>, log: any) => {
    const key = log.userId
    if (!acc[key]) {
      acc[key] = { userId: key, userName: log.user?.name || 'Inconnu', userEmail: log.user?.email || '', role: log.user?.role || '', lastLogin: log.createdAt, ip: log.ipAddress, org: log.organization?.name || '' }
    }
    return acc
  }, {})

  const sessionList = Object.values(sessions)

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Monitor className="h-6 w-6" /> Sessions</h1><p className="text-muted-foreground">Sessions actives et connexions r\u00e9centes</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{sessionList.length}</div><p className="text-xs text-muted-foreground">Connexions r\u00e9centes</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{new Set(loginLogs.map(l => l.ipAddress).filter(Boolean)).size}</div><p className="text-xs text-muted-foreground">Adresses IP uniques</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{total}</div><p className="text-xs text-muted-foreground">Total connexions</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Connexions r\u00e9centes</CardTitle></CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div> : (
        <Table><TableHeader><TableRow><TableHead>Utilisateur</TableHead><TableHead>R\u00f4le</TableHead><TableHead>Organisation</TableHead><TableHead>Derni\u00e8re connexion</TableHead><TableHead>Adresse IP</TableHead></TableRow></TableHeader>
        <TableBody>{sessionList.map((s: any) => (
          <TableRow key={s.userId}>
            <TableCell><div><p className="font-medium">{s.userName}</p><p className="text-xs text-muted-foreground">{s.userEmail}</p></div></TableCell>
            <TableCell><Badge variant="outline">{roleLabels[s.role as Role] || s.role}</Badge></TableCell>
            <TableCell className="text-sm">{s.org}</TableCell>
            <TableCell className="text-sm">{new Date(s.lastLogin).toLocaleString('fr-FR')}</TableCell>
            <TableCell className="text-sm font-mono">{s.ip || '-'}</TableCell>
          </TableRow>
        ))}
        {sessionList.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune session</TableCell></TableRow>}
        </TableBody></Table>)}
      </CardContent></Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} connexion(s)</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Pr\u00e9c\u00e9dent</Button>
          <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Suivant</Button>
        </div>
      </div>
    </div>
  )
}
