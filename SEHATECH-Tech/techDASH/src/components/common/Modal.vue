<template>
  <Transition
    enter-active-class="ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="modelValue" 
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
      @click="$emit('close')"
    ></div>
  </Transition>

  <Transition
    enter-active-class="ease-out duration-300"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
    leave-active-class="ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
  >
    <div 
      v-if="modelValue"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="$emit('close')"
    >
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 
                 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full 
                 sm:max-w-lg sm:p-6"
        >
          <!-- En-tête -->
          <div class="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              @click="$emit('close')"
            >
              <span class="sr-only">Fermer</span>
              <X class="h-6 w-6" />
            </button>
          </div>
          
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 
                v-if="title"
                class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
              >
                {{ title }}
              </h3>
              
              <!-- Contenu -->
              <div class="mt-4">
                <slot></slot>
              </div>
              
              <!-- Actions -->
              <div v-if="$slots.actions" class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <slot name="actions"></slot>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  modelValue: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: ''
  }
})

defineEmits(['close'])
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style> 