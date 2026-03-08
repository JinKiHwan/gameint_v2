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
                <div v-for="i in 3" :key="'mock-' + i" class="avatar avatar--sm avatar--stacked" :class="getHeroFallbackClass(i - 1)">
                  <i class="mdi mdi-account" style="font-size: 0.8rem;"></i>
                </div>
              </template>
              <div v-if="(activeCycle.participantCount || 0) > (activeCycle.recentParticipantUids?.length || 0 ? activeCycle.recentParticipantUids.length : 3)" class="avatar avatar--sm avatar--white avatar--stacked">
                <span class="text-blue-dark" style="font-size: 0.7rem;">+{{ (activeCycle.participantCount || 0) - (activeCycle.recentParticipantUids?.length || 0 ? activeCycle.recentParticipantUids.length : 3) }}</span>
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

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
        <div v-if="boardLoading" v-for="i in 3" :key="`skel-book-${i}`" class="card book-card-skeleton" style="width: 100%;">
          <div class="skeleton" style="height: 180px; border-radius: 16px;"></div>
        </div>
        
        <div v-else-if="latestRecommendations.length > 0" v-for="post in latestRecommendations" :key="post.id" class="card book-card hover-shadow" style="width: 100%;" @click="router.push(`/board/${post.id}`)">
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

        <div v-else-if="!boardLoading" class="card w-full pa-10 text-center border-dashed lg:col-span-3">
          <p class="text-body-2 text-grey-3">최근 등록된 추천 도서가 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- DNA Showcase (Conveyor Belt Effect) -->
    <div class="mb-12">
      <h3 class="text-h6 font-black text-grey-dark mb-6 flex items-center gap-2 px-1">
        지능형 독서 진단, 당신의 독서 DNA는?
      </h3>
      <div class="dna-conveyor card relative overflow-hidden">
        <div class="dna-conveyor-inner">
          <!-- Double the list for seamless looping -->
          <div v-for="dna in [...dnaTypes, ...dnaTypes]" :key="dna.type + Math.random()" class="dna-item">
             <div class="dna-item-content">
               <div class="dna-icon-wrap" :class="getDnaColorClass(dna.type)">
                 <i :class="`mdi ${dna.icon}`"></i>
               </div>
               <div class="text-center px-4">
                 <div class="text-subtitle-1 font-black text-grey-dark mb-1">{{ dna.name }}</div>
                 <p class="text-caption text-grey-2 font-medium opacity-80">{{ dna.desc }}</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Telegram Contact Button -->
    <div class="mb-16 text-center py-6">
      <p class="text-caption text-grey-2 mb-4 font-bold">동호회 가입이나 궁금한 점이 있으신가요? 👋</p>
      <a href="https://t.me/asp367" target="_blank" class="telegram-btn btn--indigo">
        <i class="mdi mdi-telegram text-h5"></i>
        <span class="font-black ml-2">가입문의 @asp367</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useCycle } from '~/composables/useCycle'
import { useBoard } from '~/composables/useBoard'
import { useUserMapper } from '~/composables/useUserMapper'
import { getProfileImagePath } from '~/composables/useProfileImages'

const router = useRouter()
const authStore = useAuthStore()
const { fetchActiveCycle, fetchMyParticipation, fetchParticipants, loading: cycleLoading } = useCycle()
const { fetchPosts, loading: boardLoading } = useBoard()
const activeCycle = ref(null)
const myParticipation = ref(null)
const latestRecommendations = ref([])

