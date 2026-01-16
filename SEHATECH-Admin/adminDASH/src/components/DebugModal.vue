<template>
  <div class="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
    <h3 class="text-sm font-medium mb-2">État des modales :</h3>
    <div class="space-y-1 text-sm">
      <div>showAddRoom: {{ showAddRoom }}</div>
      <div>modalStore.isModalOpen('addRoom'): {{ modalStore.isModalOpen('addRoom') }}</div>
    </div>
  </div>
</template>

<script setup>
import { useModalStore } from '@/stores/modal'

const props = defineProps({
  showAddRoom: Boolean
})

const modalStore = useModalStore()
</script> 