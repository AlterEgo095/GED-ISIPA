'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, Users, Plus, Settings } from 'lucide-react'
import { roleLabels, roleColors, organizationTypeLabels } from '@/lib/constants'
import type { Role } from '@prisma/client'

export default function AdministrationPage() {
  const [users, setUsers] = useState<Record<string, any>[]>([])
  const [departments, setDepartments] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [addUserOpen, setAddUserOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ]).then(([usersData, deptsData]) => {
      setUsers(usersData.users || [])
      setDepartments(Array.isArray(deptsData) ? deptsData : [])
    }).finally(() => setLoading(false))
  }, [])

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          name: formData.get('name'),
          password: formData.get('password'),
          role: formData.get('role'),
          departmentId: formData.get('departmentId') || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(prev => [...prev, data])
        setAddUserOpen(false)
      }
    } catch {
      // Handle error
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Administration
          </h1>
          <p className="text-muted-foreground">Gérez les utilisateurs et départements</p>
        </div>
        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input name="name" placeholder="Jean Dupont" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="jean@org.com" required />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select name="role" defaultValue="USER">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Département</Label>
                <Select name="departmentId">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id as string} value={dept.id as string}>{dept.name as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Créer l&apos;utilisateur</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateurs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="hidden md:table-cell">Département</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const dept = user.department as Record<string, string> | null
                return (
                  <TableRow key={user.id as string}>
                    <TableCell className="font-medium">{user.name as string}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email as string}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role as Role]}>
                        {roleLabels[user.role as Role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{dept?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
