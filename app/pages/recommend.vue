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
        <button class="btn btn--primary btn--lg rounded-xl font-bold flex items-center gap-2" @click="router.push('/board/write?category=도서 추천&openSearch=true')">
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

    <!-- 로딩 스켈레톤 -->
    <div v-if="loading" class="rec-grid">
      <div v-for="i in 4" :key="`skel-${i}`" class="card flex flex-col h-full" style="min-height: 320px;">
        <div class="skeleton" style="height: 180px; border-radius: 20px 20px 0 0;"></div>
        <div class="card-body flex flex-col flex-grow pa-4">
          <div class="skeleton skeleton--title" style="width: 80%; mb-2"></div>
          <div class="skeleton skeleton--text" style="width: 50%;"></div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="filteredPosts.length === 0" class="text-center pa-10 mb-8 bg-white rounded-xl border">
      <i class="mdi mdi-book-open-blank-variant" style="font-size:4rem;color:#BDBDBD;display:block;margin-bottom:16px;"></i>
      <h3 class="text-h6 font-bold text-grey-2 mb-2">등록된 도서 추천글이 없습니다.</h3>
      <p class="text-body-2 text-grey-3">가장 먼저 인생 책을 추천해보세요!</p>
    </div>

    <!-- 도서 그리드 -->
    <div v-else class="rec-grid">
      <div v-for="post in filteredPosts" :key="post.id" class="card hover-shadow flex flex-col h-full cursor-pointer" @click="router.push(`/board/${post.id}`)">
        <!-- 책 커버 (블러 배경 + 선명한 전경) -->
        <div class="rec-book-img-wrap">
          <div class="rec-book-bg" :style="{ backgroundImage: `url(${post.attachedBook?.thumbnail || 'https://via.placeholder.com/300x400?text=No+Cover'})` }"></div>
          <img :src="post.attachedBook?.thumbnail || 'https://via.placeholder.com/120x170?text=No+Cover'" class="rec-book-fg" alt="책 표지" />
          <span class="chip chip--white-translucent chip--sm position-absolute" style="top:12px;right:12px;z-index:2;">
            <i class="mdi mdi-tag"></i> {{ post.bookGenre || post.category }}
          </span>
        </div>
        
        <!-- 내용 -->
        <div class="card-body flex flex-col flex-grow" style="padding:16px;">
          <h4 class="text-subtitle-1 font-black text-grey-dark line-clamp-1 mb-1">{{ post.title }}</h4>
          <p class="text-caption font-medium text-grey-2 mb-4 line-clamp-1">
            {{ post.attachedBook?.title }} <span v-if="post.attachedBook?.authors?.length">| {{ post.attachedBook.authors.join(', ') }}</span>
          </p>
          <hr class="divider mt-auto mb-3" />
          <div class="flex items-center justify-between text-caption">
            <div class="flex items-center gap-2">
              <img :src="getProfileImagePath(post.author?.profileImageId)" alt="프로필" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" />
              <span class="font-bold text-grey-3 text-truncate" style="max-width:80px;">{{ post.author?.nickname || '알수없음' }}</span>
            </div>
            <span class="chip chip--blue-lt chip--sm flex items-center gap-1 font-bold">
              <i class="mdi mdi-heart" style="color: #E91E63; font-size: 1.1em;"></i> {{ post.likeCount || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoard } from '~/composables/useBoard'
import { getProfileImagePath } from '~/composables/useProfileImages'

const router = useRouter()
const { fetchPosts, loading } = useBoard()

const tags = ['전체', '소설', '인문/철학', '자기계발', 'IT과학', '시/에세이', '역사', '예술', '기타']
const recommendTag = ref('전체')
const posts = ref([])

onMounted(async () => {
  const allPosts = await fetchPosts('도서 추천')
  // 모든 도서 추천 게시글은 원칙적으로 책이 첨부되어야 하지만 방어용 필터링 유지
  posts.value = allPosts.filter(p => p.attachedBook)
})

const filteredPosts = computed(() => {
  if (recommendTag.value === '전체') return posts.value
  return posts.value.filter(p => p.bookGenre === recommendTag.value)
})
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

/* 3~4열 반응형 그리드 */
.rec-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  @media(min-width:600px) { grid-template-columns: repeat(2, 1fr); }
  @media(min-width:960px) { grid-template-columns: repeat(3, 1fr); }
  @media(min-width:1200px) { grid-template-columns: repeat(4, 1fr); }
}

/* 도서 썸네일 영역 - 블러 효과 적용 */
.rec-book-img-wrap {
  position: relative;
  height: 200px;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  border-bottom: 1px solid #e0e0e0;
}
.rec-book-bg {
  position: absolute;
  inset: -10px; /* 블러 가장자리 방지 */
  background-size: cover;
  background-position: center;
  filter: blur(5px);
  transform: scale(1.05); /* 사용자의 피드백 1.05 적용 */
  z-index: 0;
  opacity: 0.6;
}
.rec-book-bg::after {
  content: '';
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.2) /* 약간의 어두운 오버레이 */;
}
.rec-book-fg {
  position: relative;
  z-index: 1;
  height: 85%; /* 컨테이너 내에서 약간 여백을 가짐 */
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3); /* 선명함을 위해 섀도우 적용 */
  border-radius: 2px;
}
.chip--white-translucent {
  background: rgba(255,255,255,0.85) !important;
  color: #424242 !important;
  backdrop-filter: blur(4px);
  font-weight: 700;
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
