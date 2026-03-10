<template>
  <div class="fade-in">
    <!-- ① 히어로 배너 -->
    <div class="recommend-hero mb-8">
      <img
        src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2256&auto=format&fit=crop"
        alt="추천 배너"
        class="recommend-hero__bg"
      />
      <div class="recommend-hero__overlay">
        <div class="recommend-hero__glass">
          <div class="recommend-hero__content">
            <div class="recommend-hero__text-wrap">
              <div class="text-caption font-bold text-white mb-1 opacity-80">도서 큐레이션</div>
              <h1 class="text-h4 font-black text-white mb-1">인생 도서 추천 💡</h1>
              <p class="text-body-2 text-white opacity-80 mb-0">내 인생을 바꾼 소중한 책들을 소개하고 공유하는 공간입니다.</p>
            </div>
            <button class="btn btn--white rounded-xl font-bold flex items-center gap-2 recommend-hero__btn" @click="router.push('/board/write?category=도서 추천&openSearch=true')">
              <i class="mdi mdi-pencil"></i>새 추천글 쓰기
            </button>
          </div>
        </div>
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
      <select v-model="recommendSort" class="select" style="max-width:150px;" @change="page = 1">
        <option>최신순</option><option>인기순</option><option>댓글순</option>
      </select>
    </div>

    <!-- 로딩 스켈레톤 -->
    <div v-if="loading" class="rec-grid">
      <div v-for="i in 4" :key="`skel-${i}`" class="card flex flex-col h-full" style="min-height: 320px;">
        <div class="skeleton" style="height: 180px; border-radius: 20px 20px 0 0;"></div>
        <div class="card-body flex flex-col flex-grow pa-4">
          <div class="skeleton skeleton--title mb-2" style="width: 80%;"></div>
          <div class="skeleton skeleton--text" style="width: 50%;"></div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="paginatedPosts.length === 0" class="text-center pa-10 mb-8 bg-white rounded-xl border">
      <i class="mdi mdi-book-open-blank-variant" style="font-size:4rem;color:#BDBDBD;display:block;margin-bottom:16px;"></i>
      <h3 class="text-h6 font-bold text-grey-2 mb-2">등록된 도서 추천글이 없습니다.</h3>
      <p class="text-body-2 text-grey-3">가장 먼저 인생 책을 추천해보세요!</p>
    </div>

    <!-- 도서 그리드 -->
    <div v-else class="rec-grid">
      <div v-for="post in paginatedPosts" :key="post.id" class="card hover-shadow flex flex-col h-full cursor-pointer" @click="router.push(`/board/${post.id}`)">
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
              <template v-for="author in [resolveUser(post.author?.uid, post.author)]" :key="'rec_author_' + post.id">
                <img :src="getProfileImagePath(author.profileImageId)" alt="프로필" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" />
                <span class="font-bold text-grey-3 text-truncate" style="max-width:80px;">{{ author.nickname }}</span>
              </template>
            </div>
            <span class="chip chip--blue-lt chip--sm flex items-center gap-1 font-bold">
              <i class="mdi mdi-heart" style="color: #E91E63; font-size: 1.1em;"></i> {{ post.likeCount || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="pagination mt-10">
      <button class="pagination__btn" :disabled="page <= 1" @click="page--"><i class="mdi mdi-chevron-left"></i></button>
      <button
        v-for="p in totalPages" :key="p"
        class="pagination__btn"
        :class="{ 'is-active': page === p }"
        @click="page = p"
      >{{ p }}</button>
      <button class="pagination__btn" :disabled="page >= totalPages" @click="page++"><i class="mdi mdi-chevron-right"></i></button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoard } from '~/composables/useBoard'
import { useUserMapper } from '~/composables/useUserMapper'
import { getProfileImagePath } from '~/composables/useProfileImages'

const router = useRouter()
const { fetchPosts, loading } = useBoard()
const { resolveUser } = useUserMapper()
const page = ref(1)
const itemsPerPage = 16
const recommendSort = ref('최신순')

const tags = ['전체', '소설', '자기계발', '경제/경영', '인문/사회', '과학/기술', '시/에세이', '기타']
const recommendTag = ref('전체')
const posts = ref([])

onMounted(async () => {
  const allPosts = await fetchPosts('도서 추천')
  posts.value = allPosts.filter(p => p.attachedBook)
})

const filteredPosts = computed(() => {
  let filtered = posts.value
  if (recommendTag.value !== '전체') {
    filtered = filtered.filter(p => p.bookGenre === recommendTag.value)
  }
  
  // 정렬 적용
  if (recommendSort.value === '인기순') {
    filtered = [...filtered].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
  } else if (recommendSort.value === '댓글순') {
    filtered = [...filtered].sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0))
  } else {
    // 최신순 (이미 기본이 최신순일 수 있지만 보장)
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
      return dateB - dateA
    })
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / itemsPerPage))
const paginatedPosts = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return filteredPosts.value.slice(start, start + itemsPerPage)
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

/* ── 히어로 배너 ──────────────────────────── */
.recommend-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.recommend-hero__bg {
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block;
  @media (max-width: 768px) { height: 320px; }
}
.recommend-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 25, 41, 0.8) 0%, rgba(10, 25, 41, 0.2) 60%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 32px;
  @media (max-width: 768px) {
    padding: 20px;
    align-items: center;
  }
}
.recommend-hero__glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  @media (max-width: 600px) { padding: 16px; }
}
.recommend-hero__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }
}
.recommend-hero__text-wrap {
  flex: 1;
  min-width: 0;
}
.recommend-hero__btn {
  flex-shrink: 0;
  @media (max-width: 600px) {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }
}
.btn--white { background: #fff; color: #1E88E5; border: none; }
.btn--white:hover { background: #f5f5f5; }

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
