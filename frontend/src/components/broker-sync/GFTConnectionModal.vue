<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50 transition-opacity" @click="emit('close')"></div>

      <div class="relative w-full max-w-2xl rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Connect Goat Funded Trader</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Map one GFT account to one CRS account, then sync closed trades straight into the journal.
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            @click="emit('close')"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-6 p-6">
          <div class="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <h4 class="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">Before you connect</h4>
            <ol class="list-inside list-decimal space-y-2 text-sm text-amber-700 dark:text-amber-400">
              <li>Create or choose the CRS account that should own these imported trades.</li>
              <li>Paste the GFT account ID used by the broker API.</li>
              <li>Paste the API token for that funded account.</li>
            </ol>
          </div>

          <div v-if="props.error" class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div class="flex">
              <svg class="h-5 w-5 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <p class="ml-3 text-sm text-red-700 dark:text-red-300">{{ props.error }}</p>
            </div>
          </div>

          <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleSubmit">
            <div class="md:col-span-2">
              <label for="connectionName" class="label">Connection name</label>
              <input
                id="connectionName"
                v-model="form.connectionName"
                type="text"
                class="input"
                placeholder="Example: GFT Phase 2 50k"
              />
            </div>

            <div>
              <label for="accountId" class="label">CRS account</label>
              <select id="accountId" v-model="form.accountId" class="input" required>
                <option value="">Select an account</option>
                <option v-for="account in props.accounts" :key="account.id" :value="account.id">
                  {{ account.name }}{{ account.size ? ` ($${Number(account.size).toLocaleString()})` : '' }}
                </option>
              </select>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This decides where synced trades show up inside CRS.
              </p>
            </div>

            <div>
              <label for="externalAccountId" class="label">GFT account ID</label>
              <input
                id="externalAccountId"
                v-model="form.externalAccountId"
                type="text"
                class="input"
                placeholder="Enter broker account ID"
                required
              />
            </div>

            <div class="md:col-span-2">
              <label for="apiToken" class="label">API token</label>
              <input
                id="apiToken"
                v-model="form.apiToken"
                type="password"
                class="input"
                placeholder="Paste the GFT API token"
                required
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                CRS stores this encrypted and uses it only for broker sync.
              </p>
            </div>

            <div class="md:col-span-2 flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white">Auto-sync</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">Run the sync every day without uploading a CSV.</p>
              </div>
              <button
                type="button"
                :class="[
                  form.autoSyncEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2'
                ]"
                @click="form.autoSyncEnabled = !form.autoSyncEnabled"
              >
                <span
                  :class="[
                    form.autoSyncEnabled ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                  ]"
                />
              </button>
            </div>

            <div v-if="form.autoSyncEnabled" class="md:col-span-2">
              <label for="syncTime" class="label">Sync time</label>
              <input id="syncTime" v-model="form.syncTime" type="time" class="input" />
            </div>
          </form>
        </div>

        <div class="flex items-center justify-end space-x-3 border-t border-gray-200 p-6 dark:border-gray-700">
          <button type="button" class="btn-secondary" @click="emit('close')">Cancel</button>
          <button :disabled="props.loading || !isValid" class="btn-primary" @click="handleSubmit">
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
