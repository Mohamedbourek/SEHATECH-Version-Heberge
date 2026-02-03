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

    <div v-else>
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Historique de l'équipement
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              {{ equipment?.type || equipment?.name }} ({{ equipment?.numero_serie || equipment?.serialNumber }})
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

      <!-- Timeline des événements -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div class="p-6">
          <div v-if="events.length === 0" class="text-center py-8 text-gray-500">
            Aucun événement d'historique disponible
          </div>
          <div v-else class="flow-root">
            <ul class="-mb-8">
              <li v-for="(event, index) in events" :key="index" class="mb-8">
                <div class="relative pb-8">
                  <span 
                    v-if="index !== events.length - 1"
                    class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                    aria-hidden="true"
                  ></span>
                  <div class="relative flex space-x-3">
                    <div>
                      <span 
                        class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800"
                        :class="getEventTypeClass(event.type || determineEventType(event))"
                      >
                        <component :is="getEventIcon(event.type || determineEventType(event))" class="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p class="text-sm text-gray-900 dark:text-white">
                          {{ event.description || event.notes || getDefaultDescription(event) }}
                        </p>
                        <p v-if="event.technicien" class="mt-1 text-xs text-gray-500">
                          Technicien: {{ getTechnicianName(event.technicien) }}
                        </p>
                      </div>
                      <div class="whitespace-nowrap text-right text-sm text-gray-500">
                        <time :datetime="event.date || event.created_at">{{ formatDate(event.date || event.created_at) }}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEquipmentStore } from '@/stores/equipment'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Power,
  Settings
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const equipmentStore = useEquipmentStore()

const equipment = ref(null)
const events = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  const id = route.params.id
  loading.value = true
  
  try {
    // Fetch equipment details
    equipment.value = await equipmentStore.fetchEquipmentById(id)
    
    // Fetch maintenance history
    const history = await equipmentStore.fetchMaintenanceHistory(id)
    
    if (history && history.length > 0) {
      events.value = history
    } else {
      events.value = []
    }
  } catch (err) {
    console.error('Error loading equipment history:', err)
    error.value = err.message || "Erreur lors du chargement de l'historique"
  } finally {
    loading.value = false
  }
})

function determineEventType(event) {
  if (event.status === 'completed' || event.status === 'Terminé') return 'success'
  if (event.status === 'in-progress' || event.status === 'En cours') return 'maintenance'
  if (event.status === 'scheduled' || event.status === 'Planifié') return 'config'
  if (event.type && event.type.toLowerCase().includes('panne')) return 'alert'
  return 'maintenance'
}

function getDefaultDescription(event) {
  if (event.type) return `Maintenance: ${event.type}`
  if (event.status) return `Statut: ${event.status}`
  return 'Événement de maintenance'
}

function getEventTypeClass(type) {
  const classes = {
    maintenance: 'bg-blue-500',
    alert: 'bg-red-500',
    status: 'bg-yellow-500',
    config: 'bg-purple-500',
    success: 'bg-green-500'
  }
  return classes[type] || 'bg-gray-500'
}

function getEventIcon(type) {
  const icons = {
    maintenance: Wrench,
    alert: AlertTriangle,
    status: Power,
    config: Settings,
    success: CheckCircle
  }
  return icons[type] || Settings
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

// Add this function to extract technician name
function getTechnicianName(technicien) {
  if (!technicien) return 'Non assigné';
  
  // If technicien is a string, return it directly
  if (typeof technicien === 'string') return technicien;
  
  // If technicien is an object with utilisateur property
  if (technicien.utilisateur) {
    return `${technicien.utilisateur.prenom} ${technicien.utilisateur.nom}`;
  }
  
  // If technicien is an object with name properties
  if (technicien.nom || technicien.prenom) {
    return `${technicien.prenom || ''} ${technicien.nom || ''}`.trim();
  }
  
  // If technicien is an object with _id only
  if (technicien._id) {
    return `ID: ${technicien._id.substring(0, 8)}...`;
  }
  
  return 'Technicien inconnu';
}
</script>