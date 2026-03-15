<template>
  <div class="grid gap-3">
    <div
      v-for="item in items"
      :key="item.key"
      class="crs-checklist-row"
      :class="item.value ? 'crs-checklist-row-active' : 'crs-checklist-row-muted'"
    >
      <span class="crs-checklist-icon">{{ item.value ? '●' : '○' }}</span>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  checklist: {
    type: Object,
    required: true
  }
})

const items = computed(() => [
  { key: 'htfBosConfirmed', label: 'HTF BOS confirmed', value: props.checklist.htfBosConfirmed },
  { key: 'pullbackToOb', label: 'Pullback to OB', value: props.checklist.pullbackToOb },
  { key: 'm15Confirmation', label: 'M15 confirmation', value: props.checklist.m15Confirmation },
  { key: 'tradedWithBias', label: 'Traded with bias', value: props.checklist.tradedWithBias },
  { key: 'validSession', label: 'Valid session', value: props.checklist.validSession },
  { key: 'minimumRRMet', label: 'RR >= 1:2.5', value: props.checklist.minimumRRMet }
])
</script>