const dnaTypes = [
  { type: 'IE', name: '인간 문학가', desc: '사람의 감정과 삶의 서사에 깊이 몰입하는 독서가', icon: 'mdi-human-greeting' },
  { type: 'IK', name: '세계관 설계자', desc: '지식의 구조를 파악하고 새로운 세계를 상상하는 독서가', icon: 'mdi-pillar' },
  { type: 'IG', name: '인생 서사형', desc: '자신의 삶을 한 편의 예술처럼 가꾸는 독서가', icon: 'mdi-book-open-page-variant' },
  { type: 'KE', name: '철학 탐험가', desc: '세상의 근원적인 원리와 지혜를 탐구하는 독서가', icon: 'mdi-compass-rose' },
  { type: 'KG', name: '전략적 사고가', desc: '실질적인 해법과 지식을 효율적으로 습득하는 독서가', icon: 'mdi-chess-knight' },
  { type: 'KI', name: '스토리 분석가', desc: '이야기 속 숨겨진 의미와 구조를 파악하는 독서가', icon: 'mdi-magnify-scan' },
  { type: 'EE', name: '감성 기록자', desc: '책을 통해 느끼는 감정을 소중히 기록하는 독서가', icon: 'mdi-feather' },
  { type: 'EK', name: '예술 사색가', desc: '아름다운 문장과 예술적 영감을 즐기는 독서가', icon: 'mdi-palette' },
  { type: 'EG', name: '인생 탐색가', desc: '다양한 경험과 지식을 통해 자신을 찾아가는 독서가', icon: 'mdi-map-marker-path' },
  { type: 'GK', name: '인생 전략가', desc: '지식을 바탕으로 더 나은 미래를 설계하는 독서가', icon: 'mdi-trending-up' },
  { type: 'GE', name: '자기 탐구자', desc: '내면의 목소리에 귀를 기울이고 성장하는 독서가', icon: 'mdi-head-heart' },
  { type: 'GG', name: '목표 설계자', desc: '뚜렷한 목적을 가지고 지식을 습득하고 실천하는 독서가', icon: 'mdi-target' },
  { type: 'KK', name: '지식 수집가', desc: '폭넓은 분야의 깊이 있는 지식을 쌓는 것에 즐거움을 느끼는 독서가', icon: 'mdi-database' },
  { type: 'II', name: '몰입 독서가', desc: '한 권의 책에 깊이 빠져들어 작가의 의도와 하나가 되는 독서가', icon: 'mdi-focus-field' },
  { type: 'BALANCED', name: '균형 독서가', desc: '다양한 분야를 골고루 섭렵하며 균형 잡힌 시각을 가진 독서가', icon: 'mdi-scale-balance' },
]

onMounted(async () => {
  // 1. 사이클 데이터 로드
  activeCycle.value = await fetchActiveCycle()
  
  if (activeCycle.value) {
    if (!activeCycle.value.participantCount || activeCycle.value.participantCount === 0) {
      const p = await fetchParticipants(activeCycle.value.id)
      if (p.length > 0) activeCycle.value.participantCount = p.length
    }
    if (authStore.isLoggedIn) {
      myParticipation.value = await fetchMyParticipation(activeCycle.value.id)
    }
  }

  // 2. 최신 추천 도서 로드
  const posts = await fetchPosts('도서 추천')
  latestRecommendations.value = (posts || []).slice(0, 3)
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
  const classes = ['avatar--blue', 'avatar--amber', 'avatar--teal', 'avatar--indigo']
  return classes[i % classes.length]
}

const getDnaColorClass = (type) => {
  if (type.includes('I')) return 'dna-blue'
  if (type.includes('K')) return 'dna-indigo'
  if (type.includes('G')) return 'dna-amber'
  if (type.includes('E')) return 'dna-cyan'
  return 'dna-grey'
}
</script>

<script>
import { onBeforeUnmount } from 'vue'
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

.dna-conveyor {
  height: 240px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border: 1px solid #edf0ff;
  display: flex;
  align-items: center;
}
.dna-conveyor-inner {
  display: flex;
  width: max-content;
  animation: infiniteScroll 60s linear infinite;
  &:hover {
    animation-play-state: paused;
  }
}
.dna-item {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dna-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.dna-icon-wrap {
  width: 70px;
  height: 70px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}

@keyframes infiniteScroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); } /* Since we doubled the items */
}

.telegram-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 48px;
  background: #3949ab;
  color: white;
  border-radius: 20px;
  text-decoration: none;
  box-shadow: 0 10px 30px rgba(57, 73, 171, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 15px 40px rgba(57, 73, 171, 0.4);
    background: #303f9f;
  }
}

/* DNA Color Classes */
.dna-blue { background: #E3F2FD; color: #1E88E5; }
.dna-amber { background: #FFF8E1; color: #FFB300; }
.dna-cyan { background: #E0F7FA; color: #00ACC1; }
.dna-indigo { background: #E8EAF6; color: #3949AB; }
.dna-grey { background: #F5F5F5; color: #757575; }

.mb-16 { margin-bottom: 64px; }
.gap-6 { gap: 24px; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 960px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:col-span-3 { grid-column: span 3 / span 3; }
}
</style>
