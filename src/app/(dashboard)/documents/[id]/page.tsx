'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, FileText, Download, Archive, CheckCircle, XCircle, Send, 
  Clock, User, Building2, Shield, Globe, Trash2, Eye, Edit3, RefreshCw,
  FolderOpen, Search, ChevronRight, AlertTriangle, Undo2, FileCheck
} from 'lucide-react'
import { statusLabels, statusColors, classificationLabels, classificationColors, typeLabels } from '@/lib/constants'
import type { DocumentStatus, Classification, DocumentType } from '@prisma/client'
import {
  type LifecycleTransition,
  LIFECYCLE_STEPS,
  STATUS_DESCRIPTIONS,
  getLifecycleStep,
} from '@/lib/document-lifecycle'

interface LifecycleStep {
  step: number
  key: string
  label: string
  statuses: DocumentStatus[]
  icon: string
  completed: boolean
  current: boolean
}

interface AuditEntry {
  id: string
  action: string
  details: string
  createdAt: string
  user: { id: string; name: string; email: string; role: string }
}

interface DocumentDetail {
  id: string
  title: string
  reference: string
  description?: string
  type: DocumentType
  status: DocumentStatus
  classification: Classification
  version: number
  tags: string
  isArchived: boolean
  isDeleted: boolean
  destructionApproved: boolean
  retentionPolicy?: string
  destroyAt?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  reviewComment?: string
  author: { id: string; name: string; email: string }
  department: { id: string; name: string; code: string }
  workflowState?: { id: string; name: string; color: string } | null
  versions: Array<{ id: string; version: number; changeType: string; changeLog?: string; createdAt: string; createdBy: string }>
  fileHash: string
  fileSize: number
  fileName: string
  mimeType: string
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<DocumentDetail | null>(null)
  const [lifecycleData, setLifecycleData] = useState<{
    currentStep: number
    currentPhase: string
    availableTransitions: LifecycleTransition[]
    lifecycleSteps: LifecycleStep[]
    auditTimeline: AuditEntry[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'lifecycle' | 'history'>('details')

  const fetchDocument = useCallback(async () => {
    if (!params.id) return
    try {
      const [docRes, lifecycleRes] = await Promise.all([
        fetch(`/api/documents/${params.id}`),
        fetch(`/api/documents/${params.id}/lifecycle`),
      ])
      if (docRes.ok) {
        const docData = await docRes.json()
        setDocument(docData)
      }
      if (lifecycleRes.ok) {
        const lifecycleData = await lifecycleRes.json()
        setLifecycleData(lifecycleData)
      }
    } catch (error) {
      console.error('Failed to fetch document:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  const handleAction = async (action: string, body?: Record<string, unknown>) => {
    if (!params.id) return
    setActionLoading(action)
    try {
      const res = await fetch(`/api/documents/${params.id}/${action}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.ok) {
        await fetchDocument()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de l\'action')
      }
    } catch (error) {
      console.error('Action error:', error)
      alert('Erreur lors de l\'action')
    } finally {
      setActionLoading(null)
    }
  }

  const getStepIcon = (iconName: string, completed: boolean, current: boolean) => {
    const iconClass = `h-5 w-5 ${completed ? 'text-emerald-500' : current ? 'text-amber-500' : 'text-gray-300'}`
    switch (iconName) {
      case 'FilePlus': return <FileText className={iconClass} />
      case 'FolderOpen': return <FolderOpen className={iconClass} />
      case 'Search': return <Search className={iconClass} />
      case 'CheckSquare': return <FileCheck className={iconClass} />
      case 'RefreshCw': return <RefreshCw className={iconClass} />
      case 'Shield': return <Shield className={iconClass} />
      case 'Globe': return <Globe className={iconClass} />
      case 'Archive': return <Archive className={iconClass} />
      case 'Clock': return <Clock className={iconClass} />
      case 'Trash2': return <Trash2 className={iconClass} />
      default: return <FileText className={iconClass} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Chargement du document...</div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Document introuvable</p>
      </div>
    )
  }

  const doc = document
  const currentStatus = doc.status as DocumentStatus

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{doc.title}</h1>
            <Badge className={statusColors[currentStatus]}>
              {statusLabels[currentStatus]}
            </Badge>
            <Badge className={classificationColors[doc.classification]}>
              {classificationLabels[doc.classification]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{doc.reference} · v{doc.version}</p>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      {lifecycleData && (
        <Card>
          <CardContent className="py-4 px-6">
            <div className="flex items-center justify-between">
              {lifecycleData.lifecycleSteps.map((step, idx) => (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 
                      ${step.completed && !step.current 
                        ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30' 
                        : step.current 
                          ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/30' 
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }
                    `}>
                      {getStepIcon(step.icon, step.completed, step.current)}
                    </div>
                    <span className={`
                      text-xs mt-1 text-center max-w-[80px] 
                      ${step.current ? 'font-semibold text-amber-700 dark:text-amber-400' 
                        : step.completed ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-gray-400 dark:text-gray-600'}
                    `}>
                      {step.label}
                    </span>
                  </div>
                  {idx < lifecycleData.lifecycleSteps.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-2 mt-[-16px]
                      ${step.completed ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b pb-1">
        <Button 
          variant={activeTab === 'details' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setActiveTab('details')}
        >
          Détails
        </Button>
        <Button 
          variant={activeTab === 'lifecycle' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setActiveTab('lifecycle')}
        >
          Cycle de vie
        </Button>
        <Button 
          variant={activeTab === 'history' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setActiveTab('history')}
        >
          Historique
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Détails du document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doc.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="mt-1">{doc.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fichier</p>
                  <p className="mt-1 text-sm">{doc.fileName} · {(doc.fileSize / 1024).toFixed(1)} Ko</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tags</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {doc.tags.split(',').filter(Boolean).map((tag: string) => (
                      <Badge key={tag} variant="outline">{tag.trim()}</Badge>
                    ))}
                    {(!doc.tags || doc.tags.split(',').filter(Boolean).length === 0) && (
                      <span className="text-sm text-muted-foreground">Aucun tag</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <div className="mt-1">
                    <Badge className={statusColors[currentStatus]}>
                      {statusLabels[currentStatus]}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {STATUS_DESCRIPTIONS[currentStatus]}
                    </p>
                  </div>
                </div>
                {doc.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Motif du rejet</p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">{doc.rejectionReason}</p>
                  </div>
                )}
                {doc.reviewComment && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Commentaire de révision</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{doc.reviewComment}</p>
                  </div>
                )}
                {doc.isArchived && doc.destructionApproved && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Destruction approuvée — ce document peut être détruit
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Actions */}
            {lifecycleData && lifecycleData.availableTransitions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ChevronRight className="h-5 w-5" />
                    Actions disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lifecycleData.availableTransitions.map((transition) => {
                      const isLoading = actionLoading === transition.action
                      return (
                        <Button
                          key={transition.action}
                          variant={transition.to === 'REJECTED' || transition.to === 'DESTROYED' ? 'destructive' : 'outline'}
                          size="sm"
                          disabled={isLoading}
                          onClick={() => {
                            if (transition.requireBody && transition.action === 'reject') {
                              const reason = prompt('Motif du rejet (obligatoire):')
                              if (!reason) return
                              handleAction(transition.action, { reason })
                            } else if (transition.requireBody && transition.action === 'request-revision') {
                              const comment = prompt('Commentaire de révision (obligatoire):')
                              if (!comment) return
                              handleAction(transition.action, { comment })
                            } else if (transition.requireBody && transition.action === 'destroy') {
                              const confirmation = prompt(`Tapez la référence "${doc.reference}" pour confirmer la destruction:`)
                              if (confirmation !== doc.reference) {
                                alert('La confirmation ne correspond pas à la référence du document')
                                return
                              }
                              handleAction(transition.action, { confirmation })
                            } else if (transition.requireBody && transition.action === 'approve-destruction') {
                              const reason = prompt('Raison de l\'approbation de destruction (min 10 caractères):')
                              if (!reason || reason.length < 10) {
                                alert('La raison doit contenir au moins 10 caractères')
                                return
                              }
                              handleAction(transition.action, { confirmation: doc.reference, reason })
                            } else if (transition.action === 'unpublish') {
                              const reason = prompt('Raison de la dépublication (optionnel):')
                              handleAction(transition.action, { reason })
                            } else {
                              handleAction(transition.action)
                            }
                          }}
                          title={transition.description}
                        >
                          {isLoading ? '...' : transition.label}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Historique des versions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {doc.versions && doc.versions.length > 0 ? (
                  <div className="space-y-3">
                    {doc.versions.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 text-sm">
                        <Badge variant="outline">v{v.version}</Badge>
                        <span className="text-muted-foreground">{v.changeType}</span>
                        {v.changeLog && <span>— {v.changeLog}</span>}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(v.createdAt).toLocaleDateString('fr-FR', { 
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Version actuelle: {doc.version}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm">{typeLabels[doc.type] || doc.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Auteur
                  </p>
                  <p className="text-sm">{doc.author?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Département
                  </p>
                  <p className="text-sm">{doc.department?.name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Créé le</p>
                  <p className="text-sm">{new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modifié le</p>
                  <p className="text-sm">{new Date(doc.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                {doc.retentionPolicy && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Politique de rétention</p>
                      <p className="text-sm">{doc.retentionPolicy}</p>
                    </div>
                    {doc.destroyAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">Date de destruction prévue</p>
                        <p className="text-sm">{new Date(doc.destroyAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}
                  </>
                )}
                {doc.reviewedBy && (
                  <div>
                    <p className="text-xs text-muted-foreground">Révisé par</p>
                    <p className="text-sm">{doc.reviewedBy}</p>
                  </div>
                )}
                {doc.archivedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Archivé le</p>
                    <p className="text-sm">{new Date(doc.archivedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Empreinte numérique</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">{doc.fileHash}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAction('download')}>
                  <Download className="h-4 w-4 mr-2" /> Télécharger
                </Button>
                {(currentStatus === 'DRAFT' || currentStatus === 'PENDING_REVISION') && (
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAction('classify')}>
                    <FolderOpen className="h-4 w-4 mr-2" /> Classifier
                  </Button>
                )}
                {(currentStatus === 'DRAFT' || currentStatus === 'PENDING_REVISION') && (
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAction('index')}>
                    <Search className="h-4 w-4 mr-2" /> Indexer
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Lifecycle Tab */}
      {activeTab === 'lifecycle' && lifecycleData && (
        <Card>
          <CardHeader>
            <CardTitle>Cycle de vie du document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lifecycleData.lifecycleSteps.map((step, idx) => {
                const isLast = idx === lifecycleData.lifecycleSteps.length - 1
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`
                        flex items-center justify-center w-12 h-12 rounded-full border-2 
                        ${step.completed && !step.current 
                          ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30' 
                          : step.current 
                            ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/30 ring-2 ring-amber-200' 
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                        }
                      `}>
                        {getStepIcon(step.icon, step.completed, step.current)}
                      </div>
                      {!isLast && (
                        <div className={`
                          w-0.5 flex-1 my-1 min-h-[20px]
                          ${step.completed ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}
                        `} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${step.current ? 'text-amber-700 dark:text-amber-400' : step.completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400'}`}>
                          Étape {step.step}: {step.label}
                        </h3>
                        {step.current && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-xs">
                            En cours
                          </Badge>
                        )}
                        {step.completed && !step.current && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                            Complété
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Statuts: {step.statuses.map(s => statusLabels[s as DocumentStatus]).join(', ')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Available Transitions from current state */}
            <Separator className="my-6" />
            <div>
              <h3 className="font-medium mb-3">Transitions disponibles</h3>
              {lifecycleData.availableTransitions.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {lifecycleData.availableTransitions.map((t) => (
                    <div key={t.action} className="border rounded-md p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{t.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                      <div className="flex gap-1 mt-2">
                        {t.from.map(from => (
                          <Badge key={from} variant="outline" className="text-xs">{statusLabels[from as DocumentStatus]}</Badge>
                        ))}
                        <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                        <Badge variant="outline" className="text-xs">{statusLabels[t.to as DocumentStatus]}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune transition disponible dans le statut actuel.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && lifecycleData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Journal d&apos;audit du document
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lifecycleData.auditTimeline.length > 0 ? (
              <div className="space-y-3">
                {lifecycleData.auditTimeline.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-400 mt-1.5" />
                      {idx < lifecycleData.auditTimeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{entry.action}</Badge>
                        <span className="text-sm font-medium">{entry.user?.name || 'Système'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{entry.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.createdAt).toLocaleDateString('fr-FR', { 
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune entrée d&apos;audit pour ce document.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
