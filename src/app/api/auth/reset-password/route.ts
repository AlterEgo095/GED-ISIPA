import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import type { NextRequest } from 'next/server'

const SALT_ROUNDS = 12

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token de réinitialisation requis' },
        { status: 400 },
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Nouveau mot de passe requis' },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 },
      )
    }

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find the reset record
    const resetRecord = await db.passwordReset.findUnique({
      where: { tokenHash },
      include: { user: { include: { organization: { select: { id: true } } } } },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 },
      )
    }

    // Check if token has already been used
    if (resetRecord.usedAt) {
      return NextResponse.json(
        { error: 'Ce token a déjà été utilisé' },
        { status: 400 },
      )
    }

    // Check if token has expired
    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token expiré. Veuillez demander un nouveau lien de réinitialisation.' },
        { status: 400 },
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Update user password and mark token as used in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      db.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ])

    // Create audit log entry
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'User',
        entityId: resetRecord.userId,
        details: 'Password reset via email token',
        organizationId: resetRecord.user.organizationId,
        userId: resetRecord.userId,
      },
    })

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    })
  } catch (error) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 },
    )
  }
}
