<template>
  <section class="landing-shell landing-section landing-section--final" data-reveal="delay-1">
    <div class="landing-cta">
      <p class="landing-section__eyebrow">Ready to use it</p>
      <h2 class="landing-section__title">Start with the journal, then let the review stack do its work.</h2>
      <p class="landing-section__copy">
        Open the app, create the account, and keep the rest of the workflow tight from the first trade onward.
      </p>
      <div class="landing-cta__actions">
        <a v-if="isLandingMode" :href="primaryTo" class="crs-button-primary">{{ primaryLabel }}</a>
        <router-link v-else :to="primaryTo" class="crs-button-primary">{{ primaryLabel }}</router-link>
        <a :href="docsUrl" target="_blank" rel="noreferrer" class="landing-hero__secondary">
          View docs
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  primaryLabel: {
    type: String,
    required: true
  },
  primaryTo: {
    type: String,
    required: true
  },
  isLandingMode: {
    type: Boolean,
    default: false
  },
  docsUrl: {
    type: String,
    required: true
  }
})
</script>
