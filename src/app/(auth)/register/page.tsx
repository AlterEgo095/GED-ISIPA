'use client'

import { RegisterForm } from '@/components/auth/register-form'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <RegisterForm />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Déjà inscrit ?{' '}
          <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
