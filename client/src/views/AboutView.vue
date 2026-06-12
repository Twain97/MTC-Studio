<script setup>
import { Aperture, Eye, Heart } from 'lucide-vue-next'
import PageHero from '../components/PageHero.vue'

const values = [
  { icon: Eye, title: 'Observe first', text: 'We watch for real connection before giving direction, keeping the story natural.' },
  { icon: Aperture, title: 'Shape the light', text: 'Every frame is composed with a clean editorial eye and careful use of light.' },
  { icon: Heart, title: 'Make it personal', text: 'The experience is calm, collaborative, and built around what matters to you.' }
]
</script>

<template>
  <PageHero eyebrow="About MTC Studio" title="The person behind the lens" text="A photography studio built around honest observation, refined craft, and excellent client care." />
  <section class="about section-pad bg-white">
    <div class="site-container grid items-center gap-12 lg:grid-cols-2">
      <div v-reveal class="grid grid-cols-2 gap-4">
        <img src="https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=900&q=85" alt="Photographer at work" class="mt-14 h-[470px] w-full object-cover" />
        <img src="https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=900&q=85" alt="Camera and photography workspace" class="h-[470px] w-full object-cover" />
      </div>
      <div v-reveal="100" class="lg:pl-10">
        <p class="eyebrow text-gold-700">Our perspective</p>
        <h2 class="section-title mt-4">Photographs should carry feeling, not just detail.</h2>
        <p class="mt-6 text-base leading-8 text-dawn-700">MTC Studio documents people at their most present. Our work is grounded in an editorial sensibility, but the heart of every assignment is the unrepeatable human moment happening in front of us.</p>
        <p class="mt-4 text-base leading-8 text-dawn-700">Based in Lagos and available for selected travel, we work with couples, families, creative teams, and brands that care about images with lasting character.</p>
        <RouterLink to="/contact" class="btn-dark mt-8">Work with us</RouterLink>
      </div>
    </div>
  </section>
  <section class="section-pad bg-dawn-100">
    <div class="site-container grid gap-6 md:grid-cols-3">
      <article v-for="(value, index) in values" :key="value.title" v-reveal="index * 100" class="bg-white p-8">
        <component :is="value.icon" :size="28" class="text-gold-600" />
        <h2 class="mt-7 font-display text-3xl">{{ value.title }}</h2>
        <p class="mt-4 text-sm leading-7 text-dawn-600">{{ value.text }}</p>
      </article>
    </div>
  </section>
</template>

