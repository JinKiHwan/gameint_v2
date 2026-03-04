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
          <div class="d-flex align-center">
            <v-avatar color="grey-lighten-3" border size="40">
              <span class="text-caption font-weight-bold text-grey-darken-1">GI</span>
            </v-avatar>
            <div class="ml-3 d-flex flex-column">
              <span class="text-subtitle-2 font-weight-bold">안티그래비티</span>
              <span class="text-caption font-weight-bold text-blue-darken-1">Bronze Reader</span>
            </div>
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
        <v-btn icon="mdi-bell-outline" variant="text" color="grey-darken-2"></v-btn>
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
const navigation = [
  { id: 'home', label: '홈', icon: 'mdi-home-variant', to: '/' },
  { id: 'monthly', label: '월간 주제', icon: 'mdi-book-open-page-variant', to: '/cycles' },
  { id: 'recommend', label: '도서 추천', icon: 'mdi-bookshelf', to: '/recommend' },
  { id: 'board', label: '자유 게시판', icon: 'mdi-forum', to: '/board' },
  // { id: 'ranking', label: '랭킹', icon: 'mdi-trophy', to: '/ranking' },
  // { id: 'mypage', label: '마이페이지', icon: 'mdi-account', to: '/mypage' },
]
</script>


