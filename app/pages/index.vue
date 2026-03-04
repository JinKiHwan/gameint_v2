<template>
  <div class="fade-in">
    <!-- 상단 웰컴 & 티어 -->
    <div class="d-flex flex-column flex-md-row align-md-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-black text-grey-darken-4 mb-1">
          안티그래비티님, <br class="d-md-none"/>어떤 독서를 시작할까요? 👀
        </h1>
      </div>
      <v-card elevation="0" border class="rounded-xl px-4 py-2 mt-4 mt-md-0 d-flex align-center bg-white">
        <v-avatar color="amber-lighten-5" size="40" class="mr-3">
          <v-icon color="amber-darken-2">mdi-trophy</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-2 font-weight-bold">Bronze Reader</div>
          <div class="text-caption text-grey-darken-1">다음 등급까지 150 EXP</div>
        </div>
      </v-card>
    </div>

    <!-- 메인 히어로 배너 -->
    <v-card class="rounded-xl overflow-hidden mb-10 position-relative" elevation="2">
      <v-img 
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" 
        cover 
        height="350"
        class="align-center"
        gradient="to right, rgba(26, 35, 126, 0.95), rgba(40, 53, 147, 0.8)"
      >
        <v-card-text class="d-flex flex-column flex-md-row align-md-center justify-space-between h-100 pa-6 pa-md-10">
          <div class="text-white">
            <v-chip color="red-lighten-1" variant="flat" size="small" class="font-weight-bold mb-4">
              모집중 · 4월~5월 사이클
            </v-chip>
            <h2 class="text-h4 text-md-h3 font-weight-black mb-4 line-height-tight">
              기술의 발전과 <br />인간의 윤리
            </h2>
            <p class="text-body-2 text-md-body-1 font-weight-medium opacity-90" style="max-width: 500px;">
              빠르게 발전하는 AI와 생명공학 기술 속에서 우리는 무엇을 잃고 얻게 될까요? 
              자유롭게 책을 읽고 인사이트를 나누어 봅시다.
            </p>
          </div>

          <v-card class="bg-white-opacity-10 backdrop-blur rounded-xl pa-5 mt-6 mt-md-0" elevation="0" border="white" min-width="250">
            <div class="text-white text-subtitle-2 font-weight-bold mb-3 d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-account-group</v-icon> 현재 42명 참여중
            </div>
            <div class="d-flex mb-5 pl-2">
              <v-avatar v-for="i in 4" :key="i" size="36" class="border-md border-white" style="margin-left: -10px" color="grey-lighten-2">
                <span class="text-caption font-weight-bold text-grey-darken-2">U{{i}}</span>
              </v-avatar>
              <v-avatar size="36" class="border-md border-white bg-white" style="margin-left: -10px">
                <span class="text-caption font-weight-bold text-blue-darken-1">+38</span>
              </v-avatar>
            </div>
            <v-btn block color="white" class="text-blue-darken-1 font-weight-bold rounded-lg" variant="flat">
              참여하기
            </v-btn>
          </v-card>
        </v-card-text>
      </v-img>
    </v-card>

    <!-- 핫한 독서 모임 -->
    <div class="mb-10">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-black text-grey-darken-4">🔥 지금 핫한 독서 모임 현황</h3>
        <v-btn variant="text" size="small" class="font-weight-bold text-grey-darken-2">전체보기</v-btn>
      </div>
      
      <v-slide-group show-arrows>
        <!-- 공동 독서 진행률 카드 -->
        <v-slide-group-item>
          <v-card class="mr-4 rounded-xl border bg-white" width="320" elevation="0">
            <v-card-text class="pa-5">
              <div class="d-flex justify-space-between mb-4">
                <v-chip color="grey-darken-3" variant="flat" size="small" class="font-weight-bold">이달의 공통 도서</v-chip>
                <span class="text-blue-darken-1 font-weight-bold text-caption">D-12</span>
              </div>
              <div class="d-flex align-center mb-5">
                <v-card width="64" height="96" color="blue-lighten-5" class="d-flex align-center justify-center rounded-lg mr-4 border" elevation="0">
                  <span class="text-caption font-weight-bold text-blue-darken-3">사피엔스</span>
                </v-card>
                <div>
                  <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-4">사피엔스</h4>
                  <p class="text-caption text-grey-darken-1 mt-1">유발 하라리</p>
                </div>
              </div>
              <v-sheet color="grey-lighten-4" class="pa-3 rounded-lg">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span class="font-weight-bold text-grey-darken-2">전체 완독률</span>
                  <span class="font-weight-black text-blue-darken-1">65%</span>
                </div>
                <v-progress-linear model-value="65" color="blue-darken-1" height="8" rounded></v-progress-linear>
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-slide-group-item>

        <!-- 도서 추천 카드들 -->
        <v-slide-group-item v-for="(book, i) in trendingBooks" :key="i">
          <v-card class="mr-4 rounded-xl border d-flex flex-column bg-white" width="300" elevation="0">
            <v-card-text class="pa-5 flex-grow-1 d-flex flex-column">
              <v-chip :color="i === 0 ? 'red-lighten-1' : 'blue-lighten-1'" variant="tonal" size="small" class="font-weight-bold mb-4 align-self-start">
                {{ book.type }}
              </v-chip>
              <div class="d-flex align-center flex-grow-1 mb-4">
                <v-card width="64" height="96" color="grey-lighten-3" class="rounded-lg mr-4 border" elevation="0"></v-card>
                <div>
                  <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-4 line-clamp-2">{{ book.title }}</h4>
                  <p class="text-caption text-grey-darken-1 mt-1">{{ book.author }}</p>
                </div>
              </div>
              <v-divider class="mb-3"></v-divider>
              <div class="d-flex align-center text-caption text-grey-darken-2">
                <v-icon color="red-lighten-1" size="small" class="mr-1">mdi-heart</v-icon>
                <span class="font-weight-medium">{{ book.users }}명이 관심을 가졌어요</span>
              </div>
            </v-card-text>
          </v-card>
        </v-slide-group-item>
      </v-slide-group>
    </div>

    <!-- 실시간 활동 -->
    <div>
      <h3 class="text-h6 font-weight-black text-grey-darken-4 mb-4">💬 실시간 멤버 소식</h3>
      <v-card class="rounded-xl border" elevation="0">
        <v-list lines="two" bg-color="white">
          <template v-for="(activity, i) in recentActivities" :key="i">
            <v-list-item class="pa-4 hover-bg-grey">
              <template v-slot:prepend>
                <v-avatar color="grey-lighten-2" class="border">
                  <span class="text-subtitle-2 font-weight-bold text-grey-darken-2">{{ activity.user.charAt(0) }}</span>
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2 text-md-body-1 text-wrap">
                <span class="font-weight-bold text-grey-darken-4">{{ activity.user }}</span>님이 
                <span class="font-weight-medium text-grey-darken-3">{{ activity.action }}</span>
              </v-list-item-title>
              <v-list-item-subtitle class="mt-1 text-caption text-grey-darken-1">
                {{ activity.time }}
              </v-list-item-subtitle>
              <template v-slot:append v-if="activity.img">
                <v-card width="56" height="56" color="grey-lighten-3" class="rounded-lg border ml-4 d-none d-sm-block" elevation="0"></v-card>
              </template>
            </v-list-item>
            <v-divider v-if="i !== recentActivities.length - 1" inset></v-divider>
          </template>
        </v-list>
        <div class="pa-3 bg-grey-lighten-5 border-t text-center">
          <v-btn variant="text" size="small" class="font-weight-bold text-grey-darken-2">활동 더보기</v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
const trendingBooks = [
  { title: "클린 아키텍처", author: "로버트 C. 마틴", type: "인기 추천도서", users: 24 },
  { title: "도둑맞은 집중력", author: "요한 하리", type: "AI 맞춤 추천", users: 15 },
];

const recentActivities = [
  { user: '독서왕', action: "'사피엔스' 리뷰를 작성했습니다.", time: '2시간 전', img: true },
  { user: '개발자A', action: "자유게시판에 새 글을 남겼습니다.", time: '5시간 전', img: false },
  { user: '운영진', action: "다음 달 공통 도서가 선정되었습니다.", time: '1일 전', img: true },
];
</script>



<style scoped>
</style>
