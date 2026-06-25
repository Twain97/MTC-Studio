import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

function hasSmtpCredentials() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass)
}

function createTransporter() {
  if (!hasSmtpCredentials()) return null

  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass }
  })
}

export async function notifyAdmin(message) {
  const transporter = createTransporter()
  if (!transporter) return { status: 'not_configured' }

  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to: env.adminEmail,
      replyTo: message.email,
      subject: `New website inquiry: ${message.subject}`,
      text: `${message.name} (${message.email}${message.phone ? `, ${message.phone}` : ''}) wrote:\n\n${message.body}`,
      html: `<h2>New MTC Studio inquiry</h2><p><strong>From:</strong> ${message.name} &lt;${message.email}&gt;</p><p><strong>Subject:</strong> ${message.subject}</p><p>${message.body.replace(/\n/g, '<br>')}</p>`
    })
    return { status: 'sent' }
  } catch (error) {
    return { status: 'failed', error: error.message }
  }
}

export async function replyToClient(message, body, contract) {
  const transporter = createTransporter()
  if (!transporter) {
    const error = new Error('SMTP is not configured. Add SMTP credentials to .env before replying.')
    error.status = 503
    throw error
  }

  const attachments = contract
    ? [{ filename: contract.originalname, path: contract.path, contentType: 'application/pdf' }]
    : []

  await transporter.sendMail({
    from: env.smtp.from,
    to: message.email,
    replyTo: env.adminEmail,
    subject: `Re: ${message.subject}`,
    text: body,
    html: `<p>Hello ${message.name},</p><p>${body.replace(/\n/g, '<br>')}</p><p>Regards,<br>MTC Studio</p>`,
    attachments
  })
}

