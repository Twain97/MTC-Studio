import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { Project } from '../models/Project.js'
import { Message } from '../models/Message.js'
import { getSiteSettings } from '../lib/siteSettings.js'

const router = Router()

router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const [projectCount, messageCount, unreadCount, deliveredCount, recentMessages, settings] = await Promise.all([
      Project.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ isRead: false }),
      Message.countDocuments({ emailStatus: 'sent' }),
      Message.find().sort({ createdAt: -1 }).limit(5).select('name email subject isRead createdAt'),
      getSiteSettings()
    ])

    res.json({
      projectCount,
      messageCount,
      unreadCount,
      deliveredCount,
      recentMessages,
      constructionOverlayEnabled: settings.constructionOverlayEnabled
    })
  } catch (error) {
    next(error)
  }
})

export default router
