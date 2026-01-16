<template>
  <div class="document-card">
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-medium text-gray-900 dark:text-white">{{ title }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex space-x-2">
        <button 
          @click="$emit('edit')"
          class="btn btn-sm btn-outline"
        >
          Modifier
        </button>
        <button 
          @click="$emit('delete')"
          class="btn btn-sm btn-error"
        >
          Supprimer
        </button>
      </div>
    </div>
    
    <slot name="content"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  document: {
    type: Object,
    required: true
  }
})

const title = computed(() => {
  switch (props.type) {
    case 'ordonnance':
      return `Ordonnance du ${formatDate(props.document.dateEmission)}`
    case 'consultation':
      return `Consultation du ${formatDate(props.document.dateConsultation)}`
    case 'examen':
      return `${props.document.type} du ${formatDate(props.document.date)}`
    case 'rapport':
      return `Rapport du ${formatDate(props.document.date)}`
    default:
      return 'Document'
  }
})

const subtitle = computed(() => {
  if (props.document.ID_medecin) {
    return `Médecin: Dr. ${props.document.ID_medecin}`
  }
  return ''
})

function formatDate(date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

defineEmits(['edit', 'delete'])
</script>

<style scoped>
.document-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 
         hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700;
}

:deep(.btn-outline) {
  @apply dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600;
}

:deep(.btn-error) {
  @apply dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-700;
}
</style>