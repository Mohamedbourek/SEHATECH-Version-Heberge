<template>
  <div class="container mx-auto px-4 py-6">
    <!-- En-tête -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Monitoring des équipements
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Surveillance en temps réel des performances et états
      </p>
    </div>

    <!-- Navigation des sections -->
    <div class="flex space-x-4 mb-6">
      <button 
        class="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        :class="activeSection === 'equipment' ? 
          'bg-primary-500 text-white' : 
          'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'"
        @click="activeSection = 'equipment'"
      >
        <Monitor class="w-4 h-4 inline-block mr-2" />
        Équipements
      </button>
      <button 
        class="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        :class="activeSection === 'sensors' ? 
          'bg-primary-500 text-white' : 
          'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'"
        @click="activeSection = 'sensors'"
      >
        <Gauge class="w-4 h-4 inline-block mr-2" />
        Capteurs
      </button>
    </div>

    <!-- Section Équipements -->
    <div v-if="activeSection === 'equipment'">
      <!-- Statistiques globales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Disponibilité globale"
          :value="isLoadingAvailability ? 'Chargement...' : `${averageAvailability}%`"
          icon="Activity"
          :color="getAvailabilityColor(averageAvailability)"
          :trend="'stable'"
          :percentage="Number(averageAvailability)"
          :loading="isLoadingAvailability"
        />
        <StatCard
          title="MTBF moyen"
          :value="isLoadingMTBF ? 'Chargement...' : `${globalMTBF}h`"
          icon="Clock"
          color="blue"
          :trend="'stable'"
          :percentage="Number(globalMTBF)"
          :loading="isLoadingMTBF"
        />
        <StatCard
          title="Équipements actifs"
          :value="activeEquipments"
          icon="Power"
          color="green"
        />
        <StatCard
          title="Alertes critiques"
          :value="criticalAlerts"
          icon="AlertTriangle"
          color="red"
        />
      </div>

      <!-- Graphiques de performance -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Disponibilité totale -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity class="w-5 h-5 mr-2 text-primary-500" />
            Évolution de la disponibilité
          </h2>
          <div class="h-64 relative">
            <div v-if="isLoadingAvailability" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
            <template v-if="!isLoadingAvailability && availabilityTrend && availabilityTrend.length > 0">
              <AvailabilityChart 
                :data="availabilityTrend" 
                :loading="isLoadingAvailability"
                :year="availabilityYear"
              />
            </template>
            <div v-else-if="!isLoadingAvailability" class="flex items-center justify-center h-full">
              <p class="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
            </div>
          </div>
        </div>

        <!-- Tendances MTBF -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock class="w-5 h-5 mr-2 text-primary-500" />
            Tendances MTBF
          </h2>
          <div class="h-64 relative">
            <div v-if="isLoadingMTBF" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
            <template v-if="!isLoadingMTBF && mtbfTrends && mtbfTrends.length > 0">
              <MTBFChart 
                :data="mtbfTrends" 
                :year="metricsYear"
              />
            </template>
            <div v-else-if="!isLoadingMTBF" class="flex items-center justify-center h-full">
              <p class="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des équipements en temps réel -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              État des équipements en temps réel
            </h2>
            <div class="flex items-center space-x-2">
              <select v-model="selectedStatus" class="form-select">
                <option value="all">Tous les états</option>
                <option value="Opérationnel">Opérationnels</option>
                <option value="Hors service">Hors service</option>
                <option value="Fonctionnel">Fonctionnel</option>
                <option value="En maintenance">En maintenance</option>
                <option value="available">Disponibles</option>
                <option value="error">En panne</option>
              </select>
              <button 
                class="btn btn-outline"
                @click="refreshData"
              >
                <RefreshCw class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="table-header">Équipement</th>
                <th class="table-header">État</th>
                <th class="table-header">Disponibilité</th>
                <th class="table-header">Dernier contrôle</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr 
                v-for="equipment in filteredEquipments" 
                :key="equipment.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="table-cell">
                  <div class="flex items-center">
                    <div 
                      class="w-2 h-2 rounded-full mr-3"
                      :class="getStatusColor(equipment.etat)"
                    ></div>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ equipment.name }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ equipment.serialNumber }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="table-cell">
                  <span 
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getStatusBadgeClass(equipment.etat)"
                  >
                    {{ statusLabels[equipment.etat] }}
                  </span>
                </td>
                <td class="table-cell">
                  <div class="flex flex-col space-y-2">
                    <div class="flex items-center">
                      <div class="w-16 mr-2">
                        {{ equipmentStore.getAvailabilityPercentage(equipment._id)  }} %
                      </div>
                      <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          class="h-full rounded-full"
                          :class="getAvailabilityBarColor(equipmentStore.getAvailabilityPercentage(equipment._id) || 0)"
                          :style="{ width: `${equipmentStore.getAvailabilityPercentage(equipment._id) || 0}%` }"
                        ></div>
                      </div>
                    </div>
                    
                  </div>
                </td>
                <td class="table-cell">
                  {{ formatDate(equipment.derniereMaintenance) }}
                </td>
                <td class="table-cell">
                  <div class="flex items-center space-x-2">
                    <button 
                      class="btn-icon text-blue-500 hover:text-blue-600"
                      @click="viewDetails(equipment)"
                      title="Voir les détails"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button 
                      class="btn-icon text-indigo-500 hover:text-indigo-600"
                      @click="showHistory(equipment)"
                      title="Historique"
                      >
                      <History class="w-4 h-4" />
                  </button>
                    <button 
                      v-if="equipment.alerts?.length > 0"
                      class="btn-icon text-red-500 hover:text-red-600"
                      @click="showAlerts(equipment)"
                      title="Voir les alertes"
                    >
                      <AlertTriangle class="w-4 h-4" />
                      <span class="absolute -top-1 -right-1 h-4 w-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                        {{ equipment.alerts.length }}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal des alertes -->
      <Transition
        enter-active-class="ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showAlertsModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div class="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    @click="closeAlertsModal"
                    class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X class="h-6 w-6" />
                  </button>
                </div>
                <div class="sm:flex sm:items-start">
                  <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Alertes - {{ selectedEquipment?.name }}
                    </h3>
                    <div class="mt-4 space-y-3">
                      <div 
                        v-for="alert in selectedEquipment?.alerts"
                        :key="alert.id"
                        class="p-3 rounded-lg"
                        :class="{
                          'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200': alert.severity === 'critical',
                          'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200': alert.severity === 'warning',
                          'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200': alert.severity === 'info'
                        }"
                      >
                        {{ alert.message }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Section Capteurs -->
    <div v-if="activeSection === 'sensors'">
      <ArduinoSensorAdapter>
        <IoTDashboard />
      </ArduinoSensorAdapter>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEquipmentStore } from '@/stores/equipment'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Activity,
  Clock,
  Power,
  AlertTriangle,
  RefreshCw,
  Eye,
  History,
  X,
  Monitor,
  Gauge
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import AvailabilityChart from '@/components/charts/AvailabilityChart.vue'
import MTBFChart from '@/components/charts/mtbfchart.vue'
import IoTDashboard from '@/components/monitoring/IoTDashboard.vue'
import ArduinoSensorAdapter from '@/components/monitoring/ArduinoSensorAdapter.vue'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const selectedStatus = ref('all')
const showAlertsModal = ref(false)
const averageMTBF = ref(0)
const selectedEquipment = ref(null)
const activeSection = ref('sensors')
const metricsYear = ref('')
let refreshInterval = null

