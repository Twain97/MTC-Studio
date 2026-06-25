document.addEventListener('DOMContentLoaded', async () => {
  const page = document.querySelector('[data-message-page]')
  if (!page) return

  const messageId = page.getAttribute('data-message-id')
  const loading = document.querySelector('[data-message-loading]')
  const shell = document.querySelector('[data-message-shell]')
  const status = document.querySelector('[data-message-status]')
  const subject = document.querySelector('[data-message-subject]')
  const meta = document.querySelector('[data-message-meta]')
  const date = document.querySelector('[data-message-date]')
  const body = document.querySelector('[data-message-body]')
  const replies = document.querySelector('[data-message-replies]')
  const form = document.querySelector('[data-reply-form]')
  const contractInput = document.querySelector('[data-contract-input]')
  const contractName = document.querySelector('[data-contract-name]')
  const submitButton = document.querySelector('[data-reply-submit]')
  const submitLabel = document.querySelector('[data-reply-label]')
  const spinner = document.querySelector('[data-reply-spinner]')
  const notice = document.querySelector('[data-reply-notice]')

  function setLoadingState(isLoading) {
    submitButton.disabled = isLoading
    submitLabel.textContent = isLoading ? 'Sending...' : 'Send reply'
    spinner.classList.toggle('hidden', !isLoading)
  }

  function renderReplies(message) {
    const items = message.replies || []
    if (!items.length) {
      replies.innerHTML = '<div class="text-sm text-dawn-500">No admin replies yet.</div>'
      return
    }

    replies.innerHTML = items.map((reply) => `
      <article class="ml-auto max-w-2xl border-l-4 border-gold-400 bg-white p-5">
        <p class="whitespace-pre-wrap text-sm leading-7">${escapeHtml(reply.body)}</p>
        <div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-dawn-400">
          <span>${new Date(reply.sentAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          ${reply.adminName ? `<span>By ${escapeHtml(reply.adminName)}</span>` : ''}
          ${reply.contractPath ? `<a href="${escapeHtml(reply.contractPath)}" target="_blank" class="text-gold-700">Contract</a>` : ''}
        </div>
      </article>
    `).join('')
  }

  async function loadMessage() {
    const response = await apiFetch(`/api/messages/${messageId}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Message could not be loaded.')

    const message = data.message
    status.textContent = message.emailStatus.replaceAll('_', ' ')
    subject.textContent = message.subject
    meta.textContent = `From ${message.name} | ${message.email}${message.phone ? ` | ${message.phone}` : ''}`
    date.textContent = new Date(message.createdAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })
    body.textContent = message.body
    renderReplies(message)
  }

  contractInput.addEventListener('change', () => {
    const file = contractInput.files?.[0]
    contractName.textContent = file ? `${file.name} attached` : 'No file attached'
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    notice.textContent = ''
    setLoadingState(true)

    try {
      const payload = new FormData(form)
      const response = await apiFetch(`/api/messages/${messageId}/reply`, { method: 'POST', body: payload })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Reply could not be sent.')
      notice.textContent = data.message
      form.reset()
      contractName.textContent = 'No file attached'
      await loadMessage()
    } catch (error) {
      notice.textContent = error.message
    } finally {
      setLoadingState(false)
    }
  })

  try {
    await loadMessage()
    loading.classList.add('hidden')
    shell.classList.remove('hidden')
  } catch (error) {
    loading.textContent = error.message
  }
})
