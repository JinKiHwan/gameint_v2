<template>
  <div class="ranking-page fade-in">
    <!-- 히어로 섹션 -->
    <div class="cycles-hero mb-10">
      <img
        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
        alt="명예의 전당 배너"
        class="cycles-hero__bg"
      />
      <div class="cycles-hero__overlay">
        <div class="hero-content text-center w-full">
          <h1 class="text-h3 font-black text-white mb-2">명예의 전당 🏆</h1>
          <p class="text-body-1 text-white opacity-90">이번 달 가장 열정적으로 활동한 멤버들을 소개합니다!</p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 pb-24">
      <!-- 3대 랭킹 카드 레이아웃 -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="spinner spinner--lg"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 1. 선정왕 -->
        <div class="ranking-card ranking-card--selection">
          <div class="ranking-card__header">
            <i class="mdi mdi-crown ranking-card__icon text-amber-400"></i>
            <h2 class="ranking-card__title">선정왕</h2>
            <p class="ranking-card__desc">추천 도서가 가장 많이 선정된 멤버</p>
          </div>
          <div class="ranking-card__list">
            <div v-for="(u, idx) in selectionKings" :key="u.uid" class="ranking-row" :class="{ 'ranking-row--top': idx === 0 }">
              <span class="ranking-row__num" :class="`rank-${idx+1}`">{{ idx + 1 }}</span>
              <div class="ranking-row__user">
                <div class="avatar avatar--sm">
                  <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
                </div>
                <div class="ranking-row__info">
                  <div class="ranking-row__name">{{ u.nickname }}</div>
                  <div class="ranking-row__tier" :class="getTierChipClass(u.tier)">{{ u.tier || 'Bronze' }} Reader</div>
                </div>
              </div>
              <div class="ranking-row__value">{{ u.selectionCount || 0 }}<span class="unit">회</span></div>
            </div>
            <div v-if="selectionKings.length === 0" class="empty-state">데이터가 없습니다.</div>
          </div>
        </div>

        <!-- 2. 성실왕 -->
        <div class="ranking-card ranking-card--activity">
          <div class="ranking-card__header">
            <i class="mdi mdi-medal ranking-card__icon text-green-400"></i>
            <h2 class="ranking-card__title">성실왕</h2>
            <p class="ranking-card__desc">게시글 및 댓글 작성이 활발한 멤버</p>
          </div>
          <div class="ranking-card__list">
            <div v-for="(u, idx) in diligenceKings" :key="u.uid" class="ranking-row" :class="{ 'ranking-row--top': idx === 0 }">
              <span class="ranking-row__num" :class="`rank-${idx+1}`">{{ idx + 1 }}</span>
              <div class="ranking-row__user">
                <div class="avatar avatar--sm">
                  <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
                </div>
                <div class="ranking-row__info">
                  <div class="ranking-row__name">{{ u.nickname }}</div>
                  <div class="ranking-row__tier" :class="getTierChipClass(u.tier)">{{ u.tier || 'Bronze' }} Reader</div>
                </div>
              </div>
              <div class="ranking-row__value">{{ u.activityCount || 0 }}<span class="unit">점</span></div>
            </div>
            <div v-if="diligenceKings.length === 0" class="empty-state">데이터가 없습니다.</div>
          </div>
        </div>

        <!-- 3. 공감왕 -->
        <div class="ranking-card ranking-card--empathy">
          <div class="ranking-card__header">
            <i class="mdi mdi-heart ranking-card__icon text-red-400"></i>
            <h2 class="ranking-card__title">공감왕</h2>
            <p class="ranking-card__desc">작성한 글/리뷰가 좋아요를 많이 받은 멤버</p>
          </div>
          <div class="ranking-card__list">
            <div v-for="(u, idx) in empathyKings" :key="u.uid" class="ranking-row" :class="{ 'ranking-row--top': idx === 0 }">
              <span class="ranking-row__num" :class="`rank-${idx+1}`">{{ idx + 1 }}</span>
              <div class="ranking-row__user">
                <div class="avatar avatar--sm">
                  <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
                </div>
                <div class="ranking-row__info">
                  <div class="ranking-row__name">{{ u.nickname }}</div>
                  <div class="ranking-row__tier" :class="getTierChipClass(u.tier)">{{ u.tier || 'Bronze' }} Reader</div>
                </div>
              </div>
              <div class="ranking-row__value">{{ u.likesReceivedCount || 0 }}<span class="unit">개</span></div>
            </div>
            <div v-if="empathyKings.length === 0" class="empty-state">데이터가 없습니다.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 내 랭킹 스티키 바 -->
    <div v-if="authStore.userData" class="my-rank-sticky">
      <div class="container mx-auto px-4 h-full flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="avatar avatar--sm">
            <img :src="getProfileImagePath(authStore.userData.profileImageId)" alt="my profile" />
          </div>
          <div>
            <div class="text-caption font-black text-white">{{ authStore.userData.nickname }}</div>
            <div class="text-[10px] text-white opacity-70">{{ authStore.userData.tier }} · {{ authStore.userData.exp }} EXP</div>
          </div>
        </div>
        <div class="flex-grow mx-8 hidden sm:block">
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

