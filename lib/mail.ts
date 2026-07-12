import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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

export async function sendInviteEmail({
  to,
  name,
  role,
  inviteUrl,
  invitedByName,
}: SendInviteEmailOptions) {
  const roleLabel = ROLE_LABELS[role] || "Member"

  const html = `
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
                  <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;">You're Invited to Loop</h1>
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

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "Loop <noreply@loop.app>",
    to,
    subject: `You're invited to join Loop as ${roleLabel}`,
    html,
  })
}
