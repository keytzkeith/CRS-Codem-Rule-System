<template>
  <section class="crs-panel">
    <div class="mb-5 flex items-start justify-between gap-4">
      <div>
        <p v-if="eyebrow" class="crs-eyebrow">{{ eyebrow }}</p>
        <h3 class="crs-panel-title">{{ title }}</h3>
        <p v-if="description" class="crs-panel-copy">{{ description }}</p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </section>
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
