<template>
  <div class="crs-image-frame">
    <img
      v-if="showImage"
      :src="src"
      :alt="alt"
      class="h-full w-full object-cover"
      @error="failed = true"
    />
    <div v-else class="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center text-slate-400">
      <div class="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em]">
        {{ failed ? 'Preview unavailable' : 'Screenshot pending' }}
      </div>
      <p class="max-w-xs text-sm text-slate-500">
        {{ failed ? 'The image URL could not be loaded. Try another link or leave it empty for now.' : 'Keep a chart image or execution screenshot here once backend uploads are wired in.' }}
      </p>
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
const showImage = computed(() => Boolean(props.src) && !failed.value)

watch(
  () => props.src,
  () => {
    failed.value = false
  }
)
</script>
