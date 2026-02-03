<template>
  <div class="dashboard p-6">
    <header class="mb-8">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord technique</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ currentDateTime }}</p>
        </div>
        <div class="flex items-center gap-4">
          <button 
            class="btn-refresh"
            :class="{ 'animate-spin': isRefreshing }"
            @click="refreshData"
          >
            <RefreshCw class="w-5 h-5" />
          </button>
          <button 
            @click="toggleLiveMonitoring" 
            class="live-monitoring-btn"
            :class="{ 'active': isLiveMonitoringActive }"
          >
            <Activity class="w-5 h-5" />
            <span class="hidden lg:inline ml-2">Surveillance en direct</span>
          </button>
        </div>
      </div>

      <!-- Statistiques principales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Équipements actifs"
          :value="stats.activeEquipments"
          icon="Monitor"
          :trend="stats.equipmentsTrend"
          :percentage="stats.equipmentsGrowth"
          color="blue"
          :loading="equipmentStore.loading"
        />
        <StatCard
          title="Alertes actives"
          :value="stats.activeAlerts"
          icon="AlertTriangle"
          :trend="stats.alertsTrend"
          :percentage="stats.alertsGrowth"
          color="red"
          :loading="equipmentStore.loading"
        />
        <StatCard
          title="Maintenance prévue"
          :value="stats.plannedMaintenance"
          icon="Tool"
          :trend="stats.maintenanceTrend"
          :percentage="stats.maintenanceGrowth"
          color="yellow"
          :loading="equipmentStore.loading"
        />
        <StatCard
          title="Performance globale"
          :value="`${stats.globalPerformance}%`"
          icon="Activity"
          :trend="stats.performanceTrend"
          :percentage="stats.performanceGrowth"
          color="green"
          :loading="equipmentStore.loading"
        />
      </div>
    </header>

    <!-- Contenu principal -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Carte des équipements -->
      <DashboardCard title="Localisation des équipements" :loading="equipmentStore.loading">
        <div v-if="equipments.length === 0 && !equipmentStore.loading" class="text-center py-8 text-gray-500">
          Aucun équipement disponible
        </div>
        <EquipmentMap v-else :equipments="equipments" />
      </DashboardCard>

      <!-- Alertes récentes -->
      <DashboardCard title="Alertes récentes" :loading="equipmentStore.loading">
        <div v-if="recentAlerts.length === 0 && !equipmentStore.loading" class="text-center py-8 text-gray-500">
          Aucune alerte récente
        </div>
        <div v-else class="space-y-4">
          <AlertItem
            v-for="alert in recentAlerts"
            :key="alert.id"
            v-bind="alert"
            @action="handleAlert"
          />
        </div>
      </DashboardCard>

      <!-- Graphique de performance -->
      <DashboardCard title="Performance des équipements" :loading="equipmentStore.loading">
        <div v-if="performanceData.labels.length === 0 && !equipmentStore.loading" class="text-center py-8 text-gray-500">
          Aucune donnée de performance disponible
        </div>
        <PerformanceChart v-else :data="performanceData" />
      </DashboardCard>

      <!-- Maintenance planifiée -->
      <DashboardCard title="Maintenance planifiée" :loading="equipmentStore.loading || equipmentStore.historyLoading">
        <div v-if="maintenanceSchedules.length === 0 && !equipmentStore.loading" class="text-center py-8 text-gray-500">
          Aucune maintenance planifiée
        </div>
        <MaintenanceSchedule v-else :schedules="maintenanceSchedules" />
      </DashboardCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'
