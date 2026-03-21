<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Trade capture"
        :title="isEditing ? 'Edit trade' : 'Record a new trade'"
        description="Compact, rule-based entry flow. Save once and the dashboard, trades list, journal, and analytics update from the same CRS record."
      >
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <router-link to="/trades" class="crs-button crs-button-ghost w-full sm:w-auto">Back</router-link>
          <button type="submit" class="crs-button-primary w-full sm:w-auto" :disabled="crsStore.tradesLoading || !accounts.length" form="crs-trade-form">
            {{ crsStore.tradesLoading ? 'Saving...' : isEditing ? 'Save changes' : 'Save trade' }}
          </button>
        </div>
      </SectionHeader>
    </section>

    <ChartCard
      v-if="!accounts.length"
      eyebrow="Account required"
      title="Create an account before recording trades."
      description="CRS needs an account context for balance-based risk, imports, and equity analytics."
    >
      <router-link to="/accounts" class="crs-button-primary w-full sm:w-auto">Go to accounts</router-link>
    </ChartCard>

    <form v-else id="crs-trade-form" class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]" @submit.prevent="submitTrade">
      <div class="space-y-6">
        <div
          v-if="saveError"
          class="rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          {{ saveError }}
        </div>
        <ChartCard eyebrow="Execution" title="Trade facts" description="Core execution numbers and tags for the trade ledger.">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Date <InfoTip text="Trading date used across the dashboard, journal, and calendar analytics." /></span>
              <input v-model="form.date" type="date" class="crs-input" placeholder="2026-03-15" required />
            </label>
            <label class="crs-filter-field">
              <span>Open time</span>
              <input v-model="form.openTime" type="datetime-local" class="crs-input" step="1" />
            </label>
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Pair <InfoTip text="Instrument or symbol traded, such as EURUSD, XAUUSD, or NAS100." /></span>
              <input v-model="form.pair" type="text" class="crs-input" placeholder="EURUSD" required />
            </label>
            <label class="crs-filter-field">
              <span>Close time</span>
              <input v-model="form.closeTime" type="datetime-local" class="crs-input" step="1" />
            </label>
            <label class="crs-filter-field">
              <span>Direction</span>
              <select v-model="form.direction" class="crs-input">
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </label>
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Session <InfoTip text="Derived automatically from trade time using Kenyan time (Africa/Nairobi). Asia runs before 10:00, London from 10:00 to 15:59, and New York from 16:00 onward." /></span>
              <input :value="form.session" type="text" class="crs-input" readonly />
            </label>
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Account <InfoTip text="The selected account determines which balance is used for percentage-based risk calculations." /></span>
              <select v-model="form.accountId" class="crs-input">
                <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
              </select>
            </label>
            <div class="md:col-span-2">
              <label class="crs-filter-field">
                <span class="flex items-center gap-2">Setup stack <InfoTip text="Use one or more setup conditions. Each selected setup contributes to setup-quality analytics." /></span>
              </label>
              <TagPicker
                v-model="form.setupTypes"
                :options="availableSetupTypes"
                placeholder="Add a setup condition"
                @create-tag="crsStore.addSetupType"
              />
            </div>
            <div class="md:col-span-2">
              <label class="crs-filter-field">
                <span class="flex items-center gap-2">Tags <InfoTip text="Reusable labels for context like session behavior, execution quality, or mistakes." /></span>
              </label>
              <TagPicker v-model="form.tags" :options="availableTags" placeholder="Add a reusable tag" @create-tag="crsStore.addTag" />
            </div>
            <label class="crs-filter-field">
              <span>Entry</span>
              <input v-model.number="form.entry" type="number" step="0.0001" class="crs-input" placeholder="1.08240" required />
            </label>
            <label class="crs-filter-field">
              <span>Stop loss</span>
              <input v-model.number="form.stopLoss" type="number" step="0.0001" class="crs-input" placeholder="1.08060" required />
            </label>
            <label class="crs-filter-field">
              <span>Take profit</span>
              <input v-model.number="form.takeProfit" type="number" step="0.0001" class="crs-input" placeholder="1.08720" required />
            </label>
            <label class="crs-filter-field">
              <span>Volume traded</span>
              <input v-model.number="form.volume" type="number" step="0.01" class="crs-input" placeholder="0.04" required />
            </label>
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Close price <InfoTip text="Use the actual close price, not just the target. CRS calculates the realized R multiple from entry, stop loss, and this close price." /></span>
              <input v-model.number="form.closePrice" type="number" step="0.0001" class="crs-input" placeholder="1.08412" required />
            </label>
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Contract multiplier <InfoTip text="CRS auto-detects a multiplier by symbol, but you can override it for metals, indices, or broker-specific contract sizing." /></span>
              <input v-model.number="form.contractMultiplier" type="number" step="0.01" class="crs-input" placeholder="100" required />
            </label>
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Result in R <InfoTip text="Calculated automatically from entry, stop loss, direction, and close price. This uses 3 decimal places to avoid masking small differences." /></span>
              <input :value="formatRValue(form.resultR)" type="text" class="crs-input" readonly />
            </label>
            <label class="crs-filter-field">
              <span>Commission</span>
              <div class="relative">
                <span class="crs-field-prefix">{{ currencySymbol }}</span>
                <input v-model.number="form.commission" type="number" step="0.01" class="crs-input crs-input-prefixed" placeholder="0.00" />
              </div>
            </label>
            <label class="crs-filter-field">
              <span>Swap / fees</span>
              <div class="relative">
                <span class="crs-field-prefix">{{ currencySymbol }}</span>
                <input v-model.number="form.swap" type="number" step="0.01" class="crs-input crs-input-prefixed" placeholder="0.00" />
              </div>
            </label>
            <label class="crs-filter-field md:col-span-2">
              <span>Result amount</span>
              <div class="relative">
                <span class="crs-field-prefix">{{ currencySymbol }}</span>
                <input
                  v-model.number="form.resultAmount"
                  type="number"
                  step="0.01"
                  class="crs-input crs-input-prefixed"
                  placeholder="0.00"
                  @input="resultAmountDirty = true"
                />
              </div>
              <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>Estimated from price and size: {{ currency(estimatedResultAmount) }}</span>
                <button
                  type="button"
                  class="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-amber-200/40 hover:text-amber-100"
                  @click="applyEstimatedResultAmount"
                >
                  Use estimate
                </button>
              </div>
            </label>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Journal" title="Trade review" description="Short prompts so the journaling stays practical.">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="crs-filter-field md:col-span-2">
              <span>Why I took the trade</span>
              <textarea v-model="form.journal.whyTaken" class="crs-input min-h-[108px]" placeholder="London sell-side sweep into bearish order block with M15 confirmation." />
            </label>
            <label class="crs-filter-field">
              <span>HTF bias</span>
              <input v-model="form.journal.htfBias" type="text" class="crs-input" placeholder="Bearish after 4H BOS" />
            </label>
            <label class="crs-filter-field">
              <span>Entry model</span>
              <input v-model="form.journal.entryModel" type="text" class="crs-input" placeholder="Sweep + OB retest" />
            </label>
            <label class="crs-filter-field">
              <span>Emotion before</span>
              <input v-model="form.journal.emotionBefore" type="text" class="crs-input" placeholder="Calm and selective" />
            </label>
            <label class="crs-filter-field">
              <span>Emotion after</span>
              <input v-model="form.journal.emotionAfter" type="text" class="crs-input" placeholder="Satisfied with execution" />
            </label>
            <label class="crs-filter-field">
              <span>Mistake made</span>
              <input v-model="form.journal.mistakeMade" type="text" class="crs-input" placeholder="Moved to breakeven too early" />
            </label>
            <label class="crs-filter-field">
              <span>Lesson learned</span>
              <input v-model="form.journal.lessonLearned" type="text" class="crs-input" placeholder="Wait for the first objective before protecting aggressively" />
            </label>
            <label class="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300 md:col-span-2">
              <span>Followed plan</span>
              <input v-model="form.journal.followedPlan" type="checkbox" class="h-4 w-4 rounded border-white/10 bg-transparent text-amber-200" />
            </label>
            <label class="crs-filter-field md:col-span-2">
              <span>Notes</span>
              <textarea v-model="form.journal.notes" class="crs-input min-h-[128px]" placeholder="Strong displacement and clean session timing. Runner management can improve." />
            </label>
          </div>
        </ChartCard>
      </div>

      <div class="space-y-6">
        <ChartCard eyebrow="Checklist" title="Rule validation" description="Tick the rule-based conditions that were actually present.">
          <div class="grid gap-3">
            <label
              v-for="item in checklistItems"
              :key="item.id"
              class="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
            >
              <span>{{ item.label }}</span>
              <input v-model="form.checklist[item.id]" type="checkbox" class="h-4 w-4 rounded border-white/10 bg-transparent text-amber-200" />
            </label>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Evidence" title="Trade images" description="Upload charts or execution screenshots to document this setup.">
          <div class="grid gap-6">
            <div class="space-y-4">
              <label class="crs-filter-field">
                <span class="flex items-center gap-2">Image link (Optional) <InfoTip text="Paste a TradingView snapshot link, Lightshot URL, or any direct image link. This will be shown alongside your uploaded images." /></span>
                <input
                  v-model="form.screenshot"
                  type="text"
                  placeholder="https://www.tradingview.com/x/..."
                  class="crs-input"
                />
              </label>
              
              <!-- Immediate preview for the link -->
              <div v-if="form.screenshot" class="space-y-2">
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Link Preview</p>
                <ImagePreviewCard :src="resolveImageUrl(form.screenshot)" :alt="`${form.pair || 'Trade'} screenshot preview`" />
              </div>
            </div>

            <div class="border-t border-white/5 pt-6">
              <p class="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">File Uploads</p>
              <ImageUpload ref="imageUploadRef" :trade-id="existingTrade?.id" />
            </div>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Summary" title="Auto-read" description="Live summary so the record feels precise before saving.">
          <div class="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Status" :value="statusLabel" :tone="statusTone" hint="Derived from result in R" />
            <MetricCard label="Planned RR" :value="plannedRR" hint="From entry, stop, and target" info="Calculated from the distance between entry, stop loss, and take profit." />
            <MetricCard label="Risk per trade" :value="currency(riskAmount)" hint="From settings" tone="warning" info="This is the live risk amount from settings, adjusted by the selected account if risk mode uses percentages." />
            <MetricCard label="Actual risk" :value="currency(actualRiskAmount)" hint="From stop and volume" tone="warning" info="Calculated from stop-loss distance, volume, and contract multiplier. This is the true amount placed at risk on the trade." />
            <MetricCard label="Risk of account" :value="`${riskPercentOfAccount.toFixed(3)}%`" hint="Consistency check" info="Shows the actual percentage of the selected account risked on this trade so you can compare it to your usual standard." />
            <MetricCard label="Pips / points" :value="String(pipsMoved)" hint="Move captured" info="The signed move from entry to close converted using the inferred or overridden pip size." />
            <MetricCard label="Result amount" :value="currency(form.resultAmount)" :tone="form.resultAmount >= 0 ? 'positive' : 'negative'" hint="Broker or manual net result" info="Use the actual broker net PnL when you have it. The estimate above is only a quick helper." />
            <MetricCard label="Plan-followed" :value="form.journal.followedPlan ? 'Yes' : 'No'" hint="Journal switch" />
          </div>
        </ChartCard>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChartCard from '@/components/crs/ChartCard.vue'
