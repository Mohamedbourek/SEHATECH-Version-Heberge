import { defineStore } from 'pinia'
import axiosInstance from '@/services/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    role_id: null 
  }),

  getters: {
    userProfile: (state) => state.user
  },

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.post('/login', credentials)

        if (response.data.success) {
          this.user = response.data.user
          this.token = response.data['Token_ADMIN']
          this.role_id = response.data.role_id
          localStorage.setItem('role_id', this.role_id)
          console.log(this.role_id)
          if (!this.token) {
            throw new Error('Invalid user role or missing admin token')
          }

          // Set the token in axios headers
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

          this.isAuthenticated = true
          return true
        } else {
          throw new Error(response.data.message || 'Login failed')
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await axiosInstance.post('/logout')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.token = null
        this.role_id = null
        this.isAuthenticated = false
        this.loading = false
      }
    },

    async updateProfile(profileData) {
      this.loading = true
      this.error = null
      try {
        let endpoint = ''
        const userId = this.user.id || this.user._id
        if (!userId) {
          throw new Error("ID utilisateur non trouvé")
        }
        const role_id = localStorage.getItem('role_id')
        console.log(role_id)
        switch (this.user.role) {
          case 'admin':
            endpoint = `/administrations/${role_id}`
            break
          case 'medecin':
            endpoint = `/medecins/${userId}`
            break
          case 'patient':
            endpoint = `/patients/${userId}`
            break
          case 'equipeSoins':
            endpoint = `/equipes-soins/${userId}`
            break
          case 'technicien':
            endpoint = `/techniciens-biomedical/${userId}`
            break
          default:
            throw new Error("Rôle utilisateur inconnu")
        }
    
        console.log('User ID:', userId)
        console.log('Endpoint:', endpoint)
        console.log('User Role:', this.user.role)
        console.log('User Data:', this.user)
        console.log('Profile Data:', profileData)
        localStorage.setItem('telephone', profileData.telephone)
    
        // Préparation des données selon le rôle
        let requestData = {}
        if (this.user.role === 'admin') {
          requestData = {
            nom: profileData.nom,
            prenom: profileData.prenom,
            email: profileData.email,
            telephone: profileData.telephone,
            role: this.user.role,
            _id: userId
          }
        } else {
          requestData = {
            ...profileData,
            role: this.user.role,
            _id: userId
          }
        }

        console.log('Request Data:', requestData)
    
        const response = await axiosInstance.put(endpoint, requestData)
    
        // Mise à jour du state avec les données de réponse
        if (response.data) {
          // Extraire les données utilisateur selon la structure de réponse
          let userData = response.data
          if (response.data.utilisateur) {
            userData = { ...response.data, ...response.data.utilisateur }
          }
          
          this.user = {
            ...this.user,
            ...userData
          }
          return userData
        } else {
          throw new Error('Aucune donnée reçue du serveur')
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchUser() {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.get('/user')
        this.user = response.data
        this.isAuthenticated = true
        return true
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async forgotPassword(email) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.post('/forgot-password', { email })
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth',
        storage: localStorage,
        paths: ['user', 'token', 'isAuthenticated', 'role_id']
      }
    ]
  }
})