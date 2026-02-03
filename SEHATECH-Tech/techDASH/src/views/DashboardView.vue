<template
v-if="!isLoadingRoomAvailability && roomAvailabilityData.length > 0"
>
  <div class="container mx-auto px-4 py-6">
    <!-- En-tête -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Tableau de bord
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Vue d'ensemble du parc d'équipements et des performances
      </p>
    </div>

    <!-- Stats rapides -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <StatCard
        title="Disponibilité globale"
        :value="`${globalAvailabilityPercentage}%`"
        icon="Activity"
        :color="getAvailabilityColor(globalAvailabilityPercentage)"
        :trend="availabilityTrendComputed"
        :percentage="availabilityChangeComputed"
      />
      <StatCard
        title="Équipements en service"
        :value="activeEquipments"
        icon="Power"
        color="green"
        :trend="equipmentTrend"
        :percentage="equipmentChange"
      />
      <StatCard
        title="Alertes actives"
        :value="activeAlerts"
        icon="AlertTriangle"
        color="red"
        :trend="alertsTrend"
        :percentage="alertsChange"
      />
      <StatCard
        title="Maintenances prévues"
        :value="scheduledMaintenance"
        icon="Wrench"
        color="blue"
      />
    </div>

    <!-- Graphiques principaux -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Disponibilité par zone -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-medium text-gray-900 dark:text-white">
      Disponibilité par salle
    </h2>
    <div v-if="isLoadingRoomAvailability" class="flex items-center">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
      <span class="text-xs text-gray-500">Chargement...</span>
    </div>
  </div>
  <div class="h-64 relative">
    <div v-if="isLoadingRoomAvailability" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
    <template v-if="!isLoadingRoomAvailability && roomAvailabilityData.length > 0">
      <DepartmentAvailabilityChart 
        :data="roomAvailabilityData" 
        :loading="isLoadingRoomAvailability"
      />
    </template>
    <div v-else-if="!isLoadingRoomAvailability" class="flex items-center justify-center h-full">
      <p class="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
    </div>
  </div>
