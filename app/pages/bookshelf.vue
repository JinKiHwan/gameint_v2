<template>
  <div class="fade-in pb-20" style="padding-bottom: 80px;">

    <!-- ① 히어로 배너 -->
    <div class="bs-hero mb-6">
      <img
        src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop"
        alt="책장 공유 배너"
        class="bs-hero__bg"
      />
      <div class="bs-hero__overlay">
        <div class="bs-hero__glass">
          <div class="bs-hero__content">
            <div class="bs-hero__text-wrap">
              <div class="text-caption font-bold text-white mb-1 opacity-80">
                <i class="mdi mdi-bookshelf mr-1"></i>멤버 책장
              </div>
              <h1 class="text-h4 font-black text-white mb-1">내 책장 공유 📚</h1>
              <p class="text-body-2 text-white opacity-80 mb-0">회원들의 책을 둘러보고, 대여 신청도 해보세요.</p>
            </div>
            <button
              v-if="authStore.user"
              class="btn btn--white rounded-xl font-bold flex items-center gap-2 bs-hero__btn"
              @click="openAddModal"
            >
              <i class="mdi mdi-plus-circle-outline"></i> 내 책 등록하기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ② 탭 -->
    <div class="tabs mb-6">
      <button
        v-for="tab in tabs" :key="tab.value"
        class="tab-btn"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >{{ tab.label }}</button>
    </div>

    <!-- ③ 전체 책장 탭 (그룹별 스와이퍼 형식) -->
    <div v-if="activeTab === 'all'">
      <!-- 검색/필터 -->
      <div class="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div class="input-with-suffix" style="max-width:360px; flex:1;">
          <i class="mdi mdi-magnify" style="padding:0 8px 0 12px;color:#757575;"></i>
          <input v-model="searchQuery" type="text" placeholder="책 제목 또는 소유자로 검색..." />
        </div>
        <select v-model="statusFilter" class="select" style="max-width:150px;">
          <option value="all">전체 상태</option>
          <option value="available">대여 가능</option>
          <option value="requested">신청 중</option>
          <option value="rented">대여 중</option>
        </select>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="text-center pa-10">
        <div class="spinner" style="margin:0 auto;"></div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="groupedBooks.length === 0" class="card">
        <div class="card-body text-center pa-10">
          <i class="mdi mdi-bookshelf" style="font-size:4rem;color:#BDBDBD;display:block;margin-bottom:16px;"></i>
          <h3 class="text-h6 font-bold text-grey-2 mb-2">등록된 책이 없습니다</h3>
          <p class="text-body-2 text-grey-3">가장 먼저 책장을 공유해보세요!</p>
        </div>
      </div>

      <!-- 그룹별 리스트 -->
      <div v-else class="flex flex-col gap-8">
        <div v-for="group in groupedBooks" :key="group.ownerUid" class="bs-owner-group">
          <!-- 그룹 헤더 -->
          <div class="flex items-center justify-between mb-3 px-1">
            <div class="flex items-center gap-2">
              <div class="bs-owner-avatar">
                <img :src="getProfileImagePath(group.ownerProfileImageId)" alt="프로필" />
              </div>
              <h3 class="text-subtitle-1 font-black text-grey-dark">
                {{ group.ownerNickname }}님의 책장
              </h3>
              <span class="text-caption text-grey-3 ms-1">{{ group.books.length }}권</span>
            </div>
          </div>

          <!-- 가로 슬라이더 (CSS Swiper 스타일 + 드래그 지원) -->
          <div v-drag-scroll class="bs-slider-container">
            <div class="bs-slider-content">
              <div
                v-for="item in group.books"
                :key="item.id"
                class="bs-slide-item card hover-shadow"
                @click="openDetailModal(item)"
              >
                <div class="bs-slide-cover">
                  <div class="bs-slide-cover__blur" :style="{ backgroundImage: `url(${item.book?.thumbnail || ''})` }"></div>
                  <img :src="item.book?.thumbnail || 'https://via.placeholder.com/120x170?text=No'" class="bs-slide-cover__img" alt="표지" />
                  <span
                    class="chip chip--xs position-absolute"
                    :class="statusChipClass(item.status)"
                    style="top:8px;right:8px;z-index:2;"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                </div>
                <div class="pa-3">
                  <h4 class="text-caption font-bold text-grey-dark line-clamp-1 mb-0">{{ item.book?.title }}</h4>
                  <p class="text-xs text-grey-3 line-clamp-1">{{ item.book?.authors?.[0] }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ④ 내 책장 탭 -->
    <div v-if="activeTab === 'mine'">
      <div v-if="!authStore.user" class="card">
        <div class="card-body text-center pa-10 text-grey-2 font-bold">
          <i class="mdi mdi-login" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
          로그인 후 이용해주세요.
        </div>
      </div>
      <template v-else>
        <div v-if="loadingMine" class="text-center pa-10"><div class="spinner" style="margin:0 auto;"></div></div>
        <div v-else-if="myBooks.length === 0" class="card">
          <div class="card-body text-center pa-10 text-grey-2 font-bold">
            <i class="mdi mdi-book-plus-outline" style="font-size:2.5rem;color:#BDBDBD;display:block;margin-bottom:12px;"></i>
            아직 등록한 책이 없습니다. 상단 버튼으로 책을 등록해보세요!
          </div>
        </div>
        <div v-else class="flex flex-col gap-3">
          <div v-for="item in myBooks" :key="item.id" class="card">
            <div class="card-body flex gap-4 items-start">
              <img :src="item.book?.thumbnail || ''" class="bs-mine-thumb" alt="표지" />
              <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="text-subtitle-1 font-black text-grey-dark line-clamp-1">{{ item.book?.title }}</h4>
                  <span
                    class="chip chip--xs"
                    :class="statusChipClass(item.status)"
                  >{{ statusLabel(item.status) }}</span>
                </div>
                <p class="text-caption text-grey-2 mb-1">{{ item.book?.authors?.join(', ') }}</p>
                <p v-if="item.memo" class="text-caption text-grey-3 italic mb-2">"{{ item.memo }}"</p>

                <!-- 대여 신청 알림 (소유자 전용) -->
                <div v-if="item.status === 'requested'" class="bs-action-alert mb-2">
                  <span><i class="mdi mdi-bell-ring"></i> <strong>{{ item.borrowerNickname }}</strong> 님이 대여를 신청했습니다!</span>
                  <div class="flex gap-2 mt-2">
                    <button class="btn btn--primary btn--xs font-bold rounded-sm" @click="handleAccept(item)">
                      <i class="mdi mdi-check"></i> 수락
                    </button>
                    <button class="btn btn--outlined btn--xs font-bold rounded-sm" @click="handleReject(item)">
                      <i class="mdi mdi-close"></i> 거절
                    </button>
                  </div>
                </div>

                <!-- 대여 중 표기 -->
                <div v-if="item.status === 'rented'" class="bs-rental-tag rented mb-2">
                  <i class="mdi mdi-account-key"></i> 대여 중 — <strong>{{ item.borrowerNickname }}</strong> 님
                  <button class="btn btn--dark btn--xs font-bold rounded-sm ml-auto" @click="handleReturn(item)">
                    <i class="mdi mdi-keyboard-return"></i> 반납 확인
                  </button>
                </div>
              </div>
              <!-- 삭제 -->
              <button
                v-if="item.status === 'available'"
                class="btn btn--text btn--icon"
                style="flex-shrink:0;"
                title="삭제"
                @click="handleRemove(item)"
              >
                <i class="mdi mdi-trash-can-outline" style="color:#EF5350;"></i>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ===== 책 상세/대여 모달 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="detailModal && targetBook" class="modal-overlay" @click.self="detailModal = false">
          <div class="modal bs-detail-modal" style="max-width:440px;">
            <div class="modal__header pa-5" style="padding-bottom: 0;">
              <span class="modal__title">📖 도서 정보</span>
              <button class="btn btn--text btn--icon" @click="detailModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal__body pa-9">
              <div class="flex" style="gap: 24px; align-items: flex-start; margin-bottom: 32px;">
                <img :src="targetBook.book?.thumbnail" class="bs-detail-thumb" alt="표지" />
                <div class="flex-grow min-w-0">
                  <h3 class="text-h6 font-black text-grey-dark mb-1 line-clamp-2" style="line-height: 1.3;">{{ targetBook.book?.title }}</h3>
                  <p class="text-body-2 text-grey-2 mb-4">{{ targetBook.book?.authors?.join(', ') }}</p>
                  <div class="flex items-center gap-2">
                    <span class="chip" :class="statusChipClass(targetBook.status)" style="font-size: 0.75rem; font-weight: 800;">
                      {{ statusLabel(targetBook.status) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 상세 정보 영역 (소유자/대여자) -->
              <div class="bs-detail-meta" style="padding: 24px 28px; background: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 20px; margin-bottom: 32px;">
                <div class="info-row flex justify-between items-center mb-5">
                  <div class="info-label flex items-center gap-3">
                    <i class="mdi mdi-account-circle-outline text-grey-3" style="font-size: 1.25rem;"></i>
                    <span class="text-caption text-grey-2 font-bold">소유자</span>
                  </div>
                  <span class="text-caption font-black text-grey-dark" style="font-size: 0.875rem;">{{ targetBook.ownerNickname }}님</span>
                </div>
                
                <div v-if="targetBook.status !== 'available'" class="info-row flex justify-between items-center">
                  <div class="info-label flex items-center gap-3">
                    <i class="mdi mdi-account-arrow-right-outline text-grey-3" style="font-size: 1.25rem;"></i>
                    <span class="text-caption text-grey-2 font-bold">대여자</span>
                  </div>
                  <span class="text-caption font-black text-blue-darken-2" style="font-size: 0.875rem;">{{ targetBook.borrowerNickname }}님</span>
                </div>

                <div v-if="targetBook.memo" class="flex flex-col mt-5 pt-5 border-t border-dashed border-grey-lighten-3">
                  <div class="info-label flex items-center gap-3 mb-3">
                    <i class="mdi mdi-comment-quote-outline text-grey-3" style="font-size: 1.25rem;"></i>
                    <span class="text-caption text-grey-2 font-bold">소유자 한마디</span>
                  </div>
                  <p class="text-body-2 text-grey-dark italic mb-0 bg-white pa-4 rounded-xl border border-grey-lighten-4 shadow-sm" style="line-height: 1.5;">
                    "{{ targetBook.memo }}"
                  </p>
                </div>
              </div>

              <!-- 대여/반납 액션 버튼 (타인 책일 경우) -->
              <div v-if="authStore.user && targetBook.ownerUid !== authStore.user.uid" class="flex flex-col gap-3">
                <!-- 대여 가능 상태 -->
                <button
                  v-if="targetBook.status === 'available'"
                  class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                  @click="handleRequestRental(targetBook); detailModal = false"
                >
                  <i class="mdi mdi-hand-pointing-up"></i> 대여 신청하기
                </button>

                <!-- 내가 신청한 상태 -->
                <button
                  v-else-if="targetBook.status === 'requested' && targetBook.borrowerUid === authStore.user.uid"
                  class="btn btn--outlined btn--lg btn--block font-black rounded-sm"
                  @click="handleCancelRequest(targetBook); detailModal = false"
                >
                  <i class="mdi mdi-close-circle-outline"></i> 신청 취소하기
                </button>

                <!-- 대여 중 상태 (내가 빌린 경우) -->
                <div
                  v-else-if="targetBook.status === 'rented' && targetBook.borrowerUid === authStore.user.uid"
                  class="flex flex-col gap-3"
                >
                  <button
                    class="btn btn--dark btn--lg btn--block font-black rounded-sm"
                    @click="handleRequestReturn(targetBook); detailModal = false"
                  >
                    <i class="mdi mdi-keyboard-return"></i> 반납 신청하기
                  </button>
                  <div class="alert bg-blue-light border-0 pa-3 rounded-xl text-center">
                    <span class="text-caption text-blue-darken-1">반납 신청 버튼을 누르면 소유자에게 알림이 전송됩니다.</span>
                  </div>
                </div>

                <!-- 이미 다른 사람이 대여 중 -->
                <div v-else class="alert alert--info pa-4 rounded-xl text-center">
                  <p class="text-body-2 font-bold mb-0">현재 대여 중인 도서입니다.</p>
                </div>
              </div>

              <!-- 소유자 본인일 경우 '내 책장' 안내 -->
              <div v-else-if="authStore.user" class="text-center pa-4 text-grey-3 text-caption font-bold">
                <i class="mdi mdi-account-circle-outline"></i> 본인의 도서는 '내 책장' 탭에서 관리할 수 있습니다.
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== 책 등록 모달 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="addModal" class="modal-overlay" @click.self="addModal = false">
          <div class="modal" style="max-width:500px;">
            <div class="modal__header">
              <span class="modal__title">📚 내 책 등록하기</span>
              <button class="btn btn--text btn--icon" @click="addModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal__body">
              <div v-if="!selectedBook" class="mb-4">
                <div class="input-with-suffix mb-3">
                  <i class="mdi mdi-magnify" style="padding:0 8px 0 12px;color:#757575;"></i>
                  <input v-model="bookSearchQuery" type="text" placeholder="책 제목으로 검색..." @keyup.enter="searchBook" />
                  <button class="btn btn--primary btn--sm append-btn" :class="{'is-loading':searchingBook}" @click="searchBook">검색</button>
                </div>
                <div v-if="bookSearchResults.length > 0" class="book-search-list">
                  <div
                    v-for="b in bookSearchResults" :key="b.isbn"
                    class="book-search-item cursor-pointer"
                    @click="selectedBook = b"
                  >
                    <img :src="b.thumbnail || 'https://via.placeholder.com/50x70?text=No'" class="book-search-thumb" alt="표지" />
                    <div class="min-w-0">
                      <div class="text-subtitle-2 font-bold text-grey-dark line-clamp-1">{{ b.title }}</div>
                      <div class="text-caption text-grey-2">{{ b.authors?.join(', ') }} | {{ b.publisher }}</div>
                    </div>
                  </div>
                </div>
                <div v-else-if="hasSearched" class="text-center pa-6 text-grey-2 font-bold text-caption">검색 결과가 없습니다.</div>
              </div>
              <div v-if="selectedBook" class="selected-book-preview mb-4">
                <img :src="selectedBook.thumbnail" class="selected-book-thumb" alt="선택한 책" />
                <div class="flex-grow min-w-0">
                  <div class="text-subtitle-1 font-black text-grey-dark">{{ selectedBook.title }}</div>
                  <div class="text-caption text-grey-2">{{ selectedBook.authors?.join(', ') }}</div>
                </div>
                <button class="btn btn--text btn--icon" @click="selectedBook = null"><i class="mdi mdi-close"></i></button>
              </div>
              <textarea v-model="bookMemo" class="textarea" rows="2" placeholder="한줄 소개를 남겨주세요 (선택)"></textarea>
            </div>
            <div class="modal__footer">
              <div v-if="addError" class="alert alert--error mb-3 text-caption"><i class="mdi mdi-alert-circle-outline"></i>{{ addError }}</div>
              <button
                class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                :class="{'is-loading':addingBook}"
                :disabled="!selectedBook || addingBook"
                @click="handleAddBook"
              >등록하기</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useBookshelf } from '~/composables/useBookshelf'
import { getProfileImagePath } from '~/composables/useProfileImages'
import { useRuntimeConfig } from '#app'

const authStore = useAuthStore()
const config = useRuntimeConfig()
const {
  loading: bsLoading,
  fetchAllBooks, fetchMyBooks,
  addBook, removeBook,
  requestRental, acceptRental, rejectRental, returnBook, cancelRequest, requestReturn,
} = useBookshelf()

// ── 마우스 드래그 스크롤 지시자 ────────────────────────────────────
const vDragScroll = {
  mounted(el) {
    let isDown = false
    let startX
    let scrollLeft
    let dragDistance = 0

    el.addEventListener('mousedown', (e) => {
      isDown = true
      dragDistance = 0
      el.style.cursor = 'grabbing'
      el.style.scrollSnapType = 'none'
      startX = e.pageX - el.offsetLeft
      scrollLeft = el.scrollLeft
    })
    el.addEventListener('mouseleave', () => {
      isDown = false
      el.style.cursor = 'grab'
      el.style.scrollSnapType = 'x mandatory'
    })
    el.addEventListener('mouseup', () => {
      isDown = false
      el.style.cursor = 'grab'
      el.style.scrollSnapType = 'x mandatory'
    })
    el.addEventListener('mousemove', (e) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      const walk = (x - startX) * 1.5
      dragDistance += Math.abs(walk - (scrollLeft - el.scrollLeft))
      el.scrollLeft = scrollLeft - walk
    })
    // 드래그 중 클릭 방지: 5px 이상 움직이면 클릭 이벤트 차단
    el.addEventListener('click', (e) => {
      if (dragDistance > 5) {
        e.stopPropagation()
        e.preventDefault()
      }
    }, true)
    el.style.cursor = 'grab'
  }
}

// ── 상태 ──────────────────────────────────────────────────────────
const activeTab = ref('all')
const tabs = [
  { value: 'all', label: '전체 책장' },
  { value: 'mine', label: '내 책장' },
]

const allBooks = ref([])
const myBooks = ref([])
const loading = ref(false)
const loadingMine = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

// ── 그룹화 로직 (유저별) ──────────────────────────────────────────
const filteredBooks = computed(() => {
  let res = allBooks.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    res = res.filter(b => 
      b.book.title.toLowerCase().includes(q) || 
      b.ownerNickname.toLowerCase().includes(q) ||
      b.book?.authors?.some(a => a.toLowerCase().includes(q))
    )
  }
  if (statusFilter.value !== 'all') {
    res = res.filter(b => b.status === statusFilter.value)
  }
  return res
})

