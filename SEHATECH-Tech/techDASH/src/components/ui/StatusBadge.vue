<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="statusClasses"
  >
    {{ statusText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['online', 'offline', 'warning', 'error'].includes(value)
  }
})

const statusClasses = computed(() => {
  const classes = {
    online: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
  return classes[props.status]
})

const statusText = computed(() => {
  const texts = {
    online: 'En ligne',
    offline: 'Hors ligne',
    warning: 'Avertissement',
    error: 'Erreur'
  }
  return texts[props.status]
})
</script>