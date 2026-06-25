function authToken() {
  return localStorage.getItem('mtc_admin_token')
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function adminProfile() {
  try {
    return JSON.parse(localStorage.getItem('mtc_admin_profile') || 'null')
  } catch {
    return null
  }
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = authToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(path, { ...options, headers })
  if (response.status === 401) {
    localStorage.removeItem('mtc_admin_token')
    localStorage.removeItem('mtc_admin_profile')
    location.assign('/admin/login')
  }
  return response
}

function logout() {
  localStorage.removeItem('mtc_admin_token')
  localStorage.removeItem('mtc_admin_profile')
  location.assign('/admin/login')
}

function initAdminShell() {
  const sidebar = document.querySelector('[data-admin-sidebar]')
  const open = document.querySelector('[data-admin-sidebar-open]')
  const close = document.querySelector('[data-admin-sidebar-close]')
  const logoutButton = document.querySelector('[data-admin-logout]')
  const profile = adminProfile()

  if (profile) {
    const name = document.querySelector('[data-admin-name]')
    const email = document.querySelector('[data-admin-email]')
    if (name) name.textContent = profile.name || 'MTC Studio Admin'
    if (email) email.textContent = profile.email || ''
  }

  if (logoutButton) logoutButton.addEventListener('click', logout)
  if (open && sidebar) open.addEventListener('click', () => sidebar.classList.add('admin-sidebar-open'))
  if (close && sidebar) close.addEventListener('click', () => sidebar.classList.remove('admin-sidebar-open'))
  if (!authToken() && !location.pathname.endsWith('/admin/login')) location.assign('/admin/login')
}

document.addEventListener('DOMContentLoaded', initAdminShell)
window.escapeHtml = escapeHtml
window.apiFetch = apiFetch
