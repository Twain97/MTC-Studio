<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ImagePlus, LoaderCircle, MapPin, Trash2, UploadCloud } from 'lucide-vue-next'
import api from '../../services/api.js'
import { useProjects } from '../../composables/useProjects.js'

const form = reactive({ eventName: '', eventDate: '', location: '', description: '', featured: false, thumbnail: null, images: [] })
const thumbnailPreview = ref('')
const imagePreviews = ref([])
const uploading = ref(false)
const notice = ref({ type: '', text: '' })
const { projects, loadProjects } = useProjects()

onMounted(() => loadProjects({ allowSamples: false }))

function setThumbnail(event) {
  form.thumbnail = event.target.files[0] || null
  thumbnailPreview.value = form.thumbnail ? URL.createObjectURL(form.thumbnail) : ''
}

function setImages(event) {
  form.images = Array.from(event.target.files).slice(0, 5)
  imagePreviews.value = form.images.map((file) => URL.createObjectURL(file))
}

async function submit() {
  uploading.value = true
  notice.value = { type: '', text: '' }
  const data = new FormData()
  data.append('eventName', form.eventName)
  data.append('eventDate', form.eventDate)
  data.append('location', form.location)
  data.append('description', form.description)
  data.append('featured', String(form.featured))
  data.append('thumbnail', form.thumbnail)
  form.images.forEach((image) => data.append('images', image))

  try {
    const response = await api.post('/projects', data)
    notice.value = { type: 'success', text: response.data.message }
    Object.assign(form, { eventName: '', eventDate: '', location: '', description: '', featured: false, thumbnail: null, images: [] })
    thumbnailPreview.value = ''
    imagePreviews.value = []
    await loadProjects({ allowSamples: false })
  } catch (error) {
    notice.value = { type: 'error', text: error.response?.data?.message || 'Project upload failed.' }
  } finally {
    uploading.value = false
  }
}

async function removeProject(project) {
  if (!window.confirm(`Delete “${project.eventName}”? This also deletes its uploaded images.`)) return
  await api.delete(`/projects/${project._id}`)
  await loadProjects({ allowSamples: false })
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
  <div>
    <p class="eyebrow text-gold-700">Portfolio manager</p><h1 class="mt-2 font-display text-4xl font-semibold">Upload an event</h1>
    <div class="mt-8 grid gap-8 xl:grid-cols-[1.15fr_.85fr]">
      <form class="border border-dawn-200 bg-white p-6 sm:p-8" @submit.prevent="submit">
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="form-label sm:col-span-2">Event name<input v-model.trim="form.eventName" class="form-input" required placeholder="e.g. Ada & Kelechi" /></label>
          <label class="form-label">Month and year<input v-model="form.eventDate" type="month" class="form-input" required /></label>
          <label class="form-label">Location<input v-model.trim="form.location" class="form-input" required placeholder="Lagos, Nigeria" /></label>
          <label class="form-label sm:col-span-2">Event description<textarea v-model.trim="form.description" class="form-input resize-none" rows="4" placeholder="A short introduction shown on the event page." /></label>
        </div>

        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <label class="upload-box">
            <ImagePlus :size="28" /><strong>Choose thumbnail</strong><span>JPG, PNG or WebP, up to 10MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" required @change="setThumbnail" />
          </label>
          <img v-if="thumbnailPreview" :src="thumbnailPreview" alt="Thumbnail preview" class="h-44 w-full object-cover" />
          <div v-else class="grid h-44 place-items-center bg-dawn-100 text-xs uppercase tracking-[.14em] text-dawn-400">Thumbnail preview</div>
        </div>

        <label class="upload-box mt-6">
          <UploadCloud :size="28" /><strong>Choose up to 5 event images</strong><span>These appear inside the event gallery</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" class="sr-only" @change="setImages" />
        </label>
        <div v-if="imagePreviews.length" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5"><img v-for="preview in imagePreviews" :key="preview" :src="preview" alt="Gallery preview" class="h-24 w-full object-cover" /></div>

        <label class="mt-6 flex items-center gap-3 text-sm font-semibold"><input v-model="form.featured" type="checkbox" class="h-4 w-4 accent-gold-600" /> Feature this event on the home page</label>
        <p v-if="notice.text" class="mt-5 text-sm" :class="notice.type === 'success' ? 'text-emerald-700' : 'text-red-700'">{{ notice.text }}</p>
        <button class="btn-dark mt-7" :disabled="uploading"><LoaderCircle v-if="uploading" :size="18" class="animate-spin" /><UploadCloud v-else :size="18" />{{ uploading ? 'Uploading...' : 'Publish project' }}</button>
      </form>

      <aside>
        <div class="flex items-center justify-between"><h2 class="font-display text-3xl">Published projects</h2><span class="rounded-full bg-dawn-200 px-3 py-1 text-xs font-semibold">{{ projects.length }}</span></div>
        <div v-if="!projects.length" class="mt-5 border border-dashed border-dawn-300 p-8 text-center text-sm text-dawn-500">No database projects yet.</div>
        <div class="mt-5 grid gap-4">
          <article v-for="project in projects" :key="project._id" class="grid grid-cols-[100px_1fr_auto] items-center gap-4 border border-dawn-200 bg-white p-3">
            <img :src="project.thumbnail" :alt="project.eventName" class="h-24 w-full object-cover" />
            <div class="min-w-0"><h3 class="truncate font-display text-xl font-semibold">{{ project.eventName }}</h3><p class="mt-2 flex items-center gap-1 truncate text-xs text-dawn-500"><MapPin :size="13" />{{ project.location }}</p><p class="mt-1 text-xs text-dawn-400">{{ formatDate(project.eventDate) }}</p></div>
            <button class="rounded-full p-2 text-red-600 transition hover:bg-red-50" aria-label="Delete project" @click="removeProject(project)"><Trash2 :size="18" /></button>
          </article>
        </div>
      </aside>
    </div>
  </div>
</template>
