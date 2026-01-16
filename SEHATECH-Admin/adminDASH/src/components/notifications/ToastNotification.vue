<template>
  <div
    class="fixed right-0 top-0 z-50 p-4 space-y-4 pointer-events-none"
    :class="[
      position === 'top-right' ? 'right-0 top-0' :
      position === 'top-left' ? 'left-0 top-0' :
      position === 'bottom-right' ? 'right-0 bottom-0' :
      'left-0 bottom-0'
    ]"
  >
    <TransitionGroup
      enter-active-class="transform ease-out duration-300"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="w-full max-w-sm overflow-hidden rounded-lg shadow-lg pointer-events-auto
               ring-1 ring-black ring-opacity-5"
        :class="[
          toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/50' :
          toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/50' :
          toast.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/50' :
          'bg-blue-50 dark:bg-blue-900/50'
        ]"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <component
                :is="toastTypeIcons[toast.type]"
                class="w-6 h-6"
                :class="[
                  toast.type === 'success' ? 'text-green-400 dark:text-green-300' :
                  toast.type === 'error' ? 'text-red-400 dark:text-red-300' :
                  toast.type === 'warning' ? 'text-yellow-400 dark:text-yellow-300' :
                  'text-blue-400 dark:text-blue-300'
                ]"
              />
            </div>
            <div class="ml-3 w-0 flex-1">
              <p 
                class="text-sm font-medium"
                :class="[
                  toast.type === 'success' ? 'text-green-800 dark:text-green-100' :
                  toast.type === 'error' ? 'text-red-800 dark:text-red-100' :
                  toast.type === 'warning' ? 'text-yellow-800 dark:text-yellow-100' :
                  'text-blue-800 dark:text-blue-100'
                ]"
              >
                {{ toast.title }}
              </p>
              <p 
                class="mt-1 text-sm"
                :class="[
                  toast.type === 'success' ? 'text-green-700 dark:text-green-200' :
                  toast.type === 'error' ? 'text-red-700 dark:text-red-200' :
                  toast.type === 'warning' ? 'text-yellow-700 dark:text-yellow-200' :
                  'text-blue-700 dark:text-blue-200'
                ]"
              >
                {{ toast.message }}
              </p>
              <!-- Actions -->
              <div v-if="toast.action" class="mt-3">
                <button
                  @click="handleAction(toast)"
                  class="text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                  :class="[
                    toast.type === 'success' ? 'text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300' :
                    toast.type === 'error' ? 'text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300' :
                    toast.type === 'warning' ? 'text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300' :
                    'text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'
                  ]"
                >
                  {{ toast.actionLabel }}
                </button>
              </div>
            </div>
            <div class="ml-4 flex flex-shrink-0">
              <button
                @click="removeToast(toast.id)"
                class="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                :class="[
                  toast.type === 'success' ? 'text-green-400 hover:text-green-500 dark:text-green-300 dark:hover:text-green-200' :
                  toast.type === 'error' ? 'text-red-400 hover:text-red-500 dark:text-red-300 dark:hover:text-red-200' :
                  toast.type === 'warning' ? 'text-yellow-400 hover:text-yellow-500 dark:text-yellow-300 dark:hover:text-yellow-200' :
                  'text-blue-400 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200'
                ]"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const props = defineProps({
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(value)
  },
  duration: {
    type: Number,
    default: 5000
  }
})

const toasts = ref([])
const toastTimeouts = new Map()

const toastTypeIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

// Ajouter une nouvelle notification toast
const addToast = (toast) => {
  const id = Date.now()
  const newToast = {
    id,
    title: toast.title,
    message: toast.message,
    type: toast.type || 'info',
    action: toast.action,
    actionLabel: toast.actionLabel
  }
  
  toasts.value.unshift(newToast)

  // Supprimer automatiquement après la durée spécifiée
  if (props.duration > 0) {
    const timeout = setTimeout(() => {
      removeToast(id)
    }, props.duration)
    toastTimeouts.set(id, timeout)
  }

  return id
}

// Supprimer une notification toast
const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
    
    // Nettoyer le timeout
    if (toastTimeouts.has(id)) {
      clearTimeout(toastTimeouts.get(id))
      toastTimeouts.delete(id)
    }
  }
}

// Gérer l'action d'une notification
const handleAction = (toast) => {
  if (toast.action) {
    toast.action()
    removeToast(toast.id)
  }
}

// Nettoyer les timeouts lors de la destruction du composant
onUnmounted(() => {
  toastTimeouts.forEach(timeout => clearTimeout(timeout))
  toastTimeouts.clear()
})

// Exposer les méthodes
defineExpose({
  addToast,
  removeToast
})
</script> 