<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="CRS command deck"
        title="One screen for discipline, expectancy, and review."
        description="A premium personal dashboard built around the trades that actually matter: what you took, how well you followed the plan, and what the data says to repeat."
      >
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <router-link to="/trades" class="crs-button-primary w-full sm:w-auto">Review trades</router-link>
          <router-link to="/journal" class="crs-button crs-button-ghost w-full sm:w-auto">Open journal</router-link>
        </div>
      </SectionHeader>
    </section>

    <section class="crs-stat-grid">
      <MetricCard label="Total trades" :value="String(metrics.totalTrades)" hint="Seeded sample journal" chip="mock data" info="Total number of trades currently included in the dashboard calculations." />
      <MetricCard label="Win rate" :value="`${metrics.winRate}%`" hint="Clean execution rate" tone="positive" info="Percentage of all trades that closed positive." />
      <MetricCard label="Net PnL" :value="currency(metrics.netPnl)" hint="Across all seeded trades" :tone="metrics.netPnl >= 0 ? 'positive' : 'negative'" info="Combined profit and loss across the full current dataset." />
      <MetricCard label="Average win" :value="currency(metrics.avgWin)" hint="Winners only" tone="positive" info="Average currency gain across winning trades only." />
      <MetricCard label="Average loss" :value="currency(metrics.avgLoss)" hint="Losses only" tone="negative" info="Average currency loss across losing trades only." />
      <MetricCard label="Profit factor" :value="String(metrics.profitFactor)" hint="Gross wins / gross losses" tone="warning" info="Gross winning amount divided by gross losing amount. Above 1.0 means gains outweigh losses." />
      <MetricCard label="Average RR" :value="`${metrics.averageRR}:1`" hint="Planned target vs risk" info="Average planned reward-to-risk ratio based on your entry, stop loss, and target levels." />
      <MetricCard label="Current streak" :value="streakText" :hint="streakHint" :tone="metrics.currentStreak.type === 'loss' ? 'negative' : 'positive'" info="The current consecutive run of wins, losses, or breakeven trades from the most recent trade backward." />
      <MetricCard label="Best day" :value="bestDayValue" :hint="bestDayHint" tone="positive" info="The single highest-PnL day in the current dataset." />
      <MetricCard label="Worst day" :value="worstDayValue" :hint="worstDayHint" tone="negative" info="The single lowest-PnL day in the current dataset." />
    </section>

    <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <ChartCard
        eyebrow="Equity pulse"
        title="Equity curve"
        description="A compact line read on how the sample month compounds when rule-following stays high."
      >
        <div v-if="equityPlot.length" class="crs-chart-stage">
        <svg viewBox="0 0 640 260" class="h-64 w-full">
          <defs>
            <linearGradient id="equityLine" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="#f2d7a1" />
              <stop offset="100%" stop-color="#75a9ff" />
            </linearGradient>
            <linearGradient id="equityFill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="#75a9ff" />
              <stop offset="100%" stop-color="#75a9ff" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g>
            <line v-for="line in gridLines" :key="line.y" x1="12" x2="628" :y1="line.y" :y2="line.y" class="crs-chart-grid-line" />
          </g>
          <polygon :points="equityAreaPoints" class="crs-chart-area-fill" />
          <polyline
            fill="none"
            stroke="url(#equityLine)"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="equityPoints"
          />
          <g v-for="point in equityPlot" :key="point.label">
            <circle :cx="point.x" :cy="point.y" r="5" fill="#f2d7a1" class="cursor-pointer" @mouseenter="hoveredEquityPoint = point" @mouseleave="hoveredEquityPoint = null" />
            <circle :cx="point.x" :cy="point.y" r="16" fill="transparent" class="cursor-pointer" @mouseenter="hoveredEquityPoint = point" @mouseleave="hoveredEquityPoint = null" />
          </g>
          <g v-for="line in gridLines" :key="line.label">
            <text x="8" :y="line.y - 4" text-anchor="start" class="crs-chart-axis-label">{{ currency(line.value) }}</text>
          </g>
        </svg>
        <div
          v-if="hoveredEquityPoint"
          class="crs-chart-hover-card"
          :style="{ left: `${hoveredEquityPoint.x / 640 * 100}%`, top: `${hoveredEquityPoint.y / 260 * 100}%`, transform: 'translate(-10%, -120%)' }"
        >
          <div><strong>{{ formatDate(hoveredEquityPoint.label) }}</strong></div>
          <div>Equity: <strong>{{ currency(hoveredEquityPoint.value) }}</strong></div>
          <div>Trade #: {{ hoveredEquityPoint.index + 1 }}</div>
        </div>
        </div>
        <div v-if="equityPlot.length" class="mt-4 flex flex-wrap justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
          <span v-for="point in edgeLabels" :key="point.label">{{ point.label }}</span>
        </div>
        <EmptyState
          v-else
          eyebrow="No equity data"
          title="No trades yet to draw the curve."
          description="As soon as you save a trade, the dashboard will start plotting the account path and recent execution rhythm."
        >
          <router-link to="/trades/new" class="crs-button-primary">Add trade</router-link>
        </EmptyState>
      </ChartCard>

      <ChartCard
        eyebrow="Rule discipline"
        title="Checklist compliance"
        description="This is the score that should matter most. A personal system improves only when rules are measurable."
      >
        <div v-if="checklistSummary.length" class="space-y-3">
          <div v-for="item in checklistSummary" :key="item.label">
            <div class="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>{{ item.label }}</span>
              <span>{{ item.rate }}%</span>
            </div>
            <div class="h-2 rounded-full bg-white/5">
              <div class="h-2 rounded-full bg-gradient-to-r from-amber-200 to-sky-400" :style="{ width: `${item.rate}%` }"></div>
            </div>
          </div>
        </div>
        <div v-if="checklistSummary.length" class="mt-6 grid gap-3 sm:grid-cols-2">
          <MetricCard label="Rule-followed trades" :value="`${metrics.ruleFollowedRate}%`" hint="Within playbook" tone="positive" info="Percentage of trades marked as fully aligned with your plan." />
          <MetricCard label="Outside plan" :value="`${metrics.outsidePlanRate}%`" hint="Needs reduction" tone="negative" info="Percentage of trades marked as outside your plan or discipline rules." />
        </div>
        <EmptyState
          v-else
          eyebrow="No checklist data"
          title="No rule-compliance read yet."
          description="Checklist compliance appears once there are saved trades with execution rules attached."
        />
      </ChartCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <ChartCard
        eyebrow="Recent tape"
        title="Recent trades"
        description="The last five executions, kept visible so review stays immediate."
      >
        <div v-if="recentTrades.length" class="space-y-3">
          <router-link
            v-for="trade in recentTrades"
            :key="trade.id"
            :to="`/trades/${trade.id}`"
            class="flex items-center justify-between gap-4 rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.05]"
          >
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-slate-500">{{ formatDate(trade.date) }}</p>
              <h3 class="mt-1 text-lg font-semibold text-white">{{ trade.pair }} · {{ trade.setupType }}</h3>
              <p class="mt-1 text-sm text-slate-400">{{ trade.session }} · {{ trade.direction }} · {{ trade.tags.join(' / ') }}</p>
            </div>
            <div class="text-right">
              <ResultBadge :value="trade.status" />
              <p class="mt-2 text-lg font-semibold text-white">{{ trade.resultR.toFixed(1) }}R</p>
            </div>
          </router-link>
        </div>
        <EmptyState
          v-else
          eyebrow="Tape empty"
          title="No recent trades to review."
          description="Your most recent executions will appear here as soon as the ledger has data."
        >
          <router-link to="/trades/new" class="crs-button-primary">Record trade</router-link>
        </EmptyState>
      </ChartCard>

      <ChartCard
        eyebrow="Trade mix"
        title="Outcome distribution"
        description="A compact read on how the ledger is splitting across wins, losses, and breakeven outcomes."
      >
        <div v-if="metrics.totalTrades" class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div class="flex justify-center">
            <svg viewBox="0 0 220 220" class="h-52 w-52">
              <circle class="crs-donut-track" cx="110" cy="110" r="74" />
              <circle class="crs-donut-win" cx="110" cy="110" r="74" :stroke-dasharray="winDash" stroke-dashoffset="0" />
              <circle class="crs-donut-loss" cx="110" cy="110" r="74" :stroke-dasharray="lossDash" :stroke-dashoffset="lossOffset" />
              <circle class="crs-donut-breakeven" cx="110" cy="110" r="74" :stroke-dasharray="breakevenDash" :stroke-dashoffset="breakevenOffset" />
              <text x="110" y="102" text-anchor="middle" fill="#f8fafc" font-size="34" font-weight="600">{{ metrics.totalTrades }}</text>
              <text x="110" y="128" text-anchor="middle" fill="#7b8aa3" font-size="12" letter-spacing="1.5">TRADES</text>
            </svg>
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-between rounded-[16px] border border-emerald-400/15 bg-emerald-400/5 px-4 py-3">
              <div class="flex items-center gap-3 text-sm text-slate-200">
                <span class="h-3 w-3 rounded-full bg-emerald-400"></span>
                Wins
              </div>
              <span class="text-lg font-semibold text-white">{{ outcomeCounts.win }}</span>
            </div>
            <div class="flex items-center justify-between rounded-[16px] border border-rose-400/15 bg-rose-400/5 px-4 py-3">
              <div class="flex items-center gap-3 text-sm text-slate-200">
                <span class="h-3 w-3 rounded-full bg-rose-400"></span>
                Losses
              </div>
              <span class="text-lg font-semibold text-white">{{ outcomeCounts.loss }}</span>
            </div>
            <div class="flex items-center justify-between rounded-[16px] border border-sky-400/15 bg-sky-400/5 px-4 py-3">
              <div class="flex items-center gap-3 text-sm text-slate-200">
                <span class="h-3 w-3 rounded-full bg-sky-400"></span>
                Breakeven
              </div>
              <span class="text-lg font-semibold text-white">{{ outcomeCounts.breakeven }}</span>
            </div>
            <div class="pt-2">
              <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Weekly PnL</p>
              <div class="mt-3 crs-chart-shell">
                <div
                  v-for="row in pnlWeek"
                  :key="row.label"
                  class="crs-chart-bar-hit"
                  @mouseenter="hoveredWeekRow = row"
                  @mouseleave="hoveredWeekRow = null"
                >
                  <div class="text-xs text-slate-400">{{ currency(row.value) }}</div>
                  <div class="crs-chart-bar" :style="{ height: `${barHeight(row.value)}%`, opacity: row.value < 0 ? 0.55 : 1 }"></div>
                  <div class="crs-chart-caption">{{ row.label }}</div>
                </div>
              </div>
              <div v-if="hoveredWeekRow" class="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
                <strong class="text-white">{{ hoveredWeekRow.label }}</strong> closed at {{ currency(hoveredWeekRow.value) }}.
              </div>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="Distribution empty"
          title="No outcome mix yet."
          description="Wins, losses, breakeven counts, and the weekly PnL chart appear once trades have been recorded."
        />
      </ChartCard>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { format, parseISO } from 'date-fns'
