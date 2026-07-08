'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Workflow } from 'lucide-react'
import Link from 'next/link'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/workflows')
      .then(res => res.json())
      .then(data => setWorkflows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Workflows
          </h1>
          <p className="text-muted-foreground">Gérez vos flux de travail documentaire</p>
        </div>
        <Button asChild>
          <Link href="/workflows/new">Nouveau workflow</Link>
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun workflow créé</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/workflows/new">Créer un workflow</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => {
            const states = wf.states as Record<string, any>[] | undefined
            const transitions = wf.transitions as Record<string, any>[] | undefined
            return (
              <Card key={wf.id as string} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{wf.name as string}</CardTitle>
                    <Badge variant={wf.isActive ? 'default' : 'secondary'}>
                      {wf.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  {wf.description && <p className="text-sm text-muted-foreground">{wf.description as string}</p>}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{states?.length || 0} états</span>
                    <span>{transitions?.length || 0} transitions</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                    <Link href={`/workflows/${wf.id as string}`}>Voir détails</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
