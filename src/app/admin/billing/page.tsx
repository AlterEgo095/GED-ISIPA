'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default function SuperAdminBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Facturation
        </h1>
        <p className="text-muted-foreground">Gestion de la facturation plateforme</p>
      </div>
      <Card>
        <CardContent className="text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Module de facturation en cours de développement</p>
        </CardContent>
      </Card>
    </div>
  )
}
