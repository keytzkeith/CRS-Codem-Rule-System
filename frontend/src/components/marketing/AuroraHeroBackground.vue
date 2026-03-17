<template>
  <section
    ref="root"
    class="aurora-hero"
    :style="backgroundStyle"
    @mousemove="handleMove"
    @mouseleave="handleLeave"
  >
    <div class="aurora-hero__aurora aurora-hero__aurora--one" aria-hidden="true"></div>
    <div class="aurora-hero__aurora aurora-hero__aurora--two" aria-hidden="true"></div>
    <div class="aurora-hero__grid" aria-hidden="true"></div>
    <div class="aurora-hero__vignette" aria-hidden="true"></div>
    <div class="aurora-hero__content">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const root = ref(null)
const mouseX = ref(50)
const mouseY = ref(26)
const glow = ref(0.42)
const isInteractive = ref(false)
let frameId = null

const backgroundStyle = computed(() => ({
  '--aurora-mouse-x': `${mouseX.value}%`,
  '--aurora-mouse-y': `${mouseY.value}%`,
  '--aurora-glow': glow.value
}))

function handleMove(event) {
  if (!root.value || !isInteractive.value) {
    return
  }

  if (frameId) {
    cancelAnimationFrame(frameId)
  }

  frameId = requestAnimationFrame(() => {
    const rect = root.value.getBoundingClientRect()
    mouseX.value = ((event.clientX - rect.left) / rect.width) * 100
    mouseY.value = ((event.clientY - rect.top) / rect.height) * 100
    glow.value = 0.92
  })
}

function handleLeave() {
  if (!isInteractive.value) {
    return
  }
  mouseX.value = 50
  mouseY.value = 26
  glow.value = 0.42
}

onMounted(() => {
  isInteractive.value = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 961px)').matches
})

onBeforeUnmount(() => {
  if (frameId) {
    cancelAnimationFrame(frameId)
  }
})
</script>
