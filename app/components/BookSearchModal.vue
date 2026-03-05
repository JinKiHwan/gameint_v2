<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600" scrollable>
    <v-card class="rounded-xl border bg-white" elevation="0">
      
      <!-- Header -->
      <v-card-title class="d-flex justify-space-between align-center px-6 py-4 border-b">
        <span class="text-h6 font-weight-black text-grey-darken-4 text-truncate">
          <v-icon color="yellow-darken-2" class="mr-1">mdi-book-search</v-icon>
          도서 검색
        </span>
        <v-btn icon="mdi-close" variant="text" size="small" color="grey-darken-2" @click="closeModal"></v-btn>
      </v-card-title>

      <!-- Search Bar -->
      <div class="px-6 py-4 bg-grey-lighten-5 border-b sticky-top z-10">
        <v-text-field
          v-model="searchQuery"
          placeholder="책 제목을 입력하세요..."
          variant="outlined"
          density="compact"
          bg-color="white"
          rounded="lg"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          color="blue-darken-1"
          class="font-weight-medium"
          @keyup.enter="performSearch"
        >
          <template v-slot:append>
            <v-btn 
              color="blue-darken-1" 
              variant="flat" 
              height="40" 
              class="rounded-lg font-weight-bold ml-2" 
              :loading="isSearching"
              @click="performSearch"
            >
              검색
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <!-- Results Area -->
      <v-card-text class="pa-0 bg-white" style="height: 400px;">
        
        <!-- Loading -->
        <div v-if="isSearching" class="d-flex justify-center align-center h-100">
          <v-progress-circular indeterminate color="blue-darken-1"></v-progress-circular>
        </div>

        <!-- Initial/Empty state -->
        <div v-else-if="books.length === 0 && !hasSearched" class="d-flex flex-column justify-center align-center h-100 text-grey-darken-1">
          <v-icon size="64" class="mb-4 text-grey-lighten-2">mdi-bookshelf</v-icon>
          <p class="text-body-2 font-weight-medium">검색어를 입력하고 리뷰할 책을 찾아보세요.</p>
        </div>
        
        <div v-else-if="books.length === 0 && hasSearched" class="d-flex flex-column justify-center align-center h-100 text-grey-darken-1">
          <v-icon size="64" class="mb-4 text-grey-lighten-2">mdi-alert-circle-outline</v-icon>
          <p class="text-body-2 font-weight-medium">검색 결과가 없습니다.</p>
        </div>

        <!-- Book List -->
        <v-list v-else lines="three" class="pa-2">
          <template v-for="(book, index) in books" :key="book.isbn">
            <v-list-item 
              class="rounded-lg mb-2 hover-bg-grey cursor-pointer transition-fast"
              @click="selectBook(book)"
            >
              <template v-slot:prepend>
                <v-img
                  :src="book.thumbnail || 'https://via.placeholder.com/80x115?text=No+Cover'"
                  width="60"
                  height="85"
                  cover
                  class="rounded border mr-4"
                ></v-img>
              </template>

              <template v-slot:title>
                <div class="text-subtitle-1 font-weight-black text-grey-darken-4 line-clamp-1 mb-1">
                  {{ book.title }}
                </div>
              </template>

              <template v-slot:subtitle>
                <div class="text-caption text-grey-darken-2 font-weight-medium">
                  <div class="mb-1"><v-icon size="x-small" class="mr-1">mdi-account-edit</v-icon> {{ book.authors.join(', ') || '알수없음' }}</div>
                  <div><v-icon size="x-small" class="mr-1">mdi-domain</v-icon> {{ book.publisher }}</div>
                </div>
              </template>
              
              <template v-slot:append>
                <v-btn variant="tonal" size="small" color="blue-darken-1" class="font-weight-bold rounded-lg ml-2">선택</v-btn>
              </template>
            </v-list-item>
            <v-divider v-if="index !== books.length - 1" class="mx-4 my-2 opacity-20"></v-divider>
          </template>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const config = useRuntimeConfig()
const searchQuery = ref('')
const isSearching = ref(false)
const hasSearched = ref(false)
const books = ref([])

const closeModal = () => {
  emit('update:modelValue', false)
  // Optional: reset search on close
  // searchQuery.value = ''
  // books.value = []
  // hasSearched.value = false
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  isSearching.value = true
  hasSearched.value = true
  books.value = []

  try {
    const response = await fetch(`https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(searchQuery.value)}&size=15`, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${config.public.kakaoRestApiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`API Request failed with status ${response.status}`)
    }

    const data = await response.json()
    books.value = data.documents
  } catch (err) {
    console.error('Book search error:', err)
    alert('책 검색에 실패했습니다. (API 키 또는 네트워크 확인 필요)')
  } finally {
    isSearching.value = false
  }
}

const selectBook = (book) => {
  // 사용하기 편하게 데이터를 정제해서 넘겨줌
  const refinedBook = {
    title: book.title,
    authors: book.authors,
    publisher: book.publisher,
    thumbnail: book.thumbnail,
    url: book.url,
    isbn: book.isbn
  }
  emit('select', refinedBook)
  closeModal()
}
</script>

<style scoped>
.hover-bg-grey:hover {
  background-color: #f8f9fa !important;
}
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.sticky-top {
  position: sticky;
  top: 0;
}
.z-10 {
  z-index: 10;
}
.transition-fast {
  transition: all 0.2s ease;
}
</style>
