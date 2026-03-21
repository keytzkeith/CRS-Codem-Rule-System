<template>
  <div class="crs-image-frame group relative">
    <!-- If it's a confirmed TradingView URL that we can't proxy as an image, show a placeholder with a link -->
    <div v-if="isTradingViewPage" class="flex h-full min-h-[220px] flex-col items-center justify-center gap-4 px-6 text-center">
      <div class="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-400">
        TradingView Link
      </div>
      <p class="max-w-xs text-sm text-slate-400">
        This chart is a TradingView page. Click below to view it directly.
      </p>
      <a :href="src" target="_blank" rel="noopener noreferrer" class="crs-button-primary scale-90">
        Open Chart
      </a>
    </div>

    <!-- Normal image display -->
    <div v-else-if="showImage" class="relative h-full w-full overflow-hidden">
      <img
        :src="src"
        :alt="alt"
        class="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        @error="handleError"
      />
      <!-- Hover overlay with open button -->
      <div class="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <a :href="src" target="_blank" rel="noopener noreferrer" class="rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md hover:bg-white/20">
          View Full
        </a>
      </div>
    </div>

    <!-- Error/Pending state -->
    <div v-else class="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center text-slate-400">
      <div class="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em]">
        {{ failed ? 'Preview unavailable' : 'Screenshot pending' }}
      </div>
      <p class="max-w-xs text-sm text-slate-500">
        {{ failed ? 'The image URL could not be loaded. Try another link or leave it empty for now.' : 'Keep a chart image or execution screenshot here once backend uploads are wired in.' }}
      </p>
      <a v-if="failed && src" :href="src" target="_blank" rel="noopener noreferrer" class="text-xs text-amber-200/60 underline hover:text-amber-200">
        Try opening link directly
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

// Check if the URL is a TradingView page (not a snapshot image)
const isTradingViewPage = computed(() => {
  if (!props.src) return false
  // If it's our proxy URL, it's an image
  if (props.src.includes('/snapshot/')) return false
  // If it's a tradingview.com URL but not our proxy, it's likely a page
  return props.src.includes('tradingview.com')
})

const showImage = computed(() => Boolean(props.src) && !failed.value && !isTradingViewPage.value)

function handleError() {
  // Only mark as failed if it's not a TradingView page (which we handle separately)
  if (!isTradingViewPage.value) {
    failed.value = true
  }
}

watch(
  () => props.src,
  () => {
    failed.value = false
  }
)
</script>
