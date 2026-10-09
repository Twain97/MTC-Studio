import fs from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { Project } from '../models/Project.js'
import { uploadRoot } from '../middleware/upload.js'
import { storeProjectImage } from '../lib/projectImageStorage.js'

const contentTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

function isGridFsImage(imagePath) {
  return /^\/uploads\/images\/[a-f\d]{24}$/i.test(String(imagePath))
}

async function migrateImage(imagePath) {
  if (isGridFsImage(imagePath)) return imagePath
  const match = /^\/uploads\/images\/([^/]+)$/.exec(String(imagePath))
  if (!match) return imagePath

  const filename = path.basename(match[1])
  const filePath = path.resolve(uploadRoot, 'images', filename)
  if (!filePath.startsWith(`${path.resolve(uploadRoot, 'images')}${path.sep}`)) return imagePath

  const extension = path.extname(filename).toLowerCase()
  const mimetype = contentTypes[extension]
  if (!mimetype) return imagePath

  try {
    await fs.access(filePath)
  } catch {
    console.warn(`Missing local file; left unchanged: ${imagePath}`)
    return imagePath
  }

  return storeProjectImage({
    path: filePath,
    filename,
    originalname: filename,
    mimetype
  })
}

async function migrate() {
  await connectDatabase()
  const projects = await Project.find()
  let migrated = 0

  for (const project of projects) {
    const oldThumbnail = project.thumbnail
    const oldImages = [...project.images]
    project.thumbnail = await migrateImage(project.thumbnail)
    project.images = await Promise.all(project.images.map(migrateImage))

    const changes = (project.thumbnail !== oldThumbnail ? 1 : 0)
      + project.images.filter((image, index) => image !== oldImages[index]).length
    if (changes) {
      await project.save()
      migrated += changes
      console.log(`Migrated ${changes} image(s) for ${project.eventName}`)
    }
  }

  console.log(`Finished. Migrated ${migrated} image(s) across ${projects.length} project(s).`)
}

migrate()
  .catch((error) => {
    console.error('Image migration failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
