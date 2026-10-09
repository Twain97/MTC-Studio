import { unlink } from 'node:fs/promises'
import { Router } from 'express'
import { Project } from '../models/Project.js'
import { requireAdmin } from '../middleware/auth.js'
import { imageUpload } from '../middleware/upload.js'
import { deleteProjectImage, storeProjectImage } from '../lib/projectImageStorage.js'

const router = Router()
const projectUploads = imageUpload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 }
])

router.get('/', async (_req, res, next) => {
  try {
    res.json({ projects: await Project.find().sort({ eventDate: -1, createdAt: -1 }) })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found.' })
    res.json({ project })
  } catch (error) {
    next(error)
  }
})

router.post(
  '/',
  requireAdmin,
  projectUploads,
  async (req, res, next) => {
    const thumbnail = req.files?.thumbnail?.[0]
    const images = req.files?.images || []
    const temporaryFiles = [...(req.files?.thumbnail || []), ...images]
    const storedPaths = []

    try {
      if (!thumbnail) return res.status(400).json({ message: 'A thumbnail image is required.' })
      if (!req.body.eventName || !req.body.eventDate || !req.body.location) {
        return res.status(400).json({ message: 'Event name, month, and location are required.' })
      }

      const thumbnailPath = await storeProjectImage(thumbnail)
      storedPaths.push(thumbnailPath)
      const imagePaths = []
      for (const image of images) {
        const imagePath = await storeProjectImage(image)
        storedPaths.push(imagePath)
        imagePaths.push(imagePath)
      }

      const project = await Project.create({
        eventName: req.body.eventName,
        eventDate: new Date(`${req.body.eventDate}-01T12:00:00.000Z`),
        location: req.body.location,
        description: req.body.description,
        featured: req.body.featured === 'true',
        thumbnail: thumbnailPath,
        images: imagePaths
      })

      res.status(201).json({ message: 'Project uploaded.', project })
    } catch (error) {
      await Promise.allSettled(storedPaths.map(deleteProjectImage))
      next(error)
    } finally {
      await Promise.allSettled(temporaryFiles.map((file) => unlink(file.path)))
    }
  }
)

router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const update = {
      eventName: req.body.eventName,
      location: req.body.location,
      description: req.body.description,
      featured: req.body.featured
    }
    if (req.body.eventDate) update.eventDate = new Date(`${req.body.eventDate}-01T12:00:00.000Z`)
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key])

    const project = await Project.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!project) return res.status(404).json({ message: 'Project not found.' })
    res.json({ message: 'Project updated.', project })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found.' })

    await Promise.allSettled([project.thumbnail, ...project.images].map(deleteProjectImage))

    res.json({ message: 'Project deleted.' })
  } catch (error) {
    next(error)
  }
})

export default router
