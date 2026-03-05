<template>
  <div class="fade-in">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-h5 font-black text-grey-dark">마이페이지 👤</h1>
      <button class="btn btn--text text-grey-2 font-bold flex items-center gap-2" @click="handleLogout">
        <i class="mdi mdi-logout"></i>로그아웃
      </button>
    </div>

    <!-- 프로필 카드 -->
    <div class="card mb-6">
      <div class="card-body">
        <div v-if="authStore.userData" class="profile-layout">
          <div class="avatar avatar--xl avatar--blue mb-sm-0 mb-4">
            <span>{{ authStore.userData.nickname?.charAt(0) || 'U' }}</span>
          </div>

          <div class="profile-content">
            <div class="profile-top">
              <div>
                <div class="flex items-center gap-2 justify-center justify-sm-start mb-1">
                  <h2 class="text-h5 font-black text-grey-dark">{{ authStore.userData.nickname }}</h2>
                  <span :class="`chip chip--${getTierChipClass(authStore.userData.tier)}`">
                    <i class="mdi mdi-trophy"></i>{{ authStore.userData.tier || 'Bronze' }}
                  </span>
                  <span class="chip chip--grey-lt">Lv.{{ authStore.userData.level || 1 }}</span>
                </div>
                <p class="text-caption font-medium text-grey-2 flex items-center gap-1">
                  <i class="mdi mdi-email-outline"></i> {{ authStore.userData.email }}
                </p>
                <p class="text-caption font-medium mt-3 text-grey-3 bg-grey-100 pa-2 rounded-sm border" style="display:inline-block;">
                  🧬 독서 DNA: <strong class="text-grey-dark">{{ authStore.userData.dnaTitle }}</strong>
                </p>
              </div>

              <div class="profile-actions">
                <button class="btn btn--tonal-primary btn--sm rounded-sm flex items-center gap-1" @click="openProfileModal">
                  <i class="mdi mdi-pencil"></i>프로필 수정
                </button>
                <button class="btn btn--tonal btn--sm rounded-sm flex items-center gap-1" @click="changePwModal = true">
                  <i class="mdi mdi-lock-reset"></i>비밀번호 변경
                </button>
              </div>
            </div>

            <!-- EXP 바 -->
            <div class="exp-box mt-6">
              <div class="flex justify-between text-caption font-bold mb-2">
                <span class="text-grey-2">다음 등급까지 경험치</span>
                <span class="text-blue-dark">{{ authStore.userData.exp || 0 }} / {{ (authStore.userData.level || 1) * 100 }} EXP</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar__fill" :style="`width: ${Math.min(((authStore.userData.exp || 0) / ((authStore.userData.level || 1) * 100)) * 100, 100)}%`"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center pa-10">
          <div class="spinner" style="margin:0 auto 16px;"></div>
          <p class="text-caption font-bold text-grey-2">프로필 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    </div>

    <!-- 내가 쓴 글 -->
    <div class="card mb-6">
      <div class="card-body">
        <h3 class="text-h6 font-black text-grey-dark mb-4 flex items-center gap-2">
          <i class="mdi mdi-pencil-box-multiple text-blue-dark"></i> 내가 쓴 글
        </h3>

        <!-- 스켈레톤 -->
        <template v-if="loadingPosts">
          <div v-for="i in 3" :key="`skel-${i}`" class="skeleton-item">
            <div class="skeleton skeleton--avatar" style="width:40px;height:40px;"></div>
            <div style="flex:1;">
              <div class="skeleton skeleton--title" style="width:60%;"></div>
              <div class="skeleton skeleton--text" style="width:40%;"></div>
            </div>
          </div>
        </template>

        <!-- 빈 상태 -->
        <div v-else-if="userPosts.length === 0" class="text-center pa-8">
          <i class="mdi mdi-note-off-outline" style="font-size:3rem;color:#BDBDBD;display:block;margin-bottom:12px;"></i>
          <p class="text-body-2 font-bold text-grey-2">아직 작성한 글이 없습니다.</p>
        </div>

        <!-- 글 목록 -->
        <ul v-else class="list pa-0">
          <template v-for="(post, index) in userPosts.slice(0, 5)" :key="post.id">
            <li class="list-item cursor-pointer rounded-sm" @click="router.push(`/board/${post.id}`)">
              <span :class="`chip chip--${getCategoryChipClass(post.category)} chip--xs mr-3`">{{ post.category }}</span>
              <div class="flex-grow min-w-0">
                <div class="text-subtitle-2 font-bold text-grey-dark text-truncate mb-1">{{ post.title }}</div>
                <div class="text-caption font-medium text-grey-2 flex items-center gap-2">
                  <span>{{ formatDate(post.createdAt) }}</span>
                  <span>·</span>
                  <span class="flex items-center gap-1"><i class="mdi mdi-eye" style="font-size:.8em;"></i> {{ post.viewCount || 0 }}</span>
                  <span>·</span>
                  <span class="flex items-center gap-1 text-red"><i class="mdi mdi-heart" style="font-size:.8em;"></i> {{ post.likeCount || 0 }}</span>
                </div>
              </div>
            </li>
            <hr v-if="index !== Math.min(userPosts.length, 5) - 1" class="divider" />
          </template>
        </ul>

        <div v-if="userPosts.length > 5" class="text-center mt-4 pt-2 border-t">
          <button class="btn btn--text text-grey-2 font-bold flex items-center gap-1" style="margin:0 auto;">
            더보기<i class="mdi mdi-chevron-down"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 비밀번호 변경 모달 -->
    <div v-if="changePwModal" class="modal-overlay" @click.self="changePwModal = false">
      <div class="modal">
        <div class="modal__header">
          <span class="modal__title">비밀번호 변경</span>
          <button class="btn btn--text btn--icon" @click="changePwModal = false"><i class="mdi mdi-close"></i></button>
        </div>
        <div class="modal__body">
          <div v-if="pwErrorMsg" class="alert alert--error mb-4">
            <i class="mdi mdi-alert-circle-outline"></i><span>{{ pwErrorMsg }}</span>
            <button class="alert__close" @click="pwErrorMsg = ''"><i class="mdi mdi-close"></i></button>
          </div>
          <div v-if="pwSuccessMsg" class="alert alert--success mb-4">
            <i class="mdi mdi-check-circle-outline"></i><span>{{ pwSuccessMsg }}</span>
          </div>
          <input v-model="newPassword" class="input mb-2" type="password" placeholder="새 비밀번호" />
          <input v-model="newPasswordConfirm" class="input mb-4" type="password" placeholder="새 비밀번호 확인" @keyup.enter="handleChangePassword" />
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary btn--lg btn--block font-black rounded-sm" :class="{'is-loading':pwLoading}" :disabled="pwLoading" @click="handleChangePassword">변경하기</button>
        </div>
      </div>
    </div>

    <!-- 프로필 수정 모달 -->
    <div v-if="changeProfileModal" class="modal-overlay" @click.self="changeProfileModal = false">
      <div class="modal">
        <div class="modal__header">
          <span class="modal__title">프로필 수정</span>
          <button class="btn btn--text btn--icon" @click="changeProfileModal = false"><i class="mdi mdi-close"></i></button>
        </div>
        <div class="modal__body">
          <div class="input-with-icon mb-3">
            <i class="mdi mdi-account icon"></i>
            <input v-model="editNickname" type="text" placeholder="새로운 닉네임" />
          </div>
          <div v-if="profileErrorMsg" class="alert alert--error mt-2 text-caption">{{ profileErrorMsg }}</div>
          <div v-if="profileSuccessMsg" class="alert alert--success mt-2 text-caption">{{ profileSuccessMsg }}</div>
        </div>
        <div class="modal__footer" style="flex-direction:row;justify-content:flex-end;">
          <button class="btn btn--primary font-black px-6 rounded-sm" :class="{'is-loading':profileLoading}" :disabled="profileLoading" @click="handleUpdateProfile">저장하기</button>
        </div>
      </div>
    </div>
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
      if (newVal?.uid) { loadUserPosts(); stopWatch() }
    }, { immediate: true })
  }
})

