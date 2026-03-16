<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Personal defaults"
        title="Minimal settings for a rule-based workflow."
        description="CRS keeps settings focused on accounts, risk framing, review cadence, and developer preview controls."
      />
    </section>

    <div class="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <ChartCard
        eyebrow="CRS preferences"
        title="Journal settings"
        description="These settings drive trade capture, risk calculations, and the live empty-state preview."
      >
        <form class="grid gap-5 md:grid-cols-2" @submit.prevent>
          <div
            v-if="saveError"
            class="md:col-span-2 rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          >
            {{ saveError }}
          </div>
          <label class="crs-filter-field">
            <span class="flex items-center gap-2">Currency <InfoTip text="Controls how all PnL, risk, and account values are formatted throughout the CRS interface." /></span>
            <select v-model="localSettings.currency" class="crs-input">
              <option value="USD">USD ($)</option>
            </select>
          </label>
          <label class="crs-filter-field">
            <span class="flex items-center gap-2">Risk mode <InfoTip text="Use a fixed dollar risk or a percentage of the active account balance. CRS converts your R result into currency from this choice." /></span>
            <select v-model="localSettings.riskMode" class="crs-input">
              <option value="amount">Fixed amount</option>
              <option value="percent">Percentage</option>
            </select>
          </label>
          <label class="crs-filter-field">
            <span class="flex items-center gap-2">Risk per trade <InfoTip text="If risk mode is amount, this is a fixed currency value. If risk mode is percent, this is a percentage of the active account balance." /></span>
            <div class="relative">
              <span class="crs-field-prefix">{{ localSettings.riskMode === 'percent' ? '%' : '$' }}</span>
              <input
                v-model.number="localSettings.riskPerTrade"
                type="number"
                step="0.01"
                class="crs-input crs-input-prefixed"
                :placeholder="localSettings.riskMode === 'percent' ? '0.50' : '125.00'"
              />
            </div>
          </label>
          <label class="crs-filter-field">
            <span class="flex items-center gap-2">Preferred period <InfoTip text="The default review framing you want CRS to emphasize when reading your performance." /></span>
            <select v-model="localSettings.preferredPeriod" class="crs-input">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </label>
          <label class="crs-filter-field">
            <span class="flex items-center gap-2">Review cadence <InfoTip text="How often you plan to perform structured review sessions on your trades and journal." /></span>
            <select v-model="localSettings.reviewCadence" class="crs-input">
              <option value="daily">Daily</option>
              <option value="weekend">Weekend</option>
              <option value="month-end">Month-end</option>
            </select>
          </label>
          <div class="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Active account risk</p>
            <p class="mt-2 text-xl font-semibold text-white">{{ currency(effectiveRiskAmount) }}</p>
            <p class="mt-2 text-xs text-slate-500">{{ activeAccount?.name || 'No active account selected' }}</p>
          </div>
          <div class="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
            <p class="text-xs tracking-[0.04em] text-slate-500">Reusable setup stack</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span v-for="setup in crsStore.availableSetupTypes" :key="setup" class="crs-tag-chip crs-tag-chip-idle">{{ setup }}</span>
            </div>
          </div>
          <div class="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300 md:col-span-2">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs tracking-[0.04em] text-slate-500">Rule validation items</p>
                <p class="mt-1 text-sm text-slate-400">Add, remove, or rename the checklist items you actually use. These flow into trade review and checklist analytics.</p>
              </div>
              <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <input v-model="newChecklistLabel" type="text" class="crs-input min-w-[220px]" placeholder="Add a rule like Session liquidity sweep confirmed" />
                <button type="button" class="crs-button-primary w-full sm:w-auto" @click="addChecklistItem">Add rule</button>
              </div>
            </div>
            <div class="mt-4 grid gap-3">
              <div
                v-for="item in localSettings.checklistItems"
                :key="item.id"
                class="grid gap-3 rounded-[18px] border border-white/8 bg-slate-950/30 p-4 md:grid-cols-[1fr_auto]"
              >
                <input v-model="item.label" type="text" class="crs-input" placeholder="Rule label" />
                <button type="button" class="crs-button crs-button-muted w-full sm:w-auto" :disabled="localSettings.checklistItems.length === 1" @click="removeChecklistItem(item.id)">
                  Remove
                </button>
              </div>
            </div>
          </div>
          <div class="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300 md:col-span-2">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs tracking-[0.04em] text-slate-500">Dev preview</p>
                <p class="mt-1 text-sm text-slate-400">Toggle a no-data mode to verify all empty states without deleting mock trades.</p>
              </div>
              <input v-model="localSettings.previewEmptyState" type="checkbox" class="h-4 w-4 rounded border-white/10 bg-transparent text-amber-200" />
            </div>
          </div>

          <div class="md:col-span-2 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Accounts</p>
                <p class="mt-1 text-sm text-slate-400">Up to 10 accounts. Leave this empty if you are not ready yet, but CRS will require one before trade capture or import.</p>
              </div>
              <button type="button" class="crs-button-primary w-full sm:w-auto" :disabled="accountLimitReached" @click="addAccount">
                Add account
              </button>
            </div>

            <div class="space-y-4">
              <div
                v-for="(account, index) in localSettings.accounts"
                :key="account.id"
                class="grid gap-3 rounded-[20px] border border-white/8 bg-slate-950/30 p-4 md:grid-cols-[1.3fr_1fr_auto_auto]"
              >
                <label class="crs-filter-field">
                  <span>Account name</span>
                  <input v-model="account.name" type="text" class="crs-input" :placeholder="`Account ${index + 1}`" />
                </label>
                <label class="crs-filter-field">
                  <span>Account size</span>
                  <div class="relative">
                    <span class="crs-field-prefix">$</span>
                    <input v-model.number="account.size" type="number" step="0.01" class="crs-input crs-input-prefixed" placeholder="25000.00" />
                  </div>
                </label>
                <label class="crs-filter-field">
                  <span>Active</span>
                  <button
                    type="button"
                    class="crs-button w-full sm:w-auto"
                    :class="localSettings.activeAccountId === account.id ? 'crs-button-primary' : 'crs-button-muted'"
                    @click="localSettings.activeAccountId = account.id"
                  >
                    {{ localSettings.activeAccountId === account.id ? 'Active' : 'Set active' }}
                  </button>
                </label>
                <label class="crs-filter-field">
                  <span>Remove</span>
                  <button
                    type="button"
                    class="crs-button crs-button-muted w-full sm:w-auto"
                    @click="removeAccount(account.id)"
                  >
                    Remove
                  </button>
                </label>
              </div>
            </div>

            <p class="mt-4 text-xs text-slate-500">
              {{ localSettings.accounts.length }}/10 accounts used
            </p>
          </div>

          <div class="md:col-span-2 flex flex-col gap-3 sm:flex-row">
            <button type="button" class="crs-button-primary w-full sm:w-auto" :disabled="crsStore.persistenceLoading" @click="saveSettings">
              {{ crsStore.persistenceLoading ? 'Saving...' : 'Save settings' }}
            </button>
            <button type="button" class="crs-button crs-button-muted w-full sm:w-auto" :disabled="crsStore.persistenceLoading" @click="resetSettings">Reset</button>
          </div>
        </form>
      </ChartCard>

      <ChartCard
        eyebrow="Usage notes"
        title="Why these settings exist"
        description="Everything here is intentionally scoped to support personal review, not platform complexity."
      >
        <div class="space-y-4 text-sm leading-7 text-slate-300">
          <p><span class="text-amber-200">Accounts</span> let you keep separate balances while still applying one active risk model at a time.</p>
          <p><span class="text-amber-200">Risk mode</span> controls whether CRS converts `R` into a dollar result from a fixed amount or a percentage of the active account.</p>
          <p><span class="text-amber-200">Dev preview</span> is there so you can force empty charts and verify the fallback states without damaging mock trades.</p>
        </div>
        <div class="mt-6 rounded-[24px] border border-white/5 bg-white/[0.03] p-5">
          <p class="crs-eyebrow">Current saved state</p>
          <pre class="overflow-x-auto text-sm text-slate-400">{{ formattedSettings }}</pre>
        </div>
      </ChartCard>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import ChartCard from '@/components/crs/ChartCard.vue'
