<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal modal--book-search">
      <!-- 헤더 -->
      <div class="modal__header">
        <span class="modal__title">
          <i class="mdi mdi-book-search" style="color:#F9A825;margin-right:6px;"></i>도서 검색
        </span>
        <button class="btn btn--text btn--icon" @click="closeModal"><i class="mdi mdi-close"></i></button>
      </div>

      <!-- 검색창 (고정) -->
      <div class="book-search-bar">
        <div class="input-with-suffix">
          <i class="mdi mdi-magnify" style="padding: 0 8px 0 12px; color: #757575;"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="책 제목을 입력하세요..."
            @keyup.enter="performSearch"
          />
          <button
            class="btn btn--primary btn--sm append-btn"
            :class="{ 'is-loading': isSearching }"
            :disabled="isSearching"
            @click="performSearch"
          >검색</button>
        </div>
      </div>

      <!-- 결과 영역 -->
      <div class="book-results">
        <!-- 로딩 -->
        <div v-if="isSearching" class="flex items-center justify-center h-full">
          <div class="spinner"></div>
        </div>

        <!-- 초기 안내 -->
        <div v-else-if="books.length === 0 && !hasSearched" class="empty-state">
          <i class="mdi mdi-bookshelf" style="font-size:4rem;color:#BDBDBD;display:block;margin-bottom:16px;"></i>
          <p class="text-body-2 font-medium text-grey-2">검색어를 입력하고 리뷰할 책을 찾아보세요.</p>
        </div>

        <!-- 검색 결과 없음 -->
        <div v-else-if="books.length === 0 && hasSearched" class="empty-state">
          <i class="mdi mdi-alert-circle-outline" style="font-size:4rem;color:#BDBDBD;display:block;margin-bottom:16px;"></i>
          <p class="text-body-2 font-medium text-grey-2">검색 결과가 없습니다.</p>
        </div>

        <!-- 도서 목록 -->
        <ul v-else class="list">
          <template v-for="(book, index) in books" :key="book.isbn">
            <li class="book-item cursor-pointer" @click="selectBook(book)">
              <img
                :src="book.thumbnail || 'https://via.placeholder.com/60x85?text=No+Cover'"
                class="book-item__img mr-4"
                alt="책 표지"
              />
              <div class="flex-grow min-w-0">
                <div class="text-subtitle-1 font-black text-grey-dark line-clamp-1 mb-1">{{ book.title }}</div>
                <div class="text-caption text-grey-2 font-medium mb-1">
                  <i class="mdi mdi-account-edit" style="font-size:.9em;margin-right:2px;"></i>{{ book.authors.join(', ') || '알수없음' }}
                </div>
                <div class="text-caption text-grey-2 font-medium">
                  <i class="mdi mdi-domain" style="font-size:.9em;margin-right:2px;"></i>{{ book.publisher }}
                </div>
              </div>
              <button class="btn btn--tonal-primary btn--sm font-bold rounded-sm ml-2 flex-shrink-0">선택</button>
            </li>
            <hr v-if="index !== books.length - 1" class="divider" style="opacity:0.4;margin:0 16px;" />
          </template>
        </ul>
      </div>
    </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'select'])

const config = useRuntimeConfig()
const searchQuery = ref('')
const isSearching = ref(false)
const hasSearched = ref(false)
const books = ref([])

const closeModal = () => { emit('update:modelValue', false) }

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  isSearching.value = true; hasSearched.value = true; books.value = []
  try {
    const response = await fetch(`https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(searchQuery.value)}&size=15`, {
      headers: { 'Authorization': `KakaoAK ${config.public.kakaoRestApiKey}` }
    })
    if (!response.ok) throw new Error(`API Request failed with status ${response.status}`)
    const data = await response.json()
    books.value = data.documents
  } catch (err) {
    console.error('Book search error:', err)
    alert('책 검색에 실패했습니다. (API 키 또는 네트워크 확인 필요)')
  } finally { isSearching.value = false }
}

const selectBook = (book) => {
  emit('select', { title: book.title, authors: book.authors, publisher: book.publisher, thumbnail: book.thumbnail, url: book.url, isbn: book.isbn })
  closeModal()
}
</script>

<style scoped>
.modal--book-search {
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.book-search-bar {
  padding: 16px 24px;
  background: #FAFAFA;
  border-bottom: 1px solid #E0E0E0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.input-with-suffix {
  display: flex; align-items: center;
  border: 1.5px solid #E0E0E0; border-radius: 8px; background: #fff; overflow: hidden;
  &:focus-within { border-color: #1E88E5; box-shadow: 0 0 0 3px rgba(30,136,229,0.12); }
  input { flex:1; border:none; background:transparent; padding:10px 12px 10px 4px; font-size:0.9375rem; font-weight:500; outline:none; &::placeholder{ color:#BDBDBD; } }
  .append-btn { margin: 0 8px 0 0; height: 36px; }
}

.book-results {
  flex: 1;
  overflow-y: auto;
  min-height: 400px;
  background: #fff;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; min-height: 400px; text-align: center;
}

.book-item {
  display: flex; align-items: center;
  padding: 16px;
  transition: background 0.2s;
  &:hover { background: #FAFAFA; }
}

.book-item__img {
  width: 60px; height: 85px; object-fit: cover; border-radius: 4px; border: 1px solid #e0e0e0; flex-shrink: 0;
}

.modal__header { padding: 20px 24px 16px; border-bottom: 1px solid #e0e0e0; }

.ml-2 { margin-left: 8px; }
.mr-4 { margin-right: 16px; }
.mb-1 { margin-bottom: 4px; }
</style>
