<template>
  <div class="fade-in">
    <!-- 상단 웰컴 & 티어 -->
    <div class="page-header">
      <div>
        <h1 class="text-h5 font-black text-grey-dark mb-1">
          <template v-if="authStore.isLoggedIn">
            {{ authStore.userData?.nickname || '회원' }}님, 어서오세요. 👋
          </template>
          <template v-else>
            안녕하세요 독서동호회 게임인트입니다. 📚
          </template>
        </h1>
        <p class="text-body-2 text-grey-2">오늘도 독서와 함께 성장하는 하루 되세요!</p>
      </div>
      <div v-if="authStore.isLoggedIn" class="tier-badge card shadow-sm">
        <div class="avatar avatar--md" :class="getTierAvatarClass(authStore.userData?.tier)">
          <i class="mdi mdi-trophy"></i>
        </div>
        <div>
          <div class="text-subtitle-2 font-bold">{{ authStore.userData?.tier || 'Bronze' }} Reader</div>
          <div class="text-caption text-grey-2">{{ authStore.userData?.exp || 0 }} EXP</div>
        </div>
      </div>
    </div>

    <!-- 메인 히어로 배너 -->
    <div v-if="activeCycle" class="hero-banner mb-10">
      <img
        :src="activeCycle.heroImageUrl || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2072&auto=format&fit=crop'"
        alt="사이클 배너"
      />
      <div class="hero-banner__overlay">
        <div class="hero-banner__content">
          <div class="text-white">
            <span class="chip chip--red mb-4" style="display: inline-flex;">
              {{ getPhaseLabel(activeCycle.phase) }} · {{ activeCycle.keyword }}
            </span>
            <h2 class="text-h4 font-black mb-4 line-height-tight">{{ activeCycle.keyword }}</h2>
            <p class="text-body-2 font-medium opacity-90" style="max-width: 500px;">
              {{ activeCycle.description }}
            </p>
          </div>

          <div class="hero-info-card">
            <div class="text-white text-subtitle-2 font-bold mb-3 flex items-center gap-2">
              <i class="mdi mdi-account-group"></i> 현재 {{ activeCycle.participantCount || 0 }}명 참여중
            </div>
            <div class="hero-avatars mb-5">
              <template v-if="activeCycle.recentParticipantUids && activeCycle.recentParticipantUids.length > 0">
                <div 
                  v-for="(uid, idx) in activeCycle.recentParticipantUids" 
                  :key="uid" 
                  class="avatar avatar--sm avatar--stacked"
                  :style="{ zIndex: 10 - idx }"
                >
                  <img :src="getProfileImagePath(resolveUser(uid).profileImageId)" alt="profile" />
                </div>
              </template>
              <template v-else>
                <div v-for="i in 3" :key="'mock-' + i" class="avatar avatar--sm avatar--stacked" :class="getHeroFallbackClass(i)">
                  <i class="mdi mdi-account" style="font-size: 0.8rem;"></i>
                </div>
              </template>
              <div v-if="(activeCycle.participantCount || 0) > (activeCycle.recentParticipantUids?.length || 0)" class="avatar avatar--sm avatar--white avatar--stacked">
                <span class="text-blue-dark" style="font-size: 0.7rem;">+{{ (activeCycle.participantCount || 0) - (activeCycle.recentParticipantUids?.length || 0) }}</span>
              </div>
            </div>
            <button 
              class="btn btn--block font-black" 
              :class="myParticipation ? 'btn--success' : 'btn--white'"
              @click="router.push('/cycles')"
            >
              {{ myParticipation ? '참여 중' : '참여하기' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 스켈레톤 (히어로) -->
    <div v-else-if="cycleLoading" class="skeleton mb-10" style="height: 300px; border-radius: 24px;"></div>

    <!-- 핫한 독서 모임 현황 (도서 추천 최신 3개) -->
    <div class="mb-10">
      <div class="flex justify-between items-center mb-4 px-1">
        <h3 class="text-h6 font-black text-grey-dark flex items-center gap-2">
          🔥 지금 핫한 독서 추천 <span class="text-caption text-grey-2 font-medium">최신순</span>
        </h3>
        <button class="btn btn--text text-grey-2 font-bold" @click="router.push('/recommend')">전체보기</button>
      </div>

      <div class="scroll-x gap-6 py-2">
        <div v-if="boardLoading" v-for="i in 3" :key="`skel-book-${i}`" class="card book-card-skeleton">
          <div class="skeleton" style="height: 100%; border-radius: 16px;"></div>
        </div>
        
        <div v-else-if="latestRecommendations.length > 0" v-for="post in latestRecommendations" :key="post.id" class="card book-card hover-shadow" @click="router.push(`/board/${post.id}`)">
          <div class="card-body flex flex-col h-full">
            <div class="flex justify-between items-start mb-4">
              <span class="chip chip--blue-lt">{{ post.bookGenre || '도서 추천' }}</span>
              <span class="text-[11px] text-grey-3 font-bold">{{ formatDate(post.createdAt) }}</span>
            </div>
            
            <div class="flex items-start flex-grow mb-4">
              <div class="book-thumb mr-4 overflow-hidden bg-grey-100">
                <img v-if="post.attachedBook?.thumbnail" :src="post.attachedBook.thumbnail" alt="cover" class="w-full h-full object-cover" />
                <i v-else class="mdi mdi-book-open-variant text-grey-300"></i>
              </div>
              <div class="min-w-0 flex-grow">
                <h4 class="text-body-1 font-black text-grey-dark line-clamp-2 mb-1">{{ post.title }}</h4>
                <p class="text-caption text-grey-2 line-clamp-1">
                  {{ post.attachedBook?.title || '정보 없음' }}
                </p>
              </div>
            </div>
            
            <p class="text-body-2 text-grey-2 line-clamp-2 mb-0 opacity-80" style="min-height: 3em;">
              {{ post.content?.replace(/<[^>]*>/g, '') }}
            </p>
          </div>
        </div>

        <div v-else-if="!boardLoading" class="card w-full pa-10 text-center border-dashed">
          <p class="text-body-2 text-grey-3">최근 등록된 추천 도서가 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- 실시간 멤버 소식 (Restored & Fixed) -->
    <div class="mb-12">
      <h3 class="text-h6 font-black text-grey-dark mb-4 flex items-center gap-2 px-1">
        💬 실시간 멤버 소식
      </h3>
      <div class="card shadow-sm border-0 overflow-hidden">
        <ul class="list pa-0">
          <template v-for="(activity, i) in activities" :key="activity.id">
            <li class="list-item activity-item hover:bg-grey-50 transition-colors" @click="router.push(activity.link)">
              <template v-for="user in [resolveUser(activity.uid)]" :key="'feed_user_' + activity.id">
                <div class="avatar avatar--md border flex-shrink-0 mr-4" :class="getTierAvatarClass(user.tier)">
                  <img :src="getProfileImagePath(user.profileImageId)" alt="profile" />
                </div>
                <div class="flex-grow min-w-0">
                  <div class="text-body-2 text-grey-dark">
                    <span class="font-black mr-1">{{ user.nickname }}</span>
                    <span class="text-grey-2">{{ activity.type === 'POST' ? '님이 새로운 글을 남겼습니다.' : '님이 댓글을 작성했습니다.' }}</span>
                  </div>
                  <div class="text-caption font-bold text-primary-color mt-1 line-clamp-1 opacity-80">
                    "{{ activity.targetTitle }}"
                  </div>
                  <div class="mt-2 text-[10px] text-grey-3 flex items-center gap-2">
                    <span>{{ formatRelativeTime(activity.createdAt) }}</span>
                  </div>
                </div>
                <div class="mdi mdi-chevron-right text-grey-300"></div>
              </template>
            </li>
            <hr v-if="i !== activities.length - 1" class="divider mx-5" />
          </template>

          <li v-if="activities.length === 0 && !feedLoading" class="pa-12 text-center text-grey-3">
            <div class="mdi mdi-chat-sleep mb-2 text-h4 opacity-20"></div>
            <p class="text-body-2 mb-1">아직 활동 소식이 없습니다.</p>
            <p class="text-[11px] opacity-70">새로운 게시글이나 댓글이 작성되면 여기에 표시됩니다!</p>
          </li>

          <li v-if="feedLoading" class="pa-10 text-center">
            <div class="spinner spinner--sm"></div>
          </li>
        </ul>
        
        <div v-if="hasMore" class="card-footer border-t bg-grey-50/50 pa-0">
          <button 
            class="btn btn--text btn--block py-4 text-grey-2 font-bold hover:text-primary-color transition-colors"
            @click="fetchActivities(5, true)"
          >
            활동 더보기 ({{ activities.length }}/20)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useCycle } from '~/composables/useCycle'
import { useBoard } from '~/composables/useBoard'
import { useActivityFeed } from '~/composables/useActivityFeed'
import { useUserMapper } from '~/composables/useUserMapper'
import { getProfileImagePath } from '~/composables/useProfileImages'

const router = useRouter()
const authStore = useAuthStore()
const { fetchActiveCycle, fetchMyParticipation, fetchParticipants, loading: cycleLoading } = useCycle()
const { fetchPosts, loading: boardLoading } = useBoard()
const { activities, loading: feedLoading, hasMore, fetchActivities } = useActivityFeed()
const { resolveUser } = useUserMapper()

const activeCycle = ref(null)
const myParticipation = ref(null)
const latestRecommendations = ref([])

onMounted(async () => {
  // 1. 사이클 데이터 로드 (활성 사이클 & 참여 여부)
  activeCycle.value = await fetchActiveCycle()
  
  if (activeCycle.value) {
    // 하위 호환성용: 참여자 수 동기화
    if (!activeCycle.value.participantCount || activeCycle.value.participantCount === 0) {
      const p = await fetchParticipants(activeCycle.value.id)
      if (p.length > 0) {
        activeCycle.value.participantCount = p.length
      }
    }

    if (authStore.isLoggedIn) {
      myParticipation.value = await fetchMyParticipation(activeCycle.value.id)
    }
  }

  // 2. 최신 추천 도서 로드 (3개)
  const posts = await fetchPosts('도서 추천')
  latestRecommendations.value = (posts || []).slice(0, 3)

  // 3. 활동 피드 초기 로드
  await fetchActivities(5)
})

watch(() => authStore.user, async (newUser) => {
  if (newUser && activeCycle.value && !myParticipation.value) {
    myParticipation.value = await fetchMyParticipation(activeCycle.value.id)
  }
}, { immediate: true })

// 유틸리티 함수
const getPhaseLabel = (phase) => {
  if (phase === 'phase1_reading' || phase === 'voting') return '개인 도서 진행중'
  if (phase === 'phase2_reading') return '공통 도서 진행중'
  return '모집 중'
}

const getTierAvatarClass = (tier) => {
  if (tier === 'Diamond') return 'avatar--indigo'
  if (tier === 'Platinum') return 'avatar--cyan'
  if (tier === 'Gold') return 'avatar--amber'
  if (tier === 'Silver') return 'avatar--grey'
  return 'avatar--bronze'
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const Y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const D = String(date.getDate()).padStart(2, '0')
  return `${Y}.${M}.${D}`
}

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const diff = Date.now() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${hours}시간 전`
  
  return formatDate(timestamp)
}

const getHeroFallbackClass = (i) => {
  const classes = ['avatar--blue', 'avatar--amber', 'avatar--cyan', 'avatar--indigo']
  return classes[i % classes.length]
}
</script>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
  @media (min-width: 960px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.tier-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-top: 16px;
  border-radius: 16px;
  background: #fff;
  @media (min-width: 960px) { margin-top: 0; }
}

.book-card { 
  width: 320px; 
  flex-shrink: 0; 
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-4px); }
  border: 1px solid #f0f0f0;
}
.book-card-skeleton { width: 320px; height: 180px; flex-shrink: 0; }

.book-thumb {
  width: 64px; height: 90px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.hero-banner {
  position: relative;
  height: 320px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.hero-banner img { width: 100%; height: 100%; object-fit: cover; }
.hero-banner__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);
  display: flex;
  align-items: center;
  padding: 0 40px;
}
.hero-banner__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 40px;
}

.hero-info-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px;
  min-width: 260px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.activity-item { 
  padding: 20px 24px; 
  align-items: center; 
  cursor: pointer;
}

.scroll-x {
  display: flex;
  overflow-x: auto;
  padding-bottom: 8px;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 10px; }
}

.mb-4 { margin-bottom: 16px; }
.mb-10 { margin-bottom: 40px; }
.mb-12 { margin-bottom: 48px; }
.mr-4 { margin-right: 16px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.pa-0 { padding: 0 !important; }
.pa-10 { padding: 40px !important; }
.pa-12 { padding: 48px !important; }
.gap-6 { gap: 24px; }
</style>
