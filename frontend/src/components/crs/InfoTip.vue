<template>
  <span class="crs-info-tip">
    <button type="button" class="crs-info-tip-trigger" :aria-label="label">
      i
    </button>
    <span class="crs-info-tip-panel">
      {{ text }}
    </span>
  </span>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: 'More information'
  }
})
</script>
