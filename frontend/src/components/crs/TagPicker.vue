<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tag in options"
        :key="tag"
        type="button"
        class="crs-tag-chip"
        :class="selectedSet.has(tag) ? 'crs-tag-chip-active' : 'crs-tag-chip-idle'"
        @click="toggle(tag)"
      >
        {{ tag }}
      </button>
    </div>
    <div class="flex gap-2">
      <input
        v-model="draftTag"
        type="text"
        class="crs-input"
        :placeholder="placeholder"
        @keydown.enter.prevent="createTag"
      />
      <button type="button" class="crs-button crs-button-ghost" @click="createTag">Add</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Add a tag'
  }
})

const emit = defineEmits(['update:modelValue', 'create-tag'])
const draftTag = ref('')
const selectedSet = computed(() => new Set(props.modelValue))

function toggle(tag) {
  if (selectedSet.value.has(tag)) {
    emit('update:modelValue', props.modelValue.filter((item) => item !== tag))
    return
  }

  emit('update:modelValue', [...props.modelValue, tag])
}

function createTag() {
  const normalized = draftTag.value.trim()
  if (!normalized) {
    return
  }

  emit('create-tag', normalized)
  if (!selectedSet.value.has(normalized)) {
    emit('update:modelValue', [...props.modelValue, normalized])
  }
  draftTag.value = ''
}
</script>
