<template>
  <div class="fade-in">
    <!-- 상단 웰컴 & 티어 -->
    <div class="page-header">
      <div>
        <h1 class="text-h5 font-black text-grey-dark mb-1">
          {{ authStore.userData?.nickname || '안녕하세요' }}님, <br class="mobile-br"/>어떤 독서를 시작할까요? 👀
        </h1>
      </div>
      <div class="tier-badge card">
        <div class="avatar avatar--md avatar--amber">
          <i class="mdi mdi-trophy"></i>
        </div>
        <div>
          <div class="text-subtitle-2 font-bold">Bronze Reader</div>
          <div class="text-caption text-grey-2">다음 등급까지 150 EXP</div>
        </div>
      </div>
    </div>

    <!-- 메인 히어로 배너 -->
    <div class="hero-banner mb-10">
      <img
        src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2072&auto=format&fit=crop"
        alt="우주와 독서 배너"
      />
      <div class="hero-banner__overlay">
        <div class="hero-banner__content">
          <div class="text-white">
            <span class="chip chip--red mb-4" style="display: inline-flex;">모집중 · 4월~5월 사이클</span>
            <h2 class="text-h4 font-black mb-4 line-height-tight">기술의 발전과 <br/>인간의 윤리</h2>
            <p class="text-body-2 font-medium opacity-90" style="max-width: 500px;">
              빠르게 발전하는 AI와 생명공학 기술 속에서 우리는 무엇을 잃고 얻게 될까요?
              자유롭게 책을 읽고 인사이트를 나누어 봅시다.
            </p>
          </div>

          <div class="hero-info-card">
            <div class="text-white text-subtitle-2 font-bold mb-3 flex items-center gap-2">
              <i class="mdi mdi-account-group"></i> 현재 42명 참여중
            </div>
            <div class="hero-avatars mb-5">
              <div v-for="i in 4" :key="i" class="avatar avatar--sm avatar--grey avatar--stacked">
                <span>U{{i}}</span>
              </div>
              <div class="avatar avatar--sm avatar--white avatar--stacked">
                <span class="text-blue-dark">+38</span>
              </div>
            </div>
            <button class="btn btn--block" style="background:#fff; color:#1E88E5; font-weight:700;">참여하기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 핫한 독서 모임 -->
    <div class="mb-10">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-h6 font-black text-grey-dark">🔥 지금 핫한 독서 모임 현황</h3>
        <button class="btn btn--text text-grey-2 font-bold">전체보기</button>
      </div>

      <div class="scroll-x">
        <!-- 공동 독서 진행률 카드 -->
        <div class="card book-card">
          <div class="card-body">
            <div class="flex justify-between mb-4">
              <span class="chip chip--grey">이달의 공통 도서</span>
              <span class="text-blue-dark font-bold text-caption">D-12</span>
            </div>
            <div class="flex items-center mb-5">
              <div class="book-thumb book-thumb--blue mr-4">사피엔스</div>
              <div>
                <h4 class="text-subtitle-1 font-bold text-grey-dark">사피엔스</h4>
                <p class="text-caption text-grey-2 mt-1">유발 하라리</p>
              </div>
            </div>
            <div class="progress-sheet">
              <div class="flex justify-between text-caption mb-1">
                <span class="font-bold text-grey-2">전체 완독률</span>
                <span class="font-black text-blue-dark">65%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar__fill" style="width: 65%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 도서 추천 카드들 -->
        <div v-for="(book, i) in trendingBooks" :key="i" class="card book-card">
          <div class="card-body flex flex-col h-full">
            <span :class="`chip mb-4 ${i === 0 ? 'chip--red-lt' : 'chip--blue-lt'}`" style="align-self: flex-start;">{{ book.type }}</span>
            <div class="flex items-center flex-grow mb-4">
              <div class="book-thumb book-thumb--grey mr-4"></div>
              <div>
                <h4 class="text-subtitle-1 font-bold text-grey-dark line-clamp-2">{{ book.title }}</h4>
                <p class="text-caption text-grey-2 mt-1">{{ book.author }}</p>
              </div>
            </div>
            <hr class="divider mb-3" />
            <div class="flex items-center text-caption text-grey-2">
              <i class="mdi mdi-heart mr-1 text-red"></i>
              <span class="font-medium">{{ book.users }}명이 관심을 가졌어요</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 실시간 활동 -->
    <div>
      <h3 class="text-h6 font-black text-grey-dark mb-4">💬 실시간 멤버 소식</h3>
      <div class="card">
        <ul class="list">
          <template v-for="(activity, i) in recentActivities" :key="i">
            <li class="list-item activity-item">
              <div class="avatar avatar--md avatar--grey mr-4">
                <span class="text-subtitle-2 font-bold">{{ activity.user.charAt(0) }}</span>
              </div>
              <div class="flex-grow">
                <div class="text-body-2">
                  <span class="font-bold text-grey-dark">{{ activity.user }}</span>님이
                  <span class="font-medium text-grey-3">{{ activity.action }}</span>
                </div>
                <div class="mt-1 text-caption text-grey-2">{{ activity.time }}</div>
              </div>
              <div v-if="activity.img" class="activity-thumb show-on-sm"></div>
            </li>
            <hr v-if="i !== recentActivities.length - 1" class="divider" />
          </template>
        </ul>
        <div class="card-footer text-center">
          <button class="btn btn--text text-grey-2 font-bold">활동 더보기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
const authStore = useAuthStore()

const trendingBooks = [
  { title: '클린 아키텍처', author: '로버트 C. 마틴', type: '인기 추천도서', users: 24 },
  { title: '도둑맞은 집중력', author: '요한 하리', type: 'AI 맞춤 추천', users: 15 },
]
const recentActivities = [
  { user: '독서왕', action: "'사피엔스' 리뷰를 작성했습니다.", time: '2시간 전', img: true },
  { user: '개발자A', action: '자유게시판에 새 글을 남겼습니다.', time: '5시간 전', img: false },
  { user: '운영진', action: '다음 달 공통 도서가 선정되었습니다.', time: '1일 전', img: true },
]
</script>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;

  @media (min-width: 960px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.mobile-br { display: block; @media (min-width: 960px) { display: none; } }

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

.book-card { width: 300px; }
.book-card:first-child { width: 320px; }

.book-thumb {
  width: 64px; height: 96px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; border: 1px solid #e0e0e0;

  &--blue  { background: #E3F2FD; color: #1565C0; }
  &--grey  { background: #EEEEEE; }
}

.progress-sheet {
  background: #f5f5f5; padding: 12px; border-radius: 8px;
}

.hero-info-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 20px;
  min-width: 250px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
}

.hero-avatars { display: flex; }

.activity-item { padding: 16px 20px; align-items: flex-start; }
.activity-thumb {
  width: 56px; height: 56px; border-radius: 8px; background: #EEEEEE;
  border: 1px solid #e0e0e0; flex-shrink: 0; margin-left: 16px;
}
.show-on-sm { display: none; @media(min-width:600px) { display:block; } }

.mb-4 { margin-bottom: 16px; }
.mb-5 { margin-bottom: 20px; }
.mb-10 { margin-bottom: 40px; }
.mr-4 { margin-right: 16px; }
.mr-1 { margin-right: 4px; }
.mt-1 { margin-top: 4px; }
.gap-2 { gap: 8px; }
</style>
