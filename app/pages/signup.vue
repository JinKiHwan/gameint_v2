<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'empty' })

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const errorMsg = ref('')
const currentStep = ref(1)

const formData = ref({
  emailPrefix: '', username: '', password: '', passwordConfirm: '',
  nickname: '', realName: '', securityQuestion: '', securityAnswer: ''
})

const securityQuestions = [
  '가장 기억에 남는 추억의 장소는?', '자신이 가장 존경하는 인물은?', '가장 좋아하는 색깔은?',
  '어릴 적 장래희망은?', '가장 좋아하는 음식은?', '나의 가장 큰 보물 1호는?'
]

const emailDomain = '@gamedex.co.kr'
const fullEmail = computed(() => `${formData.value.emailPrefix}${emailDomain}`)
const isIdAvailable = ref<boolean | null>(null)
const checkingId = ref(false)

const handleCheckId = async () => {
  errorMsg.value = ''
  if (!formData.value.username.trim() || formData.value.username.length < 4) {
    errorMsg.value = '아이디는 4자 이상 입력해주세요.'; return
  }
  checkingId.value = true
  try {
    const isDuplicated = await authStore.checkIdDuplicate(formData.value.username)
    if (isDuplicated) { errorMsg.value = '이미 사용 중인 아이디입니다.'; isIdAvailable.value = false }
    else { isIdAvailable.value = true }
  } catch (error) {
    errorMsg.value = '중복 검사 중 오류가 발생했습니다.'
  } finally { checkingId.value = false }
}

const handleStep1 = () => {
  errorMsg.value = ''
  if (!formData.value.emailPrefix.trim()) { errorMsg.value = '이메일 앞자리를 입력해주세요.'; return }
  if (!isIdAvailable.value) { errorMsg.value = '아이디 중복 확인을 통과해야 합니다.'; return }
  currentStep.value = 2
}

const handleSignup = async () => {
  errorMsg.value = ''
  if (formData.value.password.length < 6) { errorMsg.value = '비밀번호는 6자리 이상이어야 합니다.'; return }
  if (formData.value.password !== formData.value.passwordConfirm) { errorMsg.value = '비밀번호가 일치하지 않습니다.'; return }
  if (!formData.value.password || !formData.value.passwordConfirm || !formData.value.realName || !formData.value.nickname || !formData.value.securityQuestion || !formData.value.securityAnswer) {
    errorMsg.value = '모든 필드를 입력해주세요.'; return
  }
  loading.value = true
  try {
    const payload = {
      username: formData.value.username, email: fullEmail.value, password: formData.value.password,
      nickname: formData.value.nickname, realName: formData.value.realName,
      securityQuestion: formData.value.securityQuestion, securityAnswer: formData.value.securityAnswer
    }
    await authStore.signup(payload)
    router.push('/')
  } catch (error: any) {
    errorMsg.value = error.message || '회원가입 처리 중 오류가 발생했습니다.'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page fade-in">
    <div class="card auth-card">

      <!-- 뒤로가기 -->
      <div class="mb-4">
        <NuxtLink v-if="currentStep === 1" to="/login" class="btn btn--text btn--icon"><i class="mdi mdi-arrow-left"></i></NuxtLink>
        <button v-if="currentStep === 2" class="btn btn--text btn--icon" @click="currentStep = 1"><i class="mdi mdi-arrow-left"></i></button>
      </div>

      <div class="mb-6">
        <h1 class="text-h5 font-black text-grey-dark mb-2">회원가입</h1>
        <p class="text-caption font-bold text-blue-dark">Step {{ currentStep }} / 2</p>
      </div>

      <div v-if="errorMsg" class="alert alert--error mb-6">
        <i class="mdi mdi-alert-circle-outline"></i>
        <span>{{ errorMsg }}</span>
        <button class="alert__close" @click="errorMsg = ''"><i class="mdi mdi-close"></i></button>
      </div>

      <!-- Step 1 -->
      <template v-if="currentStep === 1">
        <p class="text-subtitle-2 font-bold mb-4 text-grey-3">로그인에 사용할 정보를 입력해주세요.</p>

        <div class="field mb-4">
          <div class="input-with-suffix">
            <input v-model="formData.emailPrefix" type="text" placeholder="사내 이메일" autofocus />
            <span class="suffix">{{ emailDomain }}</span>
          </div>
        </div>

        <div class="field mb-2">
          <div class="input-with-suffix">
            <input
              v-model="formData.username"
              type="text"
              placeholder="사내 커스텀 아이디 (4자 이상)"
              @update:modelValue="isIdAvailable = null"
            />
            <button
              class="btn btn--tonal-primary btn--sm append-btn"
              :class="{ 'is-loading': checkingId }"
              :disabled="checkingId"
              @click="handleCheckId"
            >
              중복확인
            </button>
          </div>
        </div>

        <div class="mb-6" style="min-height: 20px; padding: 0 4px;">
          <p v-if="isIdAvailable === true" class="text-caption font-bold text-blue-dark">사용 가능한 아이디입니다!</p>
        </div>

        <button
          class="btn btn--dark btn--xl btn--block font-black rounded-xl"
          :disabled="!isIdAvailable || !formData.emailPrefix"
          @click="handleStep1"
        >다음 단계로</button>
      </template>

      <!-- Step 2 -->
      <template v-if="currentStep === 2">
        <p class="text-subtitle-2 font-bold mb-4 text-grey-3">마지막으로 회원 정보를 입력해주세요.</p>

        <input v-model="formData.password"        class="input mb-2" type="password" placeholder="비밀번호 (6자 이상)" />
        <input v-model="formData.passwordConfirm" class="input mb-6" type="password" placeholder="비밀번호 확인" />
        <input v-model="formData.realName"        class="input mb-2" type="text" placeholder="본명 (실명 확인용)" />
        <input v-model="formData.nickname"        class="input mb-6" type="text" placeholder="활동 닉네임" />

        <p class="text-subtitle-2 font-bold mb-4 text-grey-3">계정 찾기 질문/답변 (비밀번호 분실 시 필요)</p>

        <select v-model="formData.securityQuestion" class="select mb-2">
          <option value="" disabled>본인 확인 질문 선택</option>
          <option v-for="q in securityQuestions" :key="q" :value="q">{{ q }}</option>
        </select>

        <input
          v-model="formData.securityAnswer" class="input mb-6" type="text"
          placeholder="질문에 대한 답변" @keyup.enter="handleSignup"
        />

        <button
          class="btn btn--primary btn--xl btn--block font-black rounded-xl"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
          @click="handleSignup"
        >가입 완료하기</button>
      </template>

    </div>
  </div>
</template>

<style scoped>
.auth-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F5F5F5; padding: 16px; }
.auth-card { width: 100%; max-width: 400px; padding: 32px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-3 { margin-bottom: 12px; }

.input-with-suffix {
  display: flex; align-items: center;
  border: 1.5px solid #E0E0E0; border-radius: 8px; background: #FAFAFA; overflow: hidden; transition: border-color 0.2s;
  &:focus-within { border-color: #1E88E5; background: #fff; box-shadow: 0 0 0 3px rgba(30,136,229,0.12); }
  input { flex:1; border:none; background:transparent; padding:14px 16px; font-size:0.9375rem; font-weight:600; outline:none; color:#212121; &::placeholder{ color:#BDBDBD; font-weight:500; } }
  .suffix { padding:14px 16px 14px 0; font-size:0.875rem; color:#757575; font-weight:600; white-space:nowrap; }
  .append-btn { margin: 0 8px 0 0; }
}
</style>
