import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNurseStore = defineStore('nurses', () => {
  const nurses = ref([])
  const tachesSoins = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getNursesByService = computed(() => (service) => {
    return nurses.value.filter(nurse => nurse.serviceAffectation === service)
  })

  const getTachesSoinsByNurse = computed(() => (infirmierId) => {
    return tachesSoins.value.filter(tache => tache.ID_infirmier === infirmierId)
  })

  // Actions
  const fetchNurses = async () => {
    loading.value = true
    try {
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({
          data: [
            {
              ID_infirmier: 1,
              numeroAffectation: 'INF001',
              serviceAffectation: 'Cardiologie',
              ID_utilisateur: 2
            }
          ]
        })
      }, 1000))
      
      nurses.value = response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des infirmiers'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const fetchTachesSoins = async (infirmierId) => {
    loading.value = true
    try {
      const response = await new Promise(resolve => setTimeout(() => {
        resolve({
          data: [
            {
              ID_tache_soin: 1,
              description: 'Prise de tension',
              dateExecution: '2024-03-21T08:00:00',
              statut: 'EN_ATTENTE',
              ID_dossier_medical: 1,
              ID_infirmier: infirmierId
            }
          ]
        })
      }, 1000))
      
      tachesSoins.value = response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des tâches de soins'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const updateTacheSoinStatus = async (tacheId, newStatus) => {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const tache = tachesSoins.value.find(t => t.ID_tache_soin === tacheId)
      if (tache) {
        tache.statut = newStatus
      }
    } catch (err) {
      error.value = 'Erreur lors de la mise à jour du statut'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    nurses,
    tachesSoins,
    loading,
    error,
    getNursesByService,
    getTachesSoinsByNurse,
    fetchNurses,
    fetchTachesSoins,
    updateTacheSoinStatus
  }
}) 