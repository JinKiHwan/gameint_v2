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

    <div class="container mx-auto px-4 pb-24">
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

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- 1. 선정왕 -->
        <div class="ranking-card bg-white">
          <div class="ranking-card__header pb-6 border-b">
            <div class="icon-wrap bg-amber-50 text-amber-500 mb-4">
              <i class="mdi mdi-crown text-h4"></i>
            </div>
            <h2 class="text-h6 font-black text-grey-dark">선정왕</h2>
            <p class="text-caption text-grey-2">이번 달 가장 많은 책이 선정된 멤버</p>
          </div>
          <div class="ranking-card__list pt-4">
            <div v-for="(u, idx) in selectionKings" :key="u.uid" class="ranking-item">
              <div class="ranking-item__rank" :class="`rank-${idx+1}`">{{ idx + 1 }}</div>
              <div class="avatar avatar--sm">
                <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
              </div>
              <div class="ranking-item__info">
                <div class="text-subtitle-2 font-black text-grey-dark">{{ u.nickname }}</div>
                <div class="text-[10px] font-bold" :class="getTierTextClass(u.tier)">{{ u.tier || 'Bronze' }}</div>
              </div>
              <div class="ranking-item__value">
                <span class="num text-amber-700">{{ u.selectionCount || 0 }}</span>
                <span class="unit">회</span>
              </div>
            </div>
            <div v-if="selectionKings.length === 0" class="empty-state">집계된 데이터가 없습니다.</div>
          </div>
        </div>

        <!-- 2. 성실왕 -->
        <div class="ranking-card bg-white">
          <div class="ranking-card__header pb-6 border-b">
            <div class="icon-wrap bg-green-50 text-green-600 mb-4">
              <i class="mdi mdi-medal text-h4"></i>
            </div>
            <h2 class="text-h6 font-black text-grey-dark">성실왕</h2>
            <p class="text-caption text-grey-2">게시글과 댓글로 활발히 소통한 멤버</p>
          </div>
          <div class="ranking-card__list pt-4">
            <div v-for="(u, idx) in diligenceKings" :key="u.uid" class="ranking-item">
              <div class="ranking-item__rank" :class="`rank-${idx+1}`">{{ idx + 1 }}</div>
              <div class="avatar avatar--sm">
                <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
              </div>
              <div class="ranking-item__info">
                <div class="text-subtitle-2 font-black text-grey-dark">{{ u.nickname }}</div>
                <div class="text-[10px] font-bold text-grey-2">포스트 {{ u.postCount || 0 }} · 댓글 {{ u.commentCount || 0 }}</div>
              </div>
              <div class="ranking-item__value">
                <span class="num text-green-700">{{ u.activityCount || 0 }}</span>
                <span class="unit">점</span>
              </div>
            </div>
            <div v-if="diligenceKings.length === 0" class="empty-state">집계된 데이터가 없습니다.</div>
          </div>
        </div>

        <!-- 3. 공감왕 -->
        <div class="ranking-card bg-white">
          <div class="ranking-card__header pb-6 border-b">
            <div class="icon-wrap bg-red-50 text-red-500 mb-4">
              <i class="mdi mdi-heart text-h4"></i>
            </div>
            <h2 class="text-h6 font-black text-grey-dark">공감왕</h2>
            <p class="text-caption text-grey-2">작성한 글이 가장 많은 좋아요를 받은 멤버</p>
          </div>
          <div class="ranking-card__list pt-4">
            <div v-for="(u, idx) in empathyKings" :key="u.uid" class="ranking-item">
              <div class="ranking-item__rank" :class="`rank-${idx+1}`">{{ idx + 1 }}</div>
              <div class="avatar avatar--sm">
                <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
              </div>
              <div class="ranking-item__info">
                <div class="text-subtitle-2 font-black text-grey-dark">{{ u.nickname }}</div>
                <div class="text-[10px] font-bold" :class="getTierTextClass(u.tier)">{{ u.tier || 'Bronze' }}</div>
              </div>
              <div class="ranking-item__value">
                <span class="num text-red-700">{{ u.likesReceivedCount || 0 }}</span>
                <span class="unit">개</span>
              </div>
            </div>
            <div v-if="empathyKings.length === 0" class="empty-state">집계된 데이터가 없습니다.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 내 랭킹 스티키 바 -->
    <div v-if="authStore.userData" class="my-rank-sticky">
      <div class="container mx-auto px-4 h-full flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="avatar avatar--xs">
            <img :src="getProfileImagePath(authStore.userData.profileImageId)" alt="my profile" />
          </div>
          <div class="hidden sm:block">
            <div class="text-caption font-black text-white">{{ authStore.userData.nickname }}</div>
            <div class="text-[10px] text-white opacity-70">{{ authStore.userData.tier }} · {{ authStore.userData.exp }} EXP</div>
          </div>
        </div>
        <div class="flex-grow mx-8">
          <div class="progress-bar progress-bar--sm bg-white/20">
            <div class="progress-bar__fill bg-amber-400" :style="`width: ${userExpPercent}%`"></div>
          </div>
        </div>
        <div>
          <button class="btn btn--white btn--sm rounded-xl px-4 font-black" @click="router.push('/mypage')">마이페이지</button>
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

const router = useRouter()
const authStore = useAuthStore()
const { loading, error, fetchTopUsersByCategory } = useRanking()

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

/* ── 랭킹 카드 ────────────────────────────── */
.ranking-card {
  border-radius: 24px;
  padding: 32px 0;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(0,0,0,0.04);
  text-align: center;
  display: flex;
  flex-direction: column;
}
.ranking-card__header {
  padding: 0 32px 24px;
}
.icon-wrap {
  width: 64px; height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

/* ── 리스트 로우 ──────────────────────────── */
.ranking-card__list {
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 16px;
  background: #fafafa;
  gap: 12px;
  transition: all 0.2s ease;
}
.ranking-item:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.ranking-item__rank {
  width: 24px;
  font-size: 1.125rem;
  font-weight: 900;
  font-style: italic;
}
.rank-1 { color: #FFD700; }
.rank-2 { color: #C0C0C0; }
.rank-3 { color: #CD7F32; }

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
  color: #999;
  margin-left: 2px;
}

.empty-state {
  padding: 40px 0;
  color: #bbb;
  font-size: 0.875rem;
  font-weight: 600;
}

/* ── 스티키 바 ────────────────────────────── */
.my-rank-sticky {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 70px;
  background: rgba(33, 33, 33, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
  border-top: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
}

@media (max-width: 600px) {
  .cycles-hero__bg { height: 220px; }
  .cycles-hero__glass { padding: 20px; }
  .ranking-card { padding: 24px 0; }
  .ranking-card__header { padding: 0 20px 20px; }
  .my-rank-sticky { bottom: 0px; }
}
</style>
