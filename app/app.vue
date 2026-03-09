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
    <Aurora />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
