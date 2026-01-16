<template>
  <div class="fixed bottom-4 right-4 z-50 space-y-4">
    <TransitionGroup
      enter-active-class="transition ease-out duration-300"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        v-show="toast.show"
        class="max-w-md"
        :class="toastClasses[toast.type]"
      >
        <div class="flex p-4 rounded-lg shadow-lg">
          <div class="flex-shrink-0">
            <component
              :is="toastIcons[toast.type]"
              class="w-5 h-5"
              :class="iconClasses[toast.type]"
            />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ toast.title }}
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ toast.message }}
            </p>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-vue-next'

const { toasts } = useToast()

const toastClasses = {
  success: 'bg-green-50 dark:bg-green-900/50',
  error: 'bg-red-50 dark:bg-red-900/50',
  warning: 'bg-yellow-50 dark:bg-yellow-900/50',
  info: 'bg-blue-50 dark:bg-blue-900/50'
}

const iconClasses = {
  success: 'text-green-400 dark:text-green-300',
  error: 'text-red-400 dark:text-red-300',
  warning: 'text-yellow-400 dark:text-yellow-300',
  info: 'text-blue-400 dark:text-blue-300'
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
}
</script>