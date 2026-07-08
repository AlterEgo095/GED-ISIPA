'use client'

import { useState, useEffect } from 'react'
import { CompanyDashboard } from '@/components/dashboards/company-dashboard'

export default function CompanyDashboardPage() {
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
    <CompanyDashboard
      stats={data?.stats as never}
      recentDocs={(data?.recentDocs as never[]) || []}
      docsByType={(data?.docsByType as never[]) || []}
    />
  )
}