import ChartCard from '@/components/crs/ChartCard.vue'
import EmptyState from '@/components/crs/EmptyState.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import ResultBadge from '@/components/crs/ResultBadge.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import { useCrsStore } from '@/stores/crs'

const crsStore = useCrsStore()
const hoveredEquityPoint = ref(null)
const hoveredWeekRow = ref(null)

const metrics = computed(() => crsStore.dashboardMetrics)
const recentTrades = computed(() => crsStore.recentTrades)
const checklistSummary = computed(() => crsStore.checklistSummary)
const pnlWeek = computed(() => crsStore.analytics.pnlByPeriod.week)
const outcomeCounts = computed(() => crsStore.analytics.outcomeCounts)
const circumference = 2 * Math.PI * 74

const winDash = computed(() => `${segmentLength(outcomeCounts.value.win)} ${circumference}`)
const lossDash = computed(() => `${segmentLength(outcomeCounts.value.loss)} ${circumference}`)
const breakevenDash = computed(() => `${segmentLength(outcomeCounts.value.breakeven)} ${circumference}`)
const lossOffset = computed(() => -segmentLength(outcomeCounts.value.win))
const breakevenOffset = computed(() => -(segmentLength(outcomeCounts.value.win) + segmentLength(outcomeCounts.value.loss)))

