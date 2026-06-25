document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-admin-login-form]')
  const error = document.querySelector('[data-admin-login-error]')
  if (!form) return

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    error.classList.add('hidden')
    const submit = form.querySelector('[data-submit-label]')
    submit.disabled = true

    const payload = Object.fromEntries(new FormData(form).entries())
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Login failed.')
      localStorage.setItem('mtc_admin_token', data.token)
      localStorage.setItem('mtc_admin_profile', JSON.stringify(data.admin))
      location.assign('/admin/dashboard')
    } catch (err) {
      error.textContent = err.message
      error.classList.remove('hidden')
    } finally {
      submit.disabled = false
    }
  })
})
