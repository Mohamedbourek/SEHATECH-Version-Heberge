import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useDocumentsStore = defineStore('documents', () => {
  const billetsSalle = ref([])
  const certificats = ref([])
  const traitements = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fonctions pour les billets de salle
  async function fetchBilletsSalle() {
    loading.value = true
    try {
      const response = await axios.get('/api/documents/billets-salle')
      billetsSalle.value = response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function submitBilletSalle(data) {
    loading.value = true
    try {
      const response = await axios.post('/api/documents/billets-salle', data)
      billetsSalle.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBilletSalle(id) {
    try {
      await axios.delete(`/api/documents/billets-salle/${id}`)
      billetsSalle.value = billetsSalle.value.filter(b => b.ID_billet !== id)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Fonctions pour les certificats
  async function fetchCertificats() {
    loading.value = true
    try {
      const response = await axios.get('/api/documents/certificats')
      certificats.value = response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function submitCertificat(data) {
    loading.value = true
    try {
      const response = await axios.post('/api/documents/certificats', data)
      certificats.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCertificat(id) {
    try {
      await axios.delete(`/api/documents/certificats/${id}`)
      certificats.value = certificats.value.filter(c => c.ID_certificat !== id)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // Fonctions pour les schémas de traitement
  async function fetchTraitements() {
    loading.value = true
    try {
      const response = await axios.get('/api/documents/traitements')
      traitements.value = response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function submitTraitement(data) {
    loading.value = true
    try {
      const response = await axios.post('/api/documents/traitements', data)
      traitements.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTraitement(id) {
    try {
      await axios.delete(`/api/documents/traitements/${id}`)
      traitements.value = traitements.value.filter(t => t.ID_traitement !== id)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    billetsSalle,
    certificats,
    traitements,
    loading,
    error,
    fetchBilletsSalle,
    submitBilletSalle,
    deleteBilletSalle,
    fetchCertificats,
    submitCertificat,
    deleteCertificat,
    fetchTraitements,
    submitTraitement,
    deleteTraitement
  }
}) 