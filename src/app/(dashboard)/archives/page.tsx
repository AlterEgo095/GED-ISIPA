'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Archive, RotateCcw, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { statusLabels, statusColors, classificationLabels, classificationColors, typeLabels } from '@/lib/constants'
import type { DocumentStatus, Classification, DocumentType } from '@prisma/client'

export default function ArchivesPage() {
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/documents?limit=100')
      .then(res => res.json())
      .then(data => {
        const allDocs = data.documents || []
        setDocuments(allDocs.filter((d: Record<string, unknown>) => d.isArchived))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleRestore = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/restore`, { method: 'POST' })
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== docId))
      }
    } catch {
      // Handle error
    }
  }

  const filtered = documents.filter(doc => 
    !search || (doc.title as string).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Archives</h1>
        <p className="text-muted-foreground">Documents archivés de votre organisation</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les archives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun document archivé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <Card key={doc.id as string}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{doc.title as string}</CardTitle>
                  <Badge className={statusColors[doc.status as DocumentStatus]}>
                    {statusLabels[doc.status as DocumentStatus]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">{doc.reference as string}</p>
                <Badge variant="outline" className={classificationColors[doc.classification as Classification]}>
                  {classificationLabels[doc.classification as Classification]}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Archivé le: {doc.archivedAt ? new Date(doc.archivedAt as string).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleRestore(doc.id as string)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
