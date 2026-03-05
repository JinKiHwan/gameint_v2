<template>
  <div class="fade-in">
    <!-- 히어로 배너 -->
    <div class="card overflow-hidden mb-6" style="border-radius:20px;">
      <div class="cycles-hero">
        <img src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2070&auto=format&fit=crop" alt="월간주제" />
        <div class="cycles-hero__overlay">
          <div class="cycles-hero__content">
            <span class="chip chip--primary mb-3" style="display:inline-flex;">24년 4월 ~ 5월</span>
            <h1 class="text-h4 font-black text-white mb-2">기술의 발전과 인간의 윤리</h1>
            <div class="flex items-center text-body-2 font-medium mb-4" style="color:#e0e0e0;gap:16px;margin-top:16px;">
              <span class="flex items-center gap-1"><i class="mdi mdi-calendar" style="font-size:.9em;"></i> 04.01 ~ 05.31</span>
              <span class="flex items-center gap-1"><i class="mdi mdi-map-marker" style="font-size:.9em;"></i> 온라인/오프라인</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 설명 + 참여 버튼 -->
    <div class="card mb-8">
      <div class="card-body cycles-info">
        <p class="text-body-2 font-medium text-grey-2 flex-grow line-height-relaxed">
          빠르게 발전하는 AI와 생명공학 기술 속에서 우리는 무엇을 잃고 무엇을 얻게 될까요?
          관련된 도서를 자유롭게 읽고 인사이트를 나누어 봅시다.
        </p>
        <div class="flex items-center cycles-join">
          <div class="text-right mr-4" style="display:none;@media(min-width:960px){display:block;}">
            <div class="text-subtitle-2 font-bold text-grey-dark">참여자 42명</div>
            <div class="text-caption font-bold text-blue-dark">지금 바로 합류하세요!</div>
          </div>
          <button class="btn btn--primary btn--lg rounded-sm font-bold cycles-btn">도서 등록하고 참여하기</button>
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <div class="tabs">
      <button
        v-for="tab in tabs" :key="tab.value"
        class="tab-btn"
        :class="{ 'is-active': monthlyTab === tab.value }"
        @click="monthlyTab = tab.value"
      >{{ tab.label }}</button>
    </div>

    <!-- 탭 패널: 독서 중인 도서 -->
    <div v-if="monthlyTab === 'books'">
      <div class="flex justify-between items-center mb-6 mt-2">
        <h3 class="text-h6 font-black text-grey-dark">📚 멤버들이 읽고 있는 책</h3>
      </div>
      <div class="grid-cols-2">
        <div v-for="i in 6" :key="i" class="card hover-shadow">
          <div class="book-cover">
            <img src="https://images.unsplash.com/photo-1550399105-c4db5fb85c18?q=80&w=2071&auto=format&fit=crop" alt="책" />
            <div class="book-cover__overlay">
              <div class="text-subtitle-2 font-black text-white line-clamp-1">인공지능의 시대</div>
              <div class="text-caption font-medium" style="color:#e0e0e0;">제리 카플란</div>
            </div>
          </div>
          <div class="card-body" style="padding:16px;">
            <div class="flex items-center mb-3">
              <div class="avatar avatar--xs avatar--grey mr-2"><span class="text-caption font-bold">U</span></div>
              <span class="text-caption font-bold text-grey-2">독서왕</span>
            </div>
            <div class="book-quote text-caption text-grey-2 line-clamp-2">
              "기술 발전의 속도를 인류가 어떻게 감당해야 할지에 대한 고찰."
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="monthlyTab !== 'books'" class="text-center pa-10 text-grey-2 font-bold">
      {{ tabPlaceholder }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const monthlyTab = ref('books')
const tabs = [
  { value: 'books', label: '독서 중인 도서' },
  { value: 'reviews', label: '주제 리뷰' },
  { value: 'stats', label: '참여 통계' },
  { value: 'meeting', label: '모임 기록' },
]
const tabPlaceholder = computed(() => {
  const map = { reviews: '주제 리뷰가', stats: '참여 통계가', meeting: '모임 기록이' }
  return `${map[monthlyTab.value] || ''} 곧 업데이트 됩니다.`
})
</script>

<style scoped>
.cycles-hero {
  position: relative;
  img { width:100%; height:300px; object-fit:cover; display:block; }
}
.cycles-hero__overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(15,23,42,0.9), rgba(15,23,42,0.2));
  display: flex; align-items: flex-end;
}
.cycles-hero__content { padding: 40px; @media(max-width:600px){ padding: 24px; } }
.cycles-info { display:flex; flex-direction:column; gap:16px; @media(min-width:960px){ flex-direction:row; align-items:center; justify-content:space-between; } }
.cycles-join { flex-shrink:0; width:100%; @media(min-width:960px){ width:auto; } }
.cycles-btn { flex-grow:1; @media(min-width:960px){ flex-grow:0; } }

.book-cover {
  position: relative;
  img { width:100%; height:180px; object-fit:cover; display:block; }
  &__overlay { position:absolute; bottom:0; left:0; right:0; padding:8px 12px; background:linear-gradient(to top, rgba(0,0,0,0.8), transparent); }
}

.book-quote { background:#f5f5f5; padding:12px; border-radius:8px; }

.pa-10 { padding: 40px; }
.mr-4 { margin-right: 16px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-8 { margin-bottom: 32px; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.gap-1 { gap: 4px; }
</style>
