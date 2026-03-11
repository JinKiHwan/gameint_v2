<template>
  <div class="ranking-page fade-in">
    <!-- ① 히어로 배너 (cycles.vue와 동일한 글래스모피즘 스타일) -->
    <div class="cycles-hero mb-8">
      <img
        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
        alt="명예의 전당 배너"
        class="cycles-hero__bg"
      />
      <div class="cycles-hero__overlay">
        <div class="cycles-hero__glass">
          <div class="text-caption font-bold text-white mb-2 opacity-90 text-center">HALL OF FAME</div>
          <h1 class="text-h4 font-black text-white mb-1 text-center">명예의 전당 🏆</h1>
          <p class="text-body-2 text-white opacity-80 text-center">이번 달 가장 멋진 활약을 보여준 멤버들입니다.</p>
        </div>
      </div>
    </div>

    <div class="container pb-24">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="text-center py-20">
        <div class="spinner spinner--lg mb-4"></div>
        <p class="text-body-2 font-bold text-grey-2">실시간 랭킹 데이터를 집계 중입니다...</p>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="card pa-10 text-center border-red-lt">
        <i class="mdi mdi-alert-circle-outline text-red mb-4" style="font-size: 3rem;"></i>
        <h3 class="text-h6 font-bold text-grey-dark mb-2">{{ error }}</h3>
        <p class="text-body-2 text-grey-2 mb-6">Firestore 색인이 생성 중일 수 있습니다. (약 1분 소요)</p>
        <button class="btn btn--primary px-8 rounded-sm" @click="loadData">다시 시도</button>
      </div>

      <div v-else class="ranking-grid">
        <!-- 1. 선정왕 -->
        <div class="ranking-card card">
          <div class="ranking-card__header pb-6 border-b border-white/20">
            <div class="icon-wrap bg-amber-500/10 text-amber-500 mb-4">
              <i class="mdi mdi-crown text-h4"></i>
            </div>
            <h2 class="text-h6 font-black text-grey-dark">선정왕</h2>
            <p class="text-[11px] text-grey-2 font-medium">이번 달 가장 많은 책이 선정된 멤버</p>
          </div>
          <div class="ranking-card__list pt-4">
            <div v-for="(u, idx) in selectionKings" :key="u.uid" class="ranking-item cursor-pointer" @click="openProfileModal(u.uid)">
              <div class="ranking-item__rank" :class="`rank-${idx+1}`">{{ idx + 1 }}</div>
              <div class="avatar avatar--sm">
                <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
              </div>
              <div class="ranking-item__info">
                <div class="text-subtitle-2 font-bold text-grey-dark leading-tight">{{ u.nickname }}</div>
                <div class="text-[10px] font-bold" :class="getTierTextClass(u.tier)">{{ u.tier || 'Bronze' }}</div>
              </div>
              <div class="ranking-item__value">
                <span class="num text-amber-600">{{ u.selectionCount || 0 }}</span>
                <span class="unit">회</span>
              </div>
            </div>
            <div v-if="selectionKings.length === 0" class="empty-state">집계 전</div>
          </div>
        </div>

        <!-- 2. 성실왕 -->
        <div class="ranking-card card">
          <div class="ranking-card__header pb-6 border-b border-white/20">
            <div class="icon-wrap bg-green-500/10 text-green-600 mb-4">
              <i class="mdi mdi-medal text-h4"></i>
            </div>
            <h2 class="text-h6 font-black text-grey-dark">성실왕</h2>
            <p class="text-[11px] text-grey-2 font-medium">게시글과 댓글로 활발히 소통한 멤버</p>
          </div>
          <div class="ranking-card__list pt-4">
            <div v-for="(u, idx) in diligenceKings" :key="u.uid" class="ranking-item cursor-pointer" @click="openProfileModal(u.uid)">
              <div class="ranking-item__rank" :class="`rank-${idx+1}`">{{ idx + 1 }}</div>
              <div class="avatar avatar--sm">
                <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
              </div>
              <div class="ranking-item__info">
                <div class="text-subtitle-2 font-bold text-grey-dark leading-tight">{{ u.nickname }}</div>
                <div class="text-[10px] font-bold text-grey-2">포스트 {{ u.postCount || 0 }} · 댓글 {{ u.commentCount || 0 }}</div>
              </div>
              <div class="ranking-item__value">
                <span class="num text-green-600">{{ u.activityCount || 0 }}</span>
                <span class="unit">점</span>
              </div>
            </div>
            <div v-if="diligenceKings.length === 0" class="empty-state">집계 전</div>
          </div>
        </div>

        <!-- 3. 공감왕 -->
        <div class="ranking-card card">
          <div class="ranking-card__header pb-6 border-b border-white/20">
            <div class="icon-wrap bg-red-500/10 text-red-500 mb-4">
              <i class="mdi mdi-heart text-h4"></i>
            </div>
            <h2 class="text-h6 font-black text-grey-dark">공감왕</h2>
            <p class="text-[11px] text-grey-2 font-medium">작성한 글이 가장 많은 좋아요를 받은 멤버</p>
          </div>
          <div class="ranking-card__list pt-4">
            <div v-for="(u, idx) in empathyKings" :key="u.uid" class="ranking-item cursor-pointer" @click="openProfileModal(u.uid)">
              <div class="ranking-item__rank" :class="`rank-${idx+1}`">{{ idx + 1 }}</div>
              <div class="avatar avatar--sm">
                <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
              </div>
              <div class="ranking-item__info">
                <div class="text-subtitle-2 font-bold text-grey-dark leading-tight">{{ u.nickname }}</div>
                <div class="text-[10px] font-bold" :class="getTierTextClass(u.tier)">{{ u.tier || 'Bronze' }}</div>
              </div>
              <div class="ranking-item__value">
                <span class="num text-red-600">{{ u.likesReceivedCount || 0 }}</span>
                <span class="unit">개</span>
              </div>
            </div>
            <div v-if="empathyKings.length === 0" class="empty-state">집계 전</div>
          </div>
        </div>
      </div>

    </div>



  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useRanking } from '~/composables/useRanking'
