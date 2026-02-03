<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div 
          class="p-2 rounded-lg"
          :class="`bg-${color}-100 dark:bg-${color}-900/50`"
        >
          <component 
            :is="icon"
            class="w-6 h-6"
            :class="`text-${color}-600 dark:text-${color}-400`"
          />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ title }}
        </h3>
      </div>
    </div>
    <div class="mt-4">
      <div class="flex items-baseline">
        <p class="text-2xl font-semibold text-gray-900 dark:text-white">
          {{ value }}
        </p>
      </div>
      <div class="mt-1 flex items-center">
        <component 
          :is="getTrendIcon"
          class="w-4 h-4 mr-1"
          :class="getTrendColor"
        />
        <span 
          class="text-sm"
          :class="getTrendColor"
        >
          {{ percentage }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  trend: {
    type: String,
    default: 'stable',
    validator: (value) => ['up', 'down', 'stable'].includes(value)
  },
  percentage: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: 'blue'
  }
})

const getTrendIcon = computed(() => {
  return {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus
  }[props.trend]
})

const getTrendColor = computed(() => {
  return {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400'
  }[props.trend]
})
</script> 