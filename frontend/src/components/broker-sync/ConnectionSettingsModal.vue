<template>
  <div class="crs-modal-shell">
    <div class="crs-modal-frame">
      <div class="crs-modal-backdrop" @click="emit('close')"></div>

      <div class="crs-modal-panel max-w-lg">
        <div class="crs-modal-header">
          <div>
            <h3 class="crs-modal-title">Connection settings</h3>
            <p class="crs-modal-copy">Adjust sync behavior for this broker connection.</p>
          </div>
          <button @click="emit('close')" class="crs-modal-close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="crs-modal-body">
          <div class="crs-modal-info-card">
            <div
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border"
              :class="brokerStyles.bgClass"
            >
              <span :class="brokerStyles.textClass" class="font-bold">
                {{ brokerStyles.abbrev }}
              </span>
            </div>
            <div>
              <h4 class="font-medium text-white">{{ brokerStyles.name }}</h4>
              <p class="text-sm text-slate-400">Connected {{ formatDate(connection.createdAt) }}</p>
            </div>
          </div>

          <div class="crs-toggle-row">
            <div>
              <label class="crs-toggle-title">Auto-sync</label>
              <p class="crs-toggle-copy">Automatically sync trades on schedule.</p>
            </div>
            <button
              type="button"
              @click="form.autoSyncEnabled = !form.autoSyncEnabled"
              :class="[
                'crs-switch',
                form.autoSyncEnabled ? 'crs-switch-active' : 'crs-switch-idle'
              ]"
            >
              <span
                :class="[
                  'crs-switch-thumb',
                  form.autoSyncEnabled ? 'crs-switch-thumb-active' : 'crs-switch-thumb-idle'
                ]"
              />
            </button>
          </div>

          <label v-if="form.autoSyncEnabled" class="crs-filter-field">
            <span>Sync frequency</span>
            <select id="syncFrequency" v-model="form.syncFrequency" class="crs-input">
              <option value="hourly">Every hour</option>
              <option value="every_4_hours">Every 4 hours</option>
              <option value="every_6_hours">Every 6 hours</option>
              <option value="every_12_hours">Every 12 hours</option>
              <option value="daily">Daily</option>
              <option value="manual">Manual only</option>
            </select>
            <p class="text-xs normal-case tracking-normal text-slate-500">
              More frequent syncing keeps the journal and analytics current.
            </p>
          </label>

          <label
            v-if="form.autoSyncEnabled && form.syncFrequency === 'daily'"
            class="crs-filter-field"
          >
            <span>Sync time</span>
            <input
              id="syncTime"
              v-model="form.syncTime"
              type="time"
              class="crs-input"
            />
            <p class="text-xs normal-case tracking-normal text-slate-500">
              Time to sync each day in your local timezone.
            </p>
          </label>

          <div class="border-t border-white/8 pt-4">
            <h4 class="mb-3 text-sm font-medium text-white">Connection status</h4>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500">Status</dt>
                <dd>
                  <span class="rounded-full px-2 py-0.5 text-xs" :class="statusClass">
                    {{ connection.connectionStatus }}
                  </span>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Last sync</dt>
                <dd class="text-white">
                  {{ connection.lastSyncAt ? formatDate(connection.lastSyncAt) : 'Never' }}
                </dd>
              </div>
              <div v-if="connection.nextScheduledSync" class="flex justify-between">
                <dt class="text-slate-500">Next sync</dt>
                <dd class="text-white">{{ formatDate(connection.nextScheduledSync) }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="crs-modal-footer">
          <button type="button" @click="emit('close')" class="crs-button crs-button-muted">
            Cancel
          </button>
          <button
            @click="handleSave"
            :disabled="loading"
            class="crs-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="loading" class="flex items-center">
              <CrsLoader class="mr-2" compact inline inverse aria-label="Saving connection settings" />
              Saving...
            </span>
            <span v-else>Save changes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import CrsLoader from '@/components/crs/CrsLoader.vue'

const props = defineProps({
  connection: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  autoSyncEnabled: props.connection.autoSyncEnabled,
  syncFrequency: props.connection.syncFrequency,
  syncTime: props.connection.syncTime?.substring(0, 5) || '06:00'
})

watch(
  () => props.connection,
  (newConnection) => {
    form.value = {
      autoSyncEnabled: newConnection.autoSyncEnabled,
      syncFrequency: newConnection.syncFrequency,
      syncTime: newConnection.syncTime?.substring(0, 5) || '06:00'
    }
  }
)

const brokerStyles = computed(() => {
  switch (props.connection.brokerType) {
    case 'ibkr':
      return {
        name: 'Interactive Brokers',
        abbrev: 'IB',
        bgClass: 'border-red-400/25 bg-red-500/10',
        textClass: 'text-red-300'
      }
    case 'schwab':
      return {
        name: 'Charles Schwab',
        abbrev: 'CS',
        bgClass: 'border-sky-400/25 bg-sky-500/10',
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
  return new Date(date).toLocaleString()
}

function handleSave() {
  emit('save', {
    autoSyncEnabled: form.value.autoSyncEnabled,
    syncFrequency: form.value.syncFrequency,
    syncTime: form.value.syncTime + ':00'
  })
}
</script>
