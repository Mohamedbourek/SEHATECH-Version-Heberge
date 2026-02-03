<template>
  <div class="container mx-auto px-4 py-6">
    <!-- En-tête -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Paramètres
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Configuration de l'application
      </p>
    </div>

    <!-- Sections des paramètres -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Apparence -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Apparence
        </h2>
        
        <!-- Mode sombre -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              Mode sombre
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Basculer entre le mode clair et sombre
            </p>
          </div>
          <button
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-lg
                   text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
                   bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
                   focus:outline-none focus:ring-2 focus:ring-primary-500"
            @click="toggleTheme"
            :title="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          >
            <Sun 
              v-if="isDark"
              class="h-5 w-5 text-amber-500"
              aria-hidden="true"
            />
            <Moon
              v-else
              class="h-5 w-5"
              aria-hidden="true"
            />
            <span class="sr-only">
              {{ isDark ? 'Passer en mode clair' : 'Passer en mode sombre' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Notifications
        </h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                Alertes par email
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Recevoir les alertes importantes par email
              </p>
            </div>
            <Switch v-model="settings.emailNotifications" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { Sun, Moon } from 'lucide-vue-next'
import Switch from '@/components/common/Switch.vue'

const { isDark, toggleTheme } = useTheme()

const settings = ref({
  emailNotifications: true
})
</script> 