import ImagePreviewCard from '@/components/crs/ImagePreviewCard.vue'
import InfoTip from '@/components/crs/InfoTip.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import TagPicker from '@/components/crs/TagPicker.vue'
import ImageUpload from '@/components/trades/ImageUpload.vue'
import { useCrsStore } from '@/stores/crs'
import {
  calculateActualRiskAmount,
  calculateNetPnl,
  calculatePlannedRR,
  calculatePipsMoved,
  calculateResultR,
  calculateRiskPercentOfAccount,
  inferContractMultiplier,
  inferPipSize
} from '@/utils/crsAnalytics'
import { DEFAULT_SESSION_TIMEZONE, deriveSessionLabel } from '@/utils/crsSessions'

const route = useRoute()
const router = useRouter()
const crsStore = useCrsStore()
const saveError = ref('')
const imageUploadRef = ref(null)

const existingTrade = computed(() => (route.params.id ? crsStore.getTradeById(route.params.id) : null))
const isEditing = computed(() => Boolean(existingTrade.value))

const form = reactive(buildForm(existingTrade.value))
const resultAmountDirty = ref(hasStoredResultAmount(existingTrade.value))
const checklistItems = computed(() => crsStore.settings.checklistItems || [])
const availableSetupTypes = computed(() => crsStore.availableSetupTypes)
const availableTags = computed(() => crsStore.availableTags)
const accounts = computed(() => crsStore.settings.accounts || [])
const selectedAccount = computed(() => accounts.value.find((account) => account.id === form.accountId) || accounts.value[0] || null)
const riskAmount = computed(() => {
  if (!selectedAccount.value) {
    return crsStore.riskAmount
  }

  if (crsStore.settings.riskMode === 'percent') {
    return Number((selectedAccount.value.size * ((Number(crsStore.settings.riskPerTrade || 0)) / 100)).toFixed(2))
  }

  return Number(Number(crsStore.settings.riskPerTrade || 0).toFixed(2))
})
const activeCurrency = computed(() => crsStore.settings.currency || 'USD')
const currencySymbol = computed(() => (activeCurrency.value === 'USD' ? '$' : activeCurrency.value))

