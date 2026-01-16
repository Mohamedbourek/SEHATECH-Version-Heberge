import { ref } from 'vue'

const toasts = ref([])

export const useToast = () => {
  const addToast = (toast) => {
    const id = Date.now()
    toasts.value.push({
      id,
      show: true,
      ...toast
    })
    setTimeout(() => {
      removeToast(id)
    }, toast.timeout || 3000)
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value[index].show = false
      setTimeout(() => {
        toasts.value.splice(index, 1)
      }, 300) // Wait for transition to complete
    }
  }

  const success = (message, title = 'Succès') => {
    addToast({
      type: 'success',
      title,
      message
    })
  }

  const error = (message, title = 'Erreur') => {
    addToast({
      type: 'error',
      title,
      message
    })
  }

  const info = (message, title = 'Information') => {
    addToast({
      type: 'info',
      title,
      message
    })
  }

  const warning = (message, title = 'Attention') => {
    addToast({
      type: 'warning',
      title,
      message
    })
  }

  return {
    toasts,
    success,
    error,
    info,
    warning,
    removeToast
  }
}