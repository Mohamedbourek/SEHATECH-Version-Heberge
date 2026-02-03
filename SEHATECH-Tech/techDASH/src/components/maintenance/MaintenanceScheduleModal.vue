<template>
  <BaseModal
    title="Planification de maintenance"
    @close="$emit('close')"
  >
    <MaintenanceForm 
      :equipment="equipment"
      @submit="handleSubmit"
      @cancel="$emit('close')"
    />
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import MaintenanceForm from '@/components/maintenance/MaintenanceForm.vue'

const props = defineProps({
  equipment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

async function handleSubmit(result) {
  // Emit the save event with the result
  emit('save', result)
  
  // Close the modal
  emit('close')
}
</script>