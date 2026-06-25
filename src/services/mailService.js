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

function studioFrom() {
  return {
    name: 'MTC Studio',
    address: env.smtp.user || env.adminEmail
  }
}

export async function notifyAdmin(message) {
  const transporter = createTransporter()
  if (!transporter) return { status: 'not_configured' }

  try {
    await transporter.sendMail({
      from: studioFrom(),
      to: env.adminEmail,
      replyTo: { name: message.name, address: message.email },
      subject: `New website inquiry: ${message.subject}`,
      text: [
        'New MTC Studio inquiry',
        '',
        `From: ${message.name} <${message.email}>`,
        message.phone ? `Phone: ${message.phone}` : null,
        `Subject: ${message.subject}`,
        '',
        message.body
      ].filter(Boolean).join('\n'),
      html: `<h2>New MTC Studio inquiry</h2><p><strong>From:</strong> ${message.name} &lt;${message.email}&gt;</p>${message.phone ? `<p><strong>Phone:</strong> ${message.phone}</p>` : ''}<p><strong>Subject:</strong> ${message.subject}</p><p>${message.body.replace(/\n/g, '<br>')}</p>`
    })
    return { status: 'sent' }
  } catch (error) {
    return { status: 'failed', error: error.message }
  }
}

export async function replyToClient(message, body, contract, admin = {}) {
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
    from: studioFrom(),
    to: message.email,
    replyTo: { name: admin.name || env.adminName, address: admin.email || env.adminEmail },
    subject: `MTC Studio reply: ${message.subject}`,
    text: [
      `Hello ${message.name},`,
      '',
      body,
      '',
      'Regards,',
      'MTC Studio'
    ].join('\n'),
    html: `<p>Hello ${message.name},</p><p>${body.replace(/\n/g, '<br>')}</p><p>Regards,<br>MTC Studio</p>`,
    attachments
  })
}
