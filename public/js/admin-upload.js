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
  const imagesInput = document.querySelector('[data-images-input]')
  const galleryPreviews = document.querySelector('[data-gallery-previews]')

  function setNotice(type, text) {
    notice.textContent = text
    notice.className = `mt-5 text-sm ${type === 'success' ? 'text-emerald-700' : 'text-red-700'}`
  }

  thumbnailInput.addEventListener('change', () => {
    const file = thumbnailInput.files?.[0]
    if (!file) return
    thumbnailPreview.src = URL.createObjectURL(file)
    thumbnailPreview.classList.remove('hidden')
    thumbnailPlaceholder.classList.add('hidden')
  })

  imagesInput.addEventListener('change', () => {
    const files = Array.from(imagesInput.files || []).slice(0, 5)
    galleryPreviews.innerHTML = files.map((file) => `<img src="${URL.createObjectURL(file)}" class="h-24 w-full object-cover" alt="Gallery preview" />`).join('')
    galleryPreviews.classList.toggle('hidden', !files.length)
    galleryPreviews.classList.toggle('grid', Boolean(files.length))
  })

  async function loadProjects() {
    const response = await apiFetch('/api/projects')
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Projects could not be loaded.')
    count.textContent = data.projects.length
    empty.classList.toggle('hidden', Boolean(data.projects.length))
    list.innerHTML = data.projects.map((project) => `
      <article class="grid grid-cols-[100px_1fr_auto] items-center gap-4 border border-dawn-200 bg-white p-3">
        <img src="${project.thumbnail}" alt="${escapeHtml(project.eventName)}" class="h-24 w-full object-cover" />
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
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const payload = new FormData(form)
    const response = await apiFetch('/api/projects', { method: 'POST', body: payload })
    const data = await response.json()
    if (!response.ok) return setNotice('error', data.message || 'Project upload failed.')
    form.reset()
    thumbnailPreview.classList.add('hidden')
    thumbnailPlaceholder.classList.remove('hidden')
    galleryPreviews.innerHTML = ''
    galleryPreviews.classList.add('hidden')
    setNotice('success', data.message)
    await loadProjects()
  })

  try {
    await loadProjects()
  } catch (err) {
    setNotice('error', err.message)
  }
})
