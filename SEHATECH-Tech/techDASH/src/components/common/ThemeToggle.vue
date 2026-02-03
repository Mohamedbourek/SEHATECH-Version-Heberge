<template>
  <button
    class="theme-button flex items-center space-x-2"
    @click="toggleTheme"
  >
    <Sun v-if="isDark" class="w-5 h-5" />
    <Moon v-else class="w-5 h-5" />
    <span class="text-sm">{{ isDark ? 'Mode clair' : 'Mode sombre' }}</span>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'

const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  window.dispatchEvent(new Event('theme-change'))
}

onMounted(() => {
  // Vérifier le thème au chargement
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  isDark.value = savedTheme === 'dark' || (!savedTheme && prefersDark)
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>
.theme-button {
  @apply px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 
         hover:bg-gray-100 dark:hover:bg-gray-800 
         transition-colors duration-200;
}
</style> 