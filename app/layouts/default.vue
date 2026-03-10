<template>
  <div>
    <!-- 사이드바 (데스크톱) -->
    <aside class="sidebar">
    <div class="sidebar__logo">
      <NuxtLink to="/" style="text-decoration:none; color:inherit; display:flex; align-items:center; gap:8px;">
        <span class="logo-text">GAMEINT</span>
      </NuxtLink>
    </div>

      <nav class="sidebar__nav">
        <NuxtLink
          v-for="item in navigation"
          :key="item.id"
          :to="item.to"
          class="sidebar__nav-item"
          active-class="is-active"
          exact-active-class="is-active"
        >
          <i :class="`mdi ${item.icon}`"></i>
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="sidebar__footer">
        <div v-if="authStore.user" class="sidebar__user" ref="profileDropdownRef">
          <div class="user-info" style="text-decoration:none; color:inherit; cursor:pointer;" @click="profileDropdown = !profileDropdown">
            <div class="avatar avatar--md">
              <img :src="getProfileImagePath(authStore.userData?.profileImageId)" alt="프로필" />
            </div>
            <div class="user-text">
              <span class="user-name">{{ authStore.userData?.nickname || '신규회원' }}</span>
              <span class="user-tier">{{ authStore.userData?.tier || 'Bronze' }}</span>
            </div>
          </div>
          <button class="btn btn--text btn--icon" @click="handleLogout" title="로그아웃">
            <i class="mdi mdi-logout"></i>
          </button>
          <div v-if="profileDropdown" class="profile-dropdown">
              <div class="dropdown-header">
                <div class="font-black text-grey-dark">{{ authStore.userData?.nickname }}</div>
                <div class="text-caption text-grey-2">{{ authStore.userData?.email }}</div>
              </div>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" @click="handleNav('/mypage')">
                <i class="mdi mdi-account-circle-outline"></i> 마이페이지
              </button>
              <button class="dropdown-item" @click="handleNav('/ranking')">
                <i class="mdi mdi-trophy-variant-outline"></i> 명예의 전당
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item text-red" @click="handleLogout">
                <i class="mdi mdi-logout"></i> 로그아웃
              </button>
            </div>
        </div>
        <div v-else class="text-center">
          <NuxtLink to="/login" class="btn btn--primary btn--block">로그인</NuxtLink>
        </div>
      </div>
    </aside>

    <!-- 앱 바 -->
    <header class="app-bar">
      <!-- 모바일 -->
      <div class="app-bar__mobile">
        <NuxtLink to="/" style="text-decoration:none; color:inherit; display:flex; align-items:center;">
          <span class="logo-text">GAMEINT</span>
        </NuxtLink>
        <div class="spacer"></div>

        <div v-if="authStore.user" class="mobile-menu flex items-center gap-2" ref="mobileMenuRef">
          <div class="avatar avatar--sm cursor-pointer" @click="mobileMenuOpen = !mobileMenuOpen">
            <img :src="getProfileImagePath(authStore.userData?.profileImageId)" alt="프로필" />
          </div>

          <!-- 모바일 알림 (간소화) -->
          <div class="notification-wrap ml-2" ref="notiMenuMobileRef">
            <button class="btn btn--text btn--icon mobile-noti-btn" @click.stop="toggleNotification">
              <i class="mdi mdi-bell-outline"></i>
              <span v-if="notificationStore.unreadCount > 0" class="notification-badge">{{ notificationStore.unreadCount }}</span>
            </button>

            <!-- 모바일 알림 드롭다운 -->
            <div v-if="notiMenuOpen" class="notification-dropdown">
              <div class="noti-header">
                <span class="noti-title">알림</span>
                <div class="flex gap-2">
                  <button class="noti-header-btn" @click="notificationStore.markAllAsRead()">모두 읽음</button>
                  <button class="noti-header-btn" @click="notificationStore.clearAll()">전체 삭제</button>
                </div>
              </div>
              <div class="noti-body custom-scroll">
                <div v-if="notificationStore.notifications.length === 0" class="noti-empty">
                  새로운 알림이 없습니다.
                </div>
                <div 
                  v-for="noti in notificationStore.notifications" 
                  :key="noti.id" 
                  class="noti-item"
                  :class="{ 'is-unread': !noti.isRead }"
                  @click="handleNotiClick(noti)"
                >
                  <div class="noti-icon" :class="noti.type.toLowerCase()">
                     <i :class="getNotiIcon(noti.type)"></i>
                  </div>
                  <div class="noti-content">
                    <div class="noti-item-title">{{ noti.title }}</div>
                    <div class="noti-item-msg">{{ noti.message }}</div>
                    <div class="noti-item-time">{{ formatTime(noti.createdAt) }}</div>
                  </div>
                  <button class="noti-delete-btn" @click.stop="notificationStore.deleteNotification(noti.id)">
                    <i class="mdi mdi-close"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="mobileMenuOpen" class="mobile-dropdown">
            <button class="mobile-dropdown__item" @click="handleNav('/mypage')">
              <i class="mdi mdi-account-circle-outline"></i> 마이페이지
            </button>
            <button class="mobile-dropdown__item" @click="handleLogout(); mobileMenuOpen = false">
              <i class="mdi mdi-logout"></i> 로그아웃
            </button>
          </div>
        </div>
        <NuxtLink v-else to="/login" class="btn btn--text btn--icon">
          <i class="mdi mdi-login"></i>
        </NuxtLink>
      </div>

      <!-- 데스크톱 -->
      <div class="app-bar__desktop">
        <div class="spacer"></div>

        <!-- 알림 벨 -->
        <div class="notification-wrap" ref="notiMenuRef">
          <button class="btn btn--text btn--icon" @click.stop="toggleNotification">
            <i class="mdi mdi-bell-outline"></i>
            <span v-if="notificationStore.unreadCount > 0" class="notification-badge">{{ notificationStore.unreadCount }}</span>
          </button>

          <!-- 알림 드롭다운 -->
          <div v-if="notiMenuOpen" class="notification-dropdown">
            <div class="noti-header">
              <span class="noti-title">알림</span>
              <div class="flex gap-2">
                <button class="noti-header-btn" @click="notificationStore.markAllAsRead()">모두 읽음</button>
                <button class="noti-header-btn" @click="notificationStore.clearAll()">전체 삭제</button>
              </div>
            </div>
            <div class="noti-body custom-scroll">
              <div v-if="notificationStore.notifications.length === 0" class="noti-empty">
                새로운 알림이 없습니다.
              </div>
              <div 
                v-for="noti in notificationStore.notifications" 
                :key="noti.id" 
                class="noti-item"
                :class="{ 'is-unread': !noti.isRead }"
                @click="handleNotiClick(noti)"
              >
                <div class="noti-icon" :class="noti.type.toLowerCase()">
                   <i :class="getNotiIcon(noti.type)"></i>
                </div>
                <div class="noti-content">
                  <div class="noti-item-title">{{ noti.title }}</div>
                  <div class="noti-item-msg">{{ noti.message }}</div>
                  <div class="noti-item-time">{{ formatTime(noti.createdAt) }}</div>
                </div>
                <button class="noti-delete-btn" @click.stop="notificationStore.deleteNotification(noti.id)">
                  <i class="mdi mdi-close"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="page-main">
      <div class="container">
        <slot />
      </div>
    </main>

    <!-- PWA 설치 유도 배너 (PWA 환경이 아닐 때만 노출) -->
    <div v-if="showInstallBanner" class="pwa-banner" :class="{ 'is-ios': isIOS }">
      <div class="pwa-banner__content">
        <div class="pwa-banner__icon">
          <img :src="'/icon-192.png'" alt="App Icon" />
        </div>
        <div class="pwa-banner__text">
          <div class="pwa-banner__title">GAMEINT 앱 설치</div>
          <div class="pwa-banner__desc">
            <template v-if="isIOS">
              공유 버튼 <i class="mdi mdi-export-variant"></i> 누르고 <strong>'홈 화면에 추가'</strong>를 선택해 주세요!
            </template>
            <template v-else>
              바탕화면에 설치하고 더 편하게 즐겨보세요!
            </template>
          </div>
        </div>
        <div class="pwa-banner__actions">
          <button v-if="!isIOS" class="btn btn--primary btn--sm" @click="installApp">설치하기</button>
          <button class="btn btn--text btn--icon pwa-banner__close" @click="closeBanner">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 모바일 하단 네비게이션 -->
    <nav class="bottom-nav">
      <NuxtLink
        v-for="item in navigation.slice(0, 5)"
        :key="item.id"
        :to="item.to"
        class="bottom-nav__item"
        active-class="is-active"
        exact-active-class="is-active"
      >
        <i :class="`mdi ${item.icon}`"></i>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- 승인 대기 유저 안내 -->
    <div v-if="isPendingUser" class="pending-overlay">
      <div class="card" style="max-width: 400px; width: 100%; text-align: center; padding: 32px;">
        <i class="mdi mdi-account-clock-outline" style="font-size: 4rem; color: #F57C00; display: block; margin-bottom: 16px;"></i>
        <h2 class="text-h5 font-black text-grey-dark mb-3">승인 대기 중입니다</h2>
        <p class="text-subtitle-2 text-grey-2 mb-8 line-height-relaxed">
          마스터(관리자)의 가입 승인이 완료되면<br/>모든 서비스를 정상적으로 이용하실 수 있습니다.
        </p>
        <button class="btn btn--dark btn--lg" @click="handleLogout">로그아웃</button>
      </div>
    </div>

    <!-- ===== 레벨업 축하 모달 (전역) ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="levelUpModal" class="modal-overlay" style="z-index:9999; background: rgba(0,0,0,0.8);" @click="levelUpModal = false">
          <div class="modal level-up-modal text-center pa-10" style="background: linear-gradient(135deg, #1A237E 0%, #0D47A1 100%); color:white; border:none; overflow:visible; max-width:400px; width:90%;">
            <div class="level-up-crown">👑</div>
            <h2 class="text-h4 font-black mb-2" style="color:#FFD54F; text-shadow: 0 4px 8px rgba(0,0,0,0.3);">LEVEL UP!</h2>
            <p class="text-body-1 font-bold mb-6" style="opacity:0.9;">축하합니다! 새로운 단계에 도달하셨습니다.</p>
            
            <div class="flex justify-center items-center gap-6 mb-8">
              <div class="lv-badge-old">{{ authStore.userData?.level - 1 }}</div>
              <i class="mdi mdi-chevron-double-right text-h4" style="color:#FFD54F;"></i>
              <div class="lv-badge-new">{{ authStore.userData?.level }}</div>
            </div>

            <div v-if="tierChanged" class="tier-up-box mb-8">
              <span class="chip chip--amber mb-2" style="background:#FFC107; color:black;">Tier Up!</span>
              <h3 class="text-h5 font-black">{{ authStore.userData?.tier }}</h3>
            </div>

            <button class="btn btn--primary btn--lg rounded-sm w-full font-black" style="background:#FFD54F; color:#1A237E;" @click="levelUpModal = false">닫기</button>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useNotificationStore } from '~/stores/notifications'
