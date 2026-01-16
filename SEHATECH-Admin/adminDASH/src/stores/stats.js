import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/services/axios'
import { useAuthStore } from './auth'

export const useStatsStore = defineStore('stats', () => {
  // État
  const dashboardStats = ref({
    stats: {
      activePatients: 0,
      todayAppointments: 0,
      occupancyRate: 0,
      activeAlerts: 0,
      patientsChange: 0,
      appointmentsChange: 0,
      occupancyChange: 0,
      alertsChange: 0
    },
    roomOccupancy: [],
    recentUsers: [],
    notifications: [],
    consultations: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: []
      }]
    },
    activities: []
  })
  
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getStats = computed(() => dashboardStats.value.stats)
  const getRoomOccupancy = computed(() => dashboardStats.value.roomOccupancy)
  const getRecentUsers = computed(() => dashboardStats.value.recentUsers)
  const getNotifications = computed(() => dashboardStats.value.notifications)
  const getConsultations = computed(() => dashboardStats.value.consultations)
  const getActivities = computed(() => dashboardStats.value.activities)

  // Actions
  const fetchDashboardStats = async () => {
    loading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axios.get('/administrations/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data) {
        dashboardStats.value = {
          stats: {
            activePatients: response.data.stats.activePatients || 0,
            todayAppointments: response.data.stats.todayAppointments || 0,
            occupancyRate: response.data.stats.occupancyRate || 0,
            activeAlerts: response.data.stats.activeAlerts || 0,
            patientsChange: response.data.stats.patientsChange || 0,
            appointmentsChange: response.data.stats.appointmentsChange || 0,
            occupancyChange: response.data.stats.occupancyChange || 0,
            alertsChange: response.data.stats.alertsChange || 0
          },
          roomOccupancy: response.data.roomOccupancy || [],
          recentUsers: response.data.recentUsers || [],
          notifications: response.data.notifications || [],
          consultations: response.data.consultations || {
            labels: [],
            datasets: [{ data: [], backgroundColor: [] }]
          },
          activities: response.data.activities || []
        }
      }

      return dashboardStats.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des statistiques'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const fetchRoomOccupancy = async () => {
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axios.get('/administrations/rooms/occupancy', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data) {
        dashboardStats.value.roomOccupancy = response.data
      }

      return dashboardStats.value.roomOccupancy
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement de l\'occupation des chambres'
      throw error.value
    }
  }

  const fetchConsultationsStats = async () => {
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axios.get('/administrations/consultations/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data) {
        dashboardStats.value.consultations = response.data
      }

      return dashboardStats.value.consultations
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des statistiques de consultation'
      throw error.value
    }
  }

  // Add a new ref for activities meta information
  const activitiesMeta = ref({
    current_page: 1,
    per_page: 4,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0
  })
  
  // Add a getter for the activities meta
  const getActivitiesMeta = computed(() => activitiesMeta.value)
  
  // Update the fetchRecentActivities function to properly handle pagination
  // In your stats.js store file
  const fetchRecentActivities = async (page) => {
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')
  
      // Ensure page is a number
      const pageNumber = parseInt(page, 10)
      console.log(`Fetching activities for page ${pageNumber}`)
      
      // Set loading state
      loading.value = true
      
      // Make sure to explicitly include the page parameter in the request
      const response = await axios.get('/administrations/activities/recent', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { page: pageNumber } // Ensure page is passed as a number
      })
  
      console.log(`API response for page ${pageNumber}:`, response.data)
  
      if (response.data) {
        // IMPORTANT: Create a completely new array reference to ensure Vue detects the change
        dashboardStats.value = {
          ...dashboardStats.value,
          activities: [...(response.data.data || [])]
        }
        
        // Update meta information if available
        if (response.data.meta) {
          // Store the meta information
          activitiesMeta.value = { ...response.data.meta }
        }
      }
  
      return response.data
    } catch (err) {
      console.error('Error fetching activities:', err)
      error.value = err.response?.data?.message || 'Erreur lors du chargement des activités récentes'
      throw error.value
    } finally {
      // Reset loading state
      loading.value = false
    }
  }
  
  // Don't forget to include the new getter in the return statement
  return {
    // État
    dashboardStats,
    loading,
    error,
    // Getters
    getStats,
    getRoomOccupancy,
    getRecentUsers,
    getNotifications,
    getConsultations,
    getActivities,
    getActivitiesMeta, // Add this new getter
    // Actions
    fetchDashboardStats,
    fetchRoomOccupancy,
    fetchConsultationsStats,
    fetchRecentActivities
  }
})