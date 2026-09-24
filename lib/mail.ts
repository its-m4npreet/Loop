import nodemailer from "nodemailer"
import { logger } from "@/lib/logger"

/**
 * Transactional email delivery for team invites, password resets, and
 * email verification.
 *
 * Prefers Resend when `RESEND_API_KEY` is set (recommended for production —
 * real deliverability, opens/tracking, low spam risk). Falls back to SMTP
 * via Nodemailer for self-hosted/legacy setups.
 */

const SMTP_FROM = process.env.SMTP_FROM || "Loop <noreply@loop.app>"
const RESEND_FROM = process.env.RESEND_FROM || "Loop <noreply@loop.app>"

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim()

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getSmtpTransporter() {
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  return transporter
}

interface SendInviteEmailOptions {
  to: string
  name: string
  role: string
  inviteUrl: string
  invitedByName: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ANALYST: "Analyst",
  VIEWER: "Viewer",
}

function buildInviteHtml({
  invitedByName,
  inviteeName,
  roleLabel,
  inviteUrl,
}: {
  invitedByName: string
  inviteeName: string
  roleLabel: string
  inviteUrl: string
}) {
  const greeting = inviteeName ? `Hi ${inviteeName},` : ""
  const title = greeting ? `${greeting} You're invited to Loop` : "You're Invited to Loop"
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="padding:40px 40px 24px;text-align:center;">
                  <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;">${title}</h1>
                  <p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                    <strong>${invitedByName}</strong> has invited you to join the workspace as a <strong>${roleLabel}</strong>.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px;text-align:center;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:12px 32px;background:#22c55e;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
                    Accept Invitation
                  </a>
                  <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
                    This invitation expires in 7 days.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

async function sendViaResend({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Resend API error ${response.status}: ${body.slice(0, 300)}`)
  }
}

export async function sendInviteEmail({
  to,
  name,
  role,
  inviteUrl,
  invitedByName,
}: SendInviteEmailOptions) {
  const roleLabel = ROLE_LABELS[role] || "Member"
  const html = buildInviteHtml({
    invitedByName,
    inviteeName: name?.trim() || "",
    roleLabel,
    inviteUrl,
  })
  const subject = `You're invited to join Loop as ${roleLabel}`

  if (RESEND_API_KEY) {
    await sendViaResend({ to, subject, html })
    logger.info("Invite email sent via Resend", { to })
    return
  }

  await getSmtpTransporter().sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  })
  logger.info("Invite email sent via SMTP", { to })
}

// ── Shared HTML shell ──

function wrapHtml({ title, body }: { title: string; body: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="padding:40px 40px 24px;text-align:center;">
                  <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;">${title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px;text-align:center;font-size:14px;color:#4b5563;line-height:1.7;">
                  ${body}
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// ── Password reset ──

interface SendPasswordResetEmailOptions {
  to: string
  name: string
  resetUrl: string
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailOptions) {
  const greeting = name ? `Hi ${name},` : "Hi there,"
  const html = wrapHtml({
    title: "Reset your password",
    body: `
      <p>${greeting}</p>
      <p>We received a request to reset the password for your Loop account.
      Click the button below to choose a new password. This link is valid
      for <strong>1 hour</strong> and can only be used once.</p>
      <p style="margin:28px 0 8px;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#22c55e;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
          Reset Password
        </a>
      </p>
    `,
  })
  const subject = "Reset your Loop password"

  if (RESEND_API_KEY) {
    await sendViaResend({ to, subject, html })
    logger.info("Password reset email sent via Resend", { to })
    return
  }

  await getSmtpTransporter().sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  })
  logger.info("Password reset email sent via SMTP", { to })
}

// ── Email verification ──

interface SendVerificationEmailOptions {
  to: string
  name: string
  verifyUrl: string
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: SendVerificationEmailOptions) {
  const greeting = name ? `Hi ${name},` : "Hi there,"
  const html = wrapHtml({
    title: "Verify your email",
    body: `
      <p>${greeting}</p>
      <p>Welcome to Loop! Please verify your email address to activate your
      account. Click the button below to confirm your email. This link is
      valid for <strong>24 hours</strong>.</p>
      <p style="margin:28px 0 8px;">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#22c55e;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
          Verify Email
        </a>
      </p>
    `,
  })
  const subject = "Verify your Loop email"

  if (RESEND_API_KEY) {
    await sendViaResend({ to, subject, html })
    logger.info("Verification email sent via Resend", { to })
    return
  }

  await getSmtpTransporter().sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  })
  logger.info("Verification email sent via SMTP", { to })
}
