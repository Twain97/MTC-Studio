<script setup>
import { onMounted } from 'vue'
import { ArrowRight, Camera, Heart, Sparkles, Users, PlaneIcon } from 'lucide-vue-next'
import { useProjects } from '../composables/useProjects.js'
import PortfolioCard from '../components/PortfolioCard.vue'
import ContactForm from '../components/ContactForm.vue'

const { projects, loadProjects } = useProjects()
onMounted(loadProjects)

const services = [
  { icon: Heart, title: 'Weddings', text: 'Honest, elegant coverage from quiet preparations to the final dance.' },
  { icon: Users, title: 'Portraits', text: 'Relaxed personal and family sessions with thoughtful direction.' },
  { icon: PlaneIcon, title: 'Drone Coverage', text: 'Aerial shots of events and locations from a unique perspective.' }
]

const pricing = [
  { name: 'Celebratory Portraits', price: '₦40,000', detail: 'For Graduations, Birthdays, Baby Bumps, and Anniversaries.', features: ['6 edited photographs', '24-72 hours delivery', 'Private online gallery'], featured: true },
  { name: 'Corporate Photographs', price: '₦40,000', detail: 'For corporate portraits and branding.', features: ['6 edited photographs', '24-72 hours delivery', 'Private online gallery'], featured: true },
  { name: 'Couple Portrait', price: '₦60,000', detail: 'For couples pre-wedding shoot.', features: ['6 edited photographs Per Outfit', '24-72 hours delivery', 'Private online gallery'], featured: true  },
  { name: 'Family Portraits', price: '₦80,000', detail: 'For Birthdays, Naming Ceremonies and Burials.', features: ['10 edited photographs', '24-72 hours delivery', 'Private online gallery'], featured: true },
  { name: 'Event Coverage', price: '₦300,000', detail: 'For a days event, additional days will attract extra fee of #170,000.', features: [ 'Birthdays', 'Engagements', 'Weddings', 'Retirement Ceremony', 'Burials', 'Corporate Events', '7-14 Days Delivery' ], featured: true },
  { name: 'Campaign', price: 'Custom', detail: 'For brands, editorial teams, and commercial work.', features: ['Creative consultation', 'Production planning', 'Commercial usage options'], featured: true  }
]
</script>

