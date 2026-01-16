import { ref, computed } from 'vue'

// État global pour stocker les toasts
const toasts = ref([])
let toastCounter = 0

// Types de toast disponibles 
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

// Durées par défaut par type (en ms)
const DEFAULT_DURATIONS = {
  [TOAST_TYPES.SUCCESS]: 3000,
  [TOAST_TYPES.ERROR]: 5000,
  [TOAST_TYPES.INFO]: 3000,
  [TOAST_TYPES.WARNING]: 4000
}

export function useToast() {
  // Fonction pour ajouter un toast
  const showToast = ({ type = TOAST_TYPES.INFO, title, message, duration }) => {
    // Définir la durée en fonction du type si non fournie
    const actualDuration = duration || DEFAULT_DURATIONS[type] || 3000
    
    // Créer un objet toast avec un ID unique
    const id = `toast-${Date.now()}-${toastCounter++}`
    
    // Ajouter le nouveau toast au début du tableau
    toasts.value.unshift({
      id,
      type,
      title,
      message,
      createdAt: new Date(),
      visible: true
    })
    
    // Supprimer automatiquement le toast après la durée spécifiée
    setTimeout(() => {
      const index = toasts.value.findIndex(toast => toast.id === id)
      if (index !== -1) {
        // Marquer comme non visible pour l'animation de sortie
        toasts.value[index].visible = false
        
        // Retirer complètement après l'animation
        setTimeout(() => {
          toasts.value = toasts.value.filter(toast => toast.id !== id)
        }, 300) // Durée de l'animation de sortie
      }
    }, actualDuration)
    
    return id
  }
  
  // Fonction pour supprimer un toast par son ID
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      toasts.value[index].visible = false
      
      setTimeout(() => {
        toasts.value = toasts.value.filter(toast => toast.id !== id)
      }, 300)
    }
  }
  
  // Fonctions utilitaires pour chaque type de toast
  const success = (options) => showToast({ type: TOAST_TYPES.SUCCESS, ...options })
  const error = (options) => showToast({ type: TOAST_TYPES.ERROR, ...options })
  const info = (options) => showToast({ type: TOAST_TYPES.INFO, ...options })
  const warning = (options) => showToast({ type: TOAST_TYPES.WARNING, ...options })
  
  // Liste filtrée des toasts visibles
  const visibleToasts = computed(() => toasts.value.filter(toast => toast.visible))
  
  return {
    // État
    toasts,
    visibleToasts,
    
    // Actions
    showToast,
    removeToast,
    
    // Helpers
    success,
    error,
    info,
    warning,
    
    // Constantes
    TOAST_TYPES
  }
} 