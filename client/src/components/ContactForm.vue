<script setup>
import { reactive, ref } from 'vue'
import { LoaderCircle, Send } from 'lucide-vue-next'
import api from '../services/api.js'

const form = reactive({ name: '', email: '', phone: '', subject: '', message: '' })
const loading = ref(false)
const notice = ref({ type: '', text: '' })

async function submit() {
  loading.value = true
  notice.value = { type: '', text: '' }
  try {
    const { data } = await api.post('/messages', form)
    notice.value = { type: 'success', text: data.message }
    Object.keys(form).forEach((key) => (form[key] = ''))
  } catch (error) {
    notice.value = { type: 'error', text: error.response?.data?.message || 'Your message could not be sent.' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="grid gap-5" @submit.prevent="submit">
    <div class="grid gap-5 sm:grid-cols-2">
      <label class="form-label">Your name<input v-model.trim="form.name" class="rounded-lg form-input" required /></label>
      <label class="form-label">Email address<input v-model.trim="form.email" type="email" class="rounded-lg form-input" required /></label>
    </div>
    <div class="grid gap-5 sm:grid-cols-2">
      <label class="form-label">Phone number<input v-model.trim="form.phone" type="tel" class="rounded-lg form-input" /></label>
      <label class="form-label">Subject<input v-model.trim="form.subject" class="rounded-lg form-input" required /></label>
    </div>
    <label class="form-label">Tell us about your event<textarea v-model.trim="form.message" rows="6" class="rounded-lg form-input resize-none" required /></label>
    <p v-if="notice.text" :class="notice.type === 'success' ? 'text-emerald-700' : 'text-red-700'" class="text-sm">{{ notice.text }}</p>
    <button class="btn-gold rounded-lg w-fit" :disabled="loading">
      <LoaderCircle v-if="loading" :size="18" class="animate-spin" />
      <Send v-else :size="18" />
      {{ loading ? 'Sending...' : 'Send inquiry' }}
    </button>
  </form>
</template>
