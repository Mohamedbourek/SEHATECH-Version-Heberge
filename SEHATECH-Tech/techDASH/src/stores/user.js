import { defineStore } from 'pinia'
import apiClient from '@/services/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    technicien: null,
    loading: false,
    error: null
  }),

  getters: {
    getTechnicienId: (state) => state.technicien?.id,
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  },
  actions: {
    async fetchTechnicienDetails() {
      this.loading = true
      try {
        const token = localStorage.getItem('Token_TECHNICIEN')
        const technicienId = localStorage.getItem('role_id')
        
        if (!technicienId || technicienId === 'null' || !token) {
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        }

        const response = await apiClient.get(`/techniciens-biomedical/${technicienId}`)
        
        if (!response.data) {
          throw new Error('Aucune donnée reçue du serveur')
        }

        // Fix the data structure assignment
        this.technicien = {
          ...response.data,
          utilisateur: response.data.utilisateur
        }
        
        console.log('Fetched technician data:', this.technicien)
        this.error = null
        return response.data
      } catch (error) {
        console.error('Fetch error:', error)
        this.error = error.message
        if (error.message.includes('Session expirée')) {
          localStorage.clear()
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateTechnicienProfile(userData) {
      this.loading = true
      try {
        const technicienId = localStorage.getItem('role_id')
        const token = localStorage.getItem('Token_TECHNICIEN')
        
        if (!technicienId || !token) {
          throw new Error('Informations d\'authentification manquantes')
        }

        // Update the request payload structure
        const response = await apiClient.put(`/techniciens-biomedical/${technicienId}`, {
          competence: userData.competence,
          utilisateur: {
            nom: userData.utilisateur.nom,
            prenom: userData.utilisateur.prenom,
            email: userData.utilisateur.email,
            telephone: userData.utilisateur.telephone,
            adresse: userData.utilisateur.adresse,
            dateNaissance: userData.utilisateur.dateNaissance,
            genre: userData.utilisateur.genre
          }
        })

        // Fix the data structure assignment
        this.technicien = {
          ...response.data,
          utilisateur: response.data.utilisateur
        }
        
        console.log('Updated technician data:', this.technicien)
        this.error = null
        return response.data
      } catch (error) {
        console.error('Update error:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  },
  persist: {
    storage: localStorage,
    paths: ['technicien']
  }
})