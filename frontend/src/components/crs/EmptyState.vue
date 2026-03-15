<template>
  <div class="crs-empty-state">
    <div class="crs-empty-badge">{{ eyebrow }}</div>
    <h3 class="text-xl font-semibold tracking-[-0.03em] text-white">{{ title }}</h3>
    <p class="max-w-md text-sm leading-7 text-slate-400">{{ description }}</p>
    <div v-if="$slots.default" class="flex flex-wrap justify-center gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: 'No data'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})
</script>
