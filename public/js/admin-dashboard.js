document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.querySelector('[data-dashboard-loading]')
  const error = document.querySelector('[data-dashboard-error]')
  const content = document.querySelector('[data-dashboard-content]')
  const metrics = document.querySelector('[data-dashboard-metrics]')
  const messages = document.querySelector('[data-dashboard-messages]')

  try {
    const response = await apiFetch('/api/dashboard')
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Dashboard data could not be loaded.')

    metrics.innerHTML = [
      ['Projects uploaded', data.projectCount],
      ['Total inquiries', data.messageCount],
      ['New unread email', data.unreadCount],
      ['Admin emails sent', data.deliveredCount]
    ].map(([label, value]) => `<article class="metric-card"><p>${escapeHtml(label)}</p><strong>${escapeHtml(value)}</strong></article>`).join('')

    messages.innerHTML = data.recentMessages.length
      ? data.recentMessages.map((message) => `
        <a href="/admin/messages?id=${message._id}" class="grid gap-2 border-b border-dawn-100 p-5 transition last:border-0 hover:bg-dawn-50 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
          <div>
            <strong class="text-sm">${escapeHtml(message.name)}</strong>
            <p class="mt-1 text-xs text-dawn-500">${escapeHtml(message.email)}</p>
          </div>
          <p class="truncate text-sm text-dawn-700">${escapeHtml(message.subject)}</p>
          <time class="text-xs text-dawn-400">${new Date(message.createdAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</time>
        </a>
      `).join('')
      : '<div class="p-8 text-sm text-dawn-500">No inquiries have arrived yet.</div>'

    loading.classList.add('hidden')
    content.classList.remove('hidden')
  } catch (err) {
    loading.classList.add('hidden')
    error.textContent = err.message
    error.classList.remove('hidden')
  }
})