const getTierChipClass = (tier) => {
  if (!tier) return 'text-amber-500'
  const t = tier.toLowerCase()
  if (t.includes('bronze')) return 'text-amber-700'
  if (t.includes('silver')) return 'text-slate-400'
  if (t.includes('gold')) return 'text-amber-500'
  if (t.includes('platinum')) return 'text-teal-400'
  if (t.includes('diamond')) return 'text-indigo-400'
  if (t.includes('master'))   return 'text-indigo-600'
  if (t.includes('grandmaster')) return 'text-red-500'
  if (t.includes('challenger')) return 'text-grey-900'
  return 'text-amber-500'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background: #0a1929; /* 다크 네이비 배경 */
  color: #fff;
}

/* ── 히어로 배너 ──────────────────────────── */
.cycles-hero {
  position: relative;
  height: 240px;
  overflow: hidden;
}
.cycles-hero__bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
}
.cycles-hero__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, rgba(10, 25, 41, 0.4), #0a1929);
}

/* ── 랭킹 카드 ────────────────────────────── */
.ranking-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px 24px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}
.ranking-card:hover {
  transform: translateY(-8px);
  border-color: rgba(255, 255, 255, 0.2);
}

.ranking-card__header {
  text-align: center;
  margin-bottom: 32px;
}
.ranking-card__icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
  display: block;
}
.ranking-card__title {
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 4px;
}
.ranking-card__desc {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

/* ── 리스트 로우 ──────────────────────────── */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ranking-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  gap: 12px;
}
.ranking-row--top {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ranking-row__num {
  width: 24px;
  font-size: 1.125rem;
  font-weight: 900;
  text-align: center;
}
.rank-1 { color: #fcd34d; } /* Gold */
.rank-2 { color: #94a3b8; } /* Silver */
.rank-3 { color: #b45309; } /* Bronze */

.ranking-row__user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.ranking-row__info {
  line-height: 1.2;
}
.ranking-row__name {
  font-weight: 800;
  font-size: 0.9375rem;
}
.ranking-row__tier {
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.8;
}

.ranking-row__value {
  font-weight: 900;
  font-size: 1.125rem;
  color: #fff;
}
.ranking-row__value .unit {
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 2px;
  opacity: 0.6;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.875rem;
}

/* ── 스티키 바 ────────────────────────────── */
.my-rank-sticky {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 70px;
  background: rgba(10, 25, 41, 0.9);
  backdrop-filter: blur(10px);
  z-index: 100;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .ranking-card { padding: 24px 16px; }
  .my-rank-sticky { bottom: 0; }
}
</style>
