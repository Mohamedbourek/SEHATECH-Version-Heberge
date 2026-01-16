import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/services/axios'

export const usePrescriptionStore = defineStore('prescriptions', () => {
  const prescriptions = ref([])
  const medicaments = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Charger les médicaments
  async function loadMedicaments() {
    try {
      isLoading.value = true
      const response = await axios.get('/ordonnances/medicaments')
      medicaments.value = response.data
    } catch (err) {
      error.value = "Erreur lors du chargement des médicaments"
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  // Obtenir un médicament par ID
  function getMedicamentById(id) {
    return medicaments.value.find(med => med._id === id)
  }

  // Ajouter une prescription
  async function addPrescription(prescriptionData) {
    try {
      isLoading.value = true
      const response = await axios.post('/ordonnances', prescriptionData)
      prescriptions.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = "Erreur lors de l'ajout de la prescription"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Obtenir les médicaments d'une ordonnance
  function getMedicamentsForOrdonnance(idOrdonnance) {
    const prescription = prescriptions.value.find(p => p.id === idOrdonnance)
    return prescription ? prescription.medicaments : []
  }

  return {
    prescriptions,
    medicaments,
    isLoading,
    error,
    loadMedicaments,
    getMedicamentById,
    addPrescription,
    getMedicamentsForOrdonnance
  }
}) 