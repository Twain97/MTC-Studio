<script setup>
import { ref } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import LogoMark from './LogoMark.vue'

const open = ref(false)
const links = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Contact', to: '/contact' }
]
</script>

<template>
  <header class="site-header">
    <div class="site-container flex h-20 items-center justify-between gap-6">
      <RouterLink to="/" class="shrink-0" @click="open = false"><LogoMark /></RouterLink>

      <nav class="hidden items-center gap-8 md:flex" aria-label="Main navigation">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="nav-link">{{ link.label }}</RouterLink>
        <RouterLink to="/contact" class="btn-gold rounded-md !px-5 !py-2.5">Book a session</RouterLink>
      </nav>

      <button class="rounded-full border border-white/20 p-2 text-white md:hidden" aria-label="Toggle menu" @click="open = !open">
        <X v-if="open" :size="22" />
        <Menu v-else :size="22" />
      </button>
    </div>

    <nav v-if="open" class="border-t border-white/10 bg-dawn-950 px-5 py-5 md:hidden" aria-label="Mobile navigation">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="block border-b border-white/10 py-3 text-sm font-semibold uppercase tracking-[.18em] text-white" @click="open = false">
        {{ link.label }}
      </RouterLink>
    </nav>
  </header>
</template>

