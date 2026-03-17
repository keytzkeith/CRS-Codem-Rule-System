<template>
  <section class="landing-shell landing-section" data-reveal>
    <div class="landing-founder">
      <div class="landing-founder__header">
        <p class="landing-section__eyebrow">Built by {{ siteIdentity.creator.name }}</p>
        <h2 class="landing-section__title">A trading journal shaped by steady iteration, not product theatre.</h2>
      </div>

      <div class="landing-founder__content">
        <div class="landing-founder__identity">
          <img src="/profileimgprofile.png" :alt="siteIdentity.creator.name" class="landing-founder__photo" loading="lazy" decoding="async" />
          <div class="landing-founder__identity-copy">
            <p class="landing-founder__name">{{ siteIdentity.creator.name }}</p>
            <p class="landing-founder__role">{{ siteIdentity.creator.title }}</p>
          </div>
        </div>

        <div class="landing-founder__body">
          <p class="landing-section__copy">
            CRS is built around a practical bias: capture the trade cleanly, review it honestly, and keep cutting friction out of the parts traders repeat every week. It stays intentionally narrower than the legacy codebase it came from.
          </p>
          <div class="landing-founder__meta">
            <a :href="`mailto:${siteIdentity.contact.supportEmail}`" class="landing-inline-link">{{ siteIdentity.contact.supportEmail }}</a>
            <a :href="siteIdentity.contact.portfolioUrl" target="_blank" rel="noreferrer" class="landing-inline-link">Portfolio</a>
            <a :href="siteIdentity.contact.repositoryUrl" target="_blank" rel="noreferrer" class="landing-inline-link">GitHub</a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import siteIdentity from '../../../../config/siteIdentity.json'
</script>
