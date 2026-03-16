<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Trade import"
        title="Bring in broker CSVs without guessing."
        description="Use quick import when your file already matches the common layout. If auto-detection fails, switch to advanced mapping and decide exactly which fields to use or ignore."
      >
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="handleImport" />
          <button type="button" class="crs-button-primary w-full sm:w-auto" :disabled="importing" @click="fileInput?.click()">
            {{ importing ? 'Importing...' : 'Quick import CSV' }}
          </button>
          <router-link to="/trades/import/advanced" class="crs-button crs-button-ghost w-full sm:w-auto">
            Advanced mapping
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
              id, symbol, direction, volume, entry, close_price, open_time, close_time, result_amount, commission, swap, stop_loss, take_profit, account_name, setup, tags, notes
            </div>
          </div>
          <div>
            <p class="crs-eyebrow">Accepted meanings</p>
            <ul class="space-y-2 text-sm text-slate-300">
              <li><span class="text-amber-200">Required:</span> `symbol`, `direction`, `open_price`, `close_price`, `open_time`</li>
              <li><span class="text-amber-200">Strongly recommended:</span> `volume`, `sl`, `tp`, `net_profit`</li>
              <li><span class="text-amber-200">Optional:</span> `id`, `close_time`, `profit`, `commission`, `swap`</li>
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
          <p><span class="text-amber-200">Current CRS fields</span> support symbol, direction, volume, entry, close, stop, target, commission, swap, and net profit.</p>
        </div>
      </ChartCard>
    </div>

    <ImportReportCard
      :duplicates="duplicateRows"
      :invalid-rows="invalidRows"
      file-name="crs-quick-import-report.csv"
      title="Quick import review"
      description="Skipped rows are listed here so you can see which trades were duplicates or missing core fields before retrying."
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChartCard from '@/components/crs/ChartCard.vue'
import ImportReportCard from '@/components/crs/ImportReportCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import { useCrsStore } from '@/stores/crs'
import { createDefaultFieldMapping, createTradeDraftFromRow, parseCsvText } from '@/utils/crsCsv'
import { createImportIssue } from '@/utils/crsImportReport'

const crsStore = useCrsStore()
const fileInput = ref(null)
const importing = ref(false)
const error = ref('')
const message = ref('')
const duplicateRows = ref([])
const invalidRows = ref([])

async function handleImport(event) {
  const file = event.target.files?.[0]
  if (!file) {
    return
  }

  importing.value = true
  error.value = ''
  message.value = ''
  duplicateRows.value = []
  invalidRows.value = []

  try {
    if (!crsStore.settings.accounts.length) {
      error.value = 'Create at least one account before importing trades.'
      return
    }

    const csvText = await file.text()
    const { headers, records } = parseCsvText(csvText)
    const mapping = createDefaultFieldMapping(headers)

    let imported = 0
    let duplicates = 0
    let invalid = 0
    records.forEach((row, index) => {
      row.__rowNumber = index + 2
    })

    for (const row of records) {
      const tradeDraft = createTradeDraftFromRow(row, mapping, crsStore.settings)
      if (!tradeDraft.pair || !tradeDraft.entry || !tradeDraft.closePrice) {
        invalid += 1
        invalidRows.value.push(createImportIssue({
          rowNumber: row.__rowNumber,
          tradeDraft,
          reason: 'Missing one of the required fields: symbol, entry, or close price.'
        }))
        continue
      }

      try {
        await crsStore.persistTrade(tradeDraft)
        imported += 1
      } catch (requestError) {
        if (requestError?.code === 'DUPLICATE_TRADE') {
          duplicates += 1
          duplicateRows.value.push(createImportIssue({
            rowNumber: row.__rowNumber,
            tradeDraft,
            reason: requestError.message,
            duplicateTradeId: requestError.duplicateTradeId
          }))
          continue
        }

        throw requestError
      }
    }

    message.value = imported || duplicates
      ? `Imported ${imported} trade${imported === 1 ? '' : 's'} successfully.${duplicates ? ` Skipped ${duplicates} duplicate${duplicates === 1 ? '' : 's'}.` : ''}${invalid ? ` Ignored ${invalid} incomplete row${invalid === 1 ? '' : 's'}.` : ''}`
      : 'No valid trades were found in this CSV. Try Advanced mapping if the headers differ.'
  } catch (requestError) {
    error.value = requestError?.message || 'Unable to import this CSV file. Try Advanced mapping if the column names do not match.'
  } finally {
    importing.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}
</script>
