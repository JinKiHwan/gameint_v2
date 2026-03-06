<template>
  <div class="auth-page fade-in">
    <div class="card auth-card">
      <div class="mb-8 text-center">
        <h1 class="text-h4 font-black text-blue-dark mb-2">Game Int</h1>
        <p class="text-body-2 font-medium text-grey-2">사내 독서동호회 전용 공간입니다.</p>
      </div>

      <div v-if="errorMsg" class="alert alert--error mb-6">
        <i class="mdi mdi-alert-circle-outline"></i>
        <span>{{ errorMsg }}</span>
        <button class="alert__close" @click="errorMsg = ''"><i class="mdi mdi-close"></i></button>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="field mb-3">
          <div class="input-with-suffix">
            <i class="mdi mdi-account-outline" style="padding: 0 8px 0 16px; color: #757575;"></i>
            <input v-model="username" type="text" placeholder="로그인 아이디" />
          </div>
        </div>

        <div class="field mb-6">
          <div class="input-with-suffix">
            <i class="mdi mdi-lock-outline" style="padding: 0 8px 0 16px; color: #757575;"></i>
            <input v-model="password" type="password" placeholder="비밀번호" />
          </div>
        </div>

        <button
          type="submit"
          class="btn btn--primary btn--xl btn--block font-black mb-6 rounded-xl"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
        >
          로그인
        </button>
      </form>

      <div class="text-center text-caption font-bold text-grey-2 mb-2">
        아직 계정이 없으신가요?
        <a href="/signup" class="text-primary font-black ml-1">회원가입</a>
      </div>

      <div class="text-center">
        <button class="btn btn--text" style="font-size: 0.8rem;" @click="openFindModal('id')">아이디 찾기</button>
        <span class="text-grey-1" style="margin: 0 4px;">|</span>
        <button class="btn btn--text" style="font-size: 0.8rem;" @click="openFindModal('pw')">비밀번호 찾기</button>
      </div>
    </div>

    <!-- 아이디/비밀번호 찾기 모달 -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="findModal" class="modal-overlay" @click.self="findModal = false">
          <div class="modal">
            <div class="modal__header">
              <span class="modal__title">{{ findType === 'id' ? '아이디 찾기' : '비밀번호 재설정' }}</span>
              <button class="btn btn--text btn--icon" @click="findModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal__body">
              <p class="text-caption font-medium text-grey-2 mb-4">
                가입 시 등록한 <strong>본명</strong>과 <strong>사내 이메일(@gamedex.co.kr)</strong>을 입력해주세요.
                <template v-if="findType === 'pw'">
                  <br/>안전한 비밀번호 재설정을 위해 <strong>아이디</strong>도 함께 입력해주세요.
                </template>
              </p>

              <div v-if="findErrorMsg" class="alert alert--error mb-4">
                <i class="mdi mdi-alert-circle-outline"></i>
                <span>{{ findErrorMsg }}</span>
                <button class="alert__close" @click="findErrorMsg = ''"><i class="mdi mdi-close"></i></button>
              </div>
              <div v-if="findSuccessMsg" class="alert alert--success mb-4">
                <i class="mdi mdi-check-circle-outline"></i>
                <span>{{ findSuccessMsg }}</span>
              </div>

              <div v-if="findType === 'pw'" class="field mb-3">
                <input v-model="findPwId" class="input" type="text" placeholder="로그인 아이디" @keyup.enter="handleFind" />
              </div>

              <div class="field mb-3">
                <select v-model="findSecurityQuestion" class="select">
                  <option value="" disabled>본인 확인 질문 선택</option>
                  <option v-for="q in securityQuestions" :key="q" :value="q">{{ q }}</option>
                </select>
              </div>

              <div class="field mb-3">
                <input v-model="findSecurityAnswer" class="input" type="text" placeholder="질문에 대한 답변" @keyup.enter="handleFind" />
              </div>

              <div class="field mb-3">
                <div class="input-with-suffix">
                  <input v-model="findEmailPrefix" type="text" placeholder="이메일 주소" @keyup.enter="handleFind" />
                  <span class="suffix">{{ emailDomain }}</span>
                </div>
              </div>

              <div v-if="findType === 'pw'" class="text-caption text-red font-bold mt-2 px-1">
                * 발송된 메일이 보이지 않는다면 스팸/정크 메일함을 꼭 확인해 주세요!
              </div>
            </div>

            <div class="modal__footer">
              <button
                class="btn btn--dark btn--lg btn--block font-black rounded-lg"
                :class="{ 'is-loading': findLoading }"
                :disabled="findLoading"
                @click="handleFind"
              >
                {{ findType === 'id' ? '내 아이디 확인하기' : '재설정 링크 받기' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'empty' })

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

