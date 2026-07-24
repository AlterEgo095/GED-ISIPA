'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, LogIn } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgCode, setOrgCode] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        orgCode: orgCode || undefined,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error === 'CredentialsSignin' 
          ? 'Email ou mot de passe incorrect' 
          : result.error)
        setLoading(false)
      } else if (result?.ok) {
        // Fetch session to determine role-based redirect with correct dashboard URL
        try {
          const sessionRes = await fetch('/api/auth/session')
          const sessionData = await sessionRes.json()
          const orgType = sessionData?.user?.organizationType
          if (sessionData?.user?.role === 'SUPER_ADMIN') {
            window.location.href = '/admin/dashboard'
          } else if (orgType) {
            const dashboardRoutes: Record<string, string> = {
              UNIVERSITY: '/dashboard/university',
              HOSPITAL: '/dashboard/hospital',
              COMPANY: '/dashboard/company',
              GOVERNMENT: '/dashboard/government',
              SME: '/dashboard/sme',
              LAW_FIRM: '/dashboard/law-firm',
              INSTITUTION: '/dashboard',
              NGO: '/dashboard',
            }
            window.location.href = dashboardRoutes[orgType] || '/dashboard'
          } else {
            window.location.href = '/dashboard'
          }
        } catch {
          // Fallback to /dashboard if session fetch fails
          window.location.href = '/dashboard'
        }
      } else {
        setLoading(false)
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900">
          <LogIn className="h-7 w-7 text-teal-600 dark:text-teal-400" />
        </div>
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>Connectez-vous à votre espace AEIP</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgCode">
              Code organisation{' '}
              <span className="text-xs font-normal text-muted-foreground">(requis pour les membres d&#39;une organisation)</span>
            </Label>
            <Input
              id="orgCode"
              type="text"
              placeholder="AEIP-XXX-XXXXXX"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-muted-foreground">
              Les super-administrateurs peuvent laisser ce champ vide. Format : AEIP-UNI-XXXXXX, AEIP-HOS-XXXXXX, etc.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
            />
            <Label htmlFor="remember" className="text-sm font-normal">
              Se souvenir de moi
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