import { useEquipmentStore } from '@/stores/equipment'
import { fr } from 'date-fns/locale'
import {
  Activity, AlertTriangle, Monitor, Tool,
  RefreshCw, TrendingUp, TrendingDown
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import DashboardCard from '@/components/dashboard/DashboardCard.vue'
import AlertItem from '@/components/dashboard/AlertItem.vue'
import EquipmentMap from '@/components/equipment/EquipmentMap.vue'
import PerformanceChart from '@/components/charts/PerformanceChart.vue'
import MaintenanceSchedule from '@/components/maintenance/MaintenanceSchedule.vue'

const currentDateTime = ref('')
const isRefreshing = ref(false)
const isLiveMonitoringActive = ref(true)
const equipmentStore = useEquipmentStore()
let timer = null

// Store previous stats to calculate trends
const previousStats = ref({
  activeEquipments: 0,
  activeAlerts: 0,
  plannedMaintenance: 0,
  globalPerformance: 0
})

// Computed stats based on equipment store data
const stats = computed(() => {
  const equipments = equipmentStore.equipments || []
  
  // Count active equipments (operational or available)
  const activeEquipments = equipments.filter(eq => 
    eq.status === 'operational' || eq.status === 'available' || 
    eq.etat === 'operational' || eq.etat === 'available'
  ).length
  
  // Count alerts
  const activeAlerts = equipments.reduce((count, eq) => 
    count + (eq.alerts?.length || 0), 0)
  
  // Count planned maintenance
  const plannedMaintenance = equipments.filter(eq => 
    eq.status === 'maintenance' || eq.etat === 'maintenance'
  ).length
  
  // Get global performance (availability)
  const globalPerformance = equipmentStore.getGlobalAvailabilityPercentage || 0
  
  // Store previous values for comparison
  const prevStats = previousStats.value
  
  // Calculate trends based on previous values
  const equipmentsTrend = activeEquipments > prevStats.activeEquipments ? 'up' : 
                          activeEquipments < prevStats.activeEquipments ? 'down' : 'stable'
  
  const alertsTrend = activeAlerts > prevStats.activeAlerts ? 'up' : 
                      activeAlerts < prevStats.activeAlerts ? 'down' : 'stable'
  
  const maintenanceTrend = plannedMaintenance > prevStats.plannedMaintenance ? 'up' : 
                           plannedMaintenance < prevStats.plannedMaintenance ? 'down' : 'stable'
  
  const performanceTrend = globalPerformance > prevStats.globalPerformance ? 'up' : 
                           globalPerformance < prevStats.globalPerformance ? 'down' : 'stable'
  
  // Calculate percentage changes
  const equipmentsGrowth = prevStats.activeEquipments ? 
    Math.round(((activeEquipments - prevStats.activeEquipments) / prevStats.activeEquipments) * 100) : 0
  
  const alertsGrowth = prevStats.activeAlerts ? 
    Math.round(((activeAlerts - prevStats.activeAlerts) / prevStats.activeAlerts) * 100) : 0
  
  const maintenanceGrowth = prevStats.plannedMaintenance ? 
    Math.round(((plannedMaintenance - prevStats.plannedMaintenance) / prevStats.plannedMaintenance) * 100) : 0
  
  const performanceGrowth = prevStats.globalPerformance ? 
    Math.round(((globalPerformance - prevStats.globalPerformance) / prevStats.globalPerformance) * 100) : 0
  
  // Update previous stats for next comparison
  previousStats.value = {
    activeEquipments,
    activeAlerts,
    plannedMaintenance,
    globalPerformance
  }
  
  return {
    activeEquipments,
    activeAlerts,
    plannedMaintenance,
    globalPerformance,
    equipmentsTrend,
    alertsTrend,
    maintenanceTrend,
    performanceTrend,
    equipmentsGrowth,
    alertsGrowth,
    maintenanceGrowth,
    performanceGrowth
  }
})

// Computed equipments for the map
const equipments = computed(() => {
  return equipmentStore.equipments.map(eq => ({
    id: eq._id || eq.id,
    name: eq.name || eq.type,
    status: eq.status || eq.etat,
    location: eq.location || eq.emplacement || 'Non spécifié',
    department: eq.department || eq.service || 'Non spécifié',
    coordinates: eq.coordinates || [Math.random() * 100, Math.random() * 100] // Fallback random coordinates
  }))
})

// Recent alerts from equipment
const recentAlerts = computed(() => {
  const allAlerts = []
  
  equipmentStore.equipments.forEach(eq => {
    if (eq.alerts && eq.alerts.length) {
      eq.alerts.forEach(alert => {
        allAlerts.push({
          id: alert.id || `${eq._id || eq.id}-${Math.random()}`,
          equipmentId: eq._id || eq.id,
          equipmentName: eq.name || eq.type,
          severity: alert.severity || 'warning',
          message: alert.message,
          timestamp: alert.timestamp || new Date().toISOString(),
          status: alert.status || 'active'
        })
      })
    }
  })
  
  // Sort by timestamp (newest first) and take the first 5
  return allAlerts
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)
})

