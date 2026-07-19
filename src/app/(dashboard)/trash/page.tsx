'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { 
  Trash2, RotateCcw, Search, MoreHorizontal, AlertTriangle, 
  FileText, Clock, HardDrive, Loader2, XCircle, Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { statusLabels, statusColors, classificationLabels, classificationColors, typeLabels } from '@/lib/constants'
import type { DocumentStatus, Classification, DocumentType } from '@prisma/client'

interface TrashDocument {
  id: string
  title: string
  reference: string
  type: DocumentType
  status: DocumentStatus
  classification: Classification
  version: number
  fileSize: number
  deletedAt: string
  deletedBy: string
  createdAt: string
  author: { id: string; name: string; email: string; role: string }
  department: { id: string; name: string; code: string }
  folder?: { id: string; name: string } | null
}

interface TrashStats {
  totalDocuments: number
  totalSize: number
  approachingPurge: number
  retentionDays: number
}

export default function TrashPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<TrashDocument[]>([])
  const [stats, setStats] = useState<TrashStats>({ totalDocuments: 0, totalSize: 0, approachingPurge: 0, retentionDays: 30 })
  const [deleters, setDeleters] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterClassification, setFilterClassification] = useState('all')
  const [filterDeleter, setFilterDeleter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Dialogs
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false)
  const [purgeAction, setPurgeAction] = useState<'empty' | 'purge-expired' | 'purge-selected'>('empty')
  const [purgeConfirm, setPurgeConfirm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTrash = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search ? { search } : {}),
        ...(filterType !== 'all' ? { type: filterType } : {}),
        ...(filterClassification !== 'all' ? { classification: filterClassification } : {}),
        ...(filterDeleter !== 'all' ? { deletedBy: filterDeleter } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      })
      const res = await fetch(`/api/documents/trash?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
        setTotalPages(data.pagination?.pages || 1)
        setStats(data.stats || { totalDocuments: 0, totalSize: 0, approachingPurge: 0, retentionDays: 30 })
        setDeleters(data.deleters || [])
      }
    } catch (error) {
      console.error('Failed to fetch trash:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterType, filterClassification, filterDeleter, dateFrom, dateTo])

  useEffect(() => {
    fetchTrash()
  }, [fetchTrash])

  const handleRestore = async (docId: string) => {
    setActionLoading(docId)
    try {
      const res = await fetch(`/api/documents/${docId}/restore-deleted`, { method: 'POST' })
      if (res.ok) {
        setSelectedIds(prev => { const n = new Set(prev); n.delete(docId); return n })
        await fetchTrash()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la restauration')
      }
    } catch (error) {
      toast.error('Erreur lors de la restauration')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePermanentDelete = async (docId: string) => {
    if (!confirm('Supprimer définitivement ce document? Cette action est irréversible.')) return
    setActionLoading(docId)
    try {
      const res = await fetch(`/api/documents/${docId}/permanent`, { method: 'DELETE' })
      if (res.ok) {
        setSelectedIds(prev => { const n = new Set(prev); n.delete(docId); return n })
        await fetchTrash()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      alert('Erreur lors de la suppression définitive')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return
    for (const docId of Array.from(selectedIds)) {
      await fetch(`/api/documents/${docId}/restore-deleted`, { method: 'POST' })
    }
    setSelectedIds(new Set())
    await fetchTrash()
  }

  const handlePurge = async () => {
    if (purgeConfirm !== 'PURGE_CONFIRM') {
      alert('Tapez PURGE_CONFIRM pour confirmer')
      return
    }
    setActionLoading('purge')
    try {
      const body: Record<string, unknown> = { 
        action: purgeAction, 
        confirmation: purgeConfirm 
      }
      if (purgeAction === 'purge-selected') {
        body.documentIds = Array.from(selectedIds)
      }
      const res = await fetch('/api/documents/trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        setSelectedIds(new Set())
        setPurgeDialogOpen(false)
        setPurgeConfirm('')
        await fetchTrash()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la purge')
      }
    } catch (error) {
      alert('Erreur lors de la purge')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)))
      setSelectAll(true)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  const getDaysInTrash = (deletedAt: string) => {
    const diff = Date.now() - new Date(deletedAt).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  const isApproachingPurge = (deletedAt: string) => {
    return getDaysInTrash(deletedAt) >= 25 // Warning at 25 days
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Corbeille
          </h1>
          <p className="text-muted-foreground">
            Documents supprimés · Rétention: {stats.retentionDays} jours
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkRestore}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurer ({selectedIds.size})
              </Button>
              <Button variant="destructive" size="sm" onClick={() => {
                setPurgeAction('purge-selected')
                setPurgeDialogOpen(true)
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
            </>
          )}
          {stats.approachingPurge > 0 && (
            <Button variant="outline" size="sm" onClick={() => {
              setPurgeAction('purge-expired')
              setPurgeDialogOpen(true)
            }}>
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Purger expirés ({stats.approachingPurge})
            </Button>
          )}
          {stats.totalDocuments > 0 && (
            <Button variant="destructive" size="sm" onClick={() => {
              setPurgeAction('empty')
              setPurgeDialogOpen(true)
            }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Vider la corbeille
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Trash2 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <HardDrive className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                <p className="text-xs text-muted-foreground">Espace utilisé</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approachingPurge}</p>
                <p className="text-xs text-muted-foreground">À purger bientôt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.retentionDays}j</p>
                <p className="text-xs text-muted-foreground">Rétention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans la corbeille..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClassification} onValueChange={(v) => { setFilterClassification(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(classificationLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {deleters.length > 0 && (
          <Select value={filterDeleter} onValueChange={(v) => { setFilterDeleter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Supprimé par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {deleters.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Date filter */}
      <div className="flex gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="w-40" placeholder="Du" />
        <span className="text-muted-foreground">—</span>
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="w-40" placeholder="Au" />
        {(dateFrom || dateTo || search || filterType !== 'all' || filterClassification !== 'all' || filterDeleter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => {
            setSearch(''); setFilterType('all'); setFilterClassification('all'); setFilterDeleter('all'); setDateFrom(''); setDateTo(''); setPage(1)
          }}>
            <XCircle className="h-4 w-4 mr-1" /> Réinitialiser
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input 
                      type="checkbox" 
                      checked={selectAll && documents.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Classification</TableHead>
                  <TableHead>Jours en corbeille</TableHead>
                  <TableHead className="hidden md:table-cell">Supprimé par</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      La corbeille est vide
                    </TableCell>
                  </TableRow>
                )}
                {documents.map((doc) => {
                  const daysInTrash = getDaysInTrash(doc.deletedAt)
                  const approaching = isApproachingPurge(doc.deletedAt)
                  return (
                    <TableRow key={doc.id} className={approaching ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                      <TableCell>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(doc.id)}
                          onChange={() => toggleSelect(doc.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.reference} · {formatFileSize(doc.fileSize)}</p>
                          {doc.folder && (
                            <p className="text-xs text-muted-foreground">📁 {doc.folder.name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm">{typeLabels[doc.type] || doc.type}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge className={classificationColors[doc.classification]}>
                          {classificationLabels[doc.classification]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${approaching ? 'text-amber-600 font-semibold' : ''}`}>
                            {daysInTrash}j
                          </span>
                          {approaching && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {doc.author?.name || 'Inconnu'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actionLoading === doc.id}>
                              {actionLoading === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRestore(doc.id)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restaurer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handlePermanentDelete(doc.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer définitivement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Suivant
          </Button>
        </div>
      )}

      {/* Purge Confirmation Dialog */}
      <Dialog open={purgeDialogOpen} onOpenChange={setPurgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {purgeAction === 'empty' ? 'Vider la corbeille' 
                : purgeAction === 'purge-expired' ? 'Purger les documents expirés'
                : 'Supprimer les documents sélectionnés'}
            </DialogTitle>
            <DialogDescription>
              {purgeAction === 'empty' 
                ? `Cette action supprimera DÉFINITIVEMENT tous les ${stats.totalDocuments} documents de la corbeille. Cette action est IRRÉVERSIBLE.`
                : purgeAction === 'purge-expired'
                ? `Cette action supprimera DÉFINITIVEMENT ${stats.approachingPurge} document(s) en corbeille depuis plus de ${stats.retentionDays} jours. Cette action est IRRÉVERSIBLE.`
                : `Cette action supprimera DÉFINITIVEMENT ${selectedIds.size} document(s) sélectionné(s). Cette action est IRRÉVERSIBLE.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                ⚠️ Les fichiers physiques et toutes les métadonnées seront définitivement supprimés.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">
                Tapez <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-mono">PURGE_CONFIRM</code> pour confirmer:
              </p>
              <Input 
                value={purgeConfirm}
                onChange={(e) => setPurgeConfirm(e.target.value)}
                placeholder="PURGE_CONFIRM"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPurgeDialogOpen(false); setPurgeConfirm('') }}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handlePurge}
              disabled={purgeConfirm !== 'PURGE_CONFIRM' || actionLoading === 'purge'}
            >
              {actionLoading === 'purge' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Confirmer la suppression définitive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
