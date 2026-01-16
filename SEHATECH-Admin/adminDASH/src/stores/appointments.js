import { defineStore } from 'pinia'
import { ref } from 'vue'
import axiosInstance from '@/services/axios'
import { useDoctorStore } from './doctors'
import { useAuthStore } from './auth'

export const useAppointmentStore = defineStore('appointments', () => {
  const appointments = ref([])
  const currentAppointment = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const doctorStore = useDoctorStore()
  const authStore = useAuthStore()

  // Fonction de mapping pour garantir la présence du statut
  const mapAppointment = (rdv) => {
    return {
      id: rdv.id || rdv._id,
      date: rdv.date,
      type: rdv.type,
      statut: rdv.statut || 'planifie', // valeur par défaut
      patient: rdv.patient,
      medecin: rdv.medecin,
      created_at: rdv.created_at,
      updated_at: rdv.updated_at
    }
  }

  // Récupérer la liste des rendez-vous
  const fetchAppointments = async (params = {}) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/rendez-vous', {
        params,
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      // On s'assure que chaque rendez-vous possède le statut
      appointments.value = (response.data.data || []).map(mapAppointment)
      return appointments.value
    } catch (err) {
      error.value =
        err.response?.data?.message || 'Erreur lors du chargement des rendez-vous'
      appointments.value = []
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Création d'un rendez-vous
  const createAppointment = async (appointmentData) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/rendez-vous', appointmentData, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      const newAppointment = mapAppointment(response.data.data || response.data)
      appointments.value.push(newAppointment)
      return newAppointment
    } catch (err) {
      error.value =
        err.response?.data?.message || 'Erreur lors de la création du rendez-vous'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Mise à jour d'un rendez-vous existant
  const updateAppointment = async (appointmentId, appointmentData) => {
    isLoading.value = true
    error.value = null
    try {
      
      if (!['planifie', 'confirme', 'annule', 'termine'].includes(appointmentData.statut)) {
        throw new Error('Statut invalide')
      }

      // Formatage des données avant envoi
      const formattedData = {
        patient_id: appointmentData.patient_id,
        medecin_id: appointmentData.medecin_id,
        date: appointmentData.date,
        type: appointmentData.type,
        statut: appointmentData.statut,
        notes: appointmentData.notes || ''
      }

      // Si duration est présent, l'ajouter aux données
      if (appointmentData.duration) {
        formattedData.duration = parseInt(appointmentData.duration)
      }

      console.log('Données envoyées au backend:', formattedData)

      const response = await axiosInstance.put(
        `/rendez-vous/${appointmentId}`,
        formattedData,
        {
          headers: { 
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      const updatedAppointment = mapAppointment(response.data.rendezVous || response.data)
      const index = appointments.value.findIndex(app => app.id === appointmentId)
      if (index !== -1) {
        appointments.value.splice(index, 1, updatedAppointment)
      }
      return updatedAppointment
    } catch (err) {
      console.error('Erreur détaillée:', err.response?.data)
      if (err.response?.status === 422) {
        error.value = 'Validation error: ' + (err.response.data.message || 'Données invalides')
      } else {
        error.value = err.message || 'Erreur lors de la mise à jour du rendez-vous'
      }
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Suppression d'un rendez-vous
  const deleteAppointment = async (appointmentId) => {
    isLoading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/rendez-vous/${appointmentId}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      appointments.value = appointments.value.filter(app => app.id !== appointmentId)
      return true
    } catch (err) {
      error.value =
        err.response?.data?.message || 'Erreur lors de la suppression du rendez-vous'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Mise à jour du statut d'un rendez-vous
  const updateStatus = async (appointmentId, statut) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(
        `/rendez-vous/${appointmentId}`,
        { statut },
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      )
      const updatedAppointment = mapAppointment(response.data.data || response.data)
      const index = appointments.value.findIndex(app => app.id === appointmentId)
      if (index !== -1) {
        appointments.value.splice(index, 1, updatedAppointment)
      }
      return updatedAppointment
    } catch (err) {
      error.value =
        err.response?.data?.message || 'Erreur lors de la mise à jour du statut'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Récupérer le planning d'un médecin
  const getDoctorPlanning = async (doctorId, debut, fin) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/rendez-vous/planning/${doctorId}`, {
        params: { debut, fin },
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      return response.data.data || response.data
    } catch (err) {
      error.value =
        err.response?.data?.message ||
        'Erreur lors de la récupération du planning du médecin'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Récupérer tous les rendez-vous d'un patient donné
  const getPatientAppointments = async (patientId) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/rendez-vous/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      return (response.data.data || response.data).map(mapAppointment)
    } catch (err) {
      error.value =
        err.response?.data?.message ||
        'Erreur lors de la récupération des rendez-vous du patient'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  return {
    appointments,
    currentAppointment,
    isLoading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,
    getDoctorPlanning,
    getPatientAppointments
  }
})
