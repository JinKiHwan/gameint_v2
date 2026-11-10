<template>
  <ClientOnly>
    <div class="toss-chat-root">
      <!-- 우하단 토스 스타일 플로팅 버튼 -->
      <button
        class="toss-fab"
        :class="{ 'is-open': isOpen }"
        @click="toggleChat"
        title="내 독서 분석 Q&A 열기"
      >
        <template v-if="!isOpen">
          <span class="toss-fab__badge">Q&amp;A</span>
          <span class="toss-fab__label">내 독서 분석</span>
          <i class="mdi mdi-chevron-up toss-fab__chevron"></i>
        </template>
        <template v-else>
          <i class="mdi mdi-close" style="font-size: 1.4rem;"></i>
        </template>
      </button>

      <!-- 우하단 토스 스타일 채팅창 -->
      <transition name="toss-sheet">
        <section v-if="isOpen" class="toss-window" aria-label="내 독서 분석 Q&A 채팅창">
          <!-- 상단바 (심플한 화이트 헤더 - 본인 전용) -->
          <header class="toss-header">
            <div class="toss-header__brand">
              <div class="toss-squircle">
                <i class="mdi mdi-book-open-variant"></i>
              </div>
              <div>
                <div class="toss-header__title">{{ myNickname }}님의 독서 분석</div>
                <div class="toss-header__sub">
                  리뷰 {{ analysis?.totalReviews || 0 }}건 · 평균 ★{{ analysis?.avgRating?.toFixed(1) || '0.0' }} · 게시글 {{ analysis?.totalBookPosts || 0 }}건
                </div>
              </div>
            </div>

            <div class="toss-header__actions">
              <button
                v-if="askedIds.length > 0"
                class="toss-reset-pill"
                title="대화 초기화"
                @click="resetConversation"
              >
                처음으로
              </button>
              <button
                class="toss-icon-btn"
                title="닫기"
                @click="isOpen = false"
              >
                <i class="mdi mdi-close"></i>
              </button>
            </div>
          </header>

          <!-- 대화 본문 영역 (#F2F4F6 토스 배경) -->
          <div ref="messagesContainer" class="toss-body custom-scroll">
            <!-- 로딩 상태 -->
            <div v-if="loading" class="toss-loading">
              <div class="toss-spinner"></div>
              <p class="toss-loading__title">독서 기록을 정리하고 있어요</p>
              <p class="toss-loading__sub">잠시만 기다려 주세요</p>
            </div>

            <template v-else>
              <!-- 메시지 스트림 -->
              <template v-for="msg in messages" :key="msg.id">
                <!-- 1) 유저 질문 말풍선 -->
                <div
                  v-if="msg.role === 'user'"
                  :id="msg.id"
                  class="toss-user-row"
                >
                  <div class="toss-user-bubble">
                    {{ msg.text }}
                  </div>
                </div>

                <!-- 2) 봇 응답 (아바타 여백 없이 전체 폭을 쓰는 깔끔한 토스 카드) -->
                <div v-else :id="msg.id" class="toss-bot-group">
                  <!-- 초기 인사 카드 -->
                  <div v-if="msg.type === 'greeting'" class="toss-card">
                    <p class="toss-headline">
                      <strong>{{ myNickname }}</strong>님, 반가워요 👋<br />
                      어떤 것이 궁금하신가요?
                    </p>
                    <p class="toss-subcopy">
                      지금까지 남기신 리뷰 <strong>{{ analysis?.totalReviews || 0 }}건</strong>과
                      게시글 <strong>{{ analysis?.totalBookPosts || 0 }}건</strong>을 바탕으로 정리했어요.
                    </p>
                  </div>

                  <!-- A1: 독서 양태 종합 분석 -->
                  <template v-else-if="msg.type === 'A1' && analysis">
                    <div class="toss-card">
                      <span class="toss-badge toss-badge--blue">독서 양태 종합 분석</span>
                      <h4 class="toss-section-title">
                        <template v-if="dnaResult">
                          {{ myNickname }}님은<br />
                          <span class="text-toss-blue">{{ dnaResult.dnaName }}({{ dnaResult.dnaType }})</span> 유형이에요
                        </template>
                        <template v-else>
                          {{ myNickname }}님의 독서 성향 요약이에요
                        </template>
                      </h4>

                      <!-- 핵심 키워드 -->
                      <div class="toss-keyword-wrap">
                        <span v-for="kw in analysis.keywords" :key="kw" class="toss-keyword">
                          {{ kw }}
                        </span>
                      </div>

                      <!-- 본문 (문장 단위로 끊어 읽기 편하게 표시) -->
                      <div class="toss-paragraph-list">
                        <p
                          v-for="(sentence, sIdx) in splitSentences(analysis.overallSummary)"
                          :key="sIdx"
                          class="toss-reading-p"
                        >
                          {{ sentence }}
                        </p>
                      </div>

                      <!-- 최고 평가 도서 요약 -->
                      <div v-if="analysis.topRatedBooks.length > 0" class="toss-summary-footer">
                        <div class="toss-summary-footer__label">🏆 가장 높게 평가한 책</div>
                        <div class="toss-top-list">
                          <div v-for="tb in analysis.topRatedBooks" :key="tb.title" class="toss-top-row">
                            <span class="toss-top-row__title">『{{ tb.title }}』</span>
                            <span class="toss-top-row__rating">★ {{ tb.rating }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- A2: 좋아할 만한 책 1, 2, 3순위 (각 권을 독립 카드로 분리해 가독성 극대화) -->
                  <template v-else-if="msg.type === 'A2' && analysis">
                    <div class="toss-intro-banner">
                      <strong>{{ myNickname }}</strong>님의 고평점 리뷰를 바탕으로<br />
                      가장 좋아하실 만한 책 <strong>3권</strong>을 골랐어요.
                    </div>

                    <div
                      v-for="book in analysis.favoriteBooks"
                      :key="book.rank"
                      class="toss-card toss-card--book"
                    >
                      <!-- 카카오 도서 표지 + 메타 + 링크 상단 영역 -->
                      <div class="toss-book-media">
                        <a
                          :href="book.url || `https://search.daum.net/search?w=bookpage&q=${encodeURIComponent(book.title)}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="toss-book-cover"
                          title="카카오 도서 정보 보기"
                        >
                          <img v-if="book.thumbnail" :src="book.thumbnail" :alt="book.title" />
                          <div v-else class="toss-book-cover__empty">
                            <i class="mdi mdi-book-open-page-variant"></i>
                          </div>
                        </a>

                        <div class="toss-book-media__info">
                          <div class="toss-book-head">
                            <span class="toss-badge" :class="book.rank === 1 ? 'toss-badge--blue-solid' : 'toss-badge--blue'">
                              {{ book.rank }}순위 추천
                            </span>
                            <span class="toss-book-meta">{{ book.genre }}</span>
                          </div>

                          <h4 class="toss-book-title">『{{ book.title }}』</h4>
                          <div class="toss-book-submeta">
                            {{ book.author }}<template v-if="book.publisher"> · {{ book.publisher }}</template>
                          </div>

                          <a
                            :href="book.url || `https://search.daum.net/search?w=bookpage&q=${encodeURIComponent(book.title)}`"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="toss-kakao-link"
                          >
                            <span>도서 상세 보기</span>
                            <i class="mdi mdi-arrow-top-right"></i>
                          </a>
                        </div>
                      </div>

                      <div class="toss-paragraph-list">
                        <p
                          v-for="(sentence, sIdx) in splitSentences(book.reason)"
                          :key="sIdx"
                          class="toss-reading-p"
                        >
                          {{ sentence }}
                        </p>
                      </div>

                      <div class="toss-basis-box">
                        <span class="toss-basis-box__label">추천 근거</span>
                        <span class="toss-basis-box__items">{{ book.basisBooks.join(' · ') }}</span>
                      </div>
                    </div>
                  </template>

                  <!-- A3: 독서 스펙트럼 확장 도서 추천 -->
                  <template v-else-if="msg.type === 'A3' && analysis">
                    <div
                      v-for="(exp, idx) in analysis.expansionBooks"
                      :key="idx"
                      class="toss-card"
                    >
                      <!-- 카카오 도서 표지 + 메타 + 링크 상단 영역 -->
                      <div class="toss-book-media">
                        <a
                          :href="exp.url || `https://search.daum.net/search?w=bookpage&q=${encodeURIComponent(exp.title)}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="toss-book-cover"
                          title="카카오 도서 정보 보기"
                        >
                          <img v-if="exp.thumbnail" :src="exp.thumbnail" :alt="exp.title" />
                          <div v-else class="toss-book-cover__empty">
                            <i class="mdi mdi-book-open-page-variant"></i>
                          </div>
                        </a>

                        <div class="toss-book-media__info">
                          <div class="toss-book-head">
                            <span class="toss-badge toss-badge--green">스펙트럼 확장 추천</span>
                            <span class="toss-book-meta">{{ exp.genre }}</span>
                          </div>

                          <h4 class="toss-book-title">『{{ exp.title }}』</h4>
                          <div class="toss-book-submeta">
                            {{ exp.author }}<template v-if="exp.publisher"> · {{ exp.publisher }}</template>
                          </div>

                          <a
                            :href="exp.url || `https://search.daum.net/search?w=bookpage&q=${encodeURIComponent(exp.title)}`"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="toss-kakao-link is-green"
                          >
                            <span>도서 상세 보기</span>
                            <i class="mdi mdi-arrow-top-right"></i>
                          </a>
                        </div>
                      </div>

                      <div class="toss-axis-pill">
                        보완 영역: <strong>{{ exp.targetAxisLabel }}</strong> (현재 비중 {{ exp.currentRatioPercent }}%)
                      </div>

                      <div class="toss-paragraph-list">
                        <p
                          v-for="(sentence, sIdx) in splitSentences(exp.reason)"
                          :key="sIdx"
                          class="toss-reading-p"
                        >
                          {{ sentence }}
                        </p>
                      </div>

                      <div class="toss-highlight-box toss-highlight-box--green">
                        <div class="toss-highlight-box__label">💡 확장 포인트</div>
                        <div class="toss-highlight-box__text">{{ exp.bridgePoint }}</div>
                      </div>
                    </div>
                  </template>

                  <!-- A4: 저평가 도서 원인 추론 -->
                  <template v-else-if="msg.type === 'A4' && analysis">
                    <div
                      v-for="(inf, idx) in analysis.lowRatingInferences"
                      :key="idx"
                      class="toss-card"
                    >
                      <div class="toss-book-media">
                        <a
                          :href="inf.url || `https://search.daum.net/search?w=bookpage&q=${encodeURIComponent(inf.bookTitle)}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="toss-book-cover is-sm"
                          title="카카오 도서 정보 보기"
                        >
                          <img v-if="inf.thumbnail" :src="inf.thumbnail" :alt="inf.bookTitle" />
                          <div v-else class="toss-book-cover__empty">
                            <i class="mdi mdi-book-open-page-variant"></i>
                          </div>
                        </a>

                        <div class="toss-book-media__info">
                          <div class="toss-book-head">
                            <span class="toss-badge toss-badge--red">
                              ★ {{ inf.rating }} · {{ inf.isStrictUnderTwo ? '2점 이하 저평가 도서' : '상대적 최저점 도서' }}
                            </span>
                          </div>
                          <h4 class="toss-book-title">『{{ inf.bookTitle }}』</h4>
                          <div class="toss-book-submeta">
                            {{ inf.bookAuthors }}<template v-if="inf.publisher"> · {{ inf.publisher }}</template>
                          </div>
                        </div>
                      </div>

                      <!-- 한눈에 보는 내 리뷰 발췌 -->
                      <div class="toss-review-quote">
                        <span class="toss-review-quote__label">내가 남긴 리뷰</span>
                        <p class="toss-review-quote__text">"{{ inf.reviewExcerpt }}"</p>
                      </div>

                      <!-- 소제목 + 본문 분리형 추론 포인트 -->
                      <div class="toss-point-list">
                        <div
                          v-for="(pt, rIdx) in parseReasonPoints(inf.inferredReasons)"
                          :key="rIdx"
                          class="toss-point-item"
                        >
                          <div class="toss-point-item__head">
                            <span class="toss-point-num is-red">{{ rIdx + 1 }}</span>
                            <strong class="toss-point-title">{{ pt.title }}</strong>
                          </div>
                          <p v-if="pt.body" class="toss-point-desc">{{ pt.body }}</p>
                        </div>
                      </div>

                      <!-- 호/불호 대조 -->
                      <div class="toss-highlight-box toss-highlight-box--grey">
                        <div class="toss-highlight-box__label">⚖️ 내 평점 패턴 비교</div>
                        <div class="toss-highlight-box__text">{{ inf.dataComparison }}</div>
                      </div>
                    </div>
                  </template>

                  <!-- A5: 고평가 도서 원인 추론 -->
                  <template v-else-if="msg.type === 'A5' && analysis">
                    <div
                      v-for="(inf, idx) in analysis.highRatingInferences"
                      :key="idx"
                      class="toss-card"
                    >
                      <div class="toss-book-media">
                        <a
                          :href="inf.url || `https://search.daum.net/search?w=bookpage&q=${encodeURIComponent(inf.bookTitle)}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="toss-book-cover is-sm"
                          title="카카오 도서 정보 보기"
                        >
                          <img v-if="inf.thumbnail" :src="inf.thumbnail" :alt="inf.bookTitle" />
                          <div v-else class="toss-book-cover__empty">
                            <i class="mdi mdi-book-open-page-variant"></i>
                          </div>
                        </a>

                        <div class="toss-book-media__info">
                          <div class="toss-book-head">
                            <span class="toss-badge toss-badge--amber">{{ inf.ratingLabel }}</span>
                          </div>
                          <h4 class="toss-book-title">『{{ inf.bookTitle }}』</h4>
                          <div class="toss-book-submeta">
                            {{ inf.bookAuthors }}<template v-if="inf.publisher"> · {{ inf.publisher }}</template>
                          </div>
                        </div>
                      </div>

                      <!-- 소제목 + 본문 분리형 추론 포인트 -->
                      <div class="toss-point-list">
                        <div
                          v-for="(pt, rIdx) in parseReasonPoints(inf.inferredReasons)"
                          :key="rIdx"
                          class="toss-point-item"
                        >
                          <div class="toss-point-item__head">
                            <span class="toss-point-num is-blue">{{ rIdx + 1 }}</span>
                            <strong class="toss-point-title">{{ pt.title }}</strong>
                          </div>
                          <p v-if="pt.body" class="toss-point-desc">{{ pt.body }}</p>
                        </div>
                      </div>

                      <!-- 핵심 만족 요인 -->
                      <div class="toss-highlight-box toss-highlight-box--blue">
                        <div class="toss-highlight-box__label">✨ 핵심 만족 포인트</div>
                        <div class="toss-highlight-box__text">{{ inf.coreFactor }}</div>
                      </div>
                    </div>
                  </template>
                </div>
              </template>

              <!-- 타이핑 애니메이션 -->
              <div v-if="isTyping" class="toss-card toss-card--typing">
                <span></span><span></span><span></span>
              </div>

              <!-- 질문 선택 시트 -->
              <div v-if="!isTyping && analysis" class="toss-question-sheet">
                <div class="toss-question-sheet__header">
                  <span class="toss-question-sheet__title">
                    {{ askedIds.length === 0 ? '궁금한 질문을 눌러보세요' : '더 궁금한 것이 있나요??' }}
                  </span>
                </div>

                <!-- 아직 안 물어본 질문 -->
                <div v-if="remainingQuestions.length > 0" class="toss-q-list">
                  <button
                    v-for="q in remainingQuestions"
                    :key="q.id"
                    class="toss-q-btn"
                    :class="`is-theme-${q.color}`"
                    @click="askPresetQuestion(q)"
                  >
                    <span class="toss-q-btn__code" :class="`is-${q.color}`">{{ q.tag }}</span>
                    <span class="toss-q-btn__text">{{ q.label }}</span>
                    <i class="mdi mdi-chevron-right toss-q-btn__arrow"></i>
                  </button>
                </div>

                <div v-else class="toss-done-msg">
                  준비된 질문을 모두 확인했어요 👏
                </div>

                <!-- 이미 본 질문 다시 보기 -->
                <div v-if="askedIds.length > 0" class="toss-sheet-more">
                  <button
                    v-if="askedQuestions.length > 0 && remainingQuestions.length > 0"
                    class="toss-more-link"
                    @click="showAllQuestions = !showAllQuestions"
                  >
                    {{ showAllQuestions ? '이전 질문 접기' : `이미 본 질문 다시 보기 (${askedQuestions.length})` }}
                  </button>
                </div>

                <div
                  v-if="askedIds.length > 0 && (showAllQuestions || remainingQuestions.length === 0)"
                  class="toss-q-list is-reask"
                >
                  <button
                    v-for="q in askedQuestions"
                    :key="`re_${q.id}`"
                    class="toss-q-btn is-visited"
                    @click="askPresetQuestion(q)"
                  >
                    <span class="toss-q-btn__code is-visited">{{ q.tag }}</span>
                    <span class="toss-q-btn__text">{{ q.label }}</span>
                    <span class="toss-q-btn__re">다시 보기</span>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </section>
      </transition>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCycle } from '~/composables/useCycle'
