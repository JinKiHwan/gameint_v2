<template>
  <div class="star-rating" :class="{ 'star-rating--readonly': readonly }">
    <span
      v-for="n in 5"
      :key="n"
      class="star"
      :class="{ 'is-filled': n <= displayRating, 'is-hovered': !readonly && n <= hovered }"
      @mouseenter="!readonly && (hovered = n)"
      @mouseleave="!readonly && (hovered = 0)"
      @click="!readonly && emit('update:modelValue', n)"
    >★</span>
    <span v-if="showScore" class="star-score">{{ modelValue > 0 ? modelValue.toFixed(1) : '' }}</span>
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
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.star {
  font-size: 1.4rem;
  color: #E0E0E0;
  cursor: pointer;
  transition: color 0.15s, transform 0.15s;
  line-height: 1;
  user-select: none;
}

.star.is-filled,
.star.is-hovered {
  color: #FFB300;
}

.star-rating:not(.star-rating--readonly) .star:hover {
  transform: scale(1.15);
}

.star-rating--readonly .star {
  cursor: default;
  font-size: 1.1rem;
}

.star-score {
  margin-left: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #FFB300;
}
</style>
