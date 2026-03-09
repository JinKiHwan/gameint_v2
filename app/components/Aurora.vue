<template>
  <div class="aurora-container" ref="container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

const props = defineProps({
  colorStops: {
    type: Array,
    default: () => ["#0047AB", "#00BFFF", "#1E90FF"],
  },
  speed: {
    type: Number,
    default: 1.0,
  },
  amplitude: {
    type: Number,
    default: 1.0,
  },
});

const container = ref(null);
const canvas = ref(null);
let renderer, gl;
let mesh;
let animationId;

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uAmplitude;
  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float noise1 = snoise(uv * 2.0 + uTime * 0.1) * uAmplitude;
    float noise2 = snoise(uv * 3.0 - uTime * 0.15) * uAmplitude;
    
    float finalNoise = (noise1 + noise2) * 0.5 + 0.5;
    
    vec3 color = mix(uColor1, uColor2, finalNoise);
    color = mix(color, uColor3, snoise(uv * 1.5 + uTime * 0.05) * 0.5 + 0.5);
    
    float alpha = smoothstep(0.1, 0.8, uv.y) * 0.8;
    gl_FragColor = vec4(color, alpha);
  }
`;

onMounted(() => {
  renderer = new Renderer({ canvas: canvas.value, alpha: true, antialias: true });
  gl = renderer.gl;

  const geometry = new Triangle(gl);

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new Color(props.colorStops[0]) },
      uColor2: { value: new Color(props.colorStops[1]) },
      uColor3: { value: new Color(props.colorStops[2]) },
      uAmplitude: { value: props.amplitude },
    },
    transparent: true,
  });

  mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    renderer.setSize(container.value.offsetWidth, container.value.offsetHeight);
  };
  window.addEventListener('resize', resize);
  resize();

  const update = (time) => {
    animationId = requestAnimationFrame(update);
    program.uniforms.uTime.value = time * 0.001 * props.speed;
    renderer.render({ scene: mesh });
  };
  animationId = requestAnimationFrame(update);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', resize);
});
</script>

<style scoped>
.aurora-container {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.6;
  filter: blur(40px);
}
canvas {
  width: 100%;
  height: 100%;
}
</style>
