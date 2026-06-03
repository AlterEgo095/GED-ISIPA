'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { HospitalDashboard } from '@/components/dashboards/hospital-dashboard'

export default function HospitalDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
  }

  return (
    <HospitalDashboard
      stats={data?.stats as never}
      recentDocs={(data?.recentDocs as never[]) || []}
      docsByType={(data?.docsByType as never[]) || []}
    />
  )
}
