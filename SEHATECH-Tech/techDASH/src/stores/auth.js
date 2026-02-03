import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/services/axios'

export const useAuthStore = defineStore('auth', {
  persist: {
    storage: localStorage,
    paths: ['user', 'isAuthenticated']
  },

  state: () => ({
    user: null,
    isAuthenticated: ref(false),
    error: ref(null)
  }),

  actions: {
    async login(credentials) {
      try {
        const response = await apiClient.post('/login', {
          email: credentials.email,
          password: credentials.password,
          remember_me: credentials.rememberMe || false
        })
        
        const { user, Token_TECHNICIEN, role_id } = response.data
        
        if (user.role !== 'technicien') {
          throw new Error('Accès non autorisé. Cette interface est réservée aux médecins.')
        }
        
        // Set token before fetching medecin details
        localStorage.setItem('Token_TECHNICIEN', Token_TECHNICIEN)
        
        // Use role_id to fetch medecin details
        const technicienResponse = await apiClient.get(`/techniciens-biomedical/${role_id}`)
        this.user = {
          ...user,
          medecin: technicienResponse.data
        }
        this.isAuthenticated = true
        
        localStorage.setItem('role_id', role_id)
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('isAuthenticated', 'true')
        
        return this.user
      } catch (err) {
        if (!navigator.onLine) {
          this.error = 'Erreur de connexion internet. Veuillez vérifier votre connexion.'
        } else if (err.code === 'ECONNABORTED') {
          this.error = 'La requête a pris trop de temps. Veuillez réessayer.'
        } else if (err.response?.status === 401) {
          this.error = 'Email ou mot de passe incorrect'
        } else if (err.response?.status === 429) {
          this.error = 'Trop de tentatives de connexion. Veuillez réessayer plus tard.'
        } else if (err.response?.status >= 500) {
          this.error = 'Une erreur serveur est survenue. Veuillez réessayer plus tard.'
        } else {
          this.error = err.response?.data?.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.'
        }
        throw new Error(this.error)
      }
    },

    async logout() {
      try {
        await apiClient.post('/logout')
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      } finally {
        this.clearSession()
      }
    },

    clearSession() {
      this.user = null
      this.isAuthenticated = false
      this.error = null
      localStorage.removeItem('Token_TECHNICIEN')
      localStorage.removeItem('token_expiry')
      localStorage.removeItem('user')
      localStorage.removeItem('isAuthenticated')
    },

    // Update checkAuth to also fetch medecin details
    async checkAuth() {
      const token = localStorage.getItem('Token_TECHNICIEN')
      const savedUser = localStorage.getItem('user')
      const savedAuth = localStorage.getItem('isAuthenticated')
      const role_id = localStorage.getItem('role_id')
      
      if (token && savedUser && savedAuth === 'true' && role_id) {
        try {
          const userResponse = await apiClient.get('/user')
          const technicienResponse = await apiClient.get(`/techniciens-biomedical/${role_id}`)
          
          this.user = {
            ...userResponse.data,
            technicien: technicienResponse.data
          }
          this.isAuthenticated = true
          localStorage.setItem('user', JSON.stringify(this.user))
          return true
        } catch (error) {
          if (error.response?.status === 401) {
            try {
              // Attempt token refresh
              const refreshResponse = await apiClient.post('/refresh-token')
              const { Token_TECHNICIEN } = refreshResponse.data
              localStorage.setItem('Token_TECHNICIEN', Token_TECHNICIEN)
              
              // Retry validation with new token
              const retryResponse = await apiClient.get('/user')
              this.user = retryResponse.data
              this.isAuthenticated = true
              localStorage.setItem('user', JSON.stringify(retryResponse.data))
              return true
            } catch (refreshError) {
              this.clearSession()
              return false
            }
          }
          this.clearSession()
          return false
        }
      }
      return false
    },

    async refreshToken() {
      try {
        const response = await apiClient.post('/refresh-token')
        const { token, expiresIn } = response.data
        
        localStorage.setItem('Token_TECHNICIEN', token)
        localStorage.setItem('token_expiry', new Date(Date.now() + expiresIn * 1000).toISOString())
        
        return token
      } catch (error) {
        this.clearSession()
        throw error
      }
    }
  },
});
    // Initialize the store
   