const equityPlot = computed(() => {
  const values = crsStore.analytics.equityCurve

  if (!values.length) {
    return []
  }

  const width = 620
  const height = 220
  const max = Math.max(...values.map((item) => item.value))
  const min = Math.min(...values.map((item) => item.value))
  const range = max - min || 1

  return values.map((item, index) => ({
    label: item.date,
    value: item.value,
    index,
    x: 12 + (index * (width - 24)) / Math.max(values.length - 1, 1),
    y: 12 + ((max - item.value) / range) * (height - 24)
  }))
})

const equityPoints = computed(() => equityPlot.value.map((point) => `${point.x},${point.y}`).join(' '))
const equityAreaPoints = computed(() => {
  if (!equityPlot.value.length) {
    return ''
  }

  const first = equityPlot.value[0]
  const last = equityPlot.value[equityPlot.value.length - 1]
  return [`${first.x},236`, ...equityPlot.value.map((point) => `${point.x},${point.y}`), `${last.x},236`].join(' ')
})
const gridLines = computed(() => {
  if (!equityPlot.value.length) {
    return []
  }

  const values = crsStore.analytics.equityCurve.map((item) => item.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const steps = 4

  return Array.from({ length: steps + 1 }, (_, index) => {
    const ratio = index / steps
    const value = max - (max - min) * ratio
    return {
      y: 12 + ratio * 196,
      value
    }
  })
})
const edgeLabels = computed(() => {
  if (equityPlot.value.length <= 2) {
    return equityPlot.value
  }

  return [equityPlot.value[0], equityPlot.value[Math.floor(equityPlot.value.length / 2)], equityPlot.value.at(-1)]
})

const streakText = computed(() => `${metrics.value.currentStreak.count} ${metrics.value.currentStreak.type}`)
const streakHint = computed(() => metrics.value.currentStreak.type === 'loss' ? 'Reset through selectivity' : 'Momentum is earned')
const bestDayValue = computed(() => metrics.value.bestDay ? currency(metrics.value.bestDay.pnl) : '$0')
const worstDayValue = computed(() => metrics.value.worstDay ? currency(metrics.value.worstDay.pnl) : '$0')
const bestDayHint = computed(() => metrics.value.bestDay ? formatDate(metrics.value.bestDay.date) : 'No data')
const worstDayHint = computed(() => metrics.value.worstDay ? formatDate(metrics.value.worstDay.date) : 'No data')

function currency(value) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: crsStore.settings.currency || 'USD',
    maximumFractionDigits: 0
  }).format(Math.abs(value))

  return value < 0 ? `-${amount}` : amount
}

function formatDate(value) {
  return format(parseISO(value), 'MMM d')
}

function barHeight(value) {
  const max = Math.max(...pnlWeek.value.map((row) => Math.abs(row.value)), 1)
  return Math.max((Math.abs(value) / max) * 100, 10)
}

function segmentLength(count) {
  if (!metrics.value.totalTrades) {
    return 0
  }

  return (count / metrics.value.totalTrades) * circumference
}
</script>
