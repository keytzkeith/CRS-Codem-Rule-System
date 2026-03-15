<template>
  <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div>
      <p v-if="eyebrow" class="crs-eyebrow">{{ eyebrow }}</p>
      <h2 class="crs-section-title">{{ title }}</h2>
      <p v-if="description" class="crs-section-copy">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
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
  }
})
</script>
