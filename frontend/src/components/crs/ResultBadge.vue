<template>
  <span class="crs-result-badge" :class="badgeClass">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    required: true
  }
})

const label = computed(() => props.value)
const badgeClass = computed(() => {
  if (props.value === 'Win') {
    return 'crs-result-win'
  }

  if (props.value === 'Loss') {
    return 'crs-result-loss'
  }

  return 'crs-result-breakeven'
})
</script>
