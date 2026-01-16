import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'

const endpoint = '/patients'

export const usePatientStore = defineStore('patient', () => {
  const toast = useToast()
  const patients = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const handleError = (err, defaultMessage = 'Une erreur est survenue') => {
    const errorMessage = err.response?.data?.message || err.message || defaultMessage
    error.value = errorMessage
    toast.error(errorMessage)
    console.error('Error:', errorMessage, err)
    throw errorMessage
  }

  // Récupérer tous les patients
  async function fetchPatients(params = {}) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
      
      const response = await axiosInstance.get(endpoint, {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      })
      patients.value = response.data.map(patient => ({
        ...patient,
        userType: 'patient'
      }))
      return patients.value
    } catch (err) {
      return handleError(err, 'Erreur lors du chargement des patients')
    } finally {
      isLoading.value = false
    }
  }

  // Recherche des patients avec enrichissement si nom/prénom manquent
  async function searchPatients(query) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      // Appel de l'endpoint de recherche
      const response = await axiosInstance.get(`${endpoint}/search`, {
        params: { query },
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Pour chaque patient, si nom et prénom sont absents, on tente d'enrichir
      const results = await Promise.all(response.data.map(async (patient) => {
        if ((!patient.nom && !patient.prenom) && patient.utilisateur_id) {
          try {
            // On récupère les détails complets du patient (avec la relation utilisateur)
            const detailResponse = await axiosInstance.get(`${endpoint}/${patient._id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            // On suppose que la réponse inclut la relation "utilisateur"
            patient.utilisateur = detailResponse.data.utilisateur
          } catch (err) {
            console.error("Erreur lors de la récupération du détail du patient pour l'ID", patient._id, err)
          }
        }
        return {
          ...patient,
          userType: 'patient',
          nom: (patient.utilisateur && patient.utilisateur.nom) || patient.nom || '',
          prenom: (patient.utilisateur && patient.utilisateur.prenom) || patient.prenom || ''
        }
      }))
      return results
    } catch (err) {
      return handleError(err, 'Erreur lors de la recherche des patients')
    } finally {
      isLoading.value = false
    }
  }

  async function createPatient(patientData) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
      
      const registerEndpoint = '/patients/register'
      const response = await axiosInstance.post(registerEndpoint, patientData, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      patients.value.push({ ...response.data, userType: 'patient' })
      toast.success('Patient créé avec succès')
      return response.data
    } catch (err) {
      return handleError(err, 'Échec de la création du patient')
    } finally {
      isLoading.value = false
    }
  }

  async function updatePatient(id, patientData) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
      
      const response = await axiosInstance.put(`${endpoint}/${id}`, patientData, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const index = patients.value.findIndex(patient => patient._id === id)
      if (index !== -1) {
        patients.value[index] = { ...response.data, userType: 'patient' }
      }
      toast.success('Patient mis à jour avec succès')
      return response.data
    } catch (err) {
      return handleError(err, 'Échec de la mise à jour du patient')
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPatientById(id) {
    isLoading.value = true;
    error.value = null;
    try {
      const authStore = useAuthStore();
      const token = authStore.token;
      if (!token) throw new Error('Non autorisé : token manquant');
  
      // This endpoint should return full details including contactsUrgence
      const response = await axiosInstance.get(`${endpoint}/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = response.data;
      // Optionally update the store:
      const index = patients.value.findIndex(p => p._id === id);
      if (index !== -1) {
        patients.value[index] = { ...data, userType: 'patient' };
      }
      return data;
    } catch (err) {
      return handleError(err, 'Erreur lors du chargement du patient');
    } finally {
      isLoading.value = false;
    }
  }
  

  async function deletePatient(id) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
      
      await axiosInstance.delete(`${endpoint}/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      patients.value = patients.value.filter(patient => patient._id !== id)
      toast.success('Patient supprimé avec succès')
    } catch (err) {
      return handleError(err, 'Échec de la suppression du patient')
    } finally {
      isLoading.value = false
    }
  }

  // Find a patient by ID from the patients array
  function getPatientById(id) {
    return patients.value.find(patient => patient._id === id);
  }

  const patientCount = computed(() => patients.value.length)

  return {
    patients,
    isLoading,
    error,
    fetchPatients,
    fetchPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    patientCount,
    getPatientById
  }
})