// Données statiques pour la démo
const departments = [
  { id: 'cardiology', name: 'Cardiologie' },
  { id: 'radiology', name: 'Radiologie' },
  { id: 'laboratory', name: 'Laboratoire' }
]

const statusLabels = {
  Fonctionnel: 'Fonctionnel',
  'Hors service': 'Hors service',
  'En maintenance': 'En maintenance',
  operational: 'Opérationnel',
  maintenance: 'En maintenance',
  available: 'Disponible',
  error: 'En panne'
}

// Computed properties
const filteredEquipments = computed(() => {
  let equipments = equipmentStore.equipments
  if (selectedStatus.value !== 'all') {
    equipments = equipments.filter(eq => eq.etat === selectedStatus.value)
  }
  return equipments
})
const averageAvailability = ref(0)
const isLoadingAvailability = ref(false)
const globalMTBF = ref(0)
const isLoadingMTBF = ref(false)
const availabilityYear = ref('')
const isLoadingAvailabilityTrend = ref(false)

// Données des capteurs récupérées via API
const sensorData = ref({
  co2: {
    value: 0,
    status: 'normal'
  },
  temperature: {
    value: 0,
    status: 'normal'
  },
  flame: {
    detected: false,
    status: 'normal'
  },
  motion: {
    detected: false,
    status: 'normal'
  },
  sound: {
    value: 0,
    status: 'normal'
  }
})

// Données des capteurs récupérées via API
const tempSensors = ref([])
const humiditySensors = ref([])
const cameras = ref([])
const vibrationData = ref([])

