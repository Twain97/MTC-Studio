<script setup>
defineProps({ eyebrow: String, title: String, text: String })
</script>

<template>
  <section class="page-hero">
    <div class="site-container relative z-10 py-24 text-center md:py-32">
      <p class="eyebrow text-gold-300">{{ eyebrow }}</p>
      <h1 class="mt-4 font-display text-5xl font-semibold text-white md:text-7xl">{{ title }}</h1>
      <p v-if="text" class="mx-auto mt-5 max-w-2xl text-base leading-8 text-dawn-100">{{ text }}</p>
    </div>
  </section>
</template>

