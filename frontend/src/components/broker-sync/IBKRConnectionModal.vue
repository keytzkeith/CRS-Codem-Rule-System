<template>
  <div class="crs-modal-shell">
    <div class="crs-modal-frame">
      <div class="crs-modal-backdrop" @click="emit('close')"></div>

      <div class="crs-modal-panel max-w-lg">
        <div class="crs-modal-header">
          <div>
            <h3 class="crs-modal-title">Connect Interactive Brokers</h3>
            <p class="crs-modal-copy">Use your Flex Query details to pull closed trades into CRS on a schedule.</p>
          </div>
          <button @click="emit('close')" class="crs-modal-close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="crs-modal-body">
          <div class="crs-modal-note">
            <h4 class="crs-modal-note-title">Before you connect</h4>
            <ol class="crs-modal-note-copy list-inside list-decimal space-y-2">
              <li>Log in to <a href="https://www.interactivebrokers.com/sso/Login" target="_blank" class="underline font-medium">IBKR Client Portal</a></li>
              <li>Navigate to <strong>Performance &amp; Reports &gt; Flex Queries</strong></li>
              <li>Create an Activity Flex Query that includes the Trades section.</li>
              <li>Copy the saved query ID and your current Flex token.</li>
            </ol>
            <p class="mt-3 text-xs text-amber-200">
              <a href="https://www.interactivebrokers.com/en/software/am/am/reports/activityflexqueries.htm" target="_blank" class="underline">View IBKR Flex Query documentation</a>
            </p>
          </div>

          <div v-if="props.error" class="crs-modal-error">
            <div class="flex">
              <svg class="h-5 w-5 flex-shrink-0 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <p class="ml-3">{{ props.error }}</p>
            </div>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <label class="crs-filter-field">
              <span>Flex token</span>
              <input
                id="flexToken"
                v-model="form.flexToken"
                type="password"
                class="crs-input"
                placeholder="Enter your Flex token"
                required
              />
            </label>

            <label class="crs-filter-field">
              <span>Flex Query ID</span>
              <input
                id="flexQueryId"
                v-model="form.flexQueryId"
                type="text"
                class="crs-input"
                placeholder="e.g. 123456"
                required
              />
            </label>

            <div class="crs-toggle-row">
              <div>
                <label class="crs-toggle-title">Auto-sync</label>
                <p class="crs-toggle-copy">Automatically sync trades daily.</p>
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
              <span>Sync time</span>
              <input
                id="syncTime"
                v-model="form.syncTime"
                type="time"
                class="crs-input"
              />
              <p class="text-xs normal-case tracking-normal text-slate-500">
                Time to automatically sync each day in your local timezone.
              </p>
            </label>
          </form>
        </div>

        <div class="crs-modal-footer">
          <button type="button" @click="emit('close')" class="crs-button crs-button-muted">Cancel</button>
          <button
            @click="handleSubmit"
            :disabled="loading || !isValid"
            class="crs-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="loading" class="flex items-center">
              <CrsLoader class="mr-2" compact inline inverse aria-label="Connecting Interactive Brokers" />
              Connecting...
            </span>
            <span v-else>Connect</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CrsLoader from '@/components/crs/CrsLoader.vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  flexToken: '',
  flexQueryId: '',
  autoSyncEnabled: true,
  syncFrequency: 'daily',
  syncTime: '06:00'
})

const isValid = computed(() => {
  return form.value.flexToken.length > 0 && form.value.flexQueryId.length > 0
})

function handleSubmit() {
  if (!isValid.value) return

  emit('save', {
    flexToken: form.value.flexToken,
    flexQueryId: form.value.flexQueryId,
    autoSyncEnabled: form.value.autoSyncEnabled,
    syncFrequency: form.value.syncFrequency,
    syncTime: form.value.syncTime + ':00'
  })
}
</script>
