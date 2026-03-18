<template>
  <div>
    <div v-if="!trades.length" class="crs-empty-state">
      <div class="crs-empty-badge">No matching trades</div>
      <h3 class="text-xl font-semibold tracking-[-0.03em] text-white">The current filter stack returned nothing.</h3>
      <p class="max-w-md text-sm leading-7 text-slate-400">Change the setup, date, tag, or result filters, or import another batch to keep building the ledger.</p>
    </div>

    <div v-else class="hidden overflow-hidden rounded-[24px] border border-white/10 lg:block">
      <table class="min-w-full divide-y divide-white/10">
        <thead class="bg-white/5">
          <tr>
            <th v-for="column in columns" :key="column.key" class="crs-table-head">{{ column.label }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5 bg-slate-950/40">
          <tr
            v-for="trade in trades"
            :key="trade.id"
            class="cursor-pointer transition hover:bg-white/5"
            @click="$emit('select', trade)"
          >
            <td class="crs-table-cell">{{ formatDate(trade.date) }}</td>
            <td class="crs-table-cell">{{ trade.pair }}</td>
            <td class="crs-table-cell">{{ trade.direction }}</td>
            <td class="crs-table-cell">{{ trade.setupType }}</td>
            <td class="crs-table-cell">{{ trade.session }}</td>
            <td class="crs-table-cell">{{ formatVolume(trade.volume) }}</td>
            <td class="crs-table-cell">{{ formatPrice(trade.entry) }}</td>
            <td class="crs-table-cell">{{ formatPrice(trade.stopLoss) }}</td>
            <td class="crs-table-cell">{{ formatPrice(trade.takeProfit) }}</td>
            <td class="crs-table-cell">{{ formatResultR(trade.resultR) }}</td>
            <td class="crs-table-cell">{{ formatCurrencyAmount(trade.resultAmount) }}</td>
            <td class="crs-table-cell"><ResultBadge :value="trade.status || 'Breakeven'" /></td>
            <td class="crs-table-cell">{{ trade.journal?.followedPlan ? 'Yes' : 'No' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="trades.length" class="grid gap-4 lg:hidden">
      <button
        v-for="trade in trades"
        :key="trade.id"
        type="button"
        class="crs-mobile-card text-left"
        @click="$emit('select', trade)"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-slate-400">{{ formatDate(trade.date) }}</p>
            <h3 class="text-lg font-semibold text-white">{{ trade.pair }}</h3>
          </div>
          <ResultBadge :value="trade.status" />
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <p><span class="text-slate-500">Direction</span><br>{{ trade.direction }}</p>
          <p><span class="text-slate-500">Setup</span><br>{{ trade.setupType }}</p>
          <p><span class="text-slate-500">Session</span><br>{{ trade.session }}</p>
          <p><span class="text-slate-500">Volume</span><br>{{ formatVolume(trade.volume) }}</p>
          <p><span class="text-slate-500">Result</span><br>{{ formatResultSummary(trade) }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { format, parseISO } from 'date-fns'
import ResultBadge from '@/components/crs/ResultBadge.vue'

defineEmits(['select'])

defineProps({
  trades: {
    type: Array,
    required: true
  }
})

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'pair', label: 'Pair' },
  { key: 'direction', label: 'Direction' },
  { key: 'setupType', label: 'Setup' },
  { key: 'session', label: 'Session' },
  { key: 'volume', label: 'Volume' },
  { key: 'entry', label: 'Entry' },
  { key: 'stopLoss', label: 'Stop' },
  { key: 'takeProfit', label: 'Target' },
  { key: 'resultR', label: 'R' },
  { key: 'resultAmount', label: '$' },
  { key: 'status', label: 'Status' },
  { key: 'followedPlan', label: 'Plan' }
]

function formatDate(value) {
  return format(parseISO(value), 'MMM d, yyyy')
}

function formatPrice(value) {
  return value >= 100 ? value.toFixed(2) : value.toFixed(4)
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function formatResultR(value) {
  return typeof value === 'number' ? `${value.toFixed(3)}R` : '—'
}

function formatCurrencyAmount(value) {
  return typeof value === 'number' ? `$${formatNumber(Math.abs(value))}` : '—'
}

function formatResultSummary(trade) {
  return `${formatResultR(trade.resultR)} / ${formatCurrencyAmount(trade.resultAmount)}`
}

function formatVolume(value) {
  return Number(value || 0).toFixed(2)
}
</script>
