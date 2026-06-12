<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, MapPin } from 'lucide-vue-next'
import api from '../services/api.js'
import { sampleProjects } from '../data/sampleProjects.js'

const route = useRoute()
const project = ref(null)
const loading = ref(true)

const formattedDate = computed(() => project.value
  ? new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(project.value.eventDate))
  : '')

onMounted(async () => {
  const sample = sampleProjects.find((item) => item._id === route.params.id)
  if (sample) {
    project.value = sample
  } else {
    try {
      const { data } = await api.get(`/projects/${route.params.id}`)
      project.value = data.project
    } catch {
      project.value = null
    }
  }
  loading.value = false
})
</script>

<template>
  <section v-if="loading" class="grid min-h-[60vh] place-items-center">Loading event...</section>
  <section v-else-if="!project" class="grid min-h-[60vh] place-items-center px-6 text-center">
    <div><h1 class="font-display text-5xl">Event not found</h1><RouterLink to="/portfolio" class="btn-dark mt-7">Back to portfolio</RouterLink></div>
  </section>
  <template v-else>
    <section class="relative min-h-[72vh] overflow-hidden bg-dawn-950">
      <img :src="project.thumbnail" :alt="project.eventName" class="absolute inset-0 h-full w-full object-cover opacity-75" />
      <div class="absolute inset-0 bg-gradient-to-t from-dawn-950 via-dawn-950/30 to-transparent" />
      <div class="site-container relative z-10 flex min-h-[72vh] items-end pb-16 text-white">
        <div>
          <RouterLink to="/portfolio" class="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em]"><ArrowLeft :size="16" /> Portfolio</RouterLink>
          <h1 class="font-display text-5xl font-semibold md:text-7xl">{{ project.eventName }}</h1>
          <div class="mt-5 flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[.15em] text-gold-200">
            <span>{{ formattedDate }}</span><span class="flex items-center gap-2"><MapPin :size="15" /> {{ project.location }}</span>
          </div>
        </div>
      </div>
    </section>
    <section class="section-pad bg-white">
      <div class="site-container">
        <p v-if="project.description" v-reveal class="mx-auto max-w-3xl text-center font-display text-3xl leading-snug text-dawn-800 md:text-4xl">{{ project.description }}</p>
        <div class="mt-14 grid gap-5 md:grid-cols-2">
          <img v-for="(image, index) in project.images" :key="image" v-reveal="index * 70" :src="image" :alt="`${project.eventName} photograph ${index + 1}`" class="h-[480px] w-full object-cover" :class="index === 0 && project.images.length % 2 ? 'md:col-span-2 md:h-[650px]' : ''" />
        </div>
      </div>
    </section>
  </template>
</template>

