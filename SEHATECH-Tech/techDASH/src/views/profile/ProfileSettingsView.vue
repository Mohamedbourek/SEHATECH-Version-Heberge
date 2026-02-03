<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-4xl mx-auto">
      <!-- En-tête -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Paramètres du profil
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gérez vos préférences et paramètres de sécurité
        </p>
      </div>

      <!-- Paramètres -->
      <div class="space-y-6">
        <!-- Préférences d'interface -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-6">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Préférences d'interface
            </h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-900 dark:text-white">
                    Thème
                  </label>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Choisissez le thème de l'interface
                  </p>
                </div>
                <select v-model="settings.theme" class="form-select w-40">
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                  <option value="system">Système</option>
                </select>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-900 dark:text-white">
                    Langue
                  </label>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Sélectionnez votre langue préférée
                  </p>
                </div>
                <select v-model="settings.language" class="form-select w-40">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-6">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Préférences de notification
            </h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-900 dark:text-white">
                    Alertes par email
                  </label>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Recevoir les alertes par email
                  </p>
                </div>
                <Switch
                  v-model="settings.emailAlerts"
                  class="relative inline-flex h-6 w-11 items-center rounded-full"
                  :class="settings.emailAlerts ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'"
                >
                  <span class="sr-only">Activer les alertes par email</span>
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                    :class="settings.emailAlerts ? 'translate-x-6' : 'translate-x-1'"
                  />
                </Switch>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-900 dark:text-white">
                    Notifications push
                  </label>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Activer les notifications push
                  </p>
                </div>
                <Switch
                  v-model="settings.pushNotifications"
                  class="relative inline-flex h-6 w-11 items-center rounded-full"
                  :class="settings.pushNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'"
                >
                  <span class="sr-only">Activer les notifications push</span>
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                    :class="settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'"
                  />
                </Switch>
              </div>
            </div>
          </div>
        </div>

        <!-- Sécurité -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-6">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Sécurité
            </h2>
            <div class="space-y-4">
              <button 
                class="btn btn-outline w-full"
                @click="showPasswordModal = true"
              >
                <LockIcon class="w-4 h-4 mr-2" />
                Changer le mot de passe
              </button>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-900 dark:text-white">
                    Authentification à deux facteurs
                  </label>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Sécurité renforcée de votre compte
                  </p>
                </div>
                <Switch
                  v-model="settings.twoFactorAuth"
                  class="relative inline-flex h-6 w-11 items-center rounded-full"
                  :class="settings.twoFactorAuth ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'"
                >
                  <span class="sr-only">Activer l'authentification à deux facteurs</span>
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                    :class="settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'"
                  />
                </Switch>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal changement mot de passe -->
    <Modal
      v-if="showPasswordModal"
      title="Changer le mot de passe"
      @close="showPasswordModal = false"
    >
      <form @submit.prevent="handlePasswordChange" class="space-y-4">
        <div>
          <label class="form-label">Mot de passe actuel</label>
          <input 
            v-model="passwordForm.current"
            type="password"
            class="form-input"
            required
          />
        </div>
        <div>
          <label class="form-label">Nouveau mot de passe</label>
          <input 
            v-model="passwordForm.new"
            type="password"
            class="form-input"
            required
          />
        </div>
        <div>
          <label class="form-label">Confirmer le mot de passe</label>
          <input 
            v-model="passwordForm.confirm"
            type="password"
            class="form-input"
            required
          />
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            type="button"
            class="btn btn-outline"
            @click="showPasswordModal = false"
          >
            Annuler
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
          >
            Changer
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { LockIcon } from 'lucide-vue-next'
import Modal from '@/components/common/Modal.vue'
import Switch from '@/components/common/Switch.vue'

const showPasswordModal = ref(false)
const settings = ref({
  theme: 'system',
  language: 'fr',
  emailAlerts: true,
  pushNotifications: true,
  twoFactorAuth: false
})

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

async function handlePasswordChange() {
  try {
    // Implémenter la logique de changement de mot de passe
    console.log('Changement de mot de passe...', passwordForm.value)
    showPasswordModal.value = false
    passwordForm.value = { current: '', new: '', confirm: '' }
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
  }
}
</script> 