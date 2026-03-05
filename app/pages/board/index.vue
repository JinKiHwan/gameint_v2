<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 fade-in">
    <v-container max-width="900" class="px-0">
      
      <!-- 헤더 영역 -->
      <div class="d-flex align-end justify-space-between mb-6">
        <div>
          <h1 class="text-h4 font-weight-black text-grey-darken-4 mb-2">통합 게시판</h1>
          <p class="text-body-2 text-grey-darken-1">자유롭게 이야기를 나누고 책 리뷰를 남겨주세요.</p>
        </div>
        <v-btn 
          color="blue-darken-1" 
          variant="flat" 
          prepend-icon="mdi-pencil" 
          class="font-weight-bold rounded-lg"
          to="/board/write"
          elevation="0"
        >
          글쓰기
        </v-btn>
      </div>

      <!-- 플로팅 필터 메뉴 -->
      <v-card class="mb-6 rounded-xl border d-flex align-center px-4 py-2 bg-white" elevation="0">
        <v-chip-group
          v-model="selectedCategory"
          selected-class="text-blue-darken-1 bg-blue-lighten-5 font-weight-black"
          mandatory
        >
          <v-chip v-for="cat in categories" :key="cat" :value="cat" variant="text" class="font-weight-bold">
            {{ cat }}
          </v-chip>
        </v-chip-group>
        <v-spacer></v-spacer>
        <v-btn-toggle v-model="viewMode" mandatory variant="text" color="blue-darken-1" density="compact">
          <v-btn value="list" icon="mdi-format-list-bulleted"></v-btn>
          <v-btn value="grid" icon="mdi-view-grid-outline"></v-btn>
        </v-btn-toggle>
      </v-card>

      <!-- 게시글 로딩 상태 -->
      <template v-if="loading">
        <v-row v-if="viewMode === 'grid'">
          <v-col cols="12" sm="6" md="4" v-for="i in 6" :key="i">
            <v-skeleton-loader type="card" class="rounded-xl border"></v-skeleton-loader>
          </v-col>
        </v-row>
        <div v-else>
          <v-skeleton-loader type="list-item-avatar-two-line" v-for="i in 5" :key="i" class="mb-4 rounded-xl border"></v-skeleton-loader>
        </div>
      </template>

      <!-- 게시물 없음 -->
      <template v-else-if="filteredPosts.length === 0">
        <v-card class="text-center pa-10 rounded-xl border bg-white" elevation="0">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-text-box-search-outline</v-icon>
          <h3 class="text-h6 font-weight-bold text-grey-darken-2 mb-2">등록된 게시글이 없습니다.</h3>
          <p class="text-body-2 text-grey-darken-1">첫 번째 게시글의 주인공이 되어보세요!</p>
        </v-card>
      </template>

      <!-- 게시글 목록 렌더링 -->
      <template v-else>
        <!-- 리스트 뷰 -->
        <div v-if="viewMode === 'list'" class="d-flex flex-column gap-4">
          <v-card 
            v-for="post in filteredPosts" 
            :key="post.id" 
            class="rounded-xl border bg-white cursor-pointer hover-card transition-swing" 
            elevation="0"
            @click="goToDetail(post.id)"
          >
            <div class="d-flex pa-4 align-center">
              <!-- 카테고리 칩 -->
              <v-chip size="small" :color="getCategoryColor(post.category)" variant="flat" class="mr-4 font-weight-bold px-3">
                {{ post.category }}
              </v-chip>

              <!-- 글 제목 및 미리보기 -->
              <div class="flex-grow-1 mr-4 overflow-hidden">
                <div class="text-subtitle-1 font-weight-black text-truncate mb-1 text-grey-darken-4">{{ post.title }}</div>
                <div class="text-body-2 text-grey-darken-1 text-truncate" style="max-height: 20px;">
                  {{ post.contentPreview }}
                </div>
              </div>
              
              <!-- 메타 정보 (작성자, 시간, 조회수, 좋아요) -->
              <div class="d-flex flex-column align-end flex-shrink-0" style="width: 120px;">
                <div class="d-flex align-center mb-1">
                  <v-avatar size="20" class="mr-2">
                    <v-img :src="getProfileImageUrl(post.author.profileImageId)"></v-img>
                  </v-avatar>
                  <span class="text-caption font-weight-bold text-grey-darken-3 text-truncate">{{ post.author.nickname }}</span>
                </div>
                <div class="text-caption text-grey-darken-1 mb-2">{{ formatDate(post.createdAt) }}</div>
                <div class="d-flex text-caption text-grey-darken-1 gap-3">
                  <span class="d-flex align-center"><v-icon size="small" class="mr-1">mdi-eye-outline</v-icon> {{ post.viewCount || 0 }}</span>
                  <span class="d-flex align-center text-pink-darken-1"><v-icon size="small" class="mr-1">mdi-heart-outline</v-icon> {{ post.likeCount || 0 }}</span>
                  <span class="d-flex align-center text-blue-darken-1" v-if="post.commentCount > 0"><v-icon size="small" class="mr-1">mdi-comment-outline</v-icon> {{ post.commentCount }}</span>
                </div>
              </div>
            </div>
          </v-card>
        </div>

        <!-- 그리드 뷰 (리뷰 중심의 UI일 경우 유용) -->
        <v-row v-if="viewMode === 'grid'">
          <v-col cols="12" sm="6" md="4" v-for="post in filteredPosts" :key="post.id">
            <v-card 
              class="rounded-xl border bg-white h-100 d-flex flex-column hover-card transition-swing cursor-pointer" 
              elevation="0"
              @click="goToDetail(post.id)"
            >
              <div class="pa-4 flex-grow-1">
                <div class="d-flex justify-space-between align-center mb-3">
                  <v-chip size="small" :color="getCategoryColor(post.category)" variant="flat" class="font-weight-bold">
                    {{ post.category }}
                  </v-chip>
                  <span class="text-caption text-grey-darken-1">{{ formatDate(post.createdAt) }}</span>
                </div>
                <h3 class="text-subtitle-1 font-weight-black mb-2 text-grey-darken-4 line-clamp-2">{{ post.title }}</h3>
                <p class="text-body-2 text-grey-darken-1 line-clamp-3">{{ post.contentPreview }}</p>
              </div>
              
              <v-divider></v-divider>
              
              <div class="pa-3 d-flex justify-space-between align-center bg-grey-lighten-5 rounded-b-xl">
                <div class="d-flex align-center">
                  <v-avatar size="24" class="mr-2 border">
                    <v-img :src="getProfileImageUrl(post.author.profileImageId)"></v-img>
                  </v-avatar>
                  <span class="text-caption font-weight-bold text-grey-darken-3 text-truncate max-w-100">{{ post.author.nickname }}</span>
                </div>
                <div class="d-flex text-caption text-grey-darken-1 gap-2">
                  <span class="d-flex align-center"><v-icon size="x-small" class="mr-1">mdi-eye</v-icon> {{ post.viewCount || 0 }}</span>
                  <span class="d-flex align-center text-pink-darken-1"><v-icon size="x-small" class="mr-1">mdi-heart</v-icon> {{ post.likeCount || 0 }}</span>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </template>

    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 상태 보관용 (개발용 Mock 데이터)
