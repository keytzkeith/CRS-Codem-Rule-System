<template>
  <div class="landing-page">
    <LandingHero :primary-label="primaryLabel" :primary-to="primaryTo" :docs-url="docsUrl" />
    <LandingProofStrip />
    <LandingWorkflow />
    <LandingFeatureGrid />
    <LandingShowcase />
    <LandingAnalyticsPreview />
    <LandingFounder />
    <LandingFaq />
    <LandingCta :primary-label="primaryLabel" :primary-to="primaryTo" :docs-url="docsUrl" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useScrollReveal } from '@/composables/useScrollReveal'
import LandingHero from '@/components/marketing/LandingHero.vue'
import LandingProofStrip from '@/components/marketing/LandingProofStrip.vue'
import LandingWorkflow from '@/components/marketing/LandingWorkflow.vue'
import LandingFeatureGrid from '@/components/marketing/LandingFeatureGrid.vue'
import LandingShowcase from '@/components/marketing/LandingShowcase.vue'
import LandingAnalyticsPreview from '@/components/marketing/LandingAnalyticsPreview.vue'
import LandingFounder from '@/components/marketing/LandingFounder.vue'
import LandingFaq from '@/components/marketing/LandingFaq.vue'
import LandingCta from '@/components/marketing/LandingCta.vue'
import siteIdentity from '../../../config/siteIdentity.json'

const authStore = useAuthStore()

const docsUrl = import.meta.env.DEV ? 'http://localhost:3001' : siteIdentity.urls.docs
const appUrl = import.meta.env.DEV ? '' : siteIdentity.urls.app
const primaryLabel = computed(() => (authStore.isAuthenticated ? 'Open app' : 'Start journaling'))
const primaryTo = computed(() => {
  if (import.meta.env.VITE_APP_MODE === 'landing') {
    return authStore.isAuthenticated ? `${appUrl}/dashboard` : `${appUrl}/register`
  }
  return authStore.isAuthenticated ? '/dashboard' : '/register'
})

useScrollReveal()

onMounted(() => {
  document.documentElement.classList.add('landing-scroll-mode')
  document.body.classList.add('landing-scroll-mode')
  document.title = `${siteIdentity.shortProductName} | Trading journal and review system`

  const description = 'CRS is a focused trading journal for imports, rule-based review, checklist discipline, and practical performance analytics.'
  const descriptionMeta = document.querySelector('meta[name="description"]')
  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', description)
  }

  const keywordsMeta = document.querySelector('meta[name="keywords"]')
  if (keywordsMeta) {
    keywordsMeta.setAttribute('content', 'CRS, trading journal, trade review, import workflow, execution review, trading analytics')
  }

  const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link')
  canonical.setAttribute('rel', 'canonical')
  canonical.setAttribute('href', siteIdentity.urls.app)
  if (!canonical.parentNode) {
    document.head.appendChild(canonical)
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) {
    ogTitle.setAttribute('content', `${siteIdentity.shortProductName} | Trading journal and review system`)
  }

  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription) {
    ogDescription.setAttribute('content', description)
  }
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('landing-scroll-mode')
  document.body.classList.remove('landing-scroll-mode')
})
</script>
