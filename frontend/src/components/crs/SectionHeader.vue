<template>
  <div :class="wrapperClass">
    <div class="min-w-0">
      <p v-if="eyebrow" class="crs-eyebrow">{{ eyebrow }}</p>
      <h2 class="crs-section-title">{{ title }}</h2>
      <p v-if="description" class="crs-section-copy">{{ description }}</p>
    </div>
    <div v-if="$slots.default" :class="actionsClass">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  eyebrow: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  stacked: {
    type: Boolean,
    default: false
  }
})

const wrapperClass = computed(() => (
  props.stacked
    ? 'flex flex-col gap-4'
    : 'flex flex-col gap-3 md:flex-row md:items-end md:justify-between'
))

const actionsClass = computed(() => (
  props.stacked ? 'w-full' : ''
))
</script>
