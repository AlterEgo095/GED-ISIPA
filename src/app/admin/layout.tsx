'use client'

import { SuperAdminLayout } from '@/components/layout/super-admin-layout'
import { NextAuthProvider } from '@/components/providers/next-auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NextAuthProvider>
        <SuperAdminLayout>{children}</SuperAdminLayout>
      </NextAuthProvider>
    </ThemeProvider>
  )
}
