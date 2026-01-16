import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'

export const useDoctorStore = defineStore('doctors', () => {
  const authStore = useAuthStore()
  const doctors = ref([])
  const currentDoctor = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const formatDoctorData = (medecin) => ({
    _id: medecin._id,
    specialite: medecin.specialite,
    numeroOrdre: medecin.numeroOrdre,
    experienceAnnee: medecin.experienceAnnee,
    disponibilite: medecin.disponibilite,
    photo: medecin.photo,
    utilisateur: {
      _id: medecin.utilisateur?._id,
      nom: medecin.utilisateur?.nom,
      prenom: medecin.utilisateur?.prenom,
      email: medecin.utilisateur?.email,
      telephone: medecin.utilisateur?.telephone,
      genre: medecin.utilisateur?.genre,
      adresse: medecin.utilisateur?.adresse
    }
  })

  // Récupérer tous les médecins
  const fetchDoctors = async (params = {}) => {
    loading.value = true
    try {
      const response = await axiosInstance.get('/medecins', {
        params,
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      doctors.value = response.data.map(formatDoctorData)
      return doctors.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des médecins'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const fetchDoctor = async (id) => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/medecins/${id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      currentDoctor.value = formatDoctorData(response.data)
      return currentDoctor.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement du médecin'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const toggleDisponibilite = async (id) => {
    loading.value = true
    try {
      const response = await axiosInstance.post(`/medecins/${id}/toggle-disponibilite`, null, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      const updatedDoctor = formatDoctorData(response.data)
      const index = doctors.value.findIndex(d => d._id === id)
      if (index !== -1) doctors.value.splice(index, 1, updatedDoctor)
      return updatedDoctor
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de la disponibilité'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return {
    doctors,
    currentDoctor,
    loading,
    error,
    getAvailableDoctors: computed(() => doctors.value.filter(d => d.disponibilite)),
    getDoctorsBySpeciality: (specialite) => computed(() =>
      doctors.value.filter(d => d.specialite === specialite)
    ),
    fetchDoctors,
    fetchDoctor,
    toggleDisponibilite
  }
})
