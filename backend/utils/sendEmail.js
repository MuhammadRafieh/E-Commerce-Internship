import nodemailer from 'nodemailer'

/**
 * Builds a transporter from SMTP_* env vars. When they are absent — the
 * common local/dev case — it falls back to nodemailer's stream transport so
 * `forgotPassword` still works end to end and the reset link is printed to
 * the server log instead of being emailed.
 */
const buildTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      }),
      real: true,
    }
  }

  return { transporter: nodemailer.createTransport({ jsonTransport: true }), real: false }
}

/**
 * Sends a password-reset email. Never throws — a mail outage must not surface
 * as a 500 to the user, and the caller always reports the same generic
 * success message regardless of whether the address existed.
 */
export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const { transporter, real } = buildTransporter()
  const from = process.env.MAIL_FROM || 'no-reply@example.com'

  if (!real) {
    console.warn('\n[SMTP not configured — reset link logged instead of emailed]')
    console.warn(`  to:   ${to}`)
    console.warn(`  link: ${resetUrl}\n`)
    return { delivered: false, logged: true }
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your password',
      text: [
        'We received a request to reset your password.',
        '',
        'Open the link below to choose a new one. It expires in 1 hour.',
        '',
        resetUrl,
        '',
        'If you did not request this, you can safely ignore this email.',
      ].join('\n'),
      html: `
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 20px;border-radius:8px;
                    background:#16a34a;color:#fff;text-decoration:none;font-weight:600">
            Choose a new password
          </a>
        </p>
        <p style="color:#666;font-size:13px">This link expires in 1 hour.</p>
        <p style="color:#666;font-size:13px">
          If the button does not work, paste this link into your browser:<br />
          <span style="word-break:break-all">${resetUrl}</span>
        </p>
        <p style="color:#666;font-size:13px">If you did not request this, you can safely ignore this email.</p>
      `,
    })
    return { delivered: true }
  } catch (err) {
    console.error('[sendPasswordResetEmail] delivery failed:', err.message)
    return { delivered: false }
  }
}
