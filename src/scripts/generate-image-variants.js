import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { Project } from '../models/Project.js'
import { copyProjectImageToFile, storeProjectImage, deleteProjectImage } from '../lib/projectImageStorage.js'
import { createWebpVariants } from '../lib/imageVariants.js'

async function generateVariants(imagePath, widths, tempDir) {
  const sourcePath = path.join(tempDir, `${Date.now()}-${Math.random().toString(16).slice(2)}.source`)
  await copyProjectImageToFile(imagePath, sourcePath)
  const sourceFile = {
    path: sourcePath,
    filename: path.basename(sourcePath),
    originalname: path.basename(sourcePath),
    mimetype: 'application/octet-stream'
  }
  const variants = await createWebpVariants(sourceFile, widths)
  const paths = {}
  const savedPaths = []

  try {
    for (const variant of variants) {
      const imageUrl = await storeProjectImage(variant)
      savedPaths.push(imageUrl)
      const key = variant.width <= widths[0] ? 'small' : 'large'
      paths[key] = imageUrl
      paths[`${key}Width`] = variant.width
    }
    return { paths, savedPaths }
  } catch (error) {
    await Promise.allSettled(savedPaths.map(deleteProjectImage))
    throw error
  } finally {
    await Promise.allSettled([sourcePath, ...variants.map((variant) => variant.path)].map((filePath) => fs.unlink(filePath)))
  }
}

async function migrate() {
  await connectDatabase()
  const projects = await Project.find()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mtc-image-variants-'))
  let updated = 0

  try {
    for (const project of projects) {
      const createdPaths = []
      try {
        let changed = false
        if (!project.thumbnailVariants?.small) {
          const result = await generateVariants(project.thumbnail, [480, 1280], tempDir)
          project.thumbnailVariants = result.paths
          createdPaths.push(...result.savedPaths)
          changed = true
        }

        const imageVariants = [...(project.imageVariants || [])]
        for (let index = 0; index < project.images.length; index += 1) {
          if (imageVariants[index]?.small) continue
          const result = await generateVariants(project.images[index], [640, 1600], tempDir)
          imageVariants[index] = result.paths
          createdPaths.push(...result.savedPaths)
          changed = true
        }

        if (changed) {
          project.imageVariants = imageVariants
          await project.save()
          updated += 1
          console.log(`Generated responsive images for ${project.eventName}`)
        }
      } catch (error) {
        await Promise.allSettled(createdPaths.map(deleteProjectImage))
        throw error
      }
    }
    console.log(`Finished. Updated ${updated} project(s).`)
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

migrate()
  .catch((error) => {
    console.error('Image variant generation failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
