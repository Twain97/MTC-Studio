import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { Admin } from '../models/Admin.js'
import { env } from '../config/env.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim()
    const password = String(req.body.password || '')
    const admin = await Admin.findOne({ email }).select('+password')

    if (!admin || !(await admin.matchesPassword(password))) {
      return res.status(401).json({ message: 'Invalid admin email or password.' })
    }

    admin.lastLoginAt = new Date()
    await admin.save()

    const token = jwt.sign({ sub: admin.id, role: 'admin' }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } })
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: { id: req.admin.id, name: req.admin.name, email: req.admin.email } })
})

export default router

