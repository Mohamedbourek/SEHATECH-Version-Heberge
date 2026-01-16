// src/stores/cardId.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'

export const useCardIdStore = defineStore('cardId', () => {
  const card = ref(null)
  const cards = ref([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  // Récupérer la carte d'un patient (via GET /cartes-ID/{patient_id})
  const fetchCardByPatient = async (patientId) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/cartes-ID/${patientId}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      card.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement de la carte'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const getCardByPatientId = async (patientId) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/cartes-ID/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      card.value = response.data
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = 'Carte non trouvée'
        return null
      }
      error.value = err.response?.data?.message || 'Erreur lors du chargement de la carte'
      throw error.value
    } finally {
      loading.value = false
    }
  }
  // Créer une nouvelle carte (POST /cartes-ID/{patient_id})
  const createCard = async (patientId, cardData) => {
    loading.value = true
    error.value = null
    try {
      // Ensure cardData has the required fields
      if (!cardData.reference || !cardData.patient_id) {
        throw new Error('Données de carte incomplètes')
      }

      // Handle base64 photo if provided
      if (cardData.base64_photo && !cardData.base64_photo.startsWith('data:image')) {
        cardData.base64_photo = `data:image/jpeg;base64,${cardData.base64_photo}`
      }

      const response = await axiosInstance.post(`/cartes-ID/${patientId}`, cardData, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })

      // Update store state
      card.value = response.data.carteID
      cards.value.push(response.data.carteID)

      // Handle QR code parsing
      let parsedQR = {}
      if (response.data.carteID.codeQR) {
        try {
          parsedQR = typeof response.data.carteID.codeQR === 'string' 
            ? JSON.parse(response.data.carteID.codeQR)
            : response.data.carteID.codeQR
        } catch (e) {
          console.warn('Failed to parse QR code:', e)
          parsedQR = { qrData: response.data.carteID.codeQR }
        }
      }

      return {
        message: response.data.message,
        carteID: response.data.carteID,
        ...parsedQR,
        base64_photo: response.data.carteID.base64_photo
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la création de la carte'
      throw error.value
    } finally {
      loading.value = false
    }
  }
  

  // Mettre à jour une carte existante (PUT /cartes-ID/{id})
  const updateCard = async (id, cardData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/cartes-ID/${id}`, cardData, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      card.value = response.data.carteID
      // Mettre à jour la carte dans la liste, si nécessaire
      const index = cards.value.findIndex(c => c._id === id)
      if (index !== -1) cards.value[index] = response.data.carteID
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de la carte'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Supprimer une carte (DELETE /cartes-ID/{id})
  const deleteCard = async (id) => {
    loading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/cartes-ID/${id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      // Supprimer la carte du state si nécessaire
      cards.value = cards.value.filter(c => c._id !== id)
      if (card.value && card.value._id === id) {
        card.value = null
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression de la carte'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Télécharger une carte (GET /cartes-ID/{id}/download)
  const downloadCard = async (id) => {
    loading.value = true
    error.value = null
    try {
      if (!id) {
        throw new Error('ID de carte non fourni')
      }

      const response = await axiosInstance.get(`/cartes-ID/${id}/download`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${authStore.token}` }
      })

      // Verify the response is a PDF blob
      if (!response.data || response.data.type !== 'application/pdf') {
        throw new Error('Format de carte invalide')
      }

      return response.data // Blob du PDF
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Erreur lors du téléchargement de la carte'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Récupérer la photo de la carte (GET /cartes-ID/{id}/photo)
  const getCardPhoto = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/cartes-ID/${id}/photo`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération de la photo'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Scanner un QR Code (GET /cartes-ID/scan/{codeQR})
  const scanQRCode = async (codeQR) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/cartes-ID/scan/${codeQR}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du scan du QR Code'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return {
    card,
    cards,
    loading,
    error,
    fetchCardByPatient,
    createCard,
    updateCard,
    deleteCard,
    downloadCard,
    getCardPhoto,
    scanQRCode,
    getCardByPatientId
  }
})
