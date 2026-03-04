<template>
  <div class="fade-in">
    <v-card class="rounded-xl overflow-hidden mb-6" elevation="0" border>
       <v-img 
        src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2070&auto=format&fit=crop" 
        cover 
        height="300"
        class="align-end"
        gradient="to top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.2)"
      >
        <v-card-text class="pa-6 pa-md-10">
          <v-chip color="blue-darken-1" variant="flat" size="small" class="font-weight-bold mb-3">24년 4월 ~ 5월</v-chip>
          <h1 class="text-h4 text-md-h3 font-weight-black text-white mb-2">기술의 발전과 인간의 윤리</h1>
          <div class="d-flex align-center text-body-2 font-weight-medium text-grey-lighten-2 mt-4">
            <v-icon size="small" class="mr-1">mdi-calendar</v-icon> <span class="mr-4">04.01 ~ 05.31</span>
            <v-icon size="small" class="mr-1">mdi-map-marker</v-icon> <span>온라인/오프라인</span>
          </div>
        </v-card-text>
      </v-img>
    </v-card>

    <v-card class="rounded-xl pa-6 mb-8 border d-flex flex-column flex-md-row align-md-center justify-space-between bg-white" elevation="0">
      <p class="text-body-2 text-md-body-1 font-weight-medium text-grey-darken-2 flex-grow-1 pr-md-6 mb-4 mb-md-0 line-height-relaxed">
        빠르게 발전하는 AI와 생명공학 기술 속에서 우리는 무엇을 잃고 무엇을 얻게 될까요? 
        관련된 도서를 자유롭게 읽고 인사이트를 나누어 봅시다.
      </p>
      <div class="d-flex align-center flex-shrink-0 w-100 w-md-auto">
        <div class="text-right d-none d-md-block mr-4">
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-4">참여자 42명</div>
          <div class="text-caption font-weight-bold text-blue-darken-1">지금 바로 합류하세요!</div>
        </div>
        <v-btn color="blue-darken-1" class="rounded-lg flex-grow-1 flex-md-grow-0" size="large" variant="flat">
          도서 등록하고 참여하기
        </v-btn>
      </div>
    </v-card>

    <!-- 서브 탭 (Vuetify 3.5 Tabs-Window) -->
    <v-tabs v-model="monthlyTab" color="blue-darken-1" align-tabs="start" class="mb-6 border-b">
      <v-tab value="books" class="font-weight-bold text-subtitle-2">독서 중인 도서</v-tab>
      <v-tab value="reviews" class="font-weight-bold text-subtitle-2">주제 리뷰</v-tab>
      <v-tab value="stats" class="font-weight-bold text-subtitle-2">참여 통계</v-tab>
      <v-tab value="meeting" class="font-weight-bold text-subtitle-2">모임 기록</v-tab>
    </v-tabs>

    <v-tabs-window v-model="monthlyTab">
      <v-tabs-window-item value="books">
        <div class="d-flex justify-space-between align-center mb-6 mt-2">
          <h3 class="text-h6 font-weight-black text-grey-darken-4">📚 멤버들이 읽고 있는 책</h3>
        </div>
        <v-row>
          <v-col v-for="i in 6" :key="i" cols="6" sm="4" md="3">
            <v-card class="rounded-xl border d-flex flex-column h-100 hover-shadow bg-white" elevation="0">
              <v-img src="https://images.unsplash.com/photo-1550399105-c4db5fb85c18?q=80&w=2071&auto=format&fit=crop" height="180" cover class="align-end" gradient="to top, rgba(0,0,0,0.8), rgba(0,0,0,0)">
                <v-card-title class="text-white text-subtitle-2 font-weight-black pb-1 line-clamp-1">인공지능의 시대</v-card-title>
                <v-card-subtitle class="text-grey-lighten-2 text-caption font-weight-medium pb-2">제리 카플란</v-card-subtitle>
              </v-img>
              <v-card-text class="pa-4">
                <div class="d-flex align-center mb-3">
                  <v-avatar size="24" color="grey-lighten-2" class="mr-2"><span class="text-caption font-weight-bold">U</span></v-avatar>
                  <span class="text-caption font-weight-bold text-grey-darken-2">독서왕</span>
                </div>
                <v-sheet color="grey-lighten-4" class="pa-3 rounded-lg text-caption text-grey-darken-2 line-clamp-2">
                  "기술 발전의 속도를 인류가 어떻게 감당해야 할지에 대한 고찰."
                </v-sheet>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>
      
      <v-tabs-window-item value="reviews">
        <div class="pa-10 text-center text-grey-darken-1 font-weight-bold">주제 리뷰가 곧 업데이트 됩니다.</div>
      </v-tabs-window-item>
      <v-tabs-window-item value="stats">
        <div class="pa-10 text-center text-grey-darken-1 font-weight-bold">참여 통계가 곧 업데이트 됩니다.</div>
      </v-tabs-window-item>
      <v-tabs-window-item value="meeting">
        <div class="pa-10 text-center text-grey-darken-1 font-weight-bold">모임 기록이 곧 업데이트 됩니다.</div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const monthlyTab = ref('books');
</script>