import { useBoard } from '~/composables/useBoard'
import { useDNA, type DNAResult } from '~/composables/useDNA'
import { useBookRecommendation, type UserReadingRecommendationResult } from '~/composables/useBookRecommendation'

interface PresetQuestion {
  id: 'A1' | 'A2' | 'A3' | 'A4' | 'A5'
  tag: string
  color: 'purple' | 'blue' | 'green' | 'red' | 'amber'
  label: string
}

interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  type?: 'greeting' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5'
  text?: string
}

const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: 'A1',
    tag: '성향 분석',
    color: 'purple',
    label: '지금까지 읽은 책으로 본 나의 독서 성향은 어때?'
  },
  {
    id: 'A2',
    tag: '취향 추천',
    color: 'blue',
    label: '내 취향에 딱 맞을 다음 책 3권을 추천해줘'
  },
  {
    id: 'A3',
    tag: '영역 확장',
    color: 'green',
    label: '내 취향은 살리면서 시야를 넓혀줄 책이 있을까?'
  },
  {
    id: 'A4',
    tag: '아쉬운 점',
    color: 'red',
    label: '내가 낮은 별점을 준 책들은 왜 나랑 안 맞았을까?'
  },
  {
    id: 'A5',
    tag: '만족 포인트',
    color: 'amber',
    label: '내가 높은 별점을 준 책들의 공통된 매력은 뭘까?'
  }
]