const findModal = ref(false)
const findType = ref('id')
const findEmailPrefix = ref('')
const findPwId = ref('')
const findSecurityQuestion = ref('')
const findSecurityAnswer = ref('')
const emailDomain = '@gamedex.co.kr'
const securityQuestions = [
  '가장 기억에 남는 추억의 장소는?', '자신이 가장 존경하는 인물은?', '가장 좋아하는 색깔은?',
  '어릴 적 장래희망은?', '가장 좋아하는 음식은?', '나의 가장 큰 보물 1호는?'
]
const fullFindEmail = computed(() => `${findEmailPrefix.value}${emailDomain}`)
const findLoading = ref(false)
const findErrorMsg = ref('')
const findSuccessMsg = ref('')

const openFindModal = (type) => {
  findType.value = type
  findEmailPrefix.value = ''
  findPwId.value = ''
  findSecurityQuestion.value = ''
  findSecurityAnswer.value = ''
  findErrorMsg.value = ''
  findSuccessMsg.value = ''
  findModal.value = true
}

const handleFind = async () => {
  if (findType.value === 'pw' && !findPwId.value.trim()) {
    findErrorMsg.value = '아이디를 입력해주세요.'
    return
  }
  if (!findSecurityQuestion.value || !findSecurityAnswer.value.trim()) {
    findErrorMsg.value = '확인 질문과 답변을 모두 입력해주세요.'
    return
  }
  if (!findEmailPrefix.value.trim()) {
    findErrorMsg.value = '이메일 앞자리를 입력해주세요.'
    return
  }
  findLoading.value = true
  findErrorMsg.value = ''
  findSuccessMsg.value = ''
  try {
    if (findType.value === 'id') {
      const foundUsername = await authStore.findIdByEmail(findSecurityQuestion.value, findSecurityAnswer.value.trim(), fullFindEmail.value)
      findSuccessMsg.value = `회원님의 아이디는 [ ${foundUsername} ] 입니다.`
    } else {
      await authStore.sendPasswordReset(findPwId.value.trim(), findSecurityQuestion.value, findSecurityAnswer.value.trim(), fullFindEmail.value)
      findSuccessMsg.value = '비밀번호 재설정 메일이 발송되었습니다. 스팸함을 확인해주세요!'
    }
  } catch (error) {
    findErrorMsg.value = error.message || '처리 중 오류가 발생했습니다.'
  } finally {
    findLoading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #F5F5F5;
  padding: 16px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 32px;
}

.input-with-suffix {
  display: flex;
  align-items: center;
  border: 1.5px solid #E0E0E0;
  border-radius: 8px;
  background: #FAFAFA;
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #1E88E5;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.12);
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 14px 16px;
    font-size: 0.9375rem;
    font-weight: 600;
    outline: none;
    color: #212121;
    &::placeholder { color: #BDBDBD; font-weight: 500; }
  }
}

.ml-1 { margin-left: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-8 { margin-bottom: 32px; }
.mt-2 { margin-top: 8px; }
.px-1 { padding-left: 4px; padding-right: 4px; }
</style>
