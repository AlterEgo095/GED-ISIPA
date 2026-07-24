'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, FileText, Download, Archive, RotateCcw, CheckCircle, XCircle, Send, Clock, 
  User, Building2, Trash2, AlertTriangle, Shield, Loader2, RefreshCw, Globe, Eye, Edit,
  ThumbsUp, MessageSquare
} from 'lucide-react'
import { statusLabels, statusColors, classificationLabels, classificationColors, typeLabels } from '@/lib/constants'
import { toast } from 'sonner'
import { LIFECYCLE_STEPS, getLifecycleStep, getLifecyclePhase } from '@/lib/document-lifecycle'
import type { DocumentStatus, Classification, DocumentType } from '@prisma/client'

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [approveDestructionOpen, setApproveDestructionOpen] = useState(false)
  const [destroyDialogOpen, setDestroyDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [requestRevisionOpen, setRequestRevisionOpen] = useState(false)

  const [actionLoading, setActionLoading] = useState(false)
  const [destructionReason, setDestructionReason] = useState('')
  const [destroyConfirmation, setDestroyConfirmation] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [revisionComment, setRevisionComment] = useState('')

  useEffect(() => {
    if (params.id) {
      fetch(`/api/documents/${params.id}`)
        .then(res => res.json())
        .then(data => setDocument(data))
        .finally(() => setLoading(false))
    }
  }, [params.id])

  const handleAction = async (action: string, body?: Record<string, unknown>) => {
    if (!params.id) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/documents/${params.id}/${action}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.ok) {
        const data = await res.json()
        setDocument(data.document || data)
        // Close any open dialog
        setArchiveDialogOpen(false)
        setRestoreDialogOpen(false)
        setDeleteDialogOpen(false)
        setApproveDestructionOpen(false)
        setDestroyDialogOpen(false)
        setRejectDialogOpen(false)
        setRequestRevisionOpen(false)
        setDestructionReason('')
        setDestroyConfirmation('')
        setRejectReason('')
        setRevisionComment('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de l\'action')
      }
    } catch {
      toast.error('Erreur lors de l\'action')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (!document) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Document introuvable</p></div>
  }

  const doc = document as Record<string, any>
  const author = doc.author as Record<string, string> | null
  const department = doc.department as Record<string, string> | null
  const currentStep = getLifecycleStep(doc.status as DocumentStatus)

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{doc.title as string}</h1>
          <p className="text-muted-foreground">{doc.reference as string}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Lifecycle action buttons */}
          {(doc.status === 'DRAFT' || doc.status === 'REJECTED' || doc.status === 'PENDING_REVISION') && (
            <Button variant="outline" onClick={() => handleAction('submit')} disabled={actionLoading}>
              <Send className="h-4 w-4 mr-2" /> Soumettre
            </Button>
          )}
          {(doc.status === 'PENDING_REVIEW' || doc.status === 'IN_REVIEW' || doc.status === 'PENDING_APPROVAL') && (
            <>
              <Button onClick={() => handleAction('approve')} disabled={actionLoading}>
                <CheckCircle className="h-4 w-4 mr-2" /> Approuver
              </Button>
              <Button variant="destructive" onClick={() => setRejectDialogOpen(true)} disabled={actionLoading}>
                <XCircle className="h-4 w-4 mr-2" /> Rejeter
              </Button>
              <Button variant="outline" onClick={() => setRequestRevisionOpen(true)} disabled={actionLoading}>
                <RefreshCw className="h-4 w-4 mr-2" /> Demander révision
              </Button>
            </>
          )}
          {doc.status === 'APPROVED' && (
            <Button onClick={() => handleAction('publish')} disabled={actionLoading}>
              <Globe className="h-4 w-4 mr-2" /> Publier
            </Button>
          )}
          {doc.status === 'PUBLISHED' && (
            <Button variant="outline" onClick={() => handleAction('unpublish')} disabled={actionLoading}>
              <Eye className="h-4 w-4 mr-2" /> Dépublier
            </Button>
          )}
          {!doc.isArchived && !doc.isDeleted && ['PUBLISHED', 'APPROVED', 'REJECTED'].includes(doc.status) && (
            <Button variant="outline" onClick={() => setArchiveDialogOpen(true)} disabled={actionLoading}>
              <Archive className="h-4 w-4 mr-2" /> Archiver
            </Button>
          )}
          {doc.isArchived && !doc.destructionApproved && (
            <Button variant="outline" onClick={() => setRestoreDialogOpen(true)} disabled={actionLoading}>
              <RotateCcw className="h-4 w-4 mr-2" /> Restaurer
            </Button>
          )}
          {doc.isArchived && !doc.destructionApproved && (
            <Button variant="destructive" onClick={() => setApproveDestructionOpen(true)} disabled={actionLoading}>
              <Shield className="h-4 w-4 mr-2" /> Approuver destruction
            </Button>
          )}
          {doc.isArchived && doc.destructionApproved && (
            <>
              <Button variant="outline" onClick={() => setRestoreDialogOpen(true)} disabled={actionLoading}>
                <RotateCcw className="h-4 w-4 mr-2" /> Restaurer
              </Button>
              <Button variant="destructive" onClick={() => setDestroyDialogOpen(true)} disabled={actionLoading}>
                <Trash2 className="h-4 w-4 mr-2" /> Détruire
              </Button>
            </>
          )}
          {!doc.isDeleted && !doc.isArchived && doc.status !== 'DESTROYED' && (
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(true)} disabled={actionLoading} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          )}
          <Button variant="outline" onClick={() => window.open(`/api/documents/${params.id}/download`, '_blank')} disabled={actionLoading}>
            <Download className="h-4 w-4 mr-2" /> Télécharger
          </Button>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {LIFECYCLE_STEPS.map((step) => (
              <div key={step.step} className="flex flex-col items-center flex-1">
                <div className={`h-3 w-3 rounded-full mb-1 ${
                  step.step < currentStep ? 'bg-emerald-500' : 
                  step.step === currentStep ? 'bg-teal-500 ring-2 ring-teal-200' : 
                  'bg-gray-200 dark:bg-gray-700'
                }`} />
                <span className={`text-[10px] text-center leading-tight ${
                  step.step === currentStep ? 'font-semibold text-teal-700 dark:text-teal-300' : 'text-muted-foreground'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 btn-premium"><FileText className="h-5 w-5" /> Détails du document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {doc.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1">{doc.description as string}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tags</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(doc.tags as string || '').split(',').filter(Boolean).map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag.trim()}</Badge>
                  ))}
                </div>
              </div>
              {doc.isArchived && doc.archiveRef && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
                  <p className="text-sm font-medium">Référence d'archive</p>
                  <p className="text-xs font-mono">{doc.archiveRef as string}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Archivé le: {doc.archivedAt ? new Date(doc.archivedAt as string).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
              )}
              {doc.destructionApproved && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Destruction approuvée
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce document est en attente de destruction contrôlée
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 btn-premium"><Clock className="h-5 w-5" /> Historique des versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Version actuelle: {doc.version as number}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 btn-premium"><MessageSquare className="h-5 w-5" /> Commentaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {doc.reviewComment ? doc.reviewComment as string : 'Aucun commentaire'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6 page-enter">
          <Card>
            <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Phase actuelle</p>
                <p className="text-sm font-medium">{getLifecyclePhase(doc.status as DocumentStatus)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Statut</p>
                <Badge className={statusColors[doc.status as DocumentStatus]}>
                  {statusLabels[doc.status as DocumentStatus]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Classification</p>
                <Badge className={classificationColors[doc.classification as Classification]}>
                  {classificationLabels[doc.classification as Classification]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm">{typeLabels[doc.type as DocumentType] || (doc.type as string)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Auteur</p>
                <p className="text-sm">{author?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Département</p>
                <p className="text-sm">{department?.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Créé le</p>
                <p className="text-sm">{new Date(doc.createdAt as string).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modifié le</p>
                <p className="text-sm">{new Date(doc.updatedAt as string).toLocaleDateString('fr-FR')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Archive Info Card */}
          {doc.isArchived && (
            <Card className="border-slate-300 dark:border-slate-700">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Archive className="h-4 w-4" /> Données d'archive</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Réf. archive</p><p className="font-mono">{doc.archiveRef || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground">Date d'archivage</p><p>{doc.archivedAt ? new Date(doc.archivedAt as string).toLocaleDateString('fr-FR') : 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground">Période de rétention</p><p>{doc.retentionPeriod ? `${doc.retentionPeriod} mois` : 'Non définie'}</p></div>
                <div><p className="text-xs text-muted-foreground">Date d'expiration</p><p>{doc.expiresAt ? new Date(doc.expiresAt as string).toLocaleDateString('fr-FR') : 'N/A'}</p></div>
                <Separator />
                <div><p className="text-xs text-muted-foreground">Destruction approuvée</p><Badge variant={doc.destructionApproved ? 'destructive' : 'outline'}>{doc.destructionApproved ? 'Oui' : 'Non'}</Badge></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* DIALOGS */}

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 btn-premium"><Archive className="h-5 w-5" /> Archiver le document</DialogTitle>
            <DialogDescription>Le document sera archivé avec une référence unique et entrera en période de conservation.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Cette action changera le statut du document à « Archivé ». Le document pourra être restauré ultérieurement ou détruit après approbation.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => handleAction('archive')} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
              Archiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 btn-premium"><RotateCcw className="h-5 w-5" /> Restaurer le document</DialogTitle>
            <DialogDescription>Le document sera restauré vers son statut précédent l'archivage.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Le document retrouvera son statut de publication et sera à nouveau accessible.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => handleAction('restore')} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Soft Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 btn-premium"><Trash2 className="h-5 w-5 text-red-600" /> Supprimer le document</DialogTitle>
            <DialogDescription>Le document sera placé en corbeille (suppression logique). Il pourra être restauré dans les 30 jours.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={() => handleAction('soft-delete')} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Mettre en corbeille
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Destruction Dialog */}
      <Dialog open={approveDestructionOpen} onOpenChange={setApproveDestructionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><Shield className="h-5 w-5" /> Approuver la destruction</DialogTitle>
            <DialogDescription>Approbation formelle. Séparation des responsabilités: vous ne pouvez pas approuver si vous avez archivé ce document.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">Après approbation, le document pourra être détruit définitivement.</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Raison (min. 10 caractères) *</p>
              <Textarea value={destructionReason} onChange={(e) => setDestructionReason(e.target.value)} placeholder="Raison de la destruction..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveDestructionOpen(false); setDestructionReason('') }}>Annuler</Button>
            <Button variant="destructive" onClick={() => handleAction('approve-destruction', { confirmation: doc.reference, reason: destructionReason })} disabled={destructionReason.length < 10 || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
              Approuver la destruction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destroy Dialog */}
      <Dialog open={destroyDialogOpen} onOpenChange={setDestroyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /> Destruction contrôlée</DialogTitle>
            <DialogDescription>Destruction définitive et irréversible du document.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">IRRÉVERSIBLE. Le fichier physique et les métadonnées seront définitivement supprimés.</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Tapez <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">{doc.reference}</code> pour confirmer:</p>
              <Input value={destroyConfirmation} onChange={(e) => setDestroyConfirmation(e.target.value)} placeholder={doc.reference} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDestroyDialogOpen(false); setDestroyConfirmation('') }}>Annuler</Button>
            <Button variant="destructive" onClick={() => handleAction('destroy', { confirmation: destroyConfirmation })} disabled={destroyConfirmation !== doc.reference || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Détruire définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 btn-premium"><XCircle className="h-5 w-5 text-red-600" /> Rejeter le document</DialogTitle>
            <DialogDescription>Le document sera rejeté avec un motif obligatoire.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Motif du rejet *</p>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Motif du rejet..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectReason('') }}>Annuler</Button>
            <Button variant="destructive" onClick={() => handleAction('reject', { reason: rejectReason })} disabled={!rejectReason || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog open={requestRevisionOpen} onOpenChange={setRequestRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 btn-premium"><RefreshCw className="h-5 w-5" /> Demander une révision</DialogTitle>
            <DialogDescription>Le document retournera en brouillon pour modifications.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Commentaire de révision *</p>
              <Textarea value={revisionComment} onChange={(e) => setRevisionComment(e.target.value)} placeholder="Modifications demandées..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRequestRevisionOpen(false); setRevisionComment('') }}>Annuler</Button>
            <Button onClick={() => handleAction('request-revision', { comment: revisionComment })} disabled={!revisionComment || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Demander révision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}