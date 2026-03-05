<template>
  <div class="fade-in">
    <!-- 헤더 카드 -->
    <div class="card mb-8">
      <div class="card-body recommend-header">
        <div>
          <span class="chip chip--tonal-amber mb-3" style="display:inline-flex;">자유 도서 추천</span>
          <h1 class="text-h5 font-black text-grey-dark mb-2">내 인생의 책을 소개합니다 💡</h1>
          <p class="text-body-2 font-medium text-grey-2">월간 주제와 무관하게 자유롭게 책을 추천해주세요.</p>
        </div>
        <button class="btn btn--primary btn--lg rounded-xl font-bold flex items-center gap-2">
          <i class="mdi mdi-pencil"></i> 새 추천글 쓰기
        </button>
      </div>
    </div>

    <!-- 필터 -->
    <div class="flex justify-between items-center mb-6 filter-bar">
      <div class="chip-group">
        <span
          v-for="tag in tags"
          :key="tag"
          class="chip chip--outlined cursor-pointer"
          :class="{ 'chip--active-blue': recommendTag === tag }"
          @click="recommendTag = tag"
        >{{ tag }}</span>
      </div>
      <button class="btn btn--outlined flex items-center gap-1 rounded-xl bg-white">
        <i class="mdi mdi-filter-variant"></i> 최신순
      </button>
    </div>

    <!-- 도서 그리드 -->
    <div class="grid-cols-2">
      <div v-for="i in 8" :key="i" class="card hover-shadow flex flex-col h-full">
        <!-- 책 커버 -->
        <div class="rec-book-img flex items-center justify-center position-relative">
          <span class="text-h6 font-bold" style="color:#BDBDBD;">IMAGE</span>
          <span class="chip chip--white chip--sm position-absolute" style="top:12px;right:12px;">
            <i class="mdi mdi-tag"></i> IT/과학
          </span>
        </div>
        <!-- 내용 -->
        <div class="card-body flex flex-col flex-grow" style="padding:16px;">
          <h4 class="text-subtitle-1 font-black text-grey-dark line-clamp-1 mb-1">클린 아키텍처</h4>
          <p class="text-caption font-medium text-grey-2 mb-4">로버트 C. 마틴</p>
          <hr class="divider mt-auto mb-3" />
          <div class="flex items-center justify-between text-caption">
            <div class="flex items-center gap-1">
              <div class="avatar avatar--xs avatar--grey"><span class="font-bold">U</span></div>
              <span class="font-bold text-grey-2 text-truncate" style="max-width:60px;">안티그래비티</span>
            </div>
            <span class="chip chip--blue-lt chip--sm flex items-center gap-1">
              <i class="mdi mdi-thumb-up"></i> 24
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const tags = ['전체', '소설', '인문/철학', '자기계발', 'IT/과학', '에세이']
const recommendTag = ref('전체')
</script>

<style scoped>
.recommend-header {
  display: flex; flex-direction: column; gap: 16px;
  @media(min-width:960px){ flex-direction:row; align-items:center; justify-content:space-between; }
}
.filter-bar {
  flex-wrap: wrap; gap: 12px;
  @media(max-width:600px){ flex-direction:column; align-items:flex-start; }
}
.rec-book-img {
  height: 180px; background: #EEEEEE;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 20px 20px 0 0;
}
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-8 { margin-bottom: 32px; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
