<template>
  <div class="ranking-page fade-in">
    <!-- 히어로 섹션 (다른 페이지와 표준화) -->
    <div class="cycles-hero mb-6">
      <img
        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
        alt="명예의 전당 배너"
        class="cycles-hero__bg"
      />
      <div class="cycles-hero__overlay">
        <div class="cycles-hero__glass">
          <div class="text-caption font-bold text-white mb-2 opacity-90">HALL OF FAME</div>
          <h1 class="text-h4 font-black text-white mb-2">명예의 전당 🏆</h1>
          <p class="text-body-2 text-white opacity-80">독서 동호회의 열정적인 상위 10명을 소개합니다.</p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 pb-24">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="text-center py-20">
        <div class="spinner spinner--lg mb-4"></div>
        <p class="text-body-2 font-bold text-grey-2">랭킹 데이터를 불러오고 있습니다...</p>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="card pa-10 text-center border-red-lt">
        <i class="mdi mdi-alert-circle-outline text-red mb-4" style="font-size: 3rem;"></i>
        <h3 class="text-h6 font-bold text-grey-dark mb-2">{{ error }}</h3>
        <p class="text-body-2 text-grey-2 mb-6">Firestore 색인이 생성 중일 수 있습니다. 잠시 후 다시 시도해 주세요.</p>
        <button class="btn btn--primary px-8 rounded-sm" @click="loadData">다시 시도</button>
      </div>

      <div v-else>
        <!-- Top 3 포디움 (단상) UI -->
        <div class="podium-section mb-12">
          <div class="podium">
            <!-- 2위 -->
            <div v-if="topUsers[1]" class="podium-item podium-item--2nd">
              <template v-for="u in [resolveUser(topUsers[1].uid, topUsers[1])]" :key="'rank_2'">
                <div class="podium-item__rank">2</div>
                <div class="podium-avatar-wrap">
                  <img :src="getProfileImagePath(u.profileImageId)" class="podium-avatar" alt="2nd profile" />
                  <div class="tier-badge" :class="getTierClass(u.tier)">
                    <i class="mdi mdi-trophy"></i>
                  </div>
                </div>
                <div class="podium-info mt-2">
                  <div class="podium-name line-clamp-1 text-subtitle-2 font-black">{{ u.nickname }}</div>
                  <div class="podium-dna text-caption font-bold opacity-70">{{ u.dna?.dnaName || '분석 중' }}</div>
                  <div class="podium-exp text-body-2 font-black text-primary-color mt-1">{{ u.exp || 0 }} EXP</div>
                </div>
              </template>
              <div class="podium-base"></div>
            </div>

            <!-- 1위 -->
            <div v-if="topUsers[0]" class="podium-item podium-item--1st">
              <template v-for="u in [resolveUser(topUsers[0].uid, topUsers[0])]" :key="'rank_1'">
                <div class="podium-item__rank">
                  <i class="mdi mdi-crown text-amber-400"></i>
                </div>
                <div class="podium-avatar-wrap">
                  <img :src="getProfileImagePath(u.profileImageId)" class="podium-avatar" alt="1st profile" />
                  <div class="tier-badge" :class="getTierClass(u.tier)">
                    <i class="mdi mdi-trophy"></i>
                  </div>
                </div>
                <div class="podium-info">
                  <div class="podium-name line-clamp-1 text-amber-500 font-black">{{ u.nickname }}</div>
                  <div class="podium-dna">{{ u.dna?.dnaName || '분석 중' }}</div>
                  <div class="podium-exp text-h6 font-black">{{ u.exp || 0 }} EXP</div>
                </div>
              </template>
              <div class="podium-base"></div>
            </div>

            <!-- 3위 -->
            <div v-if="topUsers[2]" class="podium-item podium-item--3rd">
              <template v-for="u in [resolveUser(topUsers[2].uid, topUsers[2])]" :key="'rank_3'">
                <div class="podium-item__rank">3</div>
                <div class="podium-avatar-wrap">
                  <img :src="getProfileImagePath(u.profileImageId)" class="podium-avatar" alt="3rd profile" />
                  <div class="tier-badge" :class="getTierClass(u.tier)">
                    <i class="mdi mdi-trophy"></i>
                  </div>
                </div>
                <div class="podium-info mt-2">
                  <div class="podium-name line-clamp-1 text-subtitle-2 font-black">{{ u.nickname }}</div>
                  <div class="podium-dna text-caption font-bold opacity-70">{{ u.dna?.dnaName || '분석 중' }}</div>
                  <div class="podium-exp text-body-2 font-black text-primary-color mt-1">{{ u.exp || 0 }} EXP</div>
                </div>
              </template>
              <div class="podium-base"></div>
            </div>
          </div>
        </div>

        <!-- 4위 ~ 10위 리스트 -->
        <div class="card ranking-list-card">
          <div class="card-body pa-0">
            <div class="ranking-list-header flex items-center px-6 py-4 border-b bg-grey-50 text-grey-2 text-body-2 font-bold">
              <span class="w-12 text-center">순위</span>
              <span class="flex-grow ml-4">멤버</span>
              <span class="w-24 text-right">경험치</span>
            </div>
            <div v-for="(user, index) in topUsers.slice(3)" :key="user.uid" class="ranking-item flex items-center px-6 py-4 border-b last:border-0 hover:bg-grey-50 transition-colors">
              <div class="w-12 text-center font-bold text-grey-dark">{{ index + 4 }}위</div>
              <template v-for="u in [resolveUser(user.uid, user)]" :key="'rank_' + user.uid">
                <div class="flex items-center flex-grow ml-4 min-w-0">
                  <div class="avatar avatar--sm flex-shrink-0">
                    <img :src="getProfileImagePath(u.profileImageId)" alt="profile" />
                  </div>
                  <div class="ml-3 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-subtitle-1 font-black text-grey-dark line-clamp-1">{{ u.nickname }}</span>
                      <span :class="`chip chip--xs chip--${getTierChipClass(u.tier)}`">{{ u.tier || 'Bronze' }}</span>
                    </div>
                    <div class="text-caption font-bold text-grey-2">{{ u.dna?.dnaName || '독서 DNA 분석 중' }}</div>
                  </div>
                </div>
              </template>
              <div class="w-24 text-right font-black text-blue-dark">{{ user.exp || 0 }} <span class="text-caption text-grey-3 font-medium">EXP</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 내 랭킹 스티키 바 -->
    <div v-if="authStore.userData" class="my-rank-sticky">
      <div class="container mx-auto px-4 h-full flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="my-rank-num">
            {{ userRank > 0 ? `${userRank}위` : '-' }}
          </div>
          <template v-for="me in [resolveUser(authStore.userData.uid, authStore.userData)]" :key="'my_rank_sticky'">
            <div class="flex items-center gap-3">
              <div class="avatar avatar--xs">
                <img :src="getProfileImagePath(me.profileImageId)" alt="my profile" />
              </div>
              <div>
                <div class="text-caption font-black text-white line-clamp-1">{{ me.nickname }}</div>
                <div class="text-[10px] text-white opacity-70">{{ me.tier }} · {{ me.exp }} EXP</div>
              </div>
            </div>
          </template>
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
import { useUserMapper } from '~/composables/useUserMapper'
import { getProfileImagePath } from '~/composables/useProfileImages'
import { EXP_CONFIG } from '~/utils/expConfig'

