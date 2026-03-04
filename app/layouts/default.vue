<template>
  <v-app class="bg-grey-lighten-4">
    <!-- 사이드바 (데스크톱) -->
    <v-navigation-drawer 
      permanent 
      elevation="0" 
      border="end"
      class="d-none d-md-flex bg-white"
      width="260"
    >
      <div class="d-flex align-center px-6 py-4 border-b">
        <v-icon color="blue-darken-1" size="28" class="mr-2">mdi-book-open-page-variant</v-icon>
        <span class="text-h6 font-weight-black text-grey-darken-4">Game Int</span>
      </div>

      <v-list class="px-3 py-4" nav>
        <v-list-item
          v-for="item in navigation"
          :key="item.id"
          :to="item.to"
          active-class="text-blue-darken-1 bg-blue-lighten-5"
          class="rounded-xl mb-1 font-weight-bold text-grey-darken-2"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon"></v-icon>
          </template>
          <v-list-item-title>
            {{ item.label }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4 border-t bg-grey-lighten-5">
          <div v-if="authStore.user" class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center cursor-pointer hover-bg-grey rounded pa-1" style="min-width: 0;">
              <v-avatar color="blue-lighten-5" border size="40" class="flex-shrink-0">
                <span class="text-caption font-weight-bold text-blue-darken-1">
                  {{ authStore.userData?.nickname?.charAt(0) || 'U' }}
                </span>
              </v-avatar>
              <div class="ml-3 d-flex flex-column text-truncate mr-2">
                <span class="text-subtitle-2 font-weight-bold text-truncate">{{ authStore.userData?.nickname || '신규회원' }}</span>
                <span class="text-caption font-weight-bold text-blue-darken-1">{{ authStore.userData?.tier || 'Bronze' }}</span>
              </div>
            </div>
            <v-btn icon="mdi-logout" variant="text" size="small" color="grey-darken-2" @click="handleLogout"></v-btn>
          </div>
          <div v-else class="text-center">
            <v-btn color="blue-darken-1" variant="flat" block rounded="lg" to="/login">로그인</v-btn>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- 상단 앱 바 (모바일 헤더 & 데스크톱 검색창) -->
    <v-app-bar elevation="0" border="bottom" color="white" height="64">
      <!-- 모바일 뷰 -->
      <div class="d-flex d-md-none align-center w-100 px-4">
        <v-icon color="blue-darken-1" size="24" class="mr-2">mdi-book-open-page-variant</v-icon>
        <span class="text-subtitle-1 font-weight-black">Game Int</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-bell-outline" variant="text" color="grey-darken-2" class="mr-1"></v-btn>
        
        <v-menu v-if="authStore.user" location="bottom end">
          <template v-slot:activator="{ props }">
            <v-avatar v-bind="props" color="blue-lighten-5" border size="32" class="cursor-pointer">
              <span class="text-caption font-weight-bold text-blue-darken-1">{{ authStore.userData?.nickname?.charAt(0) || 'U' }}</span>
            </v-avatar>
          </template>
          <v-list class="pa-2 rounded-lg" elevation="3">
            <v-list-item @click="handleLogout" prepend-icon="mdi-logout" class="rounded-lg hover-bg-grey">
              <v-list-item-title class="font-weight-bold text-grey-darken-3">로그아웃</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn v-else icon="mdi-login" variant="text" color="blue-darken-1" to="/login"></v-btn>
      </div>

      <!-- 데스크톱 뷰 -->
      <div class="d-none d-md-flex align-center justify-end w-100 px-8">
        <v-text-field
          prepend-inner-icon="mdi-magnify"
          placeholder="어떤 모임을 찾으시나요?"
          variant="solo-filled"
          flat
          bg-color="grey-lighten-4"
          density="compact"
          hide-details
          class="mr-4 rounded-xl"
          style="max-width: 300px;"
        ></v-text-field>
        <v-btn icon="mdi-bell-outline" variant="text" color="grey-darken-2"></v-btn>
      </div>
    </v-app-bar>

    <!-- 메인 콘텐츠 영역 -->
    <v-main>
      <v-container class="pa-4 pa-md-8 pb-16 pb-md-8" max-width="1000">
        <slot />
      </v-container>
    </v-main>

    <!-- 모바일 하단 네비게이션 -->
    <v-bottom-navigation class="d-md-none bg-white font-weight-bold" grow elevation="4">
      <v-btn v-for="item in navigation.slice(0, 5)" :key="item.id" :to="item.to" color="blue-darken-1">
        <v-icon>{{ item.icon }}</v-icon>
        <span>{{ item.label }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
}

const navigation = [
  { id: 'home', label: '홈', icon: 'mdi-home-variant', to: '/' },
  { id: 'monthly', label: '월간 주제', icon: 'mdi-book-open-page-variant', to: '/cycles' },
  { id: 'recommend', label: '도서 추천', icon: 'mdi-bookshelf', to: '/recommend' },
  { id: 'board', label: '자유 게시판', icon: 'mdi-forum', to: '/board' },
  // { id: 'ranking', label: '랭킹', icon: 'mdi-trophy', to: '/ranking' },
  { id: 'mypage', label: '마이페이지', icon: 'mdi-account', to: '/mypage' },
]
</script>


