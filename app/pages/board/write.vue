<template>
  <div class="write-page pa-4 fade-in">
    <div class="write-container">
      <!-- 헤더 -->
      <div class="flex items-center justify-between mb-4">
        <button class="btn btn--text btn--icon" @click="router.back()"><i class="mdi mdi-arrow-left"></i></button>
        <h1 class="text-h5 font-black text-grey-dark">{{ isEditMode ? '게시글 수정' : '게시글 작성' }}</h1>
        <div style="width:36px;"></div>
      </div>

      <div class="card">
        <div class="card-body">
          <!-- 카테고리 + 책 찾기 + (도서 장르) -->
          <div class="flex gap-3 mb-4">
            <select v-model="formData.category" class="select flex-grow" @change="handleCategoryChange">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
            <select v-if="formData.category === '도서 추천'" v-model="formData.bookGenre" class="select flex-grow">
              <option value="" disabled>장르를 선택하세요</option>
              <option v-for="genre in bookGenres" :key="genre" :value="genre">{{ genre }}</option>
            </select>
            <button
              v-if="(formData.category === '책 리뷰' || formData.category === '도서 추천') && !attachedBook"
              class="btn btn--indigo flex items-center gap-2 rounded-sm"
              style="height:52px;padding:0 24px;"
              @click="showBookSearchModal = true"
            >
              <i class="mdi mdi-book-search-outline"></i>책 찾기
            </button>
          </div>

          <!-- 첨부 도서 -->
          <div v-if="attachedBook" class="attached-book mb-6">
            <div class="flex items-center pa-3">
              <img
                :src="attachedBook.thumbnail || 'https://via.placeholder.com/60x85?text=No+Cover'"
                class="book-img mr-4" style="width:45px;height:65px;"
                alt="책 표지"
              />
              <div class="flex-grow overflow-hidden">
                <div class="text-caption font-bold mb-1" style="color:#283593;">첨부된 도서</div>
                <div class="text-subtitle-2 font-black text-grey-dark text-truncate">{{ attachedBook.title }}</div>
                <div class="text-caption text-grey-2 text-truncate">{{ attachedBook.authors?.join(', ') || '알수없음' }} | {{ attachedBook.publisher }}</div>
              </div>
              <button class="btn btn--text btn--icon" @click="attachedBook = null"><i class="mdi mdi-close-circle"></i></button>
            </div>
          </div>

          <!-- 제목 -->
          <input
            v-model="formData.title"
            class="input mb-6"
            type="text"
            placeholder="제목을 입력하세요 (최대 50자)"
            maxlength="50"
          />

          <!-- 에디터 -->
          <p class="text-subtitle-2 font-bold mb-2 text-grey-3">
            내용 작성 <span class="text-caption font-bold" style="color:#E65100;margin-left:8px;">* 서버 용량상 이미지 첨부는 불가합니다.</span>
          </p>
          <TiptapEditor v-model="formData.content" class="mb-6" />

          <div v-if="errorMsg" class="alert alert--error mb-6 rounded-sm font-bold text-caption">{{ errorMsg }}</div>

          <!-- 버튼 -->
          <div class="flex gap-3 justify-end">
            <button class="btn btn--grey btn--lg rounded-sm font-bold" :disabled="loading" @click="router.back()">취소</button>
            <button class="btn btn--primary btn--lg rounded-sm font-bold" :class="{'is-loading':loading}" :disabled="loading" @click="handleSubmit">
              {{ isEditMode ? '수정완료' : '등록하기' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 비인가 모달 -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="showLoginDialog" class="modal-overlay">
          <div class="modal" style="text-align:center;">
            <div class="card-body">
              <i class="mdi mdi-lock-alert-outline" style="font-size:3rem;color:#F57C00;display:block;margin-bottom:16px;"></i>
              <h3 class="text-h6 font-black mb-2">권한이 없습니다</h3>
              <p class="text-body-2 text-grey-2 mb-6">게시글 작성은 로그인 후 이용 가능합니다.</p>
              <div class="flex gap-2 justify-center">
                <button class="btn btn--tonal font-bold rounded-sm" @click="router.push('/')">돌아가기</button>
                <button class="btn btn--primary font-bold rounded-sm" @click="router.push('/login')">로그인</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <BookSearchModal v-model="showBookSearchModal" @select="handleBookSelect" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useBoard } from '~/composables/useBoard'
import TiptapEditor from '~/components/TiptapEditor.vue'
import BookSearchModal from '~/components/BookSearchModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { createPost, fetchPost, updatePost } = useBoard()

const showLoginDialog = ref(false)
const showBookSearchModal = ref(false)
const attachedBook = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const categories = ['도서 추천', '책 리뷰', '자유글', '정보/팁', '건의사항']
const bookGenres = ['소설', '인문/철학', '자기계발', 'IT과학', '시/에세이', '역사', '예술', '기타']
const formData = ref({ category: '자유글', bookGenre: '', title: '', content: '' })
const isEditMode = computed(() => !!route.query.edit)

onMounted(async () => {
  if (!authStore.user || authStore.userData?.status !== 'active') { showLoginDialog.value = true; return }
  
  if (route.query.category) {
    formData.value.category = route.query.category
  }

  if (isEditMode.value) {
    loading.value = true
    try {
      const existingPost = await fetchPost(route.query.edit)
      if (existingPost.author.uid !== authStore.user.uid && authStore.userData?.role !== 'master') {
        alert('수정 권한이 없습니다.'); router.replace('/board'); return
      }
      formData.value.category = existingPost.category
      formData.value.bookGenre = existingPost.bookGenre || ''
      formData.value.title = existingPost.title
      formData.value.content = existingPost.content
      if (existingPost.attachedBook) attachedBook.value = existingPost.attachedBook
    } catch (err) { alert('게시글을 불러올 수 없습니다.'); router.back() }
    finally { loading.value = false }
  } else if (route.query.openSearch === 'true' && (formData.value.category === '책 리뷰' || formData.value.category === '도서 추천')) {
    // URL에 openSearch=true가 있으면 자동으로 도서 검색 모달 열기
    showBookSearchModal.value = true
  }
})

const extractTextFromHTML = (htmlString) => {
  const span = document.createElement('span')
  span.innerHTML = htmlString
  const text = span.textContent || span.innerText || ''
  return text.substring(0, 150) + (text.length > 150 ? '...' : '')
}
const handleBookSelect = (book) => { attachedBook.value = book }
const handleCategoryChange = (e) => { 
  if (e.target.value !== '책 리뷰' && e.target.value !== '도서 추천') {
    attachedBook.value = null 
  }
  if (e.target.value !== '도서 추천') {
    formData.value.bookGenre = ''
  }
}

const handleSubmit = async () => {
  errorMsg.value = ''
  if (!formData.value.title.trim()) { errorMsg.value = '제목을 입력해주세요.'; return }
  if (formData.value.category === '도서 추천' && !formData.value.bookGenre) { errorMsg.value = '도서 장르를 선택해주세요.'; return }
  if ((formData.value.category === '도서 추천' || formData.value.category === '책 리뷰') && !attachedBook.value) { errorMsg.value = '책을 첨부해주세요.'; return }
  if (!formData.value.content || formData.value.content === '<p></p>') { errorMsg.value = '내용을 작성해주세요.'; return }
  loading.value = true
  try {
    const postData = {
      category: formData.value.category, title: formData.value.title.trim(),
      content: formData.value.content, contentPreview: extractTextFromHTML(formData.value.content),
      attachedBook: attachedBook.value,
      bookGenre: formData.value.bookGenre || null,
      author: { uid: authStore.user.uid, nickname: authStore.userData.nickname, profileImageId: authStore.userData.profileImageId || 'avatar_bronze_01' }
    }
    if (isEditMode.value) { await updatePost(route.query.edit, postData); router.replace(`/board/${route.query.edit}`) }
    else { const docId = await createPost(postData); router.replace(`/board/${docId}`) }
  } catch (err) {
    errorMsg.value = isEditMode.value ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다.'
  } finally { loading.value = false }
}
</script>

<style scoped>
.write-page { min-height: 100vh; background: #F5F5F5; }
.write-container { max-width: 900px; margin: 0 auto; }
.attached-book { background: #E8EAF6; border: 1px solid #9FA8DA; border-radius: 8px; position: relative; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mr-4 { margin-right: 16px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.pa-3 { padding: 12px; }
</style>
