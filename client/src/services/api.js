import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 20000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mtc_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && location.pathname.startsWith('/admin') && !location.pathname.endsWith('/login')) {
      localStorage.removeItem('mtc_admin_token')
      location.assign('/admin/login')
    }
    return Promise.reject(error)
  }
)

export default api

