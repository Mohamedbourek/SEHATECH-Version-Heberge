import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/services/axios'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const isSpecialist = computed(() => user.value?.medecin?.specialite === 'chirurgien')

  async function fetchUserInfo() {
    isLoading.value = true
    try {
      const token = localStorage.getItem('Token_MEDECIN')
      const medecinId = localStorage.getItem('role_id')
      
      console.log('Token:', token)
      console.log('Medecin ID:', medecinId)
      
      if (!medecinId || medecinId === 'null' || !token) {
        console.log('Authentication failed:', { medecinId, token })
        throw new Error('Session expirée. Veuillez vous reconnecter.')
      }
      
      const response = await axios.get(`/medecins/${medecinId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.data) {
        throw new Error('Aucune donnée reçue du serveur')
      }

      user.value = {
        ...response.data.utilisateur,
        medecin: response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      if (err.message.includes('Session expirée')) {
        localStorage.clear() // Clear all auth data
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }
  async function updateUserInfo(userData) {
    isLoading.value = true
    try {
      const medecinId = localStorage.getItem('role_id') // Changed from medecin_id to role_id
      const token = localStorage.getItem('Token_MEDECIN')
      
      console.log('Update - Token:', token)
      console.log('Update - Medecin ID:', medecinId)
      
      if (!medecinId || !token) {
        console.log('Update authentication failed:', { medecinId, token })
        throw new Error('Informations d\'authentification manquantes')
      }
      
      const response = await axios.put(`/medecins/${medecinId}`, {
        specialite: userData.specialite,
        photo: userData.photo,
        experienceAnnee: userData.experienceAnnee,
        utilisateur: {
          nom: userData.nom,
          prenom: userData.prenom,
          email: userData.email,
          telephone: userData.telephone,
          adresse: userData.adresse
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Update local state with response data
      user.value = {
        ...response.data.medecin.utilisateur,
        medecin: response.data.medecin
      }
      
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  // Add this function inside useUserStore before the return statement
  async function getStats() {
    try {
      const token = localStorage.getItem('Token_MEDECIN')
      const response = await axios.get('medecins/stats/general', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    }
  }
  
  return {
    user,
    isLoading,
    error,
    isSpecialist,
    fetchUserInfo,
    updateUserInfo,
    getStats  // Add this to the return object
  }
})