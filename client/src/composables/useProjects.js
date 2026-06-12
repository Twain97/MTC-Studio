import { ref } from 'vue'
import api from '../services/api.js'
import { sampleProjects } from '../data/sampleProjects.js'

export function useProjects() {
  const projects = ref([])
  const loading = ref(true)
  const error = ref('')

  async function loadProjects({ allowSamples = true } = {}) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.get('/projects')
      projects.value = data.projects.length || !allowSamples ? data.projects : sampleProjects
    } catch (requestError) {
      error.value = requestError.response?.data?.message || 'Portfolio projects could not be loaded.'
      projects.value = allowSamples ? sampleProjects : []
    } finally {
      loading.value = false
    }
  }

  return { projects, loading, error, loadProjects }
}

