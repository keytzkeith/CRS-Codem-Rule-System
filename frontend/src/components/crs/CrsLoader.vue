<template>
  <div
    class="crs-loader"
    :class="{
      'crs-loader-compact': compact,
      'crs-loader-inline': inline,
      'crs-loader-inverse': inverse
    }"
    role="status"
    :aria-label="ariaLabel"
  >
    <div class="crs-loader__graph" aria-hidden="true">
      <span v-for="bar in 7" :key="bar" class="crs-loader__bar"></span>
    </div>

    <div v-if="title || text" class="crs-loader__copy">
      <p v-if="title" class="crs-loader__title">{{ title }}</p>
      <p v-if="text" class="crs-loader__text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  },
  inverse: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: 'Loading'
  }
})
</script>
