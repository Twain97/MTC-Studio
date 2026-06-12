export function isAuthenticated() {
  return Boolean(localStorage.getItem('mtc_admin_token'))
}

export function saveSession(token, admin) {
  localStorage.setItem('mtc_admin_token', token)
  localStorage.setItem('mtc_admin_profile', JSON.stringify(admin))
}

export function getAdmin() {
  try {
    return JSON.parse(localStorage.getItem('mtc_admin_profile'))
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('mtc_admin_token')
  localStorage.removeItem('mtc_admin_profile')
}

