import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/services/axios'

export const useNotificationsStore = defineStore('notifications', () => {
  const unreadCount = ref(0)
  const notifications = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch unread notifications count
  async function fetchUnreadCount() {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get('/maintenances/notifications/count')
      if (response.data.success) {
        unreadCount.value = response.data.count
      }
      return response.data
    } catch (err) {
      console.error('Erreur lors de la récupération du nombre de notifications:', err)
      error.value = err.message || 'Erreur lors de la récupération des notifications'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Fetch all unread notifications
  async function fetchUnreadNotifications() {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get('/maintenances/notifications/unread')
      if (response.data.success) {
        notifications.value = response.data.notifications
        unreadCount.value = response.data.count
      }
      return response.data
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err)
      error.value = err.message || 'Erreur lors de la récupération des notifications'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchRecentNotifications() {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get('/maintenances/notifications/unread?limit=3')
      if (response.data.success) {
        notifications.value = response.data.notifications
      }
      return response.data
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications récentes:', err)
      error.value = err.message || 'Erreur lors de la récupération des notifications récentes'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Mark a single notification as read
  async function markAsRead(notificationId) {
    try {
      loading.value = true
      error.value = null
      const response = await axios.put(`/maintenances/notifications/${notificationId}/read`)
      if (response.data.success) {
        // Update local state
        if (unreadCount.value > 0) {
          unreadCount.value--
        }
        // Update notification in the list if it exists
        const index = notifications.value.findIndex(n => n._id === notificationId)
        if (index !== -1) {
          notifications.value[index].statut = 'lu'
        }
      }
      return response.data
    } catch (err) {
      console.error('Erreur lors du marquage de la notification:', err)
      error.value = err.message || 'Erreur lors du marquage de la notification'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      loading.value = true
      error.value = null
      const response = await axios.post('/maintenances/notifications/mark-all-read')
      if (response.data.success) {
        // Update local state
        unreadCount.value = 0
        // Update all notifications in the list
        notifications.value.forEach(notification => {
          notification.statut = 'lu'
        })
      }
      return response.data
    } catch (err) {
      console.error('Erreur lors du marquage des notifications:', err)
      error.value = err.message || 'Erreur lors du marquage des notifications'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    unreadCount,
    notifications,
    loading,
    error,
    fetchUnreadCount,
    fetchUnreadNotifications,
    markAsRead,
    markAllAsRead
  }
})