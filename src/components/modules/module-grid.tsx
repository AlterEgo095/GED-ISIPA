'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { moduleStatusLabels, moduleStatusColors, moduleLabels } from '@/lib/constants'
import { Boxes, ChevronRight } from 'lucide-react'
import type { ModuleStatus } from '@prisma/client'

interface Module {
  id: string
  moduleKey: string
  name: string
  description?: string | null
  status: ModuleStatus
  activatedAt?: Date | null
}

interface AvailableModule {
  key: string
  name: string
  description: string
  orgTypes: string[]
  dependencies?: string[]
}

interface ModuleGridProps {
  modules: Module[]
  availableModules: AvailableModule[]
  orgType: string
  onAction: (moduleKey: string, action: 'activate' | 'suspend' | 'deactivate') => void
  isAdmin?: boolean
}

export function ModuleGrid({ modules, availableModules, orgType, onAction, isAdmin = false }: ModuleGridProps) {
  const relevantModules = availableModules.filter(m => m.orgTypes.includes(orgType))

  const getModuleStatus = (moduleKey: string): ModuleStatus | null => {
    const mod = modules.find(m => m.moduleKey === moduleKey)
    return mod?.status || null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Modules</h2>
        <p className="text-muted-foreground">Gérez les modules disponibles pour votre organisation</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relevantModules.map((module) => {
          const status = getModuleStatus(module.key)
          const isActive = status === 'ACTIVE'
          const isSuspended = status === 'SUSPENDED'

          return (
            <Card key={module.key} className={cn(
              'transition-all',
              isActive && 'border-emerald-200 dark:border-emerald-800',
              isSuspended && 'border-amber-200 dark:border-amber-800',
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    {module.name}
                  </CardTitle>
                  {status && (
                    <Badge className={moduleStatusColors[status]}>
                      {moduleStatusLabels[status]}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{module.description}</p>
                
                {module.dependencies && module.dependencies.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Dépend de: {module.dependencies.map(d => moduleLabels[d] || d).join(', ')}
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    {!isActive && (
                      <Button size="sm" onClick={() => onAction(module.key, 'activate')} className="text-xs">
                        Activer
                      </Button>
                    )}
                    {isActive && (
                      <Button size="sm" variant="outline" onClick={() => onAction(module.key, 'suspend')} className="text-xs">
                        Suspendre
                      </Button>
                    )}
                    {(isActive || isSuspended) && (
                      <Button size="sm" variant="destructive" onClick={() => onAction(module.key, 'deactivate')} className="text-xs">
                        Désactiver
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
