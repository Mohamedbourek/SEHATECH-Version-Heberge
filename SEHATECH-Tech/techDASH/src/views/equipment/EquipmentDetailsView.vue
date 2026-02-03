<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{{ error }}</p>
      <button 
        @click="router.push('/equipment')" 
        class="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
      >
        Retour à la liste
      </button>
    </div>

    <!-- Content when equipment is loaded -->
    <div v-else>
      <!-- En-tête avec navigation -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Détails de l'équipement
            </h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ equipment?.type  }} ({{ equipment?.numero_serie  }})
            </p>
          </div>
          <button 
            class="btn btn-outline"
            @click="router.back()"
          >
            <ArrowLeft class="w-4 h-4 mr-2" />
            Retour
          </button>
        </div>
      </div>

      <div v-if="equipment" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Informations principales -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Carte d'état -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                État actuel
              </h2>
              <span 
                class="px-3 py-1 text-sm font-medium rounded-full"
                :class="getStatusBadgeClass(equipment.etat || equipment.status)"
              >
                {{ statusLabels[equipment.etat] || statusLabels[equipment.status] || 'Inconnu' }}
              </span>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400">Disponibilité</p>
                <div class="mt-1 flex items-center">
                  <span v-if="availabilityLoading" class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                      Chargement...
                  </span>
                  <span v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
                    {{ availability }}%
                  </span>
                  <div v-if="!availabilityLoading" class="ml-2">
                    <ArrowUp 
                      v-if="availability >= 90"
                      class="w-5 h-5 text-green-500"
                    />
                    <ArrowDown 
                      v-else
                      class="w-5 h-5 text-red-500"
                    />
                  </div>
                </div>
              </div>
              
              <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400">MTBF</p>
                <span v-if="mtbfLoading" class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                  Chargement...
                </span>
                <span v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
                  {{ mtbf }}h
                </span>
               
              </div>
            </div>
          </div>

          <!-- Informations détaillées -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Informations détaillées
            </h2>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Numéro de série</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ equipment.numero_serie || equipment.serialNumber || 'Non spécifié' }}
                </dd>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Modèle</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ equipment.model || equipment.type || 'Non spécifié' }}
                </dd>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Dernière maintenance</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatDate(equipment.derniereMaintenance || equipment.lastMaintenance) }}
                </dd>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Prochain contrôle</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatDate(equipment.prochainControle || equipment.lastCheck) }}
                </dd>
              </div>
              <div v-if="equipment.service" class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Service</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ equipment.service }}
                </dd>
              </div>
              <div v-if="equipment.chambre" class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Chambre</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ equipment.chambre.numero || 'Non spécifié' }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Alertes et actions -->
        <div class="space-y-6">
          <!-- Alertes -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Alertes actives
            </h2>
            <div class="space-y-3">
              <div 
                v-for="alert in equipment.alerts"
                :key="alert.id || alert._id"
                class="p-3 rounded-lg"
                :class="{
                  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200': alert.severity === 'critical',
                  'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200': alert.severity === 'warning',
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200': alert.severity === 'info'
                }"
              >
                {{ alert.message }}
              </div>
              <p 
                v-if="!equipment.alerts?.length"
                class="text-sm text-gray-500 dark:text-gray-400 text-center py-3"
              >
                Aucune alerte active
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Actions
            </h2>
            <div class="space-y-3">
              <button 
                v-if="safeStatus === 'operational'"
                class="btn btn-primary w-full"
                @click="showMaintenanceModal = true"
              >
                <WrenchIcon class="w-4 h-4 mr-2" />
                Planifier une maintenance
              </button>
              <button 
                v-if="safeStatus === 'maintenance'"
                class="btn btn-success w-full"
                @click="completeMaintenanceAndReturn"
              >
                <CheckCircle class="w-4 h-4 mr-2" />
                Terminer la maintenance
              </button>
              <button 
                class="btn btn-outline w-full"
                @click="viewHistory"
              >
                <History class="w-4 h-4 mr-2" />
                Voir l'historique
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de maintenance -->
      <MaintenanceScheduleModal
        v-if="showMaintenanceModal"
        :equipment="equipment"
        @close="showMaintenanceModal = false"
        @save="handleScheduleMaintenance"
      />

      <div 
        v-if="!equipment"
        class="flex items-center justify-center h-64"
      >
        <p class="text-gray-500 dark:text-gray-400">
          Équipement non trouvé
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEquipmentStore } from '@/stores/equipment'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Wrench as WrenchIcon,
  History,
  CheckCircle
} from 'lucide-vue-next'
import MaintenanceScheduleModal from '@/components/maintenance/MaintenanceScheduleModal.vue'

const router = useRouter()
const route = useRoute()
const equipmentStore = useEquipmentStore()
const equipment = ref(null)
const loading = ref(true)
const error = ref(null)
const showMaintenanceModal = ref(false)
const availabilityLoading = ref(false)
const mtbfLoading = ref(false)
const availability = ref(0)
const mtbf = ref(0)
const statusLabels = {
  operational: 'Opérationnel',
  maintenance: 'En maintenance',
  available: 'Disponible',
  error: 'En panne',
  'Fonctionnel': 'Opérationnel',
  'En maintenance': 'En maintenance',
  'Disponible': 'Disponible',
  'En panne': 'En panne'
}

