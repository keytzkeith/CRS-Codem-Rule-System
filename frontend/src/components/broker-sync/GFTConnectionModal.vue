<template>
  <div class="crs-modal-shell">
    <div class="crs-modal-frame">
      <div class="crs-modal-backdrop" @click="emit('close')"></div>

      <div class="crs-modal-panel max-w-2xl">
        <div class="crs-modal-header">
          <div>
            <h3 class="crs-modal-title">Connect Goat Funded Trader</h3>
            <p class="crs-modal-copy">
              Map one GFT account to one CRS account, then sync closed trades straight into the journal.
            </p>
          </div>
          <button class="crs-modal-close" @click="emit('close')">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="crs-modal-body">
          <div class="crs-modal-note">
            <h4 class="crs-modal-note-title">Before you connect</h4>
            <ol class="crs-modal-note-copy list-inside list-decimal space-y-2">
              <li>Create or choose the CRS account that should own these imported trades.</li>
              <li>Paste the GFT account ID used by the broker API.</li>
              <li>Paste the API token for that funded account.</li>
            </ol>
          </div>

          <div v-if="props.error" class="crs-modal-error">
            <div class="flex">
              <svg class="h-5 w-5 flex-shrink-0 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <p class="ml-3">{{ props.error }}</p>
            </div>
          </div>

          <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleSubmit">
            <label class="crs-filter-field md:col-span-2">
              <span>Connection name</span>
              <input
                id="connectionName"
                v-model="form.connectionName"
                type="text"
                class="crs-input"
                placeholder="Example: GFT Phase 2 50k"
              />
            </label>

            <label class="crs-filter-field">
              <span>CRS account</span>
              <select id="accountId" v-model="form.accountId" class="crs-input" required>
                <option value="">Select an account</option>
                <option v-for="account in props.accounts" :key="account.id" :value="account.id">
                  {{ account.name }}{{ account.size ? ` ($${Number(account.size).toLocaleString()})` : '' }}
                </option>
              </select>
              <p class="text-xs normal-case tracking-normal text-slate-500">
                This decides where synced trades show up inside CRS.
              </p>
            </label>

            <label class="crs-filter-field">
              <span>GFT account ID</span>
              <input
                id="externalAccountId"
                v-model="form.externalAccountId"
                type="text"
                class="crs-input"
                placeholder="Enter broker account ID"
                required
              />
            </label>

            <label class="crs-filter-field md:col-span-2">
              <span>API token</span>
              <input
                id="apiToken"
                v-model="form.apiToken"
                type="password"
                class="crs-input"
                placeholder="Paste the GFT API token"
                required
              />
              <p class="text-xs normal-case tracking-normal text-slate-500">
                CRS stores this encrypted and uses it only for broker sync.
              </p>
            </label>

            <div class="crs-toggle-row md:col-span-2">
              <div>
                <label class="crs-toggle-title">Auto-sync</label>
                <p class="crs-toggle-copy">Run the sync every day without uploading a CSV.</p>
              </div>
              <button
                type="button"
                :class="[
                  'crs-switch',
                  form.autoSyncEnabled ? 'crs-switch-active' : 'crs-switch-idle'
                ]"
                @click="form.autoSyncEnabled = !form.autoSyncEnabled"
              >
                <span
                  :class="[
                    'crs-switch-thumb',
                    form.autoSyncEnabled ? 'crs-switch-thumb-active' : 'crs-switch-thumb-idle'
                  ]"
                />
              </button>
            </div>

            <label v-if="form.autoSyncEnabled" class="crs-filter-field md:col-span-2">
              <span>Sync time</span>
              <input id="syncTime" v-model="form.syncTime" type="time" class="crs-input" />
            </label>
          </form>
        </div>

        <div class="crs-modal-footer">
          <button type="button" class="crs-button crs-button-muted" @click="emit('close')">Cancel</button>
          <button :disabled="props.loading || !isValid" class="crs-button-primary disabled:cursor-not-allowed disabled:opacity-60" @click="handleSubmit">
            <span v-if="props.loading" class="flex items-center">
              <div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Connecting...
            </span>
            <span v-else>Connect GFT</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  accounts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  connectionName: '',
  accountId: '',
  externalAccountId: '',
  apiToken: '',
  autoSyncEnabled: true,
  syncFrequency: 'daily',
  syncTime: '06:00'
})

const isValid = computed(() =>
  Boolean(form.value.accountId && form.value.externalAccountId.trim() && form.value.apiToken.trim())
)

function handleSubmit() {
  if (!isValid.value) {
    return
  }

  emit('save', {
    connectionName: form.value.connectionName.trim(),
    accountId: form.value.accountId,
    externalAccountId: form.value.externalAccountId.trim(),
    apiToken: form.value.apiToken.trim(),
    autoSyncEnabled: form.value.autoSyncEnabled,
    syncFrequency: form.value.syncFrequency,
    syncTime: `${form.value.syncTime}:00`
  })
}
</script>
