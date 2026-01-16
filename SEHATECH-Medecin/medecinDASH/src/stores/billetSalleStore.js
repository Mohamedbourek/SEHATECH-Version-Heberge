import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/services/axios'
import { useUserStore } from './user'

export const useBilletSalleStore = defineStore('billetSalle', () => {
  const billets = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchBillets(medecin) {
    try {
      console.log('Début de la récupération des billets de salle')
      isLoading.value = true
      error.value = null
  
      // 1) Récupération du medecinId
      const userStore = useUserStore()
      const medecinId = medecin?._id
        || userStore.user?.medecin?._id
        || localStorage.getItem('role_id')
  
      // 2) Construction de l'URL (optionnel: on peut aussi filtrer côté API si l'endpoint le supporte)
      const url = `/hospitalisations/demandes?medecin_id=${medecinId}`
      console.log('URL de la requête:', url)
  
      // 3) Appel API
      const response = await apiClient.get(url)
      console.log('Réponse du serveur pour les billets de salle :', response.status)
  
      // 4) Normaliser en tableau quel que soit le format
      const raw = response.data
      let billetsData = []
  
      if (Array.isArray(raw)) {
        billetsData = raw
      } else if (Array.isArray(raw.demandes)) {
        billetsData = raw.demandes
      } else if (Array.isArray(raw.data)) {
        billetsData = raw.data
      } else if (raw && typeof raw === 'object') {
        billetsData = [raw]
      } else {
        console.warn('Format de réponse inattendu pour les billets de salle:', raw)
      }
  
      console.log(`${billetsData.length} billet(s) de salle récupéré(s)`)
  
      // 5) Transformation en objets uniformes
      const toutes = billetsData.map(billet => ({
        _id:            billet._id || billet.id,
        patient_id:     billet.patient_id,
        medecin_id:     billet.medecin_id,                  // <-- on récupère medecin_id
        motif:          billet.motif || 'Non spécifié',
        typeDemande:    billet.typeDemande || 'hospitalisation',
        niveauUrgence:  billet.niveauUrgence || 'moyen',
        dateDebut:      billet.dateDebut ? new Date(billet.dateDebut).toISOString() : null,
        dateFin:        billet.dateFin ? new Date(billet.dateFin).toISOString()   : null,
        details:        Array.isArray(billet.details) ? billet.details : [],
        instructions:   billet.instructions || '',
        statut:         billet.statut || 'en_attente',
        created_at:     billet.created_at ? new Date(billet.created_at).toISOString() : new Date().toISOString(),
        updated_at:     billet.updated_at ? new Date(billet.updated_at).toISOString() : new Date().toISOString(),
        patient:        billet.patient || null
      }))
  
      // 6) Filtrer seulement ceux du médecin courant
      const filtrés = toutes.filter(b => b.medecin_id === medecinId)
      console.log(`${filtrés.length} billet(s) après filtrage par medecin_id (${medecinId})`)
  
      billets.value = filtrés
      return billets.value
  
    } catch (err) {
      console.error('Erreur détaillée lors de la récupération des billets de salle :', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      error.value = "Erreur lors du chargement des billets de salle"
      billets.value = []
      return []
    } finally {
      isLoading.value = false
    }
  }
  

  async function createBillet(data) {
    try {
      isLoading.value = true
      const response = await apiClient.post('/hospitalisations/demande-billet-salle', {
        patient_id: data.patient_id,
        typeDemande: data.typeDemande || 'hospitalisation',
        motif: data.motif,
        niveauUrgence: data.niveauUrgence || 'moyen',
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        details: data.details || [],
        instructions: data.instructions
      })
      
      if (response.data.success) {
        // On ajoute la nouvelle demande à la liste
        billets.value.push(response.data.demande)
        return response.data.demande
      }
      throw new Error(response.data.message || 'Erreur lors de la création du billet de salle')
    } catch (err) {
      error.value = "Erreur lors de la création du billet de salle"
      console.error('Erreur détaillée:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateBillet(id, data) {
    if (!id) {
      throw new Error('ID is required')
    }
    
    try {
      isLoading.value = true
      const response = await apiClient.put(`/hospitalisations/${id}`, {
        patient_id: data.patient_id,
        typeDemande: data.typeDemande || 'hospitalisation',
        motif: data.motif,
        niveauUrgence: data.niveauUrgence || 'moyen',
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        details: data.details || [],
        instructions: data.instructions,
        statut: data.statut
      })
      
      if (response.data.success) {
        // Mettre à jour le billet dans la liste
        const index = billets.value.findIndex(b => (b._id || b.id) === id)
        if (index !== -1) {
          billets.value[index] = response.data.demande
        }
        return response.data.demande
      }
      throw new Error(response.data.message || 'Erreur lors de la mise à jour du billet de salle')
    } catch (err) {
      error.value = "Erreur lors de la mise à jour du billet de salle"
      console.error('Erreur détaillée:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteBillet(id) {
    if (!id) {
      throw new Error('ID is required')
    }
    
    try {
      isLoading.value = true
      await apiClient.delete(`/hospitalisations/${id}`)
      // On supprime le billet en comparant l'ID sous _id ou id
      billets.value = billets.value.filter(b => (b._id || b.id) !== id)
    } catch (err) {
      error.value = "Erreur lors de la suppression du billet de salle"
      console.error('Erreur détaillée:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function getBilletsByPatient(patientId) {
    if (!patientId) {
      throw new Error('Patient ID is required')
    }
    
    try {
      isLoading.value = true
      const response = await apiClient.get(`/hospitalisations/patient/${patientId}`)
      return response.data.demandes || []
    } catch (err) {
      error.value = "Erreur lors de la récupération des billets du patient"
      console.error('Erreur détaillée:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function getBilletDetails(id) {
    if (!id) {
      throw new Error('ID is required')
    }
    
    try {
      isLoading.value = true
      const response = await apiClient.get(`/hospitalisations/${id}`)
      return response.data.demande
    } catch (err) {
      error.value = "Erreur lors de la récupération des détails du billet"
      console.error('Erreur détaillée:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Générer un PDF pour un billet de salle
   */
  async function generatePDF(billetId) {
    try {
      isLoading.value = true
      error.value = null
      const response = await apiClient.get(`/hospitalisations/${billetId}/pdf`)
      
      if (response.data && response.data.success && response.data.url) {
        return response.data.url
      } else {
        throw new Error('Format de réponse inattendu pour la génération du PDF')
      }
    } catch (err) {
      console.error('Error generating PDF:', err)
      error.value = err.response?.data?.message || 'Erreur lors de la génération du PDF'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    billets,
    isLoading,
    error,
    fetchBillets,
    createBillet,
    updateBillet,
    deleteBillet,
    getBilletsByPatient,
    getBilletDetails
  }
})
