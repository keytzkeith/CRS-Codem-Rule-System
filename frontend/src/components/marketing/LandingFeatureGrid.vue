<template>
  <section class="landing-shell landing-section" data-reveal>
    <div class="landing-section__header">
      <p class="landing-section__eyebrow">What makes it useful</p>
      <h2 class="landing-section__title">Built around actual review work.</h2>
      <p class="landing-section__copy">
        The active product stays centered on import quality, execution review, analytics, and control. No filler modules just to make the page sound bigger than it is.
      </p>
    </div>

    <div class="landing-bento">
      <article
        v-for="(feature, index) in features"
        :key="feature.title"
        class="landing-panel landing-bento__item"
        :class="feature.size"
        :data-reveal="index % 3 === 1 ? 'delay-1' : index % 3 === 2 ? 'delay-2' : undefined"
      >
        <div class="landing-bento__icon" :class="feature.tone">
          <component :is="feature.icon" class="h-5 w-5" />
        </div>
        <h3 class="landing-bento__title">{{ feature.title }}</h3>
        <p class="landing-bento__copy">{{ feature.copy }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import {
  ArrowPathRoundedSquareIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  BuildingLibraryIcon,
  ClockIcon,
  ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'

const features = [
  {
    title: 'Import and mapping',
    copy: 'Bring in broker files with preview, field mapping, duplicate protection, and a visible skipped-row report.',
    icon: ArrowPathRoundedSquareIcon,
    tone: 'is-gold',
    size: 'landing-bento__item--wide'
  },
  {
    title: 'Trade journal and checklist',
    copy: 'Review the trade against your own execution rules instead of a locked preset.',
    icon: ClipboardDocumentListIcon,
    tone: 'is-emerald',
    size: ''
  },
  {
    title: 'Analytics and calendar review',
    copy: 'Read performance by time, session, behavior, and streak without losing the day-by-day context.',
    icon: PresentationChartLineIcon,
    tone: 'is-red',
    size: ''
  },
  {
    title: 'Account-based tracking',
    copy: 'Keep multiple accounts straight and see performance relative to the account you actually traded.',
    icon: BuildingLibraryIcon,
    tone: 'is-emerald',
    size: ''
  },
  {
    title: 'Review rhythm',
    copy: 'Use the calendar and cadence views to keep your review habit steady instead of only checking the ledger when something goes wrong.',
    icon: ClockIcon,
    tone: 'is-gold',
    size: ''
  },
  {
    title: 'Export and ownership',
    copy: 'Move your data cleanly, keep your docs nearby, and run the app with a setup you can understand.',
    icon: ArrowUpTrayIcon,
    tone: 'is-red',
    size: 'landing-bento__item--wide'
  }
]
</script>
