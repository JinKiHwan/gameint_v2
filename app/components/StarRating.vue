<template>
  <!-- 각 별을 두 영역(왼쪽 절반=0.5, 오른쪽 절반=1.0)으로 나눠서 0.5 단위 선택 -->
  <div class="star-rating" :class="{ 'star-rating--readonly': readonly }">
    <span
      v-for="n in 5"
      :key="n"
      class="star-wrap"
      @mouseleave="!readonly && (hovered = 0)"
    >
      <!-- 왼쪽 절반 (n - 0.5) -->
      <span
        class="star star-left"
        :class="getStarClass(n - 0.5)"
        @mouseenter="!readonly && (hovered = n - 0.5)"
        @click="!readonly && emit('update:modelValue', n - 0.5)"
      >★</span>
      <!-- 오른쪽 절반 (n) -->
      <span
        class="star star-right"
        :class="getStarClass(n)"
        @mouseenter="!readonly && (hovered = n)"
        @click="!readonly && emit('update:modelValue', n)"
      >★</span>
    </span>
    <span v-if="showScore && modelValue > 0" class="star-score">{{ modelValue.toFixed(1) }}</span>
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
const displayRating = computed(() => hovered.value || props.modelValue)

// 각 반별 위치에 따른 채움 상태 계산
const getStarClass = (value) => {
  const d = displayRating.value
  if (d >= value) return 'is-filled'         // 완전히 채워짐
  if (d >= value - 0.5 && value % 1 !== 0) return 'is-half'  // 왼쪽 절반(half)
  return ''
}
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

/* 각 별 컨테이너: 두 half-span을 합쳐서 온전한 별 하나처럼 보임 */
.star-wrap {
  position: relative;
  display: inline-flex;
  width: 1.5rem;
  height: 1.5rem;
}

.star-rating--readonly .star-wrap {
  width: 1.2rem;
  height: 1.2rem;
}

.star {
  position: absolute;
  top: 0;
  font-size: 1.5rem;
  line-height: 1;
  color: #E0E0E0;
  user-select: none;
  transition: color 0.1s;
  overflow: hidden;
  white-space: nowrap;
}

.star-rating--readonly .star {
  font-size: 1.2rem;
  cursor: default;
}

/* 왼쪽 절반: 별의 왼쪽 50%만 보임 */
.star-left {
  left: 0;
  width: 50%;
  cursor: pointer;
}

/* 오른쪽 절반: 별의 오른쪽 50%만 보임 (clip으로 오른쪽만 노출) */
.star-right {
  left: 0;
  width: 100%;
  cursor: pointer;
  clip-path: inset(0 0 0 50%); /* 오른쪽 절반만 노출 */
}

/* 채워진 별 */
.star.is-filled {
  color: #FFB300;
}

/* 왼쪽 절반만 채워진 별 (half) */
.star-left.is-half {
  color: #FFB300;
}
.star-right.is-half {
  color: #E0E0E0;
}

/* 인터랙션 힌트 */
.star-rating:not(.star-rating--readonly) .star:hover {
  transform: scale(1.12);
}

.star-score {
  margin-left: 10px;
  font-size: 0.95rem;
  font-weight: 800;
  color: #FFB300;
}
</style>