const authStore = useAuthStore()
const { fetchUserReviews } = useCycle()
const { fetchUserPosts } = useBoard()
const { analyzeDNA } = useDNA()
const { analyzeUserReadingAndRecommend, enrichWithKakaoBooks, fetchOrGenerateAIAnalysis } = useBookRecommendation()

const isOpen = useState<boolean>('curatorChatOpen', () => false)

const loading = ref(false)
const aiUpdating = ref(false)
const analysisSource = ref<'ai-cache' | 'ai-fresh' | 'fallback'>('fallback')
const showApiKeyBox = ref(false)
const apiKeyInput = ref('')
const aiErrorMsg = ref('')

const isTyping = ref(false)
const showAllQuestions = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const cachedReviews = ref<any[]>([])
const cachedPosts = ref<any[]>([])
const analysis = ref<UserReadingRecommendationResult | null>(null)
const dnaResult = ref<DNAResult | null>(null)
const messages = ref<ChatMessage[]>([])
const askedIds = ref<string[]>([])

const myUid = computed(() => authStore.userData?.uid || '')
const myNickname = computed(() => authStore.userData?.nickname || '회원')

const remainingQuestions = computed(() =>
  PRESET_QUESTIONS.filter(q => !askedIds.value.includes(q.id))
)

const askedQuestions = computed(() =>
  PRESET_QUESTIONS.filter(q => askedIds.value.includes(q.id))
)

