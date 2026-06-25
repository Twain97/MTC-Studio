import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { Message } from '../models/Message.js'
import { requireAdmin } from '../middleware/auth.js'
import { contractUpload, publicUploadPath } from '../middleware/upload.js'
import { notifyAdmin, replyToClient } from '../services/mailService.js'

const router = Router()
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false })

router.post('/', contactLimiter, async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required.' })
    }

    const inquiry = await Message.create({ name, email, phone, subject, body: message })
    const delivery = await notifyAdmin(inquiry)
    inquiry.emailStatus = delivery.status
    inquiry.emailError = delivery.error
    await inquiry.save()

    res.status(201).json({
      message: delivery.status === 'sent'
        ? 'Your message was sent successfully.'
        : 'Your message was received. MTC Studio will respond soon.',
      delivery: delivery.status
    })
  } catch (error) {
    next(error)
  }
})

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.unread === 'true') filter.isRead = false
    if (req.query.status && ['sent', 'failed', 'not_configured'].includes(req.query.status)) {
      filter.emailStatus = req.query.status
    }
    const messages = await Message.find(filter).sort({ createdAt: -1 })
    res.json({ messages })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) return res.status(404).json({ message: 'Message not found.' })
    if (!message.isRead) {
      message.isRead = true
      message.readAt = new Date()
      await message.save()
    }
    res.json({ message })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/read', requireAdmin, async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    )
    if (!message) return res.status(404).json({ message: 'Message not found.' })
    res.json({ message })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/reply', requireAdmin, contractUpload.single('contract'), async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) return res.status(404).json({ message: 'Message not found.' })
    if (!req.body.body?.trim()) return res.status(400).json({ message: 'A reply message is required.' })

    await replyToClient(message, req.body.body.trim(), req.file, {
      name: req.admin?.name,
      email: req.admin?.email
    })
    message.replies.push({
      body: req.body.body.trim(),
      contractPath: req.file ? publicUploadPath(req.file, 'contracts') : undefined,
      adminName: req.admin?.name,
      adminEmail: req.admin?.email
    })
    message.isRead = true
    message.readAt ||= new Date()
    await message.save()

    res.json({ message: 'Reply sent to client.', inquiry: message })
  } catch (error) {
    next(error)
  }
})

export default router
