<template>
  <div class="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(8,15,35,0.28)] transition hover:border-amber-300/25 hover:bg-white/[0.045]">
    <div>
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-4">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border"
            :class="brokerStyles.bgClass"
          >
            <span :class="brokerStyles.textClass" class="font-bold text-lg">
              {{ brokerStyles.abbrev }}
            </span>
          </div>

          <div>
            <h4 class="font-medium text-white">{{ connection.connectionName || brokerStyles.name }}</h4>
            <p v-if="connection.connectionName || connection.externalAccountId" class="mt-1 text-xs text-slate-400">
              {{ connection.connectionName ? brokerStyles.name : '' }}
              <span v-if="connection.connectionName && connection.externalAccountId"> · </span>
              <span v-if="connection.externalAccountId">Acct {{ connection.externalAccountId }}</span>
            </p>
            <div class="flex items-center space-x-2 mt-1">
              <span
                class="px-2 py-0.5 text-xs rounded-full"
                :class="statusClass"
              >
                {{ connection.connectionStatus }}
              </span>
              <span v-if="connection.autoSyncEnabled" class="text-xs text-slate-500">
                Auto-sync {{ connection.syncFrequency }}
              </span>
            </div>
          </div>
        </div>

        <div class="relative" ref="menuRef">
          <button
            @click="showMenu = !showMenu"
            class="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          <div
            v-if="showMenu"
            class="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur"
          >
            <button
              @click="emit('settings', connection); showMenu = false"
              class="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/[0.05] first:rounded-t-2xl"
            >
              Settings
            </button>
            <button
              @click="emit('test', connection); showMenu = false"
              class="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/[0.05]"
            >
              Test Connection
            </button>
            <button
              @click="emit('deleteTrades', connection); showMenu = false"
              class="w-full px-4 py-2 text-left text-sm text-orange-300 hover:bg-white/[0.05]"
            >
              Delete All Trades
            </button>
            <button
              @click="emit('delete', connection); showMenu = false"
              class="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-white/[0.05] last:rounded-b-2xl"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 border-t border-white/8 pt-4">
        <div class="flex items-center justify-between text-sm">
          <div class="text-slate-400">
            <template v-if="connection.lastSyncAt">
              Last synced: {{ formatDate(connection.lastSyncAt) }}
              <span v-if="connection.lastSyncTradesImported" class="text-emerald-300">
                ({{ connection.lastSyncTradesImported }} imported)
              </span>
            </template>
            <template v-else>
              Never synced
            </template>
          </div>

          <button
            @click="emit('sync', connection)"
            :disabled="syncing"
            class="crs-button-primary px-3 py-1.5 text-sm"
          >
            <span v-if="syncing" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Syncing...
            </span>
            <span v-else>Sync Now</span>
          </button>
        </div>

        <div
          v-if="connection.lastErrorMessage && connection.connectionStatus === 'error'"
          class="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {{ connection.lastErrorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBrokerSyncStore } from '@/stores/brokerSync'

const props = defineProps({
  connection: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['sync', 'test', 'settings', 'delete', 'deleteTrades'])

const store = useBrokerSyncStore()
const showMenu = ref(false)
const menuRef = ref(null)

const syncing = computed(() => store.isConnectionSyncing(props.connection.id))

const brokerStyles = computed(() => {
  switch (props.connection.brokerType) {
    case 'ibkr':
      return {
        name: 'Interactive Brokers',
        abbrev: 'IB',
        bgClass: 'border-red-400/20 bg-red-500/10',
        textClass: 'text-red-300'
      }
    case 'schwab':
      return {
        name: 'Charles Schwab',
        abbrev: 'CS',
        bgClass: 'border-sky-400/20 bg-sky-500/10',
        textClass: 'text-sky-300'
      }
    case 'gft':
      return {
        name: 'Goat Funded Trader',
        abbrev: 'GF',
        bgClass: 'border-amber-300/25 bg-amber-400/10',
        textClass: 'text-amber-200'
      }
    default:
      return {
        name: props.connection.brokerType,
        abbrev: props.connection.brokerType.substring(0, 2).toUpperCase(),
        bgClass: 'border-white/10 bg-white/[0.04]',
        textClass: 'text-slate-300'
      }
  }
})

const statusClass = computed(() => {
  switch (props.connection.connectionStatus) {
    case 'active':
      return 'bg-emerald-400/10 text-emerald-200'
    case 'error':
      return 'bg-red-500/10 text-red-200'
    case 'expired':
      return 'bg-amber-400/10 text-amber-200'
    default:
      return 'bg-white/[0.06] text-slate-300'
  }
})

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  const now = new Date()
  const diff = now - d

  // If less than 24 hours, show relative time
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) {
      const minutes = Math.floor(diff / 60000)
      return minutes < 1 ? 'Just now' : `${minutes}m ago`
    }
    return `${hours}h ago`
  }

  return d.toLocaleDateString()
}

// Close menu when clicking outside
function handleClickOutside(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
