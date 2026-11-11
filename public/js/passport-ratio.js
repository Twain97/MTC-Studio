import { deleteToolSession, getToolSessions, putToolSession } from './tool-session-storage.js'

(() => {
  const fileInput = document.querySelector('[data-passport-file]')
  if (!fileInput) return
  const unitOverlay = document.querySelector('[data-passport-unit-overlay]')
  const unitButtons = [...document.querySelectorAll('[data-passport-unit]')]
  const unitHeading = document.querySelector('[data-passport-unit-heading]')
  const inputLabel = document.querySelector('[data-passport-input-label]')
  const unitExample = document.querySelector('[data-passport-unit-example]')

  const maxFileBytes = 20 * 1024 * 1024
  const imageLifetimeMs = 30 * 60 * 1000
  const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
  const dropZone = document.querySelector('[data-passport-drop-zone]')
  const sourceInfo = document.querySelector('[data-passport-source-info]')
  const fileName = document.querySelector('[data-passport-file-name]')
  const clearButton = document.querySelector('[data-passport-clear]')
  const editOpenButton = document.querySelector('[data-passport-edit-open]')
  const previewWrap = document.querySelector('[data-passport-preview-wrap]')
  const preview = document.querySelector('[data-passport-preview]')
  const previewCaption = document.querySelector('[data-passport-preview-caption]')
  const downloadControl = document.querySelector('[data-passport-download-control]')
  const downloadToggle = document.querySelector('[data-passport-download-toggle]')
  const downloadOptions = document.querySelector('[data-passport-download-options]')
  const editorOverlay = document.querySelector('[data-passport-editor-overlay]')
  const editorClose = document.querySelector('[data-passport-editor-close]')
  const viewport = document.querySelector('[data-passport-viewport]')
  const editorImage = document.querySelector('[data-passport-editor-image]')
  const cropFrame = document.querySelector('[data-passport-crop-frame]')
  const frameLabel = document.querySelector('[data-passport-frame-label]')
  const ratioButtons = [...document.querySelectorAll('[data-ratio-width]')]
  const presetSizeLabels = [...document.querySelectorAll('[data-ratio-size]')]
  const customButton = document.querySelector('[data-passport-custom]')
  const customSizeLabel = document.querySelector('[data-custom-ratio-size]')
  const customRatioInput = document.querySelector('[data-passport-custom-ratio-input]')
  const ratioSubmitButton = document.querySelector('[data-passport-ratio-submit]')
  const ratioInputError = document.querySelector('[data-passport-ratio-error]')
  const resizeHandles = [...document.querySelectorAll('[data-crop-handle]')]
  const applyButtons = [...document.querySelectorAll('[data-passport-apply]')]
  const mobileApplyRow = document.querySelector('[data-passport-apply-mobile-row]')
  const mobileApplyButton = mobileApplyRow.querySelector('[data-passport-apply]')
  let showApplyButton = false
  const error = document.querySelector('[data-passport-error]')
  const sizeLabels = Object.fromEntries([...document.querySelectorAll('[data-passport-size]')].map((element) => [element.dataset.passportSize, element]))

  let sourceFile = null
  let measurementUnit = null
  let originalCanvas = null
  let appliedCanvas = null
  let outputCanvas = null
  let activeRatioLabel = ''
  let isCustomRatio = false
  let lastSelectedRatio = null
  let selection = null
  let dragging = null
  let encodedCache = null
  let expirationTimer = null
  let expiresAt = 0

  const units = {
    ratio: { title: 'Aspect ratio', suffix: '', factor: 1, decimals: 0, placeholder: '4:5' },
    mm: { title: 'Dimensions (mm)', suffix: 'mm', factor: 1, decimals: 0, placeholder: '35 x 45 mm' },
    cm: { title: 'Dimensions (cm)', suffix: 'cm', factor: 10, decimals: 1, placeholder: '3.5 x 4.5 cm' },
    in: { title: 'Dimensions (inches)', suffix: 'in', factor: 25.4, decimals: 2, placeholder: '1.38 x 1.77 in' }
  }

  function formatPhysical(mm) {
    const unit = units[measurementUnit]
    return Number((mm / unit.factor).toFixed(unit.decimals)).toString()
  }

  function physicalLabel(button) {
    return `${formatPhysical(Number(button.dataset.mmWidth))} × ${formatPhysical(Number(button.dataset.mmHeight))} ${units[measurementUnit].suffix}`
  }

  function updateUnitDisplay() {
    const unit = units[measurementUnit]
    unitHeading.textContent = unit.title
    inputLabel.textContent = measurementUnit === 'ratio' ? 'Enter a ratio' : `Enter a ratio or ${unit.suffix} dimensions`
    customRatioInput.placeholder = unit.placeholder
    unitExample.textContent = measurementUnit === 'ratio' ? 'Example: 4:5' : `Examples: 4:5 or ${unit.placeholder}`
    updatePresetSizeLabels()
  }

  function showError(message) {
    error.textContent = message
    error.classList.remove('hidden')
  }

  function recordImageActivity() {
    fetch('/api/analytics/image-conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      keepalive: true
    }).catch(() => {})
  }

  function hideError() {
    error.textContent = ''
    error.classList.add('hidden')
  }

  function setDownloadOpen(open) {
    downloadToggle.setAttribute('aria-expanded', String(open))
    downloadOptions.setAttribute('aria-hidden', String(!open))
    for (const [className, addWhenOpen] of [
      ['max-h-0', false], ['p-0', false], ['opacity-0', false], ['-translate-y-1', false], ['pointer-events-none', false],
      ['p-2', true], ['opacity-100', true], ['translate-y-0', true], ['pointer-events-auto', true]
    ]) downloadOptions.classList.toggle(className, addWhenOpen ? open : !open)
    downloadOptions.style.maxHeight = open ? '16rem' : '0'
  }

  function setMenuVisibility() {
    const hasImage = Boolean(outputCanvas)
    editOpenButton.classList.toggle('hidden', !hasImage)
    previewWrap.classList.toggle('hidden', !hasImage)
    downloadControl.classList.toggle('hidden', !hasImage)
    sourceInfo.classList.toggle('hidden', !sourceFile)
    dropZone.classList.toggle('hidden', Boolean(sourceFile))
  }

  function setApplyButtonVisibility(visible) {
    showApplyButton = visible
    const isMobile = window.matchMedia('(max-width: 639px)').matches
    mobileApplyRow.classList.toggle('hidden', !visible || !isMobile)
    for (const button of applyButtons) {
      button.classList.toggle('hidden', !visible || (isMobile ? button !== mobileApplyButton : button === mobileApplyButton))
    }
  }

  function setPreview() {
    if (!outputCanvas) return
    preview.src = outputCanvas.toDataURL('image/png')
    previewCaption.textContent = `Preview · ${outputCanvas.width} × ${outputCanvas.height} px`
    encodedCache = null
    for (const label of Object.values(sizeLabels)) label.textContent = 'please wait...'
    setMenuVisibility()
  }

  function reset() {
    window.clearTimeout(expirationTimer)
    expirationTimer = null
    expiresAt = 0
    deleteToolSession('passport-ratio', 'current').catch(() => {})
    sourceFile = null
    originalCanvas = null
    appliedCanvas = null
    outputCanvas = null
    selection = null
    dragging = null
    encodedCache = null
    activeRatioLabel = ''
    isCustomRatio = false
    lastSelectedRatio = null
    fileInput.value = ''
    fileName.textContent = ''
    preview.removeAttribute('src')
    cropFrame.classList.add('hidden')
    setApplyButtonVisibility(false)
    for (const button of ratioButtons) updateRatioButton(button, false)
    updateRatioButton(customButton, false)
    updateRatioButton(ratioSubmitButton, false)
    customRatioInput.value = ''
    ratioInputError.textContent = ''
    ratioInputError.classList.add('hidden')
    for (const handle of resizeHandles) handle.classList.add('hidden')
    for (const label of presetSizeLabels) label.textContent = '(— × — px)'
    customSizeLabel.textContent = '(free resize)'
    updatePresetSizeLabels()
    for (const label of Object.values(sizeLabels)) label.textContent = ''
    setDownloadOpen(false)
    editorOverlay.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
    setMenuVisibility()
    hideError()
  }

  function updateRatioButton(button, active) {
    button.setAttribute('aria-pressed', String(active))
    button.classList.toggle('border-gold-500', active)
    button.classList.toggle('bg-gold-100', active)
    button.classList.toggle('border-dawn-200', !active)
    button.classList.toggle('bg-white', !active)
  }

  function sanitizeAspectInput(value) {
    return String(value).slice(0, 40).replace(/[^0-9.:/xX×a-zA-Z\s]/g, '')
  }

  function parseAspectInput(value) {
    const normalized = String(value).trim().replace(/\s+/g, ' ')
    const ratioMatch = normalized.match(/^(\d+(?:\.\d{1,4})?)\s*:\s*(\d+(?:\.\d{1,4})?)$/)
    const dimensionMatch = normalized.match(/^(\d+(?:\.\d{1,4})?)\s*(?:x|×)\s*(\d+(?:\.\d{1,4})?)(?:\s*(mm|cm|in|inch|inches))?$/i)
    const match = ratioMatch || dimensionMatch
    if (!match || (measurementUnit === 'ratio' && !ratioMatch)) throw new Error(measurementUnit === 'ratio' ? 'Enter a ratio such as 4:5.' : `Enter a ratio or dimensions in ${units[measurementUnit].suffix}.`)
    const width = Number(match[1])
    const height = Number(match[2])
    const inputUnit = ratioMatch ? 'ratio' : (dimensionMatch[3] || measurementUnit).toLowerCase()
    const factors = { ratio: 1, mm: 1, cm: 10, in: 25.4, inch: 25.4, inches: 25.4 }
    if (inputUnit !== 'ratio' && inputUnit !== measurementUnit) throw new Error(`Use ${units[measurementUnit].suffix} for dimensions, or enter a ratio.`)
    const aspect = inputUnit === 'ratio' ? width / height : (width * factors[inputUnit]) / (height * factors[inputUnit])
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width > 100000 || height > 100000 || aspect < 0.05 || aspect > 20) {
      throw new Error('Enter positive dimensions with a ratio between 1:20 and 20:1.')
    }
    const precision = Math.max((match[1].split('.')[1] || '').length, (match[2].split('.')[1] || '').length)
    const scale = 10 ** precision
    let ratioWidth = Math.round(width * scale)
    let ratioHeight = Math.round(height * scale)
    let a = ratioWidth
    let b = ratioHeight
    while (b) [a, b] = [b, a % b]
    ratioWidth /= Math.max(1, a)
    ratioHeight /= Math.max(1, a)
    return { width: ratioWidth, height: ratioHeight, label: `${ratioWidth}:${ratioHeight}`, fromInput: true,
      physicalWidth: inputUnit === 'ratio' ? null : width * factors[inputUnit],
      physicalHeight: inputUnit === 'ratio' ? null : height * factors[inputUnit] }
  }

  function clearRatioInputError() {
    ratioInputError.textContent = ''
    ratioInputError.classList.add('hidden')
  }

  function loadImage(file) {
    if (!acceptedTypes.has(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.')
    if (file.size > maxFileBytes) throw new Error('Choose an image no larger than 20 MB.')
    if (!file.size) throw new Error('This image file is empty.')
    return createImageBitmap(file).then((bitmap) => {
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Your browser could not prepare this image for cropping.')
      context.drawImage(bitmap, 0, 0)
      bitmap.close()
      return canvas
    })
  }

  async function acceptFile(file, options = {}) {
    hideError()
    try {
      const canvas = await loadImage(file)
      sourceFile = file
      originalCanvas = canvas
      appliedCanvas = canvas
      outputCanvas = canvas
      lastSelectedRatio = null
      expiresAt = options.expiresAt || Date.now() + imageLifetimeMs
      window.clearTimeout(expirationTimer)
      expirationTimer = window.setTimeout(() => {
        reset()
        showError('This image expired after 30 minutes. Choose it again to continue.')
      }, Math.max(0, expiresAt - Date.now()))
      fileName.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`
      updatePresetSizeLabels()
      setPreview()
      if (!options.restore) {
        putToolSession('passport-ratio', 'current', { file, measurementUnit }, expiresAt).catch(() => {
          showError('Your browser could not save this image for refresh recovery.')
        })
      }
    } catch (loadError) {
      fileInput.value = ''
      showError(loadError.message || 'Could not open this image.')
    }
  }

  function renderCropFrame() {
    if (!selection || !outputCanvas) {
      cropFrame.classList.add('hidden')
      return
    }
    const imageRect = editorImage.getBoundingClientRect()
    const viewportRect = viewport.getBoundingClientRect()
    if (!imageRect.width || !imageRect.height) return
    const scaleX = imageRect.width / outputCanvas.width
    const scaleY = imageRect.height / outputCanvas.height
    cropFrame.style.left = `${imageRect.left - viewportRect.left + viewport.scrollLeft + selection.x * scaleX}px`
    cropFrame.style.top = `${imageRect.top - viewportRect.top + viewport.scrollTop + selection.y * scaleY}px`
    cropFrame.style.width = `${selection.width * scaleX}px`
    cropFrame.style.height = `${selection.height * scaleY}px`
    const cropWidth = Math.max(1, Math.round(selection.width))
    const cropHeight = Math.max(1, Math.round(selection.height))
    const selectedButton = ratioButtons.find((button) => button.getAttribute('aria-pressed') === 'true')
    let dimensionsLabel = getReducedRatio(cropWidth, cropHeight)
    if (!isCustomRatio && measurementUnit !== 'ratio') {
      if (selectedButton) dimensionsLabel = physicalLabel(selectedButton)
      else if (lastSelectedRatio?.physicalWidth) dimensionsLabel = `${formatPhysical(lastSelectedRatio.physicalWidth)} × ${formatPhysical(lastSelectedRatio.physicalHeight)} ${units[measurementUnit].suffix}`
    }
    frameLabel.textContent = `${cropWidth} × ${cropHeight} px · ${dimensionsLabel}`
    if (isCustomRatio) customSizeLabel.textContent = `(${cropWidth} × ${cropHeight} px · ${getReducedRatio(cropWidth, cropHeight)})`
    cropFrame.classList.remove('hidden')
  }

  function fitRatio(width, height, ratioWidth, ratioHeight) {
    const availableUnits = Math.min(width / ratioWidth, height / ratioHeight)
    const units = availableUnits >= 1 ? Math.floor(availableUnits) : availableUnits
    return { width: Math.min(width, units * ratioWidth), height: Math.min(height, units * ratioHeight) }
  }

  function updatePresetSizeLabels() {
    if (!measurementUnit) return
    for (let index = 0; index < ratioButtons.length; index += 1) {
      const button = ratioButtons[index]
      const dimensions = outputCanvas ? fitRatio(outputCanvas.width, outputCanvas.height, Number(button.dataset.ratioWidth), Number(button.dataset.ratioHeight)) : null
      const pixels = dimensions ? `${Math.round(dimensions.width)} × ${Math.round(dimensions.height)} px` : '— × — px'
      const dimensionsLabel = measurementUnit === 'ratio'
        ? `${button.dataset.ratioWidth}:${button.dataset.ratioHeight}`
        : physicalLabel(button)
      presetSizeLabels[index].textContent = `(${dimensionsLabel} · ${pixels})`
    }
  }

  function getReducedRatio(width, height) {
    let a = width
    let b = height
    while (b) [a, b] = [b, a % b]
    const divisor = Math.max(1, a)
    return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`
  }

  function makeSelection(ratio) {
    const width = outputCanvas.width
    const height = outputCanvas.height
    const dimensions = fitRatio(width, height, ratio.width, ratio.height)
    const cropWidth = dimensions.width
    const cropHeight = dimensions.height
    selection = { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight }
    for (const button of ratioButtons) updateRatioButton(button, button === ratio.button)
    updateRatioButton(customButton, false)
    updateRatioButton(ratioSubmitButton, Boolean(ratio.fromInput))
    for (const handle of resizeHandles) handle.classList.add('hidden')
    isCustomRatio = false
    activeRatioLabel = ratio.label
    lastSelectedRatio = {
      width: ratio.width,
      height: ratio.height,
      label: ratio.label,
      type: ratio.fromInput ? 'input' : 'preset',
      physicalWidth: ratio.physicalWidth,
      physicalHeight: ratio.physicalHeight
    }
    frameLabel.textContent = ratio.label
    setApplyButtonVisibility(true)
    requestAnimationFrame(renderCropFrame)
  }

  function makeCustomSelection() {
    const width = Math.max(1, Math.round(outputCanvas.width * 0.8))
    const height = Math.max(1, Math.round(outputCanvas.height * 0.8))
    selection = { x: (outputCanvas.width - width) / 2, y: (outputCanvas.height - height) / 2, width, height }
    for (const button of ratioButtons) updateRatioButton(button, false)
    updateRatioButton(customButton, true)
    updateRatioButton(ratioSubmitButton, false)
    for (const handle of resizeHandles) handle.classList.remove('hidden')
    isCustomRatio = true
    activeRatioLabel = ''
    lastSelectedRatio = { width, height, type: 'custom' }
    setApplyButtonVisibility(true)
    requestAnimationFrame(renderCropFrame)
  }

  function openEditor() {
    if (!originalCanvas) return
    outputCanvas = originalCanvas
    selection = null
    dragging = null
    activeRatioLabel = ''
    isCustomRatio = false
    cropFrame.classList.add('hidden')
    setApplyButtonVisibility(false)
    for (const button of ratioButtons) updateRatioButton(button, false)
    updateRatioButton(customButton, false)
    updateRatioButton(ratioSubmitButton, false)
    for (const handle of resizeHandles) handle.classList.add('hidden')
    editorImage.src = originalCanvas.toDataURL('image/png')
    editorOverlay.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
    updatePresetSizeLabels()
    if (lastSelectedRatio) {
      if (lastSelectedRatio.type === 'custom') {
        const dimensions = fitRatio(outputCanvas.width, outputCanvas.height, lastSelectedRatio.width, lastSelectedRatio.height)
        selection = {
          x: (outputCanvas.width - dimensions.width) / 2,
          y: (outputCanvas.height - dimensions.height) / 2,
          width: dimensions.width,
          height: dimensions.height
        }
        isCustomRatio = true
        updateRatioButton(customButton, true)
        for (const handle of resizeHandles) handle.classList.remove('hidden')
        setApplyButtonVisibility(true)
      } else {
        const presetButton = ratioButtons.find((button) =>
          Number(button.dataset.ratioWidth) === lastSelectedRatio.width
          && Number(button.dataset.ratioHeight) === lastSelectedRatio.height
        )
        makeSelection({
          ...lastSelectedRatio,
          button: lastSelectedRatio.type === 'preset' ? presetButton : undefined,
          fromInput: lastSelectedRatio.type === 'input'
        })
      }
    }
    requestAnimationFrame(renderCropFrame)
    editorClose.focus()
  }

  function closeEditor() {
    if (appliedCanvas) outputCanvas = appliedCanvas
    selection = null
    dragging = null
    cropFrame.classList.add('hidden')
    setApplyButtonVisibility(false)
    for (const button of ratioButtons) updateRatioButton(button, false)
    updateRatioButton(customButton, false)
    updateRatioButton(ratioSubmitButton, false)
    for (const handle of resizeHandles) handle.classList.add('hidden')
    editorOverlay.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
    editOpenButton.focus()
  }

  function startDrag(event) {
    if (!selection) return
    event.preventDefault()
    cropFrame.setPointerCapture(event.pointerId)
    dragging = {
      mode: 'move',
      pointerId: event.pointerId,
      offsetX: event.clientX - cropFrame.getBoundingClientRect().left,
      offsetY: event.clientY - cropFrame.getBoundingClientRect().top
    }
  }

  function dragFrame(event) {
    if (!dragging || dragging.pointerId !== event.pointerId || !selection) return
    const rect = editorImage.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    if (dragging.mode === 'resize') {
      const pointX = Math.max(0, Math.min(outputCanvas.width, Math.round((event.clientX - rect.left) * outputCanvas.width / rect.width)))
      const pointY = Math.max(0, Math.min(outputCanvas.height, Math.round((event.clientY - rect.top) * outputCanvas.height / rect.height)))
      let { left, top, right, bottom } = dragging.bounds
      if (dragging.direction.includes('w')) left = Math.max(0, Math.min(right - 16, pointX))
      if (dragging.direction.includes('e')) right = Math.min(outputCanvas.width, Math.max(left + 16, pointX))
      if (dragging.direction.includes('n')) top = Math.max(0, Math.min(bottom - 16, pointY))
      if (dragging.direction.includes('s')) bottom = Math.min(outputCanvas.height, Math.max(top + 16, pointY))
      selection = { x: left, y: top, width: right - left, height: bottom - top }
      renderCropFrame()
      return
    }
    const scaleX = outputCanvas.width / rect.width
    const scaleY = outputCanvas.height / rect.height
    const leftPx = (event.clientX - rect.left - dragging.offsetX) * scaleX
    const topPx = (event.clientY - rect.top - dragging.offsetY) * scaleY
    selection.x = Math.max(0, Math.min(outputCanvas.width - selection.width, leftPx))
    selection.y = Math.max(0, Math.min(outputCanvas.height - selection.height, topPx))
    renderCropFrame()
  }

  function finishDrag(event) {
    if (dragging?.pointerId === event.pointerId) {
      if (dragging.mode === 'resize' && selection) {
        lastSelectedRatio = { width: selection.width, height: selection.height, type: 'custom' }
      }
      dragging = null
    }
  }

  function startResize(event) {
    if (!selection || !isCustomRatio) return
    event.preventDefault()
    event.stopPropagation()
    cropFrame.setPointerCapture(event.pointerId)
    dragging = {
      mode: 'resize',
      pointerId: event.pointerId,
      direction: event.currentTarget.dataset.cropHandle,
      bounds: {
        left: selection.x,
        top: selection.y,
        right: selection.x + selection.width,
        bottom: selection.y + selection.height
      }
    }
  }

  function applyCrop() {
    if (!selection || !outputCanvas) return
    const left = Math.max(0, Math.round(selection.x))
    const top = Math.max(0, Math.round(selection.y))
    const width = Math.max(1, Math.min(outputCanvas.width - left, Math.round(selection.width)))
    const height = Math.max(1, Math.min(outputCanvas.height - top, Math.round(selection.height)))
    const cropped = document.createElement('canvas')
    cropped.width = width
    cropped.height = height
    const context = cropped.getContext('2d')
    if (!context) {
      showError('Your browser could not apply this crop.')
      return
    }
    context.drawImage(outputCanvas, left, top, width, height, 0, 0, width, height)
    outputCanvas = cropped
    appliedCanvas = cropped
    selection = null
    isCustomRatio = false
    activeRatioLabel = ''
    cropFrame.classList.add('hidden')
    setApplyButtonVisibility(false)
    for (const button of ratioButtons) updateRatioButton(button, false)
    updateRatioButton(customButton, false)
    for (const handle of resizeHandles) handle.classList.add('hidden')
    closeEditor()
    setPreview()
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(`Could not encode ${type.replace('image/', '').toUpperCase()}.`)), type, quality)
    })
  }

  function encodeCanvas(type) {
    const canvas = document.createElement('canvas')
    canvas.width = outputCanvas.width
    canvas.height = outputCanvas.height
    const context = canvas.getContext('2d')
    if (!context) return Promise.reject(new Error('Image encoding is unavailable.'))
    if (type === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(outputCanvas, 0, 0)
    return canvasBlob(canvas, type, type === 'image/png' ? undefined : 0.92).then((blob) => {
      if (blob.type !== type) throw new Error(`${type.replace('image/', '').toUpperCase()} encoding is unavailable in this browser.`)
      return blob
    })
  }

  async function getEncoded(type) {
    const currentCanvas = outputCanvas
    if (!encodedCache || encodedCache.canvas !== currentCanvas) encodedCache = { canvas: currentCanvas, blobs: new Map() }
    if (!encodedCache.blobs.has(type)) encodedCache.blobs.set(type, encodeCanvas(type))
    return encodedCache.blobs.get(type)
  }

  function formatSize(bytes) {
    return `(${(bytes / (1024 * 1024)).toFixed(2)} MB)`
  }

  async function updateFileSizes() {
    const sizeCanvas = outputCanvas
    await Promise.all(['image/jpeg', 'image/png', 'image/webp'].map(async (type) => {
      try {
        const blob = await getEncoded(type)
        if (outputCanvas === sizeCanvas) sizeLabels[type].textContent = formatSize(blob.size)
      } catch {
        if (outputCanvas === sizeCanvas) sizeLabels[type].textContent = '(unavailable)'
      }
    }))
  }

  async function downloadImage(type) {
    const button = document.querySelector(`[data-passport-format="${type}"]`)
    button.disabled = true
    try {
      const blob = await getEncoded(type)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[type]
      link.download = `${sourceFile.name.replace(/\.[^.]+$/, '') || 'passport-photo'}-crop.${extension}`
      document.body.append(link)
      link.click()
      link.remove()
      recordImageActivity()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setDownloadOpen(false)
    } catch (downloadError) {
      showError(downloadError.message || `Could not create this ${type.replace('image/', '').toUpperCase()} image.`)
    } finally {
      button.disabled = false
    }
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (file) acceptFile(file)
  })
  dropZone.addEventListener('dragover', (event) => event.preventDefault())
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault()
    const file = event.dataTransfer?.files?.[0]
    if (file) acceptFile(file)
  })
  clearButton.addEventListener('click', reset)
  editOpenButton.addEventListener('click', openEditor)
  editorClose.addEventListener('click', closeEditor)
  editorOverlay.addEventListener('click', (event) => {
    if (event.target === editorOverlay) closeEditor()
  })
  for (const button of ratioButtons) {
    button.addEventListener('click', () => makeSelection({
      width: Number(button.dataset.ratioWidth),
      height: Number(button.dataset.ratioHeight),
      label: `${button.dataset.ratioWidth}:${button.dataset.ratioHeight}`,
      button
    }))
  }
  customButton.addEventListener('click', makeCustomSelection)
  customRatioInput.addEventListener('input', () => {
    const sanitized = sanitizeAspectInput(customRatioInput.value)
    if (customRatioInput.value !== sanitized) customRatioInput.value = sanitized
    updateRatioButton(ratioSubmitButton, false)
    clearRatioInputError()
  })
  customRatioInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      ratioSubmitButton.click()
    }
  })
  ratioSubmitButton.addEventListener('click', () => {
    clearRatioInputError()
    try {
      makeSelection(parseAspectInput(customRatioInput.value))
    } catch (inputError) {
      ratioInputError.textContent = inputError.message
      ratioInputError.classList.remove('hidden')
    }
  })
  cropFrame.addEventListener('pointerdown', startDrag)
  cropFrame.addEventListener('pointermove', dragFrame)
  cropFrame.addEventListener('pointerup', finishDrag)
  cropFrame.addEventListener('pointercancel', finishDrag)
  for (const handle of resizeHandles) handle.addEventListener('pointerdown', startResize)
  applyButtons.forEach((button) => button.addEventListener('click', applyCrop))
  window.addEventListener('resize', () => setApplyButtonVisibility(showApplyButton))
  downloadToggle.addEventListener('click', () => {
    const open = downloadToggle.getAttribute('aria-expanded') !== 'true'
    setDownloadOpen(open)
    if (open) updateFileSizes()
  })
  document.querySelectorAll('[data-passport-format]').forEach((button) => {
    button.addEventListener('click', () => downloadImage(button.dataset.passportFormat))
  })
  unitButtons.forEach((button) => button.addEventListener('click', () => {
    measurementUnit = button.dataset.passportUnit
    unitOverlay.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
    updateUnitDisplay()
  }))
  document.addEventListener('click', (event) => {
    if (!downloadControl.contains(event.target)) setDownloadOpen(false)
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!editorOverlay.classList.contains('hidden')) closeEditor()
      else setDownloadOpen(false)
    }
  })
  viewport.addEventListener('scroll', renderCropFrame)
  window.addEventListener('resize', renderCropFrame)
  editorImage.addEventListener('load', renderCropFrame)
  getToolSessions('passport-ratio').then(async (sessions) => {
    const session = sessions[0]
    if (!sourceFile && session?.payload?.file && session.expiresAt > Date.now()) {
      measurementUnit = units[session.payload.measurementUnit] ? session.payload.measurementUnit : 'mm'
      updateUnitDisplay()
      await acceptFile(session.payload.file, { expiresAt: session.expiresAt, restore: true })
      return
    }
    unitOverlay.classList.remove('hidden')
    unitOverlay.classList.add('grid')
    document.body.classList.add('overflow-hidden')
    unitButtons[0].focus()
  }).catch(() => {
    showError('Saved images could not be restored from this browser.')
    unitOverlay.classList.remove('hidden')
    unitOverlay.classList.add('grid')
    document.body.classList.add('overflow-hidden')
    unitButtons[0].focus()
  })
  setMenuVisibility()
})()
