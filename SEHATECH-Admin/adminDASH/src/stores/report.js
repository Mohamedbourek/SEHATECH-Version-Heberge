import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useReportStore = defineStore('report', () => {
  // État
  const reports = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const recentReports = computed(() => {
    return [...reports.value].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    ).slice(0, 10) // Retourne les 10 rapports les plus récents
  })

  const reportsByType = computed(() => {
    const grouped = {}
    reports.value.forEach(report => {
      if (!grouped[report.type]) {
        grouped[report.type] = []
      }
      grouped[report.type].push(report)
    })
    return grouped
  })

  // Actions
  const generateReport = async (filters) => {
    isLoading.value = true
    error.value = null
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newReport = {
        id: Math.max(...reports.value.map(r => r.id), 0) + 1,
        name: `Rapport ${filters.period} - ${new Date().toLocaleDateString('fr-FR')}`,
        date: new Date().toISOString(),
        type: 'general',
        filters,
        fileUrl: null // URL du fichier généré
      }

      reports.value.push(newReport)
      return newReport
    } catch (err) {
      error.value = "Erreur lors de la génération du rapport"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const generateOccupancyReport = async (filters) => {
    isLoading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newReport = {
        id: Math.max(...reports.value.map(r => r.id), 0) + 1,
        name: `Rapport d'occupation - ${new Date().toLocaleDateString('fr-FR')}`,
        date: new Date().toISOString(),
        type: 'occupancy',
        filters,
        fileUrl: null
      }

      reports.value.push(newReport)
      return newReport
    } catch (err) {
      error.value = "Erreur lors de la génération du rapport d'occupation"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const generateMaintenanceReport = async (filters) => {
    isLoading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newReport = {
        id: Math.max(...reports.value.map(r => r.id), 0) + 1,
        name: `Rapport de maintenance - ${new Date().toLocaleDateString('fr-FR')}`,
        date: new Date().toISOString(),
        type: 'maintenance',
        filters,
        fileUrl: null
      }

      reports.value.push(newReport)
      return newReport
    } catch (err) {
      error.value = "Erreur lors de la génération du rapport de maintenance"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const generateIncidentsReport = async (filters) => {
    isLoading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newReport = {
        id: Math.max(...reports.value.map(r => r.id), 0) + 1,
        name: `Rapport d'incidents - ${new Date().toLocaleDateString('fr-FR')}`,
        date: new Date().toISOString(),
        type: 'incidents',
        filters,
        fileUrl: null
      }

      reports.value.push(newReport)
      return newReport
    } catch (err) {
      error.value = "Erreur lors de la génération du rapport d'incidents"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const downloadReport = async (reportId) => {
    isLoading.value = true
    error.value = null
    try {
      const report = reports.value.find(r => r.id === reportId)
      if (!report) throw new Error('Rapport non trouvé')

      // Simuler un téléchargement
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dans une vraie application, on retournerait l'URL du fichier
      // ou on déclencherait le téléchargement directement
      console.log(`Téléchargement du rapport ${report.name}`)
      
      return report
    } catch (err) {
      error.value = "Erreur lors du téléchargement du rapport"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteReport = async (reportId) => {
    isLoading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const index = reports.value.findIndex(r => r.id === reportId)
      if (index === -1) throw new Error('Rapport non trouvé')
      
      reports.value.splice(index, 1)
      return true
    } catch (err) {
      error.value = "Erreur lors de la suppression du rapport"
      console.error('Erreur:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // État
    reports,
    isLoading,
    error,
    // Getters
    recentReports,
    reportsByType,
    // Actions
    generateReport,
    generateOccupancyReport,
    generateMaintenanceReport,
    generateIncidentsReport,
    downloadReport,
    deleteReport
  }
}) 