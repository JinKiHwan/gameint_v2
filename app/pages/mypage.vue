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

          <!-- 프로필 이미지 (클릭 시 선택 모달) -->
          <div class="profile-avatar-wrap" @click="openImageModal">
            <div class="profile-avatar">
              <img :src="currentProfileImagePath" alt="프로필" />
            </div>
            <div class="profile-avatar__edit">
              <i class="mdi mdi-camera"></i>
            </div>
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
        <template v-if="loadingPosts">
          <div v-for="i in 3" :key="`skel-${i}`" class="skeleton-item">
            <div class="skeleton skeleton--avatar" style="width:40px;height:40px;"></div>
            <div style="flex:1;"><div class="skeleton skeleton--title" style="width:60%;"></div><div class="skeleton skeleton--text" style="width:40%;"></div></div>
          </div>
        </template>
        <div v-else-if="userPosts.length === 0" class="text-center pa-8">
          <i class="mdi mdi-note-off-outline" style="font-size:3rem;color:#BDBDBD;display:block;margin-bottom:12px;"></i>
          <p class="text-body-2 font-bold text-grey-2">아직 작성한 글이 없습니다.</p>
        </div>
        <ul v-else class="list pa-0">
          <template v-for="(post, index) in paginatedUserPosts" :key="post.id">
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
            <hr v-if="index !== paginatedUserPosts.length - 1" class="divider" />
          </template>
        </ul>

        <!-- 페이지네이션 -->
        <div v-if="totalPostPages > 1" class="pagination mt-4">
          <button class="pagination__btn" :disabled="postPage <= 1" @click="postPage--"><i class="mdi mdi-chevron-left"></i></button>
          <button
            v-for="p in totalPostPages" :key="p"
            class="pagination__btn"
            :class="{ 'is-active': postPage === p }"
            @click="postPage = p"
          >{{ p }}</button>
          <button class="pagination__btn" :disabled="postPage >= totalPostPages" @click="postPage++"><i class="mdi mdi-chevron-right"></i></button>
        </div>
      </div>
    </div>

    <!-- ===== 비밀번호 변경 모달 ===== -->
    <ClientOnly>
      <Teleport to="body">
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
              <button class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                :class="{'is-loading':pwLoading}" :disabled="pwLoading"
                @click="handleChangePassword">변경하기</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== 프로필 수정 모달 (닉네임) ===== -->
    <ClientOnly>
      <Teleport to="body">
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
              <button class="btn btn--primary font-black px-6 rounded-sm"
                :class="{'is-loading':profileLoading}" :disabled="profileLoading"
                @click="handleUpdateProfile">저장하기</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== 프로필 이미지 선택 모달 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="imageModal" class="modal-overlay img-modal-overlay" @click.self="imageModal = false">
          <div class="modal img-select-modal">
            <div class="modal__header">
              <span class="modal__title">프로필 이미지 선택</span>
              <button class="btn btn--text btn--icon" @click="imageModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal__body img-modal-body">
              <!-- 해금 조건 안내 -->
              <div class="unlock-legend mb-4">
                <span class="legend-item"><span class="legend-dot dot-default"></span>기본 제공</span>
                <span class="legend-item"><span class="legend-dot dot-tier"></span>티어 해금</span>
                <span class="legend-item"><span class="legend-dot dot-quest"></span>퀘스트 해금</span>
              </div>

              <!-- 탭 필터 -->
              <div class="img-tab-bar mb-4">
                <button
                  v-for="tab in imageTabs"
                  :key="tab.value"
                  class="img-tab-btn"
                  :class="{ 'is-active': imageTab === tab.value }"
                  @click="imageTab = tab.value"
                >{{ tab.label }}</button>
              </div>

              <!-- 이미지 그리드 -->
              <div class="img-grid">
                <div
                  v-for="img in filteredImages"
                  :key="img.id"
                  class="img-item"
                  :class="{
                    'is-selected': selectedImageId === img.id,
                    'is-locked': !isUnlocked(img),
                  }"
                  @click="isUnlocked(img) && (selectedImageId = img.id)"
                >
                  <img :src="img.path" :alt="img.label" />

                  <!-- 선택됨 표시 -->
                  <div v-if="selectedImageId === img.id" class="img-item__check">
                    <i class="mdi mdi-check"></i>
                  </div>

                  <!-- 잠금 오버레이 -->
                  <div v-if="!isUnlocked(img)" class="img-item__lock">
                    <i class="mdi mdi-lock"></i>
                    <span class="lock-label">{{ getLockLabel(img) }}</span>
                  </div>

                  <!-- 현재 사용 중 badge -->
                  <div v-if="img.id === authStore.userData?.profileImageId && selectedImageId !== img.id" class="img-item__current">사용중</div>
                </div>
              </div>
            </div>

            <div class="modal__footer" style="flex-direction:row;gap:8px;">
              <button class="btn btn--grey flex-grow font-bold rounded-sm" @click="imageModal = false">취소</button>
              <button
                class="btn btn--primary flex-grow font-black rounded-sm"
                :class="{'is-loading': imageLoading}"
                :disabled="imageLoading || selectedImageId === authStore.userData?.profileImageId"
                @click="handleSaveImage"
              >적용하기</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useBoard } from '~/composables/useBoard'
