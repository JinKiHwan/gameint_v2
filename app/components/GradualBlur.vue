<template>
  <div 
    class="gradual-blur" 
    :style="containerStyle"
  >
    <div 
      v-for="i in layers" 
      :key="i" 
      class="blur-layer"
      :style="getLayerStyle(i)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  direction: {
    type: String,
    default: 'to bottom', // to top, to bottom, to left, to right
  },
  height: {
    type: String,
    default: '100%',
  },
  width: {
    type: String,
    default: '100%',
  },
  maxBlur: {
    type: Number,
    default: 12,
  },
  layers: {
    type: Number,
    default: 8,
  }
});

const containerStyle = computed(() => ({
  height: props.height,
  width: props.width,
}));

const getLayerStyle = (index) => {
  const step = index / props.layers;
  // Exponential blur increase for a smoother transition
  const blurAmount = Math.pow(step, 2) * props.maxBlur;
  
  // Create a gradient mask that "favors" the specific blur layer at its designated position
  // We use a progressive mask to blend they layers together
  const start = Math.max(0, (index - 1) / props.layers * 100);
  const end = Math.min(100, (index + 1) / props.layers * 100);
  
  return {
    backdropFilter: `blur(${blurAmount}px)`,
    WebkitBackdropFilter: `blur(${blurAmount}px)`,
    maskImage: `linear-gradient(${props.direction}, rgba(0,0,0,0) ${start}%, rgba(0,0,0,1) ${end}%)`,
    WebkitMaskImage: `linear-gradient(${props.direction}, rgba(0,0,0,0) ${start}%, rgba(0,0,0,1) ${end}%)`,
  };
};
</script>

<style scoped>
.gradual-blur {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
}

.blur-layer {
  position: absolute;
  inset: 0;
  will-change: backdrop-filter;
}
</style>
