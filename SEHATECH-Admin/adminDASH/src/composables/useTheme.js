import { ref, onMounted, watch } from 'vue'

export function useTheme() {
  const isDarkMode = ref(false)

  // Vérifier la préférence système et le localStorage au montage
  onMounted(() => {
    // Vérifier d'abord le localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark'
    } else {
      // Sinon, vérifier la préférence système
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    // Appliquer le thème initial
    applyTheme()
  })

  // Observer les changements de préférence système
  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        isDarkMode.value = e.matches
      }
    })
  })

  // Observer les changements de thème
  watch(isDarkMode, () => {
    applyTheme()
  })

  // Appliquer le thème
  const applyTheme = () => {
    // Mettre à jour les classes
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Sauvegarder la préférence
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  }

  // Basculer le thème
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
  }

  return {
    isDarkMode,
    toggleTheme
  }
} 