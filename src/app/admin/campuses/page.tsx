'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Building, MapPin, Plus, Globe, Clock, Palette, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CampusOrganization {
  name: string
  code: string
}

interface Campus {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  country: string | null
  timezone: string
  primaryColor: string | null
  isActive: boolean
  organization: CampusOrganization
  createdAt: string
}

interface Organization {
  id: string
  name: string
  code: string
  type: string
}

const TIMEZONE_OPTIONS = [
  'Africa/Casablanca',
  'Africa/Dakar',
  'Africa/Kinshasa',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Tunis',
  'Europe/Paris',
  'Europe/London',
  'Europe/Brussels',
  'Europe/Geneva',
  'America/New_York',
  'America/Montreal',
  'Asia/Dubai',
  'Asia/Tokyo',
]

const initialFormData = {
  organizationId: '',
  name: '',
  code: '',
  address: '',
  city: '',
  country: '',
  timezone: 'Africa/Casablanca',
  primaryColor: '#0d9488',
}

export default function SuperAdminCampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

  const fetchCampuses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/campuses')
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setCampuses(data.campuses || [])
    } catch {
      toast.error('Erreur lors du chargement des campus')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations')
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setOrganizations(data.organizations || [])
    } catch {
      toast.error('Erreur lors du chargement des organisations')
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchCampuses(), fetchOrganizations()])
  }, [fetchCampuses, fetchOrganizations])

  const activeCampuses = campuses.filter(c => c.isActive).length
  const orgsWithCampuses = new Set(campuses.map(c => c.organization.code)).size

  const handleCreateCampus = async () => {
    if (!formData.organizationId || !formData.name || !formData.code) {
      toast.error('Organisation, nom et code sont requis')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      toast.success(`Campus "${formData.name}" créé avec succès`)
      setDialogOpen(false)
      setFormData(initialFormData)
      fetchCampuses()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du campus')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6 text-teal-600" />
            Campus
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des campus de la plateforme GED-ISIPA
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un campus
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-teal-600" />
                Nouveau campus
              </DialogTitle>
            </DialogHeader>
            <Separator />
            <div className="grid gap-4 py-4">
              {/* Organization Select */}
              <div className="grid gap-2">
                <Label htmlFor="organization" className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5" />
                  Organisation *
                </Label>
                <Select
                  value={formData.organizationId}
                  onValueChange={(value) => handleInputChange('organizationId', value)}
                >
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Sélectionner une organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} ({org.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Campus Principal"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              {/* Code */}
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="Ex: CAMP-PRINC"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                />
              </div>

              {/* Address */}
              <div className="grid gap-2">
                <Label htmlFor="address" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  placeholder="Ex: 123 Rue Mohammed V"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    placeholder="Ex: Casablanca"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country" className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Pays
                  </Label>
                  <Input
                    id="country"
                    placeholder="Ex: Maroc"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                  />
                </div>
              </div>

              {/* Timezone */}
              <div className="grid gap-2">
                <Label htmlFor="timezone" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Fuseau horaire
                </Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleInputChange('timezone', value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Sélectionner un fuseau" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Primary Color */}
              <div className="grid gap-2">
                <Label htmlFor="primaryColor" className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Couleur principale
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="h-10 w-14 rounded-md border cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="flex-1 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
            <Separator />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateCampus}
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le campus
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total campus
            </CardTitle>
            <Building className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campuses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campus actifs
            </CardTitle>
            <ToggleRight className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCampuses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organisations avec campus
            </CardTitle>
            <Globe className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgsWithCampuses}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campuses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des campus</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {campuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm">Aucun campus enregistré</p>
              <p className="text-xs mt-1">Cliquez sur &quot;Ajouter un campus&quot; pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead className="hidden md:table-cell">Ville/Pays</TableHead>
                    <TableHead className="hidden lg:table-cell">Fuseau</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden sm:table-cell">Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campuses.map((campus) => (
                    <TableRow key={campus.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {campus.primaryColor && (
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: campus.primaryColor }}
                            />
                          )}
                          {campus.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-accent px-1.5 py-0.5 rounded">
                          {campus.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{campus.organization.name}</span>
                          <span className="text-muted-foreground ml-1">
                            ({campus.organization.code})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          {campus.city && campus.country
                            ? `${campus.city}, ${campus.country}`
                            : campus.city || campus.country || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          {campus.timezone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {campus.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                            <ToggleRight className="h-3 w-3" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <ToggleLeft className="h-3 w-3" />
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(campus.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
