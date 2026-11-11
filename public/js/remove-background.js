import { deleteToolSession, getToolSessions, putToolSession } from './tool-session-storage.js'

(() => {
  const input = document.querySelector('[data-background-file]')
  if (!input) return

  const demoBefore = document.querySelector('[data-background-demo-before]')
  const demoAfter = document.querySelector('[data-background-demo-after]')
  const demoDivider = document.querySelector('[data-background-demo-divider]')
  if (demoBefore && demoAfter && demoDivider && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let animationFrame = 0
    let animationStart = 0
    function animateDemo(timestamp) {
      if (!animationStart) animationStart = timestamp
      const phase = ((timestamp - animationStart) % 6000) / 6000
      const position = 50 + Math.sin(phase * Math.PI * 2) * 40
      demoAfter.style.clipPath = `inset(0 0 0 ${position}%)`
      demoDivider.style.left = `${position}%`
      animationFrame = window.requestAnimationFrame(animateDemo)
    }
    animationFrame = window.requestAnimationFrame(animateDemo)
    window.addEventListener('pagehide', () => window.cancelAnimationFrame(animationFrame), { once: true })
  }

  const dropZone = document.querySelector('[data-background-drop-zone]')
  const sourcePreview = document.querySelector('[data-background-source-preview]')
  const sourceThumbnail = document.querySelector('[data-background-source-thumbnail]')
  const sourceName = document.querySelector('[data-background-source-name]')
  const before = document.querySelector('[data-background-before]')
  const comparison = document.querySelector('[data-background-comparison]')
  const after = document.querySelector('[data-background-after]')
  const divider = document.querySelector('[data-background-divider]')
  const editorOverlay = document.querySelector('[data-background-editor-overlay]')
  const editOpenButton = document.querySelector('[data-background-edit-open]')
  const editCloseButton = document.querySelector('[data-background-edit-close]')
  const editorViewport = document.querySelector('[data-background-editor-viewport]')
  const editCanvas = document.querySelector('[data-background-edit-canvas]')
  const editContext = editCanvas.getContext('2d')
  const cropSelectionBox = document.querySelector('[data-background-crop-selection]')
  const cropActions = document.querySelector('[data-background-crop-actions]')
  const cropApplyButton = document.querySelector('[data-background-crop-apply]')
  const cropCancelButton = document.querySelector('[data-background-crop-cancel]')
  const brushPreview = document.querySelector('[data-background-brush-preview]')
  const brushPreviewCanvas = document.querySelector('[data-background-brush-preview-canvas]')
  const brushPreviewContext = brushPreviewCanvas.getContext('2d')
  const toolButtons = [...document.querySelectorAll('aside [data-background-tool]')]
  const brushSizeInput = document.querySelector('aside [data-background-brush-size]')
  const brushSizeValue = document.querySelector('aside [data-background-brush-size-value]')
  const toolDescriptions = [...document.querySelectorAll('[data-tool-description]')]
  const backgroundColorButtons = [...document.querySelectorAll('[data-background-color]')]
  const undoButton = document.querySelector('[data-background-undo]')
  const redoButton = document.querySelector('[data-background-redo]')
  const zoomOutButton = document.querySelector('[data-background-zoom-out]')
  const zoomInButton = document.querySelector('[data-background-zoom-in]')
  const zoomValue = document.querySelector('[data-background-zoom-value]')
  const editedDownload = document.querySelector('[data-background-edited-download]')
  const editedDownloadControl = document.querySelector('[data-background-download-format-control]')
  const editedDownloadFormats = document.querySelector('[data-background-download-formats]')
  const downloadFormatButtons = [...document.querySelectorAll('[data-background-download-format]')]
  const pngDownloadSize = document.querySelector('[data-download-size="image/png"]')
  const jpegDownloadSize = document.querySelector('[data-download-size="image/jpeg"]')
  const webpDownloadSize = document.querySelector('[data-download-size="image/webp"]')
  const skeleton = document.querySelector('[data-background-skeleton]')
  const progress = [...document.querySelectorAll('[data-background-progress]')]
  const removeButton = document.querySelector('[data-remove-background]')
  const download = document.querySelector('[data-background-download]')
  const clearButton = document.querySelector('[data-background-clear]')
  const error = document.querySelector('[data-background-error]')
  const modelLoading = document.querySelector('[data-background-model-loading]')
  const modelLoadingLabel = document.querySelector('[data-background-model-loading-label]')
  const modelLoadingPercent = document.querySelector('[data-background-model-loading-percent]')
  const modelLoadingRing = document.querySelector('[data-background-model-loading-ring]')
  const modelLoadingCircle = document.querySelector('[data-background-model-loading-circle]')
  const modelRetry = document.querySelector('[data-background-model-retry]')
  const dialog = document.querySelector('[data-background-dialog]')
  const dialogMessage = document.querySelector('[data-background-dialog-message]')
  const convertLink = document.querySelector('[data-background-convert-link]')
  const closeDialogButton = document.querySelector('[data-background-dialog-close]')
  const maxFileBytes = 20 * 1024 * 1024
  const imageLifetimeMs = 30 * 60 * 1000
  const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
  const mimeForExtension = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
  let worker = null
  let sourceFile = null
  let sourceUrl = null
  let thumbnailUrl = null
  let resultUrl = null
  let originalResultBlob = null
  let editedUrl = null
  let baseOutputCanvas = null
  let editHistory = []
  let redoHistory = []
  let editCheckpoints = []
  let activeStroke = null
  let cropSelection = null
  let cropStart = null
  let pendingBrushPoints = []
  let pendingBrushPointer = null
  let brushFrame = 0
  let editSaveTimer = null
  let activeTool = 'erase'
  let editBackgroundColor = null
  let editRevision = 0
  let pngSizeCache = null
  if (window.matchMedia('(max-width: 639px)').matches) {
    brushSizeInput.value = '230'
    brushSizeValue.value = '230 px'
    brushSizeValue.textContent = '230 px'
  }
  let brushSize = Number(brushSizeInput.value)
  let editorZoom = 1
  const touchPointers = new Map()
  let touchGesture = null
  let mousePan = null
  let isProcessing = false
  let modelReady = false
  let modelLoadStarted = false
  let preloadListenerAttached = false
  let expiryTimer = null
  let modelLoadingTimer = null
  let expiresAt = 0
  let encodeWorker = null
  let encodeRequestId = 0
  const encodeRequests = new Map()

  function getEditorPreviewSize(width, height) {
    const longestSide = Math.max(width, height)
    const responsiveLimit = Math.min(1600, Math.max(1000, Math.ceil(Math.max(window.innerWidth, window.innerHeight) * 1.5)))
    const scale = Math.min(1, responsiveLimit / longestSide)
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    }
  }

  function getEncodeWorker() {
    if (encodeWorker || !('OffscreenCanvas' in window)) return encodeWorker
    try {
      encodeWorker = new Worker(new URL('./remove-background-encode-worker.js', import.meta.url), { type: 'module' })
      encodeWorker.addEventListener('message', (event) => {
        const request = encodeRequests.get(event.data.id)
        if (!request) return
        encodeRequests.delete(event.data.id)
        if (event.data.error) request.reject(new Error(event.data.error))
        else request.resolve(event.data.blob)
      })
      encodeWorker.addEventListener('error', (event) => {
        encodeWorker.terminate()
        encodeWorker = null
        for (const request of encodeRequests.values()) request.reject(new Error(event.message || 'Background encoding failed.'))
        encodeRequests.clear()
      })
    } catch {
      encodeWorker = null
    }
    return encodeWorker
  }

  async function encodeCanvas(canvas) {
    const worker = getEncodeWorker()
    if (worker && window.createImageBitmap) {
      try {
        const bitmap = await createImageBitmap(canvas)
        const id = ++encodeRequestId
        return await new Promise((resolve, reject) => {
          encodeRequests.set(id, { resolve, reject })
          worker.postMessage({ id, bitmap }, [bitmap])
        })
      } catch {
        // Use the browser's canvas encoder when worker encoding is unavailable.
      }
    }
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the edited WebP image.')), 'image/webp', 0.92)
    })
  }

  function compositeCanvas(canvas, color) {
    if (!color) return canvas
    const composite = document.createElement('canvas')
    composite.width = canvas.width
    composite.height = canvas.height
    const context = composite.getContext('2d')
    context.fillStyle = color
    context.fillRect(0, 0, composite.width, composite.height)
    context.drawImage(canvas, 0, 0)
    return composite
  }

  function updateBackgroundColorUI() {
    const selectedValue = editBackgroundColor || 'transparent'
    editorViewport.style.backgroundColor = editBackgroundColor || ''
    editorViewport.style.backgroundImage = editBackgroundColor ? 'none' : ''
    for (const button of backgroundColorButtons) {
      const selected = button.dataset.backgroundColor === selectedValue
      button.setAttribute('aria-pressed', String(selected))
      button.classList.toggle('border-gold-500', selected)
      button.classList.toggle('border-dawn-200', !selected)
    }
  }

  function applyCanvasBackground(context, width, height, color) {
    if (!color) return
    context.save()
    context.globalCompositeOperation = 'destination-over'
    context.fillStyle = color
    context.fillRect(0, 0, width, height)
    context.restore()
  }

  function recordImageActivity() {
    fetch('/api/analytics/image-conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      keepalive: true
    }).catch(() => {})
  }

  download.addEventListener('click', recordImageActivity)

  function renderFullResolutionOnMainThread(strokes, backgroundColor = null, outputType = 'image/webp') {
    const canvas = document.createElement('canvas')
    canvas.width = baseOutputCanvas.width
    canvas.height = baseOutputCanvas.height
    const context = canvas.getContext('2d')
    if (!context) return Promise.reject(new Error('Full resolution image editing is unavailable.'))
    context.drawImage(baseOutputCanvas, 0, 0)
    for (const stroke of strokes) paintBrushPath(context, stroke, stroke.points, canvas)
    applyCanvasBackground(context, canvas.width, canvas.height, backgroundColor)
    if (outputType === 'image/png' || outputType === 'image/jpeg') {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(`Could not create the ${outputType === 'image/png' ? 'PNG' : 'JPEG'} image.`)), outputType, 0.92)
      })
    }
    return canvasToWebp(canvas)
  }

  async function encodeFullResolutionEdit(strokes, backgroundColor = null, outputType = 'image/webp') {
    const worker = getEncodeWorker()
    if (!worker || !window.createImageBitmap) return renderFullResolutionOnMainThread(strokes, backgroundColor, outputType)

    try {
      const bitmap = await createImageBitmap(baseOutputCanvas)
      const id = ++encodeRequestId
      return await new Promise((resolve, reject) => {
        encodeRequests.set(id, { resolve, reject })
        try {
          worker.postMessage({ id, type: 'render', bitmap, strokes, backgroundColor, outputType }, [bitmap])
        } catch (workerError) {
          encodeRequests.delete(id)
          bitmap.close()
          reject(workerError)
        }
      })
    } catch {
      encodeWorker?.terminate()
      encodeWorker = null
      return renderFullResolutionOnMainThread(strokes, backgroundColor, outputType)
    }
  }

  function scheduleEditedSave() {
    const revision = ++editRevision
    if (editSaveTimer) clearTimeout(editSaveTimer)
    editSaveTimer = setTimeout(() => {
      editSaveTimer = null
      saveEditedOutput(revision).catch((editError) => {
        error.textContent = editError.message || 'Could not save this edit.'
      })
    }, 450)
  }

  function openEditor() {
    if (!baseOutputCanvas) return
    editorOverlay.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
    editCloseButton.focus()
  }

  function closeEditor() {
    editorOverlay.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
    editOpenButton.focus()
  }

  editOpenButton.addEventListener('click', openEditor)
  editCloseButton.addEventListener('click', closeEditor)
  function setDownloadFormatsOpen(open) {
    editedDownload.setAttribute('aria-expanded', String(open))
    editedDownloadFormats.setAttribute('aria-hidden', String(!open))
    editedDownloadFormats.classList.toggle('max-h-0', !open)
    editedDownloadFormats.classList.toggle('p-0', !open)
    editedDownloadFormats.classList.toggle('opacity-0', !open)
    editedDownloadFormats.classList.toggle('-translate-y-1', !open)
    editedDownloadFormats.classList.toggle('pointer-events-none', !open)
    editedDownloadFormats.style.maxHeight = open ? '16rem' : '0'
    editedDownloadFormats.classList.toggle('p-2', open)
    editedDownloadFormats.classList.toggle('opacity-100', open)
    editedDownloadFormats.classList.toggle('translate-y-0', open)
    editedDownloadFormats.classList.toggle('pointer-events-auto', open)
  }

  function getCurrentEditStrokes() {
    return editHistory.map((stroke) => ({
      tool: stroke.tool,
      size: stroke.size,
      points: stroke.points.map((point) => ({ x: point.x, y: point.y }))
    }))
  }

  async function getDownloadBlob(outputType) {
    if ((!editHistory.length && !editBackgroundColor) || !baseOutputCanvas) return null
    if (!pngSizeCache || pngSizeCache.revision !== editRevision) {
      pngSizeCache = { revision: editRevision, promises: new Map() }
    }
    if (!pngSizeCache.promises.has(outputType)) pngSizeCache.promises.set(outputType, encodeFullResolutionEdit(getCurrentEditStrokes(), editBackgroundColor, outputType))
    const blob = await pngSizeCache.promises.get(outputType)
    if (pngSizeCache.revision === editRevision) {
      const sizeText = `(${(blob.size / (1024 * 1024)).toFixed(2)} MB)`
      const labels = { 'image/png': pngDownloadSize, 'image/jpeg': jpegDownloadSize, 'image/webp': webpDownloadSize }
      labels[outputType].textContent = sizeText
    }
    return blob
  }

  editedDownload.addEventListener('click', () => {
    const open = editedDownload.getAttribute('aria-expanded') !== 'true'
    setDownloadFormatsOpen(open)
    if (open) {
      for (const sizeLabel of [pngDownloadSize, jpegDownloadSize, webpDownloadSize]) sizeLabel.textContent = 'please wait...'
      for (const outputType of ['image/png', 'image/jpeg', 'image/webp']) {
        getDownloadBlob(outputType).catch(() => {
          const labels = { 'image/png': pngDownloadSize, 'image/jpeg': jpegDownloadSize, 'image/webp': webpDownloadSize }
          labels[outputType].textContent = '(estimate unavailable)'
        })
      }
    }
  })
  document.addEventListener('click', (event) => {
    if (!editedDownloadControl.contains(event.target)) setDownloadFormatsOpen(false)
  })
  downloadFormatButtons.forEach((button) => button.addEventListener('click', async () => {
    if ((!editHistory.length && !editBackgroundColor) || !baseOutputCanvas) return
    const outputType = button.dataset.backgroundDownloadFormat
    const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[outputType]
    button.setAttribute('aria-busy', 'true')
    try {
      const blob = await getDownloadBlob(outputType)
      if (!blob) return
      if (blob.type !== outputType) throw new Error(`This browser cannot create ${outputType.replace('image/', '').toUpperCase()} images.`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${sourceFile.name.replace(/\.[^.]+$/, '') || 'image'}-edited.${extension}`
      document.body.append(link)
      link.click()
      link.remove()
      recordImageActivity()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setDownloadFormatsOpen(false)
    } catch (downloadError) {
      error.textContent = downloadError.message || 'Could not create the full resolution edited image.'
    } finally {
      button.removeAttribute('aria-busy')
    }
  }))
  editorOverlay.addEventListener('click', (event) => {
    if (event.target === editorOverlay) closeEditor()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !editorOverlay.classList.contains('hidden')) closeEditor()
  })

  function canvasToWebp(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Could not create the WebP image.'))
        if (blob.type !== 'image/webp') return reject(new Error('This browser cannot create WebP images.'))
        resolve(blob)
      }, 'image/webp', 0.92)
    })
  }

  async function fileToWebp(file) {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      throw new Error('Image preview is unavailable in this browser.')
    }
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    return canvasToWebp(canvas)
  }

  async function pixelsToWebp(buffer, width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image preview is unavailable in this browser.')
    context.putImageData(new ImageData(new Uint8ClampedArray(buffer), width, height), 0, 0)
    return canvasToWebp(canvas)
  }

  function updateModelLoading(percent, label) {
    const safePercent = Math.max(0, Math.min(100, Math.round(percent)))
    modelLoading.classList.remove('hidden')
    modelLoading.classList.add('flex')
    modelLoadingLabel.textContent = label
    modelLoadingPercent.textContent = `${safePercent}%`
    modelLoadingRing.setAttribute('aria-valuenow', String(safePercent))
    modelLoadingRing.classList.toggle('animate-spin', safePercent < 100)
    modelLoadingCircle.style.strokeDashoffset = String(100 - safePercent)
    modelRetry.classList.add('hidden')
  }

  function updateRemoveButton() {
    if (isProcessing) {
      removeButton.disabled = true
      removeButton.textContent = 'Removing background…'
      return
    }
    removeButton.disabled = !sourceFile || !modelReady
    removeButton.textContent = sourceFile && !modelReady ? 'Please Wait' : 'Remove background'
  }

  function applyPreloadState(state) {
    if (state.status === 'downloading') {
      updateModelLoading(state.percent || 0, 'First-time model loading. Please wait.')
    } else if (state.status === 'checking') {
      updateModelLoading(0, 'Checking for the model…')
    } else if (state.status === 'cached') {
      updateModelLoading(100, 'Rounding Up...')
    } else if (state.status === 'error') {
      updateModelLoading(0, 'Rounding Up...')
    }
  }

  async function beginModelLoad(retry = false) {
    if (modelLoadStarted) return
    modelLoadStarted = true
    window.clearTimeout(modelLoadingTimer)
    modelReady = false
    updateRemoveButton()
    const preload = window.mtcBackgroundModelPreload
    if (preload) {
      if (!preloadListenerAttached) {
        preload.addEventListener('change', (event) => applyPreloadState(event.detail))
        preloadListenerAttached = true
      }
      applyPreloadState(preload.state)
      try {
        if (retry && preload.state.status === 'error') await preload.retry()
        else await preload.ready
      } catch {
        // The worker can still fetch the model directly if persistent caching fails.
      }
    }
    try {
      getWorker().postMessage({ type: 'load' })
    } catch (workerError) {
      modelLoadingLabel.textContent = workerError.message || 'The background removal model could not start.'
      modelRetry.classList.remove('hidden')
      modelLoadStarted = false
    }
  }

  function getWorker() {
    if (worker) return worker

    worker = new Worker('/js/remove-background-worker.js', { type: 'module' })
    worker.addEventListener('message', async (event) => {
      const message = event.data
      if (message.type === 'progress') {
        progress.forEach((element) => { element.textContent = message.message })
        if (message.operation === 'load' && Number.isFinite(message.percent)) {
          updateModelLoading(Math.min(message.percent, 99), message.message)
        }
        return
      }
      if (message.type === 'model-ready') {
        try { window.localStorage.setItem('mtc-background-model-ready', 'true') } catch {}
        modelReady = true
        updateModelLoading(100, 'Background removal model is ready.')
        modelLoadingTimer = window.setTimeout(() => {
          modelLoading.classList.add('hidden')
          modelLoading.classList.remove('flex')
        }, 900)
        updateRemoveButton()
        return
      }
      if (message.type === 'model-load-error') {
        modelLoadingLabel.textContent = message.message || 'The background removal model could not load.'
        modelRetry.classList.remove('hidden')
        modelLoadStarted = false
        updateRemoveButton()
        return
      }
      if (message.type === 'error') {
        error.textContent = message.message
        skeleton.classList.add('hidden')
        isProcessing = false
        updateRemoveButton()
        return
      }
      if (message.type !== 'result') return

      try {
        const blob = await pixelsToWebp(message.buffer, message.width, message.height)
        await showResult(blob)
        putToolSession('remove-background', 'current', { file: sourceFile, resultBlob: blob, editedBlob: null, editHistory: [], redoHistory: [] }, expiresAt).catch(() => {
          error.textContent = 'Your browser could not save this result for refresh recovery. Download it before leaving.'
        })
      } catch (processingError) {
        error.textContent = processingError.message || 'Could not prepare the transparent image.'
      } finally {
        skeleton.classList.add('hidden')
        isProcessing = false
        updateRemoveButton()
      }
    })

    worker.addEventListener('error', (event) => {
      console.error('Background removal worker failed to start:', event.message, event.filename, event.error)
      const details = [event.message, event.filename].filter(Boolean).join(' — ')
      error.textContent = details
        ? `The background removal worker failed to start: ${details}`
        : 'The background removal model could not start. Refresh the page and try again.'
      modelLoadingLabel.textContent = error.textContent
      modelRetry.classList.remove('hidden')
      worker?.terminate()
      worker = null
      skeleton.classList.add('hidden')
      isProcessing = false
      modelLoadStarted = false
      updateRemoveButton()
    })

    return worker
  }

  function showDialog(message, offerConversion = false) {
    dialogMessage.textContent = message
    convertLink.classList.toggle('hidden', !offerConversion)
    dialog.classList.remove('hidden')
    dialog.classList.add('grid')
    closeDialogButton.focus()
  }

  function closeDialog() {
    dialog.classList.add('hidden')
    dialog.classList.remove('grid')
  }

  function clearResult() {
    hideCropSelection()
    editBackgroundColor = null
    updateBackgroundColorUI()
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (editedUrl) URL.revokeObjectURL(editedUrl)
    resultUrl = null
    originalResultBlob = null
    editedUrl = null
    baseOutputCanvas = null
    pngSizeCache = null
    editRevision += 1
    editHistory = []
    redoHistory = []
    editCheckpoints = []
    activeStroke = null
    pendingBrushPoints = []
    pendingBrushPointer = null
    hideBrushPreview()
    if (brushFrame) cancelAnimationFrame(brushFrame)
    brushFrame = 0
    if (editSaveTimer) clearTimeout(editSaveTimer)
    editSaveTimer = null
    editRevision += 1
    comparison.classList.add('hidden')
    after.removeAttribute('src')
    after.classList.add('hidden')
    divider.classList.add('hidden')
    download.classList.add('hidden')
    download.removeAttribute('href')
    editedDownloadControl.classList.add('hidden')
    setDownloadFormatsOpen(false)
    editorOverlay.classList.add('hidden')
    editOpenButton.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
    editorZoom = 1
    updateEditorZoom()
    editCanvas.width = 0
    editCanvas.height = 0
    undoButton.disabled = true
    redoButton.disabled = true
    divider.disabled = true
    updateReveal()
  }

  async function showResult(blob, editedBlob = null, restoredHistory = [], restoredRedoHistory = [], restoredBackgroundColor = null) {
    hideCropSelection()
    editBackgroundColor = restoredBackgroundColor || null
    updateBackgroundColorUI()
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (editedUrl) URL.revokeObjectURL(editedUrl)
    editCheckpoints = []
    resultUrl = URL.createObjectURL(blob)
    originalResultBlob = blob
    editedUrl = null
    const bitmap = await createImageBitmap(blob)
    baseOutputCanvas = document.createElement('canvas')
    baseOutputCanvas.width = bitmap.width
    baseOutputCanvas.height = bitmap.height
    baseOutputCanvas.getContext('2d').drawImage(bitmap, 0, 0)
    bitmap.close()
    const previewSize = getEditorPreviewSize(baseOutputCanvas.width, baseOutputCanvas.height)
    editCanvas.width = previewSize.width
    editCanvas.height = previewSize.height
    editHistory = Array.isArray(restoredHistory) ? restoredHistory : []
    redoHistory = Array.isArray(restoredRedoHistory) ? restoredRedoHistory : []
    editContext.drawImage(baseOutputCanvas, 0, 0, editCanvas.width, editCanvas.height)
    if (editHistory.length) {
      drawEditorFromHistory()
    } else if (editedBlob) {
      const editedBitmap = await createImageBitmap(editedBlob)
      editContext.clearRect(0, 0, editCanvas.width, editCanvas.height)
      editContext.drawImage(editedBitmap, 0, 0, editCanvas.width, editCanvas.height)
      editedBitmap.close()
    }
    if (editedBlob) {
      editedUrl = URL.createObjectURL(editedBlob)
      after.src = editedUrl
      editedDownloadControl.classList.remove('hidden')
    } else {
      after.src = resultUrl
      editedDownloadControl.classList.add('hidden')
    }
    after.classList.remove('hidden')
    comparison.classList.remove('hidden')
    editOpenButton.classList.remove('hidden')
    divider.classList.remove('hidden')
    divider.disabled = false
    updateReveal()
    download.href = resultUrl
    download.download = `${sourceFile.name.replace(/\.[^.]+$/, '') || 'image'}-no-background.webp`
    download.classList.remove('hidden')
    undoButton.disabled = editHistory.length === 0
    redoButton.disabled = redoHistory.length === 0
  }

  function brushPoint(event) {
    const bounds = editCanvas.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * (baseOutputCanvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (baseOutputCanvas.height / bounds.height)
    }
  }

  function updateCropSelectionBox() {
    if (!cropSelection || !baseOutputCanvas) {
      cropSelectionBox.classList.add('hidden')
      return
    }
    const canvasBounds = editCanvas.getBoundingClientRect()
    const viewportBounds = editorViewport.getBoundingClientRect()
    const scaleX = canvasBounds.width / baseOutputCanvas.width
    const scaleY = canvasBounds.height / baseOutputCanvas.height
    cropSelectionBox.style.left = `${canvasBounds.left - viewportBounds.left + editorViewport.scrollLeft + cropSelection.x * scaleX}px`
    cropSelectionBox.style.top = `${canvasBounds.top - viewportBounds.top + editorViewport.scrollTop + cropSelection.y * scaleY}px`
    cropSelectionBox.style.width = `${cropSelection.width * scaleX}px`
    cropSelectionBox.style.height = `${cropSelection.height * scaleY}px`
    cropSelectionBox.classList.toggle('hidden', cropSelection.width < 2 || cropSelection.height < 2)
  }

  function hideCropSelection() {
    cropSelection = null
    cropStart = null
    cropSelectionBox.classList.add('hidden')
    cropActions.classList.add('hidden')
    cropActions.classList.remove('grid')
  }

  function updateCropSelection(point) {
    if (!cropStart) return
    cropSelection = {
      x: Math.min(cropStart.x, point.x),
      y: Math.min(cropStart.y, point.y),
      width: Math.abs(point.x - cropStart.x),
      height: Math.abs(point.y - cropStart.y)
    }
    updateCropSelectionBox()
  }

  function finishCropSelection() {
    if (!cropStart) return
    cropStart = null
    if (cropSelection && cropSelection.width >= 2 && cropSelection.height >= 2) {
      cropActions.classList.remove('hidden')
      cropActions.classList.add('grid')
    } else {
      hideCropSelection()
    }
  }

  function updateBrushPreview(clientX, clientY) {
    if (!['erase', 'restore'].includes(activeTool) || !activeStroke || !baseOutputCanvas) {
      hideBrushPreview()
      return
    }
    const bounds = editCanvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const previewSize = brushPreviewCanvas.width
    const magnification = 2.5
    // Map from the actual pointer location in CSS pixels. This keeps the lens
    // aligned when the editor is zoomed or the preview canvas is scaled down.
    const pointX = (clientX - bounds.left) * (editCanvas.width / bounds.width)
    const pointY = (clientY - bounds.top) * (editCanvas.height / bounds.height)
    const sourceWidth = Math.min(editCanvas.width, previewSize * (editCanvas.width / bounds.width) / magnification)
    const sourceHeight = Math.min(editCanvas.height, previewSize * (editCanvas.height / bounds.height) / magnification)
    const sourceX = Math.max(0, Math.min(editCanvas.width - sourceWidth, pointX - sourceWidth / 2))
    const sourceY = Math.max(0, Math.min(editCanvas.height - sourceHeight, pointY - sourceHeight / 2))
    brushPreviewContext.clearRect(0, 0, previewSize, previewSize)
    brushPreviewContext.save()
    brushPreviewContext.beginPath()
    brushPreviewContext.arc(previewSize / 2, previewSize / 2, previewSize / 2 - 2, 0, Math.PI * 2)
    brushPreviewContext.clip()
    // Show transparency in the lens the same way it appears in the editor.
    const checkerSize = 18
    brushPreviewContext.fillStyle = '#ffffff'
    brushPreviewContext.fillRect(0, 0, previewSize, previewSize)
    brushPreviewContext.fillStyle = '#d1d5db'
    for (let y = 0; y < previewSize; y += checkerSize) {
      for (let x = 0; x < previewSize; x += checkerSize) {
        if ((Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 1) {
          brushPreviewContext.fillRect(x, y, checkerSize, checkerSize)
        }
      }
    }
    brushPreviewContext.drawImage(editCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, previewSize, previewSize)
    const brushRadius = (activeStroke.size / 2) * Math.min(
      editCanvas.width / baseOutputCanvas.width,
      editCanvas.height / baseOutputCanvas.height
    )
    const brushRadiusX = brushRadius * (previewSize / sourceWidth)
    const brushRadiusY = brushRadius * (previewSize / sourceHeight)
    const previewPointX = (pointX - sourceX) * previewSize / sourceWidth
    const previewPointY = (pointY - sourceY) * previewSize / sourceHeight
    // The inner ring marks the exact brush footprint; the canvas rim is the
    // outer ring framing the magnified preview.
    brushPreviewContext.beginPath()
    brushPreviewContext.ellipse(previewPointX, previewPointY, brushRadiusX + 1, brushRadiusY + 1, 0, 0, Math.PI * 2)
    brushPreviewContext.strokeStyle = activeTool === 'restore' ? '#facc15' : '#ffffff'
    brushPreviewContext.lineWidth = 2
    brushPreviewContext.shadowColor = 'rgba(0, 0, 0, 0.9)'
    brushPreviewContext.shadowBlur = 3
    brushPreviewContext.stroke()
    brushPreviewContext.shadowBlur = 0
    brushPreviewContext.restore()
    const left = clientX - previewSize / 2
    const top = clientY - previewSize / 2
    brushPreview.style.left = `${left}px`
    brushPreview.style.top = `${top}px`
    brushPreview.classList.remove('hidden')
  }

  function hideBrushPreview() {
    brushPreview.classList.add('hidden')
  }

  function updateEditorZoom() {
    const percent = Math.round(editorZoom * 100)
    zoomValue.value = `${percent}%`
    zoomValue.textContent = `${percent}%`
    zoomOutButton.disabled = editorZoom <= 0.25
    zoomInButton.disabled = editorZoom >= 3
    editCanvas.style.width = `${percent}%`
    editCanvas.style.maxWidth = editorZoom > 1 ? 'none' : ''
    editCanvas.style.maxHeight = editorZoom > 1 ? 'none' : ''
    // Keep a zoomed-out canvas centered in the viewport. Once it is larger
    // than the viewport, remove the centering offset so scrolling/panning
    // starts from the actual top-left edge of the image.
    const canvasBounds = editCanvas.getBoundingClientRect()
    editCanvas.style.marginLeft = `${Math.max(0, (editorViewport.clientWidth - canvasBounds.width) / 2)}px`
    editCanvas.style.marginTop = `${Math.max(0, (editorViewport.clientHeight - canvasBounds.height) / 2)}px`
    editorViewport.scrollLeft = Math.min(editorViewport.scrollLeft, editorViewport.scrollWidth - editorViewport.clientWidth)
    editorViewport.scrollTop = Math.min(editorViewport.scrollTop, editorViewport.scrollHeight - editorViewport.clientHeight)
    updateCropSelectionBox()
  }

  editorViewport.addEventListener('scroll', updateCropSelectionBox)
  window.addEventListener('resize', () => {
    updateEditorZoom()
    updateCropSelectionBox()
  })

  zoomOutButton.addEventListener('click', () => {
    editorZoom = Math.max(0.25, Math.round((editorZoom - 0.25) * 100) / 100)
    updateEditorZoom()
  })
  zoomInButton.addEventListener('click', () => {
    editorZoom = Math.min(3, Math.round((editorZoom + 0.25) * 100) / 100)
    updateEditorZoom()
  })

  function touchDistance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y)
  }

  function touchCenter(first, second) {
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
  }

  function startTouchGesture() {
    const points = [...touchPointers.values()]
    if (points.length >= 2) {
      const center = touchCenter(points[0], points[1])
      const bounds = editorViewport.getBoundingClientRect()
      touchGesture = {
        type: 'pinch',
        distance: Math.max(1, touchDistance(points[0], points[1])),
        zoom: editorZoom,
        centerX: center.x - bounds.left,
        centerY: center.y - bounds.top,
        scrollLeft: editorViewport.scrollLeft,
        scrollTop: editorViewport.scrollTop
      }
    } else if (points.length === 1) {
      touchGesture = { type: 'pan', x: points[0].x, y: points[0].y, scrollLeft: editorViewport.scrollLeft, scrollTop: editorViewport.scrollTop }
    }
  }

  editorViewport.addEventListener('pointerdown', (event) => {
    if (activeTool !== 'neutral' || !baseOutputCanvas) return
    if (event.pointerType === 'mouse') {
      if (event.detail < 2) return
      event.preventDefault()
      editorViewport.setPointerCapture(event.pointerId)
      mousePan = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, scrollLeft: editorViewport.scrollLeft, scrollTop: editorViewport.scrollTop }
      return
    }
    if (event.pointerType !== 'touch') return
    event.preventDefault()
    editorViewport.setPointerCapture(event.pointerId)
    touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    startTouchGesture()
  })

  editorViewport.addEventListener('pointermove', (event) => {
    if (mousePan?.pointerId === event.pointerId && activeTool === 'neutral') {
      editorViewport.scrollLeft = mousePan.scrollLeft - (event.clientX - mousePan.x)
      editorViewport.scrollTop = mousePan.scrollTop - (event.clientY - mousePan.y)
      return
    }
    if (!touchPointers.has(event.pointerId) || activeTool !== 'neutral') return
    touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...touchPointers.values()]
    if (points.length >= 2) {
      if (touchGesture?.type !== 'pinch') startTouchGesture()
      if (touchGesture?.type !== 'pinch') return
      const scale = touchDistance(points[0], points[1]) / touchGesture.distance
      editorZoom = Math.max(0.25, Math.min(3, touchGesture.zoom * scale))
      updateEditorZoom()
      editorViewport.scrollLeft = (touchGesture.scrollLeft + touchGesture.centerX) * (editorZoom / touchGesture.zoom) - touchGesture.centerX
      editorViewport.scrollTop = (touchGesture.scrollTop + touchGesture.centerY) * (editorZoom / touchGesture.zoom) - touchGesture.centerY
    } else if (touchGesture?.type === 'pan') {
      editorViewport.scrollLeft = touchGesture.scrollLeft - (event.clientX - touchGesture.x)
      editorViewport.scrollTop = touchGesture.scrollTop - (event.clientY - touchGesture.y)
    }
  })

  function endTouchGesture(event) {
    if (mousePan?.pointerId === event.pointerId) mousePan = null
    if (!touchPointers.has(event.pointerId)) return
    touchPointers.delete(event.pointerId)
    touchGesture = null
    if (touchPointers.size) startTouchGesture()
  }

  editorViewport.addEventListener('pointerup', endTouchGesture)
  editorViewport.addEventListener('pointercancel', endTouchGesture)

  function paintBrushPath(context, stroke, points, targetCanvas = editCanvas) {
    if (!points.length) return
    const scaleX = targetCanvas.width / baseOutputCanvas.width
    const scaleY = targetCanvas.height / baseOutputCanvas.height
    const radius = stroke.size * Math.min(scaleX, scaleY) / 2
    const sourceRadius = stroke.size / 2
    let minX = points[0].x
    let minY = points[0].y
    let maxX = minX
    let maxY = minY
    context.save()
    context.beginPath()
    const addCircle = (point) => {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
      const x = point.x * scaleX
      const y = point.y * scaleY
      context.moveTo(x + radius, y)
      context.arc(x, y, radius, 0, Math.PI * 2)
    }
    addCircle(points[0])
    for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
      const start = points[pointIndex - 1]
      const end = points[pointIndex]
      const distance = Math.hypot(end.x - start.x, end.y - start.y)
      const steps = Math.max(1, Math.ceil(distance / Math.max(1, sourceRadius * 0.45)))
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
      const left = Math.max(0, Math.floor(minX - sourceRadius))
      const top = Math.max(0, Math.floor(minY - sourceRadius))
      const right = Math.min(baseOutputCanvas.width, Math.ceil(maxX + sourceRadius))
      const bottom = Math.min(baseOutputCanvas.height, Math.ceil(maxY + sourceRadius))
      context.drawImage(baseOutputCanvas, left, top, right - left, bottom - top, left * scaleX, top * scaleY, (right - left) * scaleX, (bottom - top) * scaleY)
    }
    context.restore()
  }

  function drawEditorFromHistory() {
    const checkpoint = [...editCheckpoints].reverse().find((item) => item.count <= editHistory.length)
    let startIndex = 0
    if (checkpoint) {
      editContext.putImageData(checkpoint.image, 0, 0)
      startIndex = checkpoint.count
    } else {
      editContext.clearRect(0, 0, editCanvas.width, editCanvas.height)
      editContext.drawImage(baseOutputCanvas, 0, 0, editCanvas.width, editCanvas.height)
    }
    for (let strokeIndex = startIndex; strokeIndex < editHistory.length; strokeIndex += 1) {
      const stroke = editHistory[strokeIndex]
      paintBrushPath(editContext, stroke, stroke.points)
    }
    editCheckpoints = editCheckpoints.filter((item) => item.count <= editHistory.length)
    undoButton.disabled = editHistory.length === 0
    redoButton.disabled = redoHistory.length === 0
  }

  async function saveEditedOutput(revision) {
    if (editHistory.length && editHistory.length % 8 === 0 && !editCheckpoints.some((item) => item.count === editHistory.length)) {
      editCheckpoints = [...editCheckpoints, { count: editHistory.length, image: editContext.getImageData(0, 0, editCanvas.width, editCanvas.height) }].slice(-2)
    }
    const historySnapshot = editHistory.map((stroke) => ({
      tool: stroke.tool,
      size: stroke.size,
      points: stroke.points.map((point) => ({ x: point.x, y: point.y }))
    }))
    const redoSnapshot = redoHistory.map((stroke) => ({
      tool: stroke.tool,
      size: stroke.size,
      points: stroke.points.map((point) => ({ x: point.x, y: point.y }))
    }))
    let blob = null
    if (historySnapshot.length || editBackgroundColor) {
      blob = await encodeCanvas(compositeCanvas(editCanvas, editBackgroundColor))
      if (blob.type !== 'image/webp') throw new Error('This browser cannot create WebP images.')
    }
    if (revision !== editRevision || !sourceFile) return
    if (editedUrl) URL.revokeObjectURL(editedUrl)
    editedUrl = blob ? URL.createObjectURL(blob) : null
    after.src = editedUrl || resultUrl
    if (blob) {
      editedDownloadControl.classList.remove('hidden')
    } else {
      editedDownloadControl.classList.add('hidden')
    }
    putToolSession('remove-background', 'current', {
      file: sourceFile,
      resultBlob: originalResultBlob,
      editedBlob: blob,
      editHistory: historySnapshot,
      redoHistory: redoSnapshot,
      backgroundColor: editBackgroundColor
    }, expiresAt).catch(() => {
      error.textContent = 'Your browser could not save the edited result for refresh recovery.'
    })
  }

  async function applyCropSelection() {
    if (!cropSelection || !baseOutputCanvas || !sourceFile) return
    const left = Math.max(0, Math.floor(cropSelection.x))
    const top = Math.max(0, Math.floor(cropSelection.y))
    const right = Math.min(baseOutputCanvas.width, Math.ceil(cropSelection.x + cropSelection.width))
    const bottom = Math.min(baseOutputCanvas.height, Math.ceil(cropSelection.y + cropSelection.height))
    const width = right - left
    const height = bottom - top
    if (width < 2 || height < 2) return

    cropApplyButton.disabled = true
    try {
      const nextBase = document.createElement('canvas')
      nextBase.width = width
      nextBase.height = height
      nextBase.getContext('2d').drawImage(baseOutputCanvas, left, top, width, height, 0, 0, width, height)
      const croppedResultBlob = await canvasToWebp(nextBase)

      if (editSaveTimer) clearTimeout(editSaveTimer)
      editSaveTimer = null
      editRevision += 1
      const shiftStrokes = (strokes) => strokes.filter((stroke) => {
        const radius = stroke.size / 2
        const xs = stroke.points.map((point) => point.x)
        const ys = stroke.points.map((point) => point.y)
        return Math.max(...xs) + radius > left && Math.min(...xs) - radius < right &&
          Math.max(...ys) + radius > top && Math.min(...ys) - radius < bottom
      }).map((stroke) => ({
        ...stroke,
        points: stroke.points.map((point) => ({ x: point.x - left, y: point.y - top }))
      }))
      editHistory = shiftStrokes(editHistory)
      redoHistory = shiftStrokes(redoHistory)
      editCheckpoints = []
      baseOutputCanvas = nextBase
      originalResultBlob = croppedResultBlob

      if (resultUrl) URL.revokeObjectURL(resultUrl)
      resultUrl = URL.createObjectURL(croppedResultBlob)
      download.href = resultUrl
      download.download = `${sourceFile.name.replace(/\.[^.]+$/, '')}-no-background.webp`

      const previewSize = getEditorPreviewSize(width, height)
      editCanvas.width = previewSize.width
      editCanvas.height = previewSize.height
      drawEditorFromHistory()
      if (editedUrl) URL.revokeObjectURL(editedUrl)
      editedUrl = null
      editedDownloadControl.classList.add('hidden')
      after.src = resultUrl
      after.classList.remove('hidden')
      download.classList.remove('hidden')
      updateReveal()
      hideCropSelection()
      scheduleEditedSave()
    } catch (cropError) {
      error.textContent = cropError.message || 'Could not crop this image.'
    } finally {
      cropApplyButton.disabled = false
    }
  }

  function finishStroke() {
    if (!activeStroke) return
    flushBrushPoints()
    hideBrushPreview()
    pendingBrushPointer = null
    editHistory.push(activeStroke)
    redoHistory = []
    editCheckpoints = editCheckpoints.filter((item) => item.count <= editHistory.length - 1)
    activeStroke = null
    undoButton.disabled = false
    redoButton.disabled = true
    scheduleEditedSave()
  }

  function flushBrushPoints() {
    if (brushFrame) cancelAnimationFrame(brushFrame)
    brushFrame = 0
    if (!activeStroke || !pendingBrushPoints.length) {
      pendingBrushPoints = []
      return
    }
    const pointsToPaint = [activeStroke.points[activeStroke.points.length - 1], ...pendingBrushPoints]
    paintBrushPath(editContext, activeStroke, pointsToPaint)
    activeStroke.points.push(...pendingBrushPoints)
    pendingBrushPoints = []
    if (pendingBrushPointer && activeStroke) {
      updateBrushPreview(pendingBrushPointer.x, pendingBrushPointer.y)
      pendingBrushPointer = null
    }
  }

  editCanvas.addEventListener('pointerdown', (event) => {
    if (!baseOutputCanvas || activeTool === 'neutral') return
    event.preventDefault()
    editCanvas.setPointerCapture(event.pointerId)
    const point = brushPoint(event)
    if (activeTool === 'crop') {
      cropStart = point
      cropSelection = { x: point.x, y: point.y, width: 0, height: 0 }
      cropActions.classList.add('hidden')
      cropActions.classList.remove('grid')
      updateCropSelectionBox()
      return
    }
    if (editSaveTimer) clearTimeout(editSaveTimer)
    editSaveTimer = null
    editRevision += 1
    activeStroke = { tool: activeTool, size: brushSize, points: [point] }
    paintBrushPath(editContext, activeStroke, [point])
    updateBrushPreview(event.clientX, event.clientY)
  })
  editCanvas.addEventListener('pointermove', (event) => {
    if (activeTool === 'crop' && cropStart && editCanvas.hasPointerCapture(event.pointerId)) {
      updateCropSelection(brushPoint(event))
      return
    }
    if (!activeStroke || !editCanvas.hasPointerCapture(event.pointerId)) return
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event]
    for (const pointerEvent of events) pendingBrushPoints.push(brushPoint(pointerEvent))
    const lastEvent = events[events.length - 1]
    if (lastEvent) pendingBrushPointer = { x: lastEvent.clientX, y: lastEvent.clientY }
    if (!brushFrame) {
      brushFrame = requestAnimationFrame(() => {
        brushFrame = 0
        flushBrushPoints()
      })
    }
  })
  editCanvas.addEventListener('pointerup', (event) => {
    if (activeTool === 'crop') finishCropSelection()
    else finishStroke()
  })
  editCanvas.addEventListener('pointercancel', (event) => {
    if (activeTool === 'crop') finishCropSelection()
    else finishStroke()
  })

  for (const button of toolButtons) {
    button.addEventListener('click', () => {
      finishStroke()
      activeTool = button.dataset.backgroundTool
      if (activeTool !== 'crop') hideCropSelection()
      editCanvas.style.touchAction = 'none'
      if (activeTool !== 'neutral') {
        touchPointers.clear()
        touchGesture = null
      }
      for (const toolButton of toolButtons) {
        const selected = toolButton === button
        toolButton.setAttribute('aria-pressed', String(selected))
        toolButton.classList.toggle('bg-dawn-900', selected)
        toolButton.classList.toggle('text-white', selected)
        toolButton.classList.toggle('border', !selected)
        toolButton.classList.toggle('border-dawn-300', !selected)
        toolButton.classList.toggle('bg-white', !selected)
        toolButton.classList.toggle('text-dawn-800', !selected)
      }
      for (const description of toolDescriptions) {
        description.classList.toggle('hidden', description.dataset.toolDescription !== activeTool)
      }
    })
  }

  for (const description of toolDescriptions) {
    description.classList.toggle('hidden', description.dataset.toolDescription !== activeTool)
  }

  for (const button of backgroundColorButtons) {
    button.addEventListener('click', () => {
      finishStroke()
      editBackgroundColor = button.dataset.backgroundColor === 'transparent' ? null : button.dataset.backgroundColor
      updateBackgroundColorUI()
      if (baseOutputCanvas) scheduleEditedSave()
    })
  }

  cropApplyButton.addEventListener('click', applyCropSelection)
  cropCancelButton.addEventListener('click', hideCropSelection)

  brushSizeInput.addEventListener('input', () => {
    brushSize = Number(brushSizeInput.value)
    brushSizeValue.value = `${brushSize} px`
    brushSizeValue.textContent = `${brushSize} px`
  })

  undoButton.addEventListener('click', () => {
    if (!editHistory.length) return
    redoHistory.push(editHistory.pop())
    drawEditorFromHistory()
    scheduleEditedSave()
  })

  redoButton.addEventListener('click', () => {
    if (!redoHistory.length) return
    editHistory.push(redoHistory.pop())
    drawEditorFromHistory()
    scheduleEditedSave()
  })

  function updateReveal() {
    const position = Math.max(0, Math.min(100, Number(divider.getAttribute('aria-valuenow')) || 0))
    before.style.clipPath = `inset(0 ${100 - position}% 0 0)`
    after.style.clipPath = `inset(0 0 0 ${position}%)`
    divider.style.left = `${position}%`
    divider.setAttribute('aria-valuenow', String(position))
  }

  function setRevealFromPointer(event) {
    const bounds = divider.parentElement.getBoundingClientRect()
    if (!bounds.width) return
    const position = Math.round(((event.clientX - bounds.left) / bounds.width) * 100)
    divider.setAttribute('aria-valuenow', String(Math.max(0, Math.min(100, position))))
    updateReveal()
  }

  divider.addEventListener('pointerdown', (event) => {
    if (divider.disabled) return
    event.preventDefault()
    divider.setPointerCapture(event.pointerId)
    setRevealFromPointer(event)
  })
  divider.addEventListener('pointermove', (event) => {
    if (divider.hasPointerCapture(event.pointerId)) setRevealFromPointer(event)
  })
  divider.addEventListener('keydown', (event) => {
    if (divider.disabled) return
    const current = Number(divider.getAttribute('aria-valuenow')) || 0
    const step = event.shiftKey ? 10 : 1
    let next
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = 100
    else return
    event.preventDefault()
    divider.setAttribute('aria-valuenow', String(Math.max(0, Math.min(100, next))))
    updateReveal()
  })

  function clearSourcePreview() {
    sourcePreview.classList.add('hidden')
    sourcePreview.classList.remove('flex')
    sourceThumbnail.removeAttribute('src')
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl)
    thumbnailUrl = null
    sourceName.textContent = ''
  }

  async function setFile(file, options = {}) {
    if (isProcessing) {
      error.textContent = 'Wait for background removal to finish before choosing another image.'
      return
    }
    error.textContent = ''
    window.clearTimeout(expiryTimer)
    expiryTimer = null
    if (!options.restore) deleteToolSession('remove-background', 'current').catch(() => {})
    expiresAt = 0
    clearResult()
    clearSourcePreview()
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    sourceUrl = null
    sourceFile = null
    before.removeAttribute('src')
    before.classList.add('hidden')
    updateReveal()
    updateRemoveButton()
    clearButton.classList.add('hidden')

    if (!file) return
    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : ''
    const type = file.type || mimeForExtension[extension]
    if (!acceptedTypes.has(type)) {
      showDialog('This file type is not supported. Convert the image to JPG, PNG, or WebP before removing its background.', true)
      return
    }
    if (file.size > maxFileBytes) {
      showDialog('The image is larger than 20 MB. Choose an image that is 20 MB or smaller.')
      return
    }

    sourceFile = file
    updateRemoveButton()
    expiresAt = options.expiresAt || Date.now() + imageLifetimeMs
    sourceName.textContent = file.name
    sourcePreview.classList.remove('hidden')
    sourcePreview.classList.add('flex')
    thumbnailUrl = URL.createObjectURL(file)
    sourceThumbnail.src = thumbnailUrl
    clearButton.classList.remove('hidden')
    if (!options.restore) {
      putToolSession('remove-background', 'current', { file, resultBlob: null }, expiresAt).catch(() => {
        error.textContent = 'Your browser could not save this image for refresh recovery.'
      })
    }
    scheduleImageExpiry()
    try {
      const webpBlob = await fileToWebp(file)
      if (sourceFile !== file) return
      sourceUrl = URL.createObjectURL(webpBlob)
      before.src = sourceUrl
      before.classList.remove('hidden')
      updateRemoveButton()
    } catch (conversionError) {
      if (sourceFile !== file) return
      setFile(null)
      error.textContent = conversionError.message || 'Could not convert this image to WebP.'
      return
    }
  }

  function scheduleImageExpiry() {
    window.clearTimeout(expiryTimer)
    expiryTimer = window.setTimeout(expireImage, Math.max(0, expiresAt - Date.now()))
  }

  function expireImage() {
    if (isProcessing) {
      expiryTimer = window.setTimeout(expireImage, 1000)
      return
    }
    setFile(null).then(() => {
      error.textContent = 'This image expired after 30 minutes. Choose it again to continue.'
    })
  }

  input.addEventListener('change', () => {
    setFile(input.files?.[0])
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
  dropZone.addEventListener('drop', (event) => setFile(event.dataTransfer.files?.[0]))

  removeButton.addEventListener('click', () => {
    if (!sourceFile || !modelReady || isProcessing) return
    isProcessing = true
    error.textContent = ''
    clearResult()
    putToolSession('remove-background', 'current', { file: sourceFile, resultBlob: null }, expiresAt).catch(() => {
      error.textContent = 'Your browser could not save the image for refresh recovery.'
    })
    skeleton.classList.remove('hidden')
    progress.forEach((element) => { element.textContent = 'Fetching Subject' })
    updateRemoveButton()
    try {
      getWorker().postMessage({ type: 'remove', file: sourceFile })
    } catch (workerError) {
      error.textContent = workerError.message || 'The background removal model could not start. Refresh the page and try again.'
      skeleton.classList.add('hidden')
      isProcessing = false
      updateRemoveButton()
    }
  })

  modelRetry.addEventListener('click', () => beginModelLoad(true))

  clearButton.addEventListener('click', () => {
    if (isProcessing) return
    setFile(null)
    error.textContent = ''
  })

  closeDialogButton.addEventListener('click', closeDialog)
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog()
  })
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.classList.contains('hidden')) closeDialog()
  })
  window.addEventListener('pagehide', () => {
    window.clearTimeout(expiryTimer)
    window.clearTimeout(modelLoadingTimer)
    worker?.terminate()
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
  })

  getToolSessions('remove-background').then(async (sessions) => {
    const session = sessions[0]
    if (!session?.payload?.file) return
    await setFile(session.payload.file, { expiresAt: session.expiresAt, restore: true })
    if (session.payload.resultBlob && sourceFile) {
      await showResult(session.payload.resultBlob, session.payload.editedBlob, session.payload.editHistory, session.payload.redoHistory, session.payload.backgroundColor)
    }
  }).catch(() => {
    error.textContent = 'Saved images could not be restored from this browser.'
  })

  beginModelLoad()
})()
