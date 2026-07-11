'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { UserCheck, UserX, Clock, AlertTriangle } from 'lucide-react'
import { roleLabels } from '@/lib/constants'
import type { Role } from '@prisma/client'

interface PendingUser {
  id: string; email: string; name: string; role: Role; accountStatus: string; createdAt: string;
  department: { id: string; name: string } | null;
  organization: { id: string; name: string; code: string } | null;
}

export default function AccountValidationPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionDialog, setActionDialog] = useState<{ user: PendingUser; action: 'APPROVE' | 'REJECT' } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [filter, setFilter] = useState('PENDING_VALIDATION')

  const fetchUsers = async (status?: string) => {
    const s = status || filter
    const res = await fetch('/api/admin/accounts?status=' + s)
    const data = await res.json()
    setPendingUsers(data.users || [])
    setLoading(false)
  }

  useEffect(() => { void fetchUsers() }, [])

  const handleAction = async () => {
    if (!actionDialog) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: actionDialog.user.id, action: actionDialog.action }),
      })
      if (res.ok) { fetchUsers(); setActionDialog(null) }
    } finally { setProcessing(false) }
  }

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING_VALIDATION: <Clock className="h-4 w-4 text-amber-500" />,
    ACTIVE: <UserCheck className="h-4 w-4 text-emerald-500" />,
    REJECTED: <UserX className="h-4 w-4 text-red-500" />,
    SUSPENDED: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  }
  const statusLabels: Record<string, string> = {
    PENDING_VALIDATION: 'En attente', ACTIVE: 'Actif', REJECTED: 'Rejete', SUSPENDED: 'Suspendu',
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="h-6 w-6" />Validation des comptes</h1>
        <p className="text-muted-foreground">Approuvez ou rejetez les demandes de creation de comptes</p>
      </div>
      <div className="flex gap-2">
        {['PENDING_VALIDATION', 'ACTIVE', 'REJECTED', 'SUSPENDED'].map((s) => (
          <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => { setFilter(s); fetchUsers(s); setLoading(true); }}>
            {statusIcons[s]}<span className="ml-1">{statusLabels[s]}</span>
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Organisation</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell><Badge>{roleLabels[user.role]}</Badge></TableCell>
                  <TableCell className="text-sm">{user.organization?.name || '-'}</TableCell>
                  <TableCell><div className="flex items-center gap-1">{statusIcons[user.accountStatus]}<span className="text-sm">{statusLabels[user.accountStatus]}</span></div></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => setActionDialog({ user, action: 'APPROVE' })} disabled={user.accountStatus === 'ACTIVE'}><UserCheck className="h-3 w-3 mr-1" />Approuver</Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => setActionDialog({ user, action: 'REJECT' })} disabled={user.accountStatus === 'REJECTED'}><UserX className="h-3 w-3 mr-1" />Rejeter</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pendingUsers.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun compte avec ce statut</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.action === 'APPROVE' ? 'Approuver le compte' : 'Rejeter le compte'}</DialogTitle>
            <DialogDescription>{actionDialog?.action === 'APPROVE' ? 'Voulez-vous approuver le compte de ' + actionDialog?.user.name + ' ?' : 'Voulez-vous rejeter le compte de ' + actionDialog?.user.name + ' ?'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
            <Button variant={actionDialog?.action === 'APPROVE' ? 'default' : 'destructive'} onClick={handleAction} disabled={processing}>{processing ? 'Traitement...' : actionDialog?.action === 'APPROVE' ? 'Approuver' : 'Rejeter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
