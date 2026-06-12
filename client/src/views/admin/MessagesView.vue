<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FileText, LoaderCircle, Mail, Paperclip, Send } from 'lucide-vue-next'
import api from '../../services/api.js'

const route = useRoute()
const messages = ref([])
const selected = ref(null)
const loading = ref(true)
const sending = ref(false)
const notice = ref('')
const reply = reactive({ body: '', contract: null })

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

async function loadMessages() {
  const { data } = await api.get('/messages')
  messages.value = data.messages
  if (route.query.id) await openMessage(route.query.id)
  else if (messages.value.length) await openMessage(messages.value[0]._id)
}

async function openMessage(id) {
  const { data } = await api.get(`/messages/${id}`)
  selected.value = data.message
  const index = messages.value.findIndex((message) => message._id === id)
  if (index >= 0) messages.value[index].isRead = true
  notice.value = ''
}

async function sendReply() {
  if (!selected.value) return
  sending.value = true
  notice.value = ''
  const data = new FormData()
  data.append('body', reply.body)
  if (reply.contract) data.append('contract', reply.contract)
  try {
    const response = await api.post(`/messages/${selected.value._id}/reply`, data)
    selected.value = response.data.inquiry
    reply.body = ''
    reply.contract = null
    notice.value = response.data.message
  } catch (error) {
    notice.value = error.response?.data?.message || 'Reply could not be sent.'
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  try { await loadMessages() } finally { loading.value = false }
})
</script>

<template>
  <div>
    <p class="eyebrow text-gold-700">Client communication</p><h1 class="mt-2 font-display text-4xl font-semibold">Messages</h1>
    <p v-if="loading" class="mt-10 text-dawn-500">Loading messages...</p>
    <div v-else class="mt-8 grid min-h-[680px] overflow-hidden border border-dawn-200 bg-white xl:grid-cols-[360px_1fr]">
      <aside class="border-b border-dawn-200 xl:border-b-0 xl:border-r">
        <div class="border-b border-dawn-200 p-5 text-sm font-semibold">Inbox <span class="ml-2 rounded-full bg-dawn-100 px-2 py-1 text-xs">{{ messages.length }}</span></div>
        <div v-if="!messages.length" class="p-6 text-sm text-dawn-500">No messages yet.</div>
        <button v-for="message in messages" :key="message._id" class="block w-full border-b border-dawn-100 p-5 text-left transition hover:bg-dawn-50" :class="selected?._id === message._id ? 'bg-dawn-100' : ''" @click="openMessage(message._id)">
          <div class="flex items-center justify-between gap-3"><strong class="truncate text-sm"><span v-if="!message.isRead" class="mr-2 inline-block h-2 w-2 rounded-full bg-gold-500" />{{ message.name }}</strong><time class="shrink-0 text-[10px] text-dawn-400">{{ formatDate(message.createdAt) }}</time></div>
          <p class="mt-2 truncate text-sm text-dawn-700">{{ message.subject }}</p><p class="mt-1 truncate text-xs text-dawn-400">{{ message.email }}</p>
        </button>
      </aside>

      <section v-if="selected" class="flex min-w-0 flex-col">
        <div class="border-b border-dawn-200 p-6 sm:p-8">
          <div class="flex flex-col justify-between gap-4 sm:flex-row"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-gold-700">{{ selected.emailStatus.replace('_', ' ') }}</p><h2 class="mt-2 font-display text-3xl">{{ selected.subject }}</h2><p class="mt-2 text-sm text-dawn-500">From {{ selected.name }} · {{ selected.email }} <span v-if="selected.phone">· {{ selected.phone }}</span></p></div><time class="text-xs text-dawn-400">{{ formatDate(selected.createdAt) }}</time></div>
          <div class="mt-7 whitespace-pre-wrap bg-dawn-50 p-6 text-sm leading-7 text-dawn-800">{{ selected.body }}</div>
        </div>

        <div v-if="selected.replies?.length" class="grid gap-4 border-b border-dawn-200 bg-dawn-50 p-6 sm:p-8">
          <article v-for="item in selected.replies" :key="item.sentAt" class="ml-auto max-w-2xl border-l-4 border-gold-400 bg-white p-5"><p class="whitespace-pre-wrap text-sm leading-7">{{ item.body }}</p><div class="mt-3 flex items-center gap-4 text-xs text-dawn-400"><span>{{ formatDate(item.sentAt) }}</span><a v-if="item.contractPath" :href="item.contractPath" target="_blank" class="flex items-center gap-1 text-gold-700"><FileText :size="14" /> Contract</a></div></article>
        </div>

        <form class="mt-auto p-6 sm:p-8" @submit.prevent="sendReply">
          <label class="form-label">Reply to {{ selected.name }}<textarea v-model.trim="reply.body" class="form-input resize-none" rows="6" required placeholder="Write your response..." /></label>
          <div class="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <label class="inline-flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-dawn-600"><Paperclip :size="17" /> Attach contract PDF<input type="file" accept="application/pdf" class="sr-only" @change="reply.contract = $event.target.files[0]" /></label>
            <span v-if="reply.contract" class="truncate text-xs text-dawn-500">{{ reply.contract.name }}</span>
            <button class="btn-dark sm:ml-auto" :disabled="sending"><LoaderCircle v-if="sending" :size="17" class="animate-spin" /><Send v-else :size="17" />{{ sending ? 'Sending...' : 'Send reply' }}</button>
          </div>
          <p v-if="notice" class="mt-4 text-sm text-dawn-600">{{ notice }}</p>
        </form>
      </section>
      <section v-else class="grid place-items-center p-10 text-center text-dawn-400"><div><Mail class="mx-auto" :size="36" /><p class="mt-4">Select a message to read it.</p></div></section>
    </div>
  </div>
</template>

