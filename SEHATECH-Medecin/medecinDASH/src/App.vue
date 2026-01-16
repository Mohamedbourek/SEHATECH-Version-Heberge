<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- NavBar (masquée sur la page de login) -->
    <NavBar v-if="!isLoginPage" />

    <!-- Contenu principal avec marge pour la sidebar -->
    <main :class="{ 'ml-64 pt-16': !isLoginPage }">
      <!-- Conteneur principal avec padding -->
      <div class="max-w-7xl mx-auto px-6 py-6">
        <router-view v-slot="{ Component }">
          <transition 
            name="fade" 
            mode="out-in"
            appear
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Notifications toast -->
    <div class="fixed bottom-4 right-4 z-50">
      <TransitionGroup 
        name="notifications" 
        tag="div"
        class="space-y-2"
      >
        <!-- Notifications ici -->
      </TransitionGroup>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import Toast from '@/components/Toast.vue'
import { computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/Navbar.vue'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { isDark } = useTheme()

// Vérifier si on est sur la page de login
const isLoginPage = computed(() => route.name === 'Login')

// Fournir le thème à l'application
provide('isDark', isDark)
</script>

<style>
/* Transitions pour le changement de routes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transitions pour les notifications */
.notifications-enter-active,
.notifications-leave-active {
  transition: all 0.3s ease;
}

.notifications-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notifications-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Style global */
html {
  @apply antialiased;
  scroll-behavior: smooth;
}

body {
  @apply text-gray-900 dark:text-gray-100;
  font-family: 'Inter', sans-serif;
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  @apply w-2;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-700 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-600;
}

/* Focus visible */
:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900;
}

/* Sélection de texte */
::selection {
  @apply bg-primary-500/20 text-primary-900 dark:text-primary-100;
}
</style>