import InfoTip from '@/components/crs/InfoTip.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import { useCrsStore } from '@/stores/crs'
import { calculateRiskAmount, getActiveAccount } from '@/utils/crsAnalytics'

const crsStore = useCrsStore()

const localSettings = reactive(cloneSettings(crsStore.settings))
const saveError = computed(() => formatPersistenceError(crsStore.persistenceError))
const newChecklistLabel = ref('')

watch(
  () => crsStore.settings,
  (nextValue) => {
    Object.assign(localSettings, cloneSettings(nextValue))
  },
  { deep: true }
)

watch(
  () => localSettings.previewEmptyState,
  (nextValue) => {
    if (nextValue === crsStore.settings.previewEmptyState) {
      return
    }

    crsStore.updateSettings({ previewEmptyState: nextValue })
  }
)

const formattedSettings = computed(() => JSON.stringify(crsStore.settings, null, 2))
const effectiveRiskAmount = computed(() => calculateRiskAmount(localSettings))
const activeAccount = computed(() => getActiveAccount(localSettings))
const accountLimitReached = computed(() => (localSettings.accounts || []).length >= 10)

function addAccount() {
  if (accountLimitReached.value) {
    return
  }

  localSettings.accounts.push({
    id: `account-${Date.now()}`,
    name: `Account ${localSettings.accounts.length + 1}`,
    size: 10000
  })

  if (!localSettings.activeAccountId) {
    localSettings.activeAccountId = localSettings.accounts.at(-1)?.id || null
  }
}

