import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '../../.env') })

const required = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']
const missing = required.filter((key) => !process.env[key])

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  siteUrl: process.env.SITE_URL || process.env.PUBLIC_URL || process.env.CLIENT_URL || `http://localhost:${Number(process.env.PORT) || 5000}`,
  enforceHttps: process.env.ENFORCE_HTTPS !== 'false',
  mongoUri: process.env.MONGODB_URI,
  dbSecretKey: process.env.DB_SECRET_KEY,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  adminName: process.env.ADMIN_NAME || 'MTC Studio Admin',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  whatsappNumber: process.env.WHATSAPP_NUMBER || '2348000000000',
  business: {
    name: process.env.BUSINESS_NAME || 'MTC Studio',
    email: process.env.BUSINESS_EMAIL || process.env.ADMIN_EMAIL,
    phone: process.env.BUSINESS_PHONE || process.env.WHATSAPP_NUMBER || '2348000000000',
    address: process.env.BUSINESS_ADDRESS || 'Lagos, Nigeria',
    serviceArea: process.env.BUSINESS_SERVICE_AREA || 'Lagos and across Nigeria',
    instagramUrl: process.env.INSTAGRAM_URL || '',
    tiktokUrl: process.env.TIKTOK_URL || '',
    facebookUrl: process.env.FACEBOOK_URL || ''
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || process.env.ADMIN_EMAIL
  }
}
