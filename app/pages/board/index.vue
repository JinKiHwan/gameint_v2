<template>
  <div class="fade-in">
    <v-card class="rounded-xl pa-6 mb-8 border bg-white d-flex justify-space-between align-center" elevation="0">
      <div>
        <h1 class="text-h5 font-weight-black text-grey-darken-4 mb-1">자유 게시판 💬</h1>
        <p class="text-body-2 font-weight-medium text-grey-darken-1">멤버들과 자유롭게 소통하는 공간입니다.</p>
      </div>
      <v-btn color="blue-darken-1" prepend-icon="mdi-pencil" class="rounded-xl font-weight-bold" variant="flat" to="/board/write">글쓰기</v-btn>
    </v-card>

    <div class="mb-8">
      <h3 class="text-h6 font-weight-black text-grey-darken-4 mb-4 d-flex align-center">
        <v-icon color="red-lighten-1" class="mr-2">mdi-fire</v-icon> 주간 HOT 인기글
      </h3>
      <v-row>
        <v-col v-for="i in 2" :key="i" cols="12" md="6">
          <v-card class="rounded-xl pa-5 border-red-lighten-4 bg-red-lighten-5 hover-shadow cursor-pointer" elevation="0" border>
            <div class="d-flex justify-space-between align-start mb-3">
              <v-chip color="red-lighten-1" size="small" variant="flat" class="font-weight-bold px-2">HOT</v-chip>
              <div class="d-flex gap-2 text-caption font-weight-bold text-grey-darken-1">
                <span class="d-flex align-center text-red-lighten-1"><v-icon size="small" class="mr-1">mdi-heart</v-icon> 42</span>
                <span class="d-flex align-center"><v-icon size="small" class="mr-1">mdi-forum</v-icon> 18</span>
              </div>
            </div>
            <h4 class="text-subtitle-1 font-weight-black text-grey-darken-4 mb-1 line-clamp-1">전자책 vs 종이책, 여러분의 선택은?</h4>
            <p class="text-body-2 text-grey-darken-2 line-clamp-1">저는 개인적으로 종이책 넘기는 맛을 포기할 수가 없네요...</p>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-card class="rounded-xl border bg-white overflow-hidden" elevation="0">
      <div class="d-flex flex-column flex-sm-row justify-space-between align-sm-center pa-4 bg-grey-lighten-5 border-b">
        <v-chip-group v-model="boardTag" selected-class="bg-grey-darken-4 text-white" mandatory class="mb-2 mb-sm-0">
          <v-chip value="전체" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">전체</v-chip>
          <v-chip value="책 리뷰" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">책 리뷰</v-chip>
          <v-chip value="자유글" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">자유글</v-chip>
          <v-chip value="정보/팁" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">정보/팁</v-chip>
          <v-chip value="건의사항" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">건의</v-chip>
        </v-chip-group>
        <v-select
          v-model="boardSort"
          :items="['최신순', '인기순', '댓글순']"
          variant="outlined"
          density="compact"
          hide-details
          bg-color="white"
          class="font-weight-bold rounded-lg"
          style="max-width: 150px;"
        ></v-select>
      </div>
      
      <!-- Loding state -->
      <v-skeleton-loader v-if="loading" type="list-item-avatar-two-line" v-for="i in 5" :key="`skel-${i}`" class="border-b"></v-skeleton-loader>

      <!-- Empty state -->
      <div v-else-if="posts.length === 0" class="text-center pa-10">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-text-box-search-outline</v-icon>
        <h3 class="text-h6 font-weight-bold text-grey-darken-2 mb-2">등록된 게시글이 없습니다.</h3>
      </div>

      <!-- Real posts list -->
      <v-list v-else lines="two" class="pa-0">
        <template v-for="(post, index) in posts" :key="post.id">
          <v-list-item class="pa-4 pa-md-5 hover-bg-grey cursor-pointer" @click="router.push(`/board/${post.id}`)">
            <div class="d-flex align-center w-100">
              <div class="d-none d-sm-flex flex-column align-center justify-center w-16 text-grey-darken-1 mr-4">
                <v-icon size="small" class="mb-1">mdi-heart</v-icon>
                <span class="text-caption font-weight-bold">{{ post.likeCount || 0 }}</span>
              </div>
              
              <div class="flex-grow-1 min-w-0">
                <div class="d-flex align-center mb-1">
                  <v-chip size="x-small" :color="getCategoryColor(post.category)" variant="flat" class="font-weight-bold px-2 mr-2 rounded">
                    {{ post.category }}
                  </v-chip>
                  <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-4 text-truncate">{{ post.title }}</h4>
                </div>
                <div class="d-flex align-center gap-3 text-caption font-weight-medium text-grey-darken-1">
                  <span class="font-weight-bold text-grey-darken-3">{{ post.author?.nickname || '알수없음' }}</span>
                  <span>{{ formatDate(post.createdAt) }}</span>
                  <span class="d-flex align-center"><v-icon size="x-small" class="mr-1">mdi-eye</v-icon> {{ post.viewCount || 0 }}</span>
                </div>
              </div>
              
              <div class="d-flex flex-column align-center justify-center w-16 ml-2">
                <v-icon color="blue-lighten-2" class="mb-1">mdi-comment-processing-outline</v-icon>
                <span class="text-caption font-weight-bold text-blue-darken-1">{{ post.commentCount || 0 }}</span>
              </div>
            </div>
          </v-list-item>
          <v-divider v-if="index !== posts.length - 1"></v-divider>
        </template>
      </v-list>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBoard } from '~/composables/useBoard'

const router = useRouter()
const { fetchPosts, loading } = useBoard()

const boardTag = ref('전체')
const boardSort = ref('최신순')
const posts = ref([])

const loadPosts = async () => {
  posts.value = await fetchPosts(boardTag.value)
}

onMounted(() => {
  loadPosts()
})

watch(boardTag, () => {
  loadPosts()
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
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${imageId}`
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
</script>

<style scoped>
.hover-shadow:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
  transform: translateY(-2px);
  transition: all 0.2s ease;
}
.hover-bg-grey:hover {
  background-color: #f8f9fa !important;
}
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
