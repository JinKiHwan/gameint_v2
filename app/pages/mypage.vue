<template>
  <div class="fade-in">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5 font-weight-black text-grey-darken-4">마이페이지 👤</h1>
      <v-btn color="grey-darken-2" variant="text" prepend-icon="mdi-logout" class="font-weight-bold" @click="handleLogout">로그아웃</v-btn>
    </div>

    <!-- 프로필 영역 -->
    <v-card class="rounded-xl pa-6 border bg-white mb-6" elevation="0">
      <div v-if="authStore.userData" class="d-flex flex-column flex-sm-row align-center align-sm-start text-center text-sm-left">
        <v-avatar color="blue-lighten-5" size="100" class="border flex-shrink-0 mb-4 mb-sm-0 mr-sm-6">
          <span class="text-h4 font-weight-black text-blue-darken-1">{{ authStore.userData.nickname?.charAt(0) || 'U' }}</span>
        </v-avatar>
        
        <div class="flex-grow-1 w-100">
          <div class="d-flex flex-column flex-sm-row justify-space-between align-sm-start mb-2">
            <div>
              <div class="d-flex align-center justify-center justify-sm-start mb-1">
                <h2 class="text-h5 font-weight-black text-grey-darken-4 mr-2">{{ authStore.userData.nickname }}</h2>
                <v-chip size="small" color="amber-darken-2" bg-color="amber-lighten-5" variant="flat" class="font-weight-bold border-amber-lighten-4 border">
                  <v-icon start size="x-small">mdi-trophy</v-icon>{{ authStore.userData.tier }}
                </v-chip>
              </div>
              <p class="text-caption font-weight-medium text-grey-darken-1 d-flex align-center justify-center justify-sm-start mt-1">
                <v-icon size="small" class="mr-1">mdi-email-outline</v-icon> {{ authStore.userData.email }}
              </p>
              <p class="text-caption font-weight-medium mt-3 text-grey-darken-2 bg-grey-lighten-4 pa-2 px-3 rounded-lg d-inline-block border">
                🧬 독서 DNA: <strong class="text-grey-darken-4">{{ authStore.userData.dnaTitle }}</strong>
              </p>
            </div>
            
            <div class="mt-4 mt-sm-0 text-center text-sm-right">
              <v-btn color="blue-darken-1" variant="tonal" class="rounded-lg font-weight-bold" prepend-icon="mdi-pencil" size="small">프로필 수정</v-btn>
            </div>
          </div>
          
          <div class="mt-8">
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-2">
              <span class="text-grey-darken-2">다음 등급까지 경험치</span>
              <span class="text-blue-darken-1">{{ authStore.userData.exp }} / 150 EXP</span>
            </div>
            <v-progress-linear :model-value="(authStore.userData.exp / 150) * 100" color="blue-darken-1" height="8" rounded></v-progress-linear>
          </div>
        </div>
      </div>
      <div v-else class="text-center pa-10">
        <v-progress-circular indeterminate color="blue-darken-1"></v-progress-circular>
        <p class="text-caption font-weight-bold text-grey-darken-1 mt-4">프로필 정보를 불러오는 중입니다...</p>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
}
</script>
