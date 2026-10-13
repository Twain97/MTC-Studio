import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { recordImageConversion } from '../lib/analytics.js'

const router = Router()
const conversionLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false
})

router.post('/image-conversion', conversionLimit, async (req, res, next) => {
  const origin = req.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== req.get('host')) return res.status(403).json({ message: 'Cross-origin analytics requests are not allowed.' })
    } catch {
      return res.status(403).json({ message: 'Invalid request origin.' })
    }
  }
  if (req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ message: 'Cross-origin analytics requests are not allowed.' })

  try {
    await recordImageConversion()
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

export default router