/**
 * 긴 문단을 문장 단위로 나누어 숨통이 트이도록 분리
 */
const splitSentences = (text: string): string[] => {
  if (!text) return []
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)
}

/**
 * "소제목: 상세 설명" 형태의 추론 문장을 굵은 제목과 본문으로 분리
 */
const parseReasonPoints = (reasons: string[]): { title: string; body: string }[] => {
  if (!reasons) return []
  return reasons.map(raw => {
    const colonIdx = raw.indexOf(':')
    if (colonIdx > 0 && colonIdx < 42) {
      return {
        title: raw.slice(0, colonIdx).trim(),
        body: raw.slice(colonIdx + 1).trim()
      }
    }
    return { title: raw, body: '' }
  })
}

/**
 * 특정 메시지(방금 누른 질문)가 채팅창 상단에 오도록 부드럽게 스크롤
 */
const scrollToElementTop = async (elementId: string) => {
  await nextTick()
  const container = messagesContainer.value
  const target = document.getElementById(elementId)
  if (container && target) {
    const topOffset = target.offsetTop - container.offsetTop - 12
    container.scrollTo({
      top: Math.max(0, topOffset),
      behavior: 'smooth'
    })
  }
}

const scrollToTop = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const initGreeting = () => {
  askedIds.value = []
  showAllQuestions.value = false
  messages.value = [
    {
      id: `greet_${Date.now()}`,
      role: 'bot',
      type: 'greeting'
    }
  ]
}

