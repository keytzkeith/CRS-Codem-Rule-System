<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Journal review"
        title="A personal journal that stays short enough to use."
        description="CRS keeps journaling tied directly to trades so lessons compound instead of disappearing into long forms."
      />
    </section>

    <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <ChartCard
        eyebrow="Discipline pulse"
        title="What the journal is saying"
        description="A review-oriented view of the same trades you see elsewhere."
      >
        <div v-if="journalEntries.length" class="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Journaled trades" :value="String(journalEntries.length)" hint="Every sample trade includes a review note" />
          <MetricCard label="Plan-followed" :value="`${metrics.ruleFollowedRate}%`" hint="Clean execution rate" tone="positive" />
          <MetricCard label="Outside plan" :value="`${metrics.outsidePlanRate}%`" hint="Target for reduction" tone="negative" />
          <MetricCard label="Current focus" :value="topMistake" hint="Most frequent mistake note" tone="warning" />
        </div>
        <EmptyState
          v-else
          eyebrow="Journal empty"
          title="No reflections recorded yet."
          description="Once imported trades are saved, this page becomes the quick review layer for discipline, emotions, and repeated mistakes."
        >
          <router-link to="/trades/import" class="crs-button-primary">Import first trades</router-link>
        </EmptyState>
      </ChartCard>

      <ChartCard
        eyebrow="Patterns"
        title="Mistake frequency"
        description="The fastest way to improve is to see the repeated error in plain language."
      >
        <div v-if="mistakeFrequency.length" class="space-y-3">
          <div v-for="item in mistakeFrequency" :key="item.label">
            <div class="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>{{ item.label }}</span>
              <span>{{ item.value }}</span>
            </div>
            <div class="h-2 rounded-full bg-white/5">
              <div class="h-2 rounded-full bg-gradient-to-r from-rose-300 via-amber-200 to-sky-400" :style="{ width: `${(item.value / maxMistakeCount) * 100}%` }"></div>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          eyebrow="Patterns empty"
          title="No mistake patterns yet."
          description="This chart fills in once the journal has actual trade reflections to compare."
        />
      </ChartCard>
    </div>

    <ChartCard
      eyebrow="Journal ledger"
      title="Linked trade reflections"
      description="Each row links straight into the trade detail page where the full narrative and checklist live."
    >
      <div v-if="journalEntries.length" class="space-y-4">
        <router-link
          v-for="entry in journalEntries"
          :key="entry.id"
          :to="`/trades/${entry.id}`"
          class="block rounded-[24px] border border-white/5 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.22em] text-slate-500">{{ formatDate(entry.date) }}</p>
              <h3 class="mt-1 text-lg font-semibold text-white">{{ entry.pair }} · {{ entry.setupType }}</h3>
            </div>
            <span class="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]" :class="entry.followedPlan ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'">
              {{ entry.followedPlan ? 'Followed plan' : 'Outside plan' }}
            </span>
          </div>
          <div class="mt-4 grid gap-4 lg:grid-cols-3">
            <div>
              <p class="crs-eyebrow">Emotions</p>
              <p class="text-sm text-slate-300">{{ entry.emotions }}</p>
            </div>
            <div>
              <p class="crs-eyebrow">Mistake made</p>
              <p class="text-sm text-slate-300">{{ entry.mistakeMade }}</p>
            </div>
            <div>
              <p class="crs-eyebrow">Lesson learned</p>
              <p class="text-sm text-slate-300">{{ entry.lessonLearned }}</p>
            </div>
          </div>
          <p class="mt-4 text-sm leading-7 text-slate-400">{{ entry.notes }}</p>
        </router-link>
      </div>
      <EmptyState
        v-else
        eyebrow="No entries"
        title="The journal ledger is empty."
        description="Import trades first, then this page will show the linked notes, emotions, and lessons for review."
      >
        <router-link to="/trades/import" class="crs-button-primary">Import trades</router-link>
      </EmptyState>
    </ChartCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import ChartCard from '@/components/crs/ChartCard.vue'
import EmptyState from '@/components/crs/EmptyState.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import { useCrsStore } from '@/stores/crs'

const crsStore = useCrsStore()

const journalEntries = computed(() => crsStore.journalEntries)
const metrics = computed(() => crsStore.dashboardMetrics)
const mistakeFrequency = computed(() => crsStore.analytics.mistakeFrequency)
const maxMistakeCount = computed(() => Math.max(...mistakeFrequency.value.map((item) => item.value), 1))
const topMistake = computed(() => mistakeFrequency.value[0]?.label || 'No repeated errors')

function formatDate(value) {
  return format(parseISO(value), 'MMM d, yyyy')
}
</script>
