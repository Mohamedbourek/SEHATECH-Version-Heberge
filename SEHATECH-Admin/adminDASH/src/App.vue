<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- NavBar avec condition de visibilité améliorée -->
    <NavBar 
      v-if="shouldShowNavBar"
      :user="authStore.user"
    />

    <!-- Contenu principal avec marge conditionnelle -->
    <main :class="mainClasses">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <router-view v-slot="{ Component }">
          <transition 
            name="page"
            mode="out-in"
            appear
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Système de notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { usePreferredDark } from '@vueuse/core'
import NavBar from '@/components/NavBar.vue'
import Toast from '@/components/Toast.vue'

const route = useRoute()
const authStore = useAuthStore()
const { isDarkMode, toggleTheme } = useTheme()
const prefersDark = usePreferredDark()

// Logique de visibilité améliorée
const shouldShowNavBar = computed(() => 
  authStore.isAuthenticated && !route.meta.hideNavBar
)

// Classes dynamiques pour le contenu principal
const mainClasses = computed(() => ({
  'ml-64 pt-16': shouldShowNavBar.value,
  'pt-0': !shouldShowNavBar.value
}))

// Synchronisation du thème avec les préférences système
watch(prefersDark, (newValue) => {
  if (newValue !== isDarkMode.value) {
    toggleTheme()
  }
}, { immediate: true })
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 