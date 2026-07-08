'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, FileText, Download, Archive, CheckCircle, XCircle, Send, Clock, User, Building2 } from 'lucide-react'
import { statusLabels, statusColors, classificationLabels, classificationColors, typeLabels } from '@/lib/constants'
import type { DocumentStatus, Classification, DocumentType } from '@prisma/client'

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/documents/${params.id}`)
        .then(res => res.json())
        .then(data => setDocument(data))
        .finally(() => setLoading(false))
    }
  }, [params.id])

  const handleAction = async (action: string) => {
    if (!params.id) return
    try {
      const res = await fetch(`/api/documents/${params.id}/${action}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setDocument(data)
      }
    } catch {
      // Handle error
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
  }

  if (!document) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Document introuvable</p></div>
  }

  const doc = document as Record<string, any>
  const author = doc.author as Record<string, string> | null
  const department = doc.department as Record<string, string> | null
  const workflowState = doc.workflowState as Record<string, any> | null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{doc.title as string}</h1>
          <p className="text-muted-foreground">{doc.reference as string}</p>
        </div>
        <div className="flex gap-2">
          {(doc.status === 'DRAFT' || doc.status === 'REJECTED') && (
            <Button variant="outline" onClick={() => handleAction('submit')}>
              <Send className="h-4 w-4 mr-2" />
              Soumettre
            </Button>
          )}
          {doc.status === 'PENDING_REVIEW' && (
            <>
              <Button onClick={() => handleAction('approve')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approuver
              </Button>
              <Button variant="destructive" onClick={() => handleAction('reject')}>
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </>
          )}
          {doc.status === 'APPROVED' && (
            <Button onClick={() => handleAction('publish')}>
              Publier
            </Button>
          )}
          {!doc.isArchived && doc.status !== 'ARCHIVED' && (
            <Button variant="outline" onClick={() => handleAction('archive')}>
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
          )}
          {doc.isArchived && (
            <Button variant="outline" onClick={() => handleAction('restore')}>
              Restaurer
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
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
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique des versions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Version actuelle: {doc.version as number}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Auteur
                </p>
                <p className="text-sm">{author?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Département
                </p>
                <p className="text-sm">{department?.name}</p>
              </div>
              {workflowState && (
                <div>
                  <p className="text-xs text-muted-foreground">État du workflow</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: workflowState.color as string }} />
                    <span className="text-sm">{workflowState.name as string}</span>
                  </div>
                </div>
              )}
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
        </div>
      </div>
    </div>
  )
}
