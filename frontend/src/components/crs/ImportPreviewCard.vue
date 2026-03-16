<template>
  <div v-if="preview" class="rounded-[24px] border border-white/8 bg-slate-950/25 p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs tracking-[0.04em] text-slate-500">{{ eyebrow }}</p>
        <h3 class="mt-2 text-xl font-semibold text-white">{{ title }}</h3>
        <p class="mt-2 text-sm text-slate-400">{{ description }}</p>
      </div>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-3">
      <div class="rounded-[18px] border border-emerald-400/15 bg-emerald-400/5 px-4 py-3">
        <p class="text-xs tracking-[0.04em] text-slate-500">Would import</p>
        <p class="mt-2 text-2xl font-semibold text-white">{{ preview.wouldImport ?? 0 }}</p>
      </div>
      <div class="rounded-[18px] border border-amber-300/15 bg-amber-300/5 px-4 py-3">
        <p class="text-xs tracking-[0.04em] text-slate-500">Duplicates</p>
        <p class="mt-2 text-2xl font-semibold text-white">{{ preview.duplicates?.length ?? 0 }}</p>
      </div>
      <div class="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
        <p class="text-xs tracking-[0.04em] text-slate-500">Invalid rows</p>
        <p class="mt-2 text-2xl font-semibold text-white">{{ preview.invalidRows?.length ?? 0 }}</p>
      </div>
    </div>

    <div class="mt-5">
      <p class="text-sm font-medium text-white">Sample rows that will import</p>
      <div class="mt-3 space-y-3">
        <div
          v-for="row in (preview.previewRows || []).slice(0, previewLimit)"
          :key="`preview-${row.rowNumber}-${row.symbol}-${row.entryTime}`"
          class="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
        >
          <p class="font-medium text-white">Row {{ row.rowNumber }} · {{ row.symbol }} · {{ row.direction }}</p>
          <p class="mt-1">Opened {{ row.entryTime }} · Entry {{ row.entryPrice }} · Close {{ row.exitPrice }} · Volume {{ row.quantity }}</p>
          <p class="mt-1 text-emerald-200">Net P&amp;L {{ row.pnl }}</p>
        </div>
        <p v-if="!(preview.previewRows || []).length" class="rounded-[18px] border border-dashed border-white/10 px-4 py-4 text-sm text-slate-500">
          No rows are currently ready to import.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  preview: {
    type: Object,
    default: null
  },
  eyebrow: {
    type: String,
    default: 'Dry run'
  },
  title: {
    type: String,
    default: 'Preview before import'
  },
  description: {
    type: String,
    default: 'CRS checks the file on the backend first so duplicates and invalid rows are known before anything is written.'
  },
  previewLimit: {
    type: Number,
    default: 5
  }
})
</script>
