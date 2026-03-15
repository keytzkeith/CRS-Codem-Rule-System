<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Trade archive"
        title="Every execution, filtered by intent."
        description="Search the full mock trade ledger by pair, session, setup, outcome, and date so review stays quick and honest."
      >
        <router-link to="/trades/new" class="crs-button-primary">Add trade</router-link>
      </SectionHeader>
    </section>

    <ChartCard
      eyebrow="Filter stack"
      title="Search and narrow the tape"
      description="Use the same mock source of truth that powers the dashboard and analytics."
    >
      <TradeFiltersBar
        v-model="filters"
        :options="filterOptions"
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
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Setup tags"
        title="Most common setups in view"
        description="The page stays practical by surfacing what the current slice is actually made of."
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
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import ChartCard from '@/components/crs/ChartCard.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import TradeFiltersBar from '@/components/crs/TradeFiltersBar.vue'
import TradesTable from '@/components/crs/TradesTable.vue'
import { useCrsStore } from '@/stores/crs'

const router = useRouter()
const crsStore = useCrsStore()

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
    (filteredTrades.value.filter((trade) => trade.journal.followedPlan).length / filteredTrades.value.length) *
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

function openTrade(trade) {
  router.push(`/trades/${trade.id}`)
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
