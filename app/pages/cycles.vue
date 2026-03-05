<template>
  <div class="fade-in">

    <!-- ???덉뼱濡?諛곕꼫 -->
    <div class="cycles-hero mb-6">
      <img
        :src="cycle?.heroImageUrl || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2187&auto=format&fit=crop'"
        alt="?붽컙 二쇱젣 諛곕꼫"
        class="cycles-hero__bg"
      />
      <div class="cycles-hero__overlay">
        <div class="cycles-hero__glass">

          <!-- Phase 1 -->
          <template v-if="!cycle">
            <div class="text-caption font-bold text-white mb-2 opacity-90">寃뚯엫?명듃 ?낆꽌 紐⑥엫</div>
            <div class="text-h5 font-black text-white mb-1">吏꾪뻾 以묒씤 ?ъ씠?댁씠 ?놁뒿?덈떎</div>
            <div class="text-body-2 text-white opacity-80">留덉뒪?곌? ???ъ씠?댁쓣 ?쒖옉?섎㈃ ?ш린???쒖떆?⑸땲??</div>
          </template>

          <template v-else-if="cycle.phase === 'phase1_reading' || cycle.phase === 'voting'">
            <span class="chip chip--red mb-3" style="display:inline-flex;">
              <i class="mdi mdi-book-open-variant mr-1"></i>
              {{ cycle.phase === 'voting' ? '怨듯넻 ?꾩꽌 ?ы몴 以? : '1?뚯감 쨌 媛쒕퀎 ?낆꽌 湲곌컙' }}
            </span>
            <div class="text-caption font-bold mb-1" style="color:rgba(255,255,255,0.75);">?대쾲 ??二쇱젣 ?ㅼ썙??/div>
            <div class="text-h4 font-black text-white mb-3"># {{ cycle.keyword }}</div>
            <div class="flex items-center gap-4 text-body-2 font-medium" style="color:rgba(255,255,255,0.8);">
              <span class="flex items-center gap-1"><i class="mdi mdi-calendar"></i> {{ formatDateRange(cycle.phase1Start, cycle.phase1End) }}</span>
              <span class="flex items-center gap-1"><i class="mdi mdi-map-marker"></i> ?⑤씪???ㅽ봽?쇱씤</span>
            </div>
          </template>

          <template v-else-if="cycle.phase === 'phase2_reading'">
            <span class="chip chip--primary mb-3" style="display:inline-flex;">
              <i class="mdi mdi-trophy mr-1"></i>2?뚯감 쨌 怨듯넻 ?꾩꽌 ?낆꽌 湲곌컙
            </span>
            <div class="text-caption font-bold mb-2" style="color:rgba(255,255,255,0.75);">?몣 ?ы몴 1?? ?대떖??怨듯넻 ?꾩꽌</div>
            <div class="flex items-center gap-4 mb-3">
              <img
                v-if="cycle.commonBook?.thumbnail"
                :src="cycle.commonBook.thumbnail"
                class="common-book-thumb"
                alt="怨듯넻 ?꾩꽌"
              />
              <div>
                <div class="text-h5 font-black text-white mb-1">{{ cycle.commonBook?.title }}</div>
                <div class="text-body-2 font-medium" style="color:rgba(255,255,255,0.8);">{{ cycle.commonBook?.authors?.join(', ') }}</div>
                <div v-if="recommenderNickname" class="text-caption mt-1" style="color:rgba(255,255,255,0.65);">
                  異붿쿇?? @{{ recommenderNickname }}
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

    <!-- 濡쒕뵫 -->
    <div v-if="loadingCycle" class="text-center pa-10">
      <div class="spinner" style="margin:0 auto;"></div>
    </div>

    <template v-else>

      <!-- ????Action Box -->
      <div v-if="cycle && authStore.user" class="card mb-6">
        <div class="card-body action-box">

          <!-- Phase 1: 梨?誘몃벑濡?-->
          <template v-if="(cycle.phase === 'phase1_reading') && !myParticipation">
            <div class="action-box__text">
              <i class="mdi mdi-alert-circle-outline action-box__icon text-orange-dark"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">{{ authStore.userData?.nickname }}?? ?꾩쭅 ?대쾲 二쇱젣??梨낆쓣 怨좊Ⅴ吏 ?딆쑝?⑤꽕??</div>
                <div class="text-caption text-grey-2 font-medium">?ㅼ썙??<strong>#{{ cycle.keyword }}</strong>??留욌뒗 梨낆쓣 寃?됲븯怨??깅줉?댁＜?몄슂.</div>
              </div>
            </div>
            <button class="btn btn--primary btn--lg font-black rounded-sm" @click="openBookRegisterModal">
              <i class="mdi mdi-book-plus-outline"></i> 梨?寃???깅줉
            </button>
          </template>

          <!-- Phase 1: 梨??깅줉??+ 由щ럭 誘몄옉??-->
          <template v-else-if="cycle.phase === 'phase1_reading' && myParticipation && !myReview">
            <div class="action-box__text">
              <i class="mdi mdi-book-check-outline action-box__icon text-green"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">梨낆쓣 ?깅줉?섏뀲?듬땲?? ?댁젣 由щ럭瑜??④꺼二쇱꽭???랃툘</div>
                <div class="text-caption text-grey-2 font-medium">
                  <strong>{{ myParticipation.book?.title }}</strong>
                  &nbsp;???낆꽌 ??蹂꾩젏怨?媛먯긽???④꺼二쇱꽭?? ?ㅽ봽?쇱씤 紐⑥엫 ???ы몴??吏꾪뻾?⑸땲??
                </div>
              </div>
            </div>
            <button class="btn btn--primary btn--lg font-black rounded-sm" @click="openReviewModal">
              <i class="mdi mdi-star-outline"></i> ??梨?由щ럭 ?곌린
            </button>
          </template>

          <!-- Phase 1: 梨??깅줉 + 由щ럭 ?꾨즺 -->
          <template v-else-if="cycle.phase === 'phase1_reading' && myParticipation && myReview">
            <div class="action-box__text">
              <i class="mdi mdi-check-circle action-box__icon text-green"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">梨??깅줉怨?由щ럭瑜?紐⑤몢 ?꾨즺?섏뀲?듬땲?? ?럷截?/div>
                <div class="text-caption text-grey-2 font-medium">
                  <strong>{{ myParticipation.book?.title }}</strong> ???ㅽ봽?쇱씤 紐⑥엫 ???ы몴媛 吏꾪뻾???덉젙?낅땲??
                </div>
              </div>
            </div>
            <StarRating :modelValue="myReview.rating" :readonly="true" />
          </template>

          <!-- ?ы몴 ?④퀎 (?쇰컲 ?좎?) -->
          <template v-else-if="cycle.phase === 'voting'">
            <div class="action-box__text">
              <i class="mdi mdi-account-group action-box__icon text-blue-dark"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">?ㅽ봽?쇱씤 紐⑥엫?먯꽌 ?ы몴媛 吏꾪뻾 以묒엯?덈떎!</div>
                <div class="text-caption text-grey-2 font-medium">
                  留덉뒪?곌? ?ㅽ봽?쇱씤 ?꾩옣 ?ы몴 寃곌낵瑜?諛섏쁺?섏뿬 怨듯넻 ?꾩꽌瑜??뺤젙?⑸땲??
                </div>
              </div>
            </div>
            <span class="chip chip--grey">?ы몴 吏꾪뻾以?/span>
          </template>

          <!-- Phase 2: 由щ럭 誘몄옉??-->
          <template v-else-if="cycle.phase === 'phase2_reading' && !myReview">
            <div class="action-box__text">
              <i class="mdi mdi-pencil action-box__icon text-blue-dark"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">{{ authStore.userData?.nickname }}?? 怨듯넻 ?꾩꽌瑜????쎌쑝?⑤굹??</div>
                <div class="text-caption text-grey-2 font-medium">紐⑥엫 ?꾧퉴吏 蹂꾩젏怨?媛먯긽?됱쓣 ?④꺼二쇱꽭??</div>
              </div>
            </div>
            <button class="btn btn--primary btn--lg font-black rounded-sm" @click="openReviewModal">
              <i class="mdi mdi-star-outline"></i> 由щ럭 ?곌린
            </button>
          </template>

          <!-- Phase 2: 由щ럭 ?묒꽦??-->
          <template v-else-if="cycle.phase === 'phase2_reading' && myReview">
            <div class="action-box__text">
              <i class="mdi mdi-check-circle-outline action-box__icon text-green"></i>
              <div>
                <div class="text-subtitle-1 font-black text-grey-dark">由щ럭瑜??④꺼二쇱뀲?듬땲?? 媛먯궗?⑸땲???솋</div>
                <div class="text-caption text-grey-2 font-medium">?ㅻⅨ 硫ㅻ쾭?ㅼ쓽 由щ럭???뺤씤?대낫?몄슂.</div>
              </div>
            </div>
            <StarRating :modelValue="myReview.rating" :readonly="true" />
          </template>

        </div>
      </div>

      <!-- ?⑥쿇???밴텒:
           - Phase 2?먯꽌 ??梨낆씠 怨듯넻?꾩꽌濡??좎젙?섏뿀????
           - ?꾩쭅 ?먯쑀?꾩꽌瑜??깅줉?섏? ?딆? ?곹깭(freeBookRegistered媛 ?놁쓬)
        -->
      <div
        v-if="cycle?.phase === 'phase2_reading' && cycle.commonBookRecommenderUid === authStore.user?.uid && !myParticipation?.freeBookRegistered"
        class="card mb-6 recommender-privilege"
      >
        <div class="card-body action-box">
          <div class="action-box__text">
            <i class="mdi mdi-crown action-box__icon" style="color:#FFB300;"></i>
            <div>
              <div class="text-subtitle-1 font-black text-grey-dark">?럦 ?좎젙???밴텒!</div>
              <div class="text-caption text-grey-2 font-medium">??梨낆씠 怨듯넻 ?꾩꽌濡??좎젙?섏뿀?듬땲?? ?섎쭔???먯쑀 ?꾩꽌瑜?異붽? ?깅줉?????덉뼱??</div>
            </div>
          </div>
          <button class="btn btn--lg font-black rounded-sm" style="background:#FFF8E1;color:#F57C00;border:1px solid #FFB300;" @click="openBookRegisterModal">
            <i class="mdi mdi-book-plus"></i> ?먯쑀 ?꾩꽌 異붽?
          </button>
        </div>
      </div>

      <!-- ??留덉뒪??愿由??⑤꼸 -->
      <div v-if="isMaster && cycle" class="card mb-6 master-panel">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <div class="text-subtitle-1 font-black flex items-center gap-2">
              <i class="mdi mdi-shield-crown" style="color:#FFB300;"></i>留덉뒪??愿由??⑤꼸
            </div>
            <span class="chip chip--amber">Phase: {{ phaseLabel }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-if="cycle.phase === 'phase1_reading'" class="btn btn--tonal font-bold rounded-sm" @click="changePhase('voting')">
              <i class="mdi mdi-vote"></i> ?ы몴 ?④퀎 ?쒖옉
            </button>
            <!-- ?ы몴 ?④퀎: 留덉뒪?곌? 吏곸젒 梨??좏깮 -->
            <template v-if="cycle.phase === 'voting'">
              <div class="w-100 mt-2">
                <div class="text-caption font-bold text-grey-2 mb-2">
                  <i class="mdi mdi-cursor-pointer"></i> ?ㅽ봽?쇱씤 ?ы몴 寃곌낵 ??怨듯넻 ?꾩꽌濡??뺤젙??梨낆쓣 ?좏깮?섏꽭??
                </div>
                <div class="master-book-select">
                  <div
                    v-for="p in participants"
                    :key="p.uid"
                    class="master-book-option"
                    :class="{ 'is-selected': masterSelectedUid === p.uid }"
                    @click="masterSelectedUid = p.uid"
                  >
                    <img v-if="p.book?.thumbnail" :src="p.book.thumbnail" class="master-book-thumb" alt="?쒖?" />
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
                  <i class="mdi mdi-trophy"></i> ?좏깮??梨낆쑝濡?怨듯넻 ?꾩꽌 ?뺤젙 ??2?뚯감 ?쒖옉
                </button>
              </div>
            </template>
            <button v-if="cycle.phase === 'phase2_reading'" class="btn btn--dark font-bold rounded-sm" @click="changePhase('closed')">
              <i class="mdi mdi-flag-checkered"></i> ?ъ씠??醫낅즺
            </button>
            <button class="btn btn--tonal font-bold rounded-sm" @click="openMeetingModal">
              <i :class="meetings.length > 0 ? 'mdi mdi-pencil-box-outline' : 'mdi mdi-pencil-box'"></i>
              {{ meetings.length > 0 ? '紐⑥엫 湲곕줉 ?섏젙' : '紐⑥엫 湲곕줉 ?묒꽦' }}
            </button>
          </div>

          <!-- 留덉뒪?? 由щ럭 誘몄옉?깆옄 ?꾪솴 -->
          <div v-if="cycle.phase !== 'closed' && participants.length > 0" class="mt-4 pt-4" style="border-top: 1px solid rgba(0,0,0,0.08);">
            <div class="text-caption font-bold text-grey-2 mb-2">
              <i class="mdi mdi-clipboard-check-outline"></i>
              由щ럭 ?묒꽦 ?꾪솴 ({{ cycle.phase === 'phase2_reading' ? '2?뚯감' : '1?뚯감' }})
            </div>
            <div class="master-review-progress">
              <div
                v-for="p in participants"
                :key="p.uid"
                class="master-review-item"
              >
                <div class="avatar avatar--xs">
                  <img :src="getProfileImagePath(p.profileImageId)" alt="?꾨줈?? />
                </div>
                <span class="text-caption font-medium text-grey-dark flex-1">
                  {{ p.nickname }}
                </span>
                <span
                  class="chip chip--sm"
                  :class="reviews.some(r => r.authorUid === p.uid && r.phase === (cycle.phase === 'phase2_reading' ? 'phase2' : 'phase1')) ? 'chip--green' : 'chip--grey'"
                >
                  {{ reviews.some(r => r.authorUid === p.uid && r.phase === (cycle.phase === 'phase2_reading' ? 'phase2' : 'phase1')) ? '由щ럭 ?꾨즺 ?? : '由щ럭 ?놁쓬' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 留덉뒪?? ???ъ씠???앹꽦 (?ъ씠???놁쓣 ?? -->
      <div v-if="isMaster && !cycle" class="card mb-6 master-panel">
        <div class="card-body">
          <div class="text-subtitle-1 font-black flex items-center gap-2 mb-4">
            <i class="mdi mdi-shield-crown" style="color:#FFB300;"></i>???ъ씠???쒖옉
          </div>
          <div class="flex flex-col gap-3">
            <input v-model="newCycle.keyword" class="input" placeholder="?대쾲 ???ㅼ썙??(?? ?멸컙)" />
            <textarea v-model="newCycle.description" class="textarea" rows="2" placeholder="二쇱젣 ?ㅻ챸"></textarea>
            <input v-model="newCycle.heroImageUrl" class="input" placeholder="諛곕꼫 ?대?吏 URL (?좏깮, 湲곕낯 ?대?吏 ?ъ슜 媛??" />
            <button class="btn btn--primary font-black rounded-sm btn--lg" :class="{'is-loading': creatingCycle}" :disabled="creatingCycle || !newCycle.keyword.trim()" @click="handleCreateCycle">
              <i class="mdi mdi-play-circle-outline"></i> ?ъ씠???쒖옉?섍린 (1?뚯감 媛쒕퀎 ?낆꽌)
            </button>
          </div>
        </div>
      </div>

      <!-- ?ъ씠???놁쓬 (?쇰컲 ?좎?) -->
      <div v-if="!cycle && !isMaster" class="card mb-6">
        <div class="card-body text-center pa-10">
          <i class="mdi mdi-book-off-outline" style="font-size:3rem;color:#BDBDBD;display:block;margin-bottom:12px;"></i>
          <div class="text-h6 font-black text-grey-dark mb-2">?꾩옱 吏꾪뻾 以묒씤 ?ъ씠?댁씠 ?놁뒿?덈떎</div>
          <div class="text-body-2 text-grey-2 font-medium">?ㅼ쓬 ?ъ씠?댁씠 ?쒖옉?섎㈃ ?뚮젮?쒕┫寃뚯슂!</div>
        </div>
      </div>

      <template v-if="cycle">
        <!-- ??硫붿씤 ??-->
        <div class="tabs">
          <button
            v-for="tab in tabs" :key="tab.value"
            class="tab-btn"
            :class="{ 'is-active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >{{ tab.label }}</button>
        </div>

        <!-- ???⑤꼸: 李몄뿬 ?꾪솴 -->
        <div v-if="activeTab === 'members'">
          <!-- Phase 2: 怨듯넻?꾩꽌 + ?좎젙???먯쑉泥??뱀쭛 ?쒖떆 -->
          <template v-if="cycle.phase === 'phase2_reading'">
            <div class="mt-4 mb-4">
              <h3 class="text-h6 font-black text-grey-dark">?뱴 2?뚯감 怨듯넻 ?꾩꽌</h3>
            </div>
            <!-- 怨듯넻 ?꾩꽌 -->
            <div v-if="cycle.commonBook" class="phase2-book-featured mb-4">
              <div class="phase2-book-badge">?몣 ?대떖??怨듯넻 ?꾩꽌</div>
              <img v-if="cycle.commonBook.thumbnail" :src="cycle.commonBook.thumbnail" class="phase2-book-thumb" alt="?쒖?" />
              <div class="phase2-book-info">
                <div class="text-subtitle-1 font-black text-grey-dark">{{ cycle.commonBook.title }}</div>
                <div class="text-caption text-grey-2 mt-1">{{ cycle.commonBook.authors?.join(', ') }}</div>
                <div class="text-caption text-grey-2">{{ cycle.commonBook.publisher }}</div>
                <div class="text-caption font-bold mt-2" style="color:#1E88E5;">
                  異붿쿇?? @{{ recommenderNickname }}
                </div>
              </div>
            </div>
            <!-- ?좎젙???먯쑉泥?-->
            <template v-if="participants.find(p => p.uid === cycle.commonBookRecommenderUid)">
              <div class="mt-2 mb-3">
                <h3 class="text-h6 font-black text-grey-dark">?뙚 ?좎젙???먯쑉泥?/h3>
              </div>
              <template v-if="participants.find(p => p.uid === cycle.commonBookRecommenderUid)?.freeBookRegistered">
                <div class="phase2-book-featured">
                  <div class="phase2-book-badge" style="background:#E8F5E9;color:#2E7D32;">?랃툘 ?먯쑉泥?/div>
                  <img
                    v-if="participants.find(p => p.uid === cycle.commonBookRecommenderUid)?.book?.thumbnail"
                    :src="participants.find(p => p.uid === cycle.commonBookRecommenderUid).book.thumbnail"
                    class="phase2-book-thumb"
                    alt="?쒖?"
                  />
                  <div class="phase2-book-info">
                    <div class="text-subtitle-1 font-black text-grey-dark">{{ participants.find(p => p.uid === cycle.commonBookRecommenderUid)?.book?.title }}</div>
                    <div class="text-caption text-grey-2 mt-1">{{ participants.find(p => p.uid === cycle.commonBookRecommenderUid)?.book?.authors?.join(', ') }}</div>
                  </div>
                </div>
              </template>
              <div v-else class="card">
                <div class="card-body text-center text-grey-2 font-bold pa-6">
                  <i class="mdi mdi-book-clock-outline" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
                  異붿쿇??@{{ recommenderNickname }}?섏씠 ?먯쑉泥듭쓣 ?좎젙 以묒엯?덈떎...
                </div>
              </div>
            </template>
          </template>

          <!-- Phase 1 / Voting: 湲곗〈 李몄뿬??洹몃━??-->
          <template v-else>
          <div class="flex justify-between items-center mb-4 mt-4">
            <h3 class="text-h6 font-black text-grey-dark">?뱴 李몄뿬 ?꾪솴 <span class="text-blue-dark">{{ participants.length }}紐?/span></h3>
          </div>
          <div v-if="loadingParticipants" class="text-center pa-8"><div class="spinner" style="margin:0 auto;"></div></div>
          <div v-else-if="participants.length === 0" class="text-center pa-10 text-grey-2 font-bold">
            ?꾩쭅 梨낆쓣 ?깅줉??硫ㅻ쾭媛 ?놁뒿?덈떎. 媛??癒쇱? ?깅줉?대낫?몄슂!
          </div>
          <div v-else class="participants-grid">
            <div
              v-for="p in participants"
              :key="p.id"
              class="participant-card card"
              :class="{ 'is-winner': cycle.phase === 'phase2_reading' && p.uid === cycle.commonBookRecommenderUid }"
            >
              <!-- 梨??쒖? 諛곌꼍 -->
              <div class="participant-book-cover">
                <img
                  v-if="p.book?.thumbnail"
                  :src="p.book.thumbnail"
                  class="participant-book-img"
                  alt="梨??쒖?"
                />
                <div v-else class="participant-book-placeholder">
                  <i class="mdi mdi-book-open-variant"></i>
                </div>
                <div v-if="cycle.phase === 'phase2_reading' && p.uid === cycle.commonBookRecommenderUid" class="winner-badge">
                  ?몣 ?좎젙!
                </div>
              </div>
              <!-- ?뺣낫 -->
              <div class="participant-info">
                <div class="text-subtitle-2 font-black text-grey-dark line-clamp-2 mb-1">{{ p.book?.title }}</div>
                <div class="text-caption text-grey-2 font-medium mb-2">{{ p.book?.authors?.join(', ') }}</div>
                <div class="flex items-center gap-2 mb-3">
                  <div class="avatar avatar--xs">
                    <img :src="getProfileImagePath(p.profileImageId)" alt="?꾨줈?? />
                  </div>
                  <span class="text-caption font-bold text-grey-dark">{{ p.nickname }}</span>
                </div>
                <div v-if="p.reason" class="participant-reason text-caption text-grey-2 line-clamp-2">
                  "{{ p.reason }}"
                </div>
                <!-- ?ы몴 以? ?좎젙???대줈?쒖떆 (Phase 2?먯꽌) -->
                <div v-if="cycle.phase === 'phase2_reading' && p.uid === cycle.commonBookRecommenderUid" class="mt-3">
                  <span class="chip chip--amber chip--sm">?ы몴 1???뺤젙 ??/span>
                </div>
              </div>
            </div>
          </div>
          </template> <!-- end v-else (Phase 1 grid) -->
        </div>

        <!-- ???⑤꼸: 由щ럭 紐⑥븘蹂닿린 -->
        <div v-if="activeTab === 'reviews'">
          <div class="mt-4 mb-4 flex justify-between items-center">
            <h3 class="text-h6 font-black text-grey-dark">狩?由щ럭 紐⑥븘蹂닿린</h3>
            <div v-if="avgRating > 0" class="flex items-center gap-2">
              <StarRating :modelValue="avgRating" :readonly="true" />
              <span class="text-subtitle-1 font-black text-amber">{{ avgRating.toFixed(1) }}</span>
              <span class="text-caption text-grey-2">({{ currentPhaseReviews.length }}紐?</span>
            </div>
          </div>
          <div v-if="loadingReviews" class="text-center pa-8"><div class="spinner" style="margin:0 auto;"></div></div>
          <div v-else-if="reviews.length === 0" class="card">
            <div class="card-body text-center pa-8 text-grey-2 font-bold">
              ?꾩쭅 由щ럭媛 ?놁뒿?덈떎. 媛??癒쇱? 媛먯긽???④꺼蹂댁꽭??
            </div>
          </div>
          <div v-else class="flex flex-col gap-3">
            <div
              v-for="r in reviews.filter(r => r.phase === (cycle.phase === 'phase2_reading' ? 'phase2' : 'phase1'))"
              :key="r.id"
              class="card"
            >
              <div class="card-body">
                <div class="flex items-center gap-3 mb-3">
                  <div class="avatar avatar--sm">
                    <img :src="getProfileImagePath(r.profileImageId)" alt="?꾨줈?? />
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

        <!-- ???⑤꼸: 紐⑥엫 湲곕줉 -->
        <div v-if="activeTab === 'history'">
          <div class="mt-4 mb-4">
            <h3 class="text-h6 font-black text-grey-dark">?벝 紐⑥엫 湲곕줉</h3>
          </div>
          <div v-if="loadingMeetings" class="text-center pa-8"><div class="spinner" style="margin:0 auto;"></div></div>
          <div v-else-if="meetings.length === 0" class="card">
            <div class="card-body text-center pa-8 text-grey-2 font-bold">
              <i class="mdi mdi-camera-off-outline" style="font-size:2.5rem;color:#BDBDBD;display:block;margin-bottom:12px;"></i>
              ?꾩쭅 紐⑥엫 湲곕줉???놁뒿?덈떎. ?ㅽ봽?쇱씤 紐⑥엫 ?꾩뿉 湲곕줉???щ씪???덉젙?댁뿉??
            </div>
          </div>
          <div v-else class="flex flex-col gap-4">
            <div
              v-for="m in meetings.filter(m => m.phase === currentPhaseKey)"
              :key="m.id"
              class="card"
            >
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

    <!-- ===== 梨??깅줉 紐⑤떖 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="bookRegisterModal" class="modal-overlay" @click.self="bookRegisterModal = false">
          <div class="modal" style="max-width:500px;">
            <div class="modal__header">
              <span class="modal__title">?뱴 梨??깅줉?섍린</span>
              <button class="btn btn--text btn--icon" @click="bookRegisterModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal__body">
              <div v-if="!selectedBook" class="mb-4">
                <div class="input-with-suffix mb-3">
                  <i class="mdi mdi-magnify" style="padding:0 8px 0 12px;color:#757575;"></i>
                  <input v-model="bookSearchQuery" type="text" placeholder="梨??쒕ぉ?쇰줈 寃??.." @keyup.enter="searchBook" />
                  <button class="btn btn--primary btn--sm append-btn" :class="{'is-loading':searchingBook}" @click="searchBook">寃??/button>
                </div>
                <div v-if="bookSearchResults.length > 0" class="book-search-list">
                  <div
                    v-for="b in bookSearchResults" :key="b.isbn"
                    class="book-search-item cursor-pointer"
                    @click="selectedBook = b"
                  >
                    <img :src="b.thumbnail || 'https://via.placeholder.com/50x70?text=No'" class="book-search-thumb" alt="?쒖?" />
                    <div class="min-w-0">
                      <div class="text-subtitle-2 font-bold text-grey-dark line-clamp-1">{{ b.title }}</div>
                      <div class="text-caption text-grey-2">{{ b.authors?.join(', ') }} | {{ b.publisher }}</div>
                    </div>
                  </div>
                </div>
                <div v-else-if="hasSearched" class="text-center pa-6 text-grey-2 font-bold text-caption">寃??寃곌낵媛 ?놁뒿?덈떎.</div>
              </div>
              <div v-if="selectedBook" class="selected-book-preview mb-4">
                <img :src="selectedBook.thumbnail" class="selected-book-thumb" alt="?좏깮??梨? />
                <div class="flex-grow min-w-0">
                  <div class="text-subtitle-1 font-black text-grey-dark">{{ selectedBook.title }}</div>
                  <div class="text-caption text-grey-2">{{ selectedBook.authors?.join(', ') }}</div>
                </div>
                <button class="btn btn--text btn--icon" @click="selectedBook = null"><i class="mdi mdi-close"></i></button>
              </div>
              <textarea v-model="bookRegisterReason" class="textarea" rows="3" placeholder="??梨낆쓣 ?좏깮???댁쑀瑜?媛꾨떒???곸뼱二쇱꽭??(?좏깮)"></textarea>
            </div>
            <div class="modal__footer">
              <div v-if="registerError" class="alert alert--error mb-3 text-caption"><i class="mdi mdi-alert-circle-outline"></i>{{ registerError }}</div>
              <button
                class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                :class="{'is-loading':registeringBook}"
                :disabled="!selectedBook || registeringBook"
                @click="handleRegisterBook"
              >?깅줉?섍린</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== 由щ럭 ?묒꽦 紐⑤떖 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="reviewModal" class="modal-overlay" @click.self="reviewModal = false">
          <div class="modal" style="max-width:460px;">
            <div class="modal__header">
              <span class="modal__title">由щ럭 & 蹂꾩젏 ?④린湲?/span>
              <button class="btn btn--text btn--icon" @click="reviewModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal__body">
              <div class="text-center mb-4">
                <div class="text-subtitle-2 font-bold text-grey-dark mb-3">蹂꾩젏???좏깮?댁＜?몄슂</div>
                <StarRating v-model="reviewRating" style="justify-content:center;font-size:2rem;" />
              </div>
              <textarea v-model="reviewContent" class="textarea" rows="4" placeholder="??梨낆뿉 ???媛먯긽???먯쑀濡?쾶 ?묒꽦?댁＜?몄슂..."></textarea>
            </div>
            <div class="modal__footer">
              <div v-if="reviewError" class="alert alert--error mb-3 text-caption"><i class="mdi mdi-alert-circle-outline"></i>{{ reviewError }}</div>
              <button
                class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                :class="{'is-loading':submittingReview}"
                :disabled="!reviewRating || !reviewContent.trim() || submittingReview"
                @click="handleSubmitReview"
              >由щ럭 ?깅줉?섍린</button>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== 留덉뒪?? 紐⑥엫 湲곕줉 ?묒꽦 紐⑤떖 ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="masterMeetingModal" class="modal-overlay" @click.self="masterMeetingModal = false">
          <div class="modal" style="max-width:480px;">
            <div class="modal__header">
              <span class="modal__title">紐⑥엫 湲곕줉 ?묒꽦</span>
              <button class="btn btn--text btn--icon" @click="masterMeetingModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal__body">
              <input v-model="meetingTitle" class="input mb-3" placeholder="紐⑥엫 ?쒕ぉ (?? 4???ㅽ봽?쇱씤 紐⑥엫 ?꾧린)" />
              <textarea v-model="meetingContent" class="textarea" rows="5" placeholder="紐⑥엫 ?댁슜, 遺꾩쐞湲? 二쇱슂 ?쇱쓽 ?깆쓣 ?먯쑀濡?쾶 湲곕줉?댁＜?몄슂."></textarea>
            </div>
            <div class="modal__footer">
              <button
                class="btn btn--primary btn--lg btn--block font-black rounded-sm"
                :class="{'is-loading':savingMeeting}"
                :disabled="!meetingTitle.trim() || !meetingContent.trim() || savingMeeting"
                @click="handleAddMeeting"
              >??ν븯湲?/button>
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

// ?? 湲곕낯 ?곹깭 ????????????????????????????????????????????????????
const cycle = ref(null)
const loadingCycle = ref(true)
const isMaster = computed(() => authStore.userData?.role === 'master')

const activeTab = ref('members')
const tabs = computed(() => {
  const base = [
    { value: 'members', label: `李몄뿬 ?꾪솴 (${participants.value.length}紐?` },
    { value: 'reviews', label: '由щ럭 紐⑥븘蹂닿린' },
    { value: 'history', label: '紐⑥엫 湲곕줉' },
  ]
  return base
})

const phaseLabel = computed(() => {
  const map = { phase1_reading: '1?뚯감 ?낆꽌 以?, voting: '怨듯넻?꾩꽌 ?ы몴 以?, phase2_reading: '2?뚯감 ?낆꽌 以?, closed: '醫낅즺' }
  return map[cycle.value?.phase] || ''
})

// ?? 李몄뿬??????????????????????????????????????????????????????????
const participants = ref([])
const loadingParticipants = ref(false)
const myParticipation = ref(null)
const myVote = ref(null)

// ?? 由щ럭 ??????????????????????????????????????????????????????????
const reviews = ref([])
const loadingReviews = ref(false)
const myReview = ref(null)

// ?꾩옱 ?섏씠利덉쓽 由щ럭留??꾪꽣
const currentPhaseKey = computed(() =>
  cycle.value?.phase === 'phase2_reading' ? 'phase2' : 'phase1'
)
const currentPhaseReviews = computed(() =>
  reviews.value.filter(r => r.phase === currentPhaseKey.value)
)
const avgRating = computed(() => {
  if (!currentPhaseReviews.value.length) return 0
  return currentPhaseReviews.value.reduce((sum, r) => sum + (r.rating || 0), 0) / currentPhaseReviews.value.length
})

// ?? 紐⑥엫 湲곕줉 ?????????????????????????????????????????????????????
const meetings = ref([])
const loadingMeetings = ref(false)

// ?? 異붿쿇???됰꽕????????????????????????????????????????????????????
const recommenderNickname = computed(() => {
  if (!cycle.value?.commonBookRecommenderUid) return null
  const p = participants.value.find(p => p.uid === cycle.value.commonBookRecommenderUid)
  return p?.nickname || null
})

// ?? ??蹂??곗씠??濡쒕뵫 ?????????????????????????????????????????????
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
    // ?섏씠利덈퀎 由щ물 議고쉶: Phase 1?먯꽌??由щ물媛 Phase 2???ㅺ??ㅼ? ?딅룄濡?
    const currentPhaseKey = cycle.value.phase === 'phase2_reading' ? 'phase2' : 'phase1'
    myReview.value = await fetchMyReview(cycle.value.id, currentPhaseKey)
  }
}

onMounted(async () => {
  cycle.value = await fetchActiveCycle()
  loadingCycle.value = false
  await loadTabData()
})

// ?? 留덉뒪?? ?ъ씠???앹꽦 ???????????????????????????????????????????
const newCycle = ref({ keyword: '', description: '', heroImageUrl: '', phase1Start: '', phase1End: '', phase2Start: '', phase2End: '' })
const creatingCycle = ref(false)
const handleCreateCycle = async () => {
  if (!newCycle.value.keyword.trim()) { alert('?ㅼ썙?쒕? ?낅젰?댁＜?몄슂.'); return }
  creatingCycle.value = true
  try {
    await createCycle(newCycle.value)
    cycle.value = await fetchActiveCycle()
    await loadTabData()
  } catch (err) { alert('?ъ씠???앹꽦 ?ㅽ뙣: ' + err.message) }
  finally { creatingCycle.value = false }
}

// ?? 留덉뒪?? Phase 蹂寃?????????????????????????????????????????????
const PHASE_DESCRIPTIONS = {
  voting: {
    title: '怨듯넻 ?꾩꽌 ?ы몴 ?ㅽ뵂',
    desc: '1?뚯감 媛쒕퀎 ?낆꽌瑜?留덉튂怨??ы몴瑜??쒖옉?⑸땲??\n硫ㅻ쾭?ㅼ? ?ㅼ쓬 ???④퍡 ?쎄퀬 ?띠? 梨낆쓣 ?좏깮?????덉뒿?덈떎.\n\n怨꾩냽?섏떆寃좎뒿?덇퉴?',
  },
  closed: {
    title: '?ъ씠??醫낅즺',
    desc: '?꾩옱 ?ъ씠?댁쓣 ?꾩쟾??醫낅즺?⑸땲??\n醫낅즺 ?꾩뿉???곹깭瑜??섎룎由????놁뒿?덈떎.\n\n?뺣쭚 醫낅즺?섏떆寃좎뒿?덇퉴?',
  },
}
const changePhase = async (phase) => {
  const info = PHASE_DESCRIPTIONS[phase]
  const msg = info ? `[ ${info.title} ]\n\n${info.desc}` : `Phase瑜?"${phase}"濡?蹂寃쏀븯?쒓쿋?듬땲源?`
  if (!confirm(msg)) return
  await updateCyclePhase(cycle.value.id, phase)
  cycle.value = await fetchActiveCycle()
}

// 留덉뒪?곌? 吏곸젒 ?좏깮??uid
const masterSelectedUid = ref('')

const handleConfirmCommonBook = async () => {
  if (!masterSelectedUid.value) { alert('怨듯넻 ?꾩꽌濡??뺤젙??梨낆쓣 ?좏깮?댁＜?몄슂.'); return }
  const selected = participants.value.find(p => p.uid === masterSelectedUid.value)
  if (!selected) return
  if (!confirm(`[ 怨듯넻 ?꾩꽌 ?뺤젙 ]\n\n"${selected.book?.title}"\n(異붿쿇?? @${selected.nickname})???대떖??怨듯넻 ?덈줈 ?뺤젙?섍퀬 2?뚯감瑜??쒖옉?섏떆寃좎뒿?덇퉴?`)) return
  await updateCyclePhase(cycle.value.id, 'phase2_reading', {
    commonBook: selected.book,
    commonBookRecommenderUid: selected.uid,
  })
  masterSelectedUid.value = ''
  cycle.value = await fetchActiveCycle()
  await loadTabData()
}

// ?? 梨??깅줉 ???????????????????????????????????????????????????????
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
    const isFreeBook = cycle.value?.phase === 'phase2_reading'
      && cycle.value?.commonBookRecommenderUid === authStore.user?.uid

    await registerBook(cycle.value.id, {
      title: selectedBook.value.title,
      authors: selectedBook.value.authors,
      publisher: selectedBook.value.publisher,
      thumbnail: selectedBook.value.thumbnail,
      url: selectedBook.value.url,
      isbn: selectedBook.value.isbn,
    }, bookRegisterReason.value.trim(), isFreeBook)

    bookRegisterModal.value = false
    myParticipation.value = await fetchMyParticipation(cycle.value.id)
    participants.value = await fetchParticipants(cycle.value.id)
  } catch (err) { registerError.value = err.message || '?깅줉 ?ㅽ뙣' }
  finally { registeringBook.value = false }
}

// ?? ?ы몴 ??????????????????????????????????????????????????????????
const handleVote = async (targetUid) => {
  if (!authStore.user) { alert('濡쒓렇?몄씠 ?꾩슂?⑸땲??'); return }
  if (!confirm('??梨낆뿉 ?ы몴?섏떆寃좎뒿?덇퉴? ?ы몴????踰덈쭔 媛?ν빀?덈떎.')) return
  try {
    await castVote(cycle.value.id, targetUid)
    myVote.value = { targetUid }
    participants.value = await fetchParticipants(cycle.value.id)
  } catch (err) { alert('?ы몴 ?ㅽ뙣: ' + err.message) }
}

// ?? 由щ럭 ?묒꽦 ?????????????????????????????????????????????????????
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
  if (!reviewRating.value) { reviewError.value = '蹂꾩젏???좏깮?댁＜?몄슂.'; return }
  if (!reviewContent.value.trim()) { reviewError.value = '由щ럭 ?댁슜???낅젰?댁＜?몄슂.'; return }
  reviewError.value = ''
  submittingReview.value = true
  try {
    const phase = cycle.value.phase === 'phase2_reading' ? 'phase2' : 'phase1'
    await submitReview(cycle.value.id, reviewRating.value, reviewContent.value.trim(), phase)
    reviewModal.value = false
    myReview.value = { rating: reviewRating.value, content: reviewContent.value }
    reviews.value = await fetchReviews(cycle.value.id)
  } catch (err) { reviewError.value = err.message || '由щ럭 ?깅줉 ?ㅽ뙣' }
  finally { submittingReview.value = false }
}

// ?? 紐⑥엫 湲곕줉 (?⑥씪 臾몄꽌, ?섏젙 媛?? ?????????????????????????????
const masterMeetingModal = ref(false)
const meetingTitle = ref('')
const meetingContent = ref('')
const savingMeeting = ref(false)

// 湲곗〈 湲곕줉???덉쑝硫??섏젙 紐⑤뱶濡?紐⑤떖 ?닿린
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
      // 湲곗〈 湲곕줉 ?섏젙
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
      // ?좉퇋 ?묒꽦
      await addMeetingRecord(cycle.value.id, meetingTitle.value.trim(), meetingContent.value.trim(), currentPhaseKey.value)
    }
    masterMeetingModal.value = false
    meetings.value = await fetchMeetingRecords(cycle.value.id)
    activeTab.value = 'history'
  } catch (err) { alert('湲곕줉 ????ㅽ뙣: ' + (err?.message || err)) }
  finally { savingMeeting.value = false }
}

