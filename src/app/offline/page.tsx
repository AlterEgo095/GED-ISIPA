'use client'

import Link from 'next/link'
import { CloudOff, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <main className="min-h-screen-safe flex items-center justify-center bg-background p-6 safe-all">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg">
          <CloudOff className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Vous êtes hors ligne</h1>
          <p className="text-muted-foreground text-sm">
            La connexion réseau est indisponible. Vous pouvez continuer à consulter les documents
            et pages déjà chargés. Les modifications seront synchronisées au retour de la connexion.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.location.reload()} variant="default" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground pt-4 border-t">
          GED-ISIPA — Mode hors ligne actif
        </p>
      </div>
    </main>
  )
}
