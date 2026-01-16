import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      darkMode: false,
      language: 'fr',
      emailNotifications: true,
      pushNotifications: false,
      notificationSounds: true,
      twoFactorEnabled: false
    }
  }),

  getters: {
    defaultSettings: (state) => ({
      darkMode: false,
      language: 'fr',
      emailNotifications: true,
      pushNotifications: false,
      notificationSounds: true,
      twoFactorEnabled: false
    })
  },

  actions: {
    async updateSettings(newSettings) {
      try {
        // TODO: Appel API pour sauvegarder les paramètres
        this.settings = { ...newSettings }
        return true
      } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres:', error)
        throw error
      }
    },

    async changePassword(passwords) {
      try {
        // TODO: Appel API pour changer le mot de passe
        console.log('Changement de mot de passe:', passwords)
        return true
      } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error)
        throw error
      }
    }
  }
}) 