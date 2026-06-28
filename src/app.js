import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import siteRoutes from './routes/site.js'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import messageRoutes from './routes/messages.js'
import dashboardRoutes from './routes/dashboard.js'
import settingsRoutes from './routes/settings.js'
import { errorHandler, notFound } from './middleware/error.js'
import { uploadRoot } from './middleware/upload.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const siteUrl = env.siteUrl.replace(/\/+$/, '')
const publicRoot = path.resolve(currentDir, '../public')

function setPublicCacheHeaders(res, filePath) {
  if (/\.(?:css|js)$/i.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
  }
}

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use((req, res, next) => {
  if (env.nodeEnv === 'production' && env.enforceHttps && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`)
  }
  next()
})
app.set('view engine', 'ejs')
app.set('views', path.resolve(currentDir, '../views'))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use(express.static(publicRoot, { maxAge: '7d', setHeaders: setPublicCacheHeaders }))
app.use('/uploads', express.static(uploadRoot, { maxAge: '7d', immutable: true }))

app.use((req, res, next) => {
  res.locals.whatsappNumber = env.whatsappNumber
  res.locals.business = env.business
  res.locals.socialLinks = [
    { name: 'Instagram', url: env.business.instagramUrl },
    { name: 'TikTok', url: env.business.tiktokUrl },
    { name: 'Facebook', url: env.business.facebookUrl }
  ].filter((link) => link.url)
  res.locals.page = ''
  res.locals.siteUrl = siteUrl
  res.locals.currentUrl = `${siteUrl}${req.originalUrl.split('?')[0] || '/'}`
  res.locals.defaultSeo = {
    title: 'MTC Studio | Wedding and Portrait Photography in Lagos',
    description: 'MTC Studio creates refined wedding, portrait, event, and brand photography in Lagos and across Nigeria.',
    image: `${siteUrl}/images/mtc-studio.png`
  }
  next()
})

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/', siteRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