const statusLabel = computed(() => (form.resultR > 0 ? 'Win' : form.resultR < 0 ? 'Loss' : 'Breakeven'))
const statusTone = computed(() => (form.resultR > 0 ? 'positive' : form.resultR < 0 ? 'negative' : 'warning'))
const plannedRR = computed(() => `${calculatePlannedRR({
  entry: form.entry,
  stopLoss: form.stopLoss,
  takeProfit: form.takeProfit
})}:1`)
const estimatedResultAmount = computed(() => calculateNetPnl({
  entry: form.entry,
  closePrice: form.closePrice,
  direction: form.direction,
  volume: form.volume,
  contractMultiplier: form.contractMultiplier,
  commission: form.commission,
  swap: form.swap
}))
const actualRiskAmount = computed(() => calculateActualRiskAmount({
  entry: form.entry,
  stopLoss: form.stopLoss,
  volume: form.volume,
  contractMultiplier: form.contractMultiplier
}))
const calculatedResultR = computed(() => {
  return calculateResultR({
    entry: form.entry,
    stopLoss: form.stopLoss,
    closePrice: form.closePrice,
    direction: form.direction
  })
})
const riskPercentOfAccount = computed(() => calculateRiskPercentOfAccount({
  entry: form.entry,
  stopLoss: form.stopLoss,
  volume: form.volume,
  contractMultiplier: form.contractMultiplier
}, selectedAccount.value?.size))
const pipsMoved = computed(() => calculatePipsMoved({
  pair: form.pair,
  entry: form.entry,
  closePrice: form.closePrice,
  direction: form.direction,
  pipSize: form.pipSize
}))

