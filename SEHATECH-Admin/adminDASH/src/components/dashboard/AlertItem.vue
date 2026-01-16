<template>
  <div class="flex items-start space-x-4 p-4 rounded-lg"
    :class="typeClasses.background">
    <div class="flex-shrink-0">
      <component
        :is="typeIcon"
        class="w-5 h-5"
        :class="typeClasses.icon"
      />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium" :class="typeClasses.text">
        {{ message }}
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ formattedTime }}
      </p>
    </div>
    <div class="flex-shrink-0">
      <button
        class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
        @click="$emit('action', id)"
      >
        Marquer comme lu
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertTriangle, AlertCircle, Info } from 'lucide-vue-next'

const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  },
  type: {
    type: String,
    default: 'INFO'
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

defineEmits(['action'])

const typeConfig = {
  WARNING: {
    icon: AlertTriangle,
    classes: {
      background: 'bg-yellow-50 dark:bg-yellow-900/50',
      icon: 'text-yellow-400',
      text: 'text-yellow-800 dark:text-yellow-200'
    }
  },
  ERROR: {
    icon: AlertCircle,
    classes: {
      background: 'bg-red-50 dark:bg-red-900/50',
      icon: 'text-red-400',
      text: 'text-red-800 dark:text-red-200'
    }
  },
  INFO: {
    icon: Info,
    classes: {
      background: 'bg-blue-50 dark:bg-blue-900/50',
      icon: 'text-blue-400',
      text: 'text-blue-800 dark:text-blue-200'
    }
  }
}

const typeIcon = computed(() => typeConfig[props.type]?.icon || typeConfig.INFO.icon)
const typeClasses = computed(() => typeConfig[props.type]?.classes || typeConfig.INFO.classes)
const formattedTime = computed(() => 
  format(new Date(props.timestamp), 'HH:mm', { locale: fr })
)
</script> 