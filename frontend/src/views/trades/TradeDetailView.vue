<template>
  <div v-if="trade" class="crs-page space-y-8">
    <section class="crs-hero">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="crs-eyebrow">Trade journal</p>
          <h1 class="crs-section-title">{{ trade.pair }} · {{ trade.setupType }}</h1>
          <p class="crs-section-copy">
            {{ formatLongDate(trade.date) }} · {{ trade.direction }} · {{ trade.session }} · {{ trade.accountName || 'No account selected' }} · {{ trade.tags.join(' / ') }}
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
          <button type="button" class="crs-button-danger w-full sm:w-auto" :disabled="deleting" @click="removeTrade">
            {{ deleting ? 'Deleting...' : 'Delete trade' }}
          </button>
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
          <MetricCard label="Close price" :value="formatPrice(trade.closePrice)" hint="Actual close" />
          <MetricCard label="Open time" :value="formatDateTime(trade.openTime)" hint="Execution start" />
          <MetricCard label="Close time" :value="formatDateTime(trade.closeTime)" hint="Execution end" />
          <MetricCard label="Volume" :value="String(trade.volume || 0)" hint="Position size" />
          <MetricCard label="Multiplier" :value="String(trade.contractMultiplier || 1)" hint="Contract sizing" />
          <MetricCard label="Stop loss" :value="formatPrice(trade.stopLoss)" hint="Invalidation" tone="negative" />
          <MetricCard label="Take profit" :value="formatPrice(trade.takeProfit)" hint="Primary target" tone="positive" />
          <MetricCard label="Result" :value="trade.resultR !== null ? `${trade.resultR.toFixed(3)}R` : 'N/A'" :hint="currency(trade.resultAmount)" :tone="trade.resultAmount >= 0 ? 'positive' : 'negative'" />
          <MetricCard label="Actual risk" :value="currency(trade.actualRiskAmount || 0)" hint="Capital at risk" tone="warning" />
          <MetricCard label="Risk of account" :value="`${Number(trade.riskPercentOfAccount || 0).toFixed(3)}%`" hint="Consistency" />
          <MetricCard label="Pips / points" :value="trade.pips !== null && trade.pips !== undefined ? String(trade.pips) : 'N/A'" hint="Signed move" />
          <MetricCard label="Holding time" :value="formatHoldingTime(trade)" hint="Open to close" />
          <MetricCard label="Followed plan" :value="trade.journal.followedPlan ? 'Yes' : 'No'" hint="Rule-based execution" />
          <MetricCard label="Planned RR" :value="`${trade.plannedRR}:1`" hint="Reward to risk" />
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Chart evidence"
        title="Execution screenshots"
        description="Visual evidence of the setup, entries, and exits recorded during the live trade."
      >
        <div v-if="trade.charts?.length" class="grid gap-4 sm:grid-cols-2">
          <ImagePreviewCard
            v-for="chart in trade.charts"
            :key="chart.id"
            :src="resolveImageUrl(chart.chartUrl)"
            :alt="chart.chartTitle || 'Trade screenshot'"
          />
          <ImagePreviewCard v-if="trade.screenshot" :src="resolveImageUrl(trade.screenshot)" :alt="`${trade.pair} screenshot`" />
        </div>
        <ImagePreviewCard v-else-if="trade.screenshot" :src="resolveImageUrl(trade.screenshot)" :alt="`${trade.pair} screenshot`" />
        <p v-else class="text-sm text-slate-500 italic">No screenshots or chart links provided for this trade.</p>
      </ChartCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <ChartCard
        eyebrow="Checklist"
        title="Rule validation"
        description="This is the execution checklist that keeps the system objective."
      >
        <ChecklistPanel :checklist="trade.checklist" :items="checklistItems" />
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

    <ConfirmDialog
      :open="showDeleteDialog"
      badge="Delete trade"
      title="Delete this trade?"
      :message="`This will permanently remove ${trade.pair} from ${formatLongDate(trade.date)} and cannot be undone.`"
      confirm-text="Delete trade"
      loading-text="Deleting trade..."
      :loading="deleting"
      @cancel="showDeleteDialog = false"
      @confirm="confirmDeleteTrade"
    />
  </div>

  <div v-else class="crs-page">
    <ChartCard eyebrow="Missing trade" title="Trade not found" description="This trade could not be found in your current CRS ledger.">
      <router-link to="/trades" class="crs-button-primary">Return to trade list</router-link>
    </ChartCard>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import ChartCard from '@/components/crs/ChartCard.vue'
import ChecklistPanel from '@/components/crs/ChecklistPanel.vue'
import ConfirmDialog from '@/components/crs/ConfirmDialog.vue'
import ImagePreviewCard from '@/components/crs/ImagePreviewCard.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import ResultBadge from '@/components/crs/ResultBadge.vue'
import { useCrsStore } from '@/stores/crs'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const crsStore = useCrsStore()
const deleting = ref(false)
const showDeleteDialog = ref(false)

const trade = computed(() => crsStore.getTradeById(route.params.id))
const checklistItems = computed(() => crsStore.settings.checklistItems || [])

function resolveImageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  
  // Clean up relative path and prefix with API base URL
  const baseUrl = api.defaults.baseURL.replace('/api', '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  let url = `${baseUrl}${cleanPath}`
  
  // Add authentication token as query parameter for image access
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    const separator = url.includes('?') ? '&' : '?'
    url = `${url}${separator}token=${encodeURIComponent(token)}`
  }
  
  return url
}

function formatPrice(value) {
  return value >= 100 ? value.toFixed(2) : value.toFixed(4)
}

function formatLongDate(value) {
  return format(parseISO(value), 'MMMM d, yyyy')
}

function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  return format(parseISO(value), 'MMM d, yyyy HH:mm')
}

function formatHoldingTime(tradeRecord) {
  if (!tradeRecord?.openTime || !tradeRecord?.closeTime) {
    return '—'
  }

  const start = parseISO(tradeRecord.openTime)
  const end = parseISO(tradeRecord.closeTime)
  const durationMs = end.getTime() - start.getTime()

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return '—'
  }

  const totalMinutes = Math.floor(durationMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours && minutes) {
    return `${hours}h ${minutes}m`
  }

  if (hours) {
    return `${hours}h`
  }

  return `${minutes}m`
}

function currency(value) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: crsStore.settings.currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(value))

  return value < 0 ? `-${amount}` : amount
}

async function removeTrade() {
  if (!trade.value || deleting.value) {
    return
  }
  showDeleteDialog.value = true
}

async function confirmDeleteTrade() {
  if (!trade.value || deleting.value) {
    return
  }
  deleting.value = true

  try {
    await crsStore.deleteTrade(trade.value.id)
    showDeleteDialog.value = false
    router.push('/trades')
  } finally {
    deleting.value = false
  }
}
</script>
