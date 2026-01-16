<template>
  <div class="preview-overlay">
    <div class="preview-container">
      <div class="preview-header">
        <div class="flex items-center space-x-4">
          <img src="@/assets/logo.svg" alt="Logo" class="h-8 w-8" />
          <h2 class="text-xl font-semibold">{{ title }}</h2>
        </div>
        
        <div class="flex items-center space-x-2">
          <button 
            @click="$emit('print')"
            class="btn btn-primary"
          >
            <Printer class="w-4 h-4 mr-2" />
            Imprimer
          </button>
          <button 
            @click="$emit('close')"
            class="btn btn-secondary"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="preview-content">
        <slot></slot>
      </div>

      <div class="preview-footer">
        <div class="text-sm text-gray-500">
          {{ hospitalName }}
        </div>
        <div class="text-sm">
          Document généré le {{ formatDate(new Date()) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Printer, X } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

defineProps({
  title: {
    type: String,
    required: true
  },
  hospitalName: {
    type: String,
    default: 'Smart Hospital'
  }
})

defineEmits(['print', 'close'])

function formatDate(date) {
  return format(date, 'dd MMMM yyyy', { locale: fr })
}
</script>

<style scoped>
.preview-overlay {
  @apply fixed inset-0 z-[100] bg-black bg-opacity-50;
}

.preview-container {
  @apply fixed inset-0 z-[101] bg-white overflow-auto;
}

.preview-header {
  @apply sticky top-0 flex items-center justify-between p-4 
         bg-white border-b border-gray-200 shadow-sm;
}

.preview-content {
  @apply max-w-4xl mx-auto p-8;
}

.preview-footer {
  @apply sticky bottom-0 flex justify-between items-center p-4 
         bg-white border-t border-gray-200;
}

@media print {
  .preview-overlay {
    @apply hidden;
  }
  
  .preview-header,
  .preview-footer {
    @apply hidden;
  }

  .preview-content {
    @apply p-0;
  }
}
</style> 