const groupedBooks = computed(() => {
  const groups = {}
  filteredBooks.value.forEach(item => {
    if (!groups[item.ownerUid]) {
      groups[item.ownerUid] = {
        ownerUid: item.ownerUid,
        ownerNickname: item.ownerNickname,
        ownerProfileImageId: item.ownerProfileImageId,
        books: []
      }
    }
    groups[item.ownerUid].books.push(item)
  })
  return Object.values(groups)
})



// ── 상태 유틸 ───────────────────────────────────────────────────
const statusLabel = (s) => {
  if (s === 'available') return '대여 가능'
  if (s === 'requested') return '신청 중'
  if (s === 'rented') return '대여 중'
  return s
}
const statusChipClass = (s) => {
  if (s === 'available') return 'chip--green'
  if (s === 'requested') return 'chip--amber'
  if (s === 'rented') return 'chip--red'
  return 'chip--grey'
}

// ── 데이터 로딩 ─────────────────────────────────────────────────
const loadAll = async () => {
  loading.value = true
  allBooks.value = await fetchAllBooks()
  loading.value = false
}
const loadMine = async () => {
  loadingMine.value = true
  myBooks.value = await fetchMyBooks()
  loadingMine.value = false
}

onMounted(() => { loadAll() })
watch(activeTab, (tab) => {
  if (tab === 'mine' && authStore.user) loadMine()
})

