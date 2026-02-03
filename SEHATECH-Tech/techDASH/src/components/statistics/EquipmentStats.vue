<template>
  <div class="space-y-6">
    <!-- Statistiques globales -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        title="Total équipements"
        :value="stats.totalEquipments"
        icon="Package"
        :trend="stats.equipmentsTrend"
        :percentage="stats.equipmentsGrowth"
        color="blue"
      />
      <StatCard
        title="Taux de disponibilité"
        :value="`${stats.availability}%`"
        icon="CheckCircle"
        :trend="stats.availabilityTrend"
        :percentage="stats.availabilityGrowth"
        color="green"
      />
      <StatCard
        title="Maintenance préventive"
        :value="stats.preventiveMaintenance"
        icon="Tool"
        :trend="stats.maintenanceTrend"
        :percentage="stats.maintenanceGrowth"
        color="yellow"
      />
      <StatCard
        title="Incidents critiques"
        :value="stats.criticalIncidents"
        icon="AlertTriangle"
        :trend="stats.incidentsTrend"
        :percentage="stats.incidentsGrowth"
        color="red"
      />
    </div>

    <!-- Graphiques de performance -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- MTBF et MTTR -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Indicateurs de fiabilité</h3>
        <div class="h-64">
          <ReliabilityChart :data="reliabilityData" />
        </div>
      </div>

      <!-- Distribution des pannes -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Distribution des pannes</h3>
        <div class="h-64">
          <FailureDistributionChart :data="failureData" />
        </div>
      </div>
    </div>

    <!-- Tableau des équipements critiques -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium">Équipements critiques</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="table-header">Équipement</th>
              <th class="table-header">Statut</th>
              <th class="table-header">Dernière maintenance</th>
              <th class="table-header">MTBF</th>
              <th class="table-header">MTTR</th>
              <th class="table-header">Disponibilité</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="equipment in criticalEquipments" 
              :key="equipment.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="table-cell">
                <div class="flex items-center">
                  <component 
                    :is="equipment.icon || 'Monitor'"
                    class="w-5 h-5 mr-3 text-gray-400"
                  />
                  <div>
                    <p class="font-medium">{{ equipment.name }}</p>
                    <p class="text-sm text-gray-500">{{ equipment.location }}</p>
                  </div>
                </div>
              </td>
              <td class="table-cell">
                <span 
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="statusClasses[equipment.status]"
                >
                  {{ equipment.status }}
                </span>
              </td>
              <td class="table-cell">
                {{ formatDate(equipment.lastMaintenance) }}
              </td>
              <td class="table-cell">
                {{ equipment.mtbf }} heures
              </td>
              <td class="table-cell">
                {{ equipment.mttr }} heures
              </td>
              <td class="table-cell">
                <div class="flex items-center">
                  <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      class="h-full rounded-full"
                      :class="getAvailabilityColor(equipment.availability)"
                      :style="{ width: `${equipment.availability}%` }"
                    ></div>
                  </div>
                  <span>{{ equipment.availability }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Filtres et export -->
    <div class="flex justify-between items-center">
      <div class="flex space-x-4">
        <select v-model="timeRange" class="form-select w-40">
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">90 derniers jours</option>
          <option value="1y">1 an</option>
        </select>
        <select v-model="department" class="form-select w-48">
          <option value="all">Tous les services</option>
          <option value="cardiology">Cardiologie</option>
          <option value="radiology">Radiologie</option>
          <option value="laboratory">Laboratoire</option>
        </select>
      </div>
      <button 
        class="btn btn-outline"
        @click="exportStats"
      >
        <Download class="w-4 h-4 mr-2" />
        Exporter les statistiques
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Package, CheckCircle, Tool, AlertTriangle,
  Monitor, Download
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import ReliabilityChart from './ReliabilityChart.vue'
import FailureDistributionChart from './FailureDistributionChart.vue'

// États
const timeRange = ref('30d')
const department = ref('all')
const isLoading = ref(false)

// Données simulées
const stats = ref({
  totalEquipments: 245,
  availability: 97.8,
  preventiveMaintenance: 12,
  criticalIncidents: 3,
  equipmentsTrend: 'up',
  availabilityTrend: 'up',
  maintenanceTrend: 'down',
  incidentsTrend: 'down',
  equipmentsGrowth: 5,
  availabilityGrowth: 2.3,
  maintenanceGrowth: 8,
  incidentsGrowth: 15
})

const reliabilityData = ref({
  mtbf: [/* données MTBF */],
  mttr: [/* données MTTR */]
})

const failureData = ref([
  { name: 'Usure normale', value: 45 },
  { name: 'Erreur utilisateur', value: 25 },
  { name: 'Panne électrique', value: 15 },
  { name: 'Calibration', value: 10 },
  { name: 'Autre', value: 5 }
])

const criticalEquipments = ref([
  {
    id: 1,
    name: 'IRM 3T',
    location: 'Radiologie',
    status: 'operational',
    lastMaintenance: new Date('2024-01-15'),
    mtbf: 720,
    mttr: 4,
    availability: 98.5
  },
  // Autres équipements...
])

// Classes pour les statuts
const statusClasses = {
  operational: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

// Fonctions utilitaires
function formatDate(date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

function getAvailabilityColor(value) {
  if (value >= 95) return 'bg-green-500'
  if (value >= 90) return 'bg-yellow-500'
  return 'bg-red-500'
}

async function exportStats() {
  // Implémenter l'export des statistiques
  console.log('Exporting stats...')
}

// Chargement des données
onMounted(async () => {
  isLoading.value = true
  try {
    // Charger les données
    await Promise.all([
      // Appels API
    ])
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 
         uppercase tracking-wider;
}

.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 
         dark:text-gray-100;
}
</style> 