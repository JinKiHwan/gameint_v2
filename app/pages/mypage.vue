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
          <v-img v-if="currentAvatarSrc" :src="currentAvatarSrc" alt="Profile Image"></v-img>
          <span v-else class="text-h4 font-weight-black text-blue-darken-1">{{ authStore.userData.nickname?.charAt(0) || 'U' }}</span>
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
            
            <div class="mt-4 mt-sm-0 text-center text-sm-right d-flex flex-sm-column flex-row justify-center align-center align-sm-end gap-2">
              <v-btn color="blue-darken-1" variant="tonal" class="rounded-lg font-weight-bold ma-1 ma-sm-0 mb-sm-2" prepend-icon="mdi-pencil" size="small" @click="openProfileModal">프로필 수정</v-btn>
              <v-btn color="grey-darken-2" variant="tonal" class="rounded-lg font-weight-bold ma-1 ma-sm-0" prepend-icon="mdi-lock-reset" size="small" @click="changePwModal = true">비밀번호 변경</v-btn>
            </div>
          </div>
          
          <div class="mt-8">
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-2">
              <span class="text-grey-darken-2">다음 등급(Lv.{{ authStore.userData.level + 1 }})까지 경험치</span>
              <span class="text-blue-darken-1">{{ authStore.userData.exp }} / {{ nextLevelExp }} EXP</span>
            </div>
            <v-progress-linear :model-value="(authStore.userData.exp / nextLevelExp) * 100" color="blue-darken-1" height="8" rounded></v-progress-linear>
          </div>
        </div>
      </div>
      <div v-else class="text-center pa-10">
        <v-progress-circular indeterminate color="blue-darken-1"></v-progress-circular>
        <p class="text-caption font-weight-bold text-grey-darken-1 mt-4">프로필 정보를 불러오는 중입니다...</p>
      </div>
    </v-card>

    <!-- 비밀번호 변경 모달 -->
    <v-dialog v-model="changePwModal" max-width="400">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="d-flex justify-space-between align-center pt-4 px-4 pb-2">
          <span class="text-h6 font-weight-black text-grey-darken-4">비밀번호 변경</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="changePwModal = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="px-4 pb-4">
          <v-alert v-if="pwErrorMsg" type="error" variant="tonal" class="mb-4 text-caption font-weight-bold rounded-lg" closable @click:close="pwErrorMsg = ''">
            {{ pwErrorMsg }}
          </v-alert>
          <v-alert v-if="pwSuccessMsg" type="success" variant="tonal" class="mb-4 text-caption font-weight-bold rounded-lg" closable @click:close="pwSuccessMsg = ''">
            {{ pwSuccessMsg }}
          </v-alert>

          <v-text-field
            v-model="newPassword"
            label="새 비밀번호"
            type="password"
            variant="outlined"
            color="blue-darken-1"
            bg-color="grey-lighten-5"
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
            class="mb-4 font-weight-bold"
            rounded="lg"
            hide-details
            @keyup.enter="handleChangePassword"
          ></v-text-field>
        </v-card-text>
        
        <v-card-actions class="px-4 pb-4 pt-0">
          <v-btn
            :loading="pwLoading"
            color="blue-darken-1"
            variant="flat"
            block
            size="large"
            class="font-weight-bold rounded-lg"
            @click="handleChangePassword"
          >
            변경하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 프로필 수정 모달 -->
    <v-dialog v-model="changeProfileModal" max-width="400">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="d-flex justify-space-between align-center pt-4 px-4 pb-2">
          <span class="text-h6 font-weight-black text-grey-darken-4">프로필 수정</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="changeProfileModal = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="px-4 py-2">
          <!-- 아바타 선택 영역 -->
          <div class="mb-4">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-2">대표 아바타 선택</div>
            <v-row dense>
              <v-col v-for="avatar in AVATARS" :key="avatar.id" cols="4" class="text-center">
                <v-card 
                  :disabled="authStore.userData.level < avatar.requiredLevel"
                  :class="['pa-2 cursor-pointer transition-fast', editProfileImageId === avatar.id ? 'border-primary bg-blue-lighten-5' : 'border border-transparent bg-transparent']"
                  flat
                  @click="editProfileImageId = avatar.id"
                >
                  <v-avatar size="60" :color="authStore.userData.level < avatar.requiredLevel ? 'grey-lighten-3' : 'white'" class="border mb-1" :style="authStore.userData.level < avatar.requiredLevel ? 'filter: grayscale(100%); opacity: 0.5;' : ''">
                    <v-img :src="avatar.src"></v-img>
                    <v-overlay :model-value="authStore.userData.level < avatar.requiredLevel" contained class="align-center justify-center">
                      <v-icon color="grey-darken-3" size="small">mdi-lock</v-icon>
                    </v-overlay>
                  </v-avatar>
                  <div class="text-caption font-weight-bold text-truncate" :class="authStore.userData.level < avatar.requiredLevel ? 'text-grey' : 'text-grey-darken-4'">
                    {{ avatar.name }}
                  </div>
                  <div v-if="authStore.userData.level < avatar.requiredLevel" class="text-xs text-grey" style="font-size: 10px;">
                    Lv.{{ avatar.requiredLevel }} 해금
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <v-text-field
            v-model="editNickname"
            label="새로운 닉네임"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account-edit"
            bg-color="grey-lighten-5"
            class="mb-2"
            hide-details
            :rules="[v => !!v || '닉네임을 입력해주세요.']"
          ></v-text-field>

          <v-alert v-if="profileErrorMsg" type="error" variant="tonal" density="compact" class="mt-2 text-caption">{{ profileErrorMsg }}</v-alert>
          <v-alert v-if="profileSuccessMsg" type="success" variant="tonal" density="compact" class="mt-2 text-caption">{{ profileSuccessMsg }}</v-alert>
        </v-card-text>

        <v-card-actions class="px-4 pb-4 pt-2">
          <v-spacer></v-spacer>
          <v-btn 
            color="blue-darken-1" 
            variant="flat" 
            class="font-weight-bold px-6 rounded-lg" 
            :loading="profileLoading"
            @click="handleUpdateProfile"
          >저장하기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { AVATARS } from '~/constants/avatars'

