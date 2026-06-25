async function submitContactForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const notice = form.querySelector('[data-contact-notice]')
  const submit = form.querySelector('[data-submit-label]')
  const payload = Object.fromEntries(new FormData(form).entries())

  notice.className = 'hidden text-sm'
  submit.disabled = true

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Your message could not be sent.')
    form.reset()
    notice.textContent = data.message
    notice.className = 'notice notice-success text-sm'
  } catch (error) {
    notice.textContent = error.message
    notice.className = 'notice notice-error text-sm'
  } finally {
    submit.disabled = false
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', submitContactForm)
  })
})