import { getProfileImagePath } from '~/composables/useProfileImages'
import { useRouter } from 'vue-router'
import { EXP_CONFIG } from '~/utils/expConfig'
import { usePWAInstall } from '~/composables/usePWAInstall'

const { isInstallable, isPWA, isIOS, showInstallBanner, installApp, closeBanner } = usePWAInstall()

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const usersStore = useUsersStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  profileDropdown.value = false
  mobileMenuOpen.value = false
  router.push('/')
}

const handleNav = (path) => {
  router.push(path)
  profileDropdown.value = false
  mobileMenuOpen.value = false
}

const isPendingUser = computed(() => {
  return authStore.user && authStore.userData?.status === 'pending'
})

const navigation = [
  { id: 'home',      label: '홈',       icon: 'mdi-home-variant',          to: '/' },
  { id: 'cycles',    label: '월간 주제',  icon: 'mdi-calendar-check',        to: '/cycles' },
  { id: 'recommend', label: '도서 추천',  icon: 'mdi-bookshelf',              to: '/recommend' },
  { id: 'board',     label: '통합 게시판', icon: 'mdi-bulletin-board',       to: '/board' },
  { id: 'ranking',   label: '랭킹',      icon: 'mdi-trophy',                to: '/ranking' },
  { id: 'mypage',    label: '마이페이지', icon: 'mdi-account',               to: '/mypage' },
]

