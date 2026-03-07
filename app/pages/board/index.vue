<template>
  <div class="fade-in">
    <!-- ① 히어로 배너 -->
    <div class="board-hero mb-8">
      <img
        src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2290&auto=format&fit=crop"
        alt="게시판 배너"
        class="board-hero__bg"
      />
      <div class="board-hero__overlay">
        <div class="board-hero__glass">
          <div class="flex justify-between items-center w-100">
            <div>
              <div class="text-caption font-bold text-white mb-1 opacity-80">커뮤니티</div>
              <h1 class="text-h4 font-black text-white mb-1">자유 게시판 💬</h1>
              <p class="text-body-2 text-white opacity-80">멤버들과 자유롭게 소통하는 공간입니다.</p>
            </div>
            <NuxtLink to="/board/write" class="btn btn--white rounded-xl font-bold flex items-center gap-2">
              <i class="mdi mdi-pencil"></i>글쓰기
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- HOT 게시글 -->
    <div v-if="hotPosts.length > 0" class="mb-8">
      <h3 class="text-h6 font-black text-grey-dark mb-4 flex items-center gap-2">
        <i class="mdi mdi-fire text-red"></i> 주간 HOT 인기글
      </h3>
      <div class="hot-grid">
        <div
          v-for="post in hotPosts" :key="post.id"
          class="hot-card card cursor-pointer hover-shadow"
          @click="router.push(`/board/${post.id}`)"
        >
          <div class="hot-card__body">
            <div class="flex justify-between items-start mb-3">
              <span class="chip chip--red">HOT</span>
              <div class="flex gap-2 text-caption font-bold text-grey-2">
                <span class="flex items-center gap-1 text-red"><i class="mdi mdi-heart" style="font-size:.9em;"></i>{{ post.likeCount || 0 }}</span>
                <span class="flex items-center gap-1"><i class="mdi mdi-forum" style="font-size:.9em;"></i>{{ post.commentCount || 0 }}</span>
              </div>
            </div>
            <h4 class="text-subtitle-1 font-black text-grey-dark mb-2 line-clamp-1">{{ post.title }}</h4>
            <p class="text-body-2 text-grey-3 line-clamp-2 mt-auto">{{ post.contentPreview || '내용이 없습니다.' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 게시글 목록 카드 -->
    <div class="card overflow-hidden">
      <!-- 필터 헤더 -->
      <div class="board-filter-bar">
        <div class="chip-group">
          <span
            v-for="tag in categoryTags" :key="tag"
            class="chip chip--outlined bg-white cursor-pointer"
            :class="{ 'chip--active': boardTag === tag }"
            @click="boardTag = tag"
          >{{ tag }}</span>
        </div>
        <select v-model="boardSort" class="select" style="max-width:150px;" @change="page = 1">
          <option>최신순</option><option>인기순</option><option>댓글순</option>
        </select>
      </div>

      <!-- 로딩 스켈레톤 -->
      <template v-if="loading">
        <div v-for="i in 5" :key="`skel-${i}`" class="skeleton-item">
          <div class="skeleton skeleton--avatar" style="width:40px;height:40px;border-radius:50%;"></div>
          <div style="flex:1;"><div class="skeleton skeleton--title" style="width:50%;"></div><div class="skeleton skeleton--text" style="width:70%;"></div></div>
        </div>
      </template>

      <!-- 빈 상태 -->
      <div v-else-if="paginatedPosts.length === 0" class="text-center pa-10">
        <i class="mdi mdi-text-box-search-outline" style="font-size:4rem;color:#BDBDBD;display:block;margin-bottom:16px;"></i>
        <h3 class="text-h6 font-bold text-grey-2 mb-2">등록된 게시글이 없습니다.</h3>
      </div>

      <!-- 게시글 목록 -->
      <ul v-else class="list pa-0">
        <template v-for="(post, index) in paginatedPosts" :key="post.id">
          <li class="list-item board-row cursor-pointer" @click="router.push(`/board/${post.id}`)">
            <!-- 좋아요 수 (데스크톱) -->
            <div class="board-like-col show-on-sm">
              <i class="mdi mdi-heart" style="font-size:.9em;"></i>
              <span class="text-caption font-bold">{{ post.likeCount || 0 }}</span>
            </div>

            <div class="flex-grow min-w-0">
              <div class="flex items-center mb-1 gap-2">
                <span :class="`chip chip--${getCategoryChipClass(post.category)} chip--xs`">{{ post.category }}</span>
                <h4 class="text-subtitle-1 font-bold text-grey-dark text-truncate">{{ post.title }}</h4>
              </div>
              <div class="flex items-center gap-3 text-caption font-medium text-grey-2">
                <div class="flex items-center gap-1 font-bold text-grey-3">
                  <template v-for="author in [resolveUser(post.author?.uid, post.author)]" :key="post.id + '_author'">
                    <img :src="getProfileImagePath(author.profileImageId)" alt="프로필" style="width: 16px; height: 16px; border-radius: 50%; object-fit: cover;" />
                    <span>{{ author.nickname }}</span>
                  </template>
                </div>
                <span>{{ formatDate(post.createdAt) }}</span>
                <span class="flex items-center gap-1"><i class="mdi mdi-eye" style="font-size:.8em;"></i>{{ post.viewCount || 0 }}</span>
              </div>
            </div>

            <!-- 댓글 수 -->
            <div class="board-comment-col">
              <i class="mdi mdi-comment-processing-outline" style="color:#90CAF9;"></i>
              <span class="text-caption font-bold text-blue-dark">{{ post.commentCount || 0 }}</span>
            </div>
          </li>
          <hr v-if="index !== paginatedPosts.length - 1" class="divider" />
        </template>
      </ul>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBoard } from '~/composables/useBoard'
import { getProfileImagePath } from '~/composables/useProfileImages'

const router = useRouter()
const { fetchPosts, fetchHotPosts, loading } = useBoard()
const { resolveUser } = useUserMapper()

const boardTag = ref('전체')
const boardSort = ref('최신순')
const posts = ref([])
const hotPosts = ref([])
const page = ref(1)
const itemsPerPage = 10
const categoryTags = ['전체', '도서 추천', '책 리뷰', '자유글', '정보/팁', '건의사항']

const loadPosts = async () => { posts.value = await fetchPosts(boardTag.value) }
const loadHotPosts = async () => {
  const fetched = await fetchHotPosts()
  hotPosts.value = fetched.filter(p => p.likeCount > 0)
}

onMounted(() => { loadPosts(); loadHotPosts() })
watch(boardTag, () => { page.value = 1; loadPosts() })
watch(boardSort, () => { page.value = 1 })

const sortedPosts = computed(() => {
  let sorted = [...posts.value]
  if (boardSort.value === '인기순') sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
  else if (boardSort.value === '댓글순') sorted.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0))
  return sorted
})
const totalPages = computed(() => Math.ceil(sortedPosts.value.length / itemsPerPage))
const paginatedPosts = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return sortedPosts.value.slice(start, start + itemsPerPage)
})

