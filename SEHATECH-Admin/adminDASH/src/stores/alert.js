import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  // État
  const alerts = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const stats = computed(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))

    const activeAlerts = alerts.value.filter(alert => alert.status !== 'resolved').length
    const criticalAlerts = alerts.value.filter(alert => 
      alert.priority === 'critical' && alert.status !== 'resolved'
    ).length

    const resolvedLastMonth = alerts.value.filter(alert => 
      alert.status === 'resolved' &&
      new Date(alert.resolvedAt) >= thirtyDaysAgo
    ).length

    // Calcul du temps moyen de résolution
    const resolvedAlerts = alerts.value.filter(alert => alert.status === 'resolved')
    let avgTime = 0
    if (resolvedAlerts.length > 0) {
      const totalTime = resolvedAlerts.reduce((sum, alert) => {
        const created = new Date(alert.date)
        const resolved = new Date(alert.resolvedAt)
        return sum + (resolved - created)
      }, 0)
      avgTime = Math.round(totalTime / resolvedAlerts.length / (1000 * 60 * 60)) // en heures
    }

    return {
      activeAlerts,
      criticalAlerts,
      resolvedAlerts: resolvedLastMonth,
      avgResolutionTime: `${avgTime}h`
    }
  })

  // Actions
  const fetchAlerts = async () => {
    isLoading.value = true
    error.value = null
    try {
     
    } catch (err) {
      error.value = "Erreur lors du chargement des alertes"
      console.error('Erreur:', err)
    } finally {
      isLoading.value = false
    }
  }

  const addAlert = async (alertData) => {
    isLoading.value = true
    error.value = null
    try {
      const newAlert = {
        id: Math.max(...alerts.value.map(a => a.id)) + 1,
        date: new Date().toISOString(),
        status: 'new',
        notes: [],
        resolvedAt: null,
        ...alertData
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      alerts.value.push(newAlert)
      return newAlert
    } catch (err) {
      error.value = "Erreur lors de la création de l'alerte"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateAlert = async (alertData) => {
    isLoading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = alerts.value.findIndex(a => a.id === alertData.id)
      if (index !== -1) {
        alerts.value[index] = { ...alerts.value[index], ...alertData }
        return alerts.value[index]
      }
      throw new Error('Alerte non trouvée')
    } catch (err) {
      error.value = "Erreur lors de la mise à jour de l'alerte"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateAlertStatus = async (alertId, status) => {
    isLoading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const alert = alerts.value.find(a => a.id === alertId)
      if (alert) {
        alert.status = status
        if (status === 'resolved') {
          alert.resolvedAt = new Date().toISOString()
        }
        return alert
      }
      throw new Error('Alerte non trouvée')
    } catch (err) {
      error.value = "Erreur lors de la mise à jour du statut"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const addNote = async (alertId, note) => {
    isLoading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const alert = alerts.value.find(a => a.id === alertId)
      if (alert) {
        const newNote = {
          date: new Date().toISOString(),
          ...note
        }
        alert.notes.push(newNote)
        return newNote
      }
      throw new Error('Alerte non trouvée')
    } catch (err) {
      error.value = "Erreur lors de l'ajout de la note"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Add the missing deleteAlert function
  const deleteAlert = async (alertId) => {
    isLoading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = alerts.value.findIndex(a => a.id === alertId)
      if (index !== -1) {
        alerts.value.splice(index, 1)
        return true
      }
      throw new Error('Alerte non trouvée')
    } catch (err) {
      error.value = "Erreur lors de la suppression de l'alerte"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // État
    alerts,
    isLoading,
    error,
    // Getters
    stats,
    // Actions
    fetchAlerts,
    addAlert,
    updateAlert,
    updateAlertStatus,
    addNote,
    deleteAlert  // Add the new function to the returned object
  }
})