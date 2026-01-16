import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/services/axios'
import { useAuthStore } from './auth'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  const loading = ref(false)
  const error = ref(null)
  
  // Récupérer toutes les notifications
  async function fetchNotifications() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/notifications')
      
      notifications.value = response.data.map(notification => ({
        id: notification._id,
        type: mapNotificationType(notification.type),
        message: notification.contenu,
        time: formatNotificationTime(notification.dateEnvoi),
        read: notification.statut === 'lu',
        rawData: notification
      }))
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  // Récupérer les notifications d'opérations
  async function fetchOperationNotifications() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/notifications/operations')
      
      // Store operation notifications separately and merge them
      const operationNotifications = response.data.map(notification => ({
        id: notification._id,
        type: 'rappel_operation',
        message: notification.contenu,
        time: formatNotificationTime(notification.dateEnvoi),
        read: notification.statut === 'lu',
        rawData: notification
      }))
      
      // Remove existing operation notifications and keep other types
      const otherNotifications = notifications.value.filter(n => n.type !== 'rappel_operation')
      
      // Merge new operation notifications with other existing notifications
      notifications.value = [...operationNotifications, ...otherNotifications]
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications d\'opérations:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  // Récupérer les notifications d'examens
  async function fetchExamenNotifications() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/notifications/examens')
      
      // Store exam notifications separately and merge them
      const examNotifications = response.data.map(notification => ({
        id: notification._id,
        type: 'exam',
        message: notification.contenu,
        time: formatNotificationTime(notification.dateEnvoi),
        read: notification.statut === 'lu',
        rawData: notification
      }))
      
     
      const otherNotifications = notifications.value.filter(n => n.type !== 'exam')
      
      // Merge new exam notifications with other existing notifications
      notifications.value = [...examNotifications, ...otherNotifications]
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications d\'examens:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function fetchRendezVousNotifications() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/notifications/rendez-vous')
      
      // Store rendez-vous notifications separately
      const rdvNotifications = response.data.map(notification => ({
        id: notification._id,
        type: 'appointment',
        message: notification.contenu,
        time: formatNotificationTime(notification.dateEnvoi),
        read: notification.statut === 'lu',
        rawData: notification
      }))
      
      // Remove existing appointment notifications and keep other types
      const otherNotifications = notifications.value.filter(n => n.type !== 'appointment')
      
      // Merge new appointment notifications with other existing notifications
      notifications.value = [...rdvNotifications, ...otherNotifications]
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications de rendez-vous:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  
  // Marquer une notification comme lue
  async function markAsRead(notificationId) {
    try {
      await axios.patch(`/notifications/${notificationId}/read`)
      
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    } catch (err) {
      console.error('Erreur lors du marquage de la notification:', err)
    }
  }
  
  // Marquer toutes les notifications comme lues
  async function markAllAsRead() {
    try {
      await axios.patch('/notifications/read-all')
      
      notifications.value.forEach(notification => {
        notification.read = true
      })
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications:', err)
    }
  }
  
  // Mapper les types de notifications
  function mapNotificationType(backendType) {
    const typeMap = {
      'rappel_operation': 'rappel_operation',
      'message': 'message',
      'alerte': 'alert',
      'nouveau_resultat_examen': 'exam',
      'appointment': 'appointment'
    }
    
    return typeMap[backendType] || 'info'
  }
  
  // Formater le temps de notification
  function formatNotificationTime(dateString) {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    
    // Moins d'une minute
    if (diffMs < 60000) {
      return 'À l\'instant'
    }
    
    // Moins d'une heure
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000)
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    }
    
    // Moins d'un jour
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000)
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    }
    
    // Moins d'une semaine
    if (diffMs < 604800000) {
      const days = Math.floor(diffMs / 86400000)
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`
    }
    
    // Format de date standard
    return date.toLocaleDateString()
  }
  
  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchOperationNotifications,
    fetchExamenNotifications,
    fetchRendezVousNotifications,
    markAsRead,
    markAllAsRead
  }
})