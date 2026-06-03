'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2 } from 'lucide-react'
import { organizationTypeLabels, orgStatusLabels, planLabels } from '@/lib/constants'
import type { OrganizationType, OrganizationStatus, SubscriptionPlan } from '@prisma/client'

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => setOrganizations(data.organizations || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Organisations
        </h1>
        <p className="text-muted-foreground">Gérez les organisations de la plateforme</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden md:table-cell">Utilisateurs</TableHead>
                <TableHead className="hidden md:table-cell">Documents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => {
                const count = org._count as Record<string, number>
                return (
                  <TableRow key={org.id as string}>
                    <TableCell className="font-medium">{org.name as string}</TableCell>
                    <TableCell><code className="text-xs bg-accent px-1.5 py-0.5 rounded">{org.code as string}</code></TableCell>
                    <TableCell>{organizationTypeLabels[org.type as OrganizationType]}</TableCell>
                    <TableCell>{planLabels[org.plan as SubscriptionPlan]}</TableCell>
                    <TableCell>
                      <Badge variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {orgStatusLabels[org.status as OrganizationStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{count?.users || 0}</TableCell>
                    <TableCell className="hidden md:table-cell">{count?.documents || 0}</TableCell>
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
