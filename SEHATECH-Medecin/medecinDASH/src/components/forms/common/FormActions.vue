<template>
  <div class="flex justify-end space-x-3">
    <button 
      type="button"
      class="btn btn-secondary"
      @click="$emit('cancel')"
    >
      <X class="w-4 h-4 mr-2" />
      Annuler
    </button>

    <button 
      type="button"
      class="btn btn-secondary"
      @click="$emit('preview')"
    >
      <Eye class="w-4 h-4 mr-2" />
      Aperçu
    </button>

    <button 
  type="submit"
  class="btn btn-primary"
  :disabled="disabled"
  @click.prevent="$emit('submit')"
   >
  <Save class="w-4 h-4 mr-2" />
  {{ submitLabel }}
   </button>
  </div>
</template>

<script setup>
import { X, Eye, Save } from 'lucide-vue-next'

defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  submitLabel: {
    type: String,
    default: 'Enregistrer'
  }
})

defineEmits(['cancel', 'preview', 'submit'])
</script>

<style>
.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-md 
         focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
         dark:focus:ring-offset-gray-800;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 
         focus:ring-primary-500
         dark:bg-primary-500 dark:hover:bg-primary-600
         dark:focus:ring-primary-400;
}

.btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 
         hover:bg-gray-50 focus:ring-primary-500
         dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
         dark:hover:bg-gray-600 dark:hover:text-white;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed
         dark:opacity-40;
}
</style>