// ── 대여 액션 ───────────────────────────────────────────────────
const handleRequestRental = async (item) => {
  if (!confirm(`"${item.book?.title}"에 대여를 신청하시겠습니까?`)) return
  try {
    await requestRental(item.id)
    await loadAll()
  } catch (err) { alert(err.message) }
}

const handleCancelRequest = async (item) => {
  if (!confirm('대여 신청을 취소하시겠습니까?')) return
  try {
    await cancelRequest(item.id)
    await loadAll()
  } catch (err) { alert(err.message) }
}

const handleAccept = async (item) => {
  if (!confirm(`${item.borrowerNickname} 님의 대여 신청을 수락하시겠습니까?`)) return
  try {
    await acceptRental(item.id)
    await loadMine()
    await loadAll()
  } catch (err) { alert(err.message) }
}

const handleReject = async (item) => {
  if (!confirm(`${item.borrowerNickname} 님의 대여 신청을 거절하시겠습니까?`)) return
  try {
    await rejectRental(item.id)
    await loadMine()
    await loadAll()
  } catch (err) { alert(err.message) }
}

const handleReturn = async (item) => {
  if (!confirm(`${item.borrowerNickname} 님으로부터 반납을 확인하시겠습니까?`)) return
  try {
    await returnBook(item.id)
    await loadMine()
    await loadAll()
  } catch (err) { alert(err.message) }
}

