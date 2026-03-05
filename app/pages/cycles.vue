<template>
  <div class="fade-in">

    <!-- ① 히어로 배너 -->
    <div class="cycles-hero mb-6">
      <img
        :src="cycle?.heroImageUrl || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2187&auto=format&fit=crop'"
        alt="월간 주제 배너"
        class="cycles-hero__bg"
      />
      <div class="cycles-hero__overlay">
        <div class="cycles-hero__glass">

          <!-- Phase 1 -->
          <template v-if="!cycle">
            <div class="text-caption font-bold text-white mb-2 opacity-90">게임인트 독서 모임</div>
            <div class="text-h5 font-black text-white mb-1">진행 중인 사이클이 없습니다</div>
            <div class="text-body-2 text-white opacity-80">마스터가 새 사이클을 시작하면 여기에 표시됩니다.</div>
          </template>

          <template v-else-if="cycle.phase === 'phase1_reading' || cycle.phase === 'voting'">
            <span class="chip chip--red mb-3" style="display:inline-flex;">
              <i class="mdi mdi-book-open-variant mr-1"></i>
              {{ cycle.phase === 'voting' ? '공통 도서 투표 중' : '1회차 · 개별 독서 기간' }}
            </span>
            <div class="text-caption font-bold mb-1" style="color:rgba(255,255,255,0.75);">이번 달 주제 키워드</div>
            <div class="text-h4 font-black text-white mb-3"># {{ cycle.keyword }}</div>
            <div class="flex items-center gap-4 text-body-2 font-medium" style="color:rgba(255,255,255,0.8);">
              <span class="flex items-center gap-1"><i class="mdi mdi-calendar"></i> {{ formatDateRange(cycle.phase1Start, cycle.phase1End) }}</span>
              <span class="flex items-center gap-1"><i class="mdi mdi-map-marker"></i> 온라인/오프라인</span>
            </div>
          </template>

          <template v-else-if="cycle.phase === 'phase2_reading'">
            <span class="chip chip--primary mb-3" style="display:inline-flex;">
              <i class="mdi mdi-trophy mr-1"></i>2회차 · 공통 도서 독서 기간
            </span>
            <div class="text-caption font-bold mb-2" style="color:rgba(255,255,255,0.75);">👑 투표 1위! 이달의 공통 도서</div>
            <div class="flex items-center gap-4 mb-3">
              <img
                v-if="cycle.commonBook?.thumbnail"
                :src="cycle.commonBook.thumbnail"
                class="common-book-thumb"
                alt="공통 도서"
              />
              <div>
                <div class="text-h5 font-black text-white mb-1">{{ cycle.commonBook?.title }}</div>
                <div class="text-body-2 font-medium" style="color:rgba(255,255,255,0.8);">{{ cycle.commonBook?.authors?.join(', ') }}</div>
                <div v-if="recommenderNickname" class="text-caption mt-1" style="color:rgba(255,255,255,0.65);">
                  추천인: @{{ recommenderNickname }}
                </div>
              </div>
            </div>
            <div class="text-body-2 font-medium" style="color:rgba(255,255,255,0.8);">
              <i class="mdi mdi-calendar"></i> {{ formatDateRange(cycle.phase2Start, cycle.phase2End) }}
            </div>
          </template>

        </div>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loadingCycle" class="text-center pa-10">
      <div class="spinner" style="margin:0 auto;"></div>
    </div>

    <template v-else>

      <!-- ② 내 Action Box -->
      <div v-if="cycle && authStore.user" class="card mb-6">
        <div class="card-body action-box">

          <!-- Phase 1: 책 미등록 -->
          <template v-if="(cycle.phase === 'phase1_reading') && !myParticipation">
            <div class="action-box__text">
              <i class="mdi mdi-alert-circle-outline action-box__icon text-orange-dark"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">{{ authStore.userData?.nickname }}님, 아직 이번 주제의 책을 고르지 않으셨네요!</div>
                <div class="text-caption text-grey-2 font-medium">키워드 <strong>#{{ cycle.keyword }}</strong>에 맞는 책을 검색하고 등록해주세요.</div>
              </div>
            </div>
            <button class="btn btn--primary btn--lg font-black rounded-sm" @click="openBookRegisterModal">
              <i class="mdi mdi-book-plus-outline"></i> 책 검색/등록
            </button>
          </template>

          <!-- Phase 1: 책 등록함 + 리뷰 미작성 -->
          <template v-else-if="cycle.phase === 'phase1_reading' && myParticipation && !myReview">
            <div class="action-box__text">
              <i class="mdi mdi-book-check-outline action-box__icon text-green"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">책을 등록하셨습니다! 이제 리뷰를 남겨주세요 ✍️</div>
                <div class="text-caption text-grey-2 font-medium">
                  <strong>{{ myParticipation.book?.title }}</strong>
                  &nbsp;— 독서 후 별점과 감상을 남겨주세요. 오프라인 모임 후 투표도 진행됩니다.
                </div>
              </div>
            </div>
            <button class="btn btn--primary btn--lg font-black rounded-sm" @click="openReviewModal">
              <i class="mdi mdi-star-outline"></i> 내 책 리뷰 쓰기
            </button>
          </template>

          <!-- Phase 1: 책 등록 + 리뷰 완료 -->
          <template v-else-if="cycle.phase === 'phase1_reading' && myParticipation && myReview">
            <div class="action-box__text">
              <i class="mdi mdi-check-circle action-box__icon text-green"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">책 등록과 리뷰를 모두 완료하셨습니다! 🎖️</div>
                <div class="text-caption text-grey-2 font-medium">
                  <strong>{{ myParticipation.book?.title }}</strong> — 오프라인 모임 후 투표가 진행될 예정입니다.
                </div>
              </div>
            </div>
            <StarRating :modelValue="myReview.rating" :readonly="true" />
          </template>

          <!-- 투표 단계 (일반 유저) -->
          <template v-else-if="cycle.phase === 'voting'">
            <div class="action-box__text">
              <i class="mdi mdi-account-group action-box__icon text-blue-dark"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">오프라인 모임에서 투표가 진행 중입니다!</div>
                <div class="text-caption text-grey-2 font-medium">
                  마스터가 오프라인 현장 투표 결과를 반영하여 공통 도서를 확정합니다.
                </div>
              </div>
            </div>
            <span class="chip chip--grey">투표 진행중</span>
          </template>

          <!-- Phase 2: 리뷰 미작성 -->
          <template v-else-if="cycle.phase === 'phase2_reading' && !myReview">
            <div class="action-box__text">
              <i class="mdi mdi-pencil action-box__icon text-blue-dark"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">{{ authStore.userData?.nickname }}님, 공통 도서를 다 읽으셨나요?</div>
                <div class="text-caption text-grey-2 font-medium">모임 전까지 별점과 감상평을 남겨주세요!</div>
              </div>
            </div>
            <button class="btn btn--primary btn--lg font-black rounded-sm" @click="openReviewModal">
              <i class="mdi mdi-star-outline"></i> 리뷰 쓰기
            </button>
          </template>

          <!-- Phase 2: 리뷰 작성함 -->
          <template v-else-if="cycle.phase === 'phase2_reading' && myReview">
            <div class="action-box__text">
              <i class="mdi mdi-check-circle-outline action-box__icon text-green"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">리뷰를 남겨주셨습니다! 감사합니다 🙏</div>
                <div class="text-caption text-grey-2 font-medium">다른 멤버들의 리뷰도 확인해보세요.</div>
              </div>
            </div>
            <StarRating :modelValue="myReview.rating" :readonly="true" />
          </template>

        </div>
      </div>

      <!-- ② 추천인 특권 (Phase 2에서 내 책이 공통도서로 선정됐을 때) -->
      <div
        v-if="cycle?.phase === 'phase2_reading' && cycle.commonBookRecommenderUid === authStore.user?.uid"
        class="card mb-6 recommender-privilege"
      >
        <div class="card-body action-box">
          <div class="action-box__text">
            <i class="mdi mdi-crown action-box__icon" style="color:#FFB300;"></i>
            <div>
              <div class="text-subtitle-1 font-black text-grey-dark">🎉 선정왕 특권!</div>
              <div class="text-caption text-grey-2 font-medium">내 책이 공통 도서로 선정되었습니다! 나만의 자유 도서를 추가 등록할 수 있어요.</div>
            </div>
          </div>
          <button class="btn btn--lg font-black rounded-sm" style="background:#FFF8E1;color:#F57C00;border:1px solid #FFB300;" @click="openBookRegisterModal">
            <i class="mdi mdi-book-plus"></i> 자유 도서 추가
          </button>
        </div>
      </div>

      <!-- ③ 마스터 관리 패널 -->
      <div v-if="isMaster && cycle" class="card mb-6 master-panel">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <div class="text-subtitle-1 font-black flex items-center gap-2">
              <i class="mdi mdi-shield-crown" style="color:#FFB300;"></i>마스터 관리 패널
            </div>
            <span class="chip chip--amber">Phase: {{ phaseLabel }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-if="cycle.phase === 'phase1_reading'" class="btn btn--tonal font-bold rounded-sm" @click="changePhase('voting')">
              <i class="mdi mdi-vote"></i> 투표 단계 시작
            </button>
            <!-- 투표 단계: 마스터가 직접 책 선택 -->
            <template v-if="cycle.phase === 'voting'">
              <div class="w-100 mt-2">
                <div class="text-caption font-bold text-grey-2 mb-2">
                  <i class="mdi mdi-cursor-pointer"></i> 오프라인 투표 결과 — 공통 도서로 확정할 책을 선택하세요:
                </div>
                <div class="master-book-select">
                  <div
                    v-for="p in participants"
                    :key="p.uid"
                    class="master-book-option"
                    :class="{ 'is-selected': masterSelectedUid === p.uid }"
                    @click="masterSelectedUid = p.uid"
                  >
                    <img v-if="p.book?.thumbnail" :src="p.book.thumbnail" class="master-book-thumb" alt="표지" />
                    <div v-else class="master-book-thumb-placeholder"><i class="mdi mdi-book"></i></div>
                    <div class="min-w-0">
                      <div class="text-subtitle-2 font-black text-grey-dark line-clamp-1">{{ p.book?.title }}</div>
                      <div class="text-caption text-grey-2">@{{ p.nickname }}</div>
                    </div>
                    <i v-if="masterSelectedUid === p.uid" class="mdi mdi-check-circle" style="color:#1E88E5;flex-shrink:0;"></i>
                  </div>
                </div>
                <button
                  class="btn btn--primary font-black rounded-sm mt-3 w-100"
                  :disabled="!masterSelectedUid"
                  @click="handleConfirmCommonBook"
                >
                  <i class="mdi mdi-trophy"></i> 선택한 책으로 공통 도서 확정 → 2회차 시작
                </button>
              </div>
            </template>
            <button v-if="cycle.phase === 'phase2_reading'" class="btn btn--dark font-bold rounded-sm" @click="changePhase('closed')">
              <i class="mdi mdi-flag-checkered"></i> 사이클 종료
            </button>
            <button class="btn btn--tonal font-bold rounded-sm" @click="openMeetingModal">
              <i :class="meetings.length > 0 ? 'mdi mdi-pencil-box-outline' : 'mdi mdi-pencil-box'"></i>
              {{ meetings.length > 0 ? '모임 기록 수정' : '모임 기록 작성' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 마스터: 새 사이클 생성 (사이클 없을 때) -->
      <div v-if="isMaster && !cycle" class="card mb-6 master-panel">
        <div class="card-body">
          <div class="text-subtitle-1 font-black flex items-center gap-2 mb-4">
            <i class="mdi mdi-shield-crown" style="color:#FFB300;"></i>새 사이클 시작
          </div>
          <div class="flex flex-col gap-3">
            <input v-model="newCycle.keyword" class="input" placeholder="이번 달 키워드 (예: 인간)" />
            <textarea v-model="newCycle.description" class="textarea" rows="2" placeholder="주제 설명"></textarea>
            <input v-model="newCycle.heroImageUrl" class="input" placeholder="배너 이미지 URL (선택, 기본 이미지 사용 가능)" />
            <button class="btn btn--primary font-black rounded-sm btn--lg" :class="{'is-loading': creatingCycle}" :disabled="creatingCycle || !newCycle.keyword.trim()" @click="handleCreateCycle">
              <i class="mdi mdi-play-circle-outline"></i> 사이클 시작하기 (1회차 개별 독서)
            </button>
          </div>
        </div>
      </div>

      <!-- 사이클 없음 (일반 유저) -->
      <div v-if="!cycle && !isMaster" class="card mb-6">
        <div class="card-body text-center pa-10">
          <i class="mdi mdi-book-off-outline" style="font-size:3rem;color:#BDBDBD;display:block;margin-bottom:12px;"></i>
          <div class="text-h6 font-black text-grey-dark mb-2">현재 진행 중인 사이클이 없습니다</div>
          <div class="text-body-2 text-grey-2 font-medium">다음 사이클이 시작되면 알려드릴게요!</div>
        </div>
      </div>

      <template v-if="cycle">
        <!-- ④ 메인 탭 -->
        <div class="tabs">
          <button
            v-for="tab in tabs" :key="tab.value"
            class="tab-btn"
            :class="{ 'is-active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >{{ tab.label }}</button>
        </div>

        <!-- 탭 패널: 참여 현황 -->
        <div v-if="activeTab === 'members'">
          <div class="flex justify-between items-center mb-4 mt-4">
            <h3 class="text-h6 font-black text-grey-dark">📚 참여 현황 <span class="text-blue-dark">{{ participants.length }}명</span></h3>
          </div>
          <div v-if="loadingParticipants" class="text-center pa-8"><div class="spinner" style="margin:0 auto;"></div></div>
          <div v-else-if="participants.length === 0" class="text-center pa-10 text-grey-2 font-bold">
            아직 책을 등록한 멤버가 없습니다. 가장 먼저 등록해보세요!
          </div>
          <div v-else class="participants-grid">
            <div
              v-for="p in participants"
              :key="p.id"
              class="participant-card card"
              :class="{ 'is-winner': cycle.phase === 'phase2_reading' && p.uid === cycle.commonBookRecommenderUid }"
            >
              <!-- 책 표지 배경 -->
              <div class="participant-book-cover">
                <img
                  v-if="p.book?.thumbnail"
                  :src="p.book.thumbnail"
                  class="participant-book-img"
                  alt="책 표지"
                />
                <div v-else class="participant-book-placeholder">
                  <i class="mdi mdi-book-open-variant"></i>
                </div>
                <div v-if="cycle.phase === 'phase2_reading' && p.uid === cycle.commonBookRecommenderUid" class="winner-badge">
                  👑 선정!
                </div>
              </div>
              <!-- 정보 -->
              <div class="participant-info">
                <div class="text-subtitle-2 font-black text-grey-dark line-clamp-2 mb-1">{{ p.book?.title }}</div>
                <div class="text-caption text-grey-2 font-medium mb-2">{{ p.book?.authors?.join(', ') }}</div>
                <div class="flex items-center gap-2 mb-3">
                  <div class="avatar avatar--xs">
                    <img :src="getProfileImagePath(p.profileImageId)" alt="프로필" />
                  </div>
                  <span class="text-caption font-bold text-grey-dark">{{ p.nickname }}</span>
                </div>
                <div v-if="p.reason" class="participant-reason text-caption text-grey-2 line-clamp-2">
                  "{{ p.reason }}"
                </div>
                <!-- 투표 중: 선정된 이로표시 (Phase 2에서) -->
                <div v-if="cycle.phase === 'phase2_reading' && p.uid === cycle.commonBookRecommenderUid" class="mt-3">
                  <span class="chip chip--amber chip--sm">투표 1위 확정 ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 탭 패널: 리뷰 모아보기 -->
        <div v-if="activeTab === 'reviews'">
          <div class="mt-4 mb-4 flex justify-between items-center">
            <h3 class="text-h6 font-black text-grey-dark">⭐ 리뷰 모아보기</h3>
            <div v-if="avgRating > 0" class="flex items-center gap-2">
              <StarRating :modelValue="avgRating" :readonly="true" />
              <span class="text-subtitle-1 font-black text-amber">{{ avgRating.toFixed(1) }}</span>
              <span class="text-caption text-grey-2">({{ reviews.length }}명)</span>
            </div>
          </div>
          <div v-if="loadingReviews" class="text-center pa-8"><div class="spinner" style="margin:0 auto;"></div></div>
          <div v-else-if="reviews.length === 0" class="card">
            <div class="card-body text-center pa-8 text-grey-2 font-bold">
              아직 리뷰가 없습니다. 가장 먼저 감상을 남겨보세요!
            </div>
          </div>
          <div v-else class="flex flex-col gap-3">
            <div v-for="r in reviews" :key="r.id" class="card">
              <div class="card-body">
                <div class="flex items-center gap-3 mb-3">
                  <div class="avatar avatar--sm">
                    <img :src="getProfileImagePath(r.profileImageId)" alt="프로필" />
                  </div>
                  <div>
                    <div class="text-subtitle-2 font-bold text-grey-dark">{{ r.nickname }}</div>
                    <div class="text-caption text-grey-2">{{ formatDate(r.createdAt) }}</div>
                  </div>
                  <div class="ml-auto">
                    <StarRating :modelValue="r.rating" :readonly="true" />
                  </div>
                </div>
                <p class="text-body-2 text-grey-3" style="white-space:pre-wrap;">{{ r.content }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 탭 패널: 모임 기록 -->
        <div v-if="activeTab === 'history'">
          <div class="mt-4 mb-4">
            <h3 class="text-h6 font-black text-grey-dark">📸 모임 기록</h3>
          </div>
          <div v-if="loadingMeetings" class="text-center pa-8"><div class="spinner" style="margin:0 auto;"></div></div>
          <div v-else-if="meetings.length === 0" class="card">
            <div class="card-body text-center pa-8 text-grey-2 font-bold">
              <i class="mdi mdi-camera-off-outline" style="font-size:2.5rem;color:#BDBDBD;display:block;margin-bottom:12px;"></i>
              아직 모임 기록이 없습니다. 오프라인 모임 후에 기록이 올라올 예정이에요!
            </div>
          </div>
          <div v-else class="flex flex-col gap-4">
            <div v-for="m in meetings" :key="m.id" class="card">
              <div class="card-body">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-subtitle-1 font-black text-grey-dark">{{ m.title }}</h4>
                  <span class="text-caption text-grey-2">{{ formatDate(m.createdAt) }}</span>
                </div>
                <p class="text-body-2 text-grey-3 line-height-relaxed" style="white-space:pre-wrap;">{{ m.content }}</p>
              </div>
            </div>
          </div>
        </div>

      </template>
    </template>

    <!-- ===== 책 등록 모달 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="bookRegisterModal" class="modal-overlay" @click.self="bookRegisterModal = false">
          <div class="modal" style="max-width:500px;">
            <div class="modal__header">
              <span class="modal__title">📚 책 등록하기</span>
              <button class="btn btn--text btn--icon" @click="bookRegisterModal = false"><i class="mdi mdi-close"></i></button>
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
              <textarea v-model="bookRegisterReason" class="textarea" rows="3" placeholder="이 책을 선택한 이유를 간단히 적어주세요 (선택)"></textarea>
            </div>
            <div class="modal__footer">
              <div v-if="registerError" class="alert alert--error mb-3 text-caption"><i class="mdi mdi-alert-circle-outline"></i>{{ registerError }}</div>
              <button
                class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                :class="{'is-loading':registeringBook}"
                :disabled="!selectedBook || registeringBook"
                @click="handleRegisterBook"
              >등록하기</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== 리뷰 작성 모달 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="reviewModal" class="modal-overlay" @click.self="reviewModal = false">
          <div class="modal" style="max-width:460px;">
            <div class="modal__header">
              <span class="modal__title">리뷰 & 별점 남기기</span>
              <button class="btn btn--text btn--icon" @click="reviewModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal__body">
              <div class="text-center mb-4">
                <div class="text-subtitle-2 font-bold text-grey-dark mb-3">별점을 선택해주세요</div>
                <StarRating v-model="reviewRating" style="justify-content:center;font-size:2rem;" />
              </div>
              <textarea v-model="reviewContent" class="textarea" rows="4" placeholder="이 책에 대한 감상을 자유롭게 작성해주세요..."></textarea>
            </div>
            <div class="modal__footer">
              <div v-if="reviewError" class="alert alert--error mb-3 text-caption"><i class="mdi mdi-alert-circle-outline"></i>{{ reviewError }}</div>
              <button
                class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                :class="{'is-loading':submittingReview}"
                :disabled="!reviewRating || !reviewContent.trim() || submittingReview"
                @click="handleSubmitReview"
              >리뷰 등록하기</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== 마스터: 모임 기록 작성 모달 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="masterMeetingModal" class="modal-overlay" @click.self="masterMeetingModal = false">
          <div class="modal" style="max-width:480px;">
            <div class="modal__header">
              <span class="modal__title">모임 기록 작성</span>
              <button class="btn btn--text btn--icon" @click="masterMeetingModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal__body">
              <input v-model="meetingTitle" class="input mb-3" placeholder="모임 제목 (예: 4월 오프라인 모임 후기)" />
              <textarea v-model="meetingContent" class="textarea" rows="5" placeholder="모임 내용, 분위기, 주요 논의 등을 자유롭게 기록해주세요."></textarea>
            </div>
            <div class="modal__footer">
              <button
                class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                :class="{'is-loading':savingMeeting}"
                :disabled="!meetingTitle.trim() || !meetingContent.trim() || savingMeeting"
                @click="handleAddMeeting"
              >저장하기</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCycle } from '~/composables/useCycle'
import { getProfileImagePath } from '~/composables/useProfileImages'
import { useRuntimeConfig } from '#app'
import StarRating from '~/components/StarRating.vue'

const authStore = useAuthStore()
const config = useRuntimeConfig()
const {
  fetchActiveCycle, createCycle, updateCyclePhase,
  fetchParticipants, registerBook, fetchMyParticipation,
  castVote, fetchMyVote, confirmCommonBook,
  fetchReviews, submitReview, fetchMyReview,
  fetchMeetingRecords, addMeetingRecord,
} = useCycle()

// ── 기본 상태 ────────────────────────────────────────────────────
const cycle = ref(null)
const loadingCycle = ref(true)
const isMaster = computed(() => authStore.userData?.role === 'master')

const activeTab = ref('members')
const tabs = computed(() => {
  const base = [
    { value: 'members', label: `참여 현황 (${participants.value.length}명)` },
    { value: 'reviews', label: '리뷰 모아보기' },
    { value: 'history', label: '모임 기록' },
  ]
  return base
})

const phaseLabel = computed(() => {
  const map = { phase1_reading: '1회차 독서 중', voting: '공통도서 투표 중', phase2_reading: '2회차 독서 중', closed: '종료' }
  return map[cycle.value?.phase] || ''
})

// ── 참여자 ────────────────────────────────────────────────────────
const participants = ref([])
const loadingParticipants = ref(false)
const myParticipation = ref(null)
const myVote = ref(null)

// ── 리뷰 ──────────────────────────────────────────────────────────
const reviews = ref([])
const loadingReviews = ref(false)
const myReview = ref(null)
const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return reviews.value.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.value.length
})

// ── 모임 기록 ─────────────────────────────────────────────────────
const meetings = ref([])
const loadingMeetings = ref(false)

// ── 추천인 닉네임 ──────────────────────────────────────────────────
const recommenderNickname = computed(() => {
  if (!cycle.value?.commonBookRecommenderUid) return null
  const p = participants.value.find(p => p.uid === cycle.value.commonBookRecommenderUid)
  return p?.nickname || null
})

// ── 탭 별 데이터 로딩 ─────────────────────────────────────────────
const loadTabData = async () => {
  if (!cycle.value) return

  loadingParticipants.value = true
  participants.value = await fetchParticipants(cycle.value.id)
  loadingParticipants.value = false

  loadingReviews.value = true
  reviews.value = await fetchReviews(cycle.value.id)
  loadingReviews.value = false

  loadingMeetings.value = true
  meetings.value = await fetchMeetingRecords(cycle.value.id)
  loadingMeetings.value = false

  if (authStore.user) {
    myParticipation.value = await fetchMyParticipation(cycle.value.id)
    myVote.value = await fetchMyVote(cycle.value.id)
    myReview.value = await fetchMyReview(cycle.value.id)
  }
}

onMounted(async () => {
  cycle.value = await fetchActiveCycle()
  loadingCycle.value = false
  await loadTabData()
})

// ── 마스터: 사이클 생성 ───────────────────────────────────────────
const newCycle = ref({ keyword: '', description: '', heroImageUrl: '', phase1Start: '', phase1End: '', phase2Start: '', phase2End: '' })
const creatingCycle = ref(false)
const handleCreateCycle = async () => {
  if (!newCycle.value.keyword.trim()) { alert('키워드를 입력해주세요.'); return }
  creatingCycle.value = true
  try {
    await createCycle(newCycle.value)
    cycle.value = await fetchActiveCycle()
    await loadTabData()
  } catch (err) { alert('사이클 생성 실패: ' + err.message) }
  finally { creatingCycle.value = false }
}

// ── 마스터: Phase 변경 ────────────────────────────────────────────
const PHASE_DESCRIPTIONS = {
  voting: {
    title: '공통 도서 투표 오픈',
    desc: '1회차 개별 독서를 마치고 투표를 시작합니다.\n멤버들은 다음 달 함께 읽고 싶은 책을 선택할 수 있습니다.\n\n계속하시겠습니까?',
  },
  closed: {
    title: '사이클 종료',
    desc: '현재 사이클을 완전히 종료합니다.\n종료 후에는 상태를 되돌릴 수 없습니다.\n\n정말 종료하시겠습니까?',
  },
}
const changePhase = async (phase) => {
  const info = PHASE_DESCRIPTIONS[phase]
  const msg = info ? `[ ${info.title} ]\n\n${info.desc}` : `Phase를 "${phase}"로 변경하시겠습니까?`
  if (!confirm(msg)) return
  await updateCyclePhase(cycle.value.id, phase)
  cycle.value = await fetchActiveCycle()
}

// 마스터가 직접 선택한 uid
const masterSelectedUid = ref('')

const handleConfirmCommonBook = async () => {
  if (!masterSelectedUid.value) { alert('공통 도서로 확정할 책을 선택해주세요.'); return }
  const selected = participants.value.find(p => p.uid === masterSelectedUid.value)
  if (!selected) return
  if (!confirm(`[ 공통 도서 확정 ]\n\n"${selected.book?.title}"\n(추천인: @${selected.nickname})을 이달의 공통 돈로 확정하고 2회차를 시작하시겠습니까?`)) return
  await updateCyclePhase(cycle.value.id, 'phase2_reading', {
    commonBook: selected.book,
    commonBookRecommenderUid: selected.uid,
  })
  masterSelectedUid.value = ''
  cycle.value = await fetchActiveCycle()
  await loadTabData()
}

// ── 책 등록 ───────────────────────────────────────────────────────
const bookRegisterModal = ref(false)
const bookSearchQuery = ref('')
const bookSearchResults = ref([])
const hasSearched = ref(false)
const searchingBook = ref(false)
const selectedBook = ref(null)
const bookRegisterReason = ref('')
const registeringBook = ref(false)
const registerError = ref('')

const openBookRegisterModal = () => {
  bookRegisterModal.value = true
  bookSearchQuery.value = ''
  bookSearchResults.value = []
  hasSearched.value = false
  selectedBook.value = null
  bookRegisterReason.value = ''
  registerError.value = ''
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

const handleRegisterBook = async () => {
  if (!selectedBook.value) return
  registerError.value = ''
  registeringBook.value = true
  try {
    await registerBook(cycle.value.id, {
      title: selectedBook.value.title,
      authors: selectedBook.value.authors,
      publisher: selectedBook.value.publisher,
      thumbnail: selectedBook.value.thumbnail,
      url: selectedBook.value.url,
      isbn: selectedBook.value.isbn,
    }, bookRegisterReason.value.trim())
    bookRegisterModal.value = false
    myParticipation.value = await fetchMyParticipation(cycle.value.id)
    participants.value = await fetchParticipants(cycle.value.id)
  } catch (err) { registerError.value = err.message || '등록 실패' }
  finally { registeringBook.value = false }
}

// ── 투표 ──────────────────────────────────────────────────────────
const handleVote = async (targetUid) => {
  if (!authStore.user) { alert('로그인이 필요합니다.'); return }
  if (!confirm('이 책에 투표하시겠습니까? 투표는 한 번만 가능합니다.')) return
  try {
    await castVote(cycle.value.id, targetUid)
    myVote.value = { targetUid }
    participants.value = await fetchParticipants(cycle.value.id)
  } catch (err) { alert('투표 실패: ' + err.message) }
}

// ── 리뷰 작성 ─────────────────────────────────────────────────────
const reviewModal = ref(false)
const reviewRating = ref(0)
const reviewContent = ref('')
const submittingReview = ref(false)
const reviewError = ref('')

const openReviewModal = () => {
  reviewModal.value = true
  reviewRating.value = 0
  reviewContent.value = ''
  reviewError.value = ''
}

const handleSubmitReview = async () => {
  if (!reviewRating.value) { reviewError.value = '별점을 선택해주세요.'; return }
  if (!reviewContent.value.trim()) { reviewError.value = '리뷰 내용을 입력해주세요.'; return }
  reviewError.value = ''
  submittingReview.value = true
  try {
    const phase = cycle.value.phase === 'phase2_reading' ? 'phase2' : 'phase1'
    await submitReview(cycle.value.id, reviewRating.value, reviewContent.value.trim(), phase)
    reviewModal.value = false
    myReview.value = { rating: reviewRating.value, content: reviewContent.value }
    reviews.value = await fetchReviews(cycle.value.id)
  } catch (err) { reviewError.value = err.message || '리뷰 등록 실패' }
  finally { submittingReview.value = false }
}

// ── 모임 기록 (단일 문서, 수정 가능) ─────────────────────────────
const masterMeetingModal = ref(false)
const meetingTitle = ref('')
const meetingContent = ref('')
const savingMeeting = ref(false)

// 기존 기록이 있으면 수정 모드로 모달 열기
const openMeetingModal = () => {
  if (meetings.value.length > 0) {
    const m = meetings.value[0]
    meetingTitle.value = m.title || ''
    meetingContent.value = m.content || ''
  } else {
    meetingTitle.value = ''
    meetingContent.value = ''
  }
  masterMeetingModal.value = true
}

const handleAddMeeting = async () => {
  savingMeeting.value = true
  try {
    if (meetings.value.length > 0) {
      // 기존 기록 수정
      const existingId = meetings.value[0].id
      const { updateDoc, doc } = await import('firebase/firestore')
      const { serverTimestamp } = await import('firebase/firestore')
      const nuxtApp = useNuxtApp()
      const fb = nuxtApp.$firebase
      await updateDoc(doc(fb.firestore, 'cycles', cycle.value.id, 'meetings', existingId), {
        title: meetingTitle.value.trim(),
        content: meetingContent.value.trim(),
        updatedAt: serverTimestamp(),
      })
    } else {
      // 신규 작성
      await addMeetingRecord(cycle.value.id, meetingTitle.value.trim(), meetingContent.value.trim())
    }
    masterMeetingModal.value = false
    meetings.value = await fetchMeetingRecords(cycle.value.id)
    activeTab.value = 'history'
  } catch (err) { alert('기록 저장 실패: ' + (err?.message || err)) }
  finally { savingMeeting.value = false }
}

// ── 날짜 유틸 ─────────────────────────────────────────────────────
const formatDateRange = (start, end) => {
  if (!start && !end) return ''
  const fmt = (v) => {
    if (!v) return ''
    const d = v?.toDate ? v.toDate() : new Date(v)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}.${m}.${day}`
  }
  return `${fmt(start)} ~ ${fmt(end)}`
}

const formatDate = (dateValue) => {
  if (!dateValue) return ''
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue)
  const now = new Date()
  const diffMin = Math.floor((now - date) / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${m}.${d}`
}
</script>

<style scoped>
/* ── 히어로 배너 ──────────────────────────── */
.cycles-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.cycles-hero__bg {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
}
.cycles-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 25, 41, 0.85) 0%, rgba(10, 25, 41, 0.3) 60%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 32px;
  @media (max-width: 600px) { padding: 20px; }
}
.cycles-hero__glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 20px 24px;
  width: 100%;
}
.common-book-thumb {
  width: 60px;
  height: 88px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

/* ── Action Box ────────────────────────────── */
.action-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media (min-width: 600px) { flex-direction: row; align-items: center; justify-content: space-between; }
}
.action-box__text { display: flex; align-items: flex-start; gap: 12px; }
.action-box__icon { font-size: 1.6rem; flex-shrink: 0; margin-top: 2px; }

