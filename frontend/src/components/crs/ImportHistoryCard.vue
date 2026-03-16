<template>
  <div class="rounded-[24px] border border-white/8 bg-slate-950/25 p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs tracking-[0.04em] text-slate-500">{{ eyebrow }}</p>
        <h3 class="mt-2 text-xl font-semibold text-white">{{ title }}</h3>
        <p class="mt-2 text-sm text-slate-400">{{ description }}</p>
      </div>
      <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <button type="button" class="crs-button crs-button-ghost w-full sm:w-auto" :disabled="loading || deleting" @click="$emit('refresh')">
          {{ loading ? 'Refreshing...' : 'Refresh list' }}
        </button>
        <button
          type="button"
          class="crs-button-danger w-full sm:w-auto"
          :disabled="!history.length || deleting"
          @click="openClearAllDialog"
        >
          {{ deletingAll ? 'Clearing...' : 'Clear import history' }}
        </button>
      </div>
    </div>

    <div class="mt-5 space-y-3">
      <div
        v-for="item in history"
        :key="item.id"
        class="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-white">{{ item.file_name }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ formatDate(item.created_at) }}</p>
          </div>
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <span class="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(item.status)">
              {{ item.status }}
            </span>
            <button
              type="button"
              class="crs-button-danger w-full sm:w-auto"
              :disabled="deleting || deletingId === item.id"
              @click="openDeleteDialog(item)"
            >
              {{ deletingId === item.id ? 'Removing...' : 'Remove import and trades' }}
            </button>
          </div>
        </div>
        <p class="mt-2 text-sm text-slate-300">
          {{ item.trades_imported || 0 }} imported
          <span v-if="item.trades_failed"> · {{ item.trades_failed }} failed</span>
          <span v-if="item.error_details?.duplicates"> · {{ item.error_details.duplicates }} duplicates</span>
        </p>
        <p
          v-if="item.status === 'processing' && (item.trades_imported || item.trades_failed || item.error_details?.duplicates)"
          class="mt-1 text-xs text-amber-200/85"
        >
          Processing progress: {{ item.trades_imported || 0 }} imported,
          {{ item.error_details?.duplicates || 0 }} duplicates,
          {{ item.trades_failed || 0 }} failed.
        </p>
      </div>

      <p v-if="!history.length" class="rounded-[18px] border border-dashed border-white/10 px-4 py-4 text-sm text-slate-500">
        No recent imports yet.
      </p>
    </div>

    <ConfirmDialog
      :open="Boolean(confirmMode)"
      badge="Import cleanup"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmButtonText"
      :loading="deleting"
      loading-text="Removing..."
      @cancel="closeDialog"
      @confirm="confirmAction"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ConfirmDialog from '@/components/crs/ConfirmDialog.vue'

const emit = defineEmits(['refresh', 'delete-item', 'clear-all'])

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  deleting: {
    type: Boolean,
    default: false
  },
  deletingId: {
    type: String,
    default: ''
  },
  deletingAll: {
    type: Boolean,
    default: false
  },
  eyebrow: {
    type: String,
    default: 'Import history'
  },
  title: {
    type: String,
    default: 'Recent import runs'
  },
  description: {
    type: String,
    default: 'Latest backend import jobs and their results.'
  }
})

const confirmMode = ref('')
const selectedItem = ref(null)

const confirmTitle = computed(() => (
  confirmMode.value === 'clear-all'
    ? 'Clear import history and imported trades?'
    : 'Remove this import and its trades?'
))

const confirmMessage = computed(() => {
  if (confirmMode.value === 'clear-all') {
    return 'This removes every import shown here and deletes the trades created by those import runs.'
  }

  return `This removes ${selectedItem.value?.file_name || 'the selected import'} and deletes the trades created from it.`
})

const confirmButtonText = computed(() => (
  confirmMode.value === 'clear-all' ? 'Clear history' : 'Remove import'
))

function openDeleteDialog(item) {
  selectedItem.value = item
  confirmMode.value = 'delete-item'
}

function openClearAllDialog() {
  selectedItem.value = null
  confirmMode.value = 'clear-all'
}

function closeDialog() {
  if (props.deleting) {
    return
  }

  confirmMode.value = ''
  selectedItem.value = null
}

function confirmAction() {
  if (confirmMode.value === 'clear-all') {
    confirmMode.value = ''
    emit('clear-all')
    return
  }

  if (selectedItem.value?.id) {
    confirmMode.value = ''
    emit('delete-item', selectedItem.value)
  }
}

function statusClass(status) {
  if (status === 'completed') {
    return 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20'
  }

  if (status === 'failed') {
    return 'bg-red-500/10 text-red-200 border border-red-500/20'
  }

  return 'bg-white/5 text-slate-300 border border-white/10'
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return date.toLocaleString()
}
</script>
