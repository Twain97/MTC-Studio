export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(error, _req, res, _next) {
  console.error(error)

  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(' ') })
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists.' })
  }

  res.status(error.status || 500).json({ message: error.message || 'Unexpected server error.' })
}