const loadMyData = async () => {
  if (!myUid.value) return
  loading.value = true
  try {
    const [reviews, posts] = await Promise.all([
      fetchUserReviews(myUid.value),
      fetchUserPosts(myUid.value)
    ])
    cachedReviews.value = reviews
    cachedPosts.value = posts

    const readingActivities = [
      ...reviews,
      ...posts.filter((p: any) => ['도서 추천', '책 리뷰', '만화'].includes(p.category))
    ]
    const dna = analyzeDNA(readingActivities)
    dnaResult.value = dna

    // 1) 즉시 화면에 기본/최신 동적 분석 표시 + 카카오 도서 표지·링크 매칭
    const baseResult = analyzeUserReadingAndRecommend(reviews, posts, dna, {
      uid: myUid.value,
      nickname: myNickname.value
    })
    analysis.value = baseResult
    initGreeting()
    loading.value = false
    scrollToTop()
    await enrichWithKakaoBooks(analysis.value)

    // 2) 백그라운드에서 Firestore AI 캐시 확인 및 새 리뷰 감지 시 자동 AI 업데이트
    const aiRes = await fetchOrGenerateAIAnalysis({
      uid: myUid.value,
      nickname: myNickname.value,
      reviews,
      posts,
      dna,
      forceRefresh: false
    })
    if (aiRes.analysis) {
      await enrichWithKakaoBooks(aiRes.analysis)
      analysis.value = aiRes.analysis
      analysisSource.value = aiRes.source
    }
  } catch (err) {
    console.error('[ReadingCuratorChat] 데이터 로드 실패:', err)
  } finally {
    loading.value = false
  }
}

const handleRefreshAI = async () => {
  if (!myUid.value || aiUpdating.value) return
  aiErrorMsg.value = ''
  aiUpdating.value = true
  try {
    const [reviews, posts] = await Promise.all([
      fetchUserReviews(myUid.value),
      fetchUserPosts(myUid.value)
    ])
    cachedReviews.value = reviews
    cachedPosts.value = posts

    const readingActivities = [
      ...reviews,
      ...posts.filter((p: any) => ['도서 추천', '책 리뷰', '만화'].includes(p.category))
    ]
    const dna = analyzeDNA(readingActivities)
    dnaResult.value = dna

    const aiRes = await fetchOrGenerateAIAnalysis({
      uid: myUid.value,
      nickname: myNickname.value,
      reviews,
      posts,
      dna,
      forceRefresh: true
    })

    if (aiRes.analysis) {
      await enrichWithKakaoBooks(aiRes.analysis)
      analysis.value = aiRes.analysis
      analysisSource.value = aiRes.source
    }
  } finally {
    aiUpdating.value = false
  }
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
}

const resetConversation = () => {
  initGreeting()
  scrollToTop()
}

const askPresetQuestion = async (q: PresetQuestion) => {
  if (isTyping.value) return

  const userMsgId = `user_${q.id}_${Date.now()}`
  messages.value.push({
    id: userMsgId,
    role: 'user',
    text: q.label
  })

  if (!askedIds.value.includes(q.id)) {
    askedIds.value.push(q.id)
  }
  showAllQuestions.value = false
  isTyping.value = true
  await scrollToElementTop(userMsgId)

  setTimeout(async () => {
    messages.value.push({
      id: `bot_${q.id}_${Date.now()}`,
      role: 'bot',
      type: q.id
    })
    isTyping.value = false
    // 답변이 출력된 뒤에도 유저 질문 + 답변의 시작 부분이 상단에 보이도록 고정!
    await scrollToElementTop(userMsgId)
  }, 260)
}

watch(isOpen, async (open) => {
  if (open && !analysis.value && myUid.value) {
    await loadMyData()
  }
})

watch(myUid, async (uid) => {
  if (uid && isOpen.value) {
    await loadMyData()
  }
})
</script>

