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
              
              <!-- 좋아요 트랜잭션 영역 -->
              <span 
                class="d-flex align-center cursor-pointer hover-scale transition-fast"
                :class="isLiked ? 'text-pink-darken-1' : 'text-grey-darken-1'"
                @click="handleToggleLike"
                :style="likeLoading ? 'opacity: 0.5; pointer-events: none;' : ''"
              >
                <v-icon size="small" class="mr-1">{{ isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon> 
                {{ post.likeCount || 0 }}
              </span>
              
              <span class="d-flex align-center text-blue-darken-1"><v-icon size="small" class="mr-1">mdi-comment-outline</v-icon> {{ post.commentCount || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 첨부된 도서 정보 영역 -->
        <div v-if="post.attachedBook" class="pa-6 border-b bg-indigo-lighten-5">
          <div class="text-caption text-indigo-darken-2 font-weight-black mb-3">
            <v-icon size="small" class="mr-1">mdi-book-open-page-variant</v-icon> 함께 읽고 있는 책
          </div>
          <v-card 
            variant="flat" 
            color="white" 
            class="rounded-lg border d-flex pa-4 book-hover-effect cursor-pointer"
            :href="post.attachedBook.url"
            target="_blank"
          >
            <v-img 
              :src="post.attachedBook.thumbnail || 'https://via.placeholder.com/80x115?text=No+Cover'" 
              width="70" 
              height="100" 
              cover 
              class="rounded border mr-5 flex-grow-0 shrink-0 shadow-sm"
            ></v-img>
            <div class="d-flex flex-column justify-center flex-grow-1 overflow-hidden">
              <div class="text-subtitle-1 font-weight-black text-grey-darken-4 text-truncate mb-1">{{ post.attachedBook.title }}</div>
              <div class="text-body-2 text-grey-darken-2 text-truncate mb-2">
                {{ post.attachedBook.authors?.join(', ') || '알수없음' }} 저 | {{ post.attachedBook.publisher }}
              </div>
              <div class="d-flex align-center mt-auto">
                <v-chip size="x-small" color="indigo-darken-1" variant="tonal" class="font-weight-bold">
                  자세히 보기 <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
                </v-chip>
              </div>
            </div>
          </v-card>
        </div>

        <!-- 에디터로 작성된 본문 내용 렌더링 -->
        <div class="pa-6 tiptap-content text-body-1 text-grey-darken-4" v-html="post.content"></div>
        
      </v-card>

      <!-- 에러 시 -->
      <v-alert v-else type="error" variant="tonal" class="rounded-lg mt-4 font-weight-bold text-caption">
        게시글을 불러올 수 없습니다. 삭제되었거나 권한이 없을 수 있습니다.
      </v-alert>

      <!-- 댓글 영역 -->
      <v-card v-if="post" class="rounded-xl border bg-white pa-6 mt-4" elevation="0">
        <h3 class="text-h6 font-weight-black text-grey-darken-4 mb-4">
          댓글 <span class="text-blue-darken-1">{{ comments.length }}</span>
        </h3>

        <!-- 댓글 목록 -->
        <div v-if="loadingComments" class="text-center pa-4">
          <v-progress-circular indeterminate color="blue-darken-1"></v-progress-circular>
        </div>
        
        <div v-else-if="comments.length === 0" class="text-center pa-8 text-grey-darken-1 bg-grey-lighten-5 rounded-lg mb-6">
          <v-icon size="40" class="mb-2 text-grey-lighten-1">mdi-comment-outline</v-icon>
          <p class="text-body-2 font-weight-bold">아직 댓글이 없습니다. 가장 먼저 댓글을 남겨보세요!</p>
        </div>

        <div v-else class="mb-6">
          <div v-for="comment in comments" :key="comment.id" class="d-flex gap-3 mb-4 pb-4 border-b">
            <v-avatar size="36" class="border bg-white mt-1 shrink-0">
              <v-img :src="getProfileImageUrl(comment.author.profileImageId)"></v-img>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="d-flex justify-space-between align-center mb-1">
                <div class="d-flex align-center gap-2">
                  <span class="text-subtitle-2 font-weight-bold text-grey-darken-4">{{ comment.author.nickname }}</span>
                  <span class="text-caption text-grey-darken-1">{{ formatDate(comment.createdAt) }}</span>
                  <span v-if="comment.isEdited" class="text-caption text-grey-darken-1 font-italic">(수정됨)</span>
                </div>
                
                <div 
                  v-if="authStore.user?.uid === comment.author.uid && editingCommentId !== comment.id" 
                  class="d-flex align-center gap-1"
                >
                  <v-btn 
                    variant="text" 
                    size="x-small" 
                    color="grey-darken-2" 
                    icon="mdi-pencil" 
                    class="rounded-lg"
                    @click="startEditComment(comment)"
                  ></v-btn>
                  <v-btn 
                    variant="text" 
                    size="x-small" 
                    color="red-lighten-1" 
                    icon="mdi-close" 
                    class="rounded-lg"
                    @click="handleDeleteComment(comment.id)"
                  ></v-btn>
                </div>
              </div>
              
              <!-- 수정 모드 표시 -->
              <div v-if="editingCommentId === comment.id" class="mt-2">
                <v-textarea
                  v-model="editCommentContent"
                  variant="outlined"
                  bg-color="white"
                  color="blue-darken-1"
                  rows="2"
                  auto-grow
                  hide-details
                  density="compact"
                  class="mb-2"
                ></v-textarea>
                <div class="d-flex justify-end gap-2">
                  <v-btn size="small" variant="text" color="grey-darken-2" class="font-weight-bold rounded-lg" @click="cancelEditComment">취소</v-btn>
                  <v-btn size="small" color="blue-darken-1" variant="flat" class="font-weight-bold rounded-lg" :loading="updatingComment" @click="submitEditComment(comment.id)">수정 완료</v-btn>
                </div>
              </div>
              
              <!-- 일반 보기 모드 -->
              <p v-else class="text-body-2 text-grey-darken-3" style="white-space: pre-wrap; word-break: break-all;">{{ comment.content }}</p>
            </div>
          </div>
        </div>

        <!-- 댓글 입력창 -->
        <div class="d-flex gap-3 align-start">
          <v-avatar size="40" class="border bg-white mt-1">
            <v-img :src="getProfileImageUrl(authStore.userData?.profileImageId || 'avatar_bronze_01')"></v-img>
          </v-avatar>
          <div class="flex-grow-1">
            <v-textarea
              v-model="newComment"
              placeholder="댓글을 남겨보세요..."
              variant="outlined"
              color="blue-darken-1"
              bg-color="grey-lighten-5"
              rounded="lg"
              auto-grow
              rows="2"
              max-rows="5"
              hide-details
              class="font-weight-medium mb-2"
              :disabled="!isLoggedIn || submittingComment"
            ></v-textarea>
            
            <div class="d-flex justify-end">
              <v-btn
                v-if="isLoggedIn"
                color="blue-darken-1"
                variant="flat"
                class="font-weight-bold rounded-lg px-6"
                elevation="0"
                :loading="submittingComment"
                :disabled="!newComment.trim()"
                @click="submitComment"
              >
                등록
              </v-btn>
              <v-btn
                v-else
                color="grey-darken-2"
                variant="tonal"
                class="font-weight-bold rounded-lg px-6"
                elevation="0"
                @click="router.push('/login')"
              >
                로그인 후 작성
              </v-btn>
            </div>
          </div>
        </div>

      </v-card>
      
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
const { fetchPost, incrementViewCount, deletePost, loading, fetchComments, createComment, updateComment, deleteComment, checkUserLiked, toggleLike } = useBoard()

const post = ref(null)
const confirmDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

// 댓글 상태
const comments = ref([])
const newComment = ref('')
const loadingComments = ref(false)
const submittingComment = ref(false)

// 댓글 수정 상태
const editingCommentId = ref(null)
const editCommentContent = ref('')
const updatingComment = ref(false)

// 좋아요 상태
const isLiked = ref(false)
const likeLoading = ref(false)

const isLoggedIn = computed(() => {
  return authStore.user && authStore.userData?.status === 'active'
})

const isAuthor = computed(() => {
  return authStore.user && post.value && post.value.author.uid === authStore.user.uid
})

onMounted(async () => {
  const postId = route.params.id
  if (postId) {
    post.value = await fetchPost(postId)
    
    if (post.value) {
      incrementViewCount(postId)
      loadComments(postId)
      
      // 로그인한 유저의 좋아요 상태 체크
      if (isLoggedIn.value) {
        isLiked.value = await checkUserLiked(postId, authStore.user.uid)
      }
    }
  }
})

// 좋아요 처리 로직
const handleToggleLike = async () => {
  if (!isLoggedIn.value) {
    alert('로그인한 회원만 좋아요를 누를 수 있습니다.')
    router.push('/login')
    return
  }
  
  if (!post.value || likeLoading.value) return
  
  likeLoading.value = true
  const postId = post.value.id
  const currentLikeState = isLiked.value
  
  // 낙관적 UI 업데이트 (Optimistic Update)
  isLiked.value = !currentLikeState
  post.value.likeCount = Math.max(0, (post.value.likeCount || 0) + (currentLikeState ? -1 : 1))

  try {
    await toggleLike(postId, authStore.user.uid, currentLikeState)
  } catch (err) {
    // 실패 시 롤백
    isLiked.value = currentLikeState
    post.value.likeCount = Math.max(0, (post.value.likeCount || 0) + (currentLikeState ? 1 : -1))
    alert('좋아요 처리 중 오류가 발생했습니다.')
  } finally {
    likeLoading.value = false
  }
}

const loadComments = async (postId) => {
  loadingComments.value = true
  try {
    comments.value = await fetchComments(postId)
  } catch (err) {
    console.error(err)
  } finally {
    loadingComments.value = false
  }
}

const submitComment = async () => {
  if (!newComment.value.trim() || !post.value) return
  
  submittingComment.value = true
  const postId = post.value.id
  
  try {
    const commentData = {
      content: newComment.value.trim(),
      author: {
        uid: authStore.user.uid,
        nickname: authStore.userData.nickname,
        profileImageId: authStore.userData.profileImageId || 'avatar_bronze_01'
      }
    }
    
    await createComment(postId, commentData)
    
    // 성공 후 UI 상태 갱신
    newComment.value = ''
    post.value.commentCount = (post.value.commentCount || 0) + 1
    await loadComments(postId) // 최신 목록 다시 불러오기
    
  } catch (err) {
    alert('댓글 등록 중 오류가 발생했습니다.')
  } finally {
    submittingComment.value = false
  }
}

const startEditComment = (comment) => {
  editingCommentId.value = comment.id
  editCommentContent.value = comment.content
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editCommentContent.value = ''
}

const submitEditComment = async (commentId) => {
  if (!editCommentContent.value.trim() || updatingComment.value) return
  
  updatingComment.value = true
  
  try {
    await updateComment(post.value.id, commentId, editCommentContent.value.trim())
    
    // 성공 시 클라이언트 단 표시 즉각 갱신
    const target = comments.value.find(c => c.id === commentId)
    if (target) {
      target.content = editCommentContent.value.trim()
      target.isEdited = true
    }
    cancelEditComment()
  } catch (err) {
    alert('댓글 수정 중 오류가 발생했습니다.')
  } finally {
    updatingComment.value = false
  }
}

const handleDeleteComment = async (commentId) => {
  if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return
  
  try {
    await deleteComment(post.value.id, commentId)
    post.value.commentCount = Math.max(0, (post.value.commentCount || 0) - 1)
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (err) {
    alert('댓글 삭제에 실패했습니다.')
  }
}

const editPost = () => {
  if (post.value) {
    router.push(`/board/write?edit=${post.value.id}`)
  }
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
