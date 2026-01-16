import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMedicationStore = defineStore('medications', () => {
  const medicaments = ref([])
  const ordonnanceMedicaments = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getMedicamentsByOrdonnance = computed(() => (ordonnanceId) => {
    const prescriptions = ordonnanceMedicaments.value.filter(
      om => om.ID_ordonnance === ordonnanceId
    )
    
    return prescriptions.map(prescription => {
      const medicament = medicaments.value.find(
        m => m.ID_medicament === prescription.ID_medicament
      )
      return {
        ...medicament,
        posologie: prescription.posologie,
        quantite: prescription.quantite
      }
    })
  })

  // Actions
  const fetchMedicaments = async () => {
    loading.value = true
    try {
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({
          data: [
            {
              ID_medicament: 1,
              nomCommercial: 'Doliprane',
              nomGenerique: 'Paracétamol',
              dosage: '1000mg',
              forme: 'Comprimé',
              fabricant: 'Sanofi',
              effetsIndesirables: 'Rares maux de tête',
              contreIndications: 'Allergie au paracétamol'
            }
          ]
        })
      }, 1000))
      
      medicaments.value = response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des médicaments'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const fetchOrdonnanceMedicaments = async (ordonnanceId) => {
    loading.value = true
    try {
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({
          data: [
            {
              ID_ordonnance_medicament: 1,
              ID_ordonnance: ordonnanceId,
              ID_medicament: 1,
              posologie: '1 comprimé 3 fois par jour',
              quantite: 30
            }
          ]
        })
      }, 1000))
      
      ordonnanceMedicaments.value = response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des prescriptions'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const addMedicamentToOrdonnance = async (ordonnanceId, medicamentData) => {
    loading.value = true
    try {
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({
          data: {
            ID_ordonnance_medicament: Date.now(),
            ID_ordonnance: ordonnanceId,
            ...medicamentData
          }
        })
      }, 1000))
      
      ordonnanceMedicaments.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Erreur lors de l\'ajout du médicament'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    medicaments,
    ordonnanceMedicaments,
    loading,
    error,
    getMedicamentsByOrdonnance,
    fetchMedicaments,
    fetchOrdonnanceMedicaments,
    addMedicamentToOrdonnance
  }
}) 