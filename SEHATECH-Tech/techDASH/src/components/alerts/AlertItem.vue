<template>
  <div 
    class="alert-item p-4 rounded-lg border"
    :class="severityClasses[severity]"
  >
    <div class="flex items-start space-x-4">
      <!-- Icône d'alerte -->
      <div class="flex-shrink-0">
        <component 
          :is="severityIcon"
          class="w-5 h-5"
          :class="severityClasses[severity].icon"
        />
      </div>

      <!-- Contenu de l'alerte -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ equipment }}
          </p>
          <span 
            class="text-xs font-medium px-2 py-1 rounded-full"
            :class="severityClasses[severity].badge"
          >
            {{ severity }}
          </span>
        </div>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {{ message }}
        </p>
        <div class="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock class="w-4 h-4 mr-1" />
          {{ formatDate(timestamp) }}
        </div>
      </div>

      <!-- Actions -->
      <div class="flex-shrink-0 ml-4">
        <button 
          class="text-sm font-medium text-primary-600 hover:text-primary-500"
          @click="$emit('acknowledge', id)"
        >
          Acquitter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertTriangle, AlertOctagon, AlertCircle, Clock } from 'lucide-vue-next'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  severity: {
    type: String,
    required: true,
    validator: (value) => ['critical', 'warning', 'info'].includes(value)
  },
  equipment: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: String,
    required: true
  }
})

const severityClasses = {
  critical: {
    base: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/50',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  warning: {
    base: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/50',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  info: {
    base: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/50',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  }
}

const severityIcon = computed(() => {
  const icons = {
    critical: AlertOctagon,
    warning: AlertTriangle,
    info: AlertCircle
  }
  return icons[props.severity]
})

const formatDate = (date) => {
  return format(new Date(date), 'PPp', { locale: fr })
}

defineEmits(['acknowledge'])
</script> 