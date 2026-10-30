function applyStroke(context, bitmap, stroke) {
  const points = stroke.points || []
  if (!points.length) return
  const radius = stroke.size / 2
  const addCircle = (point) => {
    context.moveTo(point.x + radius, point.y)
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
  }
  context.save()
  context.beginPath()
  addCircle(points[0])
  for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
    const start = points[pointIndex - 1]
    const end = points[pointIndex]
    const distance = Math.hypot(end.x - start.x, end.y - start.y)
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius * 0.45)))
    for (let stepIndex = 1; stepIndex <= steps; stepIndex += 1) {
      const fraction = stepIndex / steps
      addCircle({
        x: start.x + (end.x - start.x) * fraction,
        y: start.y + (end.y - start.y) * fraction
      })
    }
  }

  if (stroke.tool === 'erase') {
    context.globalCompositeOperation = 'destination-out'
    context.fill()
  } else {
    context.clip()
    context.globalCompositeOperation = 'source-over'
    let minX = points[0].x
    let minY = points[0].y
    let maxX = minX
    let maxY = minY
    for (const point of points) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
    const left = Math.max(0, Math.floor(minX - radius))
    const top = Math.max(0, Math.floor(minY - radius))
    const right = Math.min(bitmap.width, Math.ceil(maxX + radius))
    const bottom = Math.min(bitmap.height, Math.ceil(maxY + radius))
    context.drawImage(bitmap, left, top, right - left, bottom - top, left, top, right - left, bottom - top)
  }
  context.restore()
}

self.addEventListener('message', async (event) => {
  const { id, bitmap, type, strokes = [], backgroundColor = null, outputType = 'image/webp' } = event.data
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image encoding is unavailable in this browser.')
    context.drawImage(bitmap, 0, 0)
    if (type === 'render') {
      for (const stroke of strokes) applyStroke(context, bitmap, stroke)
    }
    if (backgroundColor) {
      context.save()
      context.globalCompositeOperation = 'destination-over'
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.restore()
    }
    bitmap.close()
    const blob = await canvas.convertToBlob({ type: outputType, quality: 0.92 })
    const formatName = outputType === 'image/png' ? 'PNG' : outputType === 'image/jpeg' ? 'JPEG' : 'WebP'
    if (blob.type !== outputType) throw new Error(`This browser cannot create ${formatName} images.`)
    self.postMessage({ id, blob })
  } catch (error) {
    bitmap.close()
    self.postMessage({ id, error: error.message || 'Could not create the edited WebP image.' })
  }
})
