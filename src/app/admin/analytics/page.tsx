'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function SuperAdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analyses
        </h1>
        <p className="text-muted-foreground">Statistiques et analyses de la plateforme</p>
      </div>
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Module d&apos;analyses en cours de développement</p>
        </CardContent>
      </Card>
    </div>
  )
}