// Computed properties pour les statistiques
const averageTemp = computed(() => {
  if (tempSensors.value.length === 0) return '0.0';
  const total = tempSensors.value.reduce((sum, sensor) => sum + sensor.value, 0)
  return (total / tempSensors.value.length).toFixed(1)
})

const averageHumidity = computed(() => {
  if (humiditySensors.value.length === 0) return 0;
  const total = humiditySensors.value.reduce((sum, sensor) => sum + sensor.value, 0)
  return Math.round(total / humiditySensors.value.length)
})

const activeSensorAlerts = computed(() => {
  return tempSensors.value.filter(s => s.status !== 'normal').length +
         humiditySensors.value.filter(s => s.status !== 'normal').length
})

async function updateAvailabilityPercentage() {
  isLoadingAvailability.value = true
  try {
    const percentage = await equipmentStore.calculateAvailabilityPercentage()
    averageAvailability.value = percentage
  } catch (error) {
    console.error('Error getting availability percentage:', error)
  } finally {
    isLoadingAvailability.value = false
  }
}

async function fetchMTBFData() {
  isLoadingMTBF.value = true;
  try {
    // Récupération des données MTBF moyennes via l'API
    const mtbfData = await equipmentStore.fetchAverageMTBF();
    
    // Extraction des valeurs pertinentes
    if (mtbfData && mtbfData.average_mtbf_hours) {
      globalMTBF.value = mtbfData.average_mtbf_hours;
      averageMTBF.value = mtbfData.average_mtbf_hours;
    } else {
      // Valeurs par défaut si les données ne sont pas disponibles
      globalMTBF.value = 0;
      averageMTBF.value = 0;
    }
  } catch (error) {
    console.error('Error calculating MTBF:', error);
    // Valeurs par défaut en cas d'erreur
    globalMTBF.value = 0;
    averageMTBF.value = 0;
  } finally {
    isLoadingMTBF.value = false;
  }
}

const activeEquipments = computed(() => {
  return filteredEquipments.value.filter(eq => eq.etat === 'operational' || eq.etat === 'Fonctionnel' ).length
})

const criticalAlerts = computed(() => {
  return filteredEquipments.value.reduce((count, eq) => {
    return count + (eq.alerts?.filter(alert => alert.severity === 'critical').length || 0)
  }, 0)
})

// Données pour les graphiques
const departmentAvailability = computed(() => {
  const data = {}
  departments.forEach(dept => {
    const deptEquipments = filteredEquipments.value.filter(eq => eq.department === dept.id)
    if (deptEquipments.length > 0) {
      const avgAvailability = Math.round(
        deptEquipments.reduce((sum, eq) => sum + eq.availability, 0) / deptEquipments.length
      )
      data[dept.name] = avgAvailability
    }
  })
  return data
})

const mtbfTrends = computed(() => {
  // If we have metrics evolution data from the store, use it
  if (equipmentStore.metricsEvolution && 
      equipmentStore.metricsEvolution.metrics_evolution && 
      Array.isArray(equipmentStore.metricsEvolution.metrics_evolution) &&
      equipmentStore.metricsEvolution.metrics_evolution.length > 0) {
    
    return equipmentStore.metricsEvolution.metrics_evolution.map(item => ({
      date: item.period ? item.period.substring(0, 3) : '', // Use first 3 letters of month name
      value: Math.round(item.mtbf || 0), // Round the MTBF value
      mttr: Math.round(item.mttr || 0),
      failures: item.failure_count || 0
    }));
  }
  
  // Fallback to simulated data if no metrics evolution data is available
  const dates = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2025, i, 1)
    return format(date, 'MMM')
  })

  return dates.map(date => ({
    date,
    value: Math.round(600 + Math.random() * 200) // Values between 600 and 800
  }))
})

const availabilityTrend = computed(() => {
  // If we have historical data from the store, use it
  if (equipmentStore.availabilityByMonth && 
      equipmentStore.availabilityByMonth.monthly_availability && 
      Array.isArray(equipmentStore.availabilityByMonth.monthly_availability) &&
      equipmentStore.availabilityByMonth.monthly_availability.length > 0) {
    
    return equipmentStore.availabilityByMonth.monthly_availability.map(item => ({
      date: item.month ? item.month.substring(0, 3) : '', // Use first 3 letters of month name
      value: item.availability_percentage || 0,
      effectiveValue: item.effective_availability_percentage || 0,
      total: item.total_resources || 0,
      available: item.available_resources || 0,
      maintenance: item.maintenance_state_resources || 0
    }));
  }
  
  // Fallback to simulated data if no history is available
  const dates = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2023, i, 1)
    return format(date, 'MMM')
  })

  return dates.map(date => ({
    date,
    value: Math.round(85 + Math.random() * 10), // Values between 85 and 95
    effectiveValue: Math.round(70 + Math.random() * 10) // Values between 70 and 80
  }))
})

