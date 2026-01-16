import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'

export const useBlocOperatoireStore = defineStore('blocOperatoire', () => {
  // État
  const blocs = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const availableBlocs = computed(() =>
    blocs.value?.filter(bloc => bloc.statut === 'disponible') || []
  )

  const occupiedBlocs = computed(() =>
    blocs.value?.filter(bloc => bloc.statut === 'occupe') || []
  )

  const maintenanceBlocs = computed(() =>
    blocs.value?.filter(bloc => bloc.statut === 'maintenance') || []
  )

  const occupancyRate = computed(() => {
    const total = blocs.value?.length || 0
    return total ? Math.round((occupiedBlocs.value.length / total) * 100) : 0
  })

  // Getters par type
  const blocsByType = computed(() => {
    const typeMap = new Map()
    blocs.value?.forEach(bloc => {
      const type = bloc.type || 'Non assigné'
      if (!typeMap.has(type)) {
        typeMap.set(type, [])
      }
      typeMap.get(type).push(bloc)
    })
    return typeMap
  })

  // Actions
  const fetchBlocs = async () => {
    isLoading.value = true
    error.value = null
    try {
      // Récupérer tous les blocs opératoires
      const response = await axiosInstance.get('/blocsOperatoires')

      // Vérifier si la réponse contient la propriété data
      if (response.data.success && Array.isArray(response.data.data)) {
        blocs.value = response.data.data
      } else if (Array.isArray(response.data)) {
        blocs.value = response.data
      } else {
        throw new Error('Format de données invalide')
      }

      console.log('Blocs opératoires chargés:', blocs.value)
      console.log('Blocs disponibles:', availableBlocs.value)

    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
    } finally {
      isLoading.value = false
    }
  }

  const addBloc = async (blocData) => {
    isLoading.value = true
    error.value = null
    try {
      // Ensure service is included if provided
      const formattedData = {
        ...blocData,
        service: blocData.service || ''
      }

      const response = await axiosInstance.post('/blocsOperatoires', formattedData)

      blocs.value.push(response.data)
      return { success: true, message: 'Bloc opératoire ajouté avec succès', data: response.data }
    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const updateBloc = async (blocId, blocData) => {
    isLoading.value = true
    error.value = null
    try {
      // Ensure service is included if provided
      const formattedData = {
        ...blocData,
        service: blocData.service || ''
      }

      const response = await axiosInstance.put(`/blocsOperatoires/${blocId}`, formattedData)

      const index = blocs.value.findIndex(b => b._id === blocId)
      if (index !== -1) blocs.value[index] = { ...blocs.value[index], ...formattedData }

      return { success: true, message: 'Bloc opératoire mis à jour avec succès', data: response.data }
    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const updateBlocStatus = async (blocId, newStatus) => {
    isLoading.value = true
    error.value = null
    try {
      console.log(`Mise à jour du statut du bloc opératoire ${blocId} vers ${newStatus}`)

      const response = await axiosInstance.patch(`/blocsOperatoires/${blocId}/statut`, { statut: newStatus })

      // Mettre à jour le bloc opératoire localement
      const blocIndex = blocs.value.findIndex(bloc => bloc._id === blocId)
      if (blocIndex !== -1) {
        blocs.value[blocIndex].statut = newStatus
        console.log(`Statut du bloc opératoire ${blocId} mis à jour localement à ${newStatus}`)
      } else {
        console.warn(`Bloc opératoire ${blocId} non trouvé dans la liste locale`)
      }

      return { success: true, message: 'Statut du bloc opératoire mis à jour avec succès' }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut du bloc opératoire:', err)
      error.value = err.response?.data?.message || err.message
      
      // Simuler un succès en frontend si l'API échoue
      console.warn('Simulation de mise à jour locale du statut du bloc opératoire')
      
      // Mettre à jour le bloc opératoire localement malgré l'erreur API
      const blocIndex = blocs.value.findIndex(bloc => bloc._id === blocId)
      if (blocIndex !== -1) {
        blocs.value[blocIndex].statut = newStatus
        console.log(`Statut du bloc opératoire ${blocId} mis à jour localement à ${newStatus} (mode fallback)`)
      }
      
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const deleteBloc = async (blocId) => {
    isLoading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/blocsOperatoires/${blocId}`)

      // Supprimer le bloc opératoire localement
      blocs.value = blocs.value.filter(bloc => bloc._id !== blocId)

      return { success: true, message: 'Bloc opératoire supprimé avec succès' }
    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const getPlanningJournalier = async (date) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/blocsOperatoires/planning/${date}`)

      return { success: true, data: response.data }
    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Vérifier la disponibilité d'un bloc opératoire à une date donnée
  const checkBlocAvailability = async (blocId, date) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/blocsOperatoires/${blocId}/disponibilite/${date}`)

      return { success: true, data: response.data }
    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    blocs,
    isLoading,
    error,
    availableBlocs,
    occupiedBlocs,
    maintenanceBlocs,
    occupancyRate,
    blocsByType,
    fetchBlocs,
    addBloc,
    updateBloc,
    updateBlocStatus,
    deleteBloc,
    getPlanningJournalier,
    checkBlocAvailability
  }
}) 