</div>

      <!-- MTBF et MTTR -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            MTBF et MTTR
          </h2>
          <select v-model="reliabilityPeriod" class="form-select w-32">
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
        </div>
        <div class="h-64 relative">
          <div v-if="isLoadingReliability" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
          <template v-if="!isLoadingReliability && reliabilityData.mtbf && reliabilityData.mtbf.length > 0">
            <ReliabilityChart 
              :data="reliabilityData" 
              :year="metricsYear"
            />
          </template>
          <div v-else-if="!isLoadingReliability" class="flex items-center justify-center h-full">
            <p class="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sections d'informations -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Alertes récentes -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Alertes récentes
            </h2>
            <router-link 
              to="/alerts"
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Voir tout
            </router-link>
          </div>
        </div>
        <div class="p-6">
          <div v-if="notificationsStore.loading" class="flex justify-center items-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            <span class="ml-2 text-sm text-gray-500">Chargement...</span>
          </div>
          <div v-else-if="notificationsStore.notifications.length === 0" class="text-center py-4">
            <p class="text-gray-500 dark:text-gray-400">Aucune alerte récente</p>
          </div>
          <div v-else class="space-y-4">
            <div 
              v-for="notification in notificationsStore.notifications.slice(0, 3)" 
              :key="notification._id"
              class="flex items-start space-x-3"
            >
              <div 
                class="flex-shrink-0 w-2 h-2 mt-2 rounded-full"
                :class="{
                  'bg-red-500': notification.priorite === 'haute',
                  'bg-yellow-500': notification.priorite === 'moyenne',
                  'bg-blue-500': notification.priorite === 'basse' || !notification.priorite
                }"
              ></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ notification.type || 'Notification' }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ notification.message || notification.contenu }}
                </p>
                <p class="mt-1 text-xs text-gray-400">
                  {{ formatDate(notification.created_at || notification.date) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Maintenances à venir -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Maintenances à venir
            </h2>
            <button 
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              @click="showMaintenanceSchedule"
            >
              Planifier
            </button>
          </div>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div 
              v-for="maintenance in upcomingMaintenance" 
              :key="maintenance.id"
              class="flex items-start space-x-3"
            >
              <div class="flex-shrink-0">
                <Calendar class="w-5 h-5 text-gray-400" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ maintenance.equipment.name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ maintenance.type }}
                </p>
                <p class="mt-1 text-xs text-gray-400">
                  Prévu le {{ formatDate(maintenance.date) }}
                </p>
              </div>
              <div class="flex-shrink-0">
                <span 
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getMaintenanceStatusClass(maintenance.status)"
                >
                  {{ maintenance.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>

    <!-- Carte des équipements -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          Répartition des équipements
        </h2>
        <div class="flex items-center space-x-4">
          <div v-if="isLoadingEquipments" class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
            <span class="text-xs text-gray-500">Chargement...</span>
          </div>
          
          <div class="flex items-center space-x-2">
            <span 
              v-for="status in equipmentStatuses" 
              :key="status.value"
              class="flex items-center text-sm"
            >
              <span 
                class="w-3 h-3 rounded-full mr-1"
                :class="getStatusColor(status.value)"
              ></span>
              {{ status.label }}
            </span>
          </div>
        </div>
      </div>
      <div class="relative">
        <div v-if="isLoadingEquipments" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
        <EquipmentMap 
          :floor="selectedFloor"
          :equipments="mappedEquipments"
          @equipment-click="viewEquipment"
        />
      </div>
    </div>
  </div>

  <!-- Modal de planification de maintenance -->
  <MaintenanceScheduleModal
    v-if="showMaintenanceModal"
    @close="showMaintenanceModal = false"
    @save="handleScheduleMaintenance"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Activity,
  Power,
  AlertTriangle,
  Wrench,
  Calendar,
  Eye,
  Clock
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import DepartmentAvailabilityChart from '@/components/charts/departmentavailabilitychart.vue'
import ReliabilityChart from '@/components/charts/ReliabilityChart.vue'
import EquipmentMap from '@/components/equipment/EquipmentMap.vue'
import MaintenanceScheduleModal from '@/components/maintenance/MaintenanceScheduleModal.vue'
import { useEquipmentStore } from '@/stores/equipment'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useNotificationsStore } from '@/stores/notifications'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const maintenanceStore = useMaintenanceStore()
const notificationsStore = useNotificationsStore() 

// États
const reliabilityPeriod = ref('year')
const selectedFloor = ref('all')
const showMaintenanceModal = ref(false)
const isLoadingReliability = ref(false)
const isLoadingRoomAvailability = ref(false)
const isLoadingEquipments = ref(false)
const metricsYear = ref('')


// Données simulées
const globalAvailability  = ref()
const availabilityTrend = 'up'
const availabilityChange = 2

const equipmentTrend = 'up'
const equipmentChange = 5

const activeAlerts = computed(() => {
  return notificationsStore.unreadCount || 0;
});
const alertsTrend = 'down'
const alertsChange = 15



// Données des graphiques
const zoneAvailability = ref([
  /*
  {
    name: 'Bloc opératoire 1',
    value: 98,
    trend: 'stable'
  },
  {
    name: 'Bloc opératoire 2',
    value: 95,
    trend: 'down'
  },
  {
    name: 'Chambre USI 101',
    value: 92,
    trend: 'up'
  },
  {
    name: 'Chambre USI 102',
    value: 97,
    trend: 'stable'
  },
  {
    name: 'Chambre 201',
    value: 94,
    trend: 'down'
  },
  {
    name: 'Chambre 202',
    value: 96,
    trend: 'up'
  }*/
])

const globalAvailabilityPercentage = computed(() => {
  if (equipmentStore.globalAvailability !== undefined) {
    return Math.round(equipmentStore.globalAvailability);
  }
  return globalAvailability.value || 0; // Fallback to the static value with default 0
});


const activeEquipments = computed(() => {
  if (equipmentStore.equipments && equipmentStore.equipments.length > 0) {
    return equipmentStore.equipments.filter(eq => 
      eq.etat === 'operational' || eq.etat === 'Fonctionnel' ||
      eq.status === 'operational' || eq.status === 'Fonctionnel'
    ).length;
  }
  return 0; // Default value if no equipment data is available
});

const scheduledMaintenance = computed(() => {
  if (maintenanceStore.maintenances && maintenanceStore.maintenances.length > 0) {
    return maintenanceStore.maintenances.filter(maintenance => 
      maintenance.status === 'Planifiée' || 
      maintenance.status === 'En_cours' 
    ).length;
  }
  return 0; // Default value if no maintenance data is available
});

async function fetchMaintenances() {
  try {
    if (typeof maintenanceStore.fetchMaintenances === 'function') {
      await maintenanceStore.fetchMaintenances();
      console.log('Maintenance data loaded:', maintenanceStore.maintenances?.length || 0, 'items');
    } else {
      console.warn('fetchMaintenances function not available in store');
    }
  } catch (error) {
    console.error('Error fetching maintenance data:', error);
  }
}



async function fetchGlobalAvailability() {
  try {
    if (typeof equipmentStore.calculateAllEquipmentAvailability === 'function') {
      await equipmentStore.calculateAllEquipmentAvailability();
      console.log('Global availability updated:', equipmentStore.globalAvailability);
    } else {
      console.warn('calculateAllEquipmentAvailability function not available in store');
    }
  } catch (error) {
    console.error('Error fetching global availability:', error);
  }
}
const availabilityTrendComputed = computed(() => {
  if (equipmentStore.allEquipmentAvailability && 
      equipmentStore.allEquipmentAvailability.previous_global_availability !== undefined && 
      equipmentStore.allEquipmentAvailability.global_availability_percentage !== undefined) {
    
    const previous = equipmentStore.allEquipmentAvailability.previous_global_availability;
    const current = equipmentStore.allEquipmentAvailability.global_availability_percentage;
    
    if (current > previous + 1) return 'up';
    if (current < previous - 1) return 'down';
    return 'stable';
  }
  
  return availabilityTrend; // Fallback to static value
});

const availabilityChangeComputed = computed(() => {
  if (equipmentStore.allEquipmentAvailability && 
      equipmentStore.allEquipmentAvailability.previous_global_availability !== undefined && 
      equipmentStore.allEquipmentAvailability.global_availability_percentage !== undefined) {
    
    const previous = equipmentStore.allEquipmentAvailability.previous_global_availability;
    const current = equipmentStore.allEquipmentAvailability.global_availability_percentage;
    
    if (previous === 0) return 0;
    
    return Math.round(((current - previous) / previous) * 100);
  }
  
  return availabilityChange; // Fallback to static value
});

// Update the roomAvailabilityData computed property
const roomAvailabilityData = computed(() => {
  if (equipmentStore.availabilityByRoom && 
      equipmentStore.availabilityByRoom.success && 
      equipmentStore.availabilityByRoom.rooms_availability && 
      Array.isArray(equipmentStore.availabilityByRoom.rooms_availability) &&
      equipmentStore.availabilityByRoom.rooms_availability.length > 0) {
    
    return equipmentStore.availabilityByRoom.rooms_availability.map(room => ({
      name: `Salle ${room.room_number || 'N/A'}`,
      value: Math.round(room.global_availability_percentage || 0),
      room_number: room.room_number,
      room_type: room.room_type,
      total: room.total_equipment || 0,
      available: room.available_equipment || 0,
      maintenance: room.equipment_in_maintenance || 0,
      equipment_details: room.equipment_details || []
    }));
  }
  
  // Fallback to simulated data if no room availability data is available
  return zoneAvailability.value;
});

function getTrend(previous, current) {
  if (!previous || !current) return 'stable';
  const diff = current - previous;
  if (diff > 1) return 'up';
  if (diff < -1) return 'down';
  return 'stable';
}

async function fetchRoomAvailability() {
  isLoadingRoomAvailability.value = true;
  try {
    if (typeof equipmentStore.calculateAvailabilityByRoom === 'function') {
      await equipmentStore.calculateAvailabilityByRoom();
    } else {
      console.warn('calculateAvailabilityByRoom function not available in store');
    }
  } catch (error) {
    console.error('Error fetching room availability:', error);
  } finally {
    isLoadingRoomAvailability.value = false;
  }
}

// Update the reliabilityData ref to be computed based on the metrics evolution data
const reliabilityData = computed(() => {
  if (equipmentStore.metricsEvolution && 
      equipmentStore.metricsEvolution.metrics_evolution && 
      Array.isArray(equipmentStore.metricsEvolution.metrics_evolution) &&
      equipmentStore.metricsEvolution.metrics_evolution.length > 0) {
    
    const filteredData = filterMetricsByPeriod(equipmentStore.metricsEvolution.metrics_evolution);
    
    return {
      mtbf: filteredData.map(item => Math.round(item.mtbf || 0)),
      mttr: filteredData.map(item => Math.round(item.mttr * 100) / 100 || 0), // Round to 2 decimal places
      labels: filteredData.map(item => item.period ? item.period.substring(0, 3) : ''),
      failures: filteredData.map(item => item.failure_count || 0)
    };
  }
  
  // Fallback to simulated data if no metrics evolution data is available
  return {
    mtbf: [650, 680, 720, 690, 710, 750],
    mttr: [4.2, 3.8, 3.5, 3.9, 3.6, 3.2],
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    failures: [2, 3, 1, 2, 2, 1]
  };
})

// Add a function to filter metrics based on the selected period
function filterMetricsByPeriod(metrics) {
  if (!metrics || !Array.isArray(metrics)) return [];
  
  const now = new Date();
  const currentMonth = now.getMonth();
  
  switch (reliabilityPeriod.value) {
    case 'month':
      // Return only the current month
      return metrics.filter((_, index) => index === currentMonth);
    
    case 'quarter':
      // Calculate the current quarter (0-3)
      const currentQuarter = Math.floor(currentMonth / 3);
      // Return the months in the current quarter
      return metrics.filter((_, index) => Math.floor(index / 3) === currentQuarter);
    
    case 'year':
    default:
      // Return all months
      return metrics;
  }
}

// Add a function to fetch metrics evolution data
async function fetchMetricsEvolution() {
  isLoadingReliability.value = true;
  try {
    if (typeof equipmentStore.fetchMetricsEvolution === 'function') {
      await equipmentStore.fetchMetricsEvolution();
      if (equipmentStore.metricsEvolution && equipmentStore.metricsEvolution.year) {
        metricsYear.value = equipmentStore.metricsEvolution.year;
      }
    } else {
      console.warn('fetchMetricsEvolution function not available in store');
      // Initialize with empty data to prevent errors
      equipmentStore.metricsEvolution = {
        year: new Date().getFullYear().toString(),
        metrics_evolution: []
      };
    }
  } catch (error) {
    console.error('Error fetching metrics evolution:', error);
    // Reset data to ensure we don't have partial/corrupted data
    equipmentStore.metricsEvolution = {
      year: new Date().getFullYear().toString(),
      metrics_evolution: []
    };
  } finally {
    isLoadingReliability.value = false;
  }
}

// Watch for changes in the reliability period to update the chart
watch(reliabilityPeriod, () => {
  // The computed property will automatically update
});

// Update the onMounted hook to call fetchMetricsEvolution
onMounted(async () => {
  try {
    isLoadingEquipments.value = true;
    await fetchMetricsEvolution();
    await fetchRoomAvailability();
    await fetchGlobalAvailability();
    await fetchMaintenances(); 
    await notificationsStore.fetchUnreadNotifications(); // Add this line
    
    refreshInterval = setInterval(() => {
      fetchMetricsEvolution();
      fetchRoomAvailability();
      fetchGlobalAvailability();
      fetchMaintenances();
      notificationsStore.fetchUnreadNotifications(); // Add this line to the interval as well
    }, 30000);
  } catch (error) {
    console.error('Error during component initialization:', error);
  } finally {
    isLoadingEquipments.value = false;
  }
})

// Alertes récentes
const recentAlerts = ref([
  {
    id: 1,
    title: 'Défaut détecteur',
    message: 'Scanner IRM - Défaut détecté sur le détecteur principal',
    severity: 'critical',
    date: '2024-02-15T10:30:00'
  },
  {
    id: 2,
    title: 'Maintenance requise',
    message: 'Échographe cardiaque - Maintenance préventive recommandée',
    severity: 'warning',
    date: '2024-02-15T09:15:00'
  },
  {
    id: 3,
    title: 'Mise à jour disponible',
    message: 'Mise à jour du firmware disponible pour 3 équipements',
    severity: 'info',
    date: '2024-02-14T16:45:00'
  }
])

// Maintenances à venir
 /*const upcomingMaintenance = ref([
 
  {
    id: 1,
    equipment: {
      id: 1,
      name: 'Scanner IRM'
    },
    type: 'Maintenance préventive',
    date: '2024-02-20T09:00:00',
    status: 'scheduled'
  },
  {
    id: 2,
    equipment: {
      id: 2,
      name: 'Échographe cardiaque'
    },
    type: 'Calibration',
    date: '2024-02-22T14:30:00',
    status: 'confirmed'
  },
  {
    id: 3,
    equipment: {
      id: 3,
      name: 'Ventilateur de réanimation'
    },
    type: 'Inspection',
    date: '2024-02-25T10:00:00',
    status: 'pending'
  }
])*/
const upcomingMaintenance = computed(() => {
  if (maintenanceStore.maintenances && maintenanceStore.maintenances.length > 0) {
    // Get the most recent 3 scheduled maintenances
    return maintenanceStore.maintenances
      .filter(maintenance => 
        maintenance.status === 'Planifiée' || 
        maintenance.status === 'En_cours'
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3)
      .map(maintenance => {
        // Find the equipment in the equipment store to get its type
        const equipmentDetails = equipmentStore.equipments?.find(
          eq => eq._id === maintenance.equipment_id || eq.id === maintenance.equipment_id
        );
        
        return {
          id: maintenance._id || maintenance.id,
          equipment: {
            id: maintenance.equipment_id,
            name: equipmentDetails?.type || maintenance.type || 'Non spécifié',
          },
          type: maintenance.type || 'Maintenance',
          date: maintenance.date_scheduled,
          status: maintenance.status
        };
      });
  }
  
  // Return empty array if no maintenance data is available
  return [];
});



// Équipements critiques
const criticalEquipments = ref([
  {
    id: 1,
    name: 'Scanner IRM',
    department: 'Radiologie',
    status: 'operational',
    availability: 98
  },
  {
    id: 2,
    name: 'Échographe cardiaque',
    department: 'Cardiologie',
    status: 'maintenance',
    availability: 75
  },
  {
    id: 3,
    name: 'Ventilateur de réanimation',
    department: 'Soins intensifs',
    status: 'operational',
    availability: 99
  }
])

// Configuration de la carte
const floors = computed(() => {
  const floorSet = new Set()
  
  if (equipmentStore.equipments && equipmentStore.equipments.length > 0) {
    equipmentStore.equipments.forEach(equipment => {
      // Extract floor information from various possible properties
      const floor = equipment.floor || 
                   (equipment.chambre && typeof equipment.chambre === 'object' ? 
                     equipment.chambre.etage : equipment.etage) || 
                   (equipment.room_number ? parseInt(equipment.room_number.substring(0, 1)) : null)
      
      if (floor && !isNaN(parseInt(floor))) {
        floorSet.add(parseInt(floor))
      }
    })
  }
  
  // Convert Set to Array and sort numerically
  return Array.from(floorSet).sort((a, b) => a - b)
})
const equipmentStatuses = [
  { value: 'Opérationnel', label: 'Opérationnel' },
  {value: 'Fonctionnel', label:'Fonctionnel'},
  { value: 'En maintenance', label: 'En maintenance' },
  { value: 'error', label: 'En panne' }
]

// Computed
const mappedEquipments = computed(() => {
  if (!equipmentStore.equipments || equipmentStore.equipments.length === 0) {
    return [];
  }
  
  // Filter equipments based on selected floor
  return equipmentStore.equipments
    .filter(equipment => {
      // If "all" is selected, include all equipments
      if (selectedFloor.value === 'all') {
        return true;
      }
      
      // Check if equipment has room information and matches the selected floor
      // Handle different possible data structures
      const floor = equipment.floor || 
                   (equipment.chambre && equipment.chambre.etage) ||
                   (equipment.room && equipment.room.floor) ||
                   (equipment.room_number && parseInt(equipment.room_number.substring(0, 1)));
      
      return floor === parseInt(selectedFloor.value);
      
    })

    .map(equipment => ({
      id: equipment._id || equipment.id,
      name: equipment.name || equipment.type || 'Équipement',
      type: equipment.type || equipment.resource_type || 'Inconnu',
      status: equipment.status || equipment.etat || equipment.resource_state || 'unknown',
      room: equipment.room_number || 
            (equipment.room ? equipment.room.room_number : null) || 
            (equipment.chambre ? equipment.chambre.numero : 'N/A'),
      floor: equipment.floor || 
             (equipment.room ? equipment.room.floor : null) || 
             (equipment.chambre ? equipment.chambre.etage : null) ||
             (equipment.room_number ? parseInt(equipment.room_number.substring(0, 1)) : null),
      x: equipment.position_x || 
         (equipment.room ? equipment.room.position_x : null) || 
         Math.random() * 100,
      y: equipment.position_y || 
         (equipment.room ? equipment.room.position_y : null) || 
         Math.random() * 100,
      availability: equipment.availability || 100
    }));
});

// Méthodes
function formatDate(date) {
  if (!date) return 'Non disponible'
  try {
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })
  } catch (error) {
    return 'Date invalide'
  }
}

