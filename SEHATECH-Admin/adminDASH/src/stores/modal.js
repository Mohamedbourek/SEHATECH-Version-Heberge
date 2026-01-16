import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useModalStore = defineStore('modal', () => {
  const activeModals = ref(new Set())

  const openModal = (modalId) => {
    console.log('Opening modal:', modalId)
    activeModals.value.add(modalId)
  }

  const closeModal = (modalId) => {
    console.log('Closing modal:', modalId)
    activeModals.value.delete(modalId)
  }

  const isModalOpen = (modalId) => {
    return activeModals.value.has(modalId)
  }

  return {
    activeModals,
    openModal,
    closeModal,
    isModalOpen
  }
}) 