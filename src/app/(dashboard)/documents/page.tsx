'use client'

import { useState, useEffect } from 'react'
import { DocumentList } from '@/components/documents/document-list'
import { hasPermission } from '@/lib/permissions'
import type { Role, DocumentStatus, Classification, DocumentType } from '@prisma/client'

interface Doc {
  id: string
  title: string
  reference: string
  type: DocumentType
  status: DocumentStatus
  classification: Classification
  version: number
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
    return () => { cancelled = true }
  }, [page])

  const handleAction = async (docId: string, action: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/${action}`, { method: 'POST' })
      if (res.ok) {
        // Refresh list
        const data = await fetch(`/api/documents?page=${page}&limit=20`).then(r => r.json())
        setDocuments(data.documents || [])
      }
    } catch {
      // Handle error
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement des documents...</div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Gérez vos documents et dossiers</p>
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
      />
    </div>
  )
}
