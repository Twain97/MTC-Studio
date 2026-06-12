<script setup>
import { ref } from 'vue'
import { ArrowUpRight, MapPin } from 'lucide-vue-next'

defineProps({ project: { type: Object, required: true } })
const active = ref(false)

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
  <article class="portfolio-card group" :class="{ 'is-active': active }" tabindex="0" @click="active = !active" @keydown.enter="active = !active">
    <div class="relative overflow-hidden">
      <img :src="project.thumbnail" :alt="project.eventName" class="h-80 w-full object-cover transition duration-700 group-hover:scale-105 md:h-96" />
      <div class="absolute inset-0 bg-gradient-to-t from-dawn-950/85 via-transparent to-transparent" />
      <RouterLink :to="`/portfolio/${project._id}`" class="event-button" @click.stop>
        View event <ArrowUpRight :size="17" />
      </RouterLink>
    </div>
    <div class="p-5">
      <h2 class="font-display text-2xl font-semibold text-dawn-950">{{ project.eventName }}</h2>
      <div class="mt-4 flex items-center justify-between gap-3 border-t border-dawn-200 pt-4 text-xs font-semibold uppercase tracking-[.12em] text-dawn-600">
        <span>{{ formatDate(project.eventDate) }}</span>
        <span class="flex items-center gap-1 text-right"><MapPin :size="14" /> {{ project.location }}</span>
      </div>
    </div>
  </article>
</template>

