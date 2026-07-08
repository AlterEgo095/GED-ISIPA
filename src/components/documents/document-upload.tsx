'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Loader2, AlertCircle } from 'lucide-react'
import { typeLabels, classificationLabels } from '@/lib/constants'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.md',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.zip', '.json',
]

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/zip',
  'application/json',
]

interface DocumentUploadProps {
  departments: { id: string; name: string }[]
  onUpload: (data: {
    title: string
    description: string
    type: string
    classification: string
    departmentId: string
    file?: File
  }) => void
}

function validateFile(file: File): string | null {
  if (file.size === 0) {
    return 'Le fichier est vide'
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Fichier trop volumineux. Taille maximale : 50 Mo`
  }

  // Check MIME type if available
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    // Fallback to extension check
    const fileName = file.name.toLowerCase()
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    if (!hasValidExt) {
      return `Type de fichier non autorisé : ${file.type || 'inconnu'}`
    }
  }

  // Check extension as well
  const fileName = file.name.toLowerCase()
  const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
  if (!hasValidExt) {
    return `Extension de fichier non autorisée`
  }

  return null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function DocumentUpload({ departments, onUpload }: DocumentUploadProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    classification: 'INTERNAL',
    departmentId: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFileError(null)

    if (selectedFile) {
      const error = validateFile(selectedFile)
      if (error) {
        setFileError(error)
        setFile(null)
        // Reset the input so the same file can be re-selected
        e.target.value = ''
        return
      }
      setFile(selectedFile)
    } else {
      setFile(null)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)

    if (!file) {
      setFileError('Veuillez sélectionner un fichier')
      return
    }

    setIsUploading(true)

    try {
      // Build FormData for multipart upload
      const multipartData = new FormData()
      multipartData.append('title', formData.title)
      multipartData.append('description', formData.description)
      multipartData.append('type', formData.type)
      multipartData.append('classification', formData.classification)
      multipartData.append('departmentId', formData.departmentId)
      multipartData.append('tags', '')
      multipartData.append('file', file)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: multipartData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'importation')
      }

      // Notify parent component
      onUpload({ ...formData, file: file || undefined })

      // Reset form
      setOpen(false)
      setFormData({ title: '', description: '', type: '', classification: 'INTERNAL', departmentId: '' })
      setFile(null)
      setFileError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'importation'
      setUploadError(message)
    } finally {
      setIsUploading(false)
    }
  }

  const isFormValid = formData.title && formData.type && formData.departmentId && file && !fileError

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isUploading) setOpen(v) }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Nouveau document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer un document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre du document"
              required
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du document"
              disabled={isUploading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Classification</Label>
              <Select value={formData.classification} onValueChange={(v) => setFormData({ ...formData, classification: v })} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(classificationLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Département *</Label>
            <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un département" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fichier *</Label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept={ALLOWED_EXTENSIONS.join(',')}
              disabled={isUploading}
            />
            {file && !fileError && (
              <p className="text-xs text-muted-foreground">
                {file.name} — {formatFileSize(file.size)}
              </p>
            )}
            {fileError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {fileError}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Formats acceptés : PDF, Word, Excel, images, texte — Max 50 Mo
            </p>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!isFormValid || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importation en cours...
              </>
            ) : (
              'Importer le document'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
