'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Archive, CheckCircle, XCircle, Send, Upload } from 'lucide-react'
import { statusLabels, statusColors, classificationLabels, classificationColors, typeLabels } from '@/lib/constants'
import type { DocumentStatus, Classification, DocumentType } from '@prisma/client'
interface Document {
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

interface DocumentListProps {
  documents: Document[]
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  onAction: (docId: string, action: string) => void
  canApprove?: boolean
  canArchive?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export function DocumentList({
  documents,
  totalPages,
  currentPage,
  onPageChange,
  onAction,
  canApprove = false,
  canArchive = false,
  canEdit = false,
  canDelete = false,
}: DocumentListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Rechercher un document..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => router.push('/documents/upload')}>
              <Upload className="h-4 w-4 mr-2" />
              Nouveau document
            </Button>
                </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead className="hidden md:table-cell">Référence</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Classification</TableHead>
                <TableHead className="hidden lg:table-cell">Auteur</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun document trouvé
                  </TableCell>
                </TableRow>
              )}
              {documents.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer hover:bg-accent/50" onClick={() => router.push(`/documents/${doc.id}`)}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{doc.reference}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{doc.reference}</TableCell>
                  <TableCell>
                    <span className="text-sm">{typeLabels[doc.type] || doc.type}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[doc.status]}>
                      {statusLabels[doc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge className={classificationColors[doc.classification]}>
                      {classificationLabels[doc.classification]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{doc.author?.name}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/documents/${doc.id}`) }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </DropdownMenuItem>
                        {doc.status === 'DRAFT' && canEdit && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction(doc.id, 'submit') }}>
                            <Send className="h-4 w-4 mr-2" />
                            Soumettre
                          </DropdownMenuItem>
                        )}
                        {doc.status === 'PENDING_REVIEW' && canApprove && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction(doc.id, 'approve') }}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approuver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction(doc.id, 'reject') }}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeter
                            </DropdownMenuItem>
                          </>
                        )}
                        {canArchive && doc.status !== 'ARCHIVED' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction(doc.id, 'archive') }}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archiver
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
