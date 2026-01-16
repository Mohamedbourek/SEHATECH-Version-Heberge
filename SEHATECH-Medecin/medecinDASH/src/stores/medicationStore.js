import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/services/axios'

export const useMedicationStore = defineStore('medication', () => {
  const medications = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Système de cache pour les recherches
  const searchCache = ref({})
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes en millisecondes

  // Récupérer tous les médicaments
  async function getMedications() {
    loading.value = true
    try {
      const response = await axios.get('/ordonnances/medicaments')
      
      if (response.data && response.data.success) {
        medications.value = response.data.medicaments || []
      } else {
        medications.value = []
      }
      
      return medications.value
    } catch (err) {
      error.value = "Erreur lors de la récupération des médicaments"
      console.error('Error fetching medications:', err)
      medications.value = []
      return []
    } finally {
      loading.value = false
    }
  }
  
  // Rechercher des médicaments avec mise en cache
  async function searchMedications(query) {
    if (!query || query.length < 2) {
      return []
    }
    
    const cacheKey = query.toLowerCase().trim()
    
    // Vérifier si nous avons des résultats en cache et s'ils sont toujours valides
    if (searchCache.value[cacheKey] && 
        (Date.now() - searchCache.value[cacheKey].timestamp < CACHE_DURATION)) {
      console.log('Utilisation des résultats en cache pour:', query)
      return searchCache.value[cacheKey].results
    }
    
    loading.value = true
    try {
      const response = await axios.get('/ordonnances/medicaments', {
        params: { search: query }
      })
      
      let results = []
      if (response.data && response.data.success) {
        results = response.data.medicaments || []
        
        // Stocker les résultats dans le cache
        searchCache.value[cacheKey] = {
          timestamp: Date.now(),
          results: results
        }
      }
      
      return results
    } catch (err) {
      error.value = "Erreur lors de la recherche des médicaments"
      console.error('Error searching medications:', err)
      return []
    } finally {
      loading.value = false
    }
  }
  
  // Vider le cache ou supprimer une entrée spécifique
  function clearSearchCache(queryToRemove = null) {
    if (queryToRemove) {
      const cacheKey = queryToRemove.toLowerCase().trim()
      delete searchCache.value[cacheKey]
    } else {
      searchCache.value = {}
    }
  }
  
  // Obtenir un médicament par son ID
  function getMedicamentById(id) {
    if (!id) return null
    const found = medications.value.find(med => med._id === id)
    return found || null
  }
  
  return {
    medications,
    loading,
    error,
    getMedications,
    searchMedications,
    getMedicamentById,
    clearSearchCache
  }
})