/* ── 추천인 특권 ─────────────────────────── */
.recommender-privilege {
  border: 2px solid #FFB300 !important;
  background: linear-gradient(135deg, #FFF8E1, #FFFDE7) !important;
}

/* ── 마스터 패널 ─────────────────────────── */
.master-panel {
  border: 2px solid #FFD54F !important;
  background: #FFFDE7 !important;
}

/* ── 참여 현황 그리드 ────────────────────── */
.participants-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  @media (min-width: 600px) { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 960px) { grid-template-columns: repeat(4, 1fr); }
}
.participant-card {
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  &.is-winner { border: 2px solid #FFB300 !important; }
}
.participant-book-cover {
  position: relative;
  height: 160px;
  background: #EEEEEE;
  overflow: hidden;
}
.participant-book-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.participant-book-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #BDBDBD;
}
.winner-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #FFB300;
  color: #212121;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.participant-info { padding: 12px; }
.participant-reason {
  background: #F5F5F5;
  padding: 8px;
  border-radius: 8px;
  font-style: italic;
}

/* ── 책 등록 모달 ────────────────────────── */
.book-search-list { max-height: 260px; overflow-y: auto; }
.book-search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.2s;
  &:hover { background: #F5F5F5; }
}
.book-search-thumb { width: 40px; height: 56px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.selected-book-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #E8EAF6;
  border: 1px solid #9FA8DA;
  border-radius: 10px;
  padding: 12px;
}
.selected-book-thumb { width: 50px; height: 70px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.append-btn { margin: 6px 8px 6px 0; height: 36px; }
.input-with-suffix {
  display: flex; align-items: center;
  border: 1.5px solid #E0E0E0; border-radius: 8px; background: #FAFAFA; overflow: hidden;
  &:focus-within { border-color: #1E88E5; box-shadow: 0 0 0 3px rgba(30,136,229,0.12); }
  input { flex:1; border:none; background:transparent; padding:10px 12px 10px 4px; font-size:0.9375rem; font-weight:500; outline:none; &::placeholder{ color:#BDBDBD; } }
}

/* ── util ───────────────────────────────── */
.pa-6  { padding: 24px; }
.pa-8  { padding: 32px; }
.pa-10 { padding: 40px; }
.mr-1  { margin-right: 4px; }
.mt-3  { margin-top: 12px; }
.ml-auto { margin-left: auto; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.text-amber { color: #FFB300; }

/* ── 마스터 책 선택 리스트 ──────────────────── */
.master-book-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding: 4px 2px;
}
.master-book-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 2px solid #E0E0E0;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #90CAF9; background: #F5F5F5; }
  &.is-selected { border-color: #1E88E5; background: #E3F2FD; }
}
.master-book-thumb {
  width: 36px;
  height: 52px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}
.master-book-thumb-placeholder {
  width: 36px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EEEEEE;
  border-radius: 4px;
  flex-shrink: 0;
  color: #9E9E9E;
  font-size: 1.2rem;
}
.w-100 { width: 100%; }

</style>
