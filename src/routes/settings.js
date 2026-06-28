import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { getSiteSettings, setConstructionOverlayEnabled } from '../lib/siteSettings.js'

const router = Router()

router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const settings = await getSiteSettings()
    res.json({ constructionOverlayEnabled: settings.constructionOverlayEnabled })
  } catch (error) {
    next(error)
  }
})

router.patch('/construction-overlay', requireAdmin, async (req, res, next) => {
  try {
    if (typeof req.body.enabled !== 'boolean') {
      return res.status(400).json({ message: 'Overlay enabled state must be true or false.' })
    }

    const settings = await setConstructionOverlayEnabled(req.body.enabled)
    res.json({ constructionOverlayEnabled: settings.constructionOverlayEnabled })
  } catch (error) {
    next(error)
  }
})

export default router
