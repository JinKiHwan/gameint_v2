<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'empty'
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const oobCode = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(() => {
  // 메일 링크에서 ?oobCode=xxxx... 파라미터 추출
  if (route.query.oobCode) {
    oobCode.value = route.query.oobCode
  } else {
    // 코드가 없으면 잘못된 접근이므로 로그인 페이지로 돌려보냄
    errorMsg.value = '유효하지 않은 접근입니다. 메일에 있는 링크를 다시 클릭해주세요.'
  }
})

const handleResetPassword = async () => {
  if (!oobCode.value) {
    errorMsg.value = '비밀번호 재설정 코드가 없습니다. 메일 링크를 다시 확인해주세요.'
    return
  }
  
  if (!newPassword.value || !newPasswordConfirm.value) {
    errorMsg.value = '비밀번호를 모두 입력해주세요.'
    return
  }
  
  if (newPassword.value !== newPasswordConfirm.value) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  
  if (newPassword.value.length < 6) {
    errorMsg.value = '비밀번호는 최소 6자리 이상이어야 합니다.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    await authStore.confirmResetPassword(oobCode.value, newPassword.value)
    successMsg.value = '비밀번호가 성공적으로 변경되었습니다.'
  } catch (error) {
    errorMsg.value = error.message || '비밀번호 변경 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="d-flex align-center justify-center min-vh-100 bg-grey-lighten-4 pa-4 fade-in">
    <v-card class="rounded-xl pa-8 bg-white border" elevation="0" max-width="400" width="100%">
      <div class="mb-8 text-center">
        <v-icon color="blue-darken-1" size="48" class="mb-3">mdi-lock-reset</v-icon>
        <h1 class="text-h5 font-weight-black text-grey-darken-4 mb-2">새 비밀번호 설정</h1>
        <p class="text-body-2 font-weight-medium text-grey-darken-1">새롭게 사용할 비밀번호를 입력해주세요.</p>
      </div>

      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-6 text-caption font-weight-bold text-left rounded-lg" closable @click:close="errorMsg = ''">
        {{ errorMsg }}
      </v-alert>

      <v-alert v-if="successMsg" type="success" variant="tonal" class="mb-6 text-caption font-weight-bold text-left rounded-lg">
        {{ successMsg }}
      </v-alert>

      <v-form @submit.prevent="handleResetPassword" v-if="oobCode && !successMsg">
        <v-text-field
          v-model="newPassword"
          label="새 비밀번호"
          type="password"
          variant="outlined"
          color="blue-darken-1"
          bg-color="grey-lighten-5"
          prepend-inner-icon="mdi-lock-outline"
          class="mb-2 font-weight-bold"
          rounded="lg"
          hide-details
        ></v-text-field>

        <v-text-field
          v-model="newPasswordConfirm"
          label="새 비밀번호 확인"
          type="password"
          variant="outlined"
          color="blue-darken-1"
          bg-color="grey-lighten-5"
          prepend-inner-icon="mdi-lock-check-outline"
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
          class="font-weight-bold rounded-xl mb-2"
          elevation="0"
        >
          비밀번호 변경하기
        </v-btn>
      </v-form>

      <div v-if="successMsg" class="mt-4">
        <v-btn
          to="/login"
          color="blue-darken-1"
          size="x-large"
          block
          class="font-weight-bold rounded-xl mb-2"
          elevation="0"
        >
          <v-icon start>mdi-login</v-icon> 로그인 하러 가기
        </v-btn>
      </div>

      <div class="text-center mt-6">
        <v-btn to="/login" variant="text" size="small" color="grey-darken-1" class="font-weight-bold px-2">
          <v-icon start size="small">mdi-arrow-left</v-icon> 로그인으로 돌아가기
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
</style>
