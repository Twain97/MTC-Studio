<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import WhatsAppButton from './components/WhatsAppButton.vue'

const route = useRoute()
const isAdminLayout = computed(() => route.meta.adminLayout)
</script>

<template>
  <div class="min-h-screen bg-dawn-50 text-dawn-950">
    <template v-if="!isAdminLayout">
      <SiteHeader />
      <main>
        <RouterView />
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </template>
    <RouterView v-else />
  </div>
</template>

