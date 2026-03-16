<template>
  <section class="crs-panel">
    <div class="crs-panel-header">
      <div class="min-w-0">
        <p v-if="eyebrow" class="crs-eyebrow">{{ eyebrow }}</p>
        <h3 class="crs-panel-title">{{ title }}</h3>
        <p v-if="description" class="crs-panel-copy">{{ description }}</p>
      </div>
      <div class="min-w-0">
        <slot name="actions" />
      </div>
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