<style lang="scss" scoped>
/* ── Toss Design System (TDS) Tokens ── */
$toss-blue: #3182F6;
$toss-blue-bg: #E8F3FF;
$toss-grey-900: #191F28;
$toss-grey-800: #333D4B;
$toss-grey-700: #4E5968;
$toss-grey-600: #6B7684;
$toss-grey-500: #8B95A1;
$toss-grey-300: #D1D6DB;
$toss-grey-200: #E5E8EB;
$toss-grey-100: #F2F4F6;
$toss-grey-50: #F9FAFB;
$toss-red: #F04452;
$toss-red-bg: #FFEEEE;
$toss-green: #02A66A;
$toss-green-bg: #E8FAF0;
$toss-amber: #D97706;
$toss-amber-bg: #FFF6E5;

.toss-chat-root {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 995;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    right: 16px;
    bottom: 82px;
  }
}

/* ── 플로팅 런처 버튼 ── */
.toss-fab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 20px 0 14px;
  border-radius: 999px;
  border: none;
  background: $toss-grey-900;
  color: #ffffff;
  font-size: 0.94rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(25, 31, 40, 0.24);
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    background: #242C38;
  }

  &:active {
    transform: scale(0.96);
  }

  &.is-open {
    width: 48px;
    height: 48px;
    padding: 0;
    justify-content: center;
  }

  &__badge {
    background: $toss-blue;
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 999px;
  }

  &__chevron {
    font-size: 1.15rem;
    color: $toss-grey-300;
  }
}

/* ── 채팅창 윈도우 (여유로운 가로폭 440px) ── */
.toss-window {
  position: absolute;
  right: 0;
  bottom: 64px;
  width: 440px;
  max-width: calc(100vw - 24px);
  height: 660px;
  max-height: calc(100vh - 120px);
  background: $toss-grey-100;
  border-radius: 26px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 20px 60px rgba(25, 31, 40, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    width: calc(100vw - 24px);
    height: 76vh;
    max-height: calc(100vh - 150px);
    bottom: 60px;
  }
}

.toss-sheet-enter-active,
.toss-sheet-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: bottom right;
}
.toss-sheet-enter-from,
.toss-sheet-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(12px);
}

/* ── 헤더 (깔끔한 1단 화이트 바) ── */
.toss-header {
  background: #ffffff;
  padding: 16px 20px;
  border-bottom: 1px solid $toss-grey-200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 800;
    color: $toss-grey-900;
  }

  &__sub {
    font-size: 0.8rem;
    font-weight: 600;
    color: $toss-grey-500;
    margin-top: 2px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.toss-ai-pill {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
  background: $toss-blue-bg;
  color: $toss-blue;
}

.toss-ai-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: $toss-blue-bg;
  color: $toss-blue;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 6px 11px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: #D6E8FF;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.toss-apikey-bar {
  background: #ffffff;
  border-bottom: 1px solid $toss-grey-200;
  padding: 14px 18px;
  flex-shrink: 0;

  &__title {
    font-size: 0.86rem;
    font-weight: 800;
    color: $toss-grey-900;
    margin-bottom: 3px;
  }

  &__sub {
    font-size: 0.76rem;
    color: $toss-grey-600;
    margin-bottom: 10px;

    code {
      background: $toss-grey-100;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 700;
      color: $toss-grey-800;
    }
  }

  &__form {
    display: flex;
    gap: 6px;
  }
}

.toss-apikey-input {
  flex: 1;
  min-width: 0;
  border: 1px solid $toss-grey-300;
  border-radius: 10px;
  padding: 8px 11px;
  font-size: 0.82rem;
  outline: none;

  &:focus {
    border-color: $toss-blue;
  }
}

.toss-apikey-submit {
  border: none;
  background: $toss-blue;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
}

.toss-apikey-cancel {
  border: none;
  background: $toss-grey-100;
  color: $toss-grey-700;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0 10px;
  border-radius: 10px;
  cursor: pointer;
}

.toss-apikey-err {
  margin: 8px 0 0;
  font-size: 0.76rem;
  font-weight: 700;
  color: $toss-red;
}

.toss-squircle {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: $toss-blue-bg;
  color: $toss-blue;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.toss-reset-pill {
  border: none;
  background: $toss-grey-100;
  color: $toss-grey-700;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 11px;
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    background: $toss-grey-200;
    color: $toss-grey-900;
  }
}

.toss-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: $toss-grey-600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    background: $toss-grey-100;
    color: $toss-grey-900;
  }
}

/* ── 본문 스트림 영역 ── */
.toss-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toss-loading {
  margin: auto 0;
  text-align: center;
  padding: 40px 16px;

  &__title {
    font-size: 1rem;
    font-weight: 800;
    color: $toss-grey-900;
    margin-bottom: 4px;
  }

  &__sub {
    font-size: 0.85rem;
    color: $toss-grey-500;
  }
}

.toss-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid $toss-grey-200;
  border-top-color: $toss-blue;
  border-radius: 50%;
  margin: 0 auto 14px;
  animation: toss-spin 0.75s linear infinite;
}

@keyframes toss-spin {
  to { transform: rotate(360deg); }
}

