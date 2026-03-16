<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Advanced mapping"
        title="Map broker columns into CRS."
        description="Choose only the fields that matter to your workflow. Ignore the rest. No CUSIPs, expiry chains, or irrelevant platform baggage."
        stacked
      >
        <div class="flex w-full flex-col gap-3 lg:flex-row">
          <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="loadCsv" />
          <button type="button" class="crs-button crs-button-ghost w-full lg:w-auto" @click="fileInput?.click()">Choose CSV file</button>
          <router-link to="/trades/import" class="crs-button crs-button-muted w-full lg:w-auto">Back to import guide</router-link>
        </div>
      </SectionHeader>
    </section>

    <div v-if="error" class="rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      {{ error }}
    </div>
    <div v-else-if="message" class="rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
      {{ message }}
    </div>

    <ChartCard
      v-if="!crsStore.settings.accounts.length"
      eyebrow="Account required"
      title="Create an account before mapping imports."
      description="Advanced mapping still needs an active account so imported rows without an explicit account name land in the right place."
    >
      <router-link to="/accounts" class="crs-button-primary w-full sm:w-auto">Go to accounts</router-link>
    </ChartCard>

    <div v-else class="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <ChartCard
        eyebrow="Detected columns"
        title="Map or ignore"
        description="Match each CSV header to a CRS field. Leave it on Ignore if it is not useful."
      >
        <div v-if="headers.length" class="grid gap-3">
          <div
            v-for="header in headers"
            :key="header"
            class="grid gap-3 rounded-[18px] border border-white/8 bg-slate-950/30 p-4 md:grid-cols-[1fr_1fr]"
          >
            <div>
              <p class="text-sm font-medium text-white">{{ header }}</p>
              <p class="text-xs text-slate-500">{{ normalizedHeaders[header] }}</p>
            </div>
            <select v-model="fieldMapping[header]" class="crs-input" @change="clearPreview">
              <option value="">Ignore this field</option>
              <option v-for="field in importFields" :key="field.key" :value="field.key">{{ field.label }}</option>
            </select>
          </div>
        </div>
        <div v-else class="rounded-[18px] border border-dashed border-white/10 px-5 py-8 text-sm text-slate-400">
          Select a CSV file to begin mapping.
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Preview"
        title="First rows"
        description="Use the preview to verify the column choices before importing."
      >
        <div v-if="previewRows.length" class="space-y-3">
          <div
            v-for="(row, index) in previewRows"
            :key="index"
            class="rounded-[18px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300"
          >
            <div class="grid gap-2 md:grid-cols-2">
              <div v-for="field in previewFields" :key="field.key">
                <p class="text-xs tracking-[0.04em] text-slate-500">{{ field.label }}</p>
                <p class="mt-1 text-white">{{ resolvePreviewValue(row, field.key) }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="rounded-[18px] border border-dashed border-white/10 px-5 py-8 text-sm text-slate-400">
          Your mapped preview will appear here.
        </div>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" class="crs-button crs-button-muted w-full sm:w-auto" :disabled="!records.length || previewLoading" @click="previewMappedImport">
            {{ previewLoading ? 'Previewing...' : 'Preview mapped rows' }}
          </button>
          <button type="button" class="crs-button-primary w-full sm:w-auto" :disabled="!records.length || importing || !importPreview" @click="importMappedRows">
            {{ importing ? 'Importing...' : 'Start mapped import' }}
          </button>
          <button type="button" class="crs-button crs-button-ghost w-full sm:w-auto" :disabled="!headers.length" @click="resetMapping">
            Reset mapping
          </button>
        </div>
      </ChartCard>
    </div>

    <ImportReportCard
      :duplicates="duplicateRows"
      :invalid-rows="invalidRows"
      :failed-rows="failedRows"
      file-name="crs-advanced-import-report.csv"
      title="Advanced import review"
      description="Skipped rows are listed here so you can inspect duplicates or incomplete mapped rows before adjusting the import."
    />

    <ImportPreviewCard :preview="importPreview" />
    <ImportHistoryCard
      :history="importHistory"
      :loading="historyLoading"
      :deleting="historyDeleting"
      :deleting-id="historyDeletingId"
      :deleting-all="historyClearingAll"
      @refresh="loadImportHistory"
      @delete-item="removeImportHistoryItem"
      @clear-all="clearImportHistoryList"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import ChartCard from '@/components/crs/ChartCard.vue'
import ImportHistoryCard from '@/components/crs/ImportHistoryCard.vue'
import ImportPreviewCard from '@/components/crs/ImportPreviewCard.vue'
import ImportReportCard from '@/components/crs/ImportReportCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import { useCrsStore } from '@/stores/crs'
import { CRS_IMPORT_FIELDS, createDefaultFieldMapping, normalizeHeader, parseCsvText } from '@/utils/crsCsv'
import { createImportIssue } from '@/utils/crsImportReport'

const crsStore = useCrsStore()
const fileInput = ref(null)
const headers = ref([])
const records = ref([])
const csvFile = ref(null)
const importing = ref(false)
const previewLoading = ref(false)
const error = ref('')
const message = ref('')
const importPreview = ref(null)
const importHistory = ref([])
const historyLoading = ref(false)
const historyDeleting = ref(false)
const historyDeletingId = ref('')
const historyClearingAll = ref(false)
const duplicateRows = ref([])
const invalidRows = ref([])
const failedRows = ref([])
const fieldMapping = reactive({})
let importCancelled = false

onBeforeUnmount(() => {
  importCancelled = true
})

loadImportHistory()

const importFields = CRS_IMPORT_FIELDS
const normalizedHeaders = computed(() =>
  headers.value.reduce((acc, header) => {
    acc[header] = normalizeHeader(header)
    return acc
  }, {})
)
const previewRows = computed(() => records.value.slice(0, 3))
const previewFields = computed(() => CRS_IMPORT_FIELDS.filter((field) =>
  Object.values(fieldMapping).includes(field.key)
))

async function loadCsv(event) {
  const file = event.target.files?.[0]
  if (!file) {
    return
  }

  error.value = ''
  message.value = ''

  try {
    csvFile.value = file
    const csvText = await file.text()
    const parsed = parseCsvText(csvText)
    headers.value = parsed.headers
    records.value = parsed.records
    importPreview.value = null
    resetMapping()
  } catch (parseError) {
    error.value = parseError.message || 'Unable to read that CSV file.'
  } finally {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

function resetMapping() {
  const defaults = createDefaultFieldMapping(headers.value)
  Object.keys(fieldMapping).forEach((key) => {
    delete fieldMapping[key]
  })
  Object.assign(fieldMapping, defaults)
  importPreview.value = null
}

function clearPreview() {
  importPreview.value = null
}

async function importMappedRows() {
  importing.value = true
  error.value = ''
  message.value = ''
  duplicateRows.value = []
  invalidRows.value = []
  failedRows.value = []

  try {
    if (!crsStore.settings.accounts.length) {
      error.value = 'Create at least one account before importing trades.'
      return
    }

    if (!csvFile.value) {
      error.value = 'Select a CSV file first.'
      return
    }

    if (!importPreview.value) {
      error.value = 'Preview the mapped import first so CRS can validate the selected columns.'
      return
    }

    message.value = 'Mapped import started. CRS is validating the selected columns on the backend.'
    const result = await crsStore.startImport(csvFile.value, {
      fieldMapping: { ...fieldMapping }
    })
    const importLog = await waitForImportCompletion(result.importId)

    if (!importLog || importCancelled) {
      return
    }

    const details = importLog.error_details || {}
    duplicateRows.value = (details.duplicateRows || []).map(mapBackendIssue)
    invalidRows.value = (details.invalidRows || []).map(mapBackendIssue)
    failedRows.value = (details.failedTrades || []).map(mapBackendIssue)

    if (importLog.status === 'failed') {
      error.value = details.error || 'Mapped import failed on the backend.'
      message.value = ''
      await loadImportHistory()
      return
    }

    await crsStore.hydrateTrades(true)
    await loadImportHistory()

    const imported = importLog.trades_imported || 0
    const duplicates = details.duplicates || duplicateRows.value.length
    const invalid = invalidRows.value.length
    const failed = failedRows.value.length

    message.value = imported || duplicates
      ? `Imported ${imported} mapped trade${imported === 1 ? '' : 's'} successfully.${duplicates ? ` Skipped ${duplicates} duplicate${duplicates === 1 ? '' : 's'}.` : ''}${invalid ? ` Ignored ${invalid} incomplete row${invalid === 1 ? '' : 's'}.` : ''}${failed ? ` ${failed} row${failed === 1 ? '' : 's'} failed during import.` : ''}`
      : 'No valid rows matched the current mapping.'
  } catch (requestError) {
    error.value = requestError.message || 'Unable to import the mapped rows.'
  } finally {
    importing.value = false
  }
}

function resolvePreviewValue(row, fieldKey) {
  const header = Object.keys(fieldMapping).find((key) => fieldMapping[key] === fieldKey)
  return header ? row[header] || '—' : '—'
}

async function previewMappedImport() {
  if (!csvFile.value) {
    error.value = 'Select a CSV file first.'
    return
  }

  previewLoading.value = true
  error.value = ''
  message.value = ''
  importPreview.value = null
  duplicateRows.value = []
  invalidRows.value = []
  failedRows.value = []

  try {
    importPreview.value = await crsStore.previewImport(csvFile.value, {
      fieldMapping: { ...fieldMapping }
    })
    duplicateRows.value = (importPreview.value?.duplicates || []).map(mapBackendIssue)
    invalidRows.value = (importPreview.value?.invalidRows || []).map(mapBackendIssue)
    message.value = 'Preview ready. If the mapped rows look right, run the import.'
  } catch (requestError) {
    error.value = requestError.message || 'Unable to preview the mapped rows.'
  } finally {
    previewLoading.value = false
  }
}

async function waitForImportCompletion(importId) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (importCancelled) {
      return null
    }

    const importLog = await crsStore.getImportStatus(importId)
    if (importLog?.status === 'completed' || importLog?.status === 'failed') {
      return importLog
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  throw new Error('Import is taking too long. Check import history and try again.')
}

function mapBackendIssue(issue = {}) {
  const tradeDraft = {
    pair: issue?.trade?.symbol || issue?.symbol || '',
    direction: issue?.trade?.side || issue?.direction || '',
    openTime: issue?.trade?.entryTime || issue?.entryTime || '',
    entry: issue?.trade?.entryPrice || issue?.entryPrice || issue?.entry || '',
    closePrice: issue?.trade?.exitPrice || issue?.exitPrice || issue?.closePrice || '',
    volume: issue?.trade?.quantity || issue?.quantity || issue?.volume || ''
  }

  return createImportIssue({
    rowNumber: issue.rowNumber,
    tradeDraft,
    reason: issue.reason || issue.message || 'Skipped during import.',
    duplicateTradeId: issue.duplicateTradeId || ''
  })
}

async function loadImportHistory() {
  historyLoading.value = true
  try {
    importHistory.value = await crsStore.getImportHistory()
  } catch {
    importHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

async function removeImportHistoryItem(item) {
  historyDeleting.value = true
  historyDeletingId.value = item.id
  error.value = ''
  message.value = ''

  try {
    const result = await crsStore.deleteImportHistoryItem(item.id)
    await crsStore.hydrateTrades(true)
    await loadImportHistory()
    message.value = `${item.file_name} removed. ${result.deletedTrades || 0} imported trade${result.deletedTrades === 1 ? '' : 's'} were deleted.`
  } catch (requestError) {
    error.value = requestError?.message || 'Unable to remove that import.'
  } finally {
    historyDeleting.value = false
    historyDeletingId.value = ''
  }
}

async function clearImportHistoryList() {
  if (!importHistory.value.length) {
    return
  }

  historyDeleting.value = true
  historyClearingAll.value = true
  error.value = ''
  message.value = ''

  const importIds = importHistory.value.map((item) => item.id)
  const importCount = importIds.length

  try {
    const result = await crsStore.clearImportHistory(importIds)
    await crsStore.hydrateTrades(true)
    await loadImportHistory()
    message.value = `Cleared ${result.deletedImports || importCount} import run${(result.deletedImports || importCount) === 1 ? '' : 's'} and removed ${result.deletedTrades || 0} imported trade${(result.deletedTrades || 0) === 1 ? '' : 's'}.`
  } catch (requestError) {
    error.value = requestError?.message || 'Unable to clear import history.'
  } finally {
    historyDeleting.value = false
    historyClearingAll.value = false
  }
}
</script>
