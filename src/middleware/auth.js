import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { Admin } from '../models/Admin.js'

export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Admin authentication required.' })

    const payload = jwt.verify(token, env.jwtSecret)
    const admin = await Admin.findById(payload.sub)
    if (!admin) return res.status(401).json({ message: 'Admin account no longer exists.' })

    req.admin = admin
    next()
  } catch {
    res.status(401).json({ message: 'Your session is invalid or has expired.' })
  }
}

