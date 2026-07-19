'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Archive, RotateCcw, Search, AlertTriangle, Trash2, Clock, Shield, FileText, HardDrive, Loader2, CheckCircle, Filter } from 'lucide-react'
import { statusLabels, statusColors, classificationLabels, classificationColors, typeLabels } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DocumentStatus, Classification, DocumentType } from '@prisma/client'

interface ArchivedDocument {
  id: string
  title: string
  reference: string
  type: DocumentType
  status: DocumentStatus
  classification: Classification
  version: number
  fileSize: number
  isArchived: boolean
  archivedAt: string | null
  archivedBy: string | null
  archiveRef: string | null
  destructionApproved: boolean
  destructionApprovedBy: string | null
  retentionPeriod: number | null
  expiresAt: string | null
  author: { id: string; name: string; email: string }
  department: { id: string; name: string; code: string }
}

export default function ArchivesPage() {
  const [documents, setDocuments] = useState<ArchivedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterClassification, setFilterClassification] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, totalSize: 0, pendingDestruction: 0, expiredRetention: 0 })

  // Dialogs
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [approveDestructionOpen, setApproveDestructionOpen] = useState(false)
  const [destroyDialogOpen, setDestroyDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<ArchivedDocument | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [destructionReason, setDestructionReason] = useState('')
  const [destroyConfirmation, setDestroyConfirmation] = useState('')

  const fetchArchives = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        isArchived: 'true',
        status: 'ARCHIVED',
        ...(search ? { search } : {}),
        ...(filterType !== 'all' ? { type: filterType } : {}),
        ...(filterClassification !== 'all' ? { classification: filterClassification } : {}),
      })
      const res = await fetch(`/api/documents?${params}`)
      if (res.ok) {
        const data = await res.json()
        const archivedDocs = (data.documents || []).filter((d: any) => d.isArchived)
        setDocuments(archivedDocs)
        setTotalPages(data.pagination?.pages || 1)
        setStats({
          total: data.pagination?.total || archivedDocs.length,
          totalSize: archivedDocs.reduce((acc: number, d: any) => acc + (d.fileSize || 0), 0),
          pendingDestruction: archivedDocs.filter((d: any) => d.destructionApproved && d.status === 'ARCHIVED').length,
          expiredRetention: archivedDocs.filter((d: any) => d.expiresAt && new Date(d.expiresAt) < new Date()).length,
        })
      }
    } catch (error) {
      toast.error('Erreur de chargement', { description: 'Impossible de charger les archives' })
    } finally {
      setLoading(false)
    }
  }, [page, search, filterType, filterClassification])

  useEffect(() => {
    fetchArchives()
  }, [fetchArchives])

  const handleRestore = async () => {
    if (!selectedDoc) return
    setActionLoading(selectedDoc.id)
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/restore`, { method: 'POST' })
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== selectedDoc.id))
        setRestoreDialogOpen(false)
        setSelectedDoc(null)
        toast.success('Document restauré', { description: `"${selectedDoc.title}" a été restauré depuis les archives` })
        await fetchArchives()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la restauration')
      }
    } catch {
      toast.error('Erreur lors de la restauration')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveDestruction = async () => {
    if (!selectedDoc || destructionReason.length < 10) return
    setActionLoading(selectedDoc.id)
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/approve-destruction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: selectedDoc.reference, reason: destructionReason }),
      })
      if (res.ok) {
        setApproveDestructionOpen(false)
        setSelectedDoc(null)
        setDestructionReason('')
        toast.success('Destruction approuvée', { description: 'Le document est maintenant éligible pour la destruction' })
        await fetchArchives()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de l\'approbation')
      }
    } catch {
      toast.error('Erreur lors de l\'approbation')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDestroy = async () => {
    if (!selectedDoc || destroyConfirmation !== selectedDoc.reference) return
    setActionLoading(selectedDoc.id)
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/destroy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: selectedDoc.reference }),
      })
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== selectedDoc.id))
        setDestroyDialogOpen(false)
        setSelectedDoc(null)
        setDestroyConfirmation('')
        toast.success('Document détruit', { description: 'Le document a été définitivement détruit' })
        await fetchArchives()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la destruction')
      }
    } catch {
      toast.error('Erreur lors de la destruction')
    } finally {
      setActionLoading(null)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Ko'
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / 1048576).toFixed(1)} Mo`
  }

  // Loading skeleton
  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <div className="skeleton h-8 w-40 mb-2" />
          <div className="skeleton h-4 w-60" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="pt-6"><div className="skeleton h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 py-3 px-4">
            <div className="skeleton h-4 w-8" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Archive className="h-7 w-7 text-teal-600" />
          Archives
        </h1>
        <p className="text-muted-foreground mt-1">Gérez les documents archivés et leur cycle de vie</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover animate-fade-in-up stagger-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total archivés</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center">
                <Archive className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover animate-fade-in-up stagger-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Espace archives</p>
                <p className="text-2xl font-bold mt-1">{formatSize(stats.totalSize)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover animate-fade-in-up stagger-3">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destruction en attente</p>
                <p className="text-2xl font-bold mt-1">{stats.pendingDestruction}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover animate-fade-in-up stagger-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rétention expirée</p>
                <p className="text-2xl font-bold mt-1">{stats.expiredRetention}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les archives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 input-premium"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClassification} onValueChange={setFilterClassification}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(classificationLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Archives List */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="empty-state-icon">
              <Archive className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mt-2">Aucun document archivé</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              Les documents archivés apparaîtront ici lorsque leur cycle de vie atteindra l&apos;étape d&apos;archivage.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc, idx) => (
            <Card
              key={doc.id}
              className={cn("card-interactive animate-fade-in-up", "stagger-" + ((idx % 8) + 1))}
              onClick={() => { setSelectedDoc(doc) }}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">{doc.reference}</span>
                    {doc.archiveRef && <span className="text-xs text-teal-600 dark:text-teal-400 font-mono">Ref. archive: {doc.archiveRef}</span>}
                    <span className="text-xs text-muted-foreground">{(typeLabels as Record<string, string>)[doc.type]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium badge-premium",
                    (classificationColors as Record<string, string>)[doc.classification]
                  )}>
                    {(classificationLabels as Record<string, string>)[doc.classification]}
                  </span>
                  {doc.destructionApproved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" /> Destruction approuvée
                    </span>
                  )}
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 btn-premium"
                      onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setRestoreDialogOpen(true) }}
                      title="Restaurer"
                    >
                      <RotateCcw className="h-4 w-4 text-teal-600" />
                    </Button>
                    {!doc.destructionApproved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 btn-premium"
                        onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setApproveDestructionOpen(true) }}
                        title="Approuver destruction"
                      >
                        <CheckCircle className="h-4 w-4 text-amber-600" />
                      </Button>
                    )}
                    {doc.destructionApproved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 btn-premium"
                        onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setDestroyDialogOpen(true) }}
                        title="Détruire"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-premium">
              Précédent
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-premium">
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <RotateCcw className="h-5 w-5" />
              Restaurer le document
            </DialogTitle>
            <DialogDescription>
              Le document sera restauré à son statut précédent l&apos;archivage.
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="py-3 px-4 bg-teal-50 dark:bg-teal-950/30 rounded-lg text-sm">
              <p className="font-medium">{selectedDoc.title}</p>
              <p className="text-muted-foreground text-xs mt-1">{selectedDoc.reference}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)} className="btn-premium">Annuler</Button>
            <Button onClick={handleRestore} disabled={actionLoading === selectedDoc?.id} className="btn-premium bg-teal-600 hover:bg-teal-700">
              {actionLoading === selectedDoc?.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Destruction Dialog */}
      <Dialog open={approveDestructionOpen} onOpenChange={setApproveDestructionOpen}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              Approuver la destruction
            </DialogTitle>
            <DialogDescription>
              Approuvez la destruction contrôlée de ce document. Un motif est obligatoire (min. 10 caractères).
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="py-3 px-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
              <p className="font-medium">{selectedDoc.title}</p>
              <p className="text-muted-foreground text-xs mt-1">{selectedDoc.reference}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Motif de destruction</Label>
            <Textarea
              placeholder="Décrivez le motif de la destruction..."
              value={destructionReason}
              onChange={(e) => setDestructionReason(e.target.value)}
              rows={3}
              className="input-premium"
            />
            {destructionReason.length > 0 && destructionReason.length < 10 && (
              <p className="text-xs text-amber-600">Minimum 10 caractères ({destructionReason.length}/10)</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveDestructionOpen(false); setDestructionReason('') }} className="btn-premium">Annuler</Button>
            <Button
              onClick={handleApproveDestruction}
              disabled={actionLoading === selectedDoc?.id || destructionReason.length < 10}
              className="btn-premium bg-amber-600 hover:bg-amber-700"
            >
              {actionLoading === selectedDoc?.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approuver la destruction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destroy Dialog */}
      <Dialog open={destroyDialogOpen} onOpenChange={setDestroyDialogOpen}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <Trash2 className="h-5 w-5" />
              Détruire le document
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le document sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="py-3 px-4 bg-red-50 dark:bg-red-950/30 rounded-lg text-sm">
              <p className="font-medium">{selectedDoc.title}</p>
              <p className="text-muted-foreground text-xs mt-1">{selectedDoc.reference}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tapez <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{selectedDoc?.reference}</code> pour confirmer
            </Label>
            <Input
              placeholder={selectedDoc?.reference}
              value={destroyConfirmation}
              onChange={(e) => setDestroyConfirmation(e.target.value)}
              className="input-premium"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDestroyDialogOpen(false); setDestroyConfirmation('') }} className="btn-premium">Annuler</Button>
            <Button
              variant="destructive"
              onClick={handleDestroy}
              disabled={actionLoading === selectedDoc?.id || destroyConfirmation !== selectedDoc?.reference}
              className="btn-premium"
            >
              {actionLoading === selectedDoc?.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Détruire définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}