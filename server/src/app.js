import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import messageRoutes from './routes/messages.js'
import dashboardRoutes from './routes/dashboard.js'
import { errorHandler, notFound } from './middleware/error.js'
import { uploadRoot } from './middleware/upload.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(currentDir, '../../client/dist')
const app = express()

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: env.clientUrl, credentials: false }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use('/uploads', express.static(uploadRoot, { maxAge: '7d', immutable: true }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/dashboard', dashboardRoutes)

if (env.nodeEnv === 'production') {
  app.use(express.static(clientDist))
  app.get('*all', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

app.use(notFound)
app.use(errorHandler)

export default app

