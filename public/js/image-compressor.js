(() => {
  const input = document.querySelector('[data-compressor-files]')
  if (!input) return

  const format = document.querySelector('[data-compressor-format]')
  const quality = document.querySelector('[data-compressor-quality]')
  const qualityValue = document.querySelector('[data-quality-value]')
  const qualityControl = document.querySelector('[data-quality-control]')
  const dropZone = document.querySelector('[data-drop-zone]')
  const compressButton = document.querySelector('[data-compress]')
  const downloadAllButton = document.querySelector('[data-download-all]')
  const clearImagesButton = document.querySelector('[data-clear-images]')
  const results = document.querySelector('[data-compressor-results]')
  const errorMessage = document.querySelector('[data-compressor-error]')
  const progress = document.querySelector('[data-compress-progress]')
  const progressLabel = document.querySelector('[data-compress-progress-label]')
  const items = []
  const maxFiles = 10
  const maxFileBytes = 50 * 1024 * 1024
  const itemLifetimeMs = 30 * 60 * 1000
  let isCompressing = false

  const extensionFor = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
  const formatLabel = { 'image/png': 'PNG', 'image/jpeg': 'JPG (JPEG)', 'image/webp': 'WebP' }
  const bytesLabel = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  function updateFormatControls() {
    qualityControl.classList.toggle('hidden', format.value === 'image/png')
  }

  function makeCard(file) {
    const card = document.createElement('article')
    card.className = 'grid grid-cols-[4.5rem_1fr] items-start gap-4 rounded-md border border-dawn-200 p-4 sm:grid-cols-[6rem_1fr]'

    const thumbnailFrame = document.createElement('div')
    thumbnailFrame.className = 'relative aspect-square overflow-hidden rounded bg-dawn-100'
    const thumbnail = document.createElement('img')
    thumbnail.className = 'hidden h-full w-full object-cover'
    thumbnail.alt = `WebP thumbnail of ${file.name}`
    const thumbnailSkeleton = document.createElement('div')
    thumbnailSkeleton.className = 'absolute inset-0 animate-pulse bg-dawn-200'
    thumbnailFrame.append(thumbnail, thumbnailSkeleton)
    card.append(thumbnailFrame)

    const details = document.createElement('div')
    details.className = 'min-w-0'
    const title = document.createElement('h2')
    title.className = 'break-all text-sm font-bold text-dawn-950'
    title.textContent = file.name
    const original = document.createElement('p')
    original.className = 'mt-1 text-xs text-dawn-600'
    original.textContent = `Original: ${bytesLabel(file.size)}`
    const status = document.createElement('p')
    status.className = 'mt-2 text-xs text-dawn-600'
    status.textContent = 'Loading image…'
    const cardSkeleton = document.createElement('div')
    cardSkeleton.className = 'mt-3 hidden animate-pulse space-y-2'
    cardSkeleton.setAttribute('aria-hidden', 'true')
    cardSkeleton.innerHTML = '<span class="block h-3 w-2/3 rounded bg-dawn-200"></span><span class="block h-3 w-1/2 rounded bg-dawn-100"></span>'
    details.append(title, original, status, cardSkeleton)
    card.append(details)
    results.append(card)
    const item = { file, card, status, thumbnail, thumbnailSkeleton, cardSkeleton, downloadUrl: null, thumbnailUrl: null, expiryTimer: null, expired: false, downloadName: null }
    scheduleExpiry(item)
    return item
  }

  function revokeUrl(url) {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  function clearItemResources(item) {
    clearTimeout(item.expiryTimer)
    revokeUrl(item.downloadUrl)
    revokeUrl(item.thumbnailUrl)
    item.downloadUrl = null
    item.thumbnailUrl = null
  }

  function updateQueueControls() {
    compressButton.disabled = items.length === 0 || isCompressing
    downloadAllButton.classList.toggle('hidden', !items.some((item) => item.downloadUrl))
    clearImagesButton.classList.toggle('hidden', items.length === 0)
  }

  function expireItem(item) {
    if (item.expired) return
    item.expired = true
    clearItemResources(item)
    item.card.remove()
    const itemIndex = items.indexOf(item)
    if (itemIndex !== -1) items.splice(itemIndex, 1)
    if (items.length === 0) errorMessage.textContent = 'Images were cleared after 30 minutes. Add them again to continue.'
    updateQueueControls()
  }

  function scheduleExpiry(item) {
    clearTimeout(item.expiryTimer)
    item.expiryTimer = window.setTimeout(() => expireItem(item), itemLifetimeMs)
  }

  async function showThumbnail(item, blob) {
    const url = URL.createObjectURL(blob)
    item.thumbnailUrl = url
    try {
      await new Promise((resolve, reject) => {
        item.thumbnail.onload = resolve
        item.thumbnail.onerror = () => reject(new Error('Thumbnail could not be displayed'))
        item.thumbnail.src = url
      })
      if (item.expired) return false
      item.thumbnail.classList.remove('hidden')
      item.thumbnailSkeleton.classList.add('hidden')
      return true
    } catch {
      revokeUrl(url)
      if (item.thumbnailUrl === url) item.thumbnailUrl = null
      return false
    }
  }

  async function createWebpThumbnail(item) {
    let source
    let sourceUrl
    try {
      if (typeof createImageBitmap === 'function') {
        try {
          source = await createImageBitmap(item.file, { imageOrientation: 'from-image' })
        } catch {
          // Fall back to the HTML image decoder when needed.
        }
      }
      if (!source) {
        const image = new Image()
        sourceUrl = URL.createObjectURL(item.file)
        source = await new Promise((resolve, reject) => {
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error('Could not create thumbnail'))
          image.src = sourceUrl
        })
      }
      if (item.expired) return
      const width = source.naturalWidth || source.width
      const height = source.naturalHeight || source.height
      const scale = Math.min(1, 320 / Math.max(width, height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width * scale))
      canvas.height = Math.max(1, Math.round(height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas image processing is unavailable.')
      context.drawImage(source, 0, 0, canvas.width, canvas.height)
      if (item.expired) return
      let shown = false
      try {
        const thumbnailBlob = await canvasBlob(canvas, 'image/webp', 0.78)
        shown = await showThumbnail(item, thumbnailBlob)
      } catch {
        // Try a PNG preview if this browser cannot encode or display WebP thumbnails.
      }
      if (!shown && !item.expired) {
        const fallbackBlob = await canvasBlob(canvas, 'image/png')
        shown = await showThumbnail(item, fallbackBlob)
      }
      if (!shown) throw new Error('Could not display thumbnail')
      if (item.cardSkeleton.classList.contains('hidden')) item.status.textContent = 'Ready to compress'
    } catch {
      if (!item.expired) item.status.textContent = 'Could not prepare this image preview.'
    } finally {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
      if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close()
    }
  }

  function addFiles(fileList) {
    errorMessage.textContent = ''
    if (isCompressing) {
      errorMessage.textContent = 'Wait for the current compression to finish before adding more images.'
      return
    }
    const allowedExtensions = /\.(jpe?g|png|webp)$/i
    const selected = Array.from(fileList)
    const images = selected.filter((file) => (
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || allowedExtensions.test(file.name)
    ))
    if (!images.length) {
      errorMessage.textContent = 'Choose a JPG, JPEG, PNG, or WebP image.'
      return
    }
    const validSize = images.filter((file) => file.size <= maxFileBytes)
    const remaining = maxFiles - items.length
    const accepted = validSize.slice(0, Math.max(remaining, 0))
    const messages = []
    if (images.length !== selected.length) messages.push('Some files were skipped. Choose JPG, JPEG, PNG, or WebP images.')
    if (validSize.length !== images.length) messages.push('Images larger than 50 MB were skipped.')
    if (accepted.length !== validSize.length) messages.push(`You can add up to ${maxFiles} images at a time.`)
    errorMessage.textContent = messages.join(' ')
    for (const file of accepted) {
      const item = makeCard(file)
      items.push(item)
      createWebpThumbnail(item)
    }
    if (accepted.length) {
      downloadAllButton.classList.add('hidden')
      clearImagesButton.classList.remove('hidden')
    }
    updateQueueControls()
  }

  function canvasBlob(canvas, mime, qualityValue) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('This browser could not create the selected format.'))
        if (blob.type !== mime) return reject(new Error(`This browser does not support ${formatLabel[mime]} output.`))
        resolve(blob)
      }, mime, qualityValue)
    })
  }

  async function compress(item) {
    let source
    let sourceUrl
    try {
      if (typeof createImageBitmap === 'function') {
        try {
          source = await createImageBitmap(item.file, { imageOrientation: 'from-image' })
        } catch {
          // Try the HTML image decoder below for browsers that reject this decode path.
        }
      }
      if (!source) {
        const image = new Image()
        sourceUrl = URL.createObjectURL(item.file)
        source = await new Promise((resolve, reject) => {
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error('Your browser could not decode this file. It may be damaged or use a JPEG encoding your browser does not support. Try opening and re-exporting it as a standard JPEG.'))
          image.src = sourceUrl
        })
      }
      if (item.expired) throw new Error('This image expired and was cleared. Add it again to compress it.')
      const canvas = document.createElement('canvas')
      canvas.width = source.naturalWidth || source.width
      canvas.height = source.naturalHeight || source.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas image processing is unavailable in this browser.')
      if (format.value === 'image/jpeg') {
        context.fillStyle = '#fff'
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
      context.drawImage(source, 0, 0)
      const mime = format.value
      const blob = await canvasBlob(canvas, mime, mime === 'image/png' ? undefined : Number(quality.value) / 100)
      if (item.expired) throw new Error('This image expired and was cleared. Add it again to compress it.')
      if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl)
      item.downloadUrl = URL.createObjectURL(blob)
      const baseName = item.file.name.replace(/\.[^.]+$/, '') || 'image'
      item.downloadName = `${baseName}-compressed.${extensionFor[mime]}`
      scheduleExpiry(item)

      const result = document.createElement('div')
      result.className = 'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'
      const size = document.createElement('span')
      const saved = item.file.size ? Math.round((1 - blob.size / item.file.size) * 100) : 0
      size.className = 'text-dawn-700'
      size.textContent = `${formatLabel[mime]}: ${bytesLabel(blob.size)} (${saved >= 0 ? `${saved}% smaller` : `${Math.abs(saved)}% larger`})`
      const link = document.createElement('a')
      link.className = 'font-bold text-gold-700 underline'
      link.href = item.downloadUrl
      link.download = item.downloadName
      link.textContent = 'Download'
      result.append(size, link)
      item.status.replaceChildren(result)
      fetch('/api/analytics/image-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        keepalive: true
      }).catch(() => {})
    } finally {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
      if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close()
    }
  }

  input.addEventListener('change', () => {
    addFiles(input.files)
    input.value = ''
  })
  quality.addEventListener('input', () => { qualityValue.value = `${quality.value}%` })
  format.addEventListener('change', updateFormatControls)
  updateFormatControls()

  for (const eventName of ['dragenter', 'dragover']) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      dropZone.classList.add('border-gold-500', 'bg-gold-50')
    })
  }
  for (const eventName of ['dragleave', 'drop']) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      dropZone.classList.remove('border-gold-500', 'bg-gold-50')
    })
  }
  dropZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files))

  compressButton.addEventListener('click', async () => {
    if (isCompressing) return
    isCompressing = true
    errorMessage.textContent = ''
    progress.classList.remove('hidden')
    progress.classList.add('flex')
    compressButton.disabled = true
    compressButton.textContent = 'Compressing…'
    const batch = [...items]
    try {
      for (const [index, item] of batch.entries()) {
        if (item.expired) continue
        progressLabel.textContent = `Compressing image ${index + 1} of ${batch.length}: ${item.file.name}`
        item.status.textContent = 'Compressing…'
        item.cardSkeleton.classList.remove('hidden')
        try {
          await compress(item)
        } catch (error) {
          item.status.textContent = error.message || 'Could not compress this image.'
        } finally {
          item.cardSkeleton.classList.add('hidden')
        }
      }
    } finally {
      isCompressing = false
      progress.classList.add('hidden')
      progress.classList.remove('flex')
      compressButton.textContent = 'Compress images'
      updateQueueControls()
    }
  })

  downloadAllButton.addEventListener('click', () => {
    items.filter((item) => item.downloadUrl).forEach((item, index) => {
      window.setTimeout(() => {
        const link = document.createElement('a')
        link.href = item.downloadUrl
        link.download = item.downloadName
        link.click()
      }, index * 250)
    })
  })

  clearImagesButton.addEventListener('click', () => {
    if (isCompressing) return
    for (const item of items) {
      item.expired = true
      clearItemResources(item)
    }
    items.length = 0
    results.replaceChildren()
    errorMessage.textContent = ''
    updateQueueControls()
  })

  function clearAllOnExit() {
    for (const item of [...items]) {
      item.expired = true
      clearItemResources(item)
    }
    items.length = 0
    input.value = ''
    results.replaceChildren()
    updateQueueControls()
  }

  window.addEventListener('pagehide', clearAllOnExit)
})()
