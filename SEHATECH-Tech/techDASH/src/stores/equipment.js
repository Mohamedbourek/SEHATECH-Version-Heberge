/*import { defineStore } from 'pinia'

export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    equipments: [],
    loading: false,
    error: null,
    lastId: 6 
  }),

  getters: {
    getEquipmentById: (state) => (id) => {
      return state.equipments.find(eq => eq.id === id)
    },
    
    getEquipmentsByDepartment: (state) => (department) => {
      return state.equipments.filter(eq => eq.department === department)
    },
    
    getEquipmentsByStatus: (state) => (status) => {
      return state.equipments.filter(eq => eq.status === status)
    }
  },

  actions: {
    async fetchEquipments() {
      this.loading = true
      try {
        // Données de test
        this.equipments = [
          {
            id: 1,
            name: 'Scanner IRM',
            serialNumber: 'IRM-2023-001',
            status: 'operational',
            availability: 98,
            mtbf: 720,
            lastCheck: '2024-02-15T08:30:00',
            alerts: []
          },
          {
            id: 2,
            name: 'Échographe',
            model: 'GE Vivid E95',
            status: 'maintenance',
            department: 'cardiology',
            location: 'Salle 3',
            lastMaintenance: '2024-02-01',
            availability: 85,
            mtbf: 650,
            alerts: [{ id: 1, severity: 'warning', message: 'Maintenance préventive requise' }]
          }
        ]
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async updateEquipment(id, data) {
      try {
        // Simuler la mise à jour
        const index = this.equipments.findIndex(eq => eq.id === id)
        if (index !== -1) {
          this.equipments[index] = { 
            ...this.equipments[index], 
            ...data,
            lastMaintenance: new Date().toISOString()
          }
          return this.equipments[index]
        }
        throw new Error('Équipement non trouvé')
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async addEquipment(data) {
      try {
        // Au lieu d'appeler une API, on simule directement l'ajout
        const newEquipment = {
          id: ++this.lastId,
          ...data,
          status: 'operational',
          availability: 100,
          mtbf: 0,
          alerts: [],
          lastMaintenance: new Date().toISOString()
        }
        
        // Ajouter localement
        this.equipments.push(newEquipment)
        return newEquipment
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
}) */
  import { defineStore } from 'pinia'
  import apiClient from '@/services/axios'
  
  export const useEquipmentStore = defineStore('equipment', {
    state: () => ({
      equipments: [],
      maintenanceHistory: [],
      loading: false,
      historyLoading: false,
      error: null
    }),
  
    getters: {
      // ... existing getters remain the same ...
      getEquipmentById: (state) => (id) => {
        return state.equipments.find(eq => eq._id === id || eq.id === id)
      },
      
      // Updated MTTR calculation
      getMTTR: (state) => (equipmentId) => {
        const history = state.maintenanceHistory.filter(entry => entry.equipmentId === equipmentId);
        if (history.length === 0) return 0;
  
        const totalRepairTime = history.reduce((sum, entry) => sum + (entry.repairTime || 0), 0);
        return (totalRepairTime / history.length).toFixed(2); // Retourne MTTR en heures
      },
      
      // Updated MTBF calculation
      getMTBF: (state) => (equipmentId) => {
        const history = state.maintenanceHistory
          .filter(entry => entry.equipmentId === equipmentId)
          .sort((a, b) => new Date(a.date) - new Date(b.date)); // Tri chronologique
      
        if (history.length < 2) return 0; // MTBF n'a de sens qu'avec au moins 2 pannes
      
        let totalOperatingTime = 0;
        for (let i = 1; i < history.length; i++) {
          const previousFailureDate = new Date(history[i - 1].date);
          const currentFailureDate = new Date(history[i].date);
          totalOperatingTime += (currentFailureDate - previousFailureDate) / (1000 * 60 * 60); // Conversion en heures
        }
      
        return (totalOperatingTime / (history.length - 1)).toFixed(2); // Retourne MTBF en heures
      },
      getGlobalMTBF: (state) => {
        if (!state.equipments || state.equipments.length === 0) {
          return 0;
        }
        
        let totalMTBF = 0;
        let equipmentWithMTBF = 0;
        
        // Calculate MTBF for each equipment and sum them
        state.equipments.forEach(equipment => {
          const equipmentId = equipment._id || equipment.id;
          const mtbf = parseFloat(state.getMTBF(equipmentId));
          
          if (mtbf > 0) {
            totalMTBF += mtbf;
            equipmentWithMTBF++;
          }
        });
        
        // Return average MTBF or 0 if no equipment has MTBF data
        return equipmentWithMTBF > 0 ? (totalMTBF / equipmentWithMTBF).toFixed(2) : 0;
      },
      
      // Updated availability percentage calculation for a specific equipment
      getAvailabilityPercentage: (state) => (equipmentId) => {
        const equipment = state.equipments.find(eq => eq._id === equipmentId || eq.id === equipmentId);
        if (!equipment) return 0;
        
        // If equipment is in maintenance state, return 0% availability
        if ( equipment.etat === 'En maintenance' || equipment.etat === 'maintenance' || equipment.etat === 'Hors service' ) {
          return 0;
        }
      
        // Récupération du MTBF et MTTR depuis l'historique de maintenance
        const history = state.maintenanceHistory
          .filter(entry => entry.equipmentId === equipmentId)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
      
        if (history.length < 2) return 100; // Si pas assez de données, suppose 100% dispo
      
        let totalOperatingTime = 0;
        let totalRepairTime = 0;
      
        for (let i = 1; i < history.length; i++) {
          const previousFailureDate = new Date(history[i - 1].date);
          const currentFailureDate = new Date(history[i].date);
          const repairTime = history[i].repairDuration || 0; // Temps de réparation (en heures)
      
          totalOperatingTime += (currentFailureDate - previousFailureDate) / (1000 * 60 * 60); // Convertir en heures
          totalRepairTime += repairTime;
        }
      
        const MTBF = totalOperatingTime / (history.length - 1);
        const MTTR = totalRepairTime / history.length;
      
        const availability = (MTBF / (MTBF + MTTR)) * 100;
      
        return Math.round(availability);
      },
      
      // New getter for global availability percentage
      getGlobalAvailabilityPercentage: (state) => {
        if (!state.equipments || state.equipments.length === 0) {
          return 0;
        }
        
        // Count operational and available equipment
        const availableCount = state.equipments.filter(eq => 
          eq.status === 'operational' || eq.status === 'available' || 
          eq.etat === 'operational' || eq.etat === 'available' || eq.etat === 'Fonctionnel'
        ).length;
        
        // Calculate percentage
        const percentage = (availableCount / state.equipments.length) * 100;
        
        // Return rounded percentage
        return Math.round(percentage);
      }
    },
  
    actions: {
      async fetchEquipmentById(id) {
        this.loading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get(`/ressources-hospitalieres/${id}`)
          
          // Format the response to match our expected structure
          const equipment = {
            ...response.data,
            name: response.data.type,
            serialNumber: response.data.numero_serie,
            status: response.data.etat,
            department: response.data.service,
            lastMaintenance: response.data.derniereMaintenance,
            nextCheck: response.data.prochainControle
          }
          
          return equipment
        } catch (error) {
          console.error(`Error fetching equipment ${id}:`, error)
          this.error = error.message || 'Failed to fetch equipment details'
          throw error
        } finally {
          this.loading = false
        }
      },

      async fetchEquipments() {
        this.loading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get('/ressources-hospitalieres')
          this.equipments = response.data.map(equipment => ({
            ...equipment,
            name: equipment.type,
            serialNumber: equipment.numero_serie,
            status: equipment.etat,
            department: equipment.service,
            lastMaintenance: equipment.derniereMaintenance,
            nextCheck: equipment.prochainControle
          }))
          this.error = null
        } catch (error) {
          console.error('Error fetching equipment:', error)
          this.error = error.message || 'Failed to fetch equipment'
        } finally {
          this.loading = false
        }
      },
  
      async fetchMaintenanceHistory(equipmentId) {
        this.historyLoading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get(`/ressources-hospitalieres/${equipmentId}/history`)
          this.maintenanceHistory = response.data.maintenances
          return this.maintenanceHistory
        } catch (error) {
          console.error('Error fetching maintenance history:', error)
          this.error = error.message || 'Failed to fetch maintenance history'
          throw error
        } finally {
          this.historyLoading = false
        }
      },
  
      async updateEquipment(id, data) {
        this.loading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Include technicien ID in the data
          const apiData = {
            ...data,
            technicienID: technicienId,
            derniereMaintenance: new Date().toISOString()
          }
          
          const response = await apiClient.put(`/ressources-hospitalieres/${id}`, apiData)
          
          // Update local data
          const index = this.equipments.findIndex(eq => eq._id === id)
          if (index !== -1) {
            this.equipments[index] = { 
              ...this.equipments[index], 
              ...response.data,
              lastMaintenance: response.data.derniereMaintenance
            }
          }
          
          return this.equipments[index]
        } catch (error) {
          console.error(`Error updating equipment ${id}:`, error)
          this.error = error.message || 'Failed to update equipment'
          throw error
        } finally {
          this.loading = false
        }
      },
  
      async addEquipment(data) {
        this.loading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Include technicien ID in the data
          const apiData = {
            ...data,
            technicienID: technicienId,
            derniereMaintenance: new Date().toISOString()
          }
          
          const response = await apiClient.post('/ressources-hospitalieres', apiData)
          
          // Add to local array
          const newEquipment = {
            ...response.data,
            lastMaintenance: response.data.derniereMaintenance
          }
          
          this.equipments.push(newEquipment)
          return newEquipment
        } catch (error) {
          console.error('Error adding equipment:', error)
          this.error = error.message || 'Failed to add equipment'
          throw error
        } finally {
          this.loading = false
        }
      },
       calculateAvailabilityPercentage() {
        if (!this.equipments || this.equipments.length === 0) {
          return 0;
        }
        
        // Count operational and available equipment
        const availableCount = this.equipments.filter(eq => 
          eq.status === 'operational' || eq.status === 'Fonctionnel' || 
          eq.etat === 'operational' || eq.etat === 'Fonctionnel'
        ).length;
        
        // Calculate percentage
        const percentage = (availableCount / this.equipments.length) * 100;
        
        // Return rounded percentage
        return Math.round(percentage);
      },
      async calculateEquipmentAvailability(equipmentId) {
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get(`/ressources-hospitalieres/${equipmentId}/availability`)
          console.log(`Availability data for equipment ${equipmentId}:`, response.data)
          
          return response.data
        } catch (error) {
          console.error(`Error calculating availability for equipment ${equipmentId}:`, error)
          this.error = error.message || 'Failed to calculate equipment availability'
          
          // Return a fallback object
          return {
            success: false,
            availability_percentage: 0,
            equipment_id: equipmentId
          }
        }
      },
      async fetchAverageMTBF() {
        this.metricsLoading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get('/ressources-hospitalieres/metrics/average-mtbf')
          console.log('API Response for average MTBF:', response)
          
          // Extract the data from the response
          const mtbfData = response.data
          console.log('MTBF data:', mtbfData)
          
          // Store the entire response object
          this.averageMTBF = mtbfData
          
          // Return the data for component use
          return mtbfData
        } catch (error) {
          console.error('Error fetching average MTBF:', error)
          this.error = error.message || 'Failed to fetch average MTBF'
          
          // Return a fallback object with the same structure
          return {
            success: false,
            average_mtbf_hours: 0,
            resource_count: 0,
            resources_with_maintenance: 0
          }
        } finally {
          this.metricsLoading = false
        }
      },
      async fetchMTBFForResource(resourceId) {
        this.metricsLoading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get(`/ressources-hospitalieres/metrics/mtbf/${resourceId}`)
          return response.data
        } catch (error) {
          console.error(`Error fetching MTBF for resource ${resourceId}:`, error)
          this.error = error.message || 'Failed to fetch resource MTBF'
          throw error
        } finally {
          this.metricsLoading = false
        }
      },
      async fetchAvailabilityByMonth() {
        this.metricsLoading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get('/ressources-hospitalieres/metrics/availability')
          this.availabilityByMonth = response.data
          return this.availabilityByMonth
        } catch (error) {
          console.error('Error fetching availability by month:', error)
          this.error = error.message || 'Failed to fetch availability metrics'
          throw error
        } finally {
          this.metricsLoading = false
        }
      },
      async fetchMetricsEvolution() {
        this.metricsLoading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get('/ressources-hospitalieres/metrics/evolution')
          this.metricsEvolution = response.data
          return this.metricsEvolution
        } catch (error) {
          console.error('Error fetching metrics evolution:', error)
          this.error = error.message || 'Failed to fetch metrics evolution'
          throw error
        } finally {
          this.metricsLoading = false
        }
      },
      async fetchMetricsEvolution() {
        this.metricsLoading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get('/ressources-hospitalieres/metrics/evolution')
          this.metricsEvolution = response.data
          return this.metricsEvolution
        } catch (error) {
          console.error('Error fetching metrics evolution:', error)
          this.error = error.message || 'Failed to fetch metrics evolution'
          throw error
        } finally {
          this.metricsLoading = false
        }
      },
      async calculateAvailabilityByRoom(roomNumber = null) {
        this.metricsLoading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Build URL with query parameters if roomNumber is provided
          let url = '/ressources-hospitalieres/availability/room'
          if (roomNumber) {
            url += `?room_number=${roomNumber}`
          }
          
          const response = await apiClient.get(url)
          this.availabilityByRoom = response.data
          return this.availabilityByRoom
        } catch (error) {
          console.error('Error calculating availability by room:', error)
          this.error = error.message || 'Failed to calculate availability by room'
          
          // Return a fallback object
          return {
            success: false,
            message: 'Failed to calculate availability by room',
            data: []
          }
        } finally {
          this.metricsLoading = false
        }
      },
      async calculateAllEquipmentAvailability() {
        this.metricsLoading = true
        try {
          // Get authentication tokens
          const token = localStorage.getItem('Token_TECHNICIEN')
          const technicienId = localStorage.getItem('role_id')
          
          if (!token || !technicienId) {
            throw new Error('Authentication required')
          }
          
          // Set auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get('/ressources-hospitalieres/availability/all')
          this.allEquipmentAvailability = response.data
          
          // If the response includes a global availability percentage, store it
          if (response.data && response.data.global_availability_percentage !== undefined) {
            this.globalAvailability = response.data.global_availability_percentage
          }
          
          return this.allEquipmentAvailability
        } catch (error) {
          console.error('Error calculating all equipment availability:', error)
          this.error = error.message || 'Failed to calculate all equipment availability'
          
          // Return a fallback object
          return {
            success: false,
            message: 'Failed to calculate all equipment availability',
            global_availability_percentage: 0,
            equipment_availability: []
          }
        } finally {
          this.metricsLoading = false
        }
      },
      
      // Helper method to fetch all metrics at once
      async fetchAllMetrics() {
        this.metricsLoading = true
        try {
          await Promise.all([
            this.fetchAverageMTBF(),
            this.fetchAvailabilityByMonth(),
            this.fetchMetricsEvolution(),
            this.calculateAvailabilityByRoom(),
            this.calculateAllEquipmentAvailability()
          ])
          return {
            averageMTBF: this.averageMTBF,
            availabilityByMonth: this.availabilityByMonth,
            metricsEvolution: this.metricsEvolution,
            availabilityByRoom: this.availabilityByRoom,
            allEquipmentAvailability: this.allEquipmentAvailability
          }
        } catch (error) {
          console.error('Error fetching all metrics:', error)
          this.error = error.message || 'Failed to fetch metrics'
          throw error
        } finally {
          this.metricsLoading = false
        }
      },
    },
   

  })