// Performance data for the chart
const performanceData = computed(() => {
  // Get equipment availability data
  const equipmentData = equipmentStore.equipments.map(eq => ({
    name: eq.name || eq.type,
    value: equipmentStore.getAvailabilityPercentage(eq._id || eq.id)
  }))
  
  // Sort by availability (highest first)
  equipmentData.sort((a, b) => b.value - a.value)
  
  return {
    labels: equipmentData.map(item => item.name),
    values: equipmentData.map(item => item.value),
    average: stats.value.globalPerformance
  }
})

// Maintenance schedules
const maintenanceSchedules = computed(() => {
  return equipmentStore.equipments
    .filter(eq => eq.nextCheck || eq.prochainControle)
    .map(eq => ({
      id: eq._id || eq.id,
      equipmentName: eq.name || eq.type,
      date: eq.nextCheck || eq.prochainControle,
      type: 'Contrôle périodique',
      technician: eq.technicien || 'Non assigné'
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5) // Show only the next 5 scheduled maintenances
})

// Fonctions
const updateDateTime = () => {
  currentDateTime.value = format(new Date(), 'PPpp', { locale: fr })
}

const refreshData = async () => {
  isRefreshing.value = true
  try {
    // Fetch equipment data from the store
    await equipmentStore.fetchEquipments()
    
    // Force update of computed properties
    const timestamp = new Date().getTime()
    forceUpdate.value = timestamp
    
    console.log(`Data refreshed at ${new Date().toLocaleTimeString()}`)
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    isRefreshing.value = false
  }
}

const toggleLiveMonitoring = () => {
  isLiveMonitoringActive.value = !isLiveMonitoringActive.value
  
  if (isLiveMonitoringActive.value) {
    // Start auto-refresh every 30 seconds
    timer = setInterval(refreshData, 30000)
  } else {
    // Stop auto-refresh
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

const handleAlert = (alertId) => {
  // Mark alert as handled
  equipmentStore.equipments.forEach(eq => {
    if (eq.alerts) {
      const alertIndex = eq.alerts.findIndex(a => a.id === alertId)
      if (alertIndex !== -1) {
        eq.alerts[alertIndex].status = 'handled'
      }
    }
  })
}

// Lifecycle hooks
onMounted(() => {
  updateDateTime()
  const dateTimer = setInterval(updateDateTime, 60000)
  
  // Initial data load
  refreshData()
  
  // Start auto-refresh if live monitoring is active
  if (isLiveMonitoringActive.value) {
    timer = setInterval(refreshData, 30000)
  }
  
  onBeforeUnmount(() => {
    if (dateTimer) clearInterval(dateTimer)
    if (timer) clearInterval(timer)
  })
})
</script>

<style scoped>
.dashboard {
  @apply bg-gray-50 dark:bg-gray-900 min-h-screen;
}

.btn-refresh {
  @apply p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
         transition-colors duration-200;
}

.live-monitoring-btn {
  @apply flex items-center px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200;
}

.live-monitoring-btn.active {
  @apply bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400;
}
</style>