<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LoaderCircle, LockKeyhole } from 'lucide-vue-next'
import LogoMark from '../../components/LogoMark.vue'
import api from '../../services/api.js'
import { saveSession } from '../../services/auth.js'

const router = useRouter()
const route = useRoute()
const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function login() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.post('/auth/login', form)
    saveSession(data.token, data.admin)
    router.push(route.query.redirect || '/admin/dashboard')
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="grid min-h-screen bg-dawn-950 lg:grid-cols-2">
    <section class="relative hidden overflow-hidden lg:block">
      <img src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1400&q=85" alt="Professional camera" class="absolute inset-0 h-full w-full object-cover opacity-65" />
      <div class="absolute inset-0 bg-gradient-to-t from-dawn-950 via-transparent to-dawn-950/20" />
      <div class="absolute bottom-14 left-14 max-w-lg text-white"><p class="eyebrow text-gold-300">MTC Studio</p><h1 class="mt-5 font-display text-6xl">Manage the stories behind the work.</h1></div>
    </section>
    <section class="flex items-center justify-center px-6 py-14">
      <div class="w-full max-w-md bg-white p-7 shadow-2xl sm:p-10">
        <LogoMark />
        <div class="mt-9 flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-full bg-dawn-100 text-dawn-800"><LockKeyhole :size="20" /></span><div><h2 class="font-display text-3xl">Admin login</h2><p class="text-sm text-dawn-500">Authorized access only</p></div></div>
        <form class="mt-8 grid gap-5" @submit.prevent="login">
          <label class="form-label">Admin email<input v-model.trim="form.email" type="email" class="form-input" required autocomplete="email" /></label>
          <label class="form-label">Password<input v-model="form.password" type="password" class="form-input" required autocomplete="current-password" /></label>
          <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
          <button class="btn-dark w-full justify-center" :disabled="loading"><LoaderCircle v-if="loading" :size="18" class="animate-spin" />{{ loading ? 'Signing in...' : 'Sign in' }}</button>
        </form>
        <RouterLink to="/" class="mt-7 block text-center text-xs font-bold uppercase tracking-[.14em] text-dawn-500">Return to website</RouterLink>
      </div>
    </section>
  </main>
</template>

