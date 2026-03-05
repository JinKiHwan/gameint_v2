<template>
  <div class="star-rating" :class="{ 'star-rating--readonly': readonly }">
    <div
      v-for="n in 5"
      :key="n"
      class="star-pos"
      @mouseleave="!readonly && (hovered = 0)"
    >
      <!-- 배경 (회색) 별 -->
      <span class="star star--base">★</span>
      <!-- 채움 (금색) 별 — width %로 0%, 50%, 100% 중 하나 -->
      <span class="star star--fill" :style="{ width: starFill(n) + '%' }">★</span>

      <!-- 인터랙션 영역 (readonly가 아닐 때만) -->
      <template v-if="!readonly">
        <span
          class="zone zone--left"
          @mouseenter="hovered = n - 0.5"
          @click="emit('update:modelValue', n - 0.5)"
        ></span>
        <span
          class="zone zone--right"
          @mouseenter="hovered = n"
          @click="emit('update:modelValue', n)"
        ></span>
      </template>
    </div>

    <span v-if="showScore && modelValue > 0" class="star-score">
      {{ modelValue.toFixed(1) }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly:   { type: Boolean, default: false },
  showScore:  { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const hovered = ref(0)
const display = computed(() => hovered.value || props.modelValue)

// 각 별 위치(n)에 대해 채움 너비 계산
// - rating >= n     → 100% (full)
// - rating >= n-0.5 → 50%  (half)
// - otherwise       → 0%   (empty)
const starFill = (n) => {
  const r = display.value
  if (r >= n) return 100
  if (r >= n - 0.5) return 50
  return 0
}
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  line-height: 1;
}

/* 각 별 하나의 컨테이너 */
.star-pos {
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
}

.star-rating--readonly .star-pos {
  width: 1.2rem;
  height: 1.2rem;
  cursor: default;
}

/* 공통 별 스타일 */
.star {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 1.5rem;
  line-height: 1;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
}

.star-rating--readonly .star {
  font-size: 1.2rem;
}

/* 회색 배경 별 */
.star--base {
  color: #E0E0E0;
  width: 100%;
}

/* 금색 채움 별 — width로 0%/50%/100% 클리핑 */
.star--fill {
  color: #FFB300;
  width: 0%;
  transition: width 0.1s;
}

/* 클릭·호버 투명 영역 */
.zone {
  position: absolute;
  top: 0;
  height: 100%;
  width: 50%;
}
.zone--left  { left: 0; }
.zone--right { right: 0; }

.star-score {
  margin-left: 6px;
  font-size: 0.9rem;
  font-weight: 800;
  color: #FFB300;
}
</style>
