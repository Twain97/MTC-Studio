<script setup>
import { Instagram, Mail, MapPin } from 'lucide-vue-next'
import LogoMark from './LogoMark.vue'
</script>

<template>
  <footer class="bg-dawn-950 text-white">
    <div class="site-container grid gap-6 py-7 md:grid-cols-[1.2fr_.8fr_.8fr]">
      <div>
        <LogoMark />
        <p class="mt-0 max-w-sm text-sm leading-7 text-dawn-200">Every Laughter, Smile and Memory captures and immortalized with love.</p>
      </div>
      <div>
        <h2 class="eyebrow text-gold-300">Explore</h2>
        <div class="mt-4 grid gap-3 text-sm text-dawn-100">
          <RouterLink to="/about">About the studio</RouterLink>
          <RouterLink to="/portfolio">Selected work</RouterLink>
          <RouterLink to="/contact">Book a session</RouterLink>
        </div>
      </div>
      <div>
        <h2 class="eyebrow text-gold-300">Contact</h2>
        <div class="mt-4 grid gap-3 text-sm text-dawn-100">
          <a href="mailto:admin@mtcstudio.com" class="flex items-center gap-2"><Mail :size="16" /> admin@mtcstudio.com</a>
          <p class="flex items-center gap-2"><MapPin :size="16" /> Lagos, Nigeria</p>
          <a href="#" class="flex items-center gap-2"><Instagram :size="16" /> @mtcstudio</a>
        </div>
      </div>
    </div>
    <div class="border-t border-white/10 py-5 text-center text-xs tracking-wider text-dawn-300">© {{ new Date().getFullYear() }} MTC-Studio. All rights reserved.</div>
  </footer>
</template>

