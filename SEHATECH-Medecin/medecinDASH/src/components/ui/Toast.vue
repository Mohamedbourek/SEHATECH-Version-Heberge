<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        :class="['toast', `toast-${toast.type}`, { 'toast-visible': toast.visible }]"
        @click="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5" />
          <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5" />
          <AlertTriangle v-else-if="toast.type === 'warning'" class="w-5 h-5" />
          <Info v-else class="w-5 h-5" />
        </div>
        <div class="toast-content">{{ toast.message }}</div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">
          <X class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const { toasts, toast } = useToast()
const removeToast = toast.remove
</script>

<style scoped>
.toast-container {
  @apply fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md;
}

.toast {
  @apply flex items-center p-3 rounded-lg shadow-lg text-white
         transform transition-all duration-300 ease-in-out
         cursor-pointer;
  max-width: 24rem;
}

.toast-success {
  @apply bg-green-600;
}

.toast-error {
  @apply bg-red-600;
}

.toast-warning {
  @apply bg-yellow-600;
}

.toast-info {
  @apply bg-blue-600;
}

.toast-icon {
  @apply mr-3 flex-shrink-0;
}

.toast-content {
  @apply flex-grow text-sm;
}

.toast-close {
  @apply ml-2 text-white opacity-70 hover:opacity-100 
         transition-opacity duration-200 focus:outline-none;
}

/* Animations */
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
</style> 