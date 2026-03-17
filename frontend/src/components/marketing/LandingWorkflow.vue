<template>
  <section class="landing-shell landing-section" data-reveal>
    <div class="landing-section__header">
      <p class="landing-section__eyebrow">How CRS works</p>
      <h2 class="landing-section__title">A tight review loop instead of a feature pile.</h2>
      <p class="landing-section__copy">
        The workflow stays simple on purpose: get the trade in cleanly, review it honestly, then use the next session with better information than before.
      </p>
    </div>

    <div class="landing-workflow">
      <article
        v-for="(step, index) in steps"
        :key="step.title"
        class="landing-panel landing-workflow__step"
        :data-reveal="index === 1 ? 'delay-1' : index === 2 ? 'delay-2' : undefined"
      >
        <div class="landing-workflow__icon" :class="step.tone">
          <component :is="step.icon" class="h-5 w-5" />
        </div>
        <p class="landing-workflow__index">{{ step.index }}</p>
        <h3 class="landing-workflow__title">{{ step.title }}</h3>
        <p class="landing-workflow__copy">{{ step.copy }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ArrowDownTrayIcon, ClipboardDocumentCheckIcon, ChartBarSquareIcon } from '@heroicons/vue/24/outline'

const steps = [
  {
    index: '01',
    title: 'Capture the trade',
    copy: 'Log it manually or import it with mapping, preview, and duplicate checks so the ledger starts clean.',
    icon: ArrowDownTrayIcon,
    tone: 'is-gold'
  },
  {
    index: '02',
    title: 'Review the execution',
    copy: 'Tie the trade to setup, checklist, account context, and notes instead of leaving the decision undocumented.',
    icon: ClipboardDocumentCheckIcon,
    tone: 'is-emerald'
  },
  {
    index: '03',
    title: 'Learn from the pattern',
    copy: 'Use the dashboard, calendar, and analytics views to see where the process is tight and where it drifts.',
    icon: ChartBarSquareIcon,
    tone: 'is-red'
  }
]
</script>
