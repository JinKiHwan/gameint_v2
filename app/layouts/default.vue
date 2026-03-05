<template>
  <div>
    <!-- 사이드바 (데스크톱) -->
    <aside class="sidebar">
      <div class="sidebar__logo">
        <i class="mdi mdi-book-open-page-variant logo-icon"></i>
        <span class="logo-text">Game Int</span>
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
        <div v-if="authStore.user" class="sidebar__user">
          <div class="user-info">
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
        <i class="mdi mdi-book-open-page-variant logo-icon"></i>
        <span class="logo-text">Game Int</span>
        <div class="spacer"></div>
        <button class="btn btn--text btn--icon mr-2">
          <i class="mdi mdi-bell-outline"></i>
        </button>

        <div v-if="authStore.user" class="mobile-menu" ref="mobileMenuRef">
          <div class="avatar avatar--sm cursor-pointer" @click="mobileMenuOpen = !mobileMenuOpen">
            <img :src="getProfileImagePath(authStore.userData?.profileImageId)" alt="프로필" />
          </div>
          <div v-if="mobileMenuOpen" class="mobile-dropdown">
            <button class="mobile-dropdown__item" @click="handleLogout; mobileMenuOpen = false">
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
        <div class="search-box">
          <i class="mdi mdi-magnify"></i>
          <input type="text" placeholder="어떤 모임을 찾으시나요?" />
        </div>
        <button class="btn btn--text btn--icon">
          <i class="mdi mdi-bell-outline"></i>
        </button>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="page-main">
      <div class="container">
        <slot />
      </div>
    </main>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { getProfileImagePath } from '~/composables/useProfileImages'

const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
}

const isPendingUser = computed(() => {
  return authStore.user && authStore.userData?.status === 'pending'
})

const navigation = [
  { id: 'home',      label: '홈',       icon: 'mdi-home-variant',          to: '/' },
  { id: 'monthly',   label: '월간 주제',  icon: 'mdi-book-open-page-variant', to: '/cycles' },
  { id: 'recommend', label: '도서 추천',  icon: 'mdi-bookshelf',              to: '/recommend' },
  { id: 'board',     label: '통합 게시판', icon: 'mdi-forum',                 to: '/board' },
  { id: 'mypage',    label: '마이페이지', icon: 'mdi-account',               to: '/mypage' },
]

// 모바일 드롭다운
const mobileMenuOpen = ref(false)
const mobileMenuRef = ref(null)

const handleClickOutside = (e) => {
  if (mobileMenuRef.value && !mobileMenuRef.value.contains(e.target)) {
    mobileMenuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
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
</style>
