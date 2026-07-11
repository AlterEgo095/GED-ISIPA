'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Loader2, HardDrive, Download, Upload, Trash2, CheckCircle, Clock, RefreshCw } from 'lucide-react'

type BackupInfo = { id: string; filename: string; size: string; createdAt: string; status: string; type: string }

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoreDialog, setRestoreDialog] = useState<BackupInfo | null>(null)

  async function loadBackups() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/backups')
      if (res.ok) { const d = await res.json(); setBackups(d.backups || []) }
      else { setBackups([]) }
    } catch { setBackups([]) }
    setLoading(false)
  }

  useEffect(() => { loadBackups() }, [])

  async function createBackup() {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/backups', { method: 'POST' })
      if (res.ok) { loadBackups() }
      else { const d = await res.json(); alert(d.error || 'Erreur') }
    } finally { setCreating(false) }
  }

  async function restoreBackup(filename: string) {
    const res = await fetch('/api/admin/backups/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename }) })
    if (res.ok) { alert('Restauration lanc\u00e9e'); loadBackups() }
    else { const d = await res.json(); alert(d.error || 'Erreur') }
    setRestoreDialog(null)
  }

  async function deleteBackup(filename: string) {
    if (!confirm('Supprimer cette sauvegarde ?')) return
    const res = await fetch('/api/admin/backups', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename }) })
    if (res.ok) loadBackups()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><HardDrive className="h-6 w-6" /> Sauvegardes</h1><p className="text-muted-foreground">Gestion des sauvegardes PostgreSQL</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBackups}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
          <Button onClick={createBackup} disabled={creating} className="bg-purple-600 hover:bg-purple-700">{creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="mr-2 h-4 w-4" />}Nouvelle sauvegarde</Button>
        </div>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div> : (
        <Table><TableHeader><TableRow><TableHead>Fichier</TableHead><TableHead>Taille</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>{backups.map(b => (
          <TableRow key={b.id}>
            <TableCell className="font-mono text-sm">{b.filename}</TableCell>
            <TableCell className="text-sm">{b.size}</TableCell>
            <TableCell className="text-sm">{new Date(b.createdAt).toLocaleString('fr-FR')}</TableCell>
            <TableCell><Badge variant="outline">{b.type}</Badge></TableCell>
            <TableCell><Badge variant={b.status === 'completed' ? 'default' : 'secondary'}>{b.status === 'completed' ? 'Compl\u00e8te' : b.status}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setRestoreDialog(b)}><RefreshCw className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteBackup(b.filename)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {backups.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune sauvegarde. Cliquez sur &quot;Nouvelle sauvegarde&quot; pour en cr\u00e9er une.</TableCell></TableRow>}
        </TableBody></Table>)}
      </CardContent></Card>

      <Dialog open={!!restoreDialog} onOpenChange={() => setRestoreDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle>Restaurer la sauvegarde</DialogTitle></DialogHeader>
          <DialogDescription>Voulez-vous restaurer la sauvegarde <strong>{restoreDialog?.filename}</strong> ? Cette action remplacera toutes les donn\u00e9es actuelles.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => restoreBackup(restoreDialog!.filename)}>Restaurer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