const handleRequestReturn = async (item) => {
  if (!confirm('소유자에게 반납을 신청하시겠습니까?')) return
  try {
    await requestReturn(item.id)
    alert('반납 신청 알림을 보냈습니다. 소유자가 확인하면 반납이 완료됩니다.')
    await loadAll()
  } catch (err) { alert(err.message) }
}

const handleRemove = async (item) => {
  if (!confirm(`"${item.book?.title}"을 책장에서 삭제하시겠습니까?`)) return
  try {
    await removeBook(item.id)
    await loadMine()
    await loadAll()
  } catch (err) { alert(err.message) }
}

// ── 책 등록 모달 ────────────────────────────────────────────────
const addModal = ref(false)
const bookSearchQuery = ref('')
const bookSearchResults = ref([])
const hasSearched = ref(false)
const searchingBook = ref(false)
const selectedBook = ref(null)
const bookMemo = ref('')
const addingBook = ref(false)
const addError = ref('')

// ── 상세 팝업 ──────────────────────────────────────────────────
const detailModal = ref(false)
const targetBook = ref(null)

const openDetailModal = (item) => {
  targetBook.value = item
  detailModal.value = true
}

const openAddModal = () => {
  addModal.value = true
  bookSearchQuery.value = ''
  bookSearchResults.value = []
  hasSearched.value = false
  selectedBook.value = null
  bookMemo.value = ''
  addError.value = ''
}

