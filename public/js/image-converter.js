import LibRaw from '/vendor/libraw-wasm/index.js'
import { deleteToolSession, getToolSessions, putToolSession } from './tool-session-storage.js'

(() => {
  const input = document.querySelector('[data-converter-files]')
  if (!input) return

  const format = document.querySelector('[data-converter-format]')
  const dropZone = document.querySelector('[data-converter-drop-zone]')
  const convertButton = document.querySelector('[data-convert]')
  const downloadAllButton = document.querySelector('[data-converter-download-all]')
  const clearButton = document.querySelector('[data-converter-clear]')
  const progress = document.querySelector('[data-converter-progress]')
  const progressLabel = document.querySelector('[data-converter-progress-label]')
  const results = document.querySelector('[data-converter-results]')
  const errorMessage = document.querySelector('[data-converter-error]')
  const toast = document.querySelector('[data-converter-toast]')
  const items = []
  const maxFiles = 5
  const maxFileBytes = 20 * 1024 * 1024
  const itemLifetimeMs = 30 * 60 * 1000
  const outputFormats = {
    'image/jpeg': { extension: 'jpg', label: 'JPG (JPEG)', quality: 0.92 },
    'image/png': { extension: 'png', label: 'PNG' },
    'image/webp': { extension: 'webp', label: 'WebP', quality: 0.9 }
  }
  const rawExtensions = /\.(raw|cr2|cr3|nef|nrw|arw|srf|sr2|dng|raf|orf|rw2|pef|ptx|srw|3fr|fff|iiq|kdc|dcr|mos|mrw|x3f|rwl|cap|eip)$/i
  let isConverting = false
  let toastTimer

  const bytesLabel = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`

  function showToast(message) {
    toast.textContent = message
    toast.classList.remove('hidden')
    clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 4000)
  }

  function revokeUrl(url) {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  function clearItemResources(item) {
    clearTimeout(item.expiryTimer)
    revokeUrl(item.outputUrl)
    item.outputUrl = null
    item.outputBlob = null
    item.file = null
  }

  function updateControls() {
    convertButton.disabled = items.length === 0 || isConverting
    clearButton.classList.toggle('hidden', items.length === 0)
    downloadAllButton.classList.toggle('hidden', !items.some((item) => item.outputUrl))
  }

  function expireItem(item) {
    if (item.expired) return
    item.expired = true
    clearItemResources(item)
    deleteToolSession('image-converter', item.id).catch(() => {})
    item.card.remove()
    const index = items.indexOf(item)
    if (index !== -1) items.splice(index, 1)
    if (items.length === 0) errorMessage.textContent = 'Images were cleared after 30 minutes. Add them again to continue.'
    updateControls()
  }

  function scheduleExpiry(item) {
    clearTimeout(item.expiryTimer)
    item.expiryTimer = window.setTimeout(() => expireItem(item), Math.max(0, item.expiresAt - Date.now()))
  }

  function makeCard(file, session = {}) {
    const card = document.createElement('article')
    card.className = 'grid grid-cols-[4.5rem_1fr] items-start gap-4 rounded-md border border-dawn-200 p-4 sm:grid-cols-[6rem_1fr]'
    const thumbnail = document.createElement('div')
    thumbnail.className = 'grid aspect-square place-items-center rounded bg-dawn-100 text-[10px] font-bold uppercase tracking-[.12em] text-dawn-500'
    thumbnail.textContent = rawExtensions.test(file.name) ? 'RAW' : 'Image'
    const details = document.createElement('div')
    details.className = 'min-w-0'
    const name = document.createElement('h2')
    name.className = 'break-all text-sm font-bold text-dawn-950'
    name.textContent = file.name
    const size = document.createElement('p')
    size.className = 'mt-1 text-xs text-dawn-600'
    size.textContent = `Original: ${bytesLabel(file.size)}`
    const type = document.createElement('p')
    type.className = 'mt-1 text-xs text-dawn-600'
    const extension = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : ''
    type.textContent = `Image type: ${file.type || (extension ? `${extension} file` : 'Unknown')}`
    const status = document.createElement('p')
    status.className = 'mt-2 text-xs text-dawn-600'
    status.textContent = 'Ready to convert'
    const skeleton = document.createElement('div')
    skeleton.className = 'mt-3 hidden animate-pulse space-y-2'
    skeleton.setAttribute('aria-hidden', 'true')
    skeleton.innerHTML = '<span class="block h-3 w-2/3 rounded bg-dawn-200"></span><span class="block h-3 w-1/2 rounded bg-dawn-100"></span>'
    details.append(name, size, type, status, skeleton)
    card.append(thumbnail, details)
    results.append(card)
    const item = {
      id: session.id || crypto.randomUUID(),
      expiresAt: session.expiresAt || Date.now() + itemLifetimeMs,
      file, card, status, skeleton, outputUrl: null, outputBlob: session.outputBlob || null,
      outputName: session.outputName || null, expiryTimer: null, expired: false
    }
    scheduleExpiry(item)
    return item
  }

  function renderOutput(item, blob) {
    revokeUrl(item.outputUrl)
    item.outputBlob = blob
    item.outputUrl = URL.createObjectURL(blob)
    if (!item.outputName) {
      const formatInfo = outputFormats[blob.type]
      const baseName = item.file.name.replace(/\.[^.]+$/, '') || 'image'
      item.outputName = `${baseName}-converted.${formatInfo?.extension || 'img'}`
    }
    const result = document.createElement('div')
    result.className = 'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'
    const outputInfo = document.createElement('span')
    outputInfo.className = 'text-dawn-700'
    outputInfo.textContent = `${outputFormats[blob.type]?.label || blob.type}: ${bytesLabel(blob.size)}`
    const download = document.createElement('a')
    download.className = 'font-bold text-gold-700 underline'
    download.href = item.outputUrl
    download.download = item.outputName
    download.textContent = 'Download'
    result.append(outputInfo, download)
    item.status.replaceChildren(result)
  }

  function saveItem(item) {
    return putToolSession('image-converter', item.id, {
      file: item.file,
      outputBlob: item.outputBlob,
      outputName: item.outputName
    }, item.expiresAt)
  }

  function reportStorageError() {
    errorMessage.textContent = 'Your browser could not save these images for refresh recovery. Download any results before leaving.'
  }

  function canvasBlob(canvas, mime, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('This browser could not create the selected image format.'))
        if (blob.type !== mime) return reject(new Error(`Your browser cannot create ${outputFormats[mime].label} images.`))
        resolve(blob)
      }, mime, quality)
    })
  }

  async function loadStandardImage(file) {
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(file, { imageOrientation: 'from-image' })
      } catch {
        // Retry using the browser's HTML image decoder.
      }
    }
    const url = URL.createObjectURL(file)
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image()
        element.onload = () => resolve(element)
        element.onerror = () => reject(new Error('This image type is not supported by your browser.'))
        element.src = url
      })
      return { image, url }
    } catch (error) {
      URL.revokeObjectURL(url)
      throw error
    }
  }

  async function loadRawImage(file) {
    const decoder = new LibRaw()
    try {
      await decoder.open(new Uint8Array(await file.arrayBuffer()), {
        useCameraWb: true,
        useAutoWb: true,
        outputBps: 8
      })
      const decoded = await decoder.imageData()
      if (!decoded?.data || !decoded.width || !decoded.height) throw new Error('The RAW image could not be decoded.')
      const pixels = new Uint8ClampedArray(decoded.width * decoded.height * 4)
      const channels = decoded.colors || Math.round(decoded.data.length / (decoded.width * decoded.height))
      if (![1, 3, 4].includes(channels)) throw new Error('This RAW image has an unsupported color layout.')
      for (let sourceIndex = 0, targetIndex = 0; targetIndex < pixels.length; sourceIndex += channels, targetIndex += 4) {
        const scale = decoded.data instanceof Uint16Array ? 257 : 1
        if (channels === 1) {
          const gray = Math.round(decoded.data[sourceIndex] / scale)
          pixels[targetIndex] = gray
          pixels[targetIndex + 1] = gray
          pixels[targetIndex + 2] = gray
          pixels[targetIndex + 3] = 255
        } else {
          pixels[targetIndex] = Math.round(decoded.data[sourceIndex] / scale)
          pixels[targetIndex + 1] = Math.round(decoded.data[sourceIndex + 1] / scale)
          pixels[targetIndex + 2] = Math.round(decoded.data[sourceIndex + 2] / scale)
          pixels[targetIndex + 3] = channels === 4 ? Math.round(decoded.data[sourceIndex + 3] / scale) : 255
        }
      }
      return new ImageData(pixels, decoded.width, decoded.height)
    } catch (error) {
      throw new Error(`Could not decode this camera RAW file. Try exporting it as JPG or PNG. ${error.message || ''}`.trim())
    } finally {
      decoder.dispose()
    }
  }

  async function convert(item) {
    const file = item.file
    let source
    try {
      source = rawExtensions.test(file.name) ? await loadRawImage(file) : await loadStandardImage(file)
      if (item.expired) throw new Error('This file expired and was cleared. Add it again to convert it.')

      const canvas = document.createElement('canvas')
      const width = source instanceof ImageData ? source.width : source.naturalWidth || source.width || source.image?.naturalWidth
      const height = source instanceof ImageData ? source.height : source.naturalHeight || source.height || source.image?.naturalHeight
      if (!width || !height) throw new Error('The image has invalid dimensions.')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Image conversion is unavailable in this browser.')
      if (format.value === 'image/jpeg') {
        context.fillStyle = '#fff'
        context.fillRect(0, 0, width, height)
      }
      if (source instanceof ImageData) context.putImageData(source, 0, 0)
      else context.drawImage(source.image || source, 0, 0)
      const mime = format.value
      const settings = outputFormats[mime]
      const blob = await canvasBlob(canvas, mime, settings.quality)
      if (item.expired) throw new Error('This file expired and was cleared. Add it again to convert it.')

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
      item.outputName = `${baseName}-converted.${settings.extension}`
      renderOutput(item, blob)
      saveItem(item).catch(reportStorageError)
      fetch('/api/analytics/image-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        keepalive: true
      }).catch(() => {})
    } finally {
      if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close()
      if (source?.url) URL.revokeObjectURL(source.url)
    }
  }

  function addFiles(fileList) {
    errorMessage.textContent = ''
    if (isConverting) {
      errorMessage.textContent = 'Wait for conversion to finish before adding more images.'
      return
    }
    const selected = Array.from(fileList)
    const acceptedTypes = selected.filter((file) => file.type.startsWith('image/') || rawExtensions.test(file.name))
    const validSize = acceptedTypes.filter((file) => file.size <= maxFileBytes)
    const remaining = maxFiles - items.length
    const accepted = validSize.slice(0, Math.max(0, remaining))
    const messages = []
    if (acceptedTypes.length !== selected.length) messages.push('Some files were skipped because their type is not recognized as an image.')
    if (validSize.length !== acceptedTypes.length) {
      const message = 'Files larger than 20 MB were skipped.'
      messages.push(message)
      showToast(message)
    }
    if (accepted.length !== validSize.length) messages.push('You can add up to 5 images at a time.')
    if (!selected.length) messages.push('Choose an image to convert.')
    errorMessage.textContent = messages.join(' ')
    for (const file of accepted) {
      const item = makeCard(file)
      items.push(item)
      saveItem(item).catch(reportStorageError)
    }
    updateControls()
  }

  input.addEventListener('change', () => {
    addFiles(input.files)
    input.value = ''
  })
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

  convertButton.addEventListener('click', async () => {
    if (isConverting) return
    isConverting = true
    errorMessage.textContent = ''
    progress.classList.remove('hidden')
    progress.classList.add('flex')
    convertButton.disabled = true
    convertButton.textContent = 'Converting…'
    const batch = [...items]
    try {
      for (const [index, item] of batch.entries()) {
        if (item.expired) continue
        progressLabel.textContent = `Converting image ${index + 1} of ${batch.length}: ${item.file.name}`
        item.status.textContent = 'Converting…'
        item.skeleton.classList.remove('hidden')
        try {
          await convert(item)
        } catch (error) {
          item.status.textContent = error.message || 'This image could not be converted.'
        } finally {
          item.skeleton.classList.add('hidden')
        }
      }
    } finally {
      isConverting = false
      progress.classList.add('hidden')
      progress.classList.remove('flex')
      convertButton.textContent = 'Convert images'
      updateControls()
    }
  })

  downloadAllButton.addEventListener('click', () => {
    items.filter((item) => item.outputUrl).forEach((item, index) => {
      window.setTimeout(() => {
        const link = document.createElement('a')
        link.href = item.outputUrl
        link.download = item.outputName
        link.click()
      }, index * 250)
    })
  })

  clearButton.addEventListener('click', () => {
    if (isConverting) return
    for (const item of items) {
      item.expired = true
      clearItemResources(item)
      deleteToolSession('image-converter', item.id).catch(() => {})
    }
    items.length = 0
    results.replaceChildren()
    errorMessage.textContent = ''
    updateControls()
  })

  getToolSessions('image-converter').then((sessions) => {
    for (const session of sessions) {
      if (!session.payload?.file || items.length >= maxFiles) continue
      const item = makeCard(session.payload.file, {
        id: session.key,
        expiresAt: session.expiresAt,
        outputBlob: session.payload.outputBlob,
        outputName: session.payload.outputName
      })
      items.push(item)
      if (item.outputBlob) renderOutput(item, item.outputBlob)
    }
    updateControls()
  }).catch(() => {
    errorMessage.textContent = 'Saved images could not be restored from this browser.'
  })
})()
