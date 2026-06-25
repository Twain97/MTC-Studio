document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.querySelector('[data-messages-loading]')
  const shell = document.querySelector('[data-messages-shell]')
  const list = document.querySelector('[data-message-list]')
  const emptyState = document.querySelector('[data-message-empty-state]')
  const detail = document.querySelector('[data-message-detail]')
  const count = document.querySelector('[data-message-count]')
  const url = new URL(location.href)
  let selectedId = url.searchParams.get('id')

  function renderEmpty() {
    emptyState.classList.remove('hidden')
    detail.classList.add('hidden')
  }

  function renderDetail(message) {
    emptyState.classList.add('hidden')
    detail.classList.remove('hidden')
    detail.innerHTML = `
      <div class="border-b border-dawn-200 p-6 sm:p-8">
        <div class="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <p class="text-xs font-bold uppercase tracking-[.14em] text-gold-700">${escapeHtml(message.emailStatus.replaceAll('_', ' '))}</p>
            <h2 class="mt-2 font-display text-3xl">${escapeHtml(message.subject)}</h2>
            <p class="mt-2 text-sm text-dawn-500">From ${escapeHtml(message.name)} · ${escapeHtml(message.email)}${message.phone ? ` · ${escapeHtml(message.phone)}` : ''}</p>
          </div>
          <time class="text-xs text-dawn-400">${new Date(message.createdAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</time>
        </div>
        <div class="mt-7 whitespace-pre-wrap bg-dawn-50 p-6 text-sm leading-7 text-dawn-800">${escapeHtml(message.body)}</div>
      </div>
      <div class="border-b border-dawn-200 bg-dawn-50 p-6 sm:p-8">${(message.replies || []).map((reply) => `
        <article class="ml-auto max-w-2xl border-l-4 border-gold-400 bg-white p-5">
          <p class="whitespace-pre-wrap text-sm leading-7">${escapeHtml(reply.body)}</p>
          <div class="mt-3 flex items-center gap-4 text-xs text-dawn-400">
            <span>${new Date(reply.sentAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            ${reply.contractPath ? `<a href="${escapeHtml(reply.contractPath)}" target="_blank" class="text-gold-700">Contract</a>` : ''}
          </div>
        </article>
      `).join('')}</div>
      <form class="mt-auto p-6 sm:p-8" data-reply-form>
        <label class="form-label">Reply to ${escapeHtml(message.name)}<textarea name="body" class="form-input resize-none" rows="6" required placeholder="Write your response..."></textarea></label>
        <div class="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <label class="inline-flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-dawn-600">Attach contract PDF<input type="file" name="contract" accept="application/pdf" class="sr-only" /></label>
          <button class="btn-dark sm:ml-auto" type="submit">Send reply</button>
        </div>
        <p class="mt-4 text-sm text-dawn-600" data-reply-notice></p>
      </form>
    `

    detail.querySelector('[data-reply-form]').addEventListener('submit', async (event) => {
      event.preventDefault()
      const form = event.currentTarget
      const notice = detail.querySelector('[data-reply-notice]')
      const payload = new FormData(form)
      const response = await apiFetch(`/api/messages/${message._id}/reply`, { method: 'POST', body: payload })
      const data = await response.json()
      if (!response.ok) {
        notice.textContent = data.message || 'Reply could not be sent.'
        return
      }
      notice.textContent = data.message
      await loadMessages(data.inquiry._id)
    })
  }

  async function loadMessages(preselectId = selectedId) {
    const response = await apiFetch('/api/messages')
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Messages could not be loaded.')
    count.textContent = data.messages.length
    list.innerHTML = data.messages.map((message) => `
      <button class="block w-full border-b border-dawn-100 p-5 text-left transition hover:bg-dawn-50" data-message-id="${message._id}">
        <div class="flex items-center justify-between gap-3">
          <strong class="truncate text-sm">${message.isRead ? '' : '<span class="mr-2 inline-block h-2 w-2 rounded-full bg-gold-500"></span>'}${message.name}</strong>
          <time class="shrink-0 text-[10px] text-dawn-400">${new Date(message.createdAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</time>
        </div>
        <p class="mt-2 truncate text-sm text-dawn-700">${message.subject}</p>
        <p class="mt-1 truncate text-xs text-dawn-400">${message.email}</p>
      </button>
    `).join('')

    list.querySelectorAll('[data-message-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        await openMessage(button.getAttribute('data-message-id'))
      })
    })

    if (!data.messages.length) {
      renderEmpty()
      return
    }

    await openMessage(preselectId && data.messages.some((message) => message._id === preselectId) ? preselectId : data.messages[0]._id)
  }

  async function openMessage(id) {
    selectedId = id
    const response = await apiFetch(`/api/messages/${id}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Message could not be loaded.')
    renderDetail(data.message)
  }

  try {
    const response = await apiFetch('/api/messages')
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Messages could not be loaded.')
    loading.classList.add('hidden')
    shell.classList.remove('hidden')
    await loadMessages()
  } catch (err) {
    loading.textContent = err.message
  }
})
