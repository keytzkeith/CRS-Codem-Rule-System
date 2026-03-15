<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Trade capture"
        :title="isEditing ? 'Edit trade' : 'Record a new trade'"
        description="Compact, rule-based entry flow. Save once and the dashboard, trades list, journal, and analytics update from the same mock store."
      >
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <router-link to="/trades" class="crs-button crs-button-ghost w-full sm:w-auto">Back</router-link>
          <button type="button" class="crs-button-primary w-full sm:w-auto" @click="submitTrade">
            {{ isEditing ? 'Save changes' : 'Save trade' }}
          </button>
        </div>
      </SectionHeader>
    </section>

    <form class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]" @submit.prevent="submitTrade">
      <div class="space-y-6">
        <ChartCard eyebrow="Execution" title="Trade facts" description="Core execution numbers and tags for the trade ledger.">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Date <InfoTip text="Trading date used across the dashboard, journal, and calendar analytics." /></span>
              <input v-model="form.date" type="date" class="crs-input" placeholder="2026-03-15" required />
            </label>
            <label class="crs-filter-field">
              <span class="flex items-center gap-2">Pair <InfoTip text="Instrument or symbol traded, such as EURUSD, XAUUSD, or NAS100." /></span>
              <input v-model="form.pair" type="text" class="crs-input" placeholder="EURUSD" required />
            </label>
            <label class="crs-filter-field">
              <span>Direction</span>
              <select v-model="form.direction" class="crs-input">
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </label>
            <label class="crs-filter-field">
              <span>Session</span>
              <select v-model="form.session" class="crs-input">
                <option v-for="session in sessionOptions" :key="session" :value="session">{{ session }}</option>
              </select>
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
              <span class="flex items-center gap-2">Result in R <InfoTip text="Your realized trade result in units of risk. CRS multiplies this by your active risk amount to compute currency PnL." /></span>
              <input v-model.number="form.resultR" type="number" step="0.1" class="crs-input" placeholder="1.8" required />
            </label>
            <label class="crs-filter-field md:col-span-2">
              <span>Result amount</span>
              <div class="relative">
                <span class="crs-field-prefix">{{ currencySymbol }}</span>
                <input :value="resultAmount.toFixed(2)" type="text" class="crs-input crs-input-prefixed" readonly />
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
              v-for="item in checklistFields"
              :key="item.key"
              class="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
            >
              <span>{{ item.label }}</span>
              <input v-model="form.checklist[item.key]" type="checkbox" class="h-4 w-4 rounded border-white/10 bg-transparent text-amber-200" />
            </label>
          </div>
        </ChartCard>

        <ChartCard eyebrow="Screenshot" title="Image preview" description="Mock-first URL input for chart evidence until uploads are wired to the backend.">
          <div class="space-y-4">
            <label class="crs-filter-field">
              <span>Screenshot URL</span>
              <input v-model="form.screenshot" type="url" class="crs-input" placeholder="https://..." />
            </label>
            <ImagePreviewCard :src="form.screenshot" alt="Trade screenshot preview" />
          </div>
        </ChartCard>

        <ChartCard eyebrow="Summary" title="Auto-read" description="Live summary so the record feels precise before saving.">
          <div class="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Status" :value="statusLabel" :tone="statusTone" hint="Derived from result in R" />
            <MetricCard label="Planned RR" :value="plannedRR" hint="From entry, stop, and target" info="Calculated from the distance between entry, stop loss, and take profit." />
            <MetricCard label="Risk per trade" :value="currency(riskAmount)" hint="From settings" tone="warning" info="This is the live risk amount from settings, adjusted by the selected account if risk mode uses percentages." />
            <MetricCard label="Result amount" :value="currency(resultAmount)" :tone="resultAmount >= 0 ? 'positive' : 'negative'" hint="Calculated automatically" info="Computed as result in R multiplied by the current active risk amount." />
            <MetricCard label="Plan-followed" :value="form.journal.followedPlan ? 'Yes' : 'No'" hint="Journal switch" />
          </div>
        </ChartCard>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChartCard from '@/components/crs/ChartCard.vue'
import ImagePreviewCard from '@/components/crs/ImagePreviewCard.vue'
import InfoTip from '@/components/crs/InfoTip.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import TagPicker from '@/components/crs/TagPicker.vue'
import { useCrsStore } from '@/stores/crs'
import { calculatePlannedRR } from '@/utils/crsAnalytics'

const route = useRoute()
const router = useRouter()
const crsStore = useCrsStore()

const existingTrade = route.params.id ? crsStore.getTradeById(route.params.id) : null
const isEditing = computed(() => Boolean(existingTrade))

const sessionOptions = ['London', 'New York', 'Asia']
const checklistFields = [
  { key: 'htfBosConfirmed', label: 'HTF BOS confirmed' },
  { key: 'pullbackToOb', label: 'Pullback to OB' },
  { key: 'm15Confirmation', label: 'M15 confirmation' },
  { key: 'tradedWithBias', label: 'Traded with bias' },
  { key: 'validSession', label: 'Valid session' },
  { key: 'minimumRRMet', label: 'RR >= 1:2' }
]

const form = reactive(buildForm(existingTrade))
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
const resultAmount = computed(() => Number((form.resultR * riskAmount.value).toFixed(2)))

function submitTrade() {
  const savedTrade = crsStore.saveTrade({
    id: existingTrade?.id,
    ...form,
    accountName: selectedAccount.value?.name || '',
    setupType: form.setupTypes[0] || 'Custom',
    setupStack: form.setupTypes,
    resultAmount: resultAmount.value
  })

  router.push(`/trades/${savedTrade.id}`)
}

function buildForm(trade) {
  if (!trade) {
    return {
      date: new Date().toISOString().slice(0, 10),
      pair: '',
      direction: 'Long',
      setupTypes: ['OB retest'],
      session: 'London',
      accountId: crsStore.settings.activeAccountId,
      entry: 0,
      stopLoss: 0,
      takeProfit: 0,
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
      checklist: {
        htfBosConfirmed: false,
        pullbackToOb: false,
        m15Confirmation: false,
        tradedWithBias: false,
        validSession: false,
        minimumRRMet: false
      }
    }
  }

  return {
    date: trade.date,
    pair: trade.pair,
    direction: trade.direction,
    setupTypes: trade.setupStack?.length ? [...trade.setupStack] : [trade.setupType],
    session: trade.session,
    accountId: trade.accountId || crsStore.settings.activeAccountId,
    entry: trade.entry,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    resultR: trade.resultR,
    resultAmount: trade.resultAmount,
    tags: [...trade.tags],
    screenshot: trade.screenshot || '',
    journal: {
      ...trade.journal
    },
    checklist: {
      ...trade.checklist
    }
  }
}

function currency(value) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: activeCurrency.value,
    maximumFractionDigits: 0
  }).format(Math.abs(value))

  return value < 0 ? `-${amount}` : amount
}
</script>
