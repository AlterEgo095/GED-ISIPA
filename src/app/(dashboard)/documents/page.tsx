'use client'

import { useState, useEffect } from 'react'
import { DocumentList } from '@/components/documents/document-list'
import { hasPermission } from '@/lib/permissions'
import { toast } from 'sonner'
import type { Role, DocumentStatus, Classification, DocumentType } from '@prisma/client'

interface Doc {
  id: string
  title: string
  reference: string
  type: DocumentType
  status: DocumentStatus
  classification: Classification
  version: number
  isArchived?: boolean
  createdAt: string
  author: { id: string; name: string; email: string }
  department: { id: string; name: string; code: string }
  workflowState?: { id: string; name: string; color: string } | null
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [role, setRole] = useState<Role>('VIEWER')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get role from session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.role) setRole(session.user.role as Role)
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/documents?page=${page}&limit=20`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setDocuments(data.documents || [])
          setTotalPages(data.pagination?.pages || 1)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Erreur de chargement', { description: 'Impossible de charger les documents' })
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [page])

  const handleAction = async (docId: string, action: string, body?: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/documents/${docId}/${action}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.ok) {
        // Refresh list
        const data = await fetch(`/api/documents?page=${page}&limit=20`).then(r => r.json())
        setDocuments(data.documents || [])

        // Toast feedback based on action
        const actionLabels: Record<string, string> = {
          'approve': 'Document approuvé',
          'reject': 'Document rejeté',
          'archive': 'Document archivé',
          'soft-delete': 'Document déplacé vers la corbeille',
          'submit': 'Document soumis pour révision',
          'publish': 'Document publié',
          'request-revision': 'Révision demandée',
        }
        toast.success(actionLabels[action] || 'Action réalisée')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de l\'action')
      }
    } catch {
      toast.error('Erreur de connexion', { description: 'Veuillez réessayer' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <div className="skeleton h-8 w-40 mb-2" />
          <div className="skeleton h-4 w-60" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-9 flex-1" />
          <div className="skeleton h-9 w-[180px]" />
          <div className="skeleton h-9 w-[200px]" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="skeleton h-4 w-8" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1">Gérez vos documents et dossiers</p>
      </div>

      <DocumentList
        documents={documents}
        totalPages={totalPages}
        currentPage={page}
        onPageChange={setPage}
        onAction={handleAction}
        canApprove={hasPermission(role, 'documents', 'approve')}
        canArchive={hasPermission(role, 'documents', 'archive')}
        canEdit={hasPermission(role, 'documents', 'update')}
        canDelete={hasPermission(role, 'documents', 'delete')}
      />
    </div>
  )
}