const router = useRouter()
const authStore = useAuthStore()
const { loading, error, topUsers, fetchTopUsersByExp } = useRanking()
const { resolveUser } = useUserMapper()

const loadData = async () => {
  await fetchTopUsersByExp(10)
}

const userRank = computed(() => {
  if (!authStore.userData) return 0
  const index = topUsers.value.findIndex(u => u.uid === authStore.userData.uid)
  return index !== -1 ? index + 1 : 0
})

const userExpPercent = computed(() => {
  if (!authStore.userData) return 0
  const level = authStore.userData.level || 1
  const nextExp = EXP_CONFIG.getNextLevelExp(level + 1)
  return Math.min(((authStore.userData.exp || 0) / nextExp) * 100, 100)
})

const getTierClass = (tier) => {
  if (!tier) return 'tier--bronze'
  const t = tier.toLowerCase()
  if (t.includes('bronze')) return 'tier--bronze'
  if (t.includes('silver')) return 'tier--silver'
  if (t.includes('gold')) return 'tier--gold'
  if (t.includes('platinum')) return 'tier--platinum'
  if (t.includes('diamond')) return 'tier--diamond'
  if (t.includes('master')) return 'tier--master'
  if (t.includes('grandmaster')) return 'tier--grandmaster'
  if (t.includes('challenger')) return 'tier--challenger'
  return 'tier--bronze'
}

