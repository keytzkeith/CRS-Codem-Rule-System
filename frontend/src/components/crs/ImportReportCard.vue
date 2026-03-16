<template>
  <div v-if="duplicates.length || invalidRows.length || failedRows.length" class="rounded-[24px] border border-white/8 bg-slate-950/25 p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs tracking-[0.04em] text-slate-500">{{ eyebrow }}</p>
        <h3 class="mt-2 text-xl font-semibold text-white">{{ title }}</h3>
        <p class="mt-2 text-sm text-slate-400">{{ description }}</p>
      </div>
      <button type="button" class="crs-button crs-button-ghost w-full sm:w-auto" @click="downloadReport">
        Download report CSV
      </button>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-3">
      <div class="rounded-[18px] border border-amber-300/15 bg-amber-300/5 px-4 py-3">
        <p class="text-xs tracking-[0.04em] text-slate-500">Duplicates skipped</p>
        <p class="mt-2 text-2xl font-semibold text-white">{{ duplicates.length }}</p>
      </div>
      <div class="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
        <p class="text-xs tracking-[0.04em] text-slate-500">Incomplete rows ignored</p>
        <p class="mt-2 text-2xl font-semibold text-white">{{ invalidRows.length }}</p>
      </div>
      <div class="rounded-[18px] border border-red-500/15 bg-red-500/5 px-4 py-3">
        <p class="text-xs tracking-[0.04em] text-slate-500">Rows failed to import</p>
        <p class="mt-2 text-2xl font-semibold text-white">{{ failedRows.length }}</p>
      </div>
    </div>

    <div class="mt-5 grid gap-5 xl:grid-cols-3">
      <div>
        <p class="text-sm font-medium text-white">Duplicate rows</p>
        <div class="mt-3 space-y-3">
          <div
            v-for="issue in duplicates.slice(0, previewLimit)"
            :key="`duplicate-${issue.rowNumber}-${issue.duplicateTradeId}`"
            class="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
          >
            <p class="font-medium text-white">Row {{ issue.rowNumber }} · {{ issue.pair }} · {{ issue.direction }}</p>
            <p class="mt-1">Opened {{ issue.openTime }} · Entry {{ issue.entry }} · Close {{ issue.closePrice }} · Volume {{ issue.volume }}</p>
            <p class="mt-1 text-amber-200">{{ issue.reason }}</p>
          </div>
          <p v-if="!duplicates.length" class="rounded-[18px] border border-dashed border-white/10 px-4 py-4 text-sm text-slate-500">
            No duplicates were skipped in this run.
          </p>
        </div>
      </div>

      <div>
        <p class="text-sm font-medium text-white">Incomplete rows</p>
        <div class="mt-3 space-y-3">
          <div
            v-for="issue in invalidRows.slice(0, previewLimit)"
            :key="`invalid-${issue.rowNumber}`"
            class="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
          >
            <p class="font-medium text-white">Row {{ issue.rowNumber }} · {{ issue.pair }}</p>
            <p class="mt-1">Opened {{ issue.openTime }} · Entry {{ issue.entry }} · Close {{ issue.closePrice }} · Volume {{ issue.volume }}</p>
            <p class="mt-1 text-slate-400">{{ issue.reason }}</p>
          </div>
          <p v-if="!invalidRows.length" class="rounded-[18px] border border-dashed border-white/10 px-4 py-4 text-sm text-slate-500">
            No incomplete rows were ignored in this run.
          </p>
        </div>
      </div>

      <div>
        <p class="text-sm font-medium text-white">Failed rows</p>
        <div class="mt-3 space-y-3">
          <div
            v-for="issue in failedRows.slice(0, previewLimit)"
            :key="`failed-${issue.rowNumber}-${issue.reason}`"
            class="rounded-[18px] border border-red-500/12 bg-red-500/[0.04] px-4 py-3 text-sm text-slate-300"
          >
            <p class="font-medium text-white">Row {{ issue.rowNumber }} · {{ issue.pair }}</p>
            <p class="mt-1">Opened {{ issue.openTime }} · Entry {{ issue.entry }} · Close {{ issue.closePrice }} · Volume {{ issue.volume }}</p>
            <p class="mt-1 text-red-200">{{ issue.reason }}</p>
          </div>
          <p v-if="!failedRows.length" class="rounded-[18px] border border-dashed border-white/10 px-4 py-4 text-sm text-slate-500">
            No rows failed after validation.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { buildImportIssuesCsv } from '@/utils/crsImportReport'

const props = defineProps({
  duplicates: {
    type: Array,
    default: () => []
  },
  invalidRows: {
    type: Array,
    default: () => []
  },
  failedRows: {
    type: Array,
    default: () => []
  },
  fileName: {
    type: String,
    default: 'crs-import-report.csv'
  },
  eyebrow: {
    type: String,
    default: 'Import report'
  },
  title: {
    type: String,
    default: 'Skipped rows'
  },
  description: {
    type: String,
    default: 'Rows that were skipped during import are listed here so you can review them before retrying.'
  },
  previewLimit: {
    type: Number,
    default: 6
  }
})

function downloadReport() {
  const csv = buildImportIssuesCsv(props.duplicates, props.invalidRows, props.failedRows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = props.fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>
