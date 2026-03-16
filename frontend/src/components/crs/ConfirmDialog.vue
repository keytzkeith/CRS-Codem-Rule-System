<template>
  <Teleport to="body">
    <Transition name="crs-dialog">
      <div
        v-if="open"
        class="crs-dialog-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="$emit('cancel')"
      >
        <div class="crs-dialog-panel">
          <div class="crs-dialog-badge">{{ badge }}</div>
          <h2 :id="titleId" class="crs-dialog-title">{{ title }}</h2>
          <p class="crs-dialog-copy">{{ message }}</p>
          <div class="mb-6 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            This action is permanent. Review the affected data before continuing.
          </div>
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" class="crs-button crs-button-ghost w-full sm:w-auto" :disabled="loading" @click="$emit('cancel')">
              {{ cancelText }}
            </button>
            <button type="button" class="crs-button-danger w-full sm:w-auto" :disabled="loading" @click="$emit('confirm')">
              {{ loading ? loadingText : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  badge: { type: String, default: 'Confirm action' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  loadingText: { type: String, default: 'Working...' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])

const titleId = computed(() => `crs-confirm-${props.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)

function handleKeydown(event) {
  if (event.key === 'Escape' && props.open && !props.loading) {
    emit('cancel')
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeydown)
      return
    }

    window.removeEventListener('keydown', handleKeydown)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