function getAvailabilityColor(value) {
  if (value >= 90) return 'green'
  if (value >= 70) return 'yellow'
  return 'red'
}

function getStatusColor(status) {
  const map = {
    Opérationnel: 'bg-green-500',
    Fonctionnel: 'bg-green-500',
    'En maintenance': 'bg-yellow-500',
    error: 'bg-red-500'
  };
  return map[status] || 'bg-gray-400'; // Default color for unknown statuses
}

function getMaintenanceStatusClass(status) {
  return {
    Planifiée: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    Terminée: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    En_cours: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
  }[status]
}

function viewEquipment(id) {
  router.push(`/equipment/${id}`)
}

function showMaintenanceSchedule() {
  showMaintenanceModal.value = true
}

async function handleScheduleMaintenance(data) {
  try {
    await maintenanceStore.scheduleMaintenance(data);
    console.log('Maintenance scheduled successfully');
    // Refresh the maintenance data
    await fetchMaintenances();
    showMaintenanceModal.value = false;
  } catch (error) {
    console.error('Error scheduling maintenance:', error);
  }
}

// Rafraîchissement automatique
let refreshInterval
onMounted(async () => {
  try {
    isLoadingEquipments.value = true;
    await fetchMetricsEvolution();
    await fetchRoomAvailability();
    await fetchGlobalAvailability();
    await fetchMaintenances(); 
    
    refreshInterval = setInterval(() => {
      
      fetchMetricsEvolution();
      fetchRoomAvailability();
      fetchGlobalAvailability();
      fetchMaintenances(); 
    }, 30000);
  } catch (error) {
    console.error('Error during component initialization:', error);
  }finally {
    isLoadingEquipments.value = false;
  }
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.btn-icon {
  @apply p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50
         transition-colors duration-200;
}
</style>