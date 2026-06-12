<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ImagePlus, LayoutDashboard, LogOut, Mail, Menu, X } from 'lucide-vue-next'
import LogoMark from '../LogoMark.vue'
import { clearSession, getAdmin } from '../../services/auth.js'

const router = useRouter()
const open = ref(false)
const admin = getAdmin()
const links = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Messages', to: '/admin/messages', icon: Mail },
  { label: 'Upload project', to: '/admin/upload', icon: ImagePlus }
]

function logout() {
  clearSession()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-dawn-50 lg:grid lg:grid-cols-[270px_1fr]">
    <aside class="fixed inset-y-0 left-0 z-50 w-[270px] bg-dawn-950 text-white transition lg:static lg:translate-x-0" :class="open ? 'translate-x-0' : '-translate-x-full'">
      <div class="flex h-24 items-center justify-between border-b border-white/10 px-6">
        <LogoMark />
        <button class="lg:hidden" aria-label="Close admin menu" @click="open = false"><X /></button>
      </div>
      <nav class="grid gap-2 p-4">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="admin-nav-link" @click="open = false">
          <component :is="link.icon" :size="19" /> {{ link.label }}
        </RouterLink>
      </nav>
      <div class="absolute bottom-0 left-0 right-0 border-t border-white/10 p-5">
        <p class="truncate text-sm font-semibold">{{ admin?.name || 'MTC Studio Admin' }}</p>
        <p class="mt-1 truncate text-xs text-dawn-300">{{ admin?.email }}</p>
        <button class="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-gold-300" @click="logout"><LogOut :size="16" /> Log out</button>
      </div>
    </aside>

    <div>
      <header class="flex h-20 items-center justify-between border-b border-dawn-200 bg-white px-5 sm:px-8">
        <button class="rounded border border-dawn-200 p-2 lg:hidden" aria-label="Open admin menu" @click="open = true"><Menu /></button>
        <div><p class="text-xs font-bold uppercase tracking-[.18em] text-gold-700">Admin dashboard</p><p class="mt-1 text-sm text-dawn-500">Manage MTC Studio</p></div>
        <RouterLink to="/" target="_blank" class="text-xs font-bold uppercase tracking-[.14em] text-dawn-700">View website</RouterLink>
      </header>
      <main class="p-5 sm:p-8 lg:p-10"><RouterView /></main>
    </div>
  </div>
</template>

