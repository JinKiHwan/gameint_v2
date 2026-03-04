<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'empty'
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const errorMsg = ref('')

// 단계 상태 (1: 이메일 입력, 1.5: 링크 클릭 대기, 2: ID 만들기, 3: 세부정보)
const currentStep = ref(1)

// 폼 데이터
const formData = ref({
  emailPrefix: '',
  username: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
  realName: ''
})

const emailDomain = '@gamedex.co.kr'
const fullEmail = computed(() => `${formData.value.emailPrefix}${emailDomain}`)

onMounted(async () => {
  // Check if we are returning from an email link
  if (route.query.apiKey && route.query.oobCode) {
    loading.value = true
    try {
      const user = await authStore.verifyEmailLink(window.location.href)
      if (user) {
         currentStep.value = 2 // Verified! Go to step 2
      }
    } catch (e: any) {
      errorMsg.value = e.message
      currentStep.value = 1
    } finally {
      loading.value = false
    }
  } else if (authStore.user) {
    // If they already have an authenticated user but no Firestore document, they are mid-registration
    if (!authStore.userData) {
       currentStep.value = 2
    } else {
       // Fully registered, kick to home
       router.push('/')
    }
  }
})

// Step 1: 이메일 인증 메일 발송
const handleStep1 = async () => {
  errorMsg.value = ''
  if (!formData.value.emailPrefix.trim()) {
    errorMsg.value = '이메일 앞자리를 입력해주세요.'
    return
  }

  loading.value = true
  try {
    await authStore.sendSignupEmailLink(fullEmail.value)
    currentStep.value = 1.5 // 대기 화면 
  } catch(e: any) {
    console.error(e)
    errorMsg.value = '인증 메일 발송 중 오류가 발생했습니다. (너무 잦은 발송일 수 있습니다)'
  } finally {
    loading.value = false
  }
}

// Step 2: 아이디 중복 검사
const isIdAvailable = ref<boolean | null>(null)
const checkingId = ref(false)

const handleCheckId = async () => {
  errorMsg.value = ''
  if (!formData.value.username.trim() || formData.value.username.length < 4) {
    errorMsg.value = '아이디는 4자 이상 입력해주세요.'
    return
  }

  checkingId.value = true
  try {
    const isDuplicated = await authStore.checkIdDuplicate(formData.value.username)
    if (isDuplicated) {
      errorMsg.value = '이미 사용 중인 아이디입니다.'
      isIdAvailable.value = false
    } else {
      isIdAvailable.value = true
    }
  } catch (error) {
    errorMsg.value = '중복 검사 중 오류가 발생했습니다.'
  } finally {
    checkingId.value = false
  }
}

const handleStep2 = () => {
  errorMsg.value = ''
  if (!isIdAvailable.value) {
    errorMsg.value = '아이디 중복 확인을 통과해야 합니다.'
    return
  }
  currentStep.value = 3
}

