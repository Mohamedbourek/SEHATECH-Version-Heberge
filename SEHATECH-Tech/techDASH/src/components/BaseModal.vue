<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Overlay -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div 
        class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
      >
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ title }}
          </h3>
          <button 
            class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            @click="$emit('close')"
          >
            <span class="sr-only">Fermer</span>
            <XIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Contenu -->
        <div>
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { XIcon } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped>
.fixed {
  @apply overflow-y-auto;
}
</style> 