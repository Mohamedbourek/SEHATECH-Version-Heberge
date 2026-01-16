import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'

export const useRoomStore = defineStore('room', () => {
  // État
  const rooms = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const availableRooms = computed(() =>
    rooms.value?.filter(room => room.etat === 'disponible') || []
  )

  const occupiedRooms = computed(() =>
    rooms.value?.filter(room => room.etat === 'occupee') || []
  )

  const occupancyRate = computed(() => {
    const total = rooms.value?.length || 0
    return total ? Math.round((occupiedRooms.value.length / total) * 100) : 0
  })

  // Getters for new fields
  const roomsByFloor = computed(() => {
    const floorMap = new Map()
    rooms.value?.forEach(room => {
      const floor = room.etage || 'Non assigné'
      if (!floorMap.has(floor)) {
        floorMap.set(floor, [])
      }
      floorMap.get(floor).push(room)
    })
    return floorMap
  })

  const roomsByEquipment = computed(() => {
    const equipmentMap = new Map()
    rooms.value?.forEach(room => {
      const equipments = room.equipements || []
      equipments.forEach(equipment => {
        if (!equipmentMap.has(equipment)) {
          equipmentMap.set(equipment, [])
        }
        equipmentMap.get(equipment).push(room)
      })
    })
    return equipmentMap
  })

  // Actions
  const fetchRooms = async () => {
    isLoading.value = true
    error.value = null
    try {
      // Récupérer toutes les chambres
      const response = await axiosInstance.get('/chambres')

      // Vérifier si la réponse contient la propriété data
      if (response.data.success && Array.isArray(response.data.data)) {
        rooms.value = response.data.data
      } else if (Array.isArray(response.data)) {
        rooms.value = response.data
      } else {
        throw new Error('Format de données invalide')
      }

      // Récupérer les chambres disponibles
      const availableResponse = await axiosInstance.get('/chambres/disponibles')

      // Mettre à jour l'état des chambres disponibles
      if (availableResponse.data.success && Array.isArray(availableResponse.data.data)) {
        const availableIds = new Set(availableResponse.data.data.map(room => room._id))
        rooms.value = rooms.value.map(room => ({
          ...room,
          etat: availableIds.has(room._id) ? 'disponible' : room.etat
        }))
      }

      console.log('Chambres chargées:', rooms.value)
      console.log('Chambres disponibles:', availableRooms.value)

    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
    } finally {
      isLoading.value = false
    }
  }

  const addRoom = async (roomData) => {
    isLoading.value = true
    error.value = null
    try {
      // Ensure equipements is an array
      if (!Array.isArray(roomData.equipements)) {
        roomData.equipements = []
      }

      const response = await axiosInstance.post('/chambres', roomData)

      rooms.value.push(response.data.data)
      return { success: true, message: 'Chambre ajoutée avec succès', data: response.data.data }
    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const updateRoom = async (roomId, roomData) => {
    isLoading.value = true
    error.value = null
    try {
      // Ensure equipements is an array
      if (!Array.isArray(roomData.equipements)) {
        roomData.equipements = []
      }

      const response = await axiosInstance.put(`/chambres/${roomId}`, roomData)

      const index = rooms.value.findIndex(r => r._id === roomId)
      if (index !== -1) rooms.value[index] = { ...rooms.value[index], ...roomData }

      return { success: true, message: 'Chambre mise à jour avec succès', data: response.data.data }
    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const updateRoomStatus = async (roomId, newStatus) => {
    isLoading.value = true
    error.value = null
    try {
      // Mapper le statut du frontend au format attendu par l'API
      const apiStatus = newStatus === 'occupied' ? 'occupee' : newStatus

      console.log(`Mise à jour du statut de la chambre ${roomId} vers ${apiStatus}`)

      const response = await axiosInstance.patch(`/chambres/${roomId}/etat`, { etat: apiStatus })

      // Mettre à jour la chambre localement
      const roomIndex = rooms.value.findIndex(room => room._id === roomId)
      if (roomIndex !== -1) {
        rooms.value[roomIndex].etat = apiStatus
        console.log(`Statut de la chambre ${roomId} mis à jour localement à ${apiStatus}`)
      } else {
        console.warn(`Chambre ${roomId} non trouvée dans la liste locale`)
      }

      return { success: true, message: 'Statut de la chambre mis à jour avec succès' }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut de la chambre:', err)
      error.value = err.response?.data?.message || err.message
      
      // Simuler un succès en frontend si l'API échoue
      // Cela permet à l'application de continuer à fonctionner
      console.warn('Simulation de mise à jour locale du statut de la chambre')
      
      // Mettre à jour la chambre localement malgré l'erreur API
      const roomIndex = rooms.value.findIndex(room => room._id === roomId)
      if (roomIndex !== -1) {
        const apiStatus = newStatus === 'occupied' ? 'occupee' : newStatus
        rooms.value[roomIndex].etat = apiStatus
        console.log(`Statut de la chambre ${roomId} mis à jour localement à ${apiStatus} (mode fallback)`)
      }
      
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const deleteRoom = async (roomId) => {
    isLoading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/chambres/${roomId}`)

      rooms.value = rooms.value.filter(room => room._id !== roomId)
      return { success: true, message: 'Chambre supprimée avec succès' }
    } catch (err) {
      console.error('Erreur:', err)
      error.value = err.response?.data?.message || err.message
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    rooms,
    isLoading,
    error,
    availableRooms,
    occupiedRooms,
    occupancyRate,
    roomsByFloor,
    roomsByEquipment,
    fetchRooms,
    addRoom,
    updateRoom,
    updateRoomStatus,
    deleteRoom
  }
})
