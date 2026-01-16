<template>
  <BaseModal
    :title="title"
    @close="$emit('cancel')"
  >
    <div class="space-y-6">
      <!-- Message de confirmation -->
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <AlertTriangle 
            class="h-6 w-6 text-yellow-500"
            v-if="type === 'warning'"
          />
          <AlertOctagon
            class="h-6 w-6 text-red-500"
            v-else-if="type === 'danger'"
          />
          <AlertCircle
            class="h-6 w-6 text-blue-500"
            v-else
          />
        </div>
        <div class="ml-3">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ message }}
          </p>
          <p 
            v-if="description"
            class="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            {{ description }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="btn"
          :class="[
            type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
            type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
            'btn-primary'
          ]"
          @click="handleConfirm"
          :disabled="isLoading"
        >
          <Loader2 
            v-if="isLoading"
            class="w-4 h-4 mr-2 animate-spin"
          />
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import { AlertTriangle, AlertOctagon, AlertCircle, Loader2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'warning',
    validator: (value) => ['warning', 'danger', 'info'].includes(value)
  },
  confirmLabel: {
    type: String,
    default: 'Confirmer'
  },
  cancelLabel: {
    type: String,
    default: 'Annuler'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const isLoading = ref(false)

const handleConfirm = async () => {
  isLoading.value = true
  try {
    await emit('confirm')
  } finally {
    isLoading.value = false
  }
}
</script> 