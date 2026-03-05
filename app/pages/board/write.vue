<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 fade-in">
    <v-container max-width="900" class="px-0">
      
      <!-- 헤더 보드 -->
      <div class="d-flex align-center justify-space-between mb-4">
        <v-btn icon="mdi-arrow-left" variant="text" size="small" color="grey-darken-2" @click="router.back()"></v-btn>
        <h1 class="text-h5 font-weight-black text-grey-darken-4">{{ isEditMode ? '게시글 수정' : '게시글 작성' }}</h1>
        <div style="width: 32px"></div> <!-- 중앙 정렬용 여백 -->
      </div>
      
      <v-card class="rounded-xl border bg-white pa-6" elevation="0">
        
        <div class="d-flex align-center gap-3 mb-4">
          <v-select
            v-model="formData.category"
            :items="categories"
            label="카테고리 선택"
            variant="outlined"
            color="blue-darken-1"
            bg-color="grey-lighten-5"
            class="font-weight-bold flex-grow-1"
            hide-details
            rounded="lg"
            @update:model-value="handleCategoryChange"
          ></v-select>

          <!-- 도서 첨부 버튼 -->
          <v-btn 
            v-if="formData.category === '책 리뷰' && !attachedBook"
            color="indigo-darken-2" 
            variant="flat" 
            height="56"
            class="rounded-lg font-weight-bold px-6 shrink-0"
            prepend-icon="mdi-book-search-outline"
            @click="showBookSearchModal = true"
          >
            책 찾기
          </v-btn>
        </div>

        <!-- 첨부된 도서 정보 카드 (있을 경우만 표시) -->
        <v-card 
          v-if="attachedBook" 
          variant="outlined" 
          color="indigo-lighten-4" 
          class="mb-6 rounded-lg bg-indigo-lighten-5 position-relative"
        >
          <div class="d-flex pa-3 align-center">
            <v-img 
              :src="attachedBook.thumbnail || 'https://via.placeholder.com/60x85?text=No+Cover'" 
              width="45" 
              height="65" 
              cover 
              class="rounded border mr-4 flex-grow-0 shrink-0"
            ></v-img>
            <div class="flex-grow-1 overflow-hidden">
              <div class="text-caption text-indigo-darken-2 font-weight-bold mb-1">첨부된 도서</div>
              <div class="text-subtitle-2 font-weight-black text-grey-darken-4 text-truncate">{{ attachedBook.title }}</div>
              <div class="text-caption text-grey-darken-2 text-truncate">{{ attachedBook.authors?.join(', ') || '알수없음' }} | {{ attachedBook.publisher }}</div>
            </div>
            
            <!-- 삭제 버튼 (우측 상단 절대배치) -->
            <v-btn 
              icon="mdi-close-circle" 
              variant="text" 
              color="grey-darken-1" 
              size="small" 
              class="position-absolute" 
              style="top: 4px; right: 4px;"
              @click="attachedBook = null"
            ></v-btn>
          </div>
        </v-card>

        <!-- 제목 입력 -->
        <v-text-field
          v-model="formData.title"
          label="제목을 입력하세요 (최대 50자)"
          variant="outlined"
          color="blue-darken-1"
          bg-color="grey-lighten-5"
          class="font-weight-bold mb-6 text-h6"
          hide-details
          rounded="lg"
          counter
          maxlength="50"
        ></v-text-field>

        <!-- 팁탭 에디터 컴포넌트 -->
        <p class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-3">
          내용 작성 <span class="text-caption text-orange-darken-3 ml-2">* 무료로 운영되는 공간이므로 서버 용량상 이미지 첨부는 불가합니다.</span>
        </p>
        <TiptapEditor v-model="formData.content" class="mb-6" />

        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-6 rounded-lg font-weight-bold text-caption text-left">
          {{ errorMsg }}
        </v-alert>

        <!-- 버튼 영역 -->
        <div class="d-flex gap-3 justify-end">
          <v-btn 
            color="grey-lighten-2" 
            variant="flat" 
            size="large" 
            class="font-weight-bold rounded-lg text-grey-darken-3" 
            elevation="0" 
            @click="router.back()"
            :disabled="loading"
          >
            취소
          </v-btn>
          <v-btn 
            color="blue-darken-1" 
            variant="flat" 
            size="large" 
            class="font-weight-bold rounded-lg" 
            elevation="0" 
            :loading="loading"
            @click="handleSubmit"
          >
            {{ isEditMode ? '수정완료' : '등록하기' }}
          </v-btn>
        </div>
      </v-card>

    </v-container>

    <!-- 비인가 접근 차단 모달 -->
    <v-dialog v-model="showLoginDialog" persistent max-width="400">
      <v-card class="pa-6 rounded-xl text-center border" elevation="0">
        <v-icon color="orange-darken-2" size="48" class="mb-4">mdi-lock-alert-outline</v-icon>
        <h3 class="text-h6 font-weight-black mb-2">권한이 없습니다</h3>
        <p class="text-body-2 text-grey-darken-1 mb-6">게시글 작성은 로그인 후 이용 가능합니다.</p>
        <div class="d-flex gap-2 justify-center">
          <v-btn color="grey-darken-2" variant="tonal" class="rounded-lg font-weight-bold" @click="router.push('/')">돌아가기</v-btn>
          <v-btn color="blue-darken-1" variant="flat" class="rounded-lg font-weight-bold" @click="router.push('/login')">로그인</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <BookSearchModal 
      v-model="showBookSearchModal" 
      @select="handleBookSelect" 
    />
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

