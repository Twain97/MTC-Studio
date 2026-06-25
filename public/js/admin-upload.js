document.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('[data-upload-form]')
  if (!form) return
  const notice = document.querySelector('[data-upload-notice]')
  const list = document.querySelector('[data-projects-list]')
  const empty = document.querySelector('[data-projects-empty]')
  const count = document.querySelector('[data-project-count]')
  const thumbnailInput = document.querySelector('[data-thumbnail-input]')
  const thumbnailPreview = document.querySelector('[data-thumbnail-preview]')
  const thumbnailPlaceholder = document.querySelector('[data-thumbnail-placeholder]')
  const thumbnailPreviewCard = document.querySelector('[data-thumbnail-preview-card]')
  const thumbnailName = document.querySelector('[data-thumbnail-name]')
  const thumbnailSize = document.querySelector('[data-thumbnail-size]')
  const imagesInput = document.querySelector('[data-images-input]')
  const galleryPreviews = document.querySelector('[data-gallery-previews]')
  const uploadProgress = document.querySelector('[data-upload-progress]')
  const uploadProgressBar = document.querySelector('[data-upload-progress-bar]')
  const submitButton = form.querySelector('button[type="submit"]')
  const submitLabel = form.querySelector('[data-submit-label]')
  const uploadLightbox = document.querySelector('[data-upload-lightbox]')
  const uploadLightboxImage = document.querySelector('[data-upload-lightbox-image]')
  const uploadLightboxCaption = document.querySelector('[data-upload-lightbox-caption]')
  const uploadLightboxCloseButtons = uploadLightbox ? uploadLightbox.querySelectorAll('[data-upload-lightbox-close]') : []

  let thumbnailUrl = ''
  let galleryUrls = []

  function clearThumbnailPreview() {
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl)
    thumbnailUrl = ''
  }

  function clearGalleryPreviews() {
    galleryUrls.forEach((url) => URL.revokeObjectURL(url))
    galleryUrls = []
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    const units = ['KB', 'MB', 'GB']
    let value = bytes / 1024
    let unit = 0
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024
      unit += 1
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
  }

  function setUploadProgress(percent) {
    const safePercent = Math.max(0, Math.min(100, percent))
    uploadProgress.textContent = `Upload progress: ${safePercent}%`
    uploadProgressBar.style.width = `${safePercent}%`
  }

  function clearProgress() {
    uploadProgress.textContent = 'Upload progress: 0%'
    uploadProgressBar.style.width = '0%'
  }

  function clearNotice() {
    notice.textContent = ''
    notice.className = 'mt-5 hidden text-sm'
  }

  function bindUploadImageOpen(root) {
    if (!root) return
    root.querySelectorAll('[data-upload-image-open]').forEach((trigger) => {
      if (trigger.dataset.uploadImageBound === 'true') return
      trigger.dataset.uploadImageBound = 'true'
      trigger.addEventListener('click', () => {
        uploadLightboxImage.src = trigger.getAttribute('data-upload-image-open')
        uploadLightboxImage.alt = trigger.getAttribute('data-upload-image-title') || 'Uploaded image'
        uploadLightboxCaption.textContent = trigger.getAttribute('data-upload-image-title') || ''
        uploadLightbox.classList.remove('hidden')
        uploadLightbox.classList.add('flex')
        document.body.classList.add('overflow-hidden')
      })
    })
  }

  function closeUploadLightbox() {
    uploadLightbox.classList.add('hidden')
    uploadLightbox.classList.remove('flex')
    uploadLightboxImage.src = ''
    uploadLightboxCaption.textContent = ''
    document.body.classList.remove('overflow-hidden')
  }

  function setNotice(type, text) {
    notice.textContent = text
    notice.className = `mt-5 text-sm ${type === 'success' ? 'text-emerald-700' : 'text-red-700'}`
  }

  thumbnailInput.addEventListener('change', () => {
    clearThumbnailPreview()
    const file = thumbnailInput.files?.[0]
    if (!file) {
      thumbnailPreviewCard.classList.add('hidden')
      thumbnailPlaceholder.classList.remove('hidden')
      return
    }

    thumbnailUrl = URL.createObjectURL(file)
    thumbnailPreview.src = thumbnailUrl
    thumbnailName.textContent = file.name
    thumbnailSize.textContent = formatBytes(file.size)
    thumbnailPreviewCard.classList.remove('hidden')
    thumbnailPlaceholder.classList.add('hidden')
  })

  imagesInput.addEventListener('change', () => {
    clearGalleryPreviews()
    const files = Array.from(imagesInput.files || []).slice(0, 10)
    galleryUrls = files.map((file) => URL.createObjectURL(file))
    galleryPreviews.innerHTML = files.map((file, index) => {
      const url = galleryUrls[index]
      return `
        <figure class="overflow-hidden rounded-[1.5rem] border border-dawn-200 bg-white shadow-sm">
          <button type="button" class="block w-full" data-upload-image-open="${url}" data-upload-image-title="${escapeHtml(file.name)} preview">
            <img src="${url}" class="h-28 w-full object-cover transition duration-300 hover:scale-105" alt="${escapeHtml(file.name)} preview" />
          </button>
          <figcaption class="grid gap-1 border-t border-dawn-200 p-2 text-[11px] text-dawn-500">
            <strong class="truncate text-xs text-dawn-800">${escapeHtml(file.name)}</strong>
            <span>${formatBytes(file.size)}</span>
          </figcaption>
        </figure>
      `
    }).join('')
    galleryPreviews.classList.toggle('hidden', !files.length)
    galleryPreviews.classList.toggle('grid', Boolean(files.length))
    bindUploadImageOpen(galleryPreviews)
  })

  async function loadProjects() {
    const response = await apiFetch('/api/projects')
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Projects could not be loaded.')
    count.textContent = data.projects.length
    empty.classList.toggle('hidden', Boolean(data.projects.length))
    list.innerHTML = data.projects.map((project) => `
      <article class="grid grid-cols-[100px_1fr_auto] items-center gap-4 border border-dawn-200 bg-white p-3">
        <button type="button" class="overflow-hidden rounded-[1rem]" data-upload-image-open="${project.thumbnail}" data-upload-image-title="${escapeHtml(project.eventName)}">
          <img src="${project.thumbnail}" alt="${escapeHtml(project.eventName)}" class="h-24 w-full object-cover" data-fallback-src="/images/photographer.webp" />
        </button>
        <div class="min-w-0">
          <h3 class="truncate font-display text-xl font-semibold">${escapeHtml(project.eventName)}</h3>
          <p class="mt-2 truncate text-xs text-dawn-500">${escapeHtml(project.location)}</p>
          <p class="mt-1 text-xs text-dawn-400">${new Date(project.eventDate).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button class="rounded-full p-2 text-red-600 transition hover:bg-red-50" data-delete-project="${project._id}" aria-label="Delete project">Delete</button>
      </article>
    `).join('')

    list.querySelectorAll('[data-delete-project]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-delete-project')
        if (!confirm('Delete this project? This also deletes its uploaded images.')) return
        const response = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
        const data = await response.json()
        if (!response.ok) return setNotice('error', data.message || 'Project deletion failed.')
        setNotice('success', data.message)
        await loadProjects()
      })
    })

    bindUploadImageOpen(list)
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const payload = new FormData(form)
    clearNotice()
    submitButton.disabled = true
    submitLabel.textContent = 'Uploading...'
    clearProgress()

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/projects')
    const token = localStorage.getItem('mtc_admin_token')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return
      setUploadProgress(Math.round((event.loaded / event.total) * 100))
    })

    xhr.addEventListener('load', async () => {
      let data = {}
      try {
        data = JSON.parse(xhr.responseText || '{}')
      } catch {
        data = { message: 'Project upload failed.' }
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        setNotice('error', data.message || 'Project upload failed.')
        submitButton.disabled = false
        submitLabel.textContent = 'Publish project'
        return
      }

      form.reset()
      clearThumbnailPreview()
      clearGalleryPreviews()
      thumbnailPreviewCard.classList.add('hidden')
      thumbnailPlaceholder.classList.remove('hidden')
      galleryPreviews.innerHTML = ''
      galleryPreviews.classList.add('hidden')
      setUploadProgress(100)
      setNotice('success', data.message)
      submitButton.disabled = false
      submitLabel.textContent = 'Publish project'
      await loadProjects()
    })

    xhr.addEventListener('error', () => {
      setNotice('error', 'Project upload failed.')
      submitButton.disabled = false
      submitLabel.textContent = 'Publish project'
    })

    xhr.send(payload)
  })

  try {
    await loadProjects()
  } catch (err) {
    setNotice('error', err.message)
  }

  if (uploadLightbox && uploadLightboxCloseButtons.length) {
    uploadLightbox.addEventListener('click', (event) => {
      if (event.target === uploadLightbox || event.target.closest('[data-upload-lightbox-close]')) {
        closeUploadLightbox()
      }
    })
    uploadLightboxCloseButtons.forEach((button) => {
      button.addEventListener('click', closeUploadLightbox)
    })
  }
})
