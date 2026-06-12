<script setup>
import { onMounted, ref } from 'vue'
import { CheckCheck, FolderKanban, Mail, MailWarning } from 'lucide-vue-next'
import api from '../../services/api.js'

const stats = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard')
    stats.value = data
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Dashboard data could not be loaded.'
  } finally {
    loading.value = false
  }
})

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p class="eyebrow text-gold-700">Overview</p><h1 class="mt-2 font-display text-4xl font-semibold">Studio activity</h1></div>
      <RouterLink to="/admin/upload" class="btn-dark">Upload new project</RouterLink>
    </div>
    <p v-if="loading" class="mt-12 text-dawn-500">Loading dashboard...</p>
    <p v-else-if="error" class="mt-12 text-red-700">{{ error }}</p>
    <template v-else>
      <section class="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <article class="metric-card"><FolderKanban class="text-gold-600" /><p>Projects uploaded</p><strong>{{ stats.projectCount }}</strong></article>
        <article class="metric-card"><Mail class="text-gold-600" /><p>Total inquiries</p><strong>{{ stats.messageCount }}</strong></article>
        <article class="metric-card"><MailWarning class="text-gold-600" /><p>New unread email</p><strong>{{ stats.unreadCount }}</strong></article>
        <article class="metric-card"><CheckCheck class="text-gold-600" /><p>Admin emails sent</p><strong>{{ stats.deliveredCount }}</strong></article>
      </section>

      <section class="mt-8 border border-dawn-200 bg-white">
        <div class="flex items-center justify-between border-b border-dawn-200 p-6"><div><p class="eyebrow text-gold-700">Inbox</p><h2 class="mt-2 font-display text-3xl">Recent inquiries</h2></div><RouterLink to="/admin/messages" class="text-xs font-bold uppercase tracking-[.14em] text-dawn-700">View all</RouterLink></div>
        <div v-if="!stats.recentMessages.length" class="p-8 text-sm text-dawn-500">No inquiries have arrived yet.</div>
        <RouterLink v-for="message in stats.recentMessages" :key="message._id" :to="`/admin/messages?id=${message._id}`" class="grid gap-2 border-b border-dawn-100 p-5 transition last:border-0 hover:bg-dawn-50 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
          <div><span v-if="!message.isRead" class="mr-2 inline-block h-2 w-2 rounded-full bg-gold-500" /><strong class="text-sm">{{ message.name }}</strong><p class="mt-1 text-xs text-dawn-500">{{ message.email }}</p></div>
          <p class="truncate text-sm text-dawn-700">{{ message.subject }}</p><time class="text-xs text-dawn-400">{{ formatDate(message.createdAt) }}</time>
        </RouterLink>
      </section>
    </template>
  </div>
</template>

