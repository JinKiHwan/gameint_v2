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
                <v-chip size="small" :color="getTierColor(authStore.userData.tier)" :bg-color="getTierBgColor(authStore.userData.tier)" variant="flat" class="font-weight-bold" :class="`border-${getTierColor(authStore.userData.tier)}-lighten-4 border`">
                  <v-icon start size="x-small">mdi-trophy</v-icon>{{ authStore.userData.tier || 'Bronze' }}
                </v-chip>
                <v-chip class="ml-2 font-weight-bold bg-grey-lighten-4 border" size="small" variant="flat" text-color="grey-darken-3">
                  Lv.{{ authStore.userData.level || 1 }}
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
          
          <div class="mt-6 bg-grey-lighten-5 pa-4 rounded-xl border">
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-2">
              <span class="text-grey-darken-2">다음 등급까지 경험치</span>
              <span class="text-blue-darken-1">{{ authStore.userData.exp || 0 }} / {{ (authStore.userData.level || 1) * 100 }} EXP</span>
            </div>
            <v-progress-linear 
              :model-value="((authStore.userData.exp || 0) / ((authStore.userData.level || 1) * 100)) * 100" 
              color="blue-darken-1" 
              height="8" 
              rounded
              striped
            ></v-progress-linear>
          </div>
        </div>
      </div>
      <div v-else class="text-center pa-10">
        <v-progress-circular indeterminate color="blue-darken-1"></v-progress-circular>
        <p class="text-caption font-weight-bold text-grey-darken-1 mt-4">프로필 정보를 불러오는 중입니다...</p>
      </div>
    </v-card>

    <!-- 내가 쓴 글 영역 -->
    <v-card class="rounded-xl pa-6 border bg-white mb-6" elevation="0">
      <h3 class="text-h6 font-weight-black text-grey-darken-4 mb-4 d-flex align-center">
        <v-icon color="blue-darken-1" class="mr-2">mdi-pencil-box-multiple</v-icon> 내가 쓴 글
      </h3>
      
      <v-skeleton-loader v-if="loadingPosts" type="list-item-two-line" v-for="i in 3" :key="`skel-${i}`" class="border-b"></v-skeleton-loader>
      
      <div v-else-if="userPosts.length === 0" class="text-center pa-8">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-note-off-outline</v-icon>
        <p class="text-body-2 font-weight-bold text-grey-darken-2">아직 작성한 글이 없습니다.</p>
      </div>

      <v-list v-else lines="two" class="pa-0">
        <template v-for="(post, index) in userPosts.slice(0, 5)" :key="post.id">
          <v-list-item class="pa-3 hover-bg-grey cursor-pointer rounded-lg" @click="router.push(`/board/${post.id}`)">
            <template v-slot:prepend>
               <v-chip size="x-small" :color="getCategoryColor(post.category)" variant="flat" class="font-weight-bold px-2 mr-3 rounded">
                {{ post.category }}
              </v-chip>
            </template>
            <v-list-item-title class="text-subtitle-2 font-weight-bold text-grey-darken-4 text-truncate mb-1">{{ post.title }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption font-weight-medium text-grey-darken-1">
              <span>{{ formatDate(post.createdAt) }}</span>
              <span class="mx-2">·</span>
              <span class="d-inline-flex align-center"><v-icon size="x-small" class="mr-1">mdi-eye</v-icon> {{ post.viewCount || 0 }}</span>
              <span class="mx-2">·</span>
              <span class="d-inline-flex align-center text-red-lighten-1"><v-icon size="x-small" class="mr-1">mdi-heart</v-icon> {{ post.likeCount || 0 }}</span>
            </v-list-item-subtitle>
          </v-list-item>
          <v-divider v-if="index !== Math.min(userPosts.length, 5) - 1" class="my-1"></v-divider>
        </template>
      </v-list>
      
      <div v-if="userPosts.length > 5" class="text-center mt-4 pt-2 border-t">
        <v-btn variant="text" color="grey-darken-2" class="font-weight-bold" size="small" append-icon="mdi-chevron-down">더보기</v-btn>
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
          <v-text-field
            v-model="editNickname"
            label="새로운 닉네임"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account"
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
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useBoard } from '~/composables/useBoard'

const router = useRouter()
const authStore = useAuthStore()
const { fetchUserPosts } = useBoard()

const userPosts = ref([])
const loadingPosts = ref(false)

const loadUserPosts = async () => {
  if (authStore.userData?.uid) {
    loadingPosts.value = true
    userPosts.value = await fetchUserPosts(authStore.userData.uid)
    loadingPosts.value = false
  }
}

onMounted(() => {
  if (authStore.userData?.uid) {
    loadUserPosts()
  } else {
    const stopWatch = watch(() => authStore.userData, (newVal) => {
      if (newVal?.uid) {
        loadUserPosts()
        stopWatch()
      }
    }, { immediate: true })
  }
})

const getCategoryColor = (cat) => {
  const map = {
    '책 리뷰': 'green-darken-1',
    '자유글': 'grey-darken-2',
    '정보/팁': 'orange-darken-2',
    '건의사항': 'red-darken-2'
  }
  return map[cat] || 'blue-grey'
}

const getTierColor = (tier) => {
  if (!tier) return 'amber-darken-2';
  const t = tier.toLowerCase();
  if (t.includes('bronze')) return 'amber-darken-4';
  if (t.includes('silver')) return 'grey-darken-1';
  if (t.includes('gold')) return 'amber-darken-2';
  if (t.includes('platinum')) return 'teal-darken-2';
  if (t.includes('diamond')) return 'blue-darken-2';
  return 'amber-darken-2';
}

const getTierBgColor = (tier) => {
  if (!tier) return 'amber-lighten-5';
  const t = tier.toLowerCase();
  if (t.includes('bronze')) return 'amber-lighten-5';
  if (t.includes('silver')) return 'grey-lighten-4';
  if (t.includes('gold')) return 'amber-lighten-5';
  if (t.includes('platinum')) return 'teal-lighten-5';
  if (t.includes('diamond')) return 'blue-lighten-5';
  return 'amber-lighten-5';
}

const formatDate = (dateValue) => {
  if (!dateValue) return ''
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${m}.${d}`
}

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
const profileLoading = ref(false)
const profileErrorMsg = ref('')
const profileSuccessMsg = ref('')

const openProfileModal = () => {
  editNickname.value = authStore.userData?.nickname || ''
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
  if (editNickname.value.trim() === authStore.userData.nickname) {
    changeProfileModal.value = false
    return
  }
  
  profileLoading.value = true
  profileErrorMsg.value = ''
  
  try {
    await authStore.updateNickname(editNickname.value.trim())
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
