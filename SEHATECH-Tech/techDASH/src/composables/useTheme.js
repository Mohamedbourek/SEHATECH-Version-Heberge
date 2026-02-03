import { ref, watch } from 'vue'

// État partagé pour le mode sombre
const isDark = ref(localStorage.getItem('theme') === 'dark' || 
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches))

// Appliquer le thème initial
if (isDark.value) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

export function useTheme() {
  // Fonction pour basculer le thème
  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  // Observer les changements et mettre à jour le DOM
  watch(isDark, (newValue) => {
    if (newValue) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  // Écouter les changements de préférence système
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches
    }
  })

  return {
    isDark,
    toggleTheme
  }
} 