import app from './app.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'
import { ensureAdminAccount } from './services/adminService.js'

async function start() {
  try {
    await connectDatabase()
    await ensureAdminAccount()
    app.listen(env.port, () => console.log(`MTC Studio API listening on port ${env.port}`))
  } catch (error) {
    console.error('Unable to start server:', error)
    process.exit(1)
  }
}

start()
