<template>
  <AuroraHeroBackground class="landing-hero">
    <div class="landing-shell landing-hero__grid" data-reveal>
      <div class="landing-hero__copy">
        <div class="landing-kicker">
          <span class="landing-kicker__dot"></span>
          A trading journal built for actual review
        </div>

        <img src="/crs-main.png" alt="CRS Codem System Rule" class="landing-hero__logo" />

        <h1 class="landing-hero__title">
          See the trade clearly enough to improve it.
        </h1>

        <p class="landing-hero__lede">
          CRS gives you one place to import trades, review execution, track checklist discipline, and spot the patterns that keep repeating in your process.
        </p>

        <div class="landing-hero__actions">
          <router-link :to="primaryTo" class="crs-button-primary landing-hero__primary">
            {{ primaryLabel }}
          </router-link>
          <a :href="docsUrl" target="_blank" rel="noreferrer" class="landing-hero__secondary">
            View docs
          </a>
        </div>

        <div class="landing-hero__trust">
          <span>Import-ready</span>
          <span>Rule-based review</span>
          <span>Clear analytics</span>
        </div>
      </div>

      <div class="landing-hero__visual" data-reveal="delay-1">
        <div class="landing-frame landing-frame--hero">
          <img src="/images/sample-images-data/dashboard-overview.png" alt="CRS dashboard preview" class="landing-frame__image" data-parallax="-0.04" />
        </div>

        <div class="landing-floating landing-floating--left">
          <p class="landing-floating__label">Review loop</p>
          <p class="landing-floating__value">Capture the trade, inspect the decision, tighten the next one.</p>
        </div>

        <div class="landing-floating landing-floating--right">
          <p class="landing-floating__label">Built for</p>
          <p class="landing-floating__value">Imports, checklists, analytics, and clean execution review.</p>
        </div>
      </div>
    </div>
  </AuroraHeroBackground>
</template>

<script setup>
import AuroraHeroBackground from '@/components/marketing/AuroraHeroBackground.vue'

defineProps({
  primaryLabel: {
    type: String,
    required: true
  },
  primaryTo: {
    type: String,
    required: true
  },
  docsUrl: {
    type: String,
    required: true
  }
})
</script>
