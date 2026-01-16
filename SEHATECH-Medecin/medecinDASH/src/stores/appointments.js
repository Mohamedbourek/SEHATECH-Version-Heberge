import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isToday } from 'date-fns'
import apiClient from '@/services/axios'

export const useAppointmentStore = defineStore('appointments', () => {
  const appointments = ref([])
  const patients = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchAppointments() {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_MEDECIN');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await apiClient.get('/rendez-vous', { // Removed trailing slash
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Check if response.data has the expected structure
      const appointmentsData = Array.isArray(response.data) ? response.data : 
                             Array.isArray(response.data.data) ? response.data.data : [];
      
      appointments.value = appointmentsData.map(mapApiAppointment);
      console.log('Fetched appointments:', appointments.value);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      error.value = err.response?.data?.message || 'Failed to load appointments';
      appointments.value = []; // Reset to empty array on error
    } finally {
      loading.value = false;
    }
  }
  

  async function addAppointment(newAppointment) {
    loading.value = true
    error.value = null
    try {
      // Debug logs to check incoming data
      console.log('Received appointment data:', newAppointment)
      console.log('Patient ID:', newAppointment.patient_id)
      console.log('Medecin ID:', newAppointment.medecin_id)
  
      if (!newAppointment.patient_id || !newAppointment.medecin_id) {
        throw new Error(`Missing required fields: ${!newAppointment.patient_id ? 'patient_id' : ''} ${!newAppointment.medecin_id ? 'medecin_id' : ''}`)
      }
  
      const token = localStorage.getItem('Token_MEDECIN');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const appointmentData = {
        patient_id: newAppointment.patient_id,
        medecin_id: newAppointment.medecin_id,
        date: new Date(newAppointment.date).toISOString(),
        type: newAppointment.type || 'Consultation',
        statut: 'planifie'
      }
  
      // Debug log for final data being sent
      console.log('Final data being sent to API:', appointmentData)
      
      const response = await apiClient.post(`/rendez-vous`, appointmentData, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
  
      const createdAppointment = mapApiAppointment(response.data.data)
      appointments.value.push(createdAppointment)
      return createdAppointment
    } catch (err) {
      // Enhanced error logging
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        data: newAppointment
      })
      error.value = err.response?.data?.message || 'Failed to create appointment'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Fonction qui mappe la réponse API dans l'objet rendez-vous utilisé côté client
  function mapApiAppointment(apiAppointment) {
    // Vérification et traitement de la date
    let dateStr = '';
    try {
      if (apiAppointment.date) {
        if (typeof apiAppointment.date === 'string') {
          dateStr = apiAppointment.date;
        } else if (apiAppointment.date.$date) {
          dateStr = new Date(apiAppointment.date.$date).toISOString();
        } else {
          const d = new Date(apiAppointment.date);
          dateStr = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
        }
      } else {
        dateStr = new Date().toISOString();
      }
    } catch (error) {
      console.error("Error processing appointment date:", error, apiAppointment);
      dateStr = new Date().toISOString();
    }
    
    return {
      _id: apiAppointment._id,
      date: dateStr,
      type: apiAppointment.type || 'Consultation',
      statut: apiAppointment.statut || 'planifie',
      patient: apiAppointment.patient || null,
      medecin: apiAppointment.medecin || null,
      notes: apiAppointment.notes || ''
    };
  }
  

  // Conversion du statut côté client vers le statut attendu par l'API
  function mapStatusToApi(status) {
    const statusMap = {
      'pending': 'planifie',
      'confirmed': 'confirme',
      'in-progress': 'en cours',
      'completed': 'termine',
      'cancelled': 'annule'
    }
    return statusMap[status] || 'planifie'
  }

  // Conversion du statut de l'API vers le statut utilisé côté client
  function mapStatusFromApi(apiStatus) {
    const statusMap = {
      'planifie': 'pending',
      'confirme': 'confirmed',
      'termine': 'completed',
      'annule': 'cancelled'
    }
    return statusMap[apiStatus] || 'pending'
  }

  async function fetchPatients() {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('Token_MEDECIN');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await apiClient.get('/patients', { // Using the correct API endpoint
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      patients.value = (response.data.data || []).map(patient => ({
        _id: patient._id,
        utilisateur_id: patient.utilisateur_id,
        groupeSanguin: patient.groupeSanguin,
        poids: patient.poids,
        taille: patient.taille,
        maladiesChroniques: patient.maladiesChroniques || [],
        created_at: patient.created_at,
        updated_at: patient.updated_at,
        utilisateur: {
          _id: patient.utilisateur?._id,
          nom: patient.utilisateur?.nom,
          prenom: patient.utilisateur?.prenom,
          email: patient.utilisateur?.email,
          telephone: patient.utilisateur?.telephone,
          dateNaissance: patient.utilisateur?.dateNaissance,
          genre: patient.utilisateur?.genre,
          adresse: patient.utilisateur?.adresse,
          actif: patient.utilisateur?.actif || true,
          role: patient.utilisateur?.role || 'patient',
          created_at: patient.utilisateur?.created_at,
          updated_at: patient.utilisateur?.updated_at
        }
      }))
      
      return patients.value
    } catch (err) {
      console.error('Error fetching patients:', err);
      error.value = err.response?.data?.message || 'Failed to load patients';
      return [];
    } finally {
      loading.value = false;
    }
  }

  const todayAppointments = computed(() =>
    appointments.value.filter(appointment => {
      try {
        const appointmentDate = new Date(appointment.date)
        const today = new Date()
        return appointmentDate.getDate() === today.getDate() &&
               appointmentDate.getMonth() === today.getMonth() &&
               appointmentDate.getFullYear() === today.getFullYear()
      } catch (error) {
        console.error('Error processing appointment date:', error)
        return false
      }
    })
  )
  return {
    appointments,
    patients,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    fetchPatients,
    todayAppointments
  }
})