const searchBook = async () => {
  if (!bookSearchQuery.value.trim()) return
  searchingBook.value = true
  hasSearched.value = true
  try {
    const res = await fetch(`https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(bookSearchQuery.value)}&size=8`, {
      headers: { Authorization: `KakaoAK ${config.public.kakaoRestApiKey}` }
    })
    const data = await res.json()
    bookSearchResults.value = data.documents || []
  } catch (err) { console.error(err) }
  finally { searchingBook.value = false }
}

const handleAddBook = async () => {
  if (!selectedBook.value) return
  addError.value = ''
  addingBook.value = true
  try {
    await addBook(selectedBook.value, bookMemo.value.trim())
    addModal.value = false
    await loadAll()
    if (activeTab.value === 'mine') await loadMine()
  } catch (err) { addError.value = err.message || '등록 실패' }
  finally { addingBook.value = false }
}
</script>

<style scoped>
/* ── 히어로 배너 ──────────────────────────── */
.bs-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.bs-hero__bg {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
  @media (max-width: 768px) { height: 240px; }
}
.bs-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 25, 41, 0.85) 0%, rgba(10, 25, 41, 0.3) 60%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 32px;
  @media (max-width: 600px) { padding: 20px; }
}
.bs-hero__glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 20px 24px;
  width: 100%;
  @media (max-width: 768px) {
    padding: 16px 20px;
  }
}
.bs-hero__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
.bs-hero__text-wrap { flex: 1; min-width: 0; }
.bs-hero__btn {
  flex-shrink: 0;
  @media (max-width: 600px) { width: 100%; justify-content: center; }
}
.btn--white { background: #fff; color: #1E88E5; border: none; }
.btn--white:hover { background: #f5f5f5; }

/* ── 그리드 ───────────────────────────────── */
.bs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  @media (min-width: 600px)  { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 960px)  { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 1200px) { grid-template-columns: repeat(4, 1fr); }
}

/* ── 카드 ─────────────────────────────────── */
.bs-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}
.bs-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }

