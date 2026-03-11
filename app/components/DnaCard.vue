<script setup lang="ts">
import { DNA_AXES } from '../utils/dnaConfig';

defineProps<{
  dna: {
    dnaType: string;
    dnaName: string;
    description: string;
    scores: Record<string, number>;
    ratios: Record<string, number>;
    topAxes: string[];
    recommendedGenres: string[];
  }
}>();

const getAxisLabel = (id: string) => DNA_AXES[id as keyof typeof DNA_AXES]?.label || id;
const getAxisColor = (id: string) => DNA_AXES[id as keyof typeof DNA_AXES]?.color || '#9e9e9e';
</script>

<template>
  <div class="dna-card">
    <div class="dna-card__header">
      <div class="dna-badge">DNA</div>
      <h3 class="dna-type-name">{{ dna.dnaName }}</h3>
      <span class="dna-type-code">({{ dna.dnaType }} 타입)</span>
      
      <!-- DNA 판별 안내 툴팁 -->
      <div class="info-tooltip-wrap ml-1">
        <i class="mdi mdi-help-circle-outline text-grey-1" style="font-size: 1rem;"></i>
        <div class="info-tooltip info-tooltip--right">
          <div class="tooltip-title">🧬 DNA 판별 안내</div>
          <p class="tooltip-text">
            월간주제, 도서추천, 책리뷰를 통하여 나만의 독서 DNA를 판별받을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
    
    <p class="dna-description">
      "{{ dna.description }}"
    </p>

    <div class="dna-stats">
      <div class="dna-stats__title">📊 독서 성향 분석</div>
      <div v-for="axis in Object.values(DNA_AXES)" :key="axis.id" class="axis-row">
        <div class="axis-info">
          <span class="axis-label">{{ axis.label }} ({{ axis.id }})</span>
          <span class="axis-percent">{{ Math.round((dna.ratios[axis.id] || 0) * 100) }}%</span>
        </div>
        <div class="progress-bg">
          <div 
            class="progress-fill" 
            :style="{ 
              width: `${(dna.ratios[axis.id] || 0) * 100}%`,
              backgroundColor: axis.color 
            }"
          ></div>
        </div>
      </div>
    </div>

    <div class="dna-genres">
      <div class="dna-genres__title">💡 추천 도서 장르</div>
      <div class="flex flex-wrap gap-2">
        <span v-for="genre in dna.recommendedGenres" :key="genre" class="chip chip--xs chip--amber-lt">
          #{{ genre }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dna-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #eee;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
}

.dna-badge {
  background: #E8EAF6;
  color: #3F51B5;
  font-size: 0.625rem;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.dna-type-name {
  font-size: 1.25rem;
  font-weight: 900;
  color: #212121;
}

.dna-type-code {
  font-size: 0.875rem;
  font-weight: 700;
  color: #757575;
}

.dna-description {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #616161;
  line-height: 1.5;
  margin-bottom: 24px;
}

.dna-stats {
  margin-bottom: 24px;

  &__title {
    font-size: 0.8125rem;
    font-weight: 800;
    color: #9e9e9e;
    margin-bottom: 12px;
  }
}

.axis-row {
  margin-bottom: 12px;
  &:last-child { margin-bottom: 0; }
}

.axis-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.axis-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #424242;
}

.axis-percent {
  font-size: 0.8125rem;
  font-weight: 800;
  color: #212121;
}

.progress-bg {
  height: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dna-genres {
  &__title {
    font-size: 0.8125rem;
    font-weight: 800;
    color: #9e9e9e;
    margin-bottom: 10px;
  }
}

.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.gap-2 { gap: 8px; }
.chip--amber-lt {
  background: #FFF8E1;
  color: #FF8F00;
  font-weight: 800;
}
</style>