const getCategoryChipClass = (cat) => {
  const map = { '도서 추천': 'deep-purple', '책 리뷰': 'green', '자유글': 'grey', '정보/팁': 'orange', '건의사항': 'red' }
  return map[cat] || 'grey'
}
const formatDate = (dateValue) => {
  if (!dateValue) return ''
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${date.getFullYear()}.${m}.${d}`
}
</script>

<style scoped>
/* ── 히어로 배너 ──────────────────────────── */
.board-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.board-hero__bg {
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block;
}
.board-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 25, 41, 0.8) 0%, rgba(10, 25, 41, 0.2) 60%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 32px;
  @media (max-width: 600px) { padding: 20px; }
}
.board-hero__glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
}
.btn--white { background: #fff; color: #1E88E5; border: none; }
.btn--white:hover { background: #f5f5f5; }

.hot-grid {
  display: grid; grid-template-columns: 1fr;
  gap: 16px;
  @media(min-width:600px) { grid-template-columns: repeat(2, 1fr); }
  @media(min-width:960px) { grid-template-columns: repeat(3, 1fr); }
}
.hot-card { border-color: #FFCDD2; background: #FFEBEE; }
.hot-card__body { padding: 20px; display:flex; flex-direction:column; height:100%; }

.board-filter-bar {
  display: flex; flex-direction: column; gap: 12px;
  padding: 16px; background: #FAFAFA; border-bottom: 1px solid #e0e0e0;
  @media(min-width:600px) { flex-direction: row; align-items: center; justify-content: space-between; }
}

.board-row { padding: 16px 20px; align-items: center; }
.board-like-col { display:none; flex-direction:column; align-items:center; width:40px; color:#757575; margin-right:16px; @media(min-width:600px){display:flex;} }
.board-comment-col { display:flex; flex-direction:column; align-items:center; width:40px; margin-left:8px; }
.show-on-sm { display:none; @media(min-width:600px){display:flex;} }

.chip--active { background: #212121 !important; color: #fff !important; border-color: #212121 !important; }

.pa-10 { padding: 40px; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-8 { margin-bottom: 32px; }
.gap-1 { gap:4px; }
.gap-2 { gap:8px; }
.gap-3 { gap:12px; }
</style>
