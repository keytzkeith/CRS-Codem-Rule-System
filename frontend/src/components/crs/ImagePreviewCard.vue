<template>
  <div class="crs-image-frame group relative overflow-hidden">
    <!-- Image Display (Standard logic) -->
    <div v-if="!failed" class="relative h-full w-full">
      <img
        :src="src"
        :alt="alt"
        class="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        @error="failed = true"
      />
      <!-- Hover overlay with open button -->
      <div class="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <a :href="src" target="_blank" rel="noopener noreferrer" class="rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md hover:bg-white/20">
          View Full
        </a>
      </div>
    </div>

    <!-- Fallback/Error state (Shows when image fails or isn't a direct image) -->
    <div v-else class="flex h-full min-h-[220px] flex-col items-center justify-center gap-4 px-6 text-center">
      <div v-if="isTradingView" class="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-400">
        TradingView Link
      </div>
      <div v-else class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
        Link Preview
      </div>
      
      <p class="max-w-xs text-sm text-slate-400">
        {{ isTradingView ? 'This TradingView chart is a page and cannot be embedded directly.' : 'This link could not be loaded as a direct image.' }}
      </p>
      
      <a :href="src" target="_blank" rel="noopener noreferrer" class="crs-button-primary scale-90">
        Open Chart
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: 'Trade screenshot'
  }
})

const failed = ref(false)

const isTradingView = computed(() => {
  return props.src && props.src.includes('tradingview.com')
})

watch(
  () => props.src,
  () => {
    // Reset failure state when URL changes so we try loading the new one
    failed.value = false
  }
)
</script>