watch(
  existingTrade,
  (nextTrade) => {
    Object.assign(form, buildForm(nextTrade))
    resultAmountDirty.value = hasStoredResultAmount(nextTrade)
  },
  { immediate: false }
)

watch(
  [() => form.entry, () => form.stopLoss, () => form.closePrice, () => form.direction],
  () => {
    form.resultR = calculatedResultR.value
  },
  { immediate: true }
)

watch(
  [() => form.entry, () => form.closePrice, () => form.direction, () => form.volume, () => form.contractMultiplier, () => form.commission, () => form.swap],
  () => {
    if (!resultAmountDirty.value) {
      form.resultAmount = estimatedResultAmount.value
    }
  },
  { immediate: true }
)

watch(
  [() => form.openTime, () => form.closeTime, () => form.date],
  () => {
    form.session = deriveSessionLabel(form.openTime || form.closeTime || form.date, form.session || 'London', crsStore.settings.timezone || DEFAULT_SESSION_TIMEZONE)
  },
  { immediate: true }
)

watch(
  () => form.pair,
  (nextPair) => {
    if (!nextPair) {
      return
    }

    if (!existingTrade.value || !existingTrade.value.contractMultiplier) {
      form.contractMultiplier = inferContractMultiplier(nextPair)
    }

    if (!existingTrade.value || !existingTrade.value.pipSize) {
      form.pipSize = inferPipSize(nextPair)
    }
  },
  { immediate: true }
)

