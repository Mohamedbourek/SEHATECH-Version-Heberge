import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', {
  state: () => ({
    hospitalName: 'Smart Hospital'
  }),
  // ... reste du store
}) 