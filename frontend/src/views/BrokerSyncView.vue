<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Automation"
        title="Broker sync"
        description="Connect a broker account, map it to a CRS account, and pull in closed trades without repeating the import routine."
      />
    </section>

    <div v-if="successMessage" class="rounded-[20px] border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
      <div class="flex">
        <svg class="h-5 w-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <p class="ml-3">{{ successMessage }}</p>
      </div>
    </div>

    <div v-if="store.error" class="rounded-[20px] border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
      <div class="flex">
        <svg class="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <p class="ml-3">{{ store.error }}</p>
      </div>
    </div>

    <div v-if="store.loading && !store.hasConnections" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else class="space-y-8">
      <ChartCard
        v-if="store.hasConnections"
        eyebrow="Live connections"
        title="Connected brokers"
        description="Each connection keeps its own credentials, account mapping, and sync history."
      >
        <div class="grid gap-4 md:grid-cols-2">
          <BrokerConnectionCard
            v-for="connection in store.connections"
            :key="connection.id"
            :connection="connection"
            @sync="handleSync"
            @test="handleTest"
            @settings="openSettingsModal"
            @delete="handleDelete"
            @deleteTrades="handleDeleteTrades"
          />
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Add connection"
        title="Connect another broker"
        description="Goat Funded Trader is ready now. The other cards stay here so future broker formats can slot into the same workflow."
      >
        <div class="grid gap-6 md:grid-cols-2">
          <div
            class="rounded-[24px] border border-dashed p-6 transition"
            :class="[
              !(crsStore.settings.accounts || []).length
                ? 'border-white/10 bg-white/[0.03] opacity-60 cursor-not-allowed'
                : 'border-amber-300/30 bg-amber-400/[0.08] cursor-pointer hover:border-amber-300/50 hover:bg-amber-400/[0.12]'
            ]"
            @click="(crsStore.settings.accounts || []).length && openGFTModal()"
          >
            <div class="flex items-center space-x-4">
              <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/10">
                <span class="text-lg font-bold text-amber-200">GF</span>
              </div>
              <div>
                <h4 class="font-medium text-white">Goat Funded Trader</h4>
                <p class="text-sm text-slate-400">
                  {{
                    !(crsStore.settings.accounts || []).length
                      ? 'Create a CRS account first'
                      : 'Connect with account ID and token'
                  }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 opacity-70 transition"
            :class="store.ibkrConnection ? 'cursor-not-allowed' : 'hover:border-white/20'"
            @click="!store.ibkrConnection && openIBKRModal()"
          >
            <div class="flex items-center space-x-4">
              <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10">
                <span class="text-lg font-bold text-red-300">IB</span>
              </div>
              <div>
                <h4 class="font-medium text-white">Interactive Brokers</h4>
                <p class="text-sm text-slate-400">
                  {{ store.ibkrConnection ? 'Already connected' : 'Connect via Flex Query' }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 opacity-70 transition"
            :class="store.schwabConnection ? 'cursor-not-allowed' : 'hover:border-white/20'"
            @click="!store.schwabConnection && handleSchwabConnect()"
          >
            <div class="flex items-center space-x-4">
              <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-500/10">
                <span class="text-lg font-bold text-sky-300">CS</span>
              </div>
              <div>
                <h4 class="font-medium text-white">Charles Schwab</h4>
                <p class="text-sm text-slate-400">
                  {{ store.schwabConnection ? 'Already connected' : 'Connect via OAuth' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!(crsStore.settings.accounts || []).length"
          class="mt-4 rounded-[20px] border border-red-500/20 bg-red-500/10 p-3"
        >
          <p class="text-xs text-red-200">
              Add at least one CRS account in Settings before connecting Goat Funded Trader. Each broker connection maps to one CRS account.
          </p>
        </div>

        <div class="mt-4 rounded-[20px] border border-amber-300/20 bg-amber-400/10 p-3">
          <p class="text-xs text-amber-100">
              <strong>Note for former TD Ameritrade users:</strong> The Schwab API only returns trades made natively on Schwab. Historical TD Ameritrade trades are not available via API sync. Use CSV import for complete trade history.
          </p>
        </div>
      </ChartCard>

      <ChartCard eyebrow="Audit trail" title="Sync history" description="Recent runs across all broker connections.">
          <div class="mb-6 flex items-center justify-between">
            <button
              @click="refreshLogs"
              class="crs-button crs-button-muted text-sm"
            >
              Refresh
            </button>
          </div>

          <div v-if="store.syncLogs.length === 0" class="py-8 text-center text-slate-400">
            No sync history yet. Connect a broker and sync to see history here.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-white/10">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Broker</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Imported</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Duplicates</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-for="log in store.syncLogs" :key="log.id">
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span class="font-medium uppercase text-white">{{ log.brokerType }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap capitalize text-slate-400">
                    {{ log.syncType }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs rounded-full"
                      :class="getStatusClass(log.status)"
                    >
                      {{ log.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-white">
                    {{ log.tradesImported || 0 }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-slate-400">
                    {{ log.duplicatesDetected || 0 }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-slate-400">
                    {{ formatDate(log.startedAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </ChartCard>
    </div>

    <!-- IBKR Connection Modal -->
    <IBKRConnectionModal
      v-if="showIBKRModal"
      @close="closeIBKRModal"
      @save="handleIBKRSave"
      :loading="store.loading"
      :error="store.error"
    />

    <GFTConnectionModal
      v-if="showGFTModal"
      :accounts="crsStore.settings.accounts || []"
      :loading="store.loading"
      :error="store.error"
      @close="closeGFTModal"
      @save="handleGFTSave"
    />

    <!-- Settings Modal -->
    <ConnectionSettingsModal
      v-if="showSettingsModal"
      :connection="selectedConnection"
      @close="showSettingsModal = false"
      @save="handleSettingsSave"
      :loading="store.loading"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBrokerSyncStore } from '@/stores/brokerSync'
import { useCrsStore } from '@/stores/crs'
import { useNotification } from '@/composables/useNotification'
import ChartCard from '@/components/crs/ChartCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'
import BrokerConnectionCard from '@/components/broker-sync/BrokerConnectionCard.vue'
import IBKRConnectionModal from '@/components/broker-sync/IBKRConnectionModal.vue'
import GFTConnectionModal from '@/components/broker-sync/GFTConnectionModal.vue'
import ConnectionSettingsModal from '@/components/broker-sync/ConnectionSettingsModal.vue'

const store = useBrokerSyncStore()
const crsStore = useCrsStore()
const route = useRoute()
const { showConfirmation, showDangerConfirmation } = useNotification()

const showIBKRModal = ref(false)
const showGFTModal = ref(false)
const showSettingsModal = ref(false)
const selectedConnection = ref(null)
const successMessage = ref('')

onMounted(async () => {
  await crsStore.hydratePersistence()
  await store.fetchConnections()
  await store.fetchSyncLogs()

  // Check for OAuth callback success
  if (route.query.success === 'schwab') {
    successMessage.value = 'Schwab account connected successfully!'
    setTimeout(() => { successMessage.value = '' }, 5000)
  }

  if (route.query.error) {
    store.error = `Connection failed: ${route.query.error}`
  }
})

// Watch for route changes (OAuth callback)
watch(() => route.query, async (newQuery) => {
  if (newQuery.success === 'schwab') {
    await store.fetchConnections()
    successMessage.value = 'Schwab account connected successfully!'
    setTimeout(() => { successMessage.value = '' }, 5000)
  }
})

function openIBKRModal() {
  store.clearError()
  showIBKRModal.value = true
}

function closeIBKRModal() {
  store.clearError()
  showIBKRModal.value = false
}

function openGFTModal() {
  store.clearError()
  showGFTModal.value = true
}

function closeGFTModal() {
  store.clearError()
  showGFTModal.value = false
}

function openSettingsModal(connection) {
  selectedConnection.value = connection
  showSettingsModal.value = true
}

async function handleIBKRSave(credentials) {
  try {
    await store.addIBKRConnection(credentials)
    showIBKRModal.value = false
    successMessage.value = 'IBKR connection added successfully!'
    setTimeout(() => { successMessage.value = '' }, 5000)
  } catch (error) {
    // Error is handled by store
  }
}

async function handleGFTSave(credentials) {
  try {
    await store.addGFTConnection(credentials)
    showGFTModal.value = false
    successMessage.value = 'Goat Funded Trader connection added successfully!'
    setTimeout(() => { successMessage.value = '' }, 5000)
  } catch (error) {
    // Error is handled by store
  }
}

async function handleSchwabConnect() {
  try {
    const authUrl = await store.initSchwabOAuth()
    // Redirect to Schwab OAuth
    window.location.href = authUrl
  } catch (error) {
    // Error is handled by store
  }
}

async function handleSync(connection) {
  try {
    await store.triggerSync(connection.id)
    successMessage.value = 'Sync started! Check the history below for results.'
    setTimeout(() => { successMessage.value = '' }, 5000)

    // Poll for updates and refresh trades data
    setTimeout(async () => {
      await store.fetchConnections()
      await store.fetchSyncLogs()
      await crsStore.hydrateTrades(true)
    }, 5000)
  } catch (error) {
    // Error is handled by store
  }
}

async function handleTest(connection) {
  try {
    const result = await store.testConnection(connection.id)
    if (result.success) {
      successMessage.value = 'Connection test successful!'
    } else {
      store.error = result.message || 'Connection test failed'
    }
    setTimeout(() => { successMessage.value = '' }, 5000)
  } catch (error) {
    // Error is handled by store
  }
}

async function handleSettingsSave(updates) {
  try {
    await store.updateConnection(selectedConnection.value.id, updates)
    showSettingsModal.value = false
    successMessage.value = 'Settings updated successfully!'
    setTimeout(() => { successMessage.value = '' }, 5000)
  } catch (error) {
    // Error is handled by store
  }
}

async function handleDelete(connection) {
  const brokerName = connection.brokerType.toUpperCase()

  showConfirmation(
    `Disconnect ${brokerName}?`,
    'This will remove the broker connection. Your imported trades will not be deleted.',
    async () => {
      try {
        await store.deleteConnection(connection.id)
        successMessage.value = 'Connection removed successfully!'
        setTimeout(() => { successMessage.value = '' }, 5000)
      } catch (error) {
        // Error is handled by store
      }
    }
  )
}

async function handleDeleteTrades(connection) {
  const brokerName = connection.brokerType.toUpperCase()

  showDangerConfirmation(
    `Delete All ${brokerName} Trades?`,
    `This will permanently delete ALL trades that were imported via broker sync from ${brokerName}. This action cannot be undone.`,
    async () => {
      try {
        const result = await store.deleteBrokerTrades(connection.id)
        successMessage.value = result.message || `Deleted trades from ${brokerName}`
        setTimeout(() => { successMessage.value = '' }, 5000)

        await crsStore.hydrateTrades(true)
      } catch (error) {
        // Error is handled by store
      }
    },
    { confirmText: 'Delete All Trades' }
  )
}

async function refreshLogs() {
  await store.fetchSyncLogs()
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

function getStatusClass(status) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    case 'failed':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    case 'started':
    case 'fetching':
    case 'parsing':
    case 'importing':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    default:
      return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  }
}
</script>
