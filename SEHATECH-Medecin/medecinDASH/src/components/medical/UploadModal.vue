<template>
  <Modal 
    title="Ajouter un document"
    @close="$emit('close')"
  >
    <div class="p-6 space-y-6">
      <div 
        class="upload-zone"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
        @click="triggerFileInput"
      >
        <input 
          ref="fileInput"
          type="file"
          class="hidden"
          @change="handleFileSelect"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <Upload class="w-12 h-12 text-gray-400" />
        <p class="text-gray-600 dark:text-gray-400">
          Glissez vos fichiers ici ou cliquez pour sélectionner
        </p>
        <p class="text-sm text-gray-500">
          PDF, Images, Documents (max 10MB)
        </p>
      </div>

      <!-- Liste des fichiers sélectionnés -->
      <div v-if="selectedFiles.length" class="space-y-2">
        <div 
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div class="flex items-center space-x-2">
            <FileText class="w-4 h-4 text-gray-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ file.name }}
            </span>
            <span class="text-xs text-gray-500">
              ({{ formatFileSize(file.size) }})
            </span>
          </div>
          <button 
            @click="removeFile(index)"
            class="text-red-500 hover:text-red-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button 
          type="button"
          class="btn btn-secondary"
          @click="$emit('close')"
        >
          Annuler
        </button>
        <button 
          @click="uploadFiles"
          class="btn btn-primary"
          :disabled="!selectedFiles.length || isUploading"
        >
          <Loader2 
            v-if="isUploading"
            class="w-4 h-4 mr-2 animate-spin"
          />
          Téléverser
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import { Upload, FileText, X, Loader2 } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import { useDossierMedicalStore } from '@/stores/dossierMedical'

const props = defineProps({
  dossierId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['close', 'upload-complete'])

const dossierMedicalStore = useDossierMedicalStore()
const fileInput = ref(null)
const selectedFiles = ref([])
const isUploading = ref(false)

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  selectedFiles.value.push(...files.filter(file => file.size <= 10 * 1024 * 1024))
}

const handleFileDrop = (event) => {
  const files = Array.from(event.dataTransfer.files)
  selectedFiles.value.push(...files.filter(file => file.size <= 10 * 1024 * 1024))
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const uploadFiles = async () => {
  isUploading.value = true
  try {
    for (const file of selectedFiles.value) {
      await dossierMedicalStore.addDocument(props.dossierId, file)
    }
    emit('upload-complete')
  } catch (error) {
    console.error('Erreur lors du téléversement:', error)
  } finally {
    isUploading.value = false
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
</script>

<style scoped>
.upload-zone {
  @apply flex flex-col items-center justify-center p-8 
         border-2 border-dashed border-gray-300 dark:border-gray-600 
         rounded-lg space-y-2 cursor-pointer
         hover:border-primary-500 dark:hover:border-primary-400
         transition-colors;
}
</style> 