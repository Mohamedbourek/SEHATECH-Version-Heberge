<template>
  <Modal :title="title" size="sm" @close="$emit('cancel')">
    <div class="p-6">
      <div class="text-center">
        <AlertCircle class="mx-auto h-12 w-12 text-red-500" />
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ message }}
        </p>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <button
          type="button"
          class="btn btn-danger"
          @click="$emit('confirm')"
        >
          Confirmer
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { AlertCircle } from 'lucide-vue-next'
import Modal from './Modal.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700 
         focus:ring-red-500 border-transparent;
}
</style> 