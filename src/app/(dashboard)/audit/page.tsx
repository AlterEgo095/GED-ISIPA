'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Search } from 'lucide-react'
import { actionLabels } from '@/lib/constants'
import type { AuditAction } from '@prisma/client'

export default function AuditPage() {
  const [logs, setLogs] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => {
    const params = filterAction !== 'all' ? `?action=${filterAction}` : ''
    fetch(`/api/audit${params}`)
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .finally(() => setLoading(false))
  }, [filterAction])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Journal d&apos;audit
        </h1>
        <p className="text-muted-foreground">Historique de toutes les actions sur la plateforme</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            {Object.entries(actionLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
      ) : (
        <div className="space-y-2">
          {logs.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Aucune entrée d&apos;audit</p>
              </CardContent>
            </Card>
          )}
          {logs.map((log) => {
            const user = log.user as Record<string, string> | null
            return (
              <Card key={log.id as string}>
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {actionLabels[log.action as AuditAction] || (log.action as string)}
                      </Badge>
                      <span className="text-sm font-medium">{log.entityType as string}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{log.details as string}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt as string).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