/* ── 유저 질문 말풍선 ── */
.toss-user-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.toss-user-bubble {
  max-width: 85%;
  background: $toss-blue;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.48;
  padding: 12px 16px;
  border-radius: 20px;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 12px rgba(49, 130, 246, 0.2);
}

/* ── 봇 응답 그룹 (전체 가로폭 사용, 중첩 박스 제거!) ── */
.toss-bot-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toss-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(25, 31, 40, 0.04);

  &--typing {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 16px 20px;

    span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: $toss-grey-300;
      animation: toss-dot 1.2s infinite ease-in-out;

      &:nth-child(2) { animation-delay: 0.15s; }
      &:nth-child(3) { animation-delay: 0.3s; }
    }
  }
}

@keyframes toss-dot {
  0%, 80%, 100% { transform: scale(0.8); background: $toss-grey-300; }
  40% { transform: scale(1.15); background: $toss-blue; }
}

.toss-intro-banner {
  background: #ffffff;
  border-radius: 18px;
  padding: 15px 18px;
  font-size: 0.92rem;
  font-weight: 600;
  color: $toss-grey-800;
  line-height: 1.55;
  box-shadow: 0 2px 8px rgba(25, 31, 40, 0.03);

  strong {
    color: $toss-blue;
    font-weight: 800;
  }
}

/* ── 타이포그래피 (시원한 크기 & 줄간격) ── */
.toss-headline {
  font-size: 1.12rem;
  font-weight: 800;
  color: $toss-grey-900;
  line-height: 1.45;
  margin: 0 0 8px;

  strong {
    color: $toss-blue;
  }
}

.toss-subcopy {
  font-size: 0.9rem;
  font-weight: 500;
  color: $toss-grey-600;
  line-height: 1.55;
  margin: 0;

  strong {
    color: $toss-grey-800;
    font-weight: 700;
  }
}

.toss-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.76rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;

  &--blue { background: $toss-blue-bg; color: $toss-blue; }
  &--blue-solid { background: $toss-blue; color: #ffffff; }
  &--green { background: $toss-green-bg; color: $toss-green; }
  &--red { background: $toss-red-bg; color: $toss-red; }
  &--amber { background: $toss-amber-bg; color: $toss-amber; }
}

.toss-section-title {
  font-size: 1.12rem;
  font-weight: 800;
  color: $toss-grey-900;
  line-height: 1.42;
  margin: 10px 0 14px;

  .text-toss-blue {
    color: $toss-blue;
  }
}

.toss-keyword-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.toss-keyword {
  background: $toss-grey-100;
  color: $toss-grey-800;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 999px;
}

.toss-paragraph-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toss-reading-p {
  margin: 0;
  font-size: 0.92rem; /* 14.7px - 훨씬 읽기 편한 본문 크기 */
  font-weight: 500;
  color: $toss-grey-800;
  line-height: 1.68;
  word-break: normal;
  overflow-wrap: break-word;
}

/* ── 도서 카드 내부 (카카오 도서 표지 + 링크) ── */
.toss-book-media {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid $toss-grey-100;

  &__info {
    flex: 1;
    min-width: 0;
  }
}

.toss-book-cover {
  width: 72px;
  height: 104px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: $toss-grey-100;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 12px rgba(25, 31, 40, 0.1);
  display: block;
  transition: transform 0.16s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &.is-sm {
    width: 60px;
    height: 86px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $toss-grey-500;
    font-size: 1.5rem;
  }
}

.toss-book-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.toss-book-meta {
  font-size: 0.78rem;
  font-weight: 600;
  color: $toss-grey-500;
}

.toss-book-title {
  font-size: 1.06rem;
  font-weight: 800;
  color: $toss-grey-900;
  line-height: 1.35;
  margin: 0 0 4px;
}

.toss-book-submeta {
  font-size: 0.82rem;
  font-weight: 600;
  color: $toss-grey-600;
  margin-bottom: 8px;
}

.toss-kakao-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.78rem;
  font-weight: 700;
  color: $toss-blue;
  background: $toss-blue-bg;
  padding: 5px 10px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: #D6E8FF;
  }

  &.is-green {
    color: $toss-green;
    background: $toss-green-bg;

    &:hover {
      background: #D1F5E1;
    }
  }
}

.toss-axis-pill {
  background: $toss-grey-50;
  color: $toss-grey-700;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 10px;
  margin-bottom: 12px;

  strong {
    color: $toss-green;
    font-weight: 800;
  }
}

.toss-basis-box {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid $toss-grey-100;
  display: flex;
  flex-direction: column;
  gap: 3px;

  &__label {
    font-size: 0.75rem;
    font-weight: 700;
    color: $toss-grey-500;
  }

  &__items {
    font-size: 0.84rem;
    font-weight: 700;
    color: $toss-blue;
  }
}

/* ── A1 최고 평가 도서 하단 ── */
.toss-summary-footer {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid $toss-grey-100;

  &__label {
    font-size: 0.8rem;
    font-weight: 800;
    color: $toss-grey-600;
    margin-bottom: 8px;
  }
}

.toss-top-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toss-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $toss-grey-50;
  padding: 9px 13px;
  border-radius: 12px;

  &__title {
    font-size: 0.88rem;
    font-weight: 700;
    color: $toss-grey-900;
  }

  &__rating {
    font-size: 0.86rem;
    font-weight: 800;
    color: #E67E00;
  }
}

