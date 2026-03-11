<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="modalStore.isOpen" class="modal-overlay" @click.self="modalStore.closeModal">
        <div class="user-profile-modal modal" v-if="userProfile">
          
          <div class="modal__header">
            <span class="modal__title pb-2">프로필 정보</span>
            <button class="btn btn--text btn--icon" @click="modalStore.closeModal">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <div class="modal__body pa-0" style="max-height: 80vh; overflow-y: auto;">
            <!-- Profile Header -->
            <div class="profile-header text-center pa-6 pb-5 relative overflow-hidden">
              <div class="profile-header__bg"></div>
              <div class="avatar avatar--xl mx-auto mb-3 border-4 border-white shadow-sm" style="width: 88px; height: 88px; position: relative; z-index: 1;">
                <img :src="getProfileImagePath(userProfile.profileImageId)" alt="프로필" />
              </div>
              <h3 class="text-h6 font-black text-grey-dark mb-1">
                {{ userProfile.nickname }}
                <span v-if="userProfile.realName" class="text-subtitle-2 font-medium text-grey-2 ml-1">({{ userProfile.realName }})</span>
              </h3>
              
              <div class="flex justify-center items-center gap-2 mb-2">
                <span :class="`chip chip--${getTierChipClass(userProfile.tier)}`">
                  <i class="mdi mdi-trophy mr-1"></i>{{ userProfile.tier || 'Bronze' }}
                </span>
                <span class="chip chip--grey-lt">Lv.{{ userProfile.level || 1 }}</span>
              </div>
            </div>

            <!-- DNA Section -->
            <div class="px-5 pb-5 pt-2">
              <div v-if="userProfile.dna && userProfile.dna.dnaName" class="dna-container rounded-lg border pa-4 shadow-sm relative overflow-hidden" style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px);">
                <div class="dna-container__deco"></div>
                <div class="flex items-center gap-2 relative z-1">
                  <div class="dna-badge bg-indigo-50 text-indigo-700 border border-indigo-100"><i class="mdi mdi-dna mr-1"></i>DNA</div>
                  <span class="font-black text-grey-dark">{{ userProfile.dna.dnaName }}</span>
                </div>
              </div>
              <div v-else class="dna-container rounded-lg border pa-4 shadow-sm relative overflow-hidden text-center" style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px);">
                <div class="flex items-center justify-center gap-2 relative z-1">
                  <div class="dna-badge bg-grey-100 text-grey-3 border border-grey-200"><i class="mdi mdi-dna mr-1"></i>DNA</div>
                  <span class="font-bold text-grey-2 text-caption">데이터가 부족합니다</span>
                </div>
              </div>
            </div>

            <!-- Recent Posts -->
            <div class="pa-5 border-t border-white/60 glass-panel">
              <h4 class="text-subtitle-2 font-black text-grey-dark mb-3 flex items-center gap-2 px-1">
                <i class="mdi mdi-square-edit-outline text-blue-dark"></i> 최근 작성한 글
              </h4>
              
              <div v-if="modalStore.isLoadingPosts" class="text-center py-6">
                <div class="spinner spinner--sm mx-auto"></div>
              </div>
              <div v-else-if="!recentPosts || recentPosts.length === 0" class="text-center py-6 text-grey-3 text-caption font-bold bg-white/80 rounded-lg border border-white/50 border-dashed backdrop-blur-sm">
                최근 작성한 글이 없습니다.
              </div>
              <ul v-else class="list pa-0 bg-white/90 backdrop-blur-md rounded-lg border border-white/60 shadow-sm overflow-hidden">
                <template v-for="(post, index) in recentPosts" :key="post.id">
                  <li 
                    class="list-item flex flex-col gap-1.5 py-3 px-4 cursor-pointer hover-bg transition-colors" 
                    @click="goToPost(post.id)"
                  >
                    <div class="flex items-center justify-between gap-2">
                       <span 
                        :class="[
                          `chip chip--xs`,
                          `chip--${getCategoryChipClass(post.category)}`
                        ]"
                      >
                        {{ post.category }}
                      </span>
                      <div class="text-[10px] text-grey-2 font-medium flex-shrink-0">{{ formatDate(post.createdAt) }}</div>
                    </div>
                    <div class="text-body-2 font-black text-grey-dark text-truncate w-full">{{ post.title }}</div>
                  </li>
                </template>
              </ul>
            </div>
          </div>

        </div>
        <div class="user-profile-modal modal" v-else>
          <div class="modal__header">
            <span class="modal__title">프로필 정보</span>
            <button class="btn btn--text btn--icon" @click="modalStore.closeModal">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
          <div class="modal__body text-center py-10">
             <div class="spinner spinner--sm mx-auto mb-3"></div>
             <p class="text-caption text-grey-3">사용자 정보를 불러오는 중입니다...</p>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileModalStore } from '~/stores/profileModal'
import { useUsersStore } from '~/stores/users'
import { getProfileImagePath } from '~/composables/useProfileImages'
// import { DNA_AXES } from '~/utils/dnaConfig'

const router = useRouter()
const modalStore = useProfileModalStore()
const usersStore = useUsersStore()

const userProfile = computed(() => {
  if (!modalStore.targetUid) return null
  return usersStore.getUser(modalStore.targetUid)
})

const recentPosts = computed(() => {
  if (!modalStore.targetUid) return []
  return modalStore.recentPostsCache[modalStore.targetUid] || []
})

/*
const topDnaScores = (scores) => {
  if (!scores) return {}
  const sorted = Object.entries(scores).sort(([,a], [,b]) => b - a).slice(0, 3)
  return Object.fromEntries(sorted)
}
*/

const goToPost = (postId) => {
  modalStore.closeModal()
  router.push(`/board/${postId}`)
}

const getCategoryChipClass = (cat) => {
  const map = { '도서 추천': 'light-green', '책 리뷰': 'green', '만화': 'pink', '자유글': 'grey', '정보/팁': 'orange', '건의사항': 'red' }
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
  if (t.includes('master'))    return 'indigo-tonal'
  if (t.includes('grandmaster')) return 'red'
  if (t.includes('challenger'))  return 'grey'
  return 'amber'
}

const formatDate = (dateValue) => {
  if (!dateValue) return ''
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue)
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}.${m}.${d}`
}
</script>

<style scoped>
.user-profile-modal {
  width: 90%;
  max-width: 380px;
  overflow: hidden;
  border-radius: 24px;
  background: rgba(245, 247, 250, 0.95); /* Less transparent glassmorphism base */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.modal__header {
  border-bottom: none;
  padding-bottom: 0;
  z-index: 10;
  position: relative;
  background: transparent;
}

.profile-header__bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(135deg, rgba(245, 247, 250, 0.5) 0%, rgba(228, 232, 240, 0.5) 100%);
  z-index: 0;
  pointer-events: none; /* Prevent blocking clicks */
}

.profile-header > *:not(.profile-header__bg) {
  position: relative;
  z-index: 1;
}

.dna-container__deco {
  position: absolute;
  right: -20px;
  top: -20px;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(63,81,181,0.05) 0%, rgba(63,81,181,0) 70%);
  border-radius: 50%;
}

.hover-bg {
  transition: all 0.2s;
}
.hover-bg:hover {
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.dna-badge {
  font-size: 0.625rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.border-dashed {
  border-style: dashed !important;
}

.shadow-sm {
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
</style>