// 모바일 메뉴
const mobileMenuOpen = ref(false)
const mobileMenuRef = ref(null)

// 프로필 드롭다운
const profileDropdown = ref(false)
const profileDropdownRef = ref(null)

// 알림 드롭다운
const notiMenuOpen = ref(false)
const notiMenuRef = ref(null)
const notiMenuMobileRef = ref(null)

const toggleNotification = () => {
  notiMenuOpen.value = !notiMenuOpen.value
}

const handleNotiClick = async (noti) => {
  await notificationStore.markAsRead(noti.id)
  if (noti.link) {
    // 티어 상승 등 동적으로 링크가 바뀔 수 있으므로 재확인
    router.push(noti.link)
    notiMenuOpen.value = false
  }
}

const getNotiIcon = (type) => {
  switch (type) {
    case 'LIKE': return 'mdi-heart'
    case 'COMMENT': return 'mdi-comment-text'
    case 'TIER_UP': return 'mdi-trophy-variant'
    case 'CYCLE_PHASE': return 'mdi-calendar-clock'
    default: return 'mdi-bell'
  }
}

const formatTime = (createdAt) => {
  if (!createdAt) return ''
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '방금 전'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const handleClickOutside = (e) => {
  // 모바일 사이드바 메뉴 닫기
  if (mobileMenuRef.value && !mobileMenuRef.value.contains(e.target)) {
    // 햄버거 버튼 자체 클릭 시에는 여기서 닫지 않음 (toggleMobileMenu에서 처리)
    if (!e.target.closest('.mobile-menu-btn')) {
      mobileMenuOpen.value = false
    }
  }
  
  // 프로필 드롭다운 닫기
  if (profileDropdown.value && profileDropdownRef.value && !profileDropdownRef.value.contains(e.target)) {
    profileDropdown.value = false
  }
  
  // 알림 드롭다운 닫기
  if (notiMenuOpen.value) {
    const isInsidePC = notiMenuRef.value?.contains(e.target)
    const isInsideMobile = notiMenuMobileRef.value?.contains(e.target)
    
    if (!isInsidePC && !isInsideMobile) {
      notiMenuOpen.value = false
    }
  }
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 알림 초기화
  if (authStore.user) notificationStore.initNotifications()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  notificationStore.stopSubscriptions()
  usersStore.stopSubscriptions()
  if (authStore.unsubProfile) authStore.unsubProfile()
})

