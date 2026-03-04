<template>
  <div class="fade-in">
    <v-card class="rounded-xl pa-6 mb-8 border bg-white d-flex justify-space-between align-center" elevation="0">
      <div>
        <h1 class="text-h5 font-weight-black text-grey-darken-4 mb-1">자유 게시판 💬</h1>
        <p class="text-body-2 font-weight-medium text-grey-darken-1">멤버들과 자유롭게 소통하는 공간입니다.</p>
      </div>
      <v-btn color="blue-darken-1" prepend-icon="mdi-pencil" class="rounded-xl font-weight-bold" variant="flat">글쓰기</v-btn>
    </v-card>

    <div class="mb-8">
      <h3 class="text-h6 font-weight-black text-grey-darken-4 mb-4 d-flex align-center">
        <v-icon color="red-lighten-1" class="mr-2">mdi-fire</v-icon> 주간 HOT 인기글
      </h3>
      <v-row>
        <v-col v-for="i in 2" :key="i" cols="12" md="6">
          <v-card class="rounded-xl pa-5 border-red-lighten-4 bg-red-lighten-5 hover-shadow cursor-pointer" elevation="0" border>
            <div class="d-flex justify-space-between align-start mb-3">
              <v-chip color="red-lighten-1" size="small" variant="flat" class="font-weight-bold px-2">HOT</v-chip>
              <div class="d-flex gap-2 text-caption font-weight-bold text-grey-darken-1">
                <span class="d-flex align-center text-red-lighten-1"><v-icon size="small" class="mr-1">mdi-heart</v-icon> 42</span>
                <span class="d-flex align-center"><v-icon size="small" class="mr-1">mdi-forum</v-icon> 18</span>
              </div>
            </div>
            <h4 class="text-subtitle-1 font-weight-black text-grey-darken-4 mb-1 line-clamp-1">전자책 vs 종이책, 여러분의 선택은?</h4>
            <p class="text-body-2 text-grey-darken-2 line-clamp-1">저는 개인적으로 종이책 넘기는 맛을 포기할 수가 없네요...</p>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-card class="rounded-xl border bg-white overflow-hidden" elevation="0">
      <div class="d-flex flex-column flex-sm-row justify-space-between align-sm-center pa-4 bg-grey-lighten-5 border-b">
        <v-chip-group v-model="boardTag" selected-class="bg-grey-darken-4 text-white" mandatory class="mb-2 mb-sm-0">
          <v-chip value="전체" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">전체</v-chip>
          <v-chip value="잡담" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">잡담</v-chip>
          <v-chip value="질문" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">질문</v-chip>
          <v-chip value="정보" variant="outlined" class="bg-white font-weight-bold border-grey-lighten-2">정보</v-chip>
        </v-chip-group>
        <v-select
          v-model="boardSort"
          :items="['최신순', '인기순', '댓글순']"
          variant="outlined"
          density="compact"
          hide-details
          bg-color="white"
          class="font-weight-bold rounded-lg"
          style="max-width: 150px;"
        ></v-select>
      </div>
      
      <v-list lines="two" class="pa-0">
        <template v-for="i in 5" :key="i">
          <v-list-item class="pa-4 pa-md-5 hover-bg-grey">
            <div class="d-flex align-center w-100">
              <div class="d-none d-sm-flex flex-column align-center justify-center w-16 text-grey-darken-1 mr-4">
                <v-icon size="small" class="mb-1">mdi-heart</v-icon>
                <span class="text-caption font-weight-bold">12</span>
              </div>
              
              <div class="flex-grow-1 min-w-0">
                <div class="d-flex align-center mb-1">
                  <v-chip size="x-small" color="blue-lighten-5" text-color="blue-darken-1" class="font-weight-bold px-2 mr-2 rounded">잡담</v-chip>
                  <h4 class="text-subtitle-1 font-weight-bold text-grey-darken-4 text-truncate">독서 모임 첫 참석인데 준비물이 있을까요?</h4>
                </div>
                <div class="d-flex align-center gap-3 text-caption font-weight-medium text-grey-darken-1">
                  <span class="font-weight-bold text-grey-darken-3">초보독서가</span>
                  <span>2시간 전</span>
                  <span class="d-flex align-center"><v-icon size="x-small" class="mr-1">mdi-eye</v-icon> 230</span>
                </div>
              </div>
              
              <div class="d-flex flex-column align-center justify-center w-16 ml-2">
                <v-icon color="blue-lighten-2" class="mb-1">mdi-comment-processing-outline</v-icon>
                <span class="text-caption font-weight-bold text-blue-darken-1">5</span>
              </div>
            </div>
          </v-list-item>
          <v-divider v-if="i !== 5"></v-divider>
        </template>
      </v-list>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const boardTag = ref('전체');
const boardSort = ref('최신순');
</script>

<style scoped>
</style>