function removeAccount(accountId) {
  localSettings.accounts = localSettings.accounts.filter((account) => account.id !== accountId)

  if (localSettings.activeAccountId === accountId) {
    localSettings.activeAccountId = localSettings.accounts[0]?.id || null
  }
}

function addChecklistItem() {
  const label = newChecklistLabel.value.trim()
  if (!label) {
    return
  }

  localSettings.checklistItems.push({
    id: slugifyChecklistLabel(label),
    label
  })
  newChecklistLabel.value = ''
}

function removeChecklistItem(itemId) {
  if (localSettings.checklistItems.length === 1) {
    return
  }

  localSettings.checklistItems = localSettings.checklistItems.filter((item) => item.id !== itemId)
}

async function saveSettings() {
  await crsStore.persistSettings(cloneSettings(localSettings))
  Object.assign(localSettings, cloneSettings(crsStore.settings))
}

function resetSettings() {
  Object.assign(localSettings, cloneSettings(crsStore.settings))
}

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: localSettings.currency || 'USD',
    maximumFractionDigits: 2
  }).format(value)
}

function cloneSettings(value) {
  return JSON.parse(JSON.stringify(value))
}

function slugifyChecklistLabel(label) {
  const slug = String(label || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (value) => value.toLowerCase())

  return slug || `rule${Date.now()}`
}

function formatPersistenceError(error) {
  const backendMessage = error?.response?.data?.error

  if (backendMessage) {
    return backendMessage
  }

  if (!error) {
    return ''
  }

  if (!error.response) {
    return 'Unable to reach the backend. Check that the API server and database are running.'
  }

  if (error.response.status >= 500) {
    return 'Server error while saving settings. Check the backend logs and try again.'
  }

  return 'Unable to save settings with the current values.'
}
</script>