async function fetchMetricsEvolution() {
  try {
    await equipmentStore.fetchPerformanceMetrics();
  } catch (error) {
    console.error('Error fetching metrics evolution:', error);
  }
}

async function fetchAvailabilityByMonth() {
  isLoadingAvailability.value = true
  try {
    if (typeof equipmentStore.fetchAvailabilityByMonth === 'function') {
      await equipmentStore.fetchAvailabilityByMonth()
      if (equipmentStore.availabilityByMonth && equipmentStore.availabilityByMonth.year) {
        availabilityYear.value = equipmentStore.availabilityByMonth.year
      }
    } else {
      console.warn('fetchAvailabilityByMonth function not available in store')
      // Initialize with empty data to prevent errors
      equipmentStore.availabilityByMonth = {
        year: new Date().getFullYear().toString(),
        monthly_availability: []
      }
    }
  } catch (error) {
    console.error('Error fetching availability by month:', error)
    // Reset data to ensure we don't have partial/corrupted data
    equipmentStore.availabilityByMonth = {
      year: new Date().getFullYear().toString(),
      monthly_availability: []
    }
  } finally {
    isLoadingAvailability.value = false
  }
}

// Méthodes utilitaires
function getStatusColor(status) {
  const colors = {
    operational: 'bg-green-500',
    Fonctionnel: 'bg-green-500',
    'En maintenance': 'bg-yellow-500',
    maintenance: 'bg-yellow-500',
    'Hors service': 'bg-red-500',
    'En panne': 'bg-red-500',
    unknown: 'bg-gray-500'
  }
  return colors[status] || 'bg-gray-500'
}

function getStatusBadgeClass(status) {
  const classes = {
    operational: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Fonctionnel: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'En maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    available: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
   'Hors service':'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'En panne': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  }
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
}

function getAvailabilityBarColor(availability) {
  if (availability >= 90) return 'bg-green-500'
  if (availability >= 60) return 'bg-yellow-500'
  if(availability <= 50) return 'bg-red-500'
}

function getAvailabilityColor(availability) {
  if (availability >= 90) return 'green'
  if (availability >= 60) return 'yellow'
  if(availability <= 50) return 'red'
}

function getDepartmentName(id) {
  return departments.find(d => d.id === id)?.name || id
}

function formatDate(date) {
  if (!date) return 'Non disponible'
  try {
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

// Fonction pour récupérer les équipements depuis le store
async function fetchEquipments() {
  try {
    await equipmentStore.fetchEquipments();
      } catch (error) {
    console.error('Error fetching equipment data:', error);
  }
}

// Actions
async function refreshData() {
  try {
    await Promise.all([
      fetchEquipments(),
      updateAvailabilityPercentage(),
      fetchMTBFData(),
      fetchAvailabilityByMonth(),
      fetchMetricsEvolution()
    ]);
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
}

function viewDetails(equipment) {
  if (!equipment || (!equipment._id && !equipment.id)) {
    console.error('Equipment data is missing or invalid', equipment);
    return; // Exit early if equipment is invalid
  }
  const id = equipment._id || equipment.id;
  router.push({
    name: 'equipment-details',
    params: { id: id.toString() }
  })
}

function showHistory(equipment) {
  if (!equipment || (!equipment._id && !equipment.id)) {
    console.error('Equipment data is missing or invalid', equipment);
    return; // Exit early if equipment is invalid
  }
  const id = equipment._id || equipment.id;
  router.push({
    name: 'equipment-history',
    params: { id: id.toString() }
  })
}

function showAlerts(equipment) {
  selectedEquipment.value = equipment
  showAlertsModal.value = true
}

function closeAlertsModal() {
  showAlertsModal.value = false
  selectedEquipment.value = null
}

// Initialisation
onMounted(async () => {
  await refreshData();
  
  // Configurer le rafraîchissement automatique
  refreshInterval = setInterval(refreshData, 60000); // Toutes les 60 secondes
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script> 

<style scoped>
.form-select {
  @apply block rounded-md border-gray-300 dark:border-gray-600 shadow-sm
         focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:text-white;
}

.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400;
}

.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100;
}

.btn {
  @apply px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200;
}

.btn-outline {
  @apply border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-700;
}

.btn-ghost {
  @apply text-gray-500 hover:text-gray-700 dark:text-gray-400 
         dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md;
}

.btn-icon {
  @apply p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
         dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800
         transition-colors duration-200;
}
</style> 