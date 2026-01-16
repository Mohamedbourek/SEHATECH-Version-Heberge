import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'

const endpointsMap = {
  patient: '/patients',
  medecin: '/medecins',
  admin: '/administrations',
  technicien: '/techniciens-biomedical',
  equipeSoins: '/equipes-soins'
}

export const useUserStore = defineStore('user', () => {
  const toast = useToast()
  const users = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  // Stocke les cartes patients, indexées par l'ID du patient
  const patientCards = ref({})

  const handleError = (err, defaultMessage = 'An error occurred') => {
    const errorMessage = err.response?.data?.message || err.message || defaultMessage
    error.value = errorMessage
    toast.error(errorMessage)
    console.error('Error:', errorMessage, err)
    throw errorMessage
  }

  // ---------------------------
  // Actions utilisateurs
  // ---------------------------
  async function fetchUsers(userType) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
  
      if (!userType) {
        const allUsers = []
        for (const [type, endpoint] of Object.entries(endpointsMap)) {
          try {
            const response = await axiosInstance.get(endpoint, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            // Mapping en incluant la photo (si elle est renvoyée sous "photo" ou "base64_photo")
            const processedUsers = response.data.map(user => ({
              ...user,
              userType: type,
              photo: user.photo || user.base64_photo || null
            }))
            allUsers.push(...processedUsers)
          } catch (err) {
            console.error(`Erreur lors du chargement des ${type}:`, err)
          }
        }
        users.value = allUsers
        return allUsers
      }
  
      const normalizedUserType = userType.toLowerCase()
      const lookupKey = (normalizedUserType === 'equipe_soins' || normalizedUserType === 'equipesoins')
                          ? 'equipeSoins'
                          : normalizedUserType
      const endpoint = endpointsMap[lookupKey]
      if (!endpoint) {
        throw new Error(`Type d'utilisateur invalide : ${userType}`)
      }
      
      const response = await axiosInstance.get(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const mappedUsers = response.data.map(user => ({
        ...user,
        userType,
        photo: user.photo || user.base64_photo || null
      }))
      
      const filteredUsers = users.value.filter(u => u.userType !== userType)
      users.value = filteredUsers.concat(mappedUsers)
      
      console.log(`Fetched ${mappedUsers.length} ${userType} users, total users: ${users.value.length}`)
      return mappedUsers
    } catch (err) {
      handleError(err, 'Erreur lors du chargement des utilisateurs')
    } finally {
      isLoading.value = false
    }
  }

  async function createUser(userData) {
    isLoading.value = true
    error.value = null
    try {
      let userType, email, password
      if (userData instanceof FormData) {
        userType = userData.get('userType')
        email = userData.get('email')
        password = userData.get('password')
      } else {
        userType = userData.userType
        email = userData.email
        password = userData.password
      }
      if (!userType || !email?.trim() || !password?.trim()) {
        throw new Error('Champs obligatoires manquants')
      }
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      let endpoint = ''
      switch (userType) {
        case 'patient':
          endpoint = '/patients/register'
          break
        case 'medecin':
          endpoint = '/medecins/register'
          break
        case 'admin':
          endpoint = '/admins/register'
          break
        case 'technicien':
          endpoint = '/techniciens/register'
          break
        case 'equipeSoins':
          endpoint = '/equipeDeSoins/register'
          break
        default:
          throw new Error('Type d’utilisateur invalide')
      }
      
      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      }
      if (!(userData instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
      }

      const response = await axiosInstance.post(endpoint, userData, config)
      // Le backend doit renvoyer l'objet créé incluant le champ photo (ou base64_photo)
      users.value.push(response.data)
      toast.success('Utilisateur créé avec succès')
      return response.data
    } catch (err) {
      handleError(err, 'Échec de la création de l’utilisateur')
    } finally {
      isLoading.value = false
    }
  }
  
  async function updateUser(id, userData) {
    isLoading.value = true
    error.value = null
    try {
      console.log('Début de updateUser avec:', { id, userData })
      
      if (!id || !userData.userType) {
        throw new Error('Champs obligatoires manquants')
      }
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
  
      let endpoint = ''
      // Normalisation spéciale pour equipeSoins
      const userType = userData.userType === 'equipeSoins' ? 'equipesoins' : userData.userType.toLowerCase()
      console.log('Type d\'utilisateur normalisé:', userType)
  
      // Préparation des données de l'utilisateur principal
      const utilisateurData = {
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        telephone: userData.telephone,
        dateNaissance: userData.dateNaissance,
        genre: userData.genre,
        adresse: userData.adresse,
        role: userData.userType
      }
  
      // Initialize specificData before the switch statement
      let specificData = {}
  
      switch (userType) {
        case 'patient':
          endpoint = `/patients/${id}`
          specificData = {
            numeroAssurance: userData.numeroAssurance,
            groupeSanguin: userData.groupeSanguin
          }
          break
        case 'medecin':
          endpoint = `/medecins/${id}`
          specificData = {
            specialite: userData.specialite,
            numeroOrdre: userData.numeroOrdre,
            experienceAnnee: userData.experienceAnnee,
            disponibilite: userData.disponibilite
          }
          break
        case 'admin':
          endpoint = `/administrations/${id}`
          specificData = {
            poste: userData.poste,
            service: userData.service,
            utilisateur: {
              ...utilisateurData,
              poste: userData.poste,
              service: userData.service
            }
          }
          break
        case 'technicien':
          endpoint = `/techniciens-biomedical/${id}`
          specificData = {
            specialite: userData.specialite,
            certification: userData.certification
          }
          break
        case 'equipesoins':
          endpoint = `/equipes-soins/${id}`
          specificData = {
            numeroAffectation: userData.numeroAffectation,
            serviceAffectation: userData.serviceAffectation,
            type: userData.type,
            utilisateur: {
              ...utilisateurData,
              _id: userData.utilisateur_id || userData.utilisateur?._id,
              role: 'equipeSoins'
            }
          }
          break
        default:
          throw new Error(`Type d'utilisateur invalide: ${userType}`)
      }
      
      // Combinaison des données
      const dataToSend = {
        utilisateur: userType === 'admin' ? specificData.utilisateur : utilisateurData,
        ...specificData,
        utilisateur_id: userData.utilisateur_id || userData.utilisateur?._id,
        type: userData.type // Explicitly include the type field
      }
      
      console.log('Endpoint:', endpoint)
      console.log('Données formatées à envoyer:', dataToSend)
  
      const response = await axiosInstance.put(endpoint, dataToSend, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Réponse complète du serveur:', response)
      console.log('Données de réponse:', response.data)
  
      // Récupération des données selon le type d'utilisateur
      let responseData = response.data
      
      // For nested response structures, extract the appropriate data
      if (response.data.medecin) responseData = response.data.medecin
      else if (response.data.equipeSoins) responseData = response.data.equipeSoins
      else if (response.data['equipe-soins']) responseData = response.data['equipe-soins']
      else if (response.data.admin) responseData = response.data.admin
      else if (response.data.administration) responseData = response.data.administration
      else if (response.data.patient) responseData = response.data.patient
      else if (response.data.technicien) responseData = response.data.technicien
      
      
      if (response.data._id) responseData = response.data

      // Mise à jour de l'état local avec les données correctes
      const updatedUser = {
        ...responseData,
        ...specificData,
        utilisateur: userType === 'admin' ? {
          ...responseData.utilisateur,
          ...specificData.utilisateur
        } : {
          ...responseData.utilisateur,
          ...utilisateurData
        },
        userType: userData.userType,
        role: userData.userType
      }
      
      console.log('Utilisateur mis à jour:', updatedUser)
      
      // Pour les administrateurs, on s'assure que les données sont bien présentes avant la mise à jour
      if (userType === 'admin') {
        console.log('Données spécifiques admin:', {
          poste: updatedUser.poste,
          service: updatedUser.service,
          'utilisateur.poste': updatedUser.utilisateur?.poste,
          'utilisateur.service': updatedUser.utilisateur?.service
        })
      }
      
      const index = users.value.findIndex(user => {
        // Check both user._id and user.id since the API might return either
        return (user._id === id || user.id === id)
      })
      if (index !== -1) {
        // Ensure we preserve the userType when updating
        users.value[index] = {
          ...updatedUser,
          userType: userData.userType,
          _id: id // Ensure we keep the ID consistent
        }
        // Force reactivity update
        users.value = [...users.value]
      } else {
        console.warn('User not found in local state:', id)
        // Fetch all users to ensure state is in sync
        await fetchUsers()
      }
      
      toast.success('Utilisateur mis à jour avec succès')
      return updatedUser
    } catch (err) {
      console.error('Erreur complète:', err)
      console.error('Détails de la réponse:', err.response?.data)
      console.error('Status de la réponse:', err.response?.status)
      console.error('Headers de la réponse:', err.response?.headers)
      handleError(err, err.response?.data?.message || 'Échec de la mise à jour de l’utilisateur')
    } finally {
      isLoading.value = false
    }
  }

  // ---------------------------
  // Gestion des cartes patients
  // ---------------------------
  // Générer une carte pour un patient via POST /cartes-ID/{patient_id}
  async function generatePatientCard(patientId) {
    isLoading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
      
      const response = await axiosInstance.post(`/cartes-ID/${patientId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      patientCards.value[patientId] = response.data
      toast.success('Carte patient générée avec succès')
      return response.data
    } catch (err) {
      handleError(err, 'Échec de la génération de la carte patient')
    } finally {
      isLoading.value = false
    }
  }

  // Récupérer la carte d'un patient via GET /cartes-ID/{patient_id}
  async function getPatientCard(patientId) {
    isLoading.value = true
    error.value = null
    try {
      if (patientCards.value[patientId]) {
        return patientCards.value[patientId]
      }
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
  
      const response = await axiosInstance.get(`/cartes-ID/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      patientCards.value[patientId] = response.data
      return response.data
    } catch (err) {
      handleError(err, 'Échec de la récupération de la carte patient')
    } finally {
      isLoading.value = false
    }
  }

  // Mettre à jour la carte d'un patient via PUT /cartes-ID/{card_id}
  async function updatePatientCard(patientId, cardData) {
    isLoading.value = true
    error.value = null
    try {
      if (!cardData._id) {
        throw new Error('ID de la carte manquant')
      }
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
  
      const response = await axiosInstance.put(`/cartes-ID/${cardData._id}`, cardData, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      patientCards.value[patientId] = response.data
      toast.success('Carte patient mise à jour avec succès')
      return response.data
    } catch (err) {
      handleError(err, 'Échec de la mise à jour de la carte patient')
    } finally {
      isLoading.value = false
    }
  }

  // Supprimer la carte d'un patient via DELETE /cartes-ID/{card_id}
  async function deletePatientCard(patientId) {
    isLoading.value = true
    error.value = null
    try {
      const card = patientCards.value[patientId]
      if (!card || !card._id) {
        return // Aucune carte à supprimer
      }
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
  
      await axiosInstance.delete(`/cartes-ID/${card._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      delete patientCards.value[patientId]
      toast.success('Carte patient supprimée avec succès')
    } catch (err) {
      handleError(err, 'Échec de la suppression de la carte patient')
    } finally {
      isLoading.value = false
    }
  }

  // ---------------------------
  // Suppression d'un utilisateur
  // ---------------------------
  async function deleteUser(id, userType) {
    isLoading.value = true
    error.value = null
    try {
      if (!id || !userType) {
        throw new Error('Champs obligatoires manquants')
      }
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
  
      let endpoint = ''
      // Normalize the user type to handle different formats
      const normalizedType = userType.toLowerCase()
      const lookupKey = (normalizedType === 'equipe_soins' || normalizedType === 'equipesoins')
                          ? 'equipeSoins'
                          : normalizedType
      
      switch (lookupKey) {
        case 'patient':
          endpoint = `/patients/${id}`
          break
        case 'medecin':
          endpoint = `/medecins/${id}`
          break
        case 'admin':
          endpoint = `/administrations/${id}`
          break
        case 'technicien':
          endpoint = `/techniciens-biomedical/${id}`
          break
        case 'equipeSoins':
          endpoint = `/equipes-soins/${id}`
          break
        default:
          throw new Error(`Type d'utilisateur invalide: ${userType}`)
      }
  
      await axiosInstance.delete(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // Mise à jour du state local
      users.value = users.value.filter(user => user._id !== id)
      toast.success('Utilisateur supprimé avec succès')
  
      // Pour un patient, supprimer également la carte associée
      if (userType.toUpperCase() === 'PATIENT') {
        await deletePatientCard(id)
      }
    } catch (err) {
      handleError(err, 'Échec de la suppression de l’utilisateur')
    } finally {
      isLoading.value = false
    }
  }

  // ---------------------------
  // Getters
  // ---------------------------
  const medecins = computed(() => users.value.filter(user => user.role === 'medecin'))
  const patients = computed(() => users.value.filter(user => user.role === 'patient'))
  const admins = computed(() => users.value.filter(user => user.role === 'admin'))
  const techniciens = computed(() => users.value.filter(user => user.role === 'technicien'))
  const equipesSoins = computed(() => users.value.filter(user => user.role === 'equipeSoins'))

  const userStats = computed(() => ({
    total: users.value.length,
    medecins: medecins.value.length,
    patients: patients.value.length,
    admins: admins.value.length,
    techniciens: techniciens.value.length,
    equipesSoins: equipesSoins.value.length,
    actifs: users.value.filter(u => u.statutCompte === 'ACTIF').length,
    inactifs: users.value.filter(u => u.statutCompte === 'INACTIF').length
  }))

  return {
    // État
    users,
    isLoading,
    error,
    patientCards,
    // Getters
    medecins,
    patients,
    admins,
    techniciens,
    equipesSoins,
    userStats,
    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    generatePatientCard,
    getPatientCard,
    updatePatientCard,
    deletePatientCard
  }
})
