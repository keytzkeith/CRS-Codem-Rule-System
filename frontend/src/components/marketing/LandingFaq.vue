<template>
  <section class="landing-shell landing-section" data-reveal>
    <div class="landing-section__header">
      <p class="landing-section__eyebrow">Short FAQ</p>
      <h2 class="landing-section__title">A few useful answers, without the SEO wall of text.</h2>
    </div>

    <div class="landing-faq">
      <article
        v-for="item in items"
        :key="item.question"
        class="landing-panel landing-faq__item"
      >
        <button type="button" class="landing-faq__trigger" @click="toggle(item.question)">
          <span>{{ item.question }}</span>
          <span class="landing-faq__symbol">{{ openItem === item.question ? '−' : '+' }}</span>
        </button>
        <p v-if="openItem === item.question" class="landing-faq__answer">
          {{ item.answer }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const openItem = ref('Who is CRS for?')

const items = [
  {
    question: 'Who is CRS for?',
    answer: 'CRS is for traders who want a disciplined journal and review workflow rather than a broad social or brokerage platform.'
  },
  {
    question: 'How does import work?',
    answer: 'You can import supported CSV exports, preview them before commit, map fields when needed, and skip duplicates before they touch the ledger.'
  },
  {
    question: 'Can I review trades manually too?',
    answer: 'Yes. Manual trade capture, edit flow, checklist review, notes, and analytics all work alongside import.'
  },
  {
    question: 'Is it open or self-hostable?',
    answer: 'Yes, but that is a supporting capability rather than the main pitch. The core value is the review workflow itself.'
  },
  {
    question: 'Where do the docs live?',
    answer: 'The product links directly to the Docusaurus docs site for setup, import guidance, deployment notes, and current system documentation.'
  }
]

function toggle(question) {
  openItem.value = openItem.value === question ? '' : question
}
</script>
