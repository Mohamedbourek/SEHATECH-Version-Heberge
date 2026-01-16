<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <slot name="actions">
          <button 
            v-if="showRefresh"
            @click="$emit('refresh')" 
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <RefreshCw class="w-5 h-5" />
          </button>
        </slot>
      </div>
    </div>
    <div class="p-6">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { RefreshCw } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  }
})

const cardClasses = computed(() => ({
  'p-4': props.size === 'small',
  'p-6': props.size === 'default',
  'p-8': props.size === 'large'
}))

defineEmits(['refresh'])
</script> 