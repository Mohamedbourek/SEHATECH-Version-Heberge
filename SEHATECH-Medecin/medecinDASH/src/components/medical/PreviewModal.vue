<template>
  <Modal 
    :title="document?.name"
    @close="$emit('close')"
    size="lg"
  >
    <div class="p-6 dark:bg-gray-800">
      <div class="document-preview">
        <!-- Prévisualisation selon le type de document -->
        <iframe 
          v-if="isPreviewable"
          :src="documentUrl"
          class="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
        ></iframe>
        <div 
          v-else
          class="preview-fallback dark:bg-gray-800/50"
        >
          <FileX class="w-16 h-16 text-gray-400" />
          <p class="mt-4 text-gray-600 dark:text-gray-300">
            Aperçu non disponible
          </p>
          <button 
            @click="downloadDocument"
            class="btn btn-secondary mt-4 dark:bg-gray-700 dark:text-gray-300 
                   dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Télécharger le fichier
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import { FileX } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'

const props = defineProps({
  document: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const isPreviewable = computed(() => {
  if (!props.document?.name) return false
  const ext = props.document.name.split('.').pop().toLowerCase()
  return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext)
})

const documentUrl = computed(() => {
  return props.document?.url || `#preview-${props.document?.name}`
})

const downloadDocument = () => {
  const link = document.createElement('a')
  link.href = documentUrl.value
  link.download = props.document.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.preview-fallback {
  @apply flex flex-col items-center justify-center py-12
         bg-gray-50 dark:bg-gray-800/50 rounded-lg
         border border-gray-200 dark:border-gray-700;
}

.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
         focus:outline-none focus:ring-2 focus:ring-offset-2 
         disabled:opacity-50 dark:focus:ring-offset-gray-900;
}

.btn-secondary {
  @apply bg-white text-gray-700 hover:bg-gray-50 
         focus:ring-primary-500 border border-gray-300;
}
</style> 