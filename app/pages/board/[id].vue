<template>
  <div class="detail-page pa-4 fade-in">
    <div class="detail-container">
      <!-- 상단 컨트롤 -->
      <div class="flex items-center justify-between mb-4">
        <button class="btn btn--text btn--icon" @click="router.back()"><i class="mdi mdi-arrow-left"></i></button>
        <div v-if="isAuthor" class="flex gap-2">
          <button class="btn btn--tonal font-bold rounded-sm" @click="editPost">수정</button>
          <button class="btn btn--tonal-danger font-bold rounded-sm" @click="confirmDelete = true">삭제</button>
        </div>
      </div>

      <!-- 로딩 스켈레톤 -->
      <div v-if="loading" class="card pa-6 rounded-xl">
        <div class="skeleton skeleton--title" style="width:30%;"></div>
        <div class="skeleton" style="width:70%;height:32px;margin-bottom:24px;"></div>
        <div class="skeleton skeleton--avatar" style="width:36px;height:36px;"></div>
        <div v-for="i in 6" :key="i" class="skeleton skeleton--text" :style="`width:${80 + (i%3)*10}%;`"></div>
      </div>

      <!-- 게시글 본문 -->
      <div v-else-if="post" class="card overflow-hidden mb-4">
        <!-- 헤더 -->
        <div class="post-header">
          <div class="flex justify-between items-center mb-4">
            <span :class="`chip chip--${getCategoryChipClass(post.category)} chip--sm`">{{ post.category }}</span>
            <div class="text-caption text-grey-2 font-medium">
              {{ formatDate(post.createdAt) }}<span v-if="post.isEdited" class="font-italic ml-1">(수정됨)</span>
            </div>
          </div>

          <h1 class="text-h5 font-black text-grey-dark mb-6" style="word-break:keep-all;line-height:1.4;">{{ post.title }}</h1>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <template v-for="author in [resolveUser(post.author.uid, post.author)]" :key="'author_' + post.id">
                <div class="avatar avatar--sm border bg-white">
                  <img :src="getProfileImagePath(author.profileImageId)" alt="프로필" />
                </div>
                <span class="text-subtitle-2 font-bold text-grey-dark">{{ author.nickname }}</span>
              </template>
            </div>
            <div class="flex gap-4 text-body-2 text-grey-2 font-bold">
              <span class="flex items-center gap-1"><i class="mdi mdi-eye-outline" style="font-size:.9em;"></i>{{ post.viewCount || 0 }}</span>
              <span
                class="flex items-center gap-1 cursor-pointer transition-fast"
                :class="isLiked ? 'text-pink' : 'text-grey-2'"
                :style="likeLoading ? 'opacity:0.5;pointer-events:none;' : ''"
                @click="handleToggleLike"
              >
                <i :class="`mdi ${isLiked ? 'mdi-heart' : 'mdi-heart-outline'}`" style="font-size:.9em;"></i>{{ post.likeCount || 0 }}
              </span>
              <span class="flex items-center gap-1 text-blue-dark"><i class="mdi mdi-comment-outline" style="font-size:.9em;"></i>{{ post.commentCount || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 첨부 도서 -->
        <div v-if="post.attachedBook" class="pa-6 border-b bg-indigo-light">
          <div class="text-caption font-black mb-3" style="color:#283593;">
            <i class="mdi mdi-book-open-page-variant mr-1"></i>함께 읽고 있는 책
          </div>
          <a :href="post.attachedBook.url" target="_blank" class="flex items-center bg-white rounded border pa-4 book-link hover-shadow cursor-pointer">
            <img
              :src="post.attachedBook.thumbnail || 'https://via.placeholder.com/80x115?text=No+Cover'"
              class="book-img mr-5" style="width:70px;height:100px;flex-shrink:0;"
              alt="책 표지"
            />
            <div class="flex-grow min-w-0">
              <div class="text-subtitle-1 font-black text-grey-dark text-truncate mb-1">{{ post.attachedBook.title }}</div>
              <div class="text-body-2 text-grey-3 text-truncate mb-2">{{ post.attachedBook.authors?.join(', ') || '알수없음' }} 저 | {{ post.attachedBook.publisher }}</div>
              <span class="chip chip--indigo-tonal chip--sm flex items-center gap-1" style="display:inline-flex;">자세히 보기 <i class="mdi mdi-open-in-new"></i></span>
            </div>
          </a>
        </div>

        <!-- 본문 내용 -->
        <div class="pa-6 tiptap-content" v-html="post.content"></div>
      </div>

      <!-- 에러 -->
      <div v-else class="alert alert--error rounded-sm mt-4 font-bold text-caption">
        게시글을 불러올 수 없습니다. 삭제되었거나 권한이 없을 수 있습니다.
      </div>

      <!-- 댓글 영역 -->
      <div v-if="post" class="card pa-6 rounded-xl">
        <h3 class="text-h6 font-black text-grey-dark mb-4">
          댓글 <span class="text-blue-dark">{{ comments.length }}</span>
        </h3>

        <!-- 댓글 로딩 -->
        <div v-if="loadingComments" class="text-center pa-4">
          <div class="spinner" style="margin:0 auto;"></div>
        </div>

        <!-- 댓글 없음 -->
        <div v-else-if="comments.length === 0" class="text-center pa-8 bg-grey-100 rounded mb-6">
          <i class="mdi mdi-comment-outline" style="font-size:2.5rem;color:#BDBDBD;display:block;margin-bottom:8px;"></i>
          <p class="text-body-2 font-bold text-grey-2">아직 댓글이 없습니다. 가장 먼저 댓글을 남겨보세요!</p>
        </div>

        <!-- 댓글 목록 -->
        <div v-else class="mb-6">
          <div v-for="comment in comments" :key="comment.id" class="comment-row mb-4 pb-4 border-b">
            <template v-for="cAuthor in [resolveUser(comment.author.uid, comment.author)]" :key="'comm_' + comment.id">
              <div class="avatar avatar--sm border bg-white" style="margin-top:4px;">
                <img :src="getProfileImagePath(cAuthor.profileImageId)" alt="프로필" />
              </div>
              <div class="flex-grow">
                <div class="flex justify-between items-center mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-subtitle-2 font-bold text-grey-dark">{{ cAuthor.nickname }}</span>
                    <span class="text-caption text-grey-2">{{ formatDate(comment.createdAt) }}</span>
                    <span v-if="comment.isEdited" class="text-caption text-grey-2 font-italic">(수정됨)</span>
                  </div>
                <div v-if="authStore.user?.uid === comment.author.uid && editingCommentId !== comment.id" class="flex items-center gap-1">
                  <button class="btn btn--text btn--icon-sm" @click="startEditComment(comment)"><i class="mdi mdi-pencil"></i></button>
                  <button class="btn btn--text-danger btn--icon-sm" @click="handleDeleteComment(comment.id)"><i class="mdi mdi-close"></i></button>
                </div>
              </div>

              <!-- 댓글 수정 모드 -->
              <div v-if="editingCommentId === comment.id" class="mt-2">
                <textarea v-model="editCommentContent" class="textarea mb-2" rows="2" style="resize: vertical;"></textarea>
                <div class="flex justify-end gap-2">
                  <button class="btn btn--text btn--sm font-bold rounded-sm" @click="cancelEditComment">취소</button>
                  <button class="btn btn--primary btn--sm font-bold rounded-sm" :class="{'is-loading':updatingComment}" :disabled="updatingComment" @click="submitEditComment(comment.id)">수정 완료</button>
                </div>
              </div>

              <!-- 일반 표시 -->
              <p v-else class="text-body-2 text-grey-3" style="white-space:pre-wrap;word-break:break-all;">{{ comment.content }}</p>
                </div>
            </template>
          </div>
        </div>

        <!-- 댓글 입력창 -->
        <div class="flex gap-3 items-start">
          <div class="avatar avatar--md border bg-white" style="margin-top:4px;flex-shrink:0;">
            <img :src="getProfileImagePath(authStore.userData?.profileImageId || 'avatar_bronze_01')" alt="내 프로필" />
          </div>
          <div class="flex-grow">
            <textarea
              v-model="newComment" class="textarea mb-2" placeholder="댓글을 남겨보세요..."
              rows="2" :disabled="!isLoggedIn || submittingComment"
            ></textarea>
            <div class="flex justify-end">
              <button v-if="isLoggedIn" class="btn btn--primary font-bold rounded-sm px-6" :class="{'is-loading':submittingComment}" :disabled="submittingComment || !newComment.trim()" @click="submitComment">등록</button>
              <button v-else class="btn btn--tonal font-bold rounded-sm px-6" @click="router.push('/login')">로그인 후 작성</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = false">
          <div class="modal" style="text-align:center;">
            <div class="card-body">
              <i class="mdi mdi-alert-circle-outline" style="font-size:3rem;color:#C62828;display:block;margin-bottom:16px;"></i>
              <h3 class="text-h6 font-black mb-2 text-grey-dark">게시글을 삭제하시겠습니까?</h3>
              <p class="text-body-2 text-grey-2 mb-6">삭제된 글은 복구할 수 없습니다.</p>
              <div v-if="deleteError" class="alert alert--error mb-4 text-caption font-bold">{{ deleteError }}</div>
              <div class="flex gap-2 justify-center">
                <button class="btn btn--tonal font-bold rounded-sm flex-grow" @click="confirmDelete = false">취소</button>
                <button class="btn btn--danger font-bold rounded-sm flex-grow" :class="{'is-loading':deleting}" :disabled="deleting" @click="handleDelete">삭제</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useBoard } from '~/composables/useBoard'
import { useUserMapper } from '~/composables/useUserMapper'
import { getProfileImagePath } from '~/composables/useProfileImages'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { fetchPost, incrementViewCount, deletePost, loading, fetchComments, createComment, updateComment, deleteComment, checkUserLiked, toggleLike } = useBoard()
const { resolveUser } = useUserMapper()

const post = ref(null)
const confirmDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

const comments = ref([])
const newComment = ref('')
const loadingComments = ref(false)
const submittingComment = ref(false)

const editingCommentId = ref(null)
const editCommentContent = ref('')
const updatingComment = ref(false)

const isLiked = ref(false)
const likeLoading = ref(false)

const isLoggedIn = computed(() => authStore.user && authStore.userData?.status === 'active')
const isAuthor = computed(() => authStore.user && post.value && post.value.author.uid === authStore.user.uid)

onMounted(async () => {
  const postId = route.params.id
  if (postId) {
    post.value = await fetchPost(postId)
    if (post.value) {
      // 조회수 어뷰징 방지: 24시간 내 동일 게시글 조회 시 쓰기 건너뜀
      if (shouldIncrementView(postId)) {
        incrementViewCount(postId)
      }
      loadComments(postId)
      if (isLoggedIn.value) isLiked.value = await checkUserLiked(postId, authStore.user.uid)
    }
  }
})

const shouldIncrementView = (postId) => {
  try {
    const viewedPosts = JSON.parse(localStorage.getItem('viewed_posts') || '{}')
    const now = new Date().getTime()
    const lastViewed = viewedPosts[postId]
    const DAY_MS = 24 * 60 * 60 * 1000

    if (!lastViewed || (now - lastViewed) > DAY_MS) {
      viewedPosts[postId] = now
      
      // 만료된 데이터 정리 (선택 사항: 과도한 localStorage 점유 방지)
      const cleaned = {}
      for (const id in viewedPosts) {
        if (now - viewedPosts[id] < DAY_MS) cleaned[id] = viewedPosts[id]
      }
      cleaned[postId] = now
      
      localStorage.setItem('viewed_posts', JSON.stringify(cleaned))
      return true
    }
  } catch (e) {
    console.warn('localStorage error:', e)
    return true // 에러 시에는 기본적으로 증가 허용
  }
  return false
}

const handleToggleLike = async () => {
  if (!isLoggedIn.value) { alert('로그인한 회원만 좋아요를 누를 수 있습니다.'); router.push('/login'); return }
  if (!post.value || likeLoading.value) return
  likeLoading.value = true
  const currentLikeState = isLiked.value
  isLiked.value = !currentLikeState
  post.value.likeCount = Math.max(0, (post.value.likeCount || 0) + (currentLikeState ? -1 : 1))
  try { await toggleLike(post.value.id, authStore.user.uid, currentLikeState) }
  catch (err) {
    isLiked.value = currentLikeState
    post.value.likeCount = Math.max(0, (post.value.likeCount || 0) + (currentLikeState ? 1 : -1))
    alert('좋아요 처리 중 오류가 발생했습니다.')
  } finally { likeLoading.value = false }
}

const loadComments = async (postId) => {
  loadingComments.value = true
  try { comments.value = await fetchComments(postId) }
  catch (err) { console.error(err) }
  finally { loadingComments.value = false }
}

const submitComment = async () => {
  if (!newComment.value.trim() || !post.value) return
  submittingComment.value = true
  try {
    await createComment(post.value.id, { content: newComment.value.trim(), author: { uid: authStore.user.uid, nickname: authStore.userData.nickname, profileImageId: authStore.userData.profileImageId || 'avatar_bronze_01' } })
    newComment.value = ''
    post.value.commentCount = (post.value.commentCount || 0) + 1
    await loadComments(post.value.id)
  } catch (err) { alert('댓글 등록 중 오류가 발생했습니다.') }
  finally { submittingComment.value = false }
}

const startEditComment = (comment) => { editingCommentId.value = comment.id; editCommentContent.value = comment.content }
const cancelEditComment = () => { editingCommentId.value = null; editCommentContent.value = '' }
const submitEditComment = async (commentId) => {
  if (!editCommentContent.value.trim() || updatingComment.value) return
  updatingComment.value = true
  try {
    await updateComment(post.value.id, commentId, editCommentContent.value.trim())
    const target = comments.value.find(c => c.id === commentId)
    if (target) { target.content = editCommentContent.value.trim(); target.isEdited = true }
    cancelEditComment()
  } catch (err) { alert('댓글 수정 에러: ' + (err.message || err)) }
  finally { updatingComment.value = false }
}

const handleDeleteComment = async (commentId) => {
  if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return
  try {
    await deleteComment(post.value.id, commentId)
    post.value.commentCount = Math.max(0, (post.value.commentCount || 0) - 1)
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (err) { alert('댓글 삭제에 실패했습니다.') }
}

const editPost = () => { if (post.value) router.push(`/board/write?edit=${post.value.id}`) }
const handleDelete = async () => {
  deleteError.value = ''
  deleting.value = true
  try { await deletePost(post.value.id); confirmDelete.value = false; router.replace('/board') }
  catch (err) { deleteError.value = '삭제 중 오류가 발생했습니다.' }
  finally { deleting.value = false }
}

const getCategoryChipClass = (cat) => {
  const map = { '도서 추천': 'light-green', '책 리뷰': 'green', '만화': 'pink', '자유글': 'grey', '정보/팁': 'orange', '건의사항': 'red' }
  return map[cat] || 'grey'
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

<style scoped>
.detail-page { min-height: 100vh; background: #F5F5F5; }
.detail-container { max-width: 900px; margin: 0 auto; }
.post-header { padding: 24px; background: #FAFAFA; border-bottom: 1px solid #e0e0e0; }
.comment-row { display: flex; gap: 12px; }
.book-link { text-decoration: none; display: flex; transition: all 0.2s; }
.mr-5 { margin-right: 20px; }
.mr-1 { margin-right: 4px; }
.pa-3 { padding: 12px; }
.pa-4 { padding: 16px; }
.pa-6 { padding: 24px; }
.pa-8 { padding: 32px; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-8 { margin-bottom: 32px; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.px-6 { padding-left: 24px; padding-right: 24px; }
.ml-1 { margin-left: 4px; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
</style>
