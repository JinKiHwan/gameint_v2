<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="modalStore.isOpen" class="modal-overlay" @click.self="modalStore.closeModal">
        <div class="user-profile-modal modal" v-if="userProfile">
          
          <div class="modal__header">
            <span class="modal__title">프로필 정보</span>
            <button class="btn btn--text btn--icon" @click="modalStore.closeModal">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <div class="modal__body pa-0" style="max-height: 80vh; overflow-y: auto;">
            <!-- Profile Header -->
            <div class="profile-header text-center pa-6 pb-4">
              <div class="avatar avatar--xl mx-auto mb-3" style="width: 80px; height: 80px;">
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
            <div class="pa-4 bg-grey-50" v-if="userProfile.dna && userProfile.dna.dnaName">
              <div class="dna-container rounded-sm border bg-white pa-4">
                <div class="flex items-center gap-2 mb-2">
                  <div class="dna-badge">DNA</div>
                  <span class="font-black text-grey-dark">{{ userProfile.dna.dnaName }}</span>
                </div>
                <!-- 
                <div class="flex flex-wrap gap-2 mt-2" v-if="userProfile.dna.scores">
                  <span v-for="(score, axis) in topDnaScores(userProfile.dna.scores)" :key="axis" class="chip chip--xs chip--amber-lt">
                    {{ DNA_AXES[axis]?.label || axis }}
                  </span>
                </div>
                -->
              </div>
            </div>

            <!-- Recent Posts -->
            <div class="pa-5 border-t">
              <h4 class="text-subtitle-2 font-black text-grey-dark mb-3 flex items-center gap-2">
                <i class="mdi mdi-pencil-box-multiple text-blue-dark"></i> 최근 작성한 글
              </h4>
              
              <div v-if="modalStore.isLoadingPosts" class="text-center py-4">
                <div class="spinner spinner--sm mx-auto"></div>
              </div>
              <div v-else-if="!recentPosts || recentPosts.length === 0" class="text-center py-6 text-grey-3 text-caption font-bold bg-grey-50 rounded-sm">
                최근 작성한 글이 없습니다.
              </div>
              <ul v-else class="list pa-0 border rounded-sm">
                <template v-for="(post, index) in recentPosts" :key="post.id">
                  <li 
                    class="list-item flex items-center gap-2 py-3 px-3 cursor-pointer hover-bg" 
                    @click="goToPost(post.id)"
                  >
                    <span 
                      :class="[
                        `chip chip--xs`,
                        post.category === '도서 추천' ? 'chip--recommend' : `chip--${getCategoryChipClass(post.category)}`
                      ]"
                    >
                      {{ post.category }}
                    </span>
                    <div class="flex-grow min-w-0">
                      <div class="text-caption font-bold text-grey-dark text-truncate">{{ post.title }}</div>
                    </div>
                    <div class="text-xs text-grey-2 flex-shrink-0">{{ formatDate(post.createdAt) }}</div>
                  </li>
                  <hr v-if="index !== recentPosts.length - 1" class="divider mx-2" />
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
  const map = { '도서 추천': 'deep-purple', '책 리뷰': 'green', '만화': 'pink', '자유글': 'grey', '정보/팁': 'orange', '건의사항': 'red' }
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
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${m}.${d}`
}
</script>

<style scoped>
.user-profile-modal {
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.hover-bg {
  transition: background-color 0.2s;
}
.hover-bg:hover {
  background-color: #f5f5f5;
}

.dna-badge {
  background: #E8EAF6;
  color: #3F51B5;
  font-size: 0.625rem;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.text-xs {
  font-size: 0.7rem;
}
</style>
