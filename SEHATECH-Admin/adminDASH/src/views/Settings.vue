<template>
  <div class="space-y-6">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Paramètres du système
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gérez les paramètres de l'application
        </p>
      </div>
    </header>

    <!-- Sections de paramètres -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Navigation des paramètres -->
      <div class="md:col-span-1">
        <nav class="space-y-1">
          <button
            v-for="section in settingSections"
            :key="section.id"
            @click="activeSection = section.id"
            class="w-full flex items-center px-4 py-3 text-left rounded-lg"
            :class="[
              activeSection === section.id
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-100'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            ]"
          >
            <component :is="section.icon" class="w-5 h-5 mr-3" />
            {{ section.name }}
          </button>
        </nav>
      </div>

      <!-- Contenu des paramètres -->
      <div class="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <!-- Paramètres généraux -->
        <div v-if="activeSection === 'general'" class="space-y-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Paramètres généraux
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="form-label">Nom de l'établissement</label>
              <input
                v-model="settings.hospitalName"
                type="text"
                class="form-input"
              />
            </div>

            <div>
              <label class="form-label">Fuseau horaire</label>
              <select v-model="settings.timezone" class="form-select">
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="UTC">UTC</option>
                <!-- Autres fuseaux horaires -->
              </select>
            </div>

            <div>
              <label class="form-label">Langue par défaut</label>
              <select v-model="settings.defaultLanguage" class="form-select">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <!-- Autres langues -->
              </select>
            </div>
          </div>
        </div>

        <!-- Paramètres de sécurité -->
        <div v-if="activeSection === 'security'" class="space-y-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Sécurité
          </h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Authentification à deux facteurs
                </h3>
                <p class="text-sm text-gray-500">
                  Renforce la sécurité des comptes utilisateurs
                </p>
              </div>
              <Switch
                v-model="settings.twoFactorAuth"
                class="ml-4"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Verrouillage automatique
                </h3>
                <p class="text-sm text-gray-500">
                  Verrouille l'application après une période d'inactivité
                </p>
              </div>
              <Switch
                v-model="settings.autoLock"
                class="ml-4"
              />
            </div>

            <div v-if="settings.autoLock">
              <label class="form-label">Délai de verrouillage (minutes)</label>
              <select v-model="settings.lockTimeout" class="form-select">
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Paramètres de notification -->
        <div v-if="activeSection === 'notifications'" class="space-y-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Notifications
          </h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications par email
                </h3>
                <p class="text-sm text-gray-500">
                  Recevoir les notifications importantes par email
                </p>
              </div>
              <Switch
                v-model="settings.emailNotifications"
                class="ml-4"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications push
                </h3>
                <p class="text-sm text-gray-500">
                  Recevoir les notifications push dans le navigateur
                </p>
              </div>
              <Switch
                v-model="settings.pushNotifications"
                class="ml-4"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Sons de notification
                </h3>
                <p class="text-sm text-gray-500">
                  Activer les sons pour les notifications
                </p>
              </div>
              <Switch
                v-model="settings.notificationSounds"
                class="ml-4"
              />
            </div>
          </div>
        </div>

        <!-- Paramètres d'apparence -->
        <div v-if="activeSection === 'appearance'" class="space-y-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Apparence
          </h2>
          
          <div class="space-y-4">
            <!-- Thème -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Mode sombre
                </h3>
                <p class="text-sm text-gray-500">
                  Activer le thème sombre de l'application
                </p>
              </div>
              <Switch
                v-model="settings.darkMode"
                class="ml-4"
                @update:modelValue="handleThemeChange"
              />
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="resetSettings"
            class="btn btn-secondary"
          >
            Réinitialiser
          </button>
          <button
            @click="saveSettings"
            class="btn btn-primary"
            :disabled="saving"
          >
            <Loader2
              v-if="saving"
              class="w-4 h-4 mr-2 animate-spin"
            />
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Palette,
  Loader2
} from 'lucide-vue-next'
import Switch from '@/components/ui/Switch.vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const toast = useToast()
const saving = ref(false)
const activeSection = ref('general')

// Sections de paramètres
const settingSections = [
  { id: 'general', name: 'Général', icon: SettingsIcon },
  { id: 'security', name: 'Sécurité', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'appearance', name: 'Apparence', icon: Palette }
]

// Paramètres
const settings = ref({
  hospitalName: '',
  timezone: 'Europe/Paris',
  defaultLanguage: 'fr',
  twoFactorAuth: false,
  autoLock: false,
  lockTimeout: '15',
  emailNotifications: true,
  pushNotifications: false,
  notificationSounds: true,
  darkMode: false
})

// Charger les paramètres
onMounted(async () => {
  try {
    const savedSettings = await settingsStore.getSettings()
    settings.value = { ...settings.value, ...savedSettings }
    handleThemeChange(settings.value.darkMode)
  } catch (error) {
    toast.error('Erreur lors du chargement des paramètres')
  }
})

// Sauvegarder les paramètres
const saveSettings = async () => {
  saving.value = true
  try {
    await settingsStore.saveSettings(settings.value)
    toast.success('Paramètres enregistrés avec succès')
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde des paramètres')
  } finally {
    saving.value = false
  }
}

// Réinitialiser les paramètres
const resetSettings = async () => {
  try {
    await settingsStore.resetSettings()
    settings.value = await settingsStore.getSettings()
    toast.success('Paramètres réinitialisés avec succès')
  } catch (error) {
    toast.error('Erreur lors de la réinitialisation des paramètres')
  }
}

// Gestion du changement de thème
const handleThemeChange = (isDark) => {
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(isDark ? 'dark' : 'light')
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}

.btn {
  @apply inline-flex items-center px-4 py-2 border border-transparent 
         text-sm font-medium rounded-md shadow-sm 
         focus:outline-none focus:ring-2 focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors duration-200;
}

.btn-primary {
  @apply text-white bg-primary-600 hover:bg-primary-700
         focus:ring-primary-500;
}

.btn-secondary {
  @apply text-gray-700 bg-white border-gray-300 
         hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 
         dark:border-gray-600 dark:hover:bg-gray-700
         focus:ring-primary-500;
}
</style> 