<template>
  <section class="hero">
    <div class="grid bg-dawn-700 min-h-[calc(100vh-5rem)] lg:grid-cols-[.9fr_1.1fr]">
      <div class="relative min-h-[620px] overflow-hidden ">
        <img src="/images/vc_wedding.png" alt="Bride photographed by MTC Studio" class="absolute inset-0 h-full w-full object-cover object-center" />
        <div class="absolute inset-0 bg-gradient-to-r from-dawn-950/30 via-transparent to-dawn-950/10" />
        <div class="rounded-lg drop-shadow-2xl md:absolute mt-80 mx-auto max-w-xs border border-white/30 bg-dawn-950/75 p-5 text-white backdrop-blur md:bottom-12 md:right-12">
          <p class="font-display text-2xl">MTC-STUDIO</p>
          <p class="mt-2 text-xs uppercase tracking-[.2em] text-gold-200 ">Photography with intention</p>
        </div>
      </div>
      <div class="hero-panel flex items-center">
        <div class="relative z-10 px-6 py-10 sm:px-12 lg:ml-auto lg:max-w-2xl lg:px-16">
          <p class="eyebrow text-dawn-950">Lagos · Available Nationwide</p>
          <h1 class="mt-6 font-display text-6xl font-semibold leading-[.88] text-dawn-950 sm:text-7xl xl:text-8xl">Stories in<br /><em class="font-normal">every frame.</em></h1>
          <p class="mt-7 max-w-lg text-base leading-8 text-dawn-900">Refined photography for weddings, portraits, and brands. We capture each movement, meaning behind each moment and turn them into memories that'll last a lifetime.</p>
          <div class="mt-9 flex flex-wrap gap-4">
            <RouterLink to="/portfolio" class="btn-dark rounded-md">View portfolio <ArrowRight :size="18" /></RouterLink>
            <RouterLink to="/contact" class="btn-outline-dark rounded-md">Book a session</RouterLink>
          </div>
        </div>
      </div>
      
    </div>
  </section>

  <section class="about section-pad overflow-hidden bg-dawn-900">
    <div class="site-container grid items-center gap-12 lg:grid-cols-2">
      <div v-reveal class="relative">
        <img src="/images/photographer.webp" alt="Photographer holding a camera" class="h-[540px] rounded-md w-full object-cover" />
        <div class="absolute rounded-md -bottom-7 -right-3 hidden w-52 bg-gold-300 p-6 text-dawn-950 sm:block">
          <p class="font-display text-4xl font-semibold">5+</p>
          <p class="mt-1 text-xs font-bold uppercase tracking-[.16em]">Years creating memories</p>
        </div>
      </div>
      <div v-reveal="120" class="lg:pl-10">
        <p class="eyebrow text-gold-700">MTC-Studio</p>
        <h2 class="section-title mt-4">Images that feel like the moment.</h2>
        <p class="mt-6 text-base leading-8 text-dawn-200">
          <span class="section-title text-gold-700 font-bold">H</span>ello! I'm <span class="section-title text-gold-700 font-bold">T</span>aiwo, the admittedly handsome face (and chief memory preserver) behind MTC Studio.  
          With over five years of experience behind the lens, we have captured, recorded, and beautifully framed countless unforgettable moments, from weddings that made hearts skip a beat, to birthdays full of pure joy, convocations bursting with pride, and every other milestone worth celebrating.  
          <br/>The result? Timeless photographs and videos that let our clients hit “replay” on their happiest days whenever they wish, creating memories so well preserved, they’ll still be cherished long after the cake is gone and the confetti has settled. 
          <br/> Welcome to MTC Studio where we don’t just take pictures… we freeze happiness in time.
        </p>
        <RouterLink to="/about" class="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-dawn-900">Meet MTC-STUDIO <ArrowRight :size="17" /></RouterLink>
      </div>
    </div>
  </section>

  <section class="services section-pad bg-dawn-950 text-white">
    <div class="site-container">
      <div v-reveal class="max-w-2xl">
        <p class="eyebrow text-gold-300">What we photograph</p>
        <h2 class="section-title mt-4 text-white">Considered coverage for every kind of story.</h2>
      </div>
      <div class="mt-12 grid gap-px bg-white/10 md:grid-cols-3">
        <article v-for="(service, index) in services" :key="service.title" v-reveal="index * 100" class="bg-dawn-950 p-8 transition hover:bg-dawn-900 md:p-10">
          <component :is="service.icon" :size="28" class="text-gold-300" />
          <h3 class="mt-8 font-display text-3xl">{{ service.title }}</h3>
          <p class="mt-4 text-sm leading-7 text-dawn-200">{{ service.text }}</p>
        </article>
      </div>
    </div>
  </section>

  <section class="portfolio section-pad bg-dawn-100">
    <div class="site-container">
      <div v-reveal class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p class="eyebrow rounded-md bg-dawn-200 px-4 py-2 text-gold-700">Selected work</p>
          <h2 class="section-title mt-4">Recent stories</h2>
        </div>
        <RouterLink to="/portfolio" class="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-dawn-900">Explore all work <ArrowRight :size="17" /></RouterLink>
      </div>
      <div class="mt-12 grid gap-7 md:grid-cols-2">
        <PortfolioCard v-for="(project, index) in projects.slice(0, 4)" :key="project._id" v-reveal="index * 80" :project="project" />
      </div>
    </div>
  </section>

  <section class="pricing section-pad bg-white">
    <div class="site-container">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <p class="eyebrow rounded-md bg-dawn-200 px-4 py-2 text-gold-700">Starting investment</p>
        <h2 class="section-title mt-4">Choose the right experience.</h2>
        <p class="mt-5 text-dawn-600">Each collection can be tailored to your date, location, and creative needs.</p>
      </div>
      <div class="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
        <article v-for="(plan, index) in pricing" :key="plan.name" v-reveal="index * 100" class="relative border p-8" :class="plan.featured ? 'rounded-lg border-gold-400 bg-dawn-950 text-white shadow-glow lg:-translate-y-4' : 'border-dawn-200 bg-dawn-50'">
          <span v-if="plan.featured" class="rounded-lg absolute right-5 top-5 bg-gold-300 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-dawn-950">Most popular</span>
          <h3 class="font-display text-3xl">{{ plan.name }}</h3>
          <p class="mt-4 text-4xl font-semibold text-gold-400">{{ plan.price }}</p>
          <p class="mt-4 text-sm leading-7" :class="plan.featured ? 'text-dawn-200' : 'text-dawn-600'">{{ plan.detail }}</p>
          <ul class="mt-7 grid gap-3 text-sm">
            <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-3"><Camera :size="15" class="text-gold-400" /> {{ feature }}</li>
          </ul>
          <RouterLink to="/contact" class="mt-8 inline-flex text-xs font-bold uppercase tracking-[.18em] text-gold-400">Request availability</RouterLink>
        </article>
      </div>
    </div>
  </section>

  <section class="contact section-pad bg-dawn-800 text-white">
    <div class="rounded-lg site-container grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
      <div v-reveal>
        <p class="eyebrow text-gold-300">Start a conversation</p>
        <h2 class="section-title mt-4 text-white">Tell us what you are planning.</h2>
        <p class="mt-6 max-w-md text-base leading-8 text-dawn-100">Share your date, location, and the feeling you want your photographs to hold. We normally reply within one business day.</p>
      </div>
      <div v-reveal="120" class=" rounded-lg bg-white p-6 text-dawn-950 shadow-glow sm:p-9"><ContactForm /></div>
    </div>
  </section>
</template>

