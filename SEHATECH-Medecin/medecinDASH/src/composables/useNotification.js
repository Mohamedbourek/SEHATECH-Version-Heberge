import { ref } from 'vue'

const notifications = ref([])

export function useNotification() {
  function showNotification({ type = 'info', message, duration = 5000 }) {
    const id = Date.now()
    notifications.value.push({ id, type, message })
    
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }

  function removeNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications,
    showNotification,
    removeNotification
  }
} 