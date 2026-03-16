<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Trade import"
        title="Bring in broker CSVs without guessing."
        description="Use quick import when your file already matches the common layout. If auto-detection fails, switch to advanced mapping and decide exactly which fields to use or ignore."
        stacked
      >
        <div class="flex w-full flex-col gap-3 lg:flex-row">
          <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="handleFileSelect" />
          <button type="button" class="crs-button crs-button-ghost w-full lg:w-auto" :disabled="importing || previewLoading" @click="fileInput?.click()">
            {{ selectedFileName ? 'Replace CSV file' : 'Choose CSV file' }}
          </button>
          <button type="button" class="crs-button-primary w-full lg:w-auto" :disabled="!selectedFile || importing || previewLoading || !importPreview" @click="runImport">
            {{ importing ? 'Importing...' : 'Start quick import' }}
          </button>
          <router-link to="/trades/import/advanced" class="crs-button crs-button-muted w-full lg:w-auto">
            Open advanced mapping
          </router-link>
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
      title="Create an account before importing."
      description="CRS uses the active account as the default destination for imported rows that do not specify an account."
    >
      <router-link to="/accounts" class="crs-button-primary w-full sm:w-auto">Go to accounts</router-link>
    </ChartCard>

    <div v-else class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <ChartCard
        eyebrow="Supported layout"
        title="Quick import columns"
        description="These are the column layouts CRS can understand in quick import. Extra columns are ignored. If your headers differ, use Advanced mapping."
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <p class="crs-eyebrow">Broker-style headers</p>
            <div class="rounded-[20px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300">
              id, symbol, direction, volume, open_price, close_price, open_time, close_time, profit, commission, swap, net_profit, sl, tp
            </div>
          </div>
          <div>
            <p class="crs-eyebrow">CRS-native headers</p>
            <div class="rounded-[20px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300">
              id, symbol, direction, volume, open_price, close_price, open_time, close_time, profit, commission, swap, net_profit, sl, tp, session, setup, tags, notes, account_name
            </div>
          </div>
          <div>
            <p class="crs-eyebrow">Accepted meanings</p>
            <ul class="space-y-2 text-sm text-slate-300">
              <li><span class="text-amber-200">Required:</span> `symbol`, `direction`, `open_price`, `close_price`, `open_time`</li>
              <li><span class="text-amber-200">Strongly recommended:</span> `volume`, `sl`, `tp`, `net_profit`</li>
              <li><span class="text-amber-200">Optional:</span> `id`, `close_time`, `profit`, `commission`, `swap`, `session`, `setup`, `tags`, `notes`, `account_name`</li>
            </ul>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Notes"
        title="When to use advanced mapping"
        description="Use the advanced importer if your broker names fields differently or includes columns you want to skip."
      >
        <div class="space-y-4 text-sm leading-7 text-slate-300">
          <p><span class="text-amber-200">Quick import</span> is best when your CSV already resembles the shown layout.</p>
          <p><span class="text-amber-200">Advanced mapping</span> is for custom broker headers, column matching, and excluding unnecessary fields before import.</p>
          <p><span class="text-amber-200">Current CRS fields</span> support symbol, direction, volume, time, stop, target, commission, swap, net profit, notes, setup, tags, and account name.</p>
        </div>
      </ChartCard>
    </div>

    <ImportPreviewCard :preview="importPreview" />

    <ImportReportCard
      :duplicates="duplicateRows"
      :invalid-rows="invalidRows"
      :failed-rows="failedRows"
      file-name="crs-quick-import-report.csv"
      title="Quick import review"
      description="Skipped rows are listed here so you can see which trades were duplicates or missing core fields before retrying."
    />

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
import { onBeforeUnmount, ref } from 'vue'
import ChartCard from '@/components/crs/ChartCard.vue'
import ImportHistoryCard from '@/components/crs/ImportHistoryCard.vue'
import ImportPreviewCard from '@/components/crs/ImportPreviewCard.vue'
import ImportReportCard from '@/components/crs/ImportReportCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import { useCrsStore } from '@/stores/crs'
import { createImportIssue } from '@/utils/crsImportReport'

const crsStore = useCrsStore()
const fileInput = ref(null)
const importing = ref(false)
const previewLoading = ref(false)
const error = ref('')
const message = ref('')
const selectedFile = ref(null)
const selectedFileName = ref('')
const importPreview = ref(null)
const importHistory = ref([])
const historyLoading = ref(false)
const historyDeleting = ref(false)
const historyDeletingId = ref('')
const historyClearingAll = ref(false)
const duplicateRows = ref([])
const invalidRows = ref([])
const failedRows = ref([])
let importCancelled = false

onBeforeUnmount(() => {
  importCancelled = true
})

loadImportHistory()

async function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) {
    return
  }

  selectedFile.value = file
  selectedFileName.value = file.name
  previewLoading.value = true
  error.value = ''
  message.value = ''
  importPreview.value = null
  duplicateRows.value = []
  invalidRows.value = []
  failedRows.value = []

  try {
    if (!crsStore.settings.accounts.length) {
      error.value = 'Create at least one account before importing trades.'
      return
    }

    importPreview.value = await crsStore.previewImport(file)
    message.value = 'Preview ready. Review the rows below, then run the import.'
  } catch (requestError) {
    error.value = requestError?.message || 'Unable to preview this CSV file. Try Advanced mapping if the column names do not match.'
  } finally {
    previewLoading.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

async function runImport() {
  if (!selectedFile.value) {
    error.value = 'Select a CSV file first.'
    return
  }

  importing.value = true
  error.value = ''
  message.value = ''
  duplicateRows.value = []
  invalidRows.value = []
  failedRows.value = []

  try {
    message.value = 'Import started. CRS is validating and saving the file on the backend.'
    const result = await crsStore.startImport(selectedFile.value)
    const importLog = await waitForImportCompletion(result.importId)

    if (!importLog || importCancelled) {
      return
    }

    const details = importLog.error_details || {}
    duplicateRows.value = (details.duplicateRows || []).map(mapBackendIssue)
    invalidRows.value = (details.invalidRows || []).map(mapBackendIssue)
    failedRows.value = (details.failedTrades || []).map(mapBackendIssue)

    if (importLog.status === 'failed') {
      error.value = details.error || 'Import failed on the backend.'
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
      ? `Imported ${imported} trade${imported === 1 ? '' : 's'} successfully.${duplicates ? ` Skipped ${duplicates} duplicate${duplicates === 1 ? '' : 's'}.` : ''}${invalid ? ` Ignored ${invalid} incomplete row${invalid === 1 ? '' : 's'}.` : ''}${failed ? ` ${failed} row${failed === 1 ? '' : 's'} failed during import.` : ''}`
      : 'No valid trades were found in this CSV. Try Advanced mapping if the headers differ.'
  } catch (requestError) {
    error.value = requestError?.message || 'Unable to import this CSV file. Try Advanced mapping if the column names do not match.'
  } finally {
    importing.value = false
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