const getTierChipClass = (tier) => {
  if (!tier) return 'amber'
  const t = tier.toLowerCase()
  if (t.includes('bronze')) return 'amber'
  if (t.includes('silver')) return 'grey-lt'
  if (t.includes('gold')) return 'amber'
  if (t.includes('platinum')) return 'teal'
  if (t.includes('diamond')) return 'indigo'
  if (t.includes('master'))   return 'indigo-tonal'
  if (t.includes('grandmaster')) return 'red'
  if (t.includes('challenger')) return 'grey'
  return 'amber'
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

/* ── 히어로 배너 ──────────────────────────── */
.cycles-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.cycles-hero__bg {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
}
.cycles-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 25, 41, 0.85) 0%, rgba(10, 25, 41, 0.3) 60%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 32px;
  @media (max-width: 600px) { padding: 20px; }
}
.cycles-hero__glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 20px 24px;
  width: 100%;
}

/* ── 포디움 ──────────────────────────────── */
.podium-section {
  display: flex;
  justify-content: center;
  margin-top: -40px;
}
.podium {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  width: 100%;
  max-width: 600px;
  padding: 0 16px;
}

.podium-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.podium-avatar-wrap {
  position: relative;
  margin-bottom: 12px;
  z-index: 2;
}

.podium-avatar {
  width: 70px; height: 70px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  object-fit: cover;
}

.podium-item--1st .podium-avatar {
  width: 90px; height: 90px;
  border-color: #FFD54F;
}

.podium-item__rank {
  font-size: 1.25rem;
  font-weight: 900;
  margin-bottom: 4px;
}

.tier-badge {
  position: absolute;
  bottom: -4px; right: -4px;
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #fff;
}

.tier--bronze { background: #CD7F32; }
.tier--silver { background: #C0C0C0; }
.tier--gold { background: #FFD700; }
.tier--platinum { background: #E5E4E2; color: #333; }
.tier--diamond { background: #B9F2FF; color: #333; }
.tier--master { background: #3949AB; color: #fff; }
.tier--grandmaster { background: #EF5350; color: #fff; }
.tier--challenger { background: #212121; color: #fff; }

.podium-info {
  text-align: center;
  margin-bottom: 8px;
  z-index: 2;
  line-height: 1.4;
}

.podium-name { font-weight: 800; }
.podium-dna { color: var(--text-grey-2); }
.podium-exp { font-weight: 900; }

.podium-base {
  width: 100%;
  background: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  position: relative;
}

.podium-item--1st .podium-base { height: 120px; background: linear-gradient(to bottom, #fff, #FFF8E1); border: 2px solid #FFECB3; border-bottom: 0; }
.podium-item--2nd .podium-base { height: 80px; }
.podium-item--3rd .podium-base { height: 60px; }

/* ── 리스트 ──────────────────────────────── */
.ranking-list-card {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0,0,0,0.05);
}

.ranking-item:hover {
  cursor: pointer;
}

/* ── 스티키 바 ────────────────────────────── */
.my-rank-sticky {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 70px;
  background: rgba(33, 33, 33, 0.9);
  backdrop-filter: blur(10px);
  z-index: 100;
  color: #fff;
  border-top: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
}

.my-rank-num {
  font-size: 1.1rem;
  font-weight: 900;
  color: #FFD54F;
  min-width: 40px;
}

@media (max-width: 600px) {
  .podium { gap: 8px; }
  .podium-avatar { width: 50px; height: 50px; }
  .podium-item--1st .podium-avatar { width: 70px; height: 70px; }
  .podium-base { border-radius: 8px 8px 0 0; }
  .podium-item--1st .podium-base { height: 100px; }
  .podium-item--2nd .podium-base { height: 60px; }
  .podium-item--3rd .podium-base { height: 40px; }
  .my-rank-sticky { bottom: 60px; } /* 모달 하단 네비게이션 공간 확보 */
}
</style>
