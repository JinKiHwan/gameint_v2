<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

onMounted(() => {
  const authStore = useAuthStore()
  authStore.initAuth()
})
</script>

<template>
  <v-app class="app-font-override bg-grey-lighten-4">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.app-font-override,
.v-application,
.v-application [class*="text-"] {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
}

/* 커스텀 CSS (Prototype) */
.font-weight-black { font-weight: 900 !important; }
.line-height-tight { line-height: 1.2 !important; }
.line-height-relaxed { line-height: 1.6 !important; }

.hover-shadow { transition: box-shadow 0.3s ease; }
.hover-shadow:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important; }

.hover-bg-grey { transition: background-color 0.2s ease; }
.hover-bg-grey:hover { background-color: #f5f5f5 !important; cursor: pointer; }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.bg-white-opacity-10 { background-color: rgba(255, 255, 255, 0.1) !important; }
.backdrop-blur { backdrop-filter: blur(12px); }
.border-md { border-width: 2px !important; border-style: solid !important; }
.border-lg { border-width: 4px !important; border-style: solid !important; }

.fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 가로 스크롤바 숨김 */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
