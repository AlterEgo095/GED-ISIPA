import { NextAuthProvider } from '@/components/providers/next-auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NextAuthProvider>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-xl mb-4">
                AEIP
              </div>
              <h1 className="text-2xl font-bold">AEIP Enterprise Platform</h1>
              <p className="text-muted-foreground mt-1">Gestion Électronique de Documents</p>
            </div>
            {children}
          </div>
        </div>
      </NextAuthProvider>
    </ThemeProvider>
  )
}
