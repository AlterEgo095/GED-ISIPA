'use client'

import { useState, useEffect } from 'react'
import { ModuleGrid } from '@/components/modules/module-grid'
import { AVAILABLE_MODULES } from '@/lib/module-engine'
import type { ModuleStatus } from '@prisma/client'

interface OrgModule {
  id: string
  moduleKey: string
  name: string
  description?: string | null
  status: ModuleStatus
  activatedAt?: Date | null
}

export default function ModulesPage() {
  const [modules, setModules] = useState<OrgModule[]>([])
  const [orgType, setOrgType] = useState('UNIVERSITY')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.organizationType) setOrgType(session.user.organizationType)
        setIsAdmin(session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ORG_ADMIN')
      })

    fetch('/api/modules')
      .then(res => res.json())
      .then(data => setModules(data.orgModules || []))
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (moduleKey: string, action: 'activate' | 'suspend' | 'deactivate') => {
    try {
      const session = await fetch('/api/auth/session').then(r => r.json())
      const orgId = session?.user?.organizationId
      if (!orgId) return

      const res = await fetch(`/api/organizations/${orgId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleKey, action }),
      })

      if (res.ok) {
        // Refresh modules
        const data = await fetch('/api/modules').then(r => r.json())
        setModules(data.orgModules || [])
      }
    } catch {
      // Handle error
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement des modules...</div></div>
  }

  return (
    <ModuleGrid
      modules={modules}
      availableModules={AVAILABLE_MODULES}
      orgType={orgType}
      onAction={handleAction}
      isAdmin={isAdmin}
    />
  )
}
