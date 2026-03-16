<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Advanced mapping"
        title="Map broker columns into CRS."
        description="Choose only the fields that matter to your workflow. Ignore the rest. No CUSIPs, expiry chains, or irrelevant platform baggage."
      >
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="loadCsv" />
          <button type="button" class="crs-button-primary w-full sm:w-auto" @click="fileInput?.click()">Select CSV</button>
          <router-link to="/trades/import" class="crs-button crs-button-ghost w-full sm:w-auto">Back to import guide</router-link>
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
            <select v-model="fieldMapping[header]" class="crs-input">
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
          <button type="button" class="crs-button-primary w-full sm:w-auto" :disabled="!records.length || importing" @click="importMappedRows">
            {{ importing ? 'Importing...' : 'Import mapped rows' }}
          </button>
          <button type="button" class="crs-button crs-button-ghost w-full sm:w-auto" :disabled="!headers.length" @click="resetMapping">
            Reset mapping
          </button>
        </div>
      </ChartCard>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import ChartCard from '@/components/crs/ChartCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import { useCrsStore } from '@/stores/crs'
import { CRS_IMPORT_FIELDS, createDefaultFieldMapping, createTradeDraftFromRow, normalizeHeader, parseCsvText } from '@/utils/crsCsv'

const crsStore = useCrsStore()
const fileInput = ref(null)
const headers = ref([])
const records = ref([])
const importing = ref(false)
const error = ref('')
const message = ref('')
const fieldMapping = reactive({})

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
    const csvText = await file.text()
    const parsed = parseCsvText(csvText)
    headers.value = parsed.headers
    records.value = parsed.records
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
}

async function importMappedRows() {
  importing.value = true
  error.value = ''
  message.value = ''

  try {
    if (!crsStore.settings.accounts.length) {
      error.value = 'Create at least one account before importing trades.'
      return
    }

    let imported = 0
    for (const row of records.value) {
      const tradeDraft = createTradeDraftFromRow(row, fieldMapping, crsStore.settings)
      if (!tradeDraft.pair || !tradeDraft.entry || !tradeDraft.closePrice) {
        continue
      }

      await crsStore.persistTrade(tradeDraft)
      imported += 1
    }

    message.value = imported
      ? `Imported ${imported} mapped trade${imported === 1 ? '' : 's'} successfully.`
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
</script>
