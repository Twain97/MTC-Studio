document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.querySelector('[data-messages-loading]')
  const shell = document.querySelector('[data-messages-shell]')
  const list = document.querySelector('[data-message-list]')
  const count = document.querySelector('[data-message-count]')
  const url = new URL(location.href)
  let selectedId = url.searchParams.get('id')
  const initialFilter = url.searchParams.get('unread') === 'true'
    ? '?unread=true'
    : url.searchParams.get('status')
      ? `?status=${encodeURIComponent(url.searchParams.get('status'))}`
      : ''

  function syncSelectedMessage(id, replace = false) {
    const next = new URL(location.href)
    next.searchParams.delete('id')
    if (id) next.pathname = `/admin/messages/${id}`
    else next.pathname = '/admin/messages'
    if (replace) history.replaceState({}, '', next)
    else history.pushState({}, '', next)
  }

  async function loadMessages() {
    const response = await apiFetch(`/api/messages${initialFilter}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Messages could not be loaded.')
    count.textContent = data.messages.length
    list.innerHTML = data.messages.map((message) => `
      <a href="/admin/messages/${message._id}" class="block border-b border-dawn-100 p-5 text-left transition hover:bg-dawn-50 ${message._id === selectedId ? 'bg-dawn-100' : ''}" aria-current="${message._id === selectedId ? 'page' : 'false'}">
        <div class="flex items-center justify-between gap-3">
          <strong class="truncate text-sm">${message.isRead ? '' : '<span class="mr-2 inline-block h-2 w-2 rounded-full bg-gold-500"></span>'}${escapeHtml(message.name)}</strong>
          <time class="shrink-0 text-[10px] text-dawn-400">${new Date(message.createdAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</time>
        </div>
        <p class="mt-2 truncate text-sm text-dawn-700">${escapeHtml(message.subject)}</p>
        <p class="mt-1 truncate text-xs text-dawn-400">${escapeHtml(message.email)}</p>
      </a>
    `).join('')
    shell.classList.remove('hidden')
    loading.classList.add('hidden')
  }

  try {
    if (selectedId) syncSelectedMessage(selectedId, true)
    await loadMessages()
  } catch (error) {
    loading.textContent = error.message
  }
})
