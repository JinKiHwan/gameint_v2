<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

onMounted(() => {
  const authStore = useAuthStore()
  authStore.initAuth()
})
</script>

<template>
  <div id="app">
    <Aurora :colorStops="['#001F3F', '#0074D9', '#7FDBFF']" :speed="0.5" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
