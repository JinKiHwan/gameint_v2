<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 fade-in">
    <v-container max-width="900" class="px-0">
      
      <!-- 상단 컨트롤 (뒤로가기, 수정/삭제) -->
      <div class="d-flex align-center justify-space-between mb-4">
        <v-btn icon="mdi-arrow-left" variant="text" size="small" color="grey-darken-2" @click="router.back()"></v-btn>
        
        <div v-if="isAuthor" class="d-flex gap-2">
          <v-btn variant="tonal" size="small" color="grey-darken-3" class="rounded-lg font-weight-bold" @click="editPost">수정</v-btn>
          <v-btn variant="tonal" size="small" color="red-darken-2" class="rounded-lg font-weight-bold" @click="confirmDelete = true">삭제</v-btn>
        </div>
      </div>

      <!-- 본문 로딩 -->
      <v-skeleton-loader v-if="loading" type="article, paragraph, paragraph" class="rounded-xl border"></v-skeleton-loader>
      
      <!-- 게시글 본문 영역 -->
      <v-card v-else-if="post" class="rounded-xl border bg-white pa-0 overflow-hidden" elevation="0">
        
        <!-- 게시글 헤더 정보 -->
        <div class="pa-6 border-b bg-grey-lighten-5">
          <div class="d-flex justify-space-between align-center mb-4">
            <v-chip size="small" :color="getCategoryColor(post.category)" variant="flat" class="font-weight-bold px-3">
              {{ post.category }}
            </v-chip>
            <div class="text-caption text-grey-darken-1 font-weight-medium">
              {{ formatDate(post.createdAt) }}
              <span v-if="post.isEdited" class="font-italic ml-1">(수정됨)</span>
            </div>
          </div>
          
          <h1 class="text-h5 font-weight-black text-grey-darken-4 mb-6 leading-tight" style="word-break: keep-all;">
            {{ post.title }}
          </h1>

          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center cursor-pointer">
              <v-avatar size="36" class="mr-3 border" color="white">
                <v-img :src="getProfileImageUrl(post.author.profileImageId)"></v-img>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-subtitle-2 font-weight-bold text-grey-darken-4">{{ post.author.nickname }}</span>
              </div>
            </div>

            <div class="d-flex gap-4 text-body-2 text-grey-darken-1 font-weight-bold">
              <span class="d-flex align-center"><v-icon size="small" class="mr-1">mdi-eye-outline</v-icon> {{ post.viewCount || 0 }}</span>
              <span class="d-flex align-center text-pink-darken-1 cursor-pointer hover-scale"><v-icon size="small" class="mr-1">mdi-heart-outline</v-icon> {{ post.likeCount || 0 }}</span>
              <span class="d-flex align-center text-blue-darken-1"><v-icon size="small" class="mr-1">mdi-comment-outline</v-icon> {{ post.commentCount || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 에디터로 작성된 본문 내용 렌더링 -->
        <div class="pa-6 tiptap-content text-body-1 text-grey-darken-4" v-html="post.content"></div>
        
      </v-card>

      <!-- 에러 시 -->
      <v-alert v-else type="error" variant="tonal" class="rounded-lg mt-4 font-weight-bold text-caption">
        게시글을 불러올 수 없습니다. 삭제되었거나 권한이 없을 수 있습니다.
      </v-alert>

      <!-- TODO: 댓글 영역 컴포넌트 마운트 될 자리 -->
      
    </v-container>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="confirmDelete" max-width="400">
      <v-card class="pa-6 rounded-xl text-center border" elevation="0">
        <v-icon color="red-darken-2" size="48" class="mb-4">mdi-alert-circle-outline</v-icon>
        <h3 class="text-h6 font-weight-black mb-2 text-grey-darken-4">게시글을 삭제하시겠습니까?</h3>
        <p class="text-body-2 text-grey-darken-1 mb-6">삭제된 글은 복구할 수 없습니다.</p>
        
        <v-alert v-if="deleteError" type="error" variant="tonal" class="mb-4 text-caption text-left font-weight-bold">
          {{ deleteError }}
        </v-alert>

        <div class="d-flex gap-2 justify-center">
          <v-btn color="grey-darken-2" variant="tonal" class="rounded-lg font-weight-bold flex-grow-1" @click="confirmDelete = false">취소</v-btn>
          <v-btn color="red-darken-2" variant="flat" class="rounded-lg font-weight-bold flex-grow-1" :loading="deleting" @click="handleDelete">삭제</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useBoard } from '~/composables/useBoard'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { fetchPost, incrementViewCount, deletePost, loading } = useBoard()

const post = ref(null)
const confirmDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

onMounted(async () => {
  const postId = route.params.id
  if (postId) {
    post.value = await fetchPost(postId)
    
    // 조회수 증가 로직 (작성자 본인이 아닐 때만 올릴수도 있지만, 일단 단순 호출)
    if (post.value) {
      incrementViewCount(postId)
    }
  }
})

const isAuthor = computed(() => {
  return authStore.user && post.value && post.value.author.uid === authStore.user.uid
})

const editPost = () => {
  // TODO: 수정 페이지 라우팅 로직 (현재는 미구현)
  alert('수정 기능은 곧 추가됩니다!')
}

const handleDelete = async () => {
  deleteError.value = ''
  deleting.value = true
  try {
    await deletePost(post.value.id)
    confirmDelete.value = false
    router.replace('/board')
  } catch (err) {
    deleteError.value = '삭제 중 오류가 발생했습니다.'
  } finally {
    deleting.value = false
  }
}

// UI Helpers
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
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${date.getFullYear()}.${m}.${d} ${h}:${min}`
}
</script>

<style>
/* Tiptap에서 생성된 본문 콘텐츠 렌더링 스타일 */
.tiptap-content {
  line-height: 1.8;
  word-break: break-all;
}

.tiptap-content p {
  margin-bottom: 1em;
}

.tiptap-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
  display: block;
}

.tiptap-content blockquote {
  border-left: 4px solid #DFE2E5;
  padding-left: 1rem;
  margin-left: 0;
  color: #6A737D;
  background-color: #f8f9fa;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-radius: 0 4px 4px 0;
}

.tiptap-content ul,
.tiptap-content ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.tiptap-content a {
  color: #1e88e5;
  text-decoration: underline;
}

.leading-tight {
  line-height: 1.4 !important;
}

.hover-scale:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}
</style>
