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

      <div class="text-center text-caption font-weight-bold text-grey-darken-1 mb-2">
        아직 계정이 없으신가요? 
        <v-btn href="/signup" variant="text" size="small" color="blue-darken-1" class="font-weight-black pa-0 ml-1" ripple="false">회원가입</v-btn>
      </div>
      
      <div class="text-center">
        <v-btn variant="text" size="small" color="grey-darken-1" class="font-weight-bold px-2" @click="openFindModal('id')">아이디 찾기</v-btn>
        <span class="text-grey-lighten-1">|</span>
        <v-btn variant="text" size="small" color="grey-darken-1" class="font-weight-bold px-2" @click="openFindModal('pw')">비밀번호 찾기</v-btn>
      </div>
    </v-card>

    <!-- 아이디/비밀번호 찾기 모달 -->
    <v-dialog v-model="findModal" max-width="400">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="d-flex justify-space-between align-center pt-4 px-4 pb-2">
          <span class="text-h6 font-weight-black text-grey-darken-4">
            {{ findType === 'id' ? '아이디 찾기' : '비밀번호 재설정' }}
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="findModal = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="px-4 pb-4">
          <p class="text-caption font-weight-medium text-grey-darken-2 mb-4">
            가입 시 등록한 <strong>본명</strong>과 <strong>사내 이메일(@gamedex.co.kr)</strong>을 입력해주세요.
            <template v-if="findType === 'pw'">
              <br/>안전한 비밀번호 재설정을 위해 <strong>아이디</strong>도 함께 입력해주세요.
            </template>
          </p>

          <v-alert v-if="findErrorMsg" type="error" variant="tonal" class="mb-4 text-caption font-weight-bold rounded-lg" closable @click:close="findErrorMsg = ''">
            {{ findErrorMsg }}
          </v-alert>
          <v-alert v-if="findSuccessMsg" type="success" variant="tonal" class="mb-4 text-caption font-weight-bold rounded-lg" closable @click:close="findSuccessMsg = ''">
            {{ findSuccessMsg }}
          </v-alert>

          <v-text-field
            v-if="findType === 'pw'"
            v-model="findPwId"
            label="사내 커스텀 아이디"
            variant="outlined"
            color="blue-darken-1"
            bg-color="grey-lighten-5"
            class="mb-3 font-weight-bold"
            rounded="lg"
            hide-details
            @keyup.enter="handleFind"
          ></v-text-field>

          <v-text-field
            v-model="findRealName"
            label="본명 (실명)"
            variant="outlined"
            color="blue-darken-1"
            bg-color="grey-lighten-5"
            class="mb-3 font-weight-bold"
            rounded="lg"
            hide-details
            @keyup.enter="handleFind"
          ></v-text-field>

          <v-text-field
            v-model="findEmailPrefix"
            :suffix="emailDomain"
            label="이메일 주소"
            variant="outlined"
            color="blue-darken-1"
            bg-color="grey-lighten-5"
            class="mb-2 font-weight-bold"
            rounded="lg"
            hide-details
            @keyup.enter="handleFind"
          ></v-text-field>
          
          <div v-if="findType === 'pw'" class="text-caption text-error font-weight-bold mt-2 mb-2 px-1">
            * 발송된 메일이 보이지 않는다면 스팸/정크 메일함을 꼭 확인해 주세요!
          </div>
        </v-card-text>
        
        <v-card-actions class="px-4 pb-4 pt-0">
          <v-btn
            :loading="findLoading"
            color="grey-darken-4"
            variant="flat"
            block
            size="large"
            class="font-weight-bold rounded-lg"
            @click="handleFind"
          >
            {{ findType === 'id' ? '내 아이디 확인하기' : '재설정 링크 받기' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'empty'
})

const authStore = useAuthStore()
const router = useRouter()

// 로그인 상태
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

// 아이디/비밀번호 찾기 상태
const findModal = ref(false)
const findType = ref('id') // 'id' or 'pw'
const findEmailPrefix = ref('')
const findPwId = ref('') // 비밀번호 찾기 시 교차검증용 아이디
const findRealName = ref('') // 실명 교차검증용
const emailDomain = '@gamedex.co.kr'
const fullFindEmail = computed(() => `${findEmailPrefix.value}${emailDomain}`)
const findLoading = ref(false)
const findErrorMsg = ref('')
const findSuccessMsg = ref('')

const openFindModal = (type) => {
  findType.value = type
  findEmailPrefix.value = ''
  findPwId.value = ''
  findRealName.value = ''
  findErrorMsg.value = ''
  findSuccessMsg.value = ''
  findModal.value = true
}

const handleFind = async () => {
  if (findType.value === 'pw' && !findPwId.value.trim()) {
    findErrorMsg.value = '아이디를 입력해주세요.'
    findSuccessMsg.value = ''
    return
  }
  
  if (!findRealName.value.trim()) {
    findErrorMsg.value = '본명(실명)을 입력해주세요.'
    findSuccessMsg.value = ''
    return
  }
  
  if (!findEmailPrefix.value.trim()) {
    findErrorMsg.value = '이메일 앞자리를 입력해주세요.'
    findSuccessMsg.value = ''
    return
  }

  findLoading.value = true
  findErrorMsg.value = ''
  findSuccessMsg.value = ''

  try {
    if (findType.value === 'id') {
      const foundUsername = await authStore.findIdByEmail(findRealName.value.trim(), fullFindEmail.value)
      findSuccessMsg.value = `회원님의 아이디는 [ ${foundUsername} ] 입니다.`
    } else {
      await authStore.sendPasswordReset(findPwId.value.trim(), findRealName.value.trim(), fullFindEmail.value)
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
.min-vh-100 {
  min-height: 100vh;
}
</style>
