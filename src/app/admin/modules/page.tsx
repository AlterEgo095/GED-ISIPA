'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Boxes } from 'lucide-react'
import { AVAILABLE_MODULES, getModulesForOrgType } from '@/lib/module-engine'
import { organizationTypeLabels } from '@/lib/constants'
import type { OrganizationType } from '@prisma/client'

export default function SuperAdminModulesPage() {
  const allTypes = Object.keys(organizationTypeLabels) as OrganizationType[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Boxes className="h-6 w-6" />
          Modules Plateforme
        </h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de tous les modules disponibles</p>
      </div>

      <div className="space-y-6">
        {allTypes.map((type) => {
          const modules = getModulesForOrgType(type)
          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-base">{organizationTypeLabels[type]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {modules.map((mod) => (
                    <div key={mod.key} className="flex items-center gap-2 rounded-lg border p-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">{mod.name}</p>
                        <p className="text-xs text-muted-foreground">{mod.key}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