import { PROFILE_IMAGES, isImageUnlocked, getProfileImagePath } from '~/composables/useProfileImages'

const router = useRouter()
const authStore = useAuthStore()
const { fetchUserPosts } = useBoard()

// ── 프로필 이미지 경로 ───────────────────────────────────────────
const currentProfileImagePath = computed(() =>
  getProfileImagePath(authStore.userData?.profileImageId)
)

// ── 게시글 목록 ─────────────────────────────────────────────────
const userPosts = ref([])
const loadingPosts = ref(false)

const postPage = ref(1)
const postsPerPage = 10

const totalPostPages = computed(() => Math.ceil(userPosts.value.length / postsPerPage))
const paginatedUserPosts = computed(() => {
  const start = (postPage.value - 1) * postsPerPage
  return userPosts.value.slice(start, start + postsPerPage)
})

const loadUserPosts = async () => {
  if (authStore.userData?.uid) {
    loadingPosts.value = true
    userPosts.value = await fetchUserPosts(authStore.userData.uid)
    loadingPosts.value = false
  }
}
onMounted(() => {
  if (authStore.userData?.uid) loadUserPosts()
  else {
    const stop = watch(() => authStore.userData, (v) => { if (v?.uid) { loadUserPosts(); stop() } }, { immediate: true })
  }
})

// ── 이미지 선택 모달 ─────────────────────────────────────────────
const imageModal = ref(false)
const imageTab = ref('all')
const selectedImageId = ref('')
const imageLoading = ref(false)

const imageTabs = [
  { value: 'all',     label: '전체' },
  { value: 'default', label: '기본 제공' },
  { value: 'quest',   label: '퀘스트 해금' },
  { value: 'tier',    label: '티어 해금' },
]

const filteredImages = computed(() => {
  if (imageTab.value === 'all') return PROFILE_IMAGES
  return PROFILE_IMAGES.filter(img => img.unlockType === imageTab.value)
})

const isUnlocked = (img) => isImageUnlocked(img, {
  tier:         authStore.userData?.tier,
  postCount:    authStore.userData?.postCount,
  commentCount: authStore.userData?.commentCount,
})

const getLockLabel = (img) => {
  if (img.unlockType === 'tier')  return `${img.tier} 이상`
  if (img.unlockType === 'quest') {
    const typeLabel = img.quest.type === 'posts' ? '게시글' : '댓글'
    return `${typeLabel} ${img.quest.count}개`
  }
  return '잠금'
}

const openImageModal = () => {
  selectedImageId.value = authStore.userData?.profileImageId || 'default_01'
  imageTab.value = 'all'
  imageModal.value = true
}

const handleSaveImage = async () => {
  if (!selectedImageId.value) return
  imageLoading.value = true
  try {
    await authStore.updateProfileImage(selectedImageId.value)
    imageModal.value = false
  } catch (err) {
    alert(err.message || '이미지 변경 중 오류가 발생했습니다.')
  } finally {
    imageLoading.value = false
  }
}