/* ── A4 / A5 내 리뷰 인용 & 추론 포인트 ── */
.toss-review-quote {
  background: $toss-grey-50;
  border-left: 3px solid $toss-red;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;

  &.is-amber {
    border-left-color: #F59E0B;
  }

  &__label {
    display: block;
    font-size: 0.75rem;
    font-weight: 800;
    color: $toss-grey-500;
    margin-bottom: 4px;
  }

  &__text {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 600;
    color: $toss-grey-800;
    line-height: 1.58;
  }
}

.toss-point-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}

.toss-point-item {
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }
}

.toss-point-num {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.is-red { background: $toss-red-bg; color: $toss-red; }
  &.is-blue { background: $toss-blue-bg; color: $toss-blue; }
}

.toss-point-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: $toss-grey-900;
  line-height: 1.35;
}

.toss-point-desc {
  margin: 0;
  padding-left: 28px;
  font-size: 0.9rem;
  font-weight: 500;
  color: $toss-grey-700;
  line-height: 1.65;
}

.toss-highlight-box {
  border-radius: 14px;
  padding: 12px 14px;

  &--green { background: $toss-green-bg; }
  &--grey { background: $toss-grey-50; }
  &--blue { background: $toss-blue-bg; }

  &__label {
    font-size: 0.76rem;
    font-weight: 800;
    color: $toss-grey-700;
    margin-bottom: 4px;
  }

  &__text {
    font-size: 0.86rem;
    font-weight: 700;
    color: $toss-grey-900;
    line-height: 1.5;
  }
}

/* ── 하단 질문지 선택 시트 ── */
.toss-question-sheet {
  background: #ffffff;
  border-radius: 22px;
  padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(25, 31, 40, 0.04);

  &__header {
    padding: 0 4px;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 0.95rem;
    font-weight: 800;
    color: $toss-grey-900;
  }
}

.toss-q-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.is-reask {
    margin-top: 10px;
  }
}

.toss-q-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  text-align: left;
  padding: 13px 14px;
  border-radius: 14px;
  border: none;
  background: $toss-grey-50;
  color: $toss-grey-900;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease;

  &:hover {
    background: #F1F5F9;

    .toss-q-btn__arrow {
      color: $toss-grey-800;
      transform: translateX(2px);
    }
  }

  &.is-theme-purple:hover {
    background: #F6F3FF;
    .toss-q-btn__code { background: #6B3FEF; color: #ffffff; }
  }
  &.is-theme-blue:hover {
    background: $toss-blue-bg;
    .toss-q-btn__code { background: $toss-blue; color: #ffffff; }
  }
  &.is-theme-green:hover {
    background: $toss-green-bg;
    .toss-q-btn__code { background: $toss-green; color: #ffffff; }
  }
  &.is-theme-red:hover {
    background: $toss-red-bg;
    .toss-q-btn__code { background: $toss-red; color: #ffffff; }
  }
  &.is-theme-amber:hover {
    background: $toss-amber-bg;
    .toss-q-btn__code { background: $toss-amber; color: #ffffff; }
  }

  &:active {
    transform: scale(0.98);
  }

  &__code {
    min-width: 68px;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 4px 9px;
    border-radius: 8px;
    background: $toss-blue-bg;
    color: $toss-blue;
    flex-shrink: 0;
    transition: background 0.15s ease, color 0.15s ease;

    &.is-purple {
      background: #F3EFFE;
      color: #6B3FEF;
    }
    &.is-blue {
      background: $toss-blue-bg;
      color: $toss-blue;
    }
    &.is-green {
      background: $toss-green-bg;
      color: $toss-green;
    }
    &.is-red {
      background: $toss-red-bg;
      color: $toss-red;
    }
    &.is-amber {
      background: $toss-amber-bg;
      color: $toss-amber;
    }

    &.is-visited {
      background: $toss-grey-200;
      color: $toss-grey-600;
    }
  }

  &__text {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.42;
    color: $toss-grey-900;
  }

  &__arrow {
    font-size: 1.15rem;
    color: $toss-grey-500;
    flex-shrink: 0;
    transition: transform 0.15s ease;
  }

  &__re {
    font-size: 0.74rem;
    font-weight: 700;
    color: $toss-grey-600;
    background: $toss-grey-200;
    padding: 3px 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }
}

.toss-done-msg {
  background: $toss-green-bg;
  color: $toss-green;
  border-radius: 12px;
  padding: 12px;
  font-size: 0.86rem;
  font-weight: 700;
  text-align: center;
}

.toss-sheet-more {
  margin-top: 10px;
  text-align: center;
}

.toss-more-link {
  border: none;
  background: transparent;
  color: $toss-grey-600;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 6px 10px;
  cursor: pointer;

  &:hover {
    color: $toss-grey-900;
    text-decoration: underline;
  }
}

.custom-scroll::-webkit-scrollbar { width: 5px; }
.custom-scroll::-webkit-scrollbar-thumb { background: $toss-grey-300; border-radius: 3px; }
</style>
