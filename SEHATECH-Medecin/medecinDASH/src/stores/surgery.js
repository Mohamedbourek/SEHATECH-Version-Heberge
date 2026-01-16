import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/services/axios'

export const useSurgeryStore = defineStore('surgery', () => {
  const surgeries = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  // Add a helper function to check if user is a surgeon
  function isSurgeonSpecialty(specialite) {
    const surgeonSpecialties = ['Neurochirurgie', 'Traumatologie']
    return surgeonSpecialties.includes(specialite?.toLowerCase())
  }
  
  async function fetchSurgeries() {
    isLoading.value = true
    try {
      const response = await apiClient.get('/operations')
      surgeries.value = response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createSurgery(surgeryData) {
    isLoading.value = true
    try {
      console.log('Envoi des données d\'opération à l\'API:', surgeryData);
      
      // Adapter au format exactement attendu par l'API selon les validations du OperationController
      const formattedData = {
        date: surgeryData.date_operation,
        type: surgeryData.type_operation,
        numerosalle: surgeryData.salle_operation || '',
        dossier_id: surgeryData.dossier_id,
        blocOperatoire_id: surgeryData.blocOperatoire_id,
        rapportOperation: surgeryData.notes || '',
        // Ces champs ne sont pas directement utilisés par le backend mais conservés pour le log
        heure_debut: surgeryData.heure_debut,
        duree_prevue: Number(surgeryData.duree_prevue),
        patient_id: surgeryData.patient_id,
        medecin_id: surgeryData.medecin_id
      };
      
      // Vérifier que les champs obligatoires sont bien présents
      if (!formattedData.date) {
        throw new Error('La date d\'opération est requise');
      }
      
      if (!formattedData.type) {
        throw new Error('Le type d\'opération est requis');
      }
      
      if (!formattedData.dossier_id) {
        throw new Error('Le dossier médical est requis');
      }
      
      if (!formattedData.numerosalle) {
        throw new Error('Le numéro de salle est requis');
      }
      
      if (!formattedData.blocOperatoire_id) {
        throw new Error('Le bloc opératoire est requis');
      }
      
      console.log('Données adaptées au format API:', formattedData);
      
      try {
        const response = await apiClient.post('/operations/planifier', formattedData);
        console.log('Réponse de l\'API après création:', response);
        
        if (response.data) {
          if (response.data.operation) {
            surgeries.value.push(response.data.operation);
            return response.data.operation;
          } else {
            surgeries.value.push(response.data);
            return response.data;
          }
        } else {
          throw new Error('Aucune donnée retournée par l\'API');
        }
      } catch (innerErr) {
        console.error('Tentative échouée, erreur:', innerErr);
        console.error('Détails de l\'erreur:', innerErr.response?.data);
        
        // Afficher des détails spécifiques sur l'erreur de validation
        if (innerErr.response?.status === 422) {
          const validationErrors = innerErr.response.data?.errors || {};
          const errorMessages = Object.values(validationErrors).flat();
          throw new Error(`Erreurs de validation: ${errorMessages.join(', ')}`);
        }
        
        throw innerErr;
      }
    } catch (err) {
      console.error('Erreur lors de la création de l\'opération:', err);
      console.error('Réponse du serveur:', err.response?.data);
      
      // Extraire le message d'erreur détaillé si disponible
      let errorMessage = 'Erreur lors de la création de l\'opération';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      error.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSurgery(data, id) {
      isLoading.value = true
      try {
        // Use the provided ID or extract it from the data object
        const surgeryId = id || data._id;
        
        if (!surgeryId) {
          throw new Error('ID de l\'opération manquant');
        }
        
        // Extract only the fields needed for the update
        const { _id, created_at, updated_at, dossier, medecin, bloc_operatoire, ...surgeryData } = data;
        
        // Ensure we have the correct IDs for relationships
        if (data.dossier && !surgeryData.dossier_id) {
          surgeryData.dossier_id = data.dossier._id;
        }
        
        if (data.bloc_operatoire && !surgeryData.blocOperatoire_id) {
          surgeryData.blocOperatoire_id = data.bloc_operatoire._id;
        }
        
        if (data.medecin && !surgeryData.medecin_id) {
          surgeryData.medecin_id = data.medecin._id;
        }
        
        console.log('Mise à jour de l\'opération:', surgeryId, surgeryData);
        
        const response = await apiClient.put(`/operations/${surgeryId}`, surgeryData);
        console.log('Réponse de l\'API après mise à jour:', response);
        
        if (response.data) {
          const index = surgeries.value.findIndex(s => s._id === surgeryId);
          if (index !== -1) {
            surgeries.value[index] = response.data;
          }
          return response.data;
        } else {
          throw new Error('Aucune donnée retournée par l\'API');
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'opération:', err);
        error.value = err.message || 'Erreur lors de la mise à jour de l\'opération';
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

  async function deleteSurgery(id) {
    try {
      await apiClient.delete(`/operations/${id}`)
      surgeries.value = surgeries.value.filter(s => s._id !== id)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function getSurgery(id) {
    try {
      const response = await apiClient.get(`/operations/${id}`)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    }
  }
  // Add these with other refs
  const stats = ref({
    todayOperations: 0,
    completedOperations: 0,
    upcomingOperations: 0,
    urgentOperations: 0
  })
  // Add fetchStats function
  async function fetchStats() {
    try {
      const response = await apiClient.get('/operations/stats')
      stats.value = response.data
    } catch (err) {
      error.value = err.message
      throw err
    }
  }
  return {
    surgeries,
    isLoading,
    error,
    stats,
    fetchSurgeries,
    createSurgery,
    updateSurgery,
    deleteSurgery,
    getSurgery,
    fetchStats
  }
})