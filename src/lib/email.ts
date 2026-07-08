import nodemailer from 'nodemailer'

// ---------------------------------------------------------------------------
// SMTP Configuration — reads from env vars with sensible dev defaults
// ---------------------------------------------------------------------------
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.ethereal.email'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@aeip.cd'

// ---------------------------------------------------------------------------
// Transporter — created lazily so the module never crashes on import
// ---------------------------------------------------------------------------
let _transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter

  try {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
    return _transporter
  } catch (err) {
    console.error('[email] Failed to create transporter:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// AEIP Branding Constants
// ---------------------------------------------------------------------------
const BRAND_PRIMARY = '#7c3aed'
const BRAND_PRIMARY_DARK = '#6d28d9'
const BRAND_FONT = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

// ---------------------------------------------------------------------------
// HTML Email Shell — shared layout with AEIP branding
// ---------------------------------------------------------------------------
function emailShell(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:${BRAND_FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_PRIMARY};padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">AEIP</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Plateforme de Gestion Électronique de Documents</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:12px;">&copy; ${new Date().getFullYear()} AEIP — Agence d'Encadrement des Institutions Publiques</p>
              <p style="margin:4px 0 0;color:#9ca3af;font-size:11px;">Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Generic send — wraps transporter.sendMail with console fallback
// ---------------------------------------------------------------------------
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const transporter = getTransporter()

    if (!transporter || (!SMTP_USER && !SMTP_PASS)) {
      // No SMTP configured — log to console instead of crashing
      console.log('──────────────────────────────────────────────')
      console.log('[email] SMTP not configured — email would have been sent:')
      console.log(`  To      : ${to}`)
      console.log(`  Subject : ${subject}`)
      console.log(`  HTML    : (see below)`)
      console.log('──────────────────────────────────────────────')
      // In development with Ethereal we still want a useful preview
      return false
    }

    const info = await transporter.sendMail({
      from: `"AEIP Plateforme" <${SMTP_FROM}>`,
      to,
      subject,
      html,
    })

    console.log(`[email] Sent to ${to} — messageId: ${info.messageId}`)

    // Log Ethereal preview URL when using Ethereal Email
    if (SMTP_HOST.includes('ethereal') && info) {
      const testUrl = nodemailer.getTestMessageUrl(info)
      if (testUrl) {
        console.log(`[email] Ethereal preview: ${testUrl}`)
      }
    }

    return true
  } catch (err) {
    console.error('[email] Failed to send email:', err)
    console.log(`[email] Fallback log — To: ${to}, Subject: ${subject}`)
    return false
  }
}

// ---------------------------------------------------------------------------
// Template: Password Reset
// ---------------------------------------------------------------------------
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  orgName: string,
): Promise<boolean> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

  const content = `
    <p style="margin:0 0 16px;color:#374151;font-size:16px;">Bonjour,</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Une demande de réinitialisation de mot de passe a été effectuée pour votre compte sur la plateforme
      <strong style="color:${BRAND_PRIMARY};">${orgName}</strong>.
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien est valable pendant <strong>1 heure</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:${BRAND_PRIMARY};border-radius:6px;">
          <a href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
            Réinitialiser mon mot de passe
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">
      Si le bouton ne fonctionne pas, copiez-collez le lien suivant dans votre navigateur :<br/>
      <a href="${resetLink}" style="color:${BRAND_PRIMARY};word-break:break-all;">${resetLink}</a>
    </p>
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
    </p>
  `

  const html = emailShell(content, 'Réinitialisation de mot de passe — AEIP')
  return sendEmail(to, 'Réinitialisation de votre mot de passe — AEIP', html)
}

// ---------------------------------------------------------------------------
// Template: Workflow Notification
// ---------------------------------------------------------------------------
export async function sendWorkflowNotificationEmail(
  to: string,
  docTitle: string,
  action: string,
  orgName: string,
): Promise<boolean> {
  const actionLabels: Record<string, string> = {
    PENDING_REVIEW: 'en attente de révision',
    APPROVED: 'approuvé',
    REJECTED: 'rejeté',
    PUBLISHED: 'publié',
    ARCHIVED: 'archivé',
    DRAFT: 'remis en brouillon',
  }

  const actionLabel = actionLabels[action] || action

  const content = `
    <p style="margin:0 0 16px;color:#374151;font-size:16px;">Bonjour,</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Le document <strong style="color:${BRAND_PRIMARY};">"${docTitle}"</strong> sur la plateforme
      <strong style="color:${BRAND_PRIMARY};">${orgName}</strong> a été
      <strong>${actionLabel}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:${BRAND_PRIMARY};border-radius:6px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/documents" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
            Voir le document
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
      Ceci est une notification automatique de la plateforme AEIP. Aucune action n'est requise de votre part si ce message ne vous concerne pas.
    </p>
  `

  const html = emailShell(content, `Document ${actionLabel} — AEIP`)
  return sendEmail(to, `[AEIP] Document "${docTitle}" — ${actionLabel}`, html)
}

// ---------------------------------------------------------------------------
// Template: Welcome Email (new user)
// ---------------------------------------------------------------------------
export async function sendWelcomeEmail(
  to: string,
  name: string,
  orgName: string,
  tempPassword: string,
): Promise<boolean> {
  const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`

  const content = `
    <p style="margin:0 0 16px;color:#374151;font-size:16px;">Bonjour <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Votre compte a été créé sur la plateforme de gestion électronique de documents de
      <strong style="color:${BRAND_PRIMARY};">${orgName}</strong> (AEIP).
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Vos identifiants de connexion</p>
          <p style="margin:0 0 4px;color:#374151;font-size:14px;"><strong>Email :</strong> ${to}</p>
          <p style="margin:0;color:#374151;font-size:14px;"><strong>Mot de passe temporaire :</strong> <code style="background-color:#e5e7eb;padding:2px 8px;border-radius:4px;font-size:13px;">${tempPassword}</code></p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      Pour des raisons de sécurité, veuillez changer votre mot de passe dès votre première connexion.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:${BRAND_PRIMARY};border-radius:6px;">
          <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
            Se connecter
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
      Si vous n'êtes pas à l'origine de la création de ce compte, veuillez contacter l'administrateur de votre organisation.
    </p>
  `

  const html = emailShell(content, 'Bienvenue sur AEIP')
  return sendEmail(to, `Bienvenue sur AEIP — ${orgName}`, html)
}
