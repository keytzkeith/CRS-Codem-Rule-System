<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Trade archive"
        title="Every execution, filtered by intent."
        description="Search the full trade ledger by pair, session, setup, outcome, and date so review stays quick and honest."
      >
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <router-link :to="accountRequiredRoute('/trades/new')" class="crs-button-primary w-full sm:w-auto text-center">Add trade</router-link>
          <router-link :to="accountRequiredRoute('/trades/import')" class="crs-button crs-button-ghost w-full sm:w-auto">Import CSV</router-link>
          <button type="button" class="crs-button crs-button-ghost w-full sm:w-auto" :disabled="exporting" @click="exportTrades">
            {{ exporting ? 'Exporting...' : 'Export CSV' }}
          </button>
        </div>
      </SectionHeader>
    </section>

    <div v-if="importError" class="rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      {{ importError }}
    </div>

    <ChartCard
      eyebrow="Filter stack"
      title="Search and narrow the tape"
      description="Use the same CRS source of truth that powers the dashboard and analytics."
    >
      <TradeFiltersBar
        :model-value="filters"
        :options="filterOptions"
        @update:modelValue="applyFilters"
        @create-tag="crsStore.addTag"
        @create-setup="crsStore.addSetupType"
      />
    </ChartCard>

    <section class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <ChartCard
        eyebrow="Filtered overview"
        title="Result snapshot"
        description="The table and these cards update off the same active filter set."
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Matching trades" :value="String(filteredTrades.length)" hint="Rows in current result set" />
          <MetricCard label="Net result" :value="currency(filteredPnl)" :tone="filteredPnl >= 0 ? 'positive' : 'negative'" hint="Filtered only" />
          <MetricCard label="Win rate" :value="`${filteredWinRate}%`" hint="Based on current filter stack" tone="positive" />
          <MetricCard label="Plan-followed" :value="`${planFollowRate}%`" hint="Discipline inside filtered set" />
          <MetricCard label="Volume traded" :value="formatVolume(filteredVolume)" hint="Sum of size" />
          <MetricCard label="Net pips / points" :value="String(filteredPips)" :tone="filteredPips >= 0 ? 'positive' : 'negative'" hint="Signed move total" />
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Setup tags"
        title="Most common setups in view"
        description="A quick read on the setups represented in the current result set."
      >
        <div class="flex flex-wrap gap-3">
          <span
            v-for="tag in visibleTags"
            :key="tag.label"
            class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
          >
            {{ tag.label }} · {{ tag.count }}
          </span>
        </div>
      </ChartCard>
    </section>

    <ChartCard
      eyebrow="Trade table"
      title="Responsive trade ledger"
      description="Tap or click any row to open the combined trade detail and journal review."
    >
      <TradesTable :trades="filteredTrades" @select="openTrade" />
    </ChartCard>

    <div class="flex justify-end">
      <button
        type="button"
        class="crs-button-danger w-full sm:w-auto"
        :disabled="crsStore.tradesLoading || !accountTradeCount"
        @click="deleteAllTrades"
      >
        {{ crsStore.tradesLoading ? 'Deleting...' : `Delete all trades (${accountTradeCount})` }}
      </button>
    </div>

    <ConfirmDialog
      :open="showDeleteAllDialog"
      badge="Delete all trades"
      title="Delete every recorded trade?"
      :message="deleteAllMessage"
      confirm-text="Delete all trades"
      loading-text="Deleting trades..."
      :loading="crsStore.tradesLoading"
      @cancel="showDeleteAllDialog = false"
      @confirm="confirmDeleteAllTrades"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ChartCard from '@/components/crs/ChartCard.vue'
import ConfirmDialog from '@/components/crs/ConfirmDialog.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import TradeFiltersBar from '@/components/crs/TradeFiltersBar.vue'
import TradesTable from '@/components/crs/TradesTable.vue'
import { useCrsStore } from '@/stores/crs'
import { exportTradesToCsv } from '@/utils/crsCsv'

const router = useRouter()
const crsStore = useCrsStore()
const exporting = ref(false)
const importError = ref('')
const showDeleteAllDialog = ref(false)

const filters = reactive({
  query: '',
  pair: '',
  session: '',
  setupType: '',
  setupTypes: [],
  tags: [],
  status: '',
  startDate: '',
  endDate: ''
})

const filterOptions = computed(() => crsStore.filterOptions)
const filteredTrades = computed(() => crsStore.filterTrades(filters))
const filteredPnl = computed(() => filteredTrades.value.reduce((sum, trade) => sum + trade.resultAmount, 0))
const filteredVolume = computed(() => filteredTrades.value.reduce((sum, trade) => sum + Number(trade.volume || 0), 0))
const filteredPips = computed(() => {
  const sum = filteredTrades.value.reduce((total, trade) => {
    return total + (trade.pips !== null && trade.pips !== undefined ? Number(trade.pips) : 0)
  }, 0)
  return Number(sum.toFixed(1))
})
const filteredWinRate = computed(() => {
  if (!filteredTrades.value.length) {
    return 0
  }

  return ((filteredTrades.value.filter((trade) => trade.resultAmount > 0).length / filteredTrades.value.length) * 100).toFixed(1)
})
const planFollowRate = computed(() => {
  if (!filteredTrades.value.length) {
    return 0
  }

  return (
    (filteredTrades.value.filter((trade) => trade.journal?.followedPlan).length / filteredTrades.value.length) *
    100
  ).toFixed(1)
})

const visibleTags = computed(() =>
  Object.entries(
    filteredTrades.value.reduce((acc, trade) => {
      ;(trade.setupStack?.length ? trade.setupStack : [trade.setupType]).forEach((setup) => {
        acc[setup] = (acc[setup] || 0) + 1
      })
      return acc
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
)
const accountTradeCount = computed(() => crsStore.trades.length)
const activeAccountName = computed(() => {
  const activeId = crsStore.settings.activeAccountId
  return crsStore.settings.accounts?.find((account) => account.id === activeId)?.name || ''
})
const deleteAllMessage = computed(() => {
  const scope = activeAccountName.value ? `"${activeAccountName.value}"` : 'the current ledger'
  return `This will permanently remove all ${accountTradeCount.value} trades from ${scope}. This cannot be undone.`
})

function openTrade(trade) {
  router.push(`/trades/${trade.id}`)
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

function formatVolume(value) {
  return Number(value || 0).toFixed(2)
}

function accountRequiredRoute(target) {
  return crsStore.settings.accounts?.length ? target : '/accounts'
}

function applyFilters(nextFilters) {
  Object.assign(filters, nextFilters)
}

async function exportTrades() {
  exporting.value = true
  importError.value = ''

  try {
    const csv = exportTradesToCsv(filteredTrades.value)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `crs-trades-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    importError.value = error?.response?.data?.error || 'Unable to export trades right now.'
  } finally {
    exporting.value = false
  }
}

async function deleteAllTrades() {
  if (!accountTradeCount.value) {
    return
  }

  showDeleteAllDialog.value = true
}

async function confirmDeleteAllTrades() {
  try {
    await crsStore.deleteAllTrades()
    showDeleteAllDialog.value = false
  } catch (error) {
    importError.value = error?.response?.data?.error || 'Unable to delete all trades right now.'
  }
}
</script>