import { getProfileImagePath } from '~/composables/useProfileImages'
import { EXP_CONFIG } from '~/utils/expConfig'
import { useProfileModalStore } from '~/stores/profileModal'

const router = useRouter()
const authStore = useAuthStore()
const { loading, error, fetchTopUsersByCategory } = useRanking()
const profileModalStore = useProfileModalStore()

const openProfileModal = (uid) => {
  if (uid) profileModalStore.openModal(uid)
}

const selectionKings = ref([])
const diligenceKings = ref([])
const empathyKings = ref([])

const loadData = async () => {
  const [s, d, e] = await Promise.all([
    fetchTopUsersByCategory('selection', 3),
    fetchTopUsersByCategory('activity', 3),
    fetchTopUsersByCategory('empathy', 3)
  ])
  selectionKings.value = s
  diligenceKings.value = d
  empathyKings.value = e
}

const userExpPercent = computed(() => {
  if (!authStore.userData) return 0
  const level = authStore.userData.level || 1
  const nextExp = EXP_CONFIG.getNextLevelExp(level + 1)
  return Math.min(((authStore.userData.exp || 0) / nextExp) * 100, 100)
})

const getTierTextClass = (tier) => {
  if (!tier) return 'text-amber-600'
  const t = tier.toLowerCase()
  if (t.includes('bronze')) return 'text-amber-800'
  if (t.includes('silver')) return 'text-slate-500'
  if (t.includes('gold')) return 'text-amber-600'
  if (t.includes('platinum')) return 'text-teal-600'
  if (t.includes('diamond')) return 'text-indigo-600'
  if (t.includes('master'))   return 'text-indigo-800'
  if (t.includes('grandmaster')) return 'text-red-600'
  if (t.includes('challenger')) return 'text-grey-darken-3'
  return 'text-amber-600'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background: var(--bg-light);
}

/* 컨테이너 패딩 조정 (32px 0) */
.ranking-page :deep(.container) {
  padding: 32px 0 !important;
}

/* ── 히어로 배너 (cycles.vue 스타일링) ──────────────────────────── */
.cycles-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.cycles-hero__bg {
  width: 100%;
  height: 280px;
  object-fit: cover;
  display: block;
}
.cycles-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 25, 41, 0.8) 0%, rgba(10, 25, 41, 0.3) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.cycles-hero__glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 600px;
}

/* ── 랭킹 그리드 (가로 정렬 강제) ────────────────────────── */
.ranking-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 960px) {
  .ranking-grid {
    grid-template-columns: repeat(3, 1fr); /* 960px 이하에서도 가로 유지 시도 */
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .ranking-grid {
    grid-template-columns: 1fr; /* 모바일에서만 세로 */
  }
}

/* ── 랭킹 카드 (Glassmorphism 고도화) ────────────────────────── */
.ranking-card.card {
  background: rgba(255, 255, 255, 0.7) !important; /* 투명도를 낮춰 가독성 확보 */
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 28px;
  padding: 32px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 10px 40px rgba(0,0,0,0.06);
}
.ranking-card:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0 20px 50px rgba(0,0,0,0.1);
}
.ranking-card__header {
  padding: 0 24px 20px;
}
.icon-wrap {
  width: 52px; height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* ── 리스트 로우 ──────────────────────────── */
.ranking-card__list {
  padding: 20px 5px 0; /* 사용자 요청: 20px 5px 0 */
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 5px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  gap: 12px;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.8);
}
.ranking-item:hover {
  background: #ffffff;
  transform: scale(1.02);
  box-shadow: var(--shadow-sm);
}

.ranking-item__rank {
  width: 24px;
  font-size: 1.125rem;
  font-weight: 900;
  font-style: italic;
  font-family: 'Montserrat', sans-serif;
}
.rank-1 { color: #FFB300; text-shadow: 0 0 10px rgba(255,179,0,0.2); }
.rank-2 { color: #94A3B8; }
.rank-3 { color: #B45309; }

.ranking-item__info {
  flex: 1;
  text-align: left;
}
.ranking-item__value {
  text-align: right;
  line-height: 1;
}
.ranking-item__value .num {
  font-size: 1.25rem;
  font-weight: 900;
}
.ranking-item__value .unit {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94A3B8;
  margin-left: 2px;
}

.empty-state {
  padding: 40px 0;
  color: #CBD5E1;
  font-size: 0.875rem;
  font-weight: 700;
}

@media (max-width: 600px) {
  .cycles-hero__bg { height: 220px; }
  .cycles-hero__glass { padding: 20px; }
  .ranking-card.card { padding: 24px 0; border-radius: 20px; }
  .ranking-card__header { padding: 0 20px 20px; }
}


</style>
