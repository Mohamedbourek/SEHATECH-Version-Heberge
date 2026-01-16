import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/services/axios'

export const useBlocOperatoireStore = defineStore('blocOperatoire', () => {
  const blocsOperatoires = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Fetch all blocs opératoires
  async function fetchBlocsOperatoires() {
    isLoading.value = true
    try {
      const response = await apiClient.get('/blocsOperatoires')
      blocsOperatoires.value = response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get single bloc opératoire
  async function getBlocOperatoire(id) {
    isLoading.value = true
    try {
      const response = await apiClient.get(`/blocsOperatoires/${id}`)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Create new bloc opératoire
  async function createBlocOperatoire(data) {
    isLoading.value = true
    try {
      const response = await apiClient.post('/blocsOperatoires', data)
      blocsOperatoires.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update bloc opératoire
  async function updateBlocOperatoire(id, data) {
    isLoading.value = true
    try {
      const response = await apiClient.put(`/blocsOperatoires/${id}`, data)
      const index = blocsOperatoires.value.findIndex(bloc => bloc._id === id)
      if (index !== -1) {
        blocsOperatoires.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete bloc opératoire
  async function deleteBlocOperatoire(id) {
    isLoading.value = true
    try {
      await apiClient.delete(`/blocsOperatoires/${id}`)
      blocsOperatoires.value = blocsOperatoires.value.filter(bloc => bloc._id !== id)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Check availability
  async function checkAvailability(id, date) {
    isLoading.value = true
    try {
      const response = await apiClient.get(`/blocsOperatoires/${id}/disponibilite/${date}`)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get daily planning
  async function getDailyPlanning(date) {
    isLoading.value = true
    try {
      const response = await apiClient.get(`/blocsOperatoires/planning/${date}`)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update status
  async function updateStatus(id, status) {
    isLoading.value = true
    try {
      const response = await apiClient.patch(`/blocsOperatoires/${id}/statut`, { statut: status })
      const index = blocsOperatoires.value.findIndex(bloc => bloc._id === id)
      if (index !== -1) {
        blocsOperatoires.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    blocsOperatoires,
    isLoading,
    error,
    fetchBlocsOperatoires,
    getBlocOperatoire,
    createBlocOperatoire,
    updateBlocOperatoire,
    deleteBlocOperatoire,
    checkAvailability,
    getDailyPlanning,
    updateStatus
  }
})