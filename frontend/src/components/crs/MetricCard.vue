<template>
  <article class="crs-metric-card">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <p class="crs-metric-label">{{ label }}</p>
          <InfoTip v-if="info" :text="info" :label="`${label} information`" />
        </div>
        <p class="crs-metric-value" :class="toneClass">{{ value }}</p>
      </div>
      <span v-if="chip" class="crs-metric-chip">{{ chip }}</span>
    </div>
    <p v-if="hint" class="crs-metric-hint">{{ hint }}</p>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import InfoTip from '@/components/crs/InfoTip.vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    default: ''
  },
  info: {
    type: String,
    default: ''
  },
  chip: {
    type: String,
    default: ''
  },
  tone: {
    type: String,
    default: 'default'
  }
})

const toneClass = computed(() => {
  if (props.tone === 'positive') {
    return 'text-emerald-300'
  }

  if (props.tone === 'negative') {
    return 'text-red-400'
  }

  if (props.tone === 'warning') {
    return 'text-amber-200'
  }

  return ''
})
</script>
