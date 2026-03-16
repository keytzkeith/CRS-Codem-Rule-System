<template>
  <span class="crs-info-tip" @mouseenter="showPanel" @mouseleave="hidePanel">
    <button
      ref="triggerRef"
      type="button"
      class="crs-info-tip-trigger"
      :aria-label="label"
      @focus="showPanel"
      @blur="hidePanel"
    >
      i
    </button>
    <span
      v-if="open"
      ref="panelRef"
      class="crs-info-tip-panel"
      :style="panelStyle"
    >
      {{ text }}
    </span>
  </span>
</template>

<script setup>
import { nextTick, ref } from 'vue'

defineProps({
  text: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: 'More information'
  }
})

const open = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)
const panelStyle = ref({})

async function showPanel() {
  open.value = true
  await nextTick()
  updatePanelPosition()
}

function hidePanel() {
  open.value = false
}

function updatePanelPosition() {
  const trigger = triggerRef.value
  const panel = panelRef.value

  if (!trigger || !panel) {
    return
  }

  const triggerRect = trigger.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const horizontalPadding = 12
  const viewportWidth = window.innerWidth
  const centeredLeft = triggerRect.left + (triggerRect.width / 2) - (panelRect.width / 2)
  const clampedLeft = Math.min(
    Math.max(horizontalPadding, centeredLeft),
    viewportWidth - panelRect.width - horizontalPadding
  )

  panelStyle.value = {
    position: 'fixed',
    left: `${clampedLeft}px`,
    top: `${triggerRect.bottom + 10}px`
  }
}
</script>
