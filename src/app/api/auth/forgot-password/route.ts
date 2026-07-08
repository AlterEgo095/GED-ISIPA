import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Adresse email requise' },
        { status: 400 },
      )
    }

    // Look up the user — but always return the same generic message
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { organization: { select: { name: true } } },
    })

    if (user) {
      // Generate a secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      // Invalidate any previous unused reset tokens for this user
      await db.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      })

      // Store the new token hash
      await db.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      })

      // Send the password reset email (fire-and-forget, never blocks)
      sendPasswordResetEmail(user.email, resetToken, user.organization.name).catch(
        (err) => {
          console.error('[forgot-password] Email send failed:', err)
        },
      )
    }

    // Always return the same generic message to prevent email enumeration
    return NextResponse.json({
      message:
        'Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.',
    })
  } catch (error) {
    console.error('[forgot-password] Error:', error)
    // Still return generic message to avoid leaking information
    return NextResponse.json({
      message:
        'Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.',
    })
  }
}
