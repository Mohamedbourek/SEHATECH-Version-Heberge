import { defineStore } from 'pinia'
import axios from 'axios'

export const useFileStore = defineStore('files', {
  state: () => ({
    loading: false,
    error: null
  }),

  actions: {
    async uploadFile(file, section, recordId) {
      this.loading = true
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('section', section)
        formData.append('recordId', recordId)

        const response = await axios.post('/api/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteFile(fileId) {
      this.loading = true
      try {
        await axios.delete(`/api/files/${fileId}`)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getFileUrl(fileId) {
      try {
        const response = await axios.get(`/api/files/${fileId}/url`)
        return response.data.url
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
}) 