// Map API status values to our internal status keys
const statusMap = {
  'Fonctionnel': 'operational',
  'En maintenance': 'maintenance',
  'Disponible': 'available',
  'En panne': 'error'
}

// Computed property to safely get the status
const safeStatus = computed(() => {
  if (!equipment.value) return 'operational'
  
  // First try to map the API status to our internal status
  if (equipment.value.etat && statusMap[equipment.value.etat]) {
    return statusMap[equipment.value.etat]
  }
  
  // Fall back to direct status if available
  return equipment.value.status || 'operational'
})

onMounted(async () => {
  const id = route.params.id
  loading.value = true
  
  try {
    console.log('Fetching equipment details for ID:', id)
    const equipmentData = await equipmentStore.fetchEquipmentById(id)
    
    if (equipmentData) {
      equipment.value = equipmentData
      
      // Add default values for UI if they don't exist
      equipment.value.availability = equipment.value.availability || 95
      equipment.value.mtbf = equipment.value.mtbf || 720
      equipment.value.alerts = equipment.value.alerts || []
      
      // Fetch availability and MTBF data
      await fetchAvailabilityAndMTBF(equipmentData._id )
    } else {
      error.value = "Équipement non trouvé"
    }
  } catch (err) {
    console.error('Error loading equipment:', err)
    error.value = err.message || "Erreur lors du chargement des données"
  } finally {
    loading.value = false
  }
})

// Add this new function to fetch availability and MTBF
async function fetchAvailabilityAndMTBF(equipmentId) {
  availabilityLoading.value = true
  mtbfLoading.value = true
  
  try {
    // Fetch maintenance history if needed
    await equipmentStore.fetchMaintenanceHistory(equipmentId)
    
    // Get availability data for this specific equipment
    const availabilityData = await equipmentStore.calculateEquipmentAvailability(equipmentId)
    if (availabilityData && availabilityData.availability_percentage) {
      availability.value = availabilityData.availability_percentage
      // Store annual availability if available
      equipment.value.annual_availability = availabilityData.annual_availability || 0
    } else {
      availability.value = equipmentStore.getAvailabilityPercentage(equipmentId)
    }
    
    // Get MTBF data for this specific equipment
    const mtbfData = await equipmentStore.fetchMTBFForResource(equipmentId)
    if (mtbfData && mtbfData.mtbf_hours) {
      mtbf.value = mtbfData.mtbf_hours
      // Store additional MTBF metrics if available
      equipment.value.mtbf_details = {
        failures_count: mtbfData.failures_count || 0,
        total_operational_hours: mtbfData.total_operational_hours || 0,
        last_calculated: mtbfData.timestamp || new Date().toISOString()
      }
    } else {
      mtbf.value = equipmentStore.getMTBF(equipmentId)
    }
  } catch (error) {
    console.error('Error fetching metrics:', error)
    // Use fallback values
    availability.value = equipmentStore.getAvailabilityPercentage(equipmentId)
    mtbf.value = equipmentStore.getMTBF(equipmentId)
  } finally {
    availabilityLoading.value = false
    mtbfLoading.value = false
  }
}
function getStatusBadgeClass(status) {
  // Map API status to internal status if needed
  const mappedStatus = statusMap[status] || status
  
  const classes = {
    operational: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    available: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  }
  return classes[mappedStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
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

function scheduleMaintenance() {
  // Implémenter la logique de planification de maintenance
  router.push(`/equipment/${equipment.value._id || equipment.value.id}/maintenance`)
}

async function handleScheduleMaintenance(data) {
  try {
    await equipmentStore.updateEquipment(equipment.value._id || equipment.value.id, {
      ...equipment.value,
      ...data,
      etat: 'En maintenance',
      status: 'maintenance',
      derniereMaintenance: new Date().toISOString(),
      lastMaintenance: new Date().toISOString()
    })
    showMaintenanceModal.value = false
    // Refresh equipment data
    const updatedEquipment = await equipmentStore.fetchEquipmentById(equipment.value._id || equipment.value.id)
    if (updatedEquipment) {
      equipment.value = updatedEquipment
    }
  } catch (error) {
    console.error('Error scheduling maintenance:', error)
  }
}

async function completeMaintenanceAndReturn() {
  try {
    await equipmentStore.updateEquipment(equipment.value._id || equipment.value.id, {
      ...equipment.value,
      etat: 'Fonctionnel',
      status: 'operational',
      derniereMaintenance: new Date().toISOString(),
      lastMaintenance: new Date().toISOString()
    })
    // Refresh equipment data
    const updatedEquipment = await equipmentStore.fetchEquipmentById(equipment.value._id || equipment.value.id)
    if (updatedEquipment) {
      equipment.value = updatedEquipment
    }
  } catch (error) {
    console.error('Error completing maintenance:', error)
  }
}

function viewHistory() {
  router.push(`/equipment/${equipment.value._id || equipment.value.id}/history`)
}
</script>