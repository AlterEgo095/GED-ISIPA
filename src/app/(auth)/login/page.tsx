'use client'

import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <LoginForm />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-teal-600 hover:text-teal-700 font-medium">
            Créer une organisation
          </Link>
        </p>
      </div>
    </div>
  )
}