const getCategoryChipClass = (cat) => {
  const map = { '책 리뷰': 'green', '자유글': 'grey', '정보/팁': 'orange', '건의사항': 'red' }
  return map[cat] || 'grey'
}

const getTierChipClass = (tier) => {
  if (!tier) return 'amber'
  const t = tier.toLowerCase()
  if (t.includes('bronze'))  return 'amber'
  if (t.includes('silver'))  return 'grey-lt'
  if (t.includes('gold'))    return 'amber'
  if (t.includes('platinum'))return 'teal'
  if (t.includes('diamond')) return 'indigo'
  return 'amber'
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

const handleLogout = async () => { await authStore.logout() }

const changePwModal = ref(false)
const newPassword = ref('')
const newPasswordConfirm = ref('')
const pwLoading = ref(false)
const pwErrorMsg = ref('')
const pwSuccessMsg = ref('')

const handleChangePassword = async () => {
  if (!newPassword.value || !newPasswordConfirm.value) { pwErrorMsg.value = '비밀번호를 모두 입력해주세요.'; return }
  if (newPassword.value !== newPasswordConfirm.value) { pwErrorMsg.value = '비밀번호가 일치하지 않습니다.'; return }
  if (newPassword.value.length < 6) { pwErrorMsg.value = '비밀번호는 최소 6자리 이상이어야 합니다.'; return }
  pwLoading.value = true; pwErrorMsg.value = ''; pwSuccessMsg.value = ''
  try {
    await authStore.changePassword(newPassword.value)
    pwSuccessMsg.value = '비밀번호가 성공적으로 변경되었습니다.'
    newPassword.value = ''; newPasswordConfirm.value = ''
    setTimeout(() => { changePwModal.value = false; pwSuccessMsg.value = '' }, 1500)
  } catch (error) {
    pwErrorMsg.value = error.message || '오류가 발생했습니다.'
  } finally { pwLoading.value = false }
}

const changeProfileModal = ref(false)
const editNickname = ref('')
const profileLoading = ref(false)
const profileErrorMsg = ref('')
const profileSuccessMsg = ref('')

const openProfileModal = () => {
  editNickname.value = authStore.userData?.nickname || ''
  profileErrorMsg.value = ''; profileSuccessMsg.value = ''
  changeProfileModal.value = true
}

const handleUpdateProfile = async () => {
  if (!editNickname.value || editNickname.value.trim() === '') { profileErrorMsg.value = '새로운 닉네임을 입력해주세요.'; return }
  if (editNickname.value.trim() === authStore.userData.nickname) { changeProfileModal.value = false; return }
  profileLoading.value = true; profileErrorMsg.value = ''
  try {
    await authStore.updateNickname(editNickname.value.trim())
    profileSuccessMsg.value = '프로필이 성공적으로 변경되었습니다.'
    setTimeout(() => { changeProfileModal.value = false; profileSuccessMsg.value = '' }, 1500)
  } catch (error) {
    profileErrorMsg.value = error.message || '오류가 발생했습니다.'
  } finally { profileLoading.value = false }
}
</script>

<style scoped>
.profile-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  @media (min-width: 600px) { flex-direction: row; align-items: flex-start; text-align: left; }
}

