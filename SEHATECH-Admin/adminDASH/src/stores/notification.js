import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'
import { useToast } from '@/composables/useToast'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref([])
  const unreadNotifications = ref([])
  const billetSalleNotifications = ref([])
  const loading = ref(false)
  const error = ref(null)
  const toast = useToast()

  // Getters
  const notificationCount = computed(() => unreadNotifications.value.length)
  
  const getBilletSalleNotifications = computed(() => billetSalleNotifications.value)

  const getNotificationsByType = computed(() => (type) => {
    return notifications.value.filter(notification => notification.type === type)
  })

  // Actions
  async function fetchAllNotifications() {
    loading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.get('/notifications')
      notifications.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || 'Erreur lors de la récupération des notifications'
      toast.error('Erreur lors de la récupération des notifications')
      console.error('Erreur lors de la récupération des notifications:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadNotifications() {
    loading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.get('/notifications/unread')
      unreadNotifications.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || 'Erreur lors de la récupération des notifications non lues'
      toast.error('Erreur lors de la récupération des notifications non lues')
      console.error('Erreur lors de la récupération des notifications non lues:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchBilletSalleNotifications() {
    loading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.get('/notifications/demandes-billet-salle')
      billetSalleNotifications.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || 'Erreur lors de la récupération des demandes de billet de salle'
      toast.error('Erreur lors de la récupération des demandes de billet de salle')
      console.error('Erreur lors de la récupération des demandes de billet de salle:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(notificationId) {
    loading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      await axiosInstance.patch(`/notifications/${notificationId}/read`)
      
      // Update local state
      const index = unreadNotifications.value.findIndex(n => n._id === notificationId)
      if (index !== -1) {
        unreadNotifications.value.splice(index, 1)
      }
      
      // Update notification in the main list
      const notifIndex = notifications.value.findIndex(n => n._id === notificationId)
      if (notifIndex !== -1) {
        notifications.value[notifIndex].statut = 'lu'
      }
      
      toast.success('Notification marquée comme lue')
      return true
    } catch (err) {
      error.value = err.message || 'Erreur lors du marquage de la notification'
      toast.error('Erreur lors du marquage de la notification')
      console.error('Erreur lors du marquage de la notification:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function markAllAsRead() {
    loading.value = true
    error.value = null
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      await axiosInstance.patch('/notifications/read-all')
      
      // Update local state
      unreadNotifications.value = []
      
      // Update all notifications in the main list
      notifications.value.forEach(notification => {
        notification.statut = 'lu'
      })
      
      toast.success('Toutes les notifications ont été marquées comme lues')
      return true
    } catch (err) {
      error.value = err.message || 'Erreur lors du marquage des notifications'
      toast.error('Erreur lors du marquage des notifications')
      console.error('Erreur lors du marquage des notifications:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    notifications,
    unreadNotifications,
    billetSalleNotifications,
    loading,
    error,
    
    // Getters
    notificationCount,
    getBilletSalleNotifications,
    getNotificationsByType,
    
    // Actions
    fetchAllNotifications,
    fetchUnreadNotifications,
    fetchBilletSalleNotifications,
    markAsRead,
    markAllAsRead
  }
})