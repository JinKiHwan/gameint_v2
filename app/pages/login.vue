<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'empty'
})

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMsg.value = '아이디와 비밀번호를 모두 입력해주세요.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  
  try {
    await authStore.login(username.value, password.value)
    router.push('/')
  } catch (error) {
    errorMsg.value = error.message || '로그인 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="d-flex align-center justify-center min-vh-100 bg-grey-lighten-4 pa-4 fade-in">
    <v-card class="rounded-xl pa-8 bg-white border" elevation="0" max-width="400" width="100%">
      <div class="mb-8 text-center">
        <h1 class="text-h4 font-weight-black text-blue-darken-1 mb-2">Game Int</h1>
        <p class="text-body-2 font-weight-medium text-grey-darken-1">사내 독서동호회 전용 공간입니다.</p>
      </div>

      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-6 text-caption font-weight-bold text-left rounded-lg" closable @click:close="errorMsg = ''">
        {{ errorMsg }}
      </v-alert>

      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="username"
          label="사내 커스텀 아이디"
          variant="outlined"
          color="blue-darken-1"
          bg-color="grey-lighten-5"
          prepend-inner-icon="mdi-account-outline"
          class="mb-2 font-weight-bold"
          rounded="lg"
          hide-details
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="비밀번호"
          type="password"
          variant="outlined"
          color="blue-darken-1"
          bg-color="grey-lighten-5"
          prepend-inner-icon="mdi-lock-outline"
          class="mb-6 font-weight-bold"
          rounded="lg"
          hide-details
        ></v-text-field>

        <v-btn
          type="submit"
          :loading="loading"
          color="blue-darken-1"
          size="x-large"
          block
          class="font-weight-bold rounded-xl mb-6"
          elevation="0"
        >
          로그인
        </v-btn>
      </v-form>

      <div class="text-center text-caption font-weight-bold text-grey-darken-1">
        아직 계정이 없으신가요? 
        <v-btn href="/signup" variant="text" size="small" color="blue-darken-1" class="font-weight-black pa-0 ml-1" ripple="false">회원가입</v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
</style>
