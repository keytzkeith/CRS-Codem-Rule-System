<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Analytics core"
        title="Only the charts that change decisions."
        description="CRS avoids dashboard clutter and keeps the view on equity, setup quality, session performance, pair selection, and recurring execution mistakes."
      />
    </section>

    <div class="grid gap-6">
      <ChartCard eyebrow="Equity" title="Equity curve" description="Account balance over time, starting from the active account balance and stepping through each closed trade.">
        <template #actions>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in zoomOptions"
              :key="option.value"
              type="button"
              class="w-full sm:w-auto"
              :class="equityZoom === option.value ? 'crs-button-primary' : 'crs-button crs-button-muted'"
              @click="equityZoom = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </template>
        <div v-if="analytics.equityCurve.length" class="crs-chart-stage">
        <svg :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`" class="h-72 w-full">
          <defs>
            <linearGradient id="analyticsEquity" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="#f2d7a1" />
              <stop offset="100%" stop-color="#75a9ff" />
            </linearGradient>
            <linearGradient id="equityFill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="#75a9ff" />
              <stop offset="100%" stop-color="#75a9ff" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g>
            <line v-for="(line, idx) in gridLines" :key="`grid-${idx}`" :x1="PLOT_LEFT" :x2="PLOT_RIGHT" :y1="line.y" :y2="line.y" class="crs-chart-grid-line" />
          </g>
          <polygon :points="equityAreaPoints" class="crs-chart-area-fill" />
          <polyline
            fill="none"
            stroke="url(#analyticsEquity)"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="equityPoints"
          />
          <g v-for="point in equityPlot" :key="`${point.label}-${point.index}`">
            <circle :cx="point.x" :cy="point.y" r="5" fill="#f2d7a1" class="cursor-pointer" @mouseenter="hoveredEquityPoint = point" @mouseleave="hoveredEquityPoint = null" />
            <circle :cx="point.x" :cy="point.y" r="16" fill="transparent" class="cursor-pointer" @mouseenter="hoveredEquityPoint = point" @mouseleave="hoveredEquityPoint = null" />
          </g>
          <g v-for="(line, idx) in gridLines" :key="`axis-${idx}`">
            <text :x="PLOT_LEFT - 10" :y="line.y + 4" text-anchor="end" class="crs-chart-axis-label">{{ compactCurrency(line.value) }}</text>
          </g>
          <g v-for="tick in equityAxisTicks" :key="tick.label">
            <text
              :x="tick.x"
              :y="PLOT_BOTTOM + 20"
              text-anchor="start"
              class="crs-chart-axis-label"
              :transform="`rotate(90 ${tick.x} ${PLOT_BOTTOM + 20})`"
            >
              {{ tick.label }}
            </text>
          </g>
        </svg>
        <div
          v-if="hoveredEquityPoint"
          class="crs-chart-hover-card"
          :style="{ left: `${hoveredEquityPoint.x / CHART_WIDTH * 100}%`, top: `${hoveredEquityPoint.y / CHART_HEIGHT * 100}%`, transform: 'translate(-10%, -120%)' }"
        >
          <div><strong>{{ formatCellDate(hoveredEquityPoint.label) }}</strong></div>
          <div>Equity: <strong>{{ compactCurrency(hoveredEquityPoint.value) }}</strong></div>
          <div>Trade #: {{ hoveredEquityPoint.index + 1 }}</div>
        </div>
        </div>
        <EmptyState
          v-else
          eyebrow="No equity data"
          title="Analytics needs trades first."
          description="Once there are imported trades, the equity curve and all derived analytics will populate automatically."
        >
          <router-link to="/trades/import" class="crs-button-primary">Import trades</router-link>
        </EmptyState>
      </ChartCard>

    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <ChartCard eyebrow="Pnl cadence" title="Weekly PnL" description="Short-term rhythm across rolling trading weeks.">
        <div v-if="analytics.pnlByPeriod.week.length" class="space-y-3">
          <div class="crs-chart-shell h-56">
            <div
              v-for="row in analytics.pnlByPeriod.week"
              :key="row.label"
              class="crs-chart-column crs-chart-bar-hit"
              @mouseenter="hoveredWeekRow = row"
              @mouseleave="hoveredWeekRow = null"
            >
              <div class="crs-chart-value" :class="row.value >= 0 ? 'text-emerald-300' : 'text-red-400'">{{ compactCurrency(row.value) }}</div>
              <div class="crs-chart-bar-stage">
                <div class="crs-chart-bar" :class="{ 'crs-chart-bar-negative': row.value < 0 }" :style="{ height: `${barHeight(analytics.pnlByPeriod.week, row.value)}%` }"></div>
              </div>
              <div class="crs-chart-caption">
                <span>{{ barLabelPrimary(row.label) }}</span>
                <span class="crs-chart-caption-sub">{{ barLabelSecondary(row.label) }}</span>
              </div>
            </div>
          </div>
          <div v-if="hoveredWeekRow" class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
            <strong class="text-white">{{ hoveredWeekRow.label }}</strong> closed at {{ compactCurrency(hoveredWeekRow.value) }}.
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="No weekly PnL"
          title="No weekly rollup yet."
          description="Weekly performance appears after trades are grouped into trading weeks."
        />
      </ChartCard>

      <ChartCard eyebrow="Pnl cadence" title="Monthly PnL" description="Broader month-by-month direction without the weekly compression.">
        <div v-if="analytics.pnlByPeriod.month.length" class="space-y-3">
          <div class="crs-chart-shell h-56">
            <div
              v-for="row in analytics.pnlByPeriod.month"
              :key="row.label"
              class="crs-chart-column crs-chart-bar-hit"
              @mouseenter="hoveredMonthRow = row"
              @mouseleave="hoveredMonthRow = null"
            >
              <div class="crs-chart-value" :class="row.value >= 0 ? 'text-emerald-300' : 'text-red-400'">{{ compactCurrency(row.value) }}</div>
              <div class="crs-chart-bar-stage">
                <div class="crs-chart-bar" :class="{ 'crs-chart-bar-negative': row.value < 0 }" :style="{ height: `${barHeight(analytics.pnlByPeriod.month, row.value)}%` }"></div>
              </div>
              <div class="crs-chart-caption">
                <span>{{ barLabelPrimary(row.label) }}</span>
                <span class="crs-chart-caption-sub">{{ barLabelSecondary(row.label) }}</span>
              </div>
            </div>
          </div>
          <div v-if="hoveredMonthRow" class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
            <strong class="text-white">{{ hoveredMonthRow.label }}</strong> closed at {{ compactCurrency(hoveredMonthRow.value) }}.
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="No monthly PnL"
          title="No monthly rollup yet."
          description="Monthly performance appears once the ledger spans at least one calendar month."
        />
      </ChartCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
      <ChartCard eyebrow="Setup quality" title="Win rate by setup type" description="Which setup earns the right to stay in the playbook.">
        <template #actions>
          <InfoTip text="Each setup chip in a trade counts separately here. If one trade includes both Liquidity sweep and BOS entry, both setups get credit for that outcome." />
        </template>
        <div v-if="analytics.winRateBySetupType.length" class="space-y-4">
          <div v-for="row in analytics.winRateBySetupType" :key="row.label">
            <div class="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>{{ row.label }}</span>
              <span>{{ row.winRate }}%</span>
            </div>
            <div class="h-2 rounded-full bg-white/5">
              <div class="h-2 rounded-full bg-gradient-to-r from-amber-200 to-sky-400" :style="{ width: `${row.winRate}%` }"></div>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="No setup data"
          title="No setup performance yet."
          description="Setup quality will populate once trades are saved with their setup stack."
        />
      </ChartCard>

      <ChartCard eyebrow="Pair ranking" title="Performance by pair" description="Which instruments are actually producing quality outcomes.">
        <div v-if="analytics.performanceByPair.length" class="space-y-4">
          <div v-for="row in analytics.performanceByPair" :key="row.label" class="flex items-center justify-between rounded-[20px] bg-white/[0.03] px-4 py-3">
            <div>
              <p class="font-semibold text-white">{{ row.label }}</p>
              <p class="text-sm text-slate-500">{{ row.trades }} trades · {{ row.winRate }}% win rate</p>
            </div>
            <p :class="row.pnl >= 0 ? 'text-emerald-300' : 'text-red-400'">{{ compactCurrency(row.pnl) }}</p>
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="No pair data"
          title="No pair ranking yet."
          description="Pair performance appears once the ledger has instrument-level results."
        />
      </ChartCard>

      <ChartCard eyebrow="Session bias" title="Performance by session" description="The fastest read on whether London or New York deserves more focus.">
        <div v-if="analytics.performanceBySession.length" class="space-y-4">
          <div v-for="row in analytics.performanceBySession" :key="row.label" class="flex items-center justify-between rounded-[20px] bg-white/[0.03] px-4 py-3">
            <div>
              <p class="font-semibold text-white">{{ row.label }}</p>
              <p class="text-sm text-slate-500">{{ row.trades }} trades · {{ row.winRate }}% win rate</p>
            </div>
            <p :class="row.pnl >= 0 ? 'text-emerald-300' : 'text-red-400'">{{ compactCurrency(row.pnl) }}</p>
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="No session data"
          title="No session bias yet."
          description="Save trades across sessions and this section will rank the periods that deserve more attention."
        />
      </ChartCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.28fr_0.72fr] 2xl:grid-cols-[1.35fr_0.65fr]">
      <ChartCard eyebrow="Monthly review" title="Daily performance calendar" description="A cleaner month-by-month review of trading days, with simple previous and next navigation.">
        <template #actions>
          <InfoTip text="Move backward and forward by month. Cells with color had trades on that day, while neutral cells had no activity recorded." />
        </template>
        <div v-if="analytics.calendar.length" class="space-y-5">
          <div class="flex items-center justify-between gap-4">
            <button type="button" class="crs-calendar-nav" @click="monthCursor = subMonths(monthCursor, 1)">‹</button>
            <div class="text-center">
              <div class="text-lg font-semibold text-white">{{ currentMonthLabel }}</div>
              <div class="text-sm text-slate-500">Use this view to review daily execution quality month by month.</div>
            </div>
            <button type="button" class="crs-calendar-nav" @click="monthCursor = addMonths(monthCursor, 1)">›</button>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <div class="crs-calendar-stat">
              <div class="text-sm text-slate-400">Total trades</div>
              <div class="crs-calendar-stat-value mt-2 text-3xl font-semibold text-white">{{ formatTradeCount(monthlySummary.totalTrades) }}</div>
            </div>
            <div class="crs-calendar-stat">
              <div class="text-sm text-slate-400">Trading days</div>
              <div class="crs-calendar-stat-value mt-2 text-3xl font-semibold text-white">{{ monthlySummary.tradingDays }}</div>
            </div>
            <div class="crs-calendar-stat">
              <div class="text-sm text-slate-400">P&amp;L</div>
              <div class="crs-calendar-stat-value mt-2 text-[clamp(1.7rem,2.5vw,2.25rem)] font-semibold" :class="monthlySummary.pnl >= 0 ? 'text-emerald-300' : 'text-red-400'">{{ compactCurrency(monthlySummary.pnl) }}</div>
            </div>
            <div class="crs-calendar-stat">
              <div class="text-sm text-slate-400">Best day</div>
              <div
                class="crs-calendar-stat-value mt-2 text-[clamp(1.35rem,2vw,1.8rem)] font-semibold"
                :class="monthlySummary.bestDay ? (monthlySummary.bestDay.value >= 0 ? 'text-emerald-300' : 'text-red-400') : 'text-white'"
              >
                {{ monthlySummary.bestDay ? compactCurrency(monthlySummary.bestDay.value) : 'No data' }}
              </div>
            </div>
            <div class="crs-calendar-stat">
              <div class="text-sm text-slate-400">Worst day</div>
              <div
                class="crs-calendar-stat-value mt-2 text-[clamp(1.35rem,2vw,1.8rem)] font-semibold"
                :class="monthlySummary.worstDay ? (monthlySummary.worstDay.value >= 0 ? 'text-emerald-300' : 'text-red-400') : 'text-white'"
              >
                {{ monthlySummary.worstDay ? compactCurrency(monthlySummary.worstDay.value) : 'No data' }}
              </div>
            </div>
            <div class="crs-calendar-stat">
              <div class="text-sm text-slate-400">Win rate</div>
              <div class="crs-calendar-stat-value mt-2 text-3xl font-semibold text-white">{{ formatWinRate(monthlySummary.winRate) }}</div>
            </div>
          </div>

          <div class="crs-calendar-grid">
            <div v-for="day in weekDays" :key="day" class="crs-calendar-head">{{ day }}</div>
            <div
              v-for="cell in visibleMonthCells"
              :key="cell.date"
              class="crs-calendar-cell"
              :class="{ 'crs-calendar-cell-muted': !cell.inMonth }"
              :style="cell.data ? { background: dotColor(cell.data) } : undefined"
              :title="cell.data ? `${formatCellDate(cell.date)} · ${compactCurrency(cell.data.value)} · ${tradeCountLabel(cell.data.trades)}` : formatCellDate(cell.date)"
            >
              <div class="flex h-full flex-col justify-between">
                <div>
                  <span class="crs-calendar-pill">{{ dayOfMonth(cell.date) }}</span>
                </div>
                <div v-if="cell.data" class="space-y-1">
                  <div class="text-base font-semibold" :class="cell.data.value >= 0 ? 'text-emerald-300' : 'text-red-400'">
                    {{ compactCurrency(cell.data.value) }}
                  </div>
                  <div class="text-sm font-medium text-white">{{ tradeCountLabel(cell.data.trades) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="No calendar data"
          title="No daily performance calendar yet."
          description="The calendar view appears when trades start filling actual dates."
        />
      </ChartCard>

      <ChartCard eyebrow="Mistakes" title="Mistake frequency summary" description="Language-level feedback, because repeated error names are more useful than vanity metrics.">
        <div v-if="analytics.mistakeFrequency.length" class="space-y-4">
          <div v-for="row in analytics.mistakeFrequency" :key="row.label">
            <div class="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>{{ row.label }}</span>
              <span>{{ row.value }}</span>
            </div>
            <div class="h-2 rounded-full bg-white/5">
              <div class="h-2 rounded-full bg-gradient-to-r from-rose-300 via-amber-200 to-sky-400" :style="{ width: `${(row.value / maxMistake) * 100}%` }"></div>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="No mistake data"
          title="No repeated errors logged yet."
          description="Journaled mistakes will show up here once there are reflections to aggregate."
        />
      </ChartCard>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import ChartCard from '@/components/crs/ChartCard.vue'
import EmptyState from '@/components/crs/EmptyState.vue'
import InfoTip from '@/components/crs/InfoTip.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import { useCrsStore } from '@/stores/crs'

const crsStore = useCrsStore()
const analytics = computed(() => crsStore.analytics)
const monthCursor = ref(startOfMonth(new Date()))
const hoveredEquityPoint = ref(null)
const hoveredWeekRow = ref(null)
const hoveredMonthRow = ref(null)
const equityZoom = ref('all')
const maxMistake = computed(() => Math.max(...analytics.value.mistakeFrequency.map((row) => row.value), 1))
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CHART_WIDTH = 640
const CHART_HEIGHT = 300
const PLOT_LEFT = 88
const PLOT_RIGHT = 620
const PLOT_TOP = 16
const PLOT_BOTTOM = 210
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP
const zoomOptions = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: 'All', value: 'all' }
]

const visibleEquityCurve = computed(() => {
  const series = analytics.value.equityCurve
  if (equityZoom.value === 'all' || series.length <= 2) {
    return series
  }

  const monthCount = {
    '1m': 1,
    '3m': 3,
    '6m': 6
  }[equityZoom.value] || 0

  if (!monthCount) {
    return series
  }

  const end = parseISO(String(series.at(-1)?.date || new Date().toISOString()).replace(' ', 'T'))
  const cutoff = new Date(end)
  cutoff.setMonth(cutoff.getMonth() - monthCount)

  const filtered = series.filter((point) => parseISO(String(point.date).replace(' ', 'T')) >= cutoff)
  return filtered.length ? filtered : series
})

const equityPlot = computed(() => {
  const values = visibleEquityCurve.value

  if (!values.length) {
    return []
  }

  const max = Math.max(...values.map((item) => item.value))
  const min = Math.min(...values.map((item) => item.value))
  const range = max - min || 1

  return values.map((item, index) => ({
    label: item.date,
    value: item.value,
    index,
    x: PLOT_LEFT + (index * (PLOT_RIGHT - PLOT_LEFT)) / Math.max(values.length - 1, 1),
    y: PLOT_TOP + ((max - item.value) / range) * PLOT_HEIGHT
  }))
})
const equityPoints = computed(() => equityPlot.value.map((point) => `${point.x},${point.y}`).join(' '))
const equityAreaPoints = computed(() => {
  if (!equityPlot.value.length) {
    return ''
  }

  const first = equityPlot.value[0]
  const last = equityPlot.value[equityPlot.value.length - 1]
  return [`${first.x},${PLOT_BOTTOM}`, ...equityPlot.value.map((point) => `${point.x},${point.y}`), `${last.x},${PLOT_BOTTOM}`].join(' ')
})
const gridLines = computed(() => {
  if (!equityPlot.value.length) {
    return []
  }

  const values = visibleEquityCurve.value.map((item) => item.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const steps = 4

  return Array.from({ length: steps + 1 }, (_, index) => {
    const ratio = index / steps
    const value = max - (max - min) * ratio
    return {
      y: PLOT_TOP + ratio * PLOT_HEIGHT,
      value
    }
  })
})
const equityAxisTicks = computed(() => {
  if (equityPlot.value.length <= 2) {
    return equityPlot.value.map((point) => ({
      x: point.x,
      label: shortAxisDate(point.label)
    }))
  }

  return [
    equityPlot.value[0],
    equityPlot.value[Math.floor(equityPlot.value.length / 2)],
    equityPlot.value.at(-1)
  ].map((point) => ({
    x: point.x,
    label: shortAxisDate(point.label)
  }))
})
const calendarMap = computed(() =>
  analytics.value.calendar.reduce((acc, cell) => {
    acc[normalizeCalendarDate(cell.date)] = {
      ...cell,
      date: normalizeCalendarDate(cell.date)
    }
    return acc
  }, {})
)
const visibleMonthCells = computed(() => {
  const monthStart = startOfMonth(monthCursor.value)
  const monthEnd = endOfMonth(monthCursor.value)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map((date) => {
    const key = format(date, 'yyyy-MM-dd')
    return {
      date: key,
      inMonth: isSameMonth(date, monthCursor.value),
      data: calendarMap.value[key] || null
    }
  })
})
const currentMonthEntries = computed(() =>
  analytics.value.calendar.filter((cell) => isSameMonth(parseISO(normalizeCalendarDate(cell.date)), monthCursor.value))
)
const monthlySummary = computed(() => {
  if (!currentMonthEntries.value.length) {
    return {
      totalTrades: 0,
      tradingDays: 0,
      pnl: 0,
      bestDay: null,
      worstDay: null,
      winRate: 0
    }
  }

  const pnl = currentMonthEntries.value.reduce((sum, cell) => sum + cell.value, 0)
  const positiveDays = currentMonthEntries.value.filter((cell) => cell.value > 0).length

  return {
    totalTrades: currentMonthEntries.value.reduce((sum, cell) => sum + normalizeTradeCount(cell.trades), 0),
    tradingDays: currentMonthEntries.value.length,
    pnl,
    bestDay: currentMonthEntries.value.reduce((best, cell) => (!best || cell.value > best.value ? cell : best), null),
    worstDay: currentMonthEntries.value.reduce((worst, cell) => (!worst || cell.value < worst.value ? cell : worst), null),
    winRate: currentMonthEntries.value.length ? Number(((positiveDays / currentMonthEntries.value.length) * 100).toFixed(1)) : 0
  }
})
const currentMonthLabel = computed(() => format(monthCursor.value, 'MMMM yyyy'))

function compactCurrency(value) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: crsStore.settings.currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(value))

  return value < 0 ? `-${amount}` : amount
}

function barHeight(rows, value) {
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1)
  return Math.max((Math.abs(value) / max) * 100, 3)
}

function dotColor(cell) {
  if (cell.value > 0) {
    return `linear-gradient(180deg, rgba(14, 64, 44, ${Math.max(cell.intensity * 0.9, 0.58)}), rgba(8, 36, 25, ${Math.max(cell.intensity * 0.78, 0.5)}))`
  }

  if (cell.value < 0) {
    return `linear-gradient(180deg, rgba(92, 22, 30, ${Math.max(cell.intensity * 0.9, 0.58)}), rgba(54, 14, 18, ${Math.max(cell.intensity * 0.78, 0.5)}))`
  }

  return 'rgba(242, 210, 124, 0.16)'
}

function dayOfMonth(value) {
  return format(parseISO(normalizeCalendarDate(value)), 'd')
}

function formatCellDate(value) {
  const normalized = normalizeCalendarDate(value)
  return format(parseISO(normalized), normalized.includes('T') ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy')
}

function shortAxisDate(value) {
  return format(parseISO(String(value).replace(' ', 'T')), 'MMM d, yyyy')
}

function tradeCountLabel(count) {
  const value = normalizeTradeCount(count)
  return `${value} ${value === 1 ? 'trade' : 'trades'}`
}

function normalizeTradeCount(count) {
  const value = Number(count)
  return Number.isFinite(value) ? value : 0
}

function formatTradeCount(count) {
  return normalizeTradeCount(count)
}

function formatWinRate(value) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? `${normalized}%` : '0%'
}

function barLabelPrimary(label) {
  const [firstPart = label] = splitBarLabel(label)
  return firstPart
}

function barLabelSecondary(label) {
  const [, secondPart = ''] = splitBarLabel(label)
  return secondPart
}

function splitBarLabel(label) {
  if (label.includes(', ')) {
    return label.split(', ')
  }

  const parts = label.split(' ')
  if (parts.length >= 2) {
    return [parts.slice(0, -1).join(' '), parts.at(-1)]
  }

  return [label, '']
}

function normalizeCalendarDate(value) {
  const text = String(value || '').trim()

  if (!text) {
    return new Date().toISOString().slice(0, 10)
  }

  if (text.length >= 10) {
    return text.slice(0, 10)
  }

  return text
}
</script>
