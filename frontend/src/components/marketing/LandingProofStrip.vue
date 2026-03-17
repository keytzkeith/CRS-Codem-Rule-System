<template>
  <section class="landing-shell landing-proof-wrap" data-reveal="delay-1">
    <div class="landing-proof">
      <article v-for="item in items" :key="item.label" class="landing-proof__item">
        <p class="landing-proof__value">{{ item.value }}</p>
        <p class="landing-proof__label">{{ item.label }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
const items = [
  { value: 'CSV import', label: 'Preview, map, validate, and skip duplicates before anything lands in the ledger.' },
  { value: 'Checklist review', label: 'Tie the trade to your own rules and see whether the plan actually held up.' },
  { value: 'Session context', label: 'Track time, session, and holding behavior in a way that supports review.' },
  { value: 'Account clarity', label: 'See performance in the account it belongs to instead of disconnected rows.' }
]
</script>
