import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import mongoose from 'mongoose'
import { uploadRoot } from '../middleware/upload.js'

const BUCKET_NAME = 'projectImages'
const imagePathPattern = /^\/uploads\/images\/([a-f\d]{24})$/i

function getBucket() {
  const database = mongoose.connection.db
  if (!database) throw new Error('MongoDB must be connected before storing project images.')
  return new mongoose.mongo.GridFSBucket(database, { bucketName: BUCKET_NAME })
}

export async function storeProjectImage(file) {
  const bucket = getBucket()
  const upload = bucket.openUploadStream(file.filename, {
    metadata: {
      contentType: file.mimetype,
      originalName: file.originalname
    }
  })

  try {
    await pipeline(createReadStream(file.path), upload)
    return `/uploads/images/${upload.id.toString()}`
  } catch (error) {
    if (upload.id) await bucket.delete(upload.id).catch(() => {})
    throw error
  }
}

export async function deleteProjectImage(imagePath) {
  const gridFsMatch = imagePathPattern.exec(String(imagePath))
  if (gridFsMatch) {
    await getBucket().delete(new mongoose.Types.ObjectId(gridFsMatch[1]))
    return
  }

  // Continue to clean up legacy disk uploads when the file is still available.
  const relativePath = String(imagePath).replace(/^\/uploads\//, '')
  const legacyPath = path.resolve(uploadRoot, relativePath)
  if (!legacyPath.startsWith(`${uploadRoot}${path.sep}`)) return
  try {
    await fs.unlink(legacyPath)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

export async function serveProjectImage(req, res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(404).end()

  try {
    const bucket = getBucket()
    const id = new mongoose.Types.ObjectId(req.params.id)
    const file = await bucket.find({ _id: id }).next()
    if (!file) return res.status(404).end()

    res.setHeader('Content-Type', file.metadata?.contentType || 'application/octet-stream')
    res.setHeader('Content-Length', file.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    bucket.openDownloadStream(id).on('error', next).pipe(res)
  } catch (error) {
    next(error)
  }
}