// Step 3: 최종 가입 처리 (Firestore 문서 저장 및 패스워드 설정)
const handleSignup = async () => {
  errorMsg.value = ''
  
  if (formData.value.password.length < 6) {
    errorMsg.value = '비밀번호는 6자리 이상이어야 합니다.'
    return
  }
  
  if (formData.value.password !== formData.value.passwordConfirm) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  
  if (!formData.value.nickname.trim() || !formData.value.realName.trim()) {
    errorMsg.value = '닉네임과 실명을 모두 입력해주세요.'
    return
  }

  loading.value = true
  try {
    const payload = {
      username: formData.value.username,
      password: formData.value.password,
      nickname: formData.value.nickname,
      realName: formData.value.realName
    }
    
    await authStore.signup(payload)
    router.push('/')
  } catch (error: any) {
    errorMsg.value = error.message || '회원가입 처리 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="d-flex align-center justify-center min-vh-100 bg-grey-lighten-4 pa-4 fade-in">
    <v-card class="rounded-xl pa-8 bg-white border" elevation="0" max-width="400" width="100%">
      
      <!-- 뒤로가기 버튼 -->
      <v-btn icon="mdi-arrow-left" variant="text" size="small" color="grey-darken-1" class="mb-4" to="/login" v-if="currentStep === 1"></v-btn>
      <v-btn icon="mdi-arrow-left" variant="text" size="small" color="grey-darken-1" class="mb-4" @click="currentStep = 1" v-if="currentStep === 1.5"></v-btn>

      <div class="mb-6">
        <h1 class="text-h5 font-weight-black text-grey-darken-4 mb-2">회원가입</h1>
        <p class="text-caption font-weight-bold text-blue-darken-1" v-if="currentStep === 1 || currentStep === 1.5">
          Step 1 / 3
        </p>
        <p class="text-caption font-weight-bold text-blue-darken-1" v-if="currentStep === 2">
          Step 2 / 3
        </p>
        <p class="text-caption font-weight-bold text-blue-darken-1" v-if="currentStep === 3">
          Step 3 / 3
        </p>
      </div>

      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-6 text-caption font-weight-bold text-left rounded-lg" closable @click:close="errorMsg = ''">
        {{ errorMsg }}
      </v-alert>

      <!-- Step 1: 사내 이메일 등록 -->
      <template v-if="currentStep === 1">
        <p class="text-subtitle-2 font-weight-bold mb-4 text-grey-darken-3">사내 이메일 주소를 입력해주세요.</p>
        <v-text-field
          v-model="formData.emailPrefix"
          :suffix="emailDomain"
          label="이메일 아이디"
          variant="outlined"
          color="blue-darken-1"
          class="mb-6 font-weight-bold bg-grey-lighten-5 rounded-lg"
          hide-details
          autofocus
          @keyup.enter="handleStep1"
        ></v-text-field>
        <v-btn :loading="loading" color="grey-darken-4" size="x-large" block class="font-weight-bold rounded-xl font-weight-black" elevation="0" @click="handleStep1">
          인증 메일 받기
        </v-btn>
      </template>

      <!-- Step 1.5: 메일 확인 대기 -->
      <template v-if="currentStep === 1.5">
        <div class="text-center py-6">
          <v-icon color="blue-lighten-1" size="64" class="mb-4">mdi-email-fast-outline</v-icon>
          <p class="text-subtitle-2 font-weight-black mb-2 text-grey-darken-4">{{ fullEmail }}</p>
          <p class="text-caption font-weight-medium text-grey-darken-1 line-height-relaxed">
            해당 이메일로 가입 인증 링크를 발송했습니다.<br/>메일함에서 인증 버튼을 클릭하시면 다음 단계로 진행됩니다.
          </p>
        </div>
      </template>

      <!-- Step 2: 커스텀 ID 생성 -->
      <template v-if="currentStep === 2">
        <p class="text-subtitle-2 font-weight-bold mb-4 text-grey-darken-3">인증이 완료되었습니다 🎉<br/>로그인에 사용할 아이디를 만들어주세요.</p>
        
        <v-text-field
          v-model="formData.username"
          label="사내 커스텀 아이디 (4자 이상)"
          variant="outlined"
          color="blue-darken-1"
          class="font-weight-bold bg-grey-lighten-5 rounded-lg"
          hide-details
          @update:model-value="isIdAvailable = null"
        >
          <template v-slot:append-inner>
            <v-btn 
              variant="tonal" 
              color="blue-darken-1" 
              size="small" 
              class="font-weight-bold ml-2"
              :loading="checkingId"
              @click="handleCheckId"
            >
              중복확인
            </v-btn>
          </template>
        </v-text-field>
        
        <div class="mb-6 mt-2 px-1" style="min-height: 20px;">
          <p v-if="isIdAvailable === true" class="text-caption font-weight-bold text-blue-darken-1">
            사용 가능한 아이디입니다!
          </p>
        </div>

        <v-btn 
           color="grey-darken-4" 
           size="x-large" 
           block 
           class="font-weight-bold rounded-xl font-weight-black" 
           elevation="0" 
           @click="handleStep2"
           :disabled="!isIdAvailable"
        >
          다음 단계로
        </v-btn>
      </template>

      <!-- Step 3: 세부정보 입력 및 가입 완료 -->
      <template v-if="currentStep === 3">
        <p class="text-subtitle-2 font-weight-bold mb-4 text-grey-darken-3">마지막으로 회원 정보를 입력해주세요.</p>
        
        <v-text-field
          v-model="formData.password"
          label="비밀번호 (6자 이상)"
          type="password"
          variant="outlined"
          color="blue-darken-1"
          class="mb-2 font-weight-bold bg-grey-lighten-5 rounded-lg"
          hide-details
        ></v-text-field>

        <v-text-field
          v-model="formData.passwordConfirm"
          label="비밀번호 확인"
          type="password"
          variant="outlined"
          color="blue-darken-1"
          class="mb-6 font-weight-bold bg-grey-lighten-5 rounded-lg"
          hide-details
        ></v-text-field>

        <v-text-field
          v-model="formData.realName"
          label="본명 (실명 확인용)"
          variant="outlined"
          color="blue-darken-1"
          class="mb-2 font-weight-bold bg-grey-lighten-5 rounded-lg"
          hide-details
        ></v-text-field>

        <v-text-field
          v-model="formData.nickname"
          label="활동 닉네임"
          variant="outlined"
          color="blue-darken-1"
          class="mb-6 font-weight-bold bg-grey-lighten-5 rounded-lg"
          hide-details
        ></v-text-field>

        <v-btn 
          color="blue-darken-1" 
          size="x-large" 
          block 
          class="font-weight-bold rounded-xl font-weight-black" 
          elevation="0" 
          :loading="loading"
          @click="handleSignup"
        >
          가입 완료하기
        </v-btn>
      </template>

    </v-card>
  </div>
</template>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
</style>
