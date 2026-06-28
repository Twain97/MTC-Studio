document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.querySelector('[data-dashboard-loading]')
  const error = document.querySelector('[data-dashboard-error]')
  const content = document.querySelector('[data-dashboard-content]')
  const metrics = document.querySelector('[data-dashboard-metrics]')
  const messages = document.querySelector('[data-dashboard-messages]')
  const constructionToggle = document.querySelector('[data-construction-toggle]')
  const constructionToggleLabel = document.querySelector('[data-construction-toggle-label]')
  const constructionStatus = document.querySelector('[data-construction-status]')

  const metricCards = [
    { label: 'Projects uploaded', value: (data) => data.projectCount, href: '/admin/upload' },
    { label: 'Total inquiries', value: (data) => data.messageCount, href: '/admin/messages' },
    { label: 'New unread email', value: (data) => data.unreadCount, href: '/admin/messages?unread=true' },
    { label: 'Admin emails sent', value: (data) => data.deliveredCount, href: '/admin/messages?status=sent' }
  ]

  function setConstructionToggle(enabled) {
    if (!constructionToggle) return
    constructionToggle.checked = Boolean(enabled)
    if (constructionToggleLabel) constructionToggleLabel.textContent = enabled ? 'On' : 'Off'
    if (constructionStatus) {
      constructionStatus.textContent = enabled
        ? 'Homepage visitors currently see the construction overlay.'
        : 'Homepage visitors currently see the normal homepage.'
      constructionStatus.className = 'mt-4 text-sm text-dawn-500'
    }
  }

  async function saveConstructionToggle(enabled) {
    if (!constructionToggle) return
    const previous = !enabled
    constructionToggle.disabled = true
    if (constructionStatus) {
      constructionStatus.textContent = 'Saving overlay setting...'
      constructionStatus.className = 'mt-4 text-sm text-dawn-500'
    }

    try {
      const response = await apiFetch('/api/settings/construction-overlay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Overlay setting could not be saved.')
      setConstructionToggle(data.constructionOverlayEnabled)
    } catch (err) {
      setConstructionToggle(previous)
      if (constructionStatus) {
        constructionStatus.textContent = err.message
        constructionStatus.className = 'mt-4 text-sm text-red-700'
      }
    } finally {
      constructionToggle.disabled = false
    }
  }

  try {
    const response = await apiFetch('/api/dashboard')
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Dashboard data could not be loaded.')

    metrics.innerHTML = metricCards.map((card) => `
      <a href="${card.href}" class="metric-card group transition hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:ring-gold-400">
        <p>${escapeHtml(card.label)}</p>
        <strong>${escapeHtml(card.value(data))}</strong>
        <span class="col-span-2 mt-4 text-xs font-bold uppercase tracking-[.14em] text-dawn-400 transition group-hover:text-gold-600">Open</span>
      </a>
    `).join('')

    messages.innerHTML = data.recentMessages.length
      ? data.recentMessages.map((message) => `
        <a href="/admin/messages/${message._id}" class="grid gap-2 border-b border-dawn-100 p-5 transition last:border-0 hover:bg-dawn-50 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
          <div>
            <strong class="text-sm">${escapeHtml(message.name)}</strong>
            <p class="mt-1 text-xs text-dawn-500">${escapeHtml(message.email)}</p>
          </div>
          <p class="truncate text-sm text-dawn-700">${escapeHtml(message.subject)}</p>
          <time class="text-xs text-dawn-400">${new Date(message.createdAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</time>
        </a>
      `).join('')
      : '<div class="p-8 text-sm text-dawn-500">No inquiries have arrived yet.</div>'

    setConstructionToggle(data.constructionOverlayEnabled)
    if (constructionToggle) {
      constructionToggle.addEventListener('change', () => {
        saveConstructionToggle(constructionToggle.checked)
      })
    }

    loading.classList.add('hidden')
    content.classList.remove('hidden')
  } catch (err) {
    loading.classList.add('hidden')
    error.textContent = err.message
    error.classList.remove('hidden')
  }
})
