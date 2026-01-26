import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      hospitalName: 'SehaTech Hospital',
      timezone: 'Europe/Paris',
      defaultLanguage: 'fr',
      twoFactorAuth: false,
      autoLock: false,
      lockTimeout: '15',
      emailNotifications: true,
      pushNotifications: false,
      notificationSounds: true,
      darkMode: false
    }
  }),

  actions: {
    async getSettings() {
      // Load from localStorage if available
      const stored = localStorage.getItem('app_settings')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          this.settings = { ...this.settings, ...parsed }
        } catch (e) {
          console.error('Error parsing stored settings:', e)
        }
      }
      return this.settings
    },

    async saveSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
      localStorage.setItem('app_settings', JSON.stringify(this.settings))
      return this.settings
    },

    async resetSettings() {
      this.settings = {
        hospitalName: 'SehaTech Hospital',
        timezone: 'Europe/Paris',
        defaultLanguage: 'fr',
        twoFactorAuth: false,
        autoLock: false,
        lockTimeout: '15',
        emailNotifications: true,
        pushNotifications: false,
        notificationSounds: true,
        darkMode: false
      }
      localStorage.removeItem('app_settings')
      return this.settings
    }
  }
})