// 실제 환경에서는 Firestore `posts` 컬렉션에서 가져옴
const loading = ref(true)
const viewMode = ref('list') // list or grid
const categories = ['전체', '책 리뷰', '자유글', '정보/팁', '건의사항']
const selectedCategory = ref('전체')

const posts = ref([])

onMounted(() => {
  // TODO: Firestore 연동 전 더미 데이터 세팅
  setTimeout(() => {
    posts.value = [
      {
        id: '1',
        category: '책 리뷰',
        title: '클린 아키텍처 다 읽고 든 생각들',
        contentPreview: '이번 주말 동안 클린 아키텍처를 드디어 다 읽었습니다. 의존성 역전 원칙이 얼마나 중요한지 다시금 깨달았고, 특히 유스케이스 중심의 설계가 우리 프로젝트에 어떻게 적용될 수 있을지 고민해봤습니다...',
        author: { nickname: '진기', profileImageId: 'avatar_bronze_01' },
        viewCount: 145,
        likeCount: 12,
        commentCount: 5,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2시간 전
      },
      {
        id: '2',
        category: '자유글',
        title: '개발자들의 진짜 쉼터는 어디인가요?',
        contentPreview: '다들 주말에 뭐하시나요? 저는 코딩하다 지치면 가끔 무작정 걷곤 하는데, 다른 분들의 번아웃 극복법이 궁금합니다.',
        author: { nickname: '데브짱', profileImageId: 'avatar_silver_01' },
        viewCount: 42,
        likeCount: 3,
        commentCount: 8,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1일 전
      },
      {
        id: '3',
        category: '정보/팁',
        title: 'Nuxt 3에서 Firebase Auth 쉽게 붙이는 법 (내용김)',
        contentPreview: '많은 분들이 SSR 환경에서 Firebase 인증 상태를 유지하는 데 어려움을 겪고 계셔서 간단한 팁을 공유하고자 합니다. middleware를 활용하면...',
        author: { nickname: 'nuxt_master', profileImageId: 'avatar_gold_02' },
        viewCount: 320,
        likeCount: 45,
        commentCount: 12,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2일 전
      }
    ]
    loading.value = false
  }, 800)
})

const filteredPosts = computed(() => {
  if (selectedCategory.value === '전체') return posts.value
  return posts.value.filter(p => p.category === selectedCategory.value)
})

// UI Helper 함수들
const getCategoryColor = (cat) => {
  const map = {
    '책 리뷰': 'green-darken-1',
    '자유글': 'grey-darken-2',
    '정보/팁': 'orange-darken-2',
    '건의사항': 'red-darken-2'
  }
  return map[cat] || 'blue-grey'
}

const getProfileImageUrl = (imageId) => {
  // 실제로는 로컬 에셋 경로를 반환
  // return `/images/avatars/${imageId}.png`
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${imageId}` // 임시 더미 이미지
}

const formatDate = (dateValue) => {
  if (!dateValue) return ''
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${m}.${d}`
}

const goToDetail = (id) => {
  router.push(`/board/${id}`)
}
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.gap-4 {
  gap: 16px;
}
.gap-3 {
  gap: 12px;
}
.gap-2 {
  gap: 8px;
}
.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.max-w-100 {
  max-width: 100px;
}
</style>
