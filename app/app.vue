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
    <Aurora 
      :colorStops="['#e8e8e8', '#512eff', '#008cff']" 
      :amplitude="1.0"
      :blend="0.8"
      :speed="1.0"
      :intensity="1.2"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