// ?? ?좎쭨 ?좏떥 ?????????????????????????????????????????????????????
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
  if (diffMin < 1) return '諛⑷툑 ??
  if (diffMin < 60) return `${diffMin}遺???
  if (diffHour < 24) return `${diffHour}?쒓컙 ??
  if (diffDay < 7) return `${diffDay}????
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${m}.${d}`
}
</script>

<style scoped>
/* ?? ?덉뼱濡?諛곕꼫 ???????????????????????????? */
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

/* ?? Action Box ?????????????????????????????? */
.action-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media (min-width: 600px) { flex-direction: row; align-items: center; justify-content: space-between; }
}
.action-box__text { display: flex; align-items: flex-start; gap: 12px; }
.action-box__icon { font-size: 1.6rem; flex-shrink: 0; margin-top: 2px; }

/* ?? 異붿쿇???밴텒 ??????????????????????????? */
.recommender-privilege {
  border: 2px solid #FFB300 !important;
  background: linear-gradient(135deg, #FFF8E1, #FFFDE7) !important;
}

/* ?? 留덉뒪???⑤꼸 ??????????????????????????? */
.master-panel {
  border: 2px solid #FFD54F !important;
  background: #FFFDE7 !important;
}

/* ?? 李몄뿬 ?꾪솴 洹몃━???????????????????????? */
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

/* ?? 梨??깅줉 紐⑤떖 ?????????????????????????? */
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

/* ?? util ????????????????????????????????? */
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

/* ?? 留덉뒪??梨??좏깮 由ъ뒪?????????????????????? */
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

/* ?? 留덉뒪??由щ럭 ?꾪솴 ???????????????????????? */
.master-review-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.master-review-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 8px;
  &:hover { background: rgba(0,0,0,0.03); }
}
.chip--green { background: #E8F5E9 !important; color: #2E7D32 !important; }

/* ?? Phase 2 \uacf5\ud1b5\ub3c8 \ud2b9\uc9d1 \uce74\ub4dc ???????????????? */
.phase2-book-featured {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #E3F2FD, #F3E5F5);
  border-radius: 16px;
  border: 2px solid rgba(30,136,229,0.15);
}
.phase2-book-badge {
  position: absolute;
  top: -10px;
  left: 16px;
  background: #FFB300;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 2px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.phase2-book-thumb {
  width: 80px;
  height: 115px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}
.phase2-book-info {
  flex: 1;
  min-width: 0;
}



</style>
