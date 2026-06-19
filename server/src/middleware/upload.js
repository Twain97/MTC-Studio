import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
export const uploadRoot = path.resolve(currentDir, '../../uploads')

function storageFor(folder) {
  const destination = path.join(uploadRoot, folder)
  fs.mkdirSync(destination, { recursive: true })

  return multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, destination),
    filename: (_req, file, callback) => {
      const safeBase = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 50)
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${path.extname(file.originalname).toLowerCase()}`)
    }
  })
}

export const imageUpload = multer({
  storage: storageFor('images'),
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    callback(allowed.includes(file.mimetype) ? null : new Error('Only JPG, PNG, and WebP images are allowed.'), allowed.includes(file.mimetype))
  }
})

export const contractUpload = multer({
  storage: storageFor('contracts'),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = file.mimetype === 'application/pdf'
    callback(allowed ? null : new Error('Contracts must be PDF files.'), allowed)
  }
})

export function publicUploadPath(file, folder) {
  return `/uploads/${folder}/${file.filename}`
}

