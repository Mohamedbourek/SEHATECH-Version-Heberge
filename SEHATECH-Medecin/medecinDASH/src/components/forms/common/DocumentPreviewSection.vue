<template>
  <div class="form-section dark:bg-gray-900">
    <div class="form-header dark:bg-gray-900">
      <div class="flex items-center space-x-2">
        <FileText class="w-5 h-5 text-primary-500" />
        <h4 class="form-title dark:text-white">Aperçu du document</h4>
      </div>
    </div>
    <div class="form-content dark:bg-gray-900">
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow-sm dark:shadow-gray-800">
        <div class="space-y-4">
          <!-- En-tête du document -->
          <div class="flex justify-between">
            <div>
              <h5 class="font-medium text-gray-900 dark:text-white">
                {{ title }}
              </h5>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(new Date()) }}
              </p>
            </div>
            <div v-if="showLogo" class="w-24">
              <img src="@/assets/images/logo.png" alt="Logo" class="w-full dark:opacity-90" />
            </div>
          </div>

          <!-- Contenu du document -->
          <div class="space-y-3">
            <slot name="content">
              <!-- Contenu par défaut -->
              <div class="text-gray-600 dark:text-gray-300">
                {{ defaultContent }}
              </div>
            </slot>
          </div>

          <!-- Pied de page -->
          <div class="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-end">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                <slot name="footer">
                  Document généré le {{ formatDate(new Date()) }}
                </slot>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Dr. {{ doctorName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ speciality }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FileText } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  showLogo: {
    type: Boolean,
    default: true
  },
  defaultContent: {
    type: String,
    default: 'Aucun contenu à afficher'
  },
  doctorName: {
    type: String,
    required: true
  },
  speciality: {
    type: String,
    default: 'Médecin généraliste'
  }
})

function formatDate(date) {
  return format(date, 'dd MMMM yyyy', { locale: fr })
}
</script>

<style scoped>
.preview-container {
  @apply fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-auto;
}

.preview-header {
  @apply sticky top-0 flex items-center justify-between p-4 
         bg-white dark:bg-gray-900 border-b border-gray-200 
         dark:border-gray-700;
}

.preview-title {
  @apply text-lg font-medium text-gray-900 dark:text-white;
}

.preview-content {
  @apply p-6 dark:bg-gray-900;
}

.btn-icon {
  @apply p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
         dark:hover:text-gray-200 rounded-full hover:bg-gray-100 
         dark:hover:bg-gray-800 transition-colors;
}
</style>