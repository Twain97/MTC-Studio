<script setup>
import { onMounted, ref } from 'vue'
import PageHero from '../components/PageHero.vue'
import PortfolioCard from '../components/PortfolioCard.vue'
import { useProjects } from '../composables/useProjects.js'

const { projects, loading, loadProjects } = useProjects()
const selectedYear = ref('all')

onMounted(loadProjects)
</script>

<template>
  <PageHero eyebrow="Selected stories" title="Portfolio" text="Weddings, portraits, celebrations, and commercial stories photographed with clarity and warmth." />
  <section class="portfolio section-pad bg-dawn-50">
    <div class="site-container">
      <div v-if="loading" class="py-20 text-center text-dawn-500">Loading portfolio...</div>
      <div v-else class="grid gap-7 md:grid-cols-2">
        <PortfolioCard v-for="(project, index) in projects" :key="project._id" v-reveal="index * 70" :project="project" />
      </div>
    </div>
  </section>
</template>

