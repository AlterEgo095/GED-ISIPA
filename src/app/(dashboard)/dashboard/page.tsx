'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { getDashboardRoute } from '@/lib/redirection'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // SUPER_ADMIN goes to admin dashboard
    if (session.user?.role === 'SUPER_ADMIN') {
      router.replace('/admin/dashboard')
      return
    }

    const orgType = session.user?.organizationType
    if (orgType) {
      const route = getDashboardRoute(orgType as never)
      router.replace(route)
    }
  }, [session, status, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" />
        <p className="mt-4 text-muted-foreground">Redirection vers votre tableau de bord...</p>
      </div>
    </div>
  )
}
