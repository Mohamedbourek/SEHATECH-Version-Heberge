import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVitalSignStore = defineStore('vitalSigns', () => {
  const parametresVitaux = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getParametresByPatient = computed(() => (patientId) => {
    return parametresVitaux.value.filter(param => param.ID_patient === patientId)
  })

  const getParametresCritiques = computed(() => {
    return parametresVitaux.value.filter(param => {
      const valeur = parseFloat(param.valeur)
      const seuil = parseFloat(param.seuilCritique)
      return valeur >= seuil
    })
  })

  const getLatestParametres = computed(() => (patientId) => {
    const params = parametresVitaux.value
      .filter(param => param.ID_patient === patientId)
      .sort((a, b) => new Date(b.heureMesure) - new Date(a.heureMesure))

    const latestByType = {}
    params.forEach(param => {
      if (!latestByType[param.type]) {
        latestByType[param.type] = param
      }
    })

    return Object.values(latestByType)
  })

  // Actions
  const fetchParametresVitaux = async (patientId) => {
    loading.value = true
    try {
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({
          data: [
            {
              ID_Parametre_vital: 1,
              type: 'TEMPERATURE',
              valeur: '37.5',
              seuilCritique: '38.5',
              unite: '°C',
              heureMesure: '2024-03-21T10:00:00',
              ID_patient: patientId
            },
            {
              ID_Parametre_vital: 2,
              type: 'PRESSION_ARTERIELLE',
              valeur: '120/80',
              seuilCritique: '140/90',
              unite: 'mmHg',
              heureMesure: '2024-03-21T10:00:00',
              ID_patient: patientId
            }
          ]
        })
      }, 1000))
      
      parametresVitaux.value = response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des paramètres vitaux'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const addParametreVital = async (parametreData) => {
    loading.value = true
    try {
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({
          data: {
            ID_Parametre_vital: Date.now(),
            heureMesure: new Date().toISOString(),
            ...parametreData
          }
        })
      }, 1000))
      
      parametresVitaux.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Erreur lors de l\'ajout du paramètre vital'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    parametresVitaux,
    loading,
    error,
    getParametresByPatient,
    getParametresCritiques,
    getLatestParametres,
    fetchParametresVitaux,
    addParametreVital
  }
}) 