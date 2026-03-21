<template>
  <div class="space-y-4">
    <div class="crs-image-upload-zone">
      <!-- File upload area -->
      <div 
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        class="group relative flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed p-6 transition-all"
        :class="isDragOver ? 'border-amber-200/40 bg-amber-200/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'"
      >
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          @change="handleFileSelect"
          class="hidden"
        />
        
        <div class="flex flex-col items-center gap-3 text-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400 group-hover:text-amber-200/60">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <button
              type="button"
              @click="$refs.fileInput.click()"
              class="text-sm font-semibold text-amber-200/80 hover:text-amber-100"
            >
              Upload images
            </button>
            <p class="mt-1 text-xs text-slate-500">
              Drag images here or click to browse
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected files preview -->
    <div v-if="selectedFiles.length > 0" class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pending Upload ({{ selectedFiles.length }})</h4>
        <button v-if="tradeId" type="button" @click="uploadImages" :disabled="uploading" class="text-[10px] font-bold uppercase tracking-widest text-amber-200/60 hover:text-amber-200">
          {{ uploading ? 'Uploading...' : 'Save now' }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-slate-900"
        >
          <img
            v-if="file.preview"
            :src="file.preview"
            :alt="file.name"
            class="h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-80"
          />
          <div v-else class="flex h-full w-full items-center justify-center">
            <div class="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-amber-200"></div>
          </div>
          
          <!-- Remove button -->
          <button
            type="button"
            @click="removeFile(index)"
            class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 p-2">
            <p class="truncate text-[9px] text-slate-300">{{ file.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload progress/results -->
    <div v-if="uploadResults.length > 0" class="space-y-2">
      <div v-for="result in uploadResults" :key="result.id || result.filename" class="flex items-center justify-between rounded-lg border px-3 py-2 text-[11px]" :class="result.error ? 'border-red-500/20 bg-red-500/5 text-red-200/70' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200/70'">
        <span class="truncate max-w-[180px]">{{ result.file_name || result.filename }}</span>
        <div class="flex items-center gap-2">
          <span v-if="result.error" class="text-[10px] italic">{{ result.error }}</span>
          <span v-else-if="result.compressionRatio" class="text-[9px] opacity-60">{{ result.compressionRatio.toFixed(0) }}% smaller</span>
          <svg v-if="!result.error" class="h-3 w-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotification } from '@/composables/useNotification'
import api from '@/services/api'

const props = defineProps({
  tradeId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['uploaded'])

const { showSuccess, showError } = useNotification()

const selectedFiles = ref([])
const isDragOver = ref(false)
const uploading = ref(false)
const uploadResults = ref([])

// Supported file types
const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  addFiles(files)
  event.target.value = ''
}

function handleDrop(event) {
  event.preventDefault()
  isDragOver.value = false
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

function addFiles(files) {
  const validFiles = files.filter(file => {
    if (!supportedTypes.includes(file.type)) {
      showError('Invalid File', `${file.name} is not a supported format`)
      return false
    }
    if (file.size > 50 * 1024 * 1024) {
      showError('File Too Large', `${file.name} is larger than 50MB`)
      return false
    }
    return true
  })

  validFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedFiles.value.push({
        file: file,
        name: file.name,
        size: file.size,
        preview: e.target.result
      })
    }
    reader.readAsDataURL(file)
  })
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

async function uploadImages() {
  if (!props.tradeId) {
    showError('Error', 'Save the trade first before uploading images.')
    return
  }

  if (selectedFiles.value.length === 0) return

  uploading.value = true
  uploadResults.value = []

  try {
    const result = await flushPendingImages(props.tradeId)
    if (result.success) {
      if (result.count > 0) {
        showSuccess('Images Saved', `${result.count} images uploaded to this trade.`)
      }
      emit('uploaded')
    } else {
      throw result.error
    }
  } catch (error) {
    console.error('Image upload error:', error)
    showError('Upload Failed', error.response?.data?.error || 'Could not process images.')
  } finally {
    uploading.value = false
  }
}

async function flushPendingImages(tradeId) {
  if (selectedFiles.value.length === 0) return { success: true, count: 0 }

  try {
    const formData = new FormData()
    selectedFiles.value.forEach((fileObj) => {
      formData.append('images', fileObj.file)
    })

    const response = await api.post(`/trades/${tradeId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    uploadResults.value = response.data.images || []
    const successCount = response.data.successfulUploads || 0
    selectedFiles.value = []
    return { success: true, count: successCount, images: response.data.images || [] }
  } catch (err) {
    console.error('[ImageUpload] Failed to flush images:', err)
    return { success: false, error: err }
  }
}

defineExpose({ selectedFiles, flushPendingImages })
</script>