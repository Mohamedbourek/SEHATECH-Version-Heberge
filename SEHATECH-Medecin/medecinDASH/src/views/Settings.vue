<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
      <!-- Paramètres de notification -->
      <div class="p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Notifications
        </h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">Notifications par email</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Recevoir les notifications par email</p>
            </div>
            <Switch
              v-model="settings.emailNotifications"
              v-slot="{ checked }"
              class="switch"
              :data-checked="checked"
            />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">Notifications push</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Recevoir les notifications sur le navigateur</p>
            </div>
            <Switch
              v-model="settings.pushNotifications"
              class="switch"
            />
          </div>
        </div>
      </div>

      <!-- Paramètres d'affichage -->
      <div class="p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Affichage
        </h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">Mode sombre</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Activer le mode sombre</p>
            </div>
            <Switch
              v-model="isDark"
              v-slot="{ checked }"
              class="switch"
              :data-checked="checked"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-900 dark:text-white">Langue</label>
            <select v-model="settings.language" class="mt-1 input">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Paramètres de sécurité -->
      <div class="p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Sécurité
        </h2>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-900 dark:text-white">Ancien mot de passe</label>
            <input 
              type="password" 
              v-model="passwordForm.oldPassword"
              class="mt-1 input"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-900 dark:text-white">Nouveau mot de passe</label>
            <input 
              type="password" 
              v-model="passwordForm.newPassword"
              class="mt-1 input"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-900 dark:text-white">Confirmer le mot de passe</label>
            <input 
              type="password" 
              v-model="passwordForm.confirmPassword"
              class="mt-1 input"
            />
          </div>
          <div class="pt-4">
            <button 
              @click="changePassword"
              class="btn btn-primary"
            >
              Changer le mot de passe
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6">
        <div class="flex justify-end space-x-3">
          <button class="btn btn-outline" @click="resetSettings">
            Réinitialiser
          </button>
          <button class="btn btn-primary" @click="saveSettings">
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Switch } from '@headlessui/vue'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()

const settings = ref({
  emailNotifications: true,
  pushNotifications: false,
  language: 'fr'
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const changePassword = () => {
  // TODO: Implémenter le changement de mot de passe
  console.log('Changing password...')
}

const saveSettings = () => {
  // TODO: Sauvegarder les paramètres
  console.log('Saving settings...')
}

const resetSettings = () => {
  // Réinitialiser les paramètres
  settings.value = {
    emailNotifications: true,
    pushNotifications: false,
    language: 'fr'
  }
}
</script>

<style scoped>
.input {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-600 
         shadow-sm focus:ring-primary-500 focus:border-primary-500 
         dark:bg-gray-700 dark:text-white
         transition-colors duration-200;
}

.btn {
  @apply inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
         focus:outline-none focus:ring-2 focus:ring-offset-2 
         transition-colors duration-200;
}

.btn-outline {
  @apply border border-gray-300 dark:border-gray-600 
         text-gray-700 dark:text-gray-300 
         hover:bg-gray-50 dark:hover:bg-gray-700
         focus:ring-primary-500;
}

.btn-primary {
  @apply bg-primary-600 text-white 
         hover:bg-primary-700 
         focus:ring-primary-500;
}

.switch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full
         bg-gray-200 dark:bg-gray-700
         transition-colors duration-200 ease-in-out cursor-pointer;
}

.switch[data-checked="true"] {
  @apply bg-primary-600;
}

.switch::before {
  content: '';
  @apply absolute h-4 w-4 transform rounded-full bg-white 
         transition duration-200 ease-in-out
         shadow-sm;
  left: 0.25rem;
}

.switch[data-checked="true"]::before {
  @apply translate-x-5;
}

.switch[data-checked="false"]::before {
  @apply translate-x-0;
}
</style>