const authStore = useAuthStore()

const currentAvatarSrc = computed(() => {
  if (!authStore.userData?.profileImageId) return null
  const avatar = AVATARS.find(a => a.id === authStore.userData.profileImageId)
  return avatar ? avatar.src : null
})

const nextLevelExp = computed(() => {
  const currentLevel = authStore.userData?.level || 1
  return currentLevel * 100 // 간단한 경험치 공식: [현재레벨 * 100] EXP 필요
})

const handleLogout = async () => {
  await authStore.logout()
}

const changePwModal = ref(false)
const newPassword = ref('')
const newPasswordConfirm = ref('')
const pwLoading = ref(false)
const pwErrorMsg = ref('')
const pwSuccessMsg = ref('')

const handleChangePassword = async () => {
  if (!newPassword.value || !newPasswordConfirm.value) {
    pwErrorMsg.value = '비밀번호를 모두 입력해주세요.'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    pwErrorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  if (newPassword.value.length < 6) {
    pwErrorMsg.value = '비밀번호는 최소 6자리 이상이어야 합니다.'
    return
  }

  pwLoading.value = true
  pwErrorMsg.value = ''
  pwSuccessMsg.value = ''

  try {
    await authStore.changePassword(newPassword.value)
    pwSuccessMsg.value = '비밀번호가 성공적으로 변경되었습니다.'
    newPassword.value = ''
    newPasswordConfirm.value = ''
    setTimeout(() => {
      changePwModal.value = false
      pwSuccessMsg.value = ''
    }, 1500)
  } catch (error) {
    pwErrorMsg.value = error.message || '오류가 발생했습니다.'
  } finally {
    pwLoading.value = false
  }
}

// 프로필 수정 상태
const changeProfileModal = ref(false)
const editNickname = ref('')
const editProfileImageId = ref('')
const profileLoading = ref(false)
const profileErrorMsg = ref('')
const profileSuccessMsg = ref('')

const openProfileModal = () => {
  editNickname.value = authStore.userData?.nickname || ''
  editProfileImageId.value = authStore.userData?.profileImageId || 'avatar_bronze_01'
  profileErrorMsg.value = ''
  profileSuccessMsg.value = ''
  changeProfileModal.value = true
}

const handleUpdateProfile = async () => {
  if (!editNickname.value || editNickname.value.trim() === '') {
    profileErrorMsg.value = '새로운 닉네임을 입력해주세요.'
    return
  }

  // 변경사항이 없을경우 스킵
  const isNicknameChanged = editNickname.value.trim() !== authStore.userData.nickname
  const isAvatarChanged = editProfileImageId.value !== authStore.userData.profileImageId

  if (!isNicknameChanged && !isAvatarChanged) {
    changeProfileModal.value = false
    return
  }
  
  profileLoading.value = true
  profileErrorMsg.value = ''
  
  try {
    // 1. 닉네임 업데이트
    if (isNicknameChanged) {
      await authStore.updateNickname(editNickname.value.trim())
    }
    // 2. 아바타 업데이트
    if (isAvatarChanged) {
      await authStore.updateProfileImage(editProfileImageId.value)
    }
    
    profileSuccessMsg.value = '프로필이 성공적으로 변경되었습니다.'
    setTimeout(() => {
      changeProfileModal.value = false
      profileSuccessMsg.value = ''
    }, 1500)
  } catch (error) {
    profileErrorMsg.value = error.message || '오류가 발생했습니다.'
  } finally {
    profileLoading.value = false
  }
}
</script>