.bs-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e0e0e0;
}
.bs-cover__blur {
  position: absolute;
  inset: -10px;
  background-size: cover;
  background-position: center;
  filter: blur(5px);
  transform: scale(1.05);
  z-index: 0;
  opacity: 0.6;
}
.bs-cover__blur::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.2);
}
.bs-cover__img {
  position: relative;
  z-index: 1;
  height: 85%;
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  border-radius: 2px;
}
.bs-info { padding: 14px; display: flex; flex-direction: column; flex-grow: 1; }

/* ── 대여 상태 태그 ──────────────────────── */
.bs-rental-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 8px;
}
.bs-rental-tag.rented {
  background: #FFEBEE;
  color: #C62828;
}
.bs-rental-tag.requested {
  background: #FFF8E1;
  color: #F57F17;
}

/* ── 내 책장 썸네일 ──────────────────────── */
.bs-mine-thumb {
  width: 60px;
  height: 88px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* ── 소유자 대여 알림 ────────────────────── */
.bs-action-alert {
  background: linear-gradient(135deg, #FFF8E1, #FFFDE7);
  border: 1.5px solid #FFB300;
  border-radius: 10px;
  padding: 12px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #424242;
}

/* ── 검색 ─────────────────────────────────── */
.input-with-suffix {
  display: flex;
  align-items: center;
  border: 1.5px solid #E0E0E0;
  border-radius: 8px;
  background: #FAFAFA;
  overflow: hidden;
}
.input-with-suffix:focus-within { border-color: #1E88E5; box-shadow: 0 0 0 3px rgba(30,136,229,0.12); }
.input-with-suffix input { flex:1; border:none; background:transparent; padding:10px 12px 10px 4px; font-size:0.9375rem; font-weight:500; outline:none; }
.input-with-suffix input::placeholder { color:#BDBDBD; }
.append-btn { margin: 6px 8px 6px 0; height: 36px; }

/* ── 책 검색 모달 내부 ───────────────────── */
.book-search-list { max-height: 260px; overflow-y: auto; }
.book-search-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px; transition: background 0.2s;
}
.book-search-item:hover { background: #F5F5F5; }
.book-search-thumb { width: 40px; height: 56px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.selected-book-preview {
  display: flex; align-items: center; gap: 12px;
  background: #E8EAF6; border: 1px solid #9FA8DA;
  border-radius: 10px; padding: 12px;
}
.selected-book-thumb { width: 50px; height: 70px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }

/* ── 상태 chip 색상 ──────────────────────── */
.chip--green { background: #E8F5E9 !important; color: #2E7D32 !important; }
.chip--amber { background: #FFF8E1 !important; color: #F57F17 !important; }
.chip--red { background: #FFEBEE !important; color: #C62828 !important; }

/* ── 유틸 ─────────────────────────────────── */
.pa-10 { padding: 40px; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-8 { margin-bottom: 32px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.ml-auto { margin-left: auto; }
.mt-auto { margin-top: auto; }
.italic { font-style: italic; }
.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hover-shadow:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

/* ── 그룹화 & 슬라이더 ─────────────────────── */
.bs-owner-group {
  animation: slideUp 0.4s ease forwards;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.bs-owner-avatar {
  width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
  border: 1.5px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.bs-owner-avatar img { width: 100%; height: 100%; object-fit: cover; }

.bs-slider-container {
  width: 100%; overflow-x: auto; padding: 4px 4px 16px 4px;
  -ms-overflow-style: none; scrollbar-width: none;
  scroll-snap-type: x mandatory;
}
.bs-slider-container::-webkit-scrollbar { display: none; }

.bs-slider-content {
  display: flex; gap: 16px; width: max-content;
}

.bs-slide-item {
  width: 140px; cursor: pointer; scroll-snap-align: start;
  flex-shrink: 0; border-radius: 12px; overflow: hidden;
  background: #fff; border: 1px solid #eee;
}
.bs-slide-cover {
  position: relative; height: 180px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.bs-slide-cover__blur {
  position: absolute; inset: -5px; background-size: cover;
  background-position: center; filter: blur(4px); opacity: 0.4;
}
.bs-slide-cover__img {
  position: relative; z-index: 1; height: 80%;
  object-fit: contain; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

/* ── 상세 모달 ─────────────────────────────── */
.bs-detail-modal { border-radius: 24px !important; overflow: hidden; }
.bs-detail-thumb {
  width: 110px; height: 160px; object-fit: cover;
  border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}
.bs-detail-meta { background: #fafafa; border-radius: 16px; padding: 0 16px; }
.bg-blue-light { background: #E3F2FD; }

@media (max-width: 600px) {
  .bs-slider-container { margin-left: -16px; width: calc(100% + 32px); padding-left: 16px; padding-right: 16px; }
  .bs-slide-item { width: 130px; }
  .bs-slide-cover { height: 160px; }
}
</style>
