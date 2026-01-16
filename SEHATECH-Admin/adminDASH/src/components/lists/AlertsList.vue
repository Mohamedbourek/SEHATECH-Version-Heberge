<template>
  <div class="space-y-4">
    <div v-if="!alerts.length" class="text-center py-4">
      <p class="text-gray-500 dark:text-gray-400">
        Aucune alerte active
      </p>
    </div>
    <div 
      v-for="alert in sortedAndFilteredAlerts" 
      :key="alert.id"
      class="flex items-start space-x-4 p-4 rounded-lg"
      :class="severityClasses[alert.severity].bg"
    >
      <div class="flex-shrink-0">
        <component 
          :is="severityClasses[alert.severity].icon" 
          class="w-5 h-5"
          :class="severityClasses[alert.severity].iconColor"
        />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium" :class="severityClasses[alert.severity].textColor">
          {{ alert.title }}
        </p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ alert.message }}
        </p>
        <div class="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock class="w-4 h-4 mr-1" />
          {{ formatAlertTime(alert.timestamp) }}
        </div>
      </div>
      <div class="flex-shrink-0">
        <button 
          @click="markAsRead(alert.id)"
          class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Clock, X, AlertTriangle, AlertCircle, Bell } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { computed } from 'vue'

const props = defineProps({
  alerts: {
    type: Array,
    default: () => []
  },
  sortBy: {
    type: String,
    default: 'date'
  },
  filterBySeverity: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['markAsRead'])

const severityClasses = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-800 dark:text-red-400',
    iconColor: 'text-red-500',
    icon: AlertTriangle
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-800 dark:text-yellow-400',
    iconColor: 'text-yellow-500',
    icon: AlertCircle
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-400',
    iconColor: 'text-blue-500',
    icon: Bell
  }
}

const formatAlertTime = (timestamp) => {
  return format(new Date(timestamp), 'PPp', { locale: fr })
}

const markAsRead = (alertId) => {
  emit('markAsRead', alertId)
}

const sortedAndFilteredAlerts = computed(() => {
  let filteredAlerts = props.alerts

  // Filtrage par sévérité
  if (props.filterBySeverity !== 'all') {
    filteredAlerts = filteredAlerts.filter(alert => alert.severity === props.filterBySeverity)
  }

  // Tri des alertes
  return [...filteredAlerts].sort((a, b) => {
    if (props.sortBy === 'date') {
      return new Date(b.timestamp) - new Date(a.timestamp)
    }
    if (props.sortBy === 'severity') {
      const severityOrder = { critical: 3, warning: 2, info: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    }
    return 0
  })
})
</script> 