<template>
  <div class="flex items-start space-x-4">
    <div :class="`p-2 rounded-full bg-${typeColor}-100 dark:bg-${typeColor}-900/50`">
      <component
        :is="typeIcon"
        class="w-5 h-5"
        :class="`text-${typeColor}-600 dark:text-${typeColor}-400`"
      />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 dark:text-white">
        {{ description }}
      </p>
      <div class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
        <span>{{ formattedTime }}</span>
        <span class="mx-2">•</span>
        <span>{{ user }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  UserPlus,
  Stethoscope,
  ClipboardList,
  AlertTriangle,
  Activity
} from 'lucide-vue-next'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  }
})

const typeConfig = {
  ADMISSION: {
    icon: UserPlus,
    color: 'blue'
  },
  CONSULTATION: {
    icon: Stethoscope,
    color: 'green'
  },
  EXAMEN: {
    icon: ClipboardList,
    color: 'purple'
  },
  ALERTE: {
    icon: AlertTriangle,
    color: 'red'
  },
  DEFAULT: {
    icon: Activity,
    color: 'gray'
  }
}

const typeIcon = computed(() => typeConfig[props.type]?.icon || typeConfig.DEFAULT.icon)
const typeColor = computed(() => typeConfig[props.type]?.color || typeConfig.DEFAULT.color)
const formattedTime = computed(() => 
  format(new Date(props.timestamp), 'HH:mm', { locale: fr })
)
</script> 