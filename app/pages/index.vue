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
              <div v-for="i in Math.min(activeCycle.participantCount || 0, 4)" :key="i" class="avatar avatar--sm avatar--grey avatar--stacked">
                <i class="mdi mdi-account" style="font-size: 0.8rem;"></i>
              </div>
              <div v-if="(activeCycle.participantCount || 0) > 4" class="avatar avatar--sm avatar--white avatar--stacked">
                <span class="text-blue-dark">+{{ (activeCycle.participantCount || 0) - 4 }}</span>
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
              {{ post.content }}
            </p>
          </div>
        </div>

        <div v-else-if="!boardLoading" class="card w-full pa-10 text-center border-dashed">
          <p class="text-body-2 text-grey-3">최근 등록된 추천 도서가 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- 커뮤니티 대시보드 (활동 피드 대체) -->
    <div class="mb-12">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- 🏆 명예의 전당 (실시간 랭킹 요약) -->
        <div class="flex-grow">
          <h3 class="text-h6 font-black text-grey-dark mb-4 flex items-center gap-2 px-1">
            🏆 이달의 명예의 전당
          </h3>
          <div class="card shadow-sm border-0 pa-6 h-full">
            <div v-if="rankingLoading" class="flex flex-col gap-4">
              <div v-for="i in 3" :key="i" class="skeleton" style="height: 60px; border-radius: 12px;"></div>
            </div>
            <div v-else class="flex flex-col gap-5">
              <div v-for="(user, idx) in topRankers" :key="user.uid" class="flex items-center gap-4 group">
                <div class="rank-num" :class="`rank-${idx+1}`">{{ idx + 1 }}</div>
                <div class="avatar avatar--md" :class="getTierAvatarClass(user.tier)">
                  <img :src="getProfileImagePath(user.profileImageId)" alt="profile" />
                </div>
                <div class="flex-grow min-w-0">
                  <div class="flex justify-between items-end mb-1">
                    <span class="text-body-2 font-black text-grey-dark">{{ user.nickname }}</span>
                    <span class="text-[10px] text-grey-2 font-bold">{{ user.exp }} EXP</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :class="`fill-${idx+1}`" :style="{width: `${Math.min(100, (user.exp / 1000) * 100)}%`}"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ⚡ 퀵 액션 & 내 상태 -->
        <div class="lg:w-[320px]">
          <h3 class="text-h6 font-black text-grey-dark mb-4 flex items-center gap-2 px-1">
            ⚡ 퀵 링크
          </h3>
          <div class="flex flex-col gap-4">
            <button class="action-card action-card--primary" @click="router.push('/write')">
              <div class="action-card__icon"><i class="mdi mdi-pencil-plus"></i></div>
              <div class="text-left">
                <div class="text-body-2 font-black">추천글 작성</div>
                <div class="text-[10px] opacity-80">좋은 책을 동료에게 추천하세요</div>
              </div>
            </button>
            <button class="action-card action-card--secondary" @click="router.push('/cycles')">
              <div class="action-card__icon"><i class="mdi mdi-book-open-page-variant"></i></div>
              <div class="text-left">
                <div class="text-body-2 font-black">독서 리뷰 쓰기</div>
                <div class="text-[10px] opacity-80">이번 사이클 리뷰를 남겨보세요</div>
              </div>
            </button>
            <div v-if="authStore.isLoggedIn" class="card shadow-sm border-0 pa-5 mt-2 bg-primary-lt">
              <div class="text-caption font-bold text-primary-color mb-1">내 성장 목표</div>
              <div class="text-body-2 font-black text-grey-dark mb-3">
                다음 티어까지 {{ 1000 - (authStore.userData?.exp % 1000 || 0) }} EXP 남음!
              </div>
              <div class="progress-bar-bg" style="height: 6px;">
                <div class="progress-bar-fill" :style="{width: `${(authStore.userData?.exp % 1000 || 0) / 10}%`}"></div>
              </div>
            </div>
          </div>
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
import { useRanking } from '~/composables/useRanking'
import { useUserMapper } from '~/composables/useUserMapper'
import { getProfileImagePath } from '~/composables/useProfileImages'

const router = useRouter()
const authStore = useAuthStore()
const { fetchActiveCycle, fetchMyParticipation, fetchParticipants, loading: cycleLoading } = useCycle()
const { fetchPosts, loading: boardLoading } = useBoard()
const { fetchTopUsersByExp, loading: rankingLoading } = useRanking()
const { resolveUser } = useUserMapper()

const activeCycle = ref(null)
const myParticipation = ref(null)
const latestRecommendations = ref([])
const topRankers = ref([])

onMounted(async () => {
  // 1. 사이클 데이터 로드
  activeCycle.value = await fetchActiveCycle()
  
  if (activeCycle.value) {
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

  // 3. 랭킹 데이터 로드 (TOP 3)
  topRankers.value = await fetchTopUsersByExp(3)
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

.rank-num {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900; color: #fff; background: #BDC3C7;
}
.rank-1 { background: #F1C40F; box-shadow: 0 0 12px rgba(241,196,15,0.4); }
.rank-2 { background: #BDC3C7; }
.rank-3 { background: #E67E22; }

.progress-bar-bg { width: 100%; height: 8px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
.fill-1 { background: linear-gradient(90deg, #F1C40F, #F39C12); }
.fill-2 { background: linear-gradient(90deg, #BDC3C7, #95A5A6); }
.fill-3 { background: linear-gradient(90deg, #E67E22, #D35400); }

.action-card {
  display: flex; align-items: center; gap: 16px; width: 100%; padding: 16px 20px;
  border-radius: 18px; border: 0; cursor: pointer; transition: all 0.2s;
  color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.action-card:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
.action-card--primary { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
.action-card--secondary { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
.action-card__icon { 
  width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; font-size: 20px;
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
.pa-6 { padding: 24px !important; }
.bg-primary-lt { background: #eef2ff !important; }
.text-primary-color { color: #4f46e5 !important; }
</style>