const categories = ['책 리뷰', '자유글', '정보/팁', '건의사항']

const formData = ref({
  category: '자유글',
  title: '',
  content: ''
})

const isEditMode = computed(() => !!route.query.edit)

onMounted(async () => {
  if (!authStore.user || authStore.userData?.status !== 'active') {
    showLoginDialog.value = true
    return
  }
  
  // 수정 모드 진입 시 기존 데이터 조회 로직
  if (isEditMode.value) {
    loading.value = true
    try {
      const existingPost = await fetchPost(route.query.edit)
      // 본인 글이 아니거나 마스터가 아닌 경우 튕겨냄 (보안규칙에서도 막히지만 프론트 선제어)
      if (existingPost.author.uid !== authStore.user.uid && authStore.userData?.role !== 'master') {
        alert('수정 권한이 없습니다.')
        router.replace('/board')
        return
      }
      formData.value.category = existingPost.category
      formData.value.title = existingPost.title
      formData.value.content = existingPost.content
      if (existingPost.attachedBook) {
        attachedBook.value = existingPost.attachedBook
      }
    } catch (err) {
      alert('게시글을 불러올 수 없습니다.')
      router.back()
    } finally {
      loading.value = false
    }
  }
})

// HTML 태그를 제거하고 순수 텍스트만 추출해서 미리보기(contentPreview)용으로 생성
const extractTextFromHTML = (htmlString) => {
  const span = document.createElement('span')
  span.innerHTML = htmlString
  const text = span.textContent || span.innerText || ''
  return text.substring(0, 150) + (text.length > 150 ? '...' : '')
}

const handleBookSelect = (book) => {
  attachedBook.value = book
}

const handleCategoryChange = (val) => {
  if (val !== '책 리뷰') {
    attachedBook.value = null
  }
}

const handleSubmit = async () => {
  errorMsg.value = ''
  
  if (!formData.value.title.trim()) {
    errorMsg.value = '제목을 입력해주세요.'
    return
  }
  
  if (!formData.value.content || formData.value.content === '<p></p>') {
    errorMsg.value = '내용을 작성해주세요.'
    return
  }

  loading.value = true

  try {
    const postData = {
      category: formData.value.category,
      title: formData.value.title.trim(),
      content: formData.value.content,
      contentPreview: extractTextFromHTML(formData.value.content),
      attachedBook: attachedBook.value,
      author: {
        uid: authStore.user.uid,
        nickname: authStore.userData.nickname,
        profileImageId: authStore.userData.profileImageId || 'avatar_bronze_01'
      }
    }

    if (isEditMode.value) {
      await updatePost(route.query.edit, postData)
      router.replace(`/board/${route.query.edit}`)
    } else {
      const docId = await createPost(postData)
      router.replace(`/board/${docId}`) // 새로 작성 후 상세페이지로 바로 이동 개선
    }
  } catch (err) {
    console.error('Submit error:', err)
    errorMsg.value = isEditMode.value ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
