<template>
  <transition-group
    tag="div"
    name="toast"
    class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md"
  >
    <div
      v-for="toast in visibleToasts"
      :key="toast.id"
      class="toast-item flex items-start p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300"
      :class="getToastClasses(toast.type)"
    >
      <div class="flex-shrink-0 mr-3">
        <component :is="getToastIcon(toast.type)" class="w-6 h-6" />
      </div>
      <div class="flex-1">
        <h3 v-if="toast.title" class="font-semibold mb-1">{{ toast.title }}</h3>
        <p class="text-sm">{{ toast.message }}</p>
      </div>
      <button 
        @click="removeToast(toast.id)"
        class="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-500 focus:outline-none"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </transition-group>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'

const { visibleToasts, removeToast, TOAST_TYPES } = useToast()

// Obtenir les classes CSS en fonction du type de toast
const getToastClasses = (type) => {
  switch (type) {
    case TOAST_TYPES.SUCCESS:
      return 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900/50 dark:border-green-500 dark:text-green-300'
    case TOAST_TYPES.ERROR:
      return 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300'
    case TOAST_TYPES.WARNING:
      return 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-500 dark:text-yellow-300'
    case TOAST_TYPES.INFO:
    default:
      return 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-300'
  }
}

// Obtenir l'icône en fonction du type de toast
const getToastIcon = (type) => {
  switch (type) {
    case TOAST_TYPES.SUCCESS:
      return CheckCircle
    case TOAST_TYPES.ERROR:
      return AlertCircle
    case TOAST_TYPES.WARNING:
      return AlertTriangle
    case TOAST_TYPES.INFO:
    default:
      return Info
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>