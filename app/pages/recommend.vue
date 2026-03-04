<template>
  <div class="fade-in">
    <v-card class="rounded-xl pa-6 pa-md-8 mb-8 border bg-white d-flex flex-column flex-md-row justify-space-between align-md-center" elevation="0">
      <div>
        <v-chip color="amber-darken-3" variant="tonal" size="small" class="font-weight-bold mb-3">자유 도서 추천</v-chip>
        <h1 class="text-h5 text-md-h4 font-weight-black text-grey-darken-4 mb-2">내 인생의 책을 소개합니다 💡</h1>
        <p class="text-body-2 font-weight-medium text-grey-darken-1">월간 주제와 무관하게 자유롭게 책을 추천해주세요.</p>
      </div>
      <v-btn color="blue-darken-1" size="large" prepend-icon="mdi-pencil" class="rounded-xl mt-4 mt-md-0 font-weight-bold" variant="flat">
        새 추천글 쓰기
      </v-btn>
    </v-card>

    <div class="d-flex flex-column flex-sm-row justify-space-between align-sm-center mb-6">
      <v-chip-group v-model="recommendTag" selected-class="bg-blue-darken-1 text-white" mandatory class="mb-2 mb-sm-0">
        <v-chip v-for="tag in ['전체', '소설', '인문/철학', '자기계발', 'IT/과학', '에세이']" :key="tag" :value="tag" variant="outlined" class="font-weight-bold rounded-xl border-grey-lighten-2">
          {{ tag }}
        </v-chip>
      </v-chip-group>
      <v-btn variant="outlined" color="grey-darken-2" prepend-icon="mdi-filter-variant" class="rounded-xl bg-white">최신순</v-btn>
    </div>

    <v-row>
      <v-col v-for="i in 8" :key="i" cols="6" sm="4" md="3">
        <v-card class="rounded-xl border hover-shadow d-flex flex-column h-100 bg-white" elevation="0">
          <v-card color="grey-lighten-3" height="180" class="rounded-t-xl rounded-b-0 d-flex align-center justify-center position-relative border-b" elevation="0">
            <span class="text-h6 font-weight-bold text-grey-lighten-1">IMAGE</span>
            <v-chip color="white" size="small" class="position-absolute top-0 right-0 ma-3 font-weight-bold text-grey-darken-4" elevation="1">
              <v-icon size="x-small" start>mdi-tag</v-icon> IT/과학
            </v-chip>
          </v-card>
          <v-card-text class="pa-4 d-flex flex-column flex-grow-1">
            <h4 class="text-subtitle-1 font-weight-black text-grey-darken-4 line-clamp-1 mb-1">클린 아키텍처</h4>
            <p class="text-caption font-weight-medium text-grey-darken-1 mb-4">로버트 C. 마틴</p>
            
            <v-divider class="mt-auto mb-3"></v-divider>
            <div class="d-flex align-center justify-space-between text-caption">
              <div class="d-flex align-center">
                <v-avatar size="24" color="grey-lighten-2" class="mr-2"><span class="font-weight-bold">U</span></v-avatar>
                <span class="font-weight-bold text-grey-darken-2 text-truncate" style="max-width: 60px;">안티그래비티</span>
              </div>
              <v-chip size="small" color="blue-lighten-5" text-color="blue-darken-1" class="font-weight-bold px-2">
                <v-icon size="x-small" start>mdi-thumb-up</v-icon> 24
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const recommendTag = ref('전체');
</script>