// 로그인 상태에 따른 알림/유저 구독 관리
watch(() => authStore.user, (user) => {
  if (user) {
    notificationStore.initNotifications()
    usersStore.initUsers()
  } else {
    notificationStore.stopSubscriptions()
    usersStore.stopSubscriptions()
  }
})

// ── 전역 레벨업 감시 ──
const levelUpModal = ref(false)
const tierChanged = ref(false)

watch(() => authStore.userData?.level, (newLevel, oldLevel) => {
  if (oldLevel && newLevel > oldLevel) {
    tierChanged.value = EXP_CONFIG.getTier(newLevel) !== EXP_CONFIG.getTier(oldLevel)
    levelUpModal.value = true
    // 자동 닫기 (8초 후)
    setTimeout(() => { levelUpModal.value = false }, 8000)
  }
})
</script>

<style lang="scss" scoped>
.mobile-menu { position: relative; }

.mobile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  padding: 8px;
  min-width: 140px;
  z-index: 200;

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 700;
    color: #424242;
    cursor: pointer;

    &:hover { background: #f5f5f5; }
  }
}

.mr-2 { margin-right: 8px; }
.ml-2 { margin-left: 8px; }

/* ── 알림 드롭다운 ────────────────────────────── */
.notification-wrap { position: relative; }
.notification-badge {
  position: absolute; top: -2px; right: -2px;
  background: #F44336; color: white;
  font-size: 0.7rem; font-weight: 800;
  min-width: 18px; height: 18px; 
  padding: 0 4px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.mobile-noti-btn {
  i { font-size: 1.6rem !important; }
}

.notification-dropdown {
  position: absolute; top: calc(100% + 12px); right: -10px;
  width: 320px; max-height: 480px;
  background: #fff; border: 1px solid #eee;
  border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; overflow: hidden;
  z-index: 1000;

  @media (max-width: 600px) {
    width: 280px;
    right: -20px;
  }
}

.noti-header {
  padding: 16px; border-bottom: 1px solid #f5f5f5;
  display: flex; justify-content: space-between; align-items: center;
}
.noti-title { font-size: 1rem; font-weight: 900; color: #212121; }
.noti-header-btn { 
  background: none; border: none; color: #757575; 
  font-size: 0.75rem; font-weight: 700; cursor: pointer;
  padding: 4px 8px; border-radius: 4px;
  &:hover { background: #f5f5f5; color: #1e88e5; }
}

.noti-body { flex: 1; overflow-y: auto; }
.noti-empty { padding: 40px 20px; text-align: center; color: #9e9e9e; font-size: 0.875rem; font-weight: 700; }

.noti-item {
  position: relative;
  display: flex; gap: 12px; padding: 14px 16px;
  border-bottom: 1px solid #fafafa; cursor: pointer;
  transition: background 0.2s;
  &:hover { 
    background: #f9f9f9; 
    .noti-delete-btn { opacity: 1; }
  }
  &.is-unread { background: #E3F2FD; }
}

.noti-delete-btn {
  position: absolute; top: 12px; right: 12px;
  width: 20px; height: 20px; border-radius: 50%;
  border: none; background: rgba(0,0,0,0.05);
  color: #757575; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; opacity: 0; transition: all 0.2s;
  &:hover { background: #ef5350; color: white; }
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border: 1px solid rgba(0,0,0,0.05);
  padding: 8px;
  z-index: 1000;
  animation: slide-up 0.2s ease-out;
}

.dropdown-header {
  padding: 12px 16px;
}

.dropdown-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 8px;
}

.dropdown-item {
  width: 100%;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: none;
  color: var(--text-grey-dark);
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  
  i {
    font-size: 1.2rem;
    color: var(--text-grey-2);
  }
  
  &:hover {
    background: #f5f5f5;
    color: var(--primary-color);
    i { color: var(--primary-color); }
  }
  
  &.text-red:hover {
    background: #fff5f5;
    color: #ef5350;
    i { color: #ef5350; }
  }
}

.mobile-dropdown {
  position: absolute;
  top: 100%;
  right: 16px;
  width: 180px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  padding: 8px;
  z-index: 1000;
  border: 1px solid rgba(0,0,0,0.05);
}

.mobile-dropdown__item {
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: none;
  color: var(--text-grey-dark);
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  
  i {
    font-size: 1.25rem;
    color: var(--text-grey-2);
  }
  
  &:hover {
    background: #f8f9fa;
  }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.noti-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 1.25rem;
  &.like { background: #FFEBEE; color: #E91E63; }
  &.comment { background: #E8F5E9; color: #43A047; }
  &.tier_up { background: #FFF8E1; color: #FFB300; }
  &.cycle_phase { background: #E1F5FE; color: #0288D1; }
}

.noti-content { flex: 1; min-width: 0; }
.noti-item-title { font-size: 0.9375rem; font-weight: 800; color: #212121; margin-bottom: 2px; }
.noti-item-msg { font-size: 0.8125rem; font-weight: 600; color: #616161; line-height: 1.4; }
.noti-item-time { font-size: 0.75rem; color: #9e9e9e; margin-top: 4px; font-weight: 700; }

.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

/* ── 레벨업 모달 전용 ────────────────────────── */
.level-up-modal { position:relative; overflow:visible; }
.level-up-crown { font-size: 4rem; position:absolute; top: -50px; left:50%; transform: translateX(-50%); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); animation: bounce 1s infinite; }
.lv-badge-old, .lv-badge-new {
  width: 60px; height: 60px; display:flex; align-items:center; justify-content:center;
  border-radius: 50%; font-size: 1.5rem; font-weight: 900; background:rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.2);
}
.lv-badge-new { background: #FFD54F; color: #1A237E; border-color: #FFD54F; transform: scale(1.2); box-shadow: 0 0 20px rgba(255,213,79,0.5); }
.tier-up-box { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
.pa-10 { padding: 40px; }

/* ── PWA 설치 배너 ────────────────────────────── */
.pwa-banner {
  position: fixed;
  bottom: 84px; /* 바텀바 바로 위 */
  left: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(30, 136, 229, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1001;
  padding: 12px 16px;
  animation: slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  @include md {
    display: none;
  }
}

.pwa-banner__content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pwa-banner__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background: #fff;
  img { width: 100%; height: 100%; object-fit: cover; }
}

.pwa-banner__text {
  flex: 1;
  min-width: 0;
}

.pwa-banner__title {
  font-size: 0.9rem;
  font-weight: 900;
  color: #212121;
}

.pwa-banner__desc {
  font-size: 0.75rem;
  color: #616161;
  line-height: 1.4;
  strong { color: #1E88E5; font-weight: 800; }
}

.pwa-banner__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pwa-banner__close {
  color: #9e9e9e !important;
  i { font-size: 1.2rem !important; }
}

.is-ios .pwa-banner__desc {
  font-size: 0.7rem; /* iOS 가이드는 텍스트가 기므로 조절 */
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-10px); } }
</style>
