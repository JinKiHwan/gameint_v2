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
    <div class="gradient-bg">
    </div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UserProfileModal />
  </div>
</template>
