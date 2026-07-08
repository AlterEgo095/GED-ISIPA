'use client'

import { useState, useEffect } from 'react'
import { GovernmentDashboard } from '@/components/dashboards/government-dashboard'

export default function GovernmentDashboardPage() {
  const [data, setData] = useState<Record<string, any> | null>(null)
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
    <GovernmentDashboard
      stats={data?.stats as never}
      recentDocs={(data?.recentDocs as never[]) || []}
      docsByType={(data?.docsByType as never[]) || []}
    />
  )
}
