import { Admin } from '../models/Admin.js'
import { env } from '../config/env.js'

export async function ensureAdminAccount() {
  const email = env.adminEmail.toLowerCase()
  const existing = await Admin.findOne({ email })

  if (!existing) {
    await Admin.create({ name: env.adminName, email, password: env.adminPassword })
    console.log(`Admin account created for ${email}`)
  }
}

