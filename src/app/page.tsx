'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Loader2 } from 'lucide-react'

function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      if (session.user?.role === 'SUPER_ADMIN') {
        router.replace('/admin/dashboard')
      } else if (session.user?.organizationType) {
        const typeRoutes: Record<string, string> = {
          UNIVERSITY: '/dashboard/university',
          HOSPITAL: '/dashboard/hospital',
          COMPANY: '/dashboard/company',
          GOVERNMENT: '/dashboard/government',
          SME: '/dashboard/sme',
          LAW_FIRM: '/dashboard/law-firm',
        }
        router.replace(typeRoutes[session.user.organizationType] || '/dashboard')
      } else {
        router.replace('/dashboard')
      }
    } else {
      router.replace('/login')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-xl mb-6">
          AEIP
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" />
        <p className="mt-4 text-muted-foreground">Chargement...</p>
      </div>
    </div>
  )
}

export default function RootPage() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <HomePage />
      </SessionProvider>
    </ThemeProvider>
  )
}
