'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { typeLabels, classificationLabels } from '@/lib/constants'

export default function DocumentUploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('')
  const [classification, setClassification] = useState('INTERNAL')
  const [departmentId, setDepartmentId] = useState('')
  const [tags, setTags] = useState('')
  const [retentionPolicy, setRetentionPolicy] = useState('MEDIUM_TERM')

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        setDepartments(Array.isArray(data) ? data : data.departments || [])
      })
      .catch(() => {
        toast.error('Erreur lors du chargement des d\u00e9partements')
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Veuillez s\u00e9lectionner un fichier')
      return
    }
    if (!title) {
      toast.error('Veuillez entrer un titre')
      return
    }
    if (!type) {
      toast.error('Veuillez s\u00e9lectionner un type')
      return
    }
    if (!departmentId) {
      toast.error('Veuillez s\u00e9lectionner un d\u00e9partement')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('description', description)
    formData.append('type', type)
    formData.append('classification', classification)
    formData.append('departmentId', departmentId)
    formData.append('tags', tags)
    formData.append('retentionPolicy', retentionPolicy)

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Document import\u00e9 avec succ\u00e8s', {
          description: `Le document "${title}" a \u00e9t\u00e9 cr\u00e9\u00e9 et est en statut Brouillon.`
        })
        router.push(`/documents/${data.document?.id || data.id}`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de l\u0027import')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 page-enter max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Importer un document</h1>
          <p className="text-muted-foreground">Cr\u00e9er un nouveau document dans la plateforme</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Formulaire d\u0027import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Fichier *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-teal-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setFile(f)
                      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
                    }
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar"
                />
                {file ? (
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Cliquez pour s\u00e9lectionner un fichier</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF, Word, Excel, images, archives \u2014 max 50 MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du document" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du document" rows={3} />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type de document *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="S\u00e9lectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Classification */}
            <div className="space-y-2">
              <Label>Classification</Label>
              <Select value={classification} onValueChange={setClassification}>
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

            {/* Department */}
            <div className="space-y-2">
              <Label>D\u00e9partement *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="S\u00e9lectionner un d\u00e9partement" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags s\u00e9par\u00e9s par des virgules" />
            </div>

            {/* Retention Policy */}
            <div className="space-y-2">
              <Label>Politique de conservation</Label>
              <Select value={retentionPolicy} onValueChange={setRetentionPolicy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHORT_TERM">Court terme (3 ans)</SelectItem>
                  <SelectItem value="MEDIUM_TERM">Moyen terme (7 ans)</SelectItem>
                  <SelectItem value="LONG_TERM">Long terme (30 ans)</SelectItem>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={loading || !file}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Importer le document
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
