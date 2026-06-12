<script setup>
import { Clock, Mail, MapPin } from 'lucide-vue-next'
import PageHero from '../components/PageHero.vue'
import ContactForm from '../components/ContactForm.vue'
</script>

<template>
  <PageHero eyebrow="Book MTC Studio" title="Let’s create something lasting" text="Tell us about your date, your people, and the story you want photographed." />
  <section class="contact section-pad bg-white">
    <div class="site-container grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
      <aside v-reveal class="bg-dawn-950 p-8 text-white sm:p-10">
        <p class="eyebrow text-gold-300">Studio details</p>
        <h2 class="mt-4 font-display text-4xl">We would love to hear from you.</h2>
        <p class="mt-5 text-sm leading-7 text-dawn-200">For availability and collection details, send an inquiry with as much information as you have.</p>
        <div class="mt-9 grid gap-6 border-t border-white/10 pt-8 text-sm">
          <a href="mailto:admin@mtcstudio.com" class="flex items-center gap-3"><Mail class="text-gold-300" :size="20" /> admin@mtcstudio.com</a>
          <p class="flex items-center gap-3"><MapPin class="text-gold-300" :size="20" /> Lagos, Nigeria</p>
          <p class="flex items-center gap-3"><Clock class="text-gold-300" :size="20" /> Replies within one business day</p>
        </div>
      </aside>
      <div v-reveal="100" class="border border-dawn-200 p-6 sm:p-10"><ContactForm /></div>
    </div>
  </section>
</template>
