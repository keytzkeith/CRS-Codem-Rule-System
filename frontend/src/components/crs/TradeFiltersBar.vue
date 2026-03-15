<template>
  <div class="grid gap-3 lg:grid-cols-6">
    <label class="crs-filter-field">
      <span>Search</span>
      <input v-model="localFilters.query" type="text" class="crs-input" placeholder="pair, setup, lesson" />
    </label>
    <label class="crs-filter-field">
      <span>Pair</span>
      <select v-model="localFilters.pair" class="crs-input">
        <option value="">All pairs</option>
        <option v-for="pair in options.pairs" :key="pair" :value="pair">{{ pair }}</option>
      </select>
    </label>
    <label class="crs-filter-field">
      <span>Session</span>
      <select v-model="localFilters.session" class="crs-input">
        <option value="">All sessions</option>
        <option v-for="session in options.sessions" :key="session" :value="session">{{ session }}</option>
      </select>
    </label>
    <label class="crs-filter-field">
      <span>Result</span>
      <select v-model="localFilters.status" class="crs-input">
        <option value="">All results</option>
        <option v-for="status in options.statuses" :key="status" :value="status">{{ status }}</option>
      </select>
    </label>
    <div class="grid grid-cols-2 gap-3">
      <label class="crs-filter-field">
        <span>From</span>
        <input v-model="localFilters.startDate" type="date" class="crs-input" />
      </label>
      <label class="crs-filter-field">
        <span>To</span>
        <input v-model="localFilters.endDate" type="date" class="crs-input" />
      </label>
    </div>
    <div class="lg:col-span-6">
      <label class="crs-filter-field">
        <span>Setup stack</span>
      </label>
      <TagPicker
        v-model="localFilters.setupTypes"
        :options="options.setupTypes"
        placeholder="Filter by one or more setups"
        @create-tag="$emit('create-setup', $event)"
      />
    </div>
    <div class="lg:col-span-6">
      <label class="crs-filter-field">
        <span>Tags</span>
      </label>
      <TagPicker
        v-model="localFilters.tags"
        :options="options.tags"
        placeholder="Add filter tag"
        @create-tag="$emit('create-tag', $event)"
      />
    </div>
    <div class="lg:col-span-6 flex flex-col gap-3 pt-2 sm:flex-row">
      <button type="button" class="crs-button crs-button-ghost w-full sm:w-auto" @click="$emit('update:modelValue', { ...localFilters })">
        Apply filters
      </button>
      <button type="button" class="crs-button crs-button-muted w-full sm:w-auto" @click="clearFilters">
        Reset
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import TagPicker from '@/components/crs/TagPicker.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'create-tag', 'create-setup'])

const localFilters = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  (nextValue) => {
    Object.assign(localFilters, nextValue)
  },
  { deep: true }
)

watch(
  localFilters,
  () => {
    emit('update:modelValue', { ...localFilters })
  },
  { deep: true }
)

function clearFilters() {
  Object.assign(localFilters, {
    query: '',
    pair: '',
    session: '',
    setupType: '',
    setupTypes: [],
    tags: [],
    status: '',
    startDate: '',
    endDate: ''
  })
}
</script>
