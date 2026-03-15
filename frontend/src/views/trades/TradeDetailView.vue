<template>
  <div v-if="trade" class="crs-page space-y-8">
    <section class="crs-hero">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="crs-eyebrow">Trade journal</p>
          <h1 class="crs-section-title">{{ trade.pair }} · {{ trade.setupType }}</h1>
          <p class="crs-section-copy">
            {{ formatLongDate(trade.date) }} · {{ trade.direction }} · {{ trade.session }} · {{ trade.accountName || 'Primary account' }} · {{ trade.tags.join(' / ') }}
          </p>
          <div v-if="trade.setupStack?.length" class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="setup in trade.setupStack"
              :key="setup"
              class="rounded-full border border-amber-200/15 bg-amber-200/8 px-3 py-1 text-xs uppercase tracking-[0.16em] text-amber-100"
            >
              {{ setup }}
            </span>
          </div>
        </div>
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ResultBadge :value="trade.status" />
          <router-link :to="`/trades/${trade.id}/edit`" class="crs-button crs-button-ghost w-full sm:w-auto">Edit trade</router-link>
          <router-link to="/trades" class="crs-button crs-button-ghost w-full sm:w-auto">Back to trades</router-link>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <ChartCard
        eyebrow="Execution"
        title="Trade facts"
        description="The clean summary: where it entered, where risk lived, and whether the setup paid as expected."
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Entry" :value="formatPrice(trade.entry)" hint="Initial execution" />
          <MetricCard label="Stop loss" :value="formatPrice(trade.stopLoss)" hint="Invalidation" tone="negative" />
          <MetricCard label="Take profit" :value="formatPrice(trade.takeProfit)" hint="Primary target" tone="positive" />
          <MetricCard label="Result" :value="`${trade.resultR.toFixed(1)}R`" :hint="currency(trade.resultAmount)" :tone="trade.resultAmount >= 0 ? 'positive' : 'negative'" />
          <MetricCard label="Followed plan" :value="trade.journal.followedPlan ? 'Yes' : 'No'" hint="Rule-based execution" />
          <MetricCard label="Planned RR" :value="`${trade.plannedRR}:1`" hint="Reward to risk" />
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Chart evidence"
        title="Screenshot / image"
        description="Mock-first placeholder wired for the trade record shape you requested."
      >
        <ImagePreviewCard :src="trade.screenshot" :alt="`${trade.pair} screenshot`" />
      </ChartCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <ChartCard
        eyebrow="Checklist"
        title="Rule validation"
        description="This is the execution checklist that keeps the system objective."
      >
        <ChecklistPanel :checklist="trade.checklist" />
      </ChartCard>

      <ChartCard
        eyebrow="Psychology"
        title="Journal notes"
        description="Short, practical journaling prompts so reflection stays usable."
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-[22px] border border-white/5 bg-white/[0.03] p-4">
            <p class="crs-eyebrow">Why I took it</p>
            <p class="text-sm text-slate-300">{{ trade.journal.whyTaken }}</p>
          </div>
          <div class="rounded-[22px] border border-white/5 bg-white/[0.03] p-4">
            <p class="crs-eyebrow">HTF bias</p>
            <p class="text-sm text-slate-300">{{ trade.journal.htfBias }}</p>
          </div>
          <div class="rounded-[22px] border border-white/5 bg-white/[0.03] p-4">
            <p class="crs-eyebrow">Entry model</p>
            <p class="text-sm text-slate-300">{{ trade.journal.entryModel }}</p>
          </div>
          <div class="rounded-[22px] border border-white/5 bg-white/[0.03] p-4">
            <p class="crs-eyebrow">Emotions</p>
            <p class="text-sm text-slate-300">{{ trade.journal.emotionBefore }} before · {{ trade.journal.emotionAfter }} after</p>
          </div>
          <div class="rounded-[22px] border border-white/5 bg-white/[0.03] p-4">
            <p class="crs-eyebrow">Mistake made</p>
            <p class="text-sm text-slate-300">{{ trade.journal.mistakeMade }}</p>
          </div>
          <div class="rounded-[22px] border border-white/5 bg-white/[0.03] p-4">
            <p class="crs-eyebrow">Lesson learned</p>
            <p class="text-sm text-slate-300">{{ trade.journal.lessonLearned }}</p>
          </div>
        </div>
        <div class="mt-4 rounded-[24px] border border-white/5 bg-white/[0.03] p-5">
          <p class="crs-eyebrow">Notes</p>
          <p class="text-sm leading-7 text-slate-300">{{ trade.journal.notes }}</p>
        </div>
      </ChartCard>
    </div>
  </div>

  <div v-else class="crs-page">
    <ChartCard eyebrow="Missing trade" title="Trade not found" description="This mock record does not exist in the seeded CRS dataset.">
      <router-link to="/trades" class="crs-button-primary">Return to trade list</router-link>
    </ChartCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import ChartCard from '@/components/crs/ChartCard.vue'
import ChecklistPanel from '@/components/crs/ChecklistPanel.vue'
import ImagePreviewCard from '@/components/crs/ImagePreviewCard.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import ResultBadge from '@/components/crs/ResultBadge.vue'
import { useCrsStore } from '@/stores/crs'

const route = useRoute()
const crsStore = useCrsStore()

const trade = computed(() => crsStore.getTradeById(route.params.id))

function formatPrice(value) {
  return value >= 100 ? value.toFixed(2) : value.toFixed(4)
}

function formatLongDate(value) {
  return format(parseISO(value), 'MMMM d, yyyy')
}

function currency(value) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: crsStore.settings.currency || 'USD',
    maximumFractionDigits: 0
  }).format(Math.abs(value))

  return value < 0 ? `-${amount}` : amount
}
</script>
