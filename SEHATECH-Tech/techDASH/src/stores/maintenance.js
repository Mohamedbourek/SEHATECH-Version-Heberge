import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/services/axios'

export const useMaintenanceStore = defineStore('maintenance', () => {
  const maintenances = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentMaintenance = ref(null)
  const technicians = ref([]) // Add a ref for technicians

  // Fetch all technicians
  async function fetchTechnicians() {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await apiClient.get('/techniciens-biomedical') // Endpoint to fetch technicians
      technicians.value = response.data
      return response.data
    } catch (err) {
      console.error('Error fetching technicians:', err)
      error.value = err.message || 'Failed to fetch technicians'
      throw err
    } finally {
      loading.value = false
    }
  }
  // Fetch all maintenances
  async function fetchMaintenances() {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await apiClient.get('/maintenances')
      maintenances.value = response.data
      return response.data
    } catch (err) {
      console.error('Error fetching maintenances:', err)
      error.value = err.message || 'Failed to fetch maintenances'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Schedule a new maintenance
  async function scheduleMaintenance(maintenanceData) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await apiClient.post('/maintenances', maintenanceData)
      
      // Add the new maintenance to the list
      if (response.data.maintenance) {
        maintenances.value.push(response.data.maintenance)
      }
      
      return response.data
    } catch (err) {
      console.error('Error scheduling maintenance:', err)
      error.value = err.message || 'Failed to schedule maintenance'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get maintenance details
  async function getMaintenance(id) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await apiClient.get(`/maintenances/${id}`)
      currentMaintenance.value = response.data
      return response.data
    } catch (err) {
      console.error(`Error fetching maintenance ${id}:`, err)
      error.value = err.message || 'Failed to fetch maintenance details'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update maintenance
  async function updateMaintenance(id, maintenanceData) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await apiClient.put(`/maintenances/${id}`, maintenanceData)
      
      // Update the maintenance in the list
      const index = maintenances.value.findIndex(m => m._id === id)
      if (index !== -1 && response.data.maintenance) {
        maintenances.value[index] = response.data.maintenance
      }
      
      return response.data
    } catch (err) {
      console.error(`Error updating maintenance ${id}:`, err)
      error.value = err.message || 'Failed to update maintenance'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete maintenance
  async function deleteMaintenance(id) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      await apiClient.delete(`/maintenances/${id}`)
      
      // Remove the maintenance from the list
      maintenances.value = maintenances.value.filter(m => m._id !== id)
      
      return { success: true }
    } catch (err) {
      console.error(`Error deleting maintenance ${id}:`, err)
      error.value = err.message || 'Failed to delete maintenance'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get maintenance history for a specific equipment
  async function getMaintenanceHistory(equipmentId) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Try with a different endpoint format that matches your backend route
      const response = await apiClient.get(`/maintenances/history/${equipmentId}`)
      
      console.log('Maintenance history response:', response.data)
      
      // If the response is an array, format it properly
      if (Array.isArray(response.data)) {
        return { 
          maintenances: response.data, 
          count: response.data.length 
        }
      }
      
      // Return the data as is if it's already in the expected format
      return response.data || { maintenances: [], count: 0 }
    } catch (err) {
      console.error(`Error fetching maintenance history for equipment ${equipmentId}:`, err)
      error.value = err.message || 'Failed to fetch maintenance history'
      // Return empty result on error to prevent UI issues
      return { maintenances: [], count: 0 }
    } finally {
      loading.value = false
    }
  }

  // Track resource state
  async function trackResourceState(resourceId) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await apiClient.get(`/maintenances/track-resource-state/${resourceId}`)
      return response.data
    } catch (err) {
      console.error(`Error tracking resource state for ${resourceId}:`, err)
      error.value = err.message || 'Failed to track resource state'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Export maintenance to PDF
  async function exportMaintenancePDF(id) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_TECHNICIEN')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await apiClient.get(`/maintenances/${id}/pdf`)
      return response.data
    } catch (err) {
      console.error(`Error exporting maintenance ${id} to PDF:`, err)
      error.value = err.message || 'Failed to export maintenance to PDF'
      throw err
    } finally {
      loading.value = false
    }
  }
  return {
    maintenances,
    loading,
    error,
    currentMaintenance,
    technicians, // Export the technicians ref
    fetchTechnicians, // Export the fetch function
    fetchMaintenances,
    scheduleMaintenance,
    getMaintenance,
    updateMaintenance,
    deleteMaintenance,
    getMaintenanceHistory,
    trackResourceState,
    exportMaintenancePDF
  }
})