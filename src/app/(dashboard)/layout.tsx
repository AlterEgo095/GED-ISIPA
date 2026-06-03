'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NextAuthProvider } from '@/components/providers/next-auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NextAuthProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </NextAuthProvider>
    </ThemeProvider>
  )
}