.avatar--xl { margin-bottom: 16px; @media(min-width:600px){ margin-right: 24px; margin-bottom: 0; } }

.profile-content { flex: 1; width: 100%; }

.profile-top {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  @media(min-width:600px) { flex-direction: row; justify-content: space-between; align-items: flex-start; }
}

.profile-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: center;
  @media(min-width:600px) { flex-direction: column; margin-top: 0; align-items: flex-end; }
}

.justify-center { justify-content: center; }
.justify-sm-start { @media(min-width:600px){ justify-content: flex-start; } }

.exp-box { background: #FAFAFA; padding: 16px; border-radius: 16px; border: 1px solid #e0e0e0; }

.input-with-icon {
  display: flex; align-items: center;
  border: 1.5px solid #e0e0e0; border-radius: 8px; background: #FAFAFA;
  &:focus-within { border-color: #1E88E5; box-shadow: 0 0 0 3px rgba(30,136,229,0.12); }
  .icon { padding: 0 8px 0 12px; color: #757575; }
  input { flex:1; border:none; background:transparent; padding:12px 12px 12px 4px; font-size:0.9375rem; font-weight:600; outline:none; color:#212121; &::placeholder{ color:#BDBDBD; } }
}

.pa-2 { padding: 8px; }
.pa-8 { padding: 32px; }
.pa-10 { padding: 40px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-6 { margin-top: 24px; }
.mr-3 { margin-right: 12px; }
.pt-2 { padding-top: 8px; }
.px-6 { padding-left: 24px; padding-right: 24px; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