// ── 기타 유틸 ────────────────────────────────────────────────────
const getCategoryChipClass = (cat) => {
  const map = { '도서 추천': 'deep-purple', '책 리뷰': 'green', '자유글': 'grey', '정보/팁': 'orange', '건의사항': 'red' }
  return map[cat] || 'grey'
}
const getTierChipClass = (tier) => {
  if (!tier) return 'amber'
  const t = tier.toLowerCase()
  if (t.includes('bronze'))   return 'amber'
  if (t.includes('silver'))   return 'grey-lt'
  if (t.includes('gold'))     return 'amber'
  if (t.includes('platinum')) return 'teal'
  if (t.includes('diamond'))  return 'indigo'
  return 'amber'
}
const formatDate = (dateValue) => {
  if (!dateValue) return ''
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${date.getFullYear()}.${m}.${d}`
}
const handleLogout = async () => { await authStore.logout(); router.push('/'); }

// ── 비밀번호 변경 ─────────────────────────────────────────────────
const changePwModal = ref(false)
const newPassword = ref(''); const newPasswordConfirm = ref('')
const pwLoading = ref(false); const pwErrorMsg = ref(''); const pwSuccessMsg = ref('')
const handleChangePassword = async () => {
  if (!newPassword.value || !newPasswordConfirm.value) { pwErrorMsg.value = '비밀번호를 모두 입력해주세요.'; return }
  if (newPassword.value !== newPasswordConfirm.value) { pwErrorMsg.value = '비밀번호가 일치하지 않습니다.'; return }
  if (newPassword.value.length < 6) { pwErrorMsg.value = '최소 6자리 이상이어야 합니다.'; return }
  pwLoading.value = true; pwErrorMsg.value = ''; pwSuccessMsg.value = ''
  try {
    await authStore.changePassword(newPassword.value)
    pwSuccessMsg.value = '비밀번호가 변경되었습니다.'
    newPassword.value = ''; newPasswordConfirm.value = ''
    setTimeout(() => { changePwModal.value = false; pwSuccessMsg.value = '' }, 1500)
  } catch (err) { pwErrorMsg.value = err.message || '오류가 발생했습니다.' }
  finally { pwLoading.value = false }
}

// ── 닉네임 변경 ────────────────────────────────────────────────────
const changeProfileModal = ref(false)
const editNickname = ref('')
const profileLoading = ref(false); const profileErrorMsg = ref(''); const profileSuccessMsg = ref('')
const openProfileModal = () => {
  editNickname.value = authStore.userData?.nickname || ''
  profileErrorMsg.value = ''; profileSuccessMsg.value = ''
  changeProfileModal.value = true
}
const handleUpdateProfile = async () => {
  if (!editNickname.value?.trim()) { profileErrorMsg.value = '닉네임을 입력해주세요.'; return }
  if (editNickname.value.trim() === authStore.userData.nickname) { changeProfileModal.value = false; return }
  profileLoading.value = true; profileErrorMsg.value = ''
  try {
    await authStore.updateNickname(editNickname.value.trim())
    profileSuccessMsg.value = '닉네임이 변경되었습니다.'
    setTimeout(() => { changeProfileModal.value = false; profileSuccessMsg.value = '' }, 1500)
  } catch (err) { profileErrorMsg.value = err.message || '오류가 발생했습니다.' }
  finally { profileLoading.value = false }
}
</script>

<style scoped>
/* ── 레이아웃 ───────────────────────────────── */
.profile-layout {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  @media(min-width:600px) { flex-direction:row; align-items:flex-start; text-align:left; }
}
.profile-content { flex:1; width:100%; }
.profile-top {
  display: flex; flex-direction: column; margin-bottom: 8px;
  @media(min-width:600px) { flex-direction:row; justify-content:space-between; align-items:flex-start; }
}
.profile-actions {
  display: flex; gap: 8px; margin-top: 16px; justify-content: center;
  @media(min-width:600px) { flex-direction:column; margin-top:0; align-items:flex-end; }
}
.justify-center { justify-content: center; }
.justify-sm-start { @media(min-width:600px){ justify-content:flex-start; } }

/* ── 프로필 아바타 ──────────────────────────── */
.profile-avatar-wrap {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  margin-bottom: 16px;
  @media(min-width:600px) { margin-right: 24px; margin-bottom: 0; }
}
.profile-avatar {
  width: 100px; height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #E0E0E0;
  background: #F5F5F5;
  transition: border-color 0.2s;

  img { width:100%; height:100%; object-fit:cover; display:block; }

  .profile-avatar-wrap:hover & { border-color: #1E88E5; }
}
.profile-avatar__edit {
  position: absolute; bottom: 4px; right: 4px;
  width: 28px; height: 28px;
  background: #1E88E5; color: #fff;
  border-radius: 50%; border: 2px solid #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* ── EXP ──────────────────────────────────── */
.exp-box { background: #FAFAFA; padding: 16px; border-radius: 16px; border: 1px solid #e0e0e0; }

/* ── Input util ───────────────────────────── */
.input-with-icon {
  display: flex; align-items: center;
  border: 1.5px solid #e0e0e0; border-radius: 8px; background: #FAFAFA;
  &:focus-within { border-color: #1E88E5; box-shadow: 0 0 0 3px rgba(30,136,229,0.12); }
  .icon { padding: 0 8px 0 12px; color: #757575; }
  input { flex:1; border:none; background:transparent; padding:12px 12px 12px 4px; font-size:0.9375rem; font-weight:600; outline:none; color:#212121; &::placeholder{ color:#BDBDBD; } }
}

/* ── 이미지 선택 모달 ─────────────────────── */
.img-modal-overlay { align-items: flex-end; padding: 0; @media(min-width:600px){ align-items:center; padding:16px; } }

.img-select-modal {
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  @media(min-width:600px) { border-radius: 20px; }
}

.img-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

/* 탭 */
.img-tab-bar { display: flex; gap: 4px; }
.img-tab-btn {
  flex: 1; padding: 8px 4px; border: none; background: #F5F5F5;
  border-radius: 8px; font-size: 0.8125rem; font-weight: 700; color: #757575; cursor: pointer; transition: all 0.2s;
  &.is-active { background: #212121; color: #fff; }
}

/* 범례 */
.unlock-legend { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 700; color: #757575; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-default { background: #4CAF50; }
.dot-tier    { background: #FFB300; }
.dot-quest   { background: #7E57C2; }

/* 이미지 그리드 */
.img-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  @media(min-width:480px) { grid-template-columns: repeat(5, 1fr); }
}

.img-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  background: #F5F5F5;

  img { width:100%; height:100%; object-fit:cover; display:block; }

  &:hover:not(.is-locked) { border-color: #90CAF9; transform: scale(1.04); }
  &.is-selected { border-color: #1E88E5; box-shadow: 0 0 0 2px rgba(30,136,229,0.3); }
  &.is-locked { cursor: not-allowed; filter: grayscale(60%); opacity: 0.6; }
}

.img-item__check {
  position: absolute; inset: 0;
  background: rgba(30,136,229,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: #1E88E5;
  border-radius: 9px;
}

.img-item__lock {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.52);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #fff; gap: 2px;
  .mdi { font-size: 1.2rem; }
}
.lock-label {
  font-size: 0.6rem; font-weight: 700; text-align: center; line-height: 1.3;
  background: rgba(0,0,0,0.4); padding: 1px 4px; border-radius: 4px;
}

.img-item__current {
  position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
  background: rgba(30,136,229,0.85); color:#fff;
  font-size: 0.6rem; font-weight: 700; padding: 2px 6px; border-radius: 6px;
  white-space: nowrap;
}

/* spacing util */
.pa-2 { padding: 8px; } .pa-8 { padding: 32px; } .pa-10 { padding: 40px; }
.mb-1 { margin-bottom: 4px; } .mb-2 { margin-bottom: 8px; } .mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; } .mb-6 { margin-bottom: 24px; }
.mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; } .mt-4 { margin-top: 16px; } .mt-6 { margin-top: 24px; }
.mr-3 { margin-right: 12px; } .px-6 { padding-left: 24px; padding-right: 24px; }
.gap-1 { gap: 4px; } .gap-2 { gap: 8px; }

/* pagination styling copied from board */
.pagination { display: flex; align-items: center; justify-content: center; gap: 8px; }
.pagination__btn {
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e0e0e0;
  background: #fff; color: #757575; font-size: 0.8125rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  &:hover:not(:disabled) { background: #f5f5f5; color: #212121; }
  &.is-active { background: #1E88E5; color: #fff; border-color: #1E88E5; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
