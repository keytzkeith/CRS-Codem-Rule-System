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
  },
  items: {
    type: Array,
    default: () => []
  }
})

const items = computed(() =>
  props.items.map((item) => ({
    key: item.id,
    label: item.label,
    value: Boolean(props.checklist?.[item.id])
  }))
)
</script>