async function submitTrade() {
  saveError.value = ''

  if (!accounts.value.length || !form.accountId) {
    router.push('/accounts')
    return
  }

  form.date = (form.openTime || form.closeTime || form.date).slice(0, 10)

  try {
    const savedTrade = await crsStore.persistTrade({
      id: existingTrade.value?.id,
      ...form,
      accountName: selectedAccount.value?.name || '',
      setupType: form.setupTypes[0] || 'Custom',
      setupStack: form.setupTypes,
      volume: form.volume,
      openTime: form.openTime,
      closeTime: form.closeTime,
      contractMultiplier: form.contractMultiplier,
      pipSize: form.pipSize,
      commission: form.commission,
      swap: form.swap,
      actualRiskAmount: actualRiskAmount.value,
      riskPercentOfAccount: riskPercentOfAccount.value,
      pips: pipsMoved.value,
      resultAmount: Number(form.resultAmount || 0),
      resultR: form.resultR
    })

    // If there are images to upload, flush them now
    if (imageUploadRef.value && imageUploadRef.value.selectedFiles.length > 0) {
      await imageUploadRef.value.flushPendingImages(savedTrade.id)
    }

    router.push(`/trades/${savedTrade.id}`)
  } catch (error) {
    saveError.value = formatTradeSaveError(error)
  }
}

function buildForm(trade) {
  if (!trade) {
    const seedDateTime = `${new Date().toISOString().slice(0, 16)}`
    return {
      date: seedDateTime.slice(0, 10),
      openTime: seedDateTime,
      closeTime: '',
      pair: '',
      direction: 'Long',
      setupTypes: ['OB retest'],
      session: deriveSessionLabel(seedDateTime, 'London', crsStore.settings.timezone || DEFAULT_SESSION_TIMEZONE),
      accountId: crsStore.settings.activeAccountId,
      volume: 1,
      contractMultiplier: 1,
      pipSize: 0.01,
      commission: 0,
      swap: 0,
      entry: 0,
      stopLoss: 0,
      takeProfit: 0,
      closePrice: 0,
      resultR: 0,
      resultAmount: 0,
      tags: [],
      screenshot: '',
      journal: {
        whyTaken: '',
        htfBias: '',
        entryModel: '',
        followedPlan: true,
        emotionBefore: '',
        emotionAfter: '',
        mistakeMade: '',
        lessonLearned: '',
        notes: ''
      },
      checklist: buildChecklistState()
    }
  }

  return {
    date: trade.openTime?.slice(0, 10) || trade.date,
    openTime: trade.openTime?.slice(0, 16) || `${trade.date}T00:00`,
    closeTime: trade.closeTime?.slice(0, 16) || '',
    pair: trade.pair,
    direction: trade.direction,
    setupTypes: trade.setupStack?.length ? [...trade.setupStack] : [trade.setupType],
    session: deriveSessionLabel(trade.openTime || trade.closeTime || trade.date, trade.session || 'London', crsStore.settings.timezone || DEFAULT_SESSION_TIMEZONE),
    accountId: trade.accountId || crsStore.settings.activeAccountId,
    volume: trade.volume || 1,
    contractMultiplier: trade.contractMultiplier || inferContractMultiplier(trade.pair),
    pipSize: trade.pipSize || inferPipSize(trade.pair),
    commission: trade.commission || 0,
    swap: trade.swap || 0,
    entry: trade.entry,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    closePrice: trade.closePrice || trade.entry,
    resultR: trade.resultR,
    resultAmount: Number(trade.resultAmount || 0),
    tags: [...trade.tags],
    screenshot: trade.screenshot || '',
    journal: {
      ...trade.journal
    },
    checklist: buildChecklistState(trade.checklist)
  }
}

function currency(value) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: activeCurrency.value,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(value))

  return value < 0 ? `-${amount}` : amount
}

function applyEstimatedResultAmount() {
  form.resultAmount = estimatedResultAmount.value
  resultAmountDirty.value = false
}

function hasStoredResultAmount(trade) {
  return Number.isFinite(Number(trade?.resultAmount))
}

function formatTradeSaveError(error) {
  if (error?.code === 'DUPLICATE_TRADE') {
    return error.message
  }

  const backendMessage = error?.response?.data?.error

  if (backendMessage) {
    return backendMessage
  }

  if (!error?.response) {
    return 'Unable to reach the backend. Check that the API server is running and try again.'
  }

  if (error.response.status >= 500) {
    return 'Server error while saving the trade. Check the backend logs and try again.'
  }

  return 'Unable to save the trade with the current values.'
}

function buildChecklistState(existing = {}) {
  return (crsStore.settings.checklistItems || []).reduce((acc, item) => {
    acc[item.id] = Boolean(existing[item.id])
    return acc
  }, {})
}

function formatRValue(value) {
  return `${Number(value || 0).toFixed(3)}R`
}
</script>
