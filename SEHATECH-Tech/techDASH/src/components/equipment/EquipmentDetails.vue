<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div 
          class="p-3 rounded-lg"
          :class="statusClasses[safeStatus].bg"
        >
          <component 
            :is="equipmentData.icon || 'Monitor'"
            class="w-6 h-6"
            :class="statusClasses[safeStatus].icon"
          />
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ equipmentData.type || equipmentData.name }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ equipmentData.numero_serie || equipmentData.serialNumber }}
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          class="btn btn-outline"
          @click="$emit('maintenance', equipmentData._id || equipmentData.id)"
        >
          <Tool class="w-4 h-4 mr-2" />
          Maintenance
        </button>
        <button 
          class="btn btn-primary"
          @click="$emit('edit', equipmentData._id || equipmentData.id)"
        >
          <Edit class="w-4 h-4 mr-2" />
          Modifier
        </button>
      </div>
    </div>

    <!-- Informations principales -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <InfoCard
        title="État actuel"
        :value="statusLabel"
        :status="statusClasses[safeStatus].badge"
      />
      <InfoCard
        title="Dernière maintenance"
        :value="formatDate(equipmentData.derniereMaintenance || equipmentData.lastMaintenance)"
        icon="Calendar"
      />
      <InfoCard
        title="Prochain contrôle"
        :value="formatDate(equipmentData.prochainControle || equipmentData.nextCheck || equipmentData.nextMaintenance)"
        icon="Calendar"
      />
    </div>

    <!-- Détails techniques -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium">Détails techniques</h3>
      </div>
      <div class="p-6">
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Modèle
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ equipmentData.model || equipmentData.numero_serie || 'Non spécifié' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Service
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ equipmentData.service || equipmentData.department || 'Non spécifié' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Date de création
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ formatDate(equipmentData.created_at || equipmentData.installationDate) }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Dernière mise à jour
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ formatDate(equipmentData.updated_at || equipmentData.warrantyEnd) }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Technicien responsable
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ equipmentData.technicienID || 'Non assigné' }}
            </dd>
          </div>
          <div v-if="equipmentData.chambre">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Chambre
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ equipmentData.chambre.numero || 'Non spécifié' }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Historique des maintenances -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium">Historique des maintenances</h3>
      </div>
      <div v-if="maintenanceHistory.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
        <div 
          v-for="maintenance in maintenanceHistory" 
          :key="maintenance._id || maintenance.id"
          class="p-6"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ maintenance.type || 'Maintenance standard' }}
              </p>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ maintenance.description || maintenance.notes || 'Aucune description' }}
              </p>
              <div class="mt-2 flex items-center text-xs text-gray-500">
                <Calendar class="w-4 h-4 mr-1" />
                {{ formatDate(maintenance.date || maintenance.created_at) }}
              </div>
            </div>
            <span 
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="maintenanceStatusClasses[maintenance.status || 'completed']"
            >
              {{ maintenance.status || 'Terminé' }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="p-6 text-center text-gray-500">
        Aucun historique de maintenance disponible
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRoute, useRouter } from 'vue-router'
import { 
  Tool, Edit, Monitor, Calendar
} from 'lucide-vue-next'
import InfoCard from '@/components/common/InfoCard.vue'
import { useEquipmentStore } from '@/stores/equipment'

// Get route and router for navigation and params
const route = useRoute()
const router = useRouter()
const equipmentStore = useEquipmentStore()
const maintenanceHistory = ref([])
const loading = ref(true)
const error = ref(null)
const equipmentData = ref({})

// Map API status values to our internal status keys
const statusMap = {
  'Fonctionnel': 'operational',
  'En maintenance': 'maintenance',
  'Disponible': 'available',
  'En panne': 'error'
}

const statusClasses = {
  operational: {
    bg: 'bg-green-100 dark:bg-green-900/50',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  maintenance: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/50',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  available: {
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-900/50',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
}

const maintenanceStatusClasses = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  scheduled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
}

// Computed property to safely get the status
const safeStatus = computed(() => {
  // First try to map the API status to our internal status
  if (equipmentData.value.etat && statusMap[equipmentData.value.etat]) {
    return statusMap[equipmentData.value.etat];
  }
  
  // Fall back to direct status if available
  const status = equipmentData.value.status;
  return statusClasses[status] ? status : 'operational';
})

// Get the display label for the current status
const statusLabel = computed(() => {
  // If we have the original API status, use that directly
  if (equipmentData.value.etat) {
    return equipmentData.value.etat;
  }
  
  // Otherwise use our mapped labels
  return equipmentData.value.status || 'Opérationnel';
})

const formatDate = (date) => {
  if (!date) return 'Non disponible';
  try {
    return format(new Date(date), 'PPp', { locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Date invalide';
  }
}

// Fetch the equipment details directly from the route param
const fetchEquipmentDetails = async () => {
  const id = route.params.id;
  console.log(id)
  if (!id) {
    error.value = "ID d'équipement manquant";
    loading.value = false;
    return;
  }
  
  loading.value = true;
  try {
    console.log('Fetching equipment details for ID:', id);
    const updatedEquipment = await equipmentStore.fetchEquipmentById(id);
    console.log('Received equipment data:', updatedEquipment);
    
    if (updatedEquipment && Object.keys(updatedEquipment).length > 0) {
      equipmentData.value = updatedEquipment;
      await loadMaintenanceHistory(id);
    } else {
      error.value = "Équipement non trouvé";
      console.error('No equipment data returned for ID:', id);
    }
  } catch (err) {
    error.value = err.message || "Erreur lors du chargement des données";
    console.error('Erreur lors du chargement des détails:', err);
  } finally {
    loading.value = false;
  }
};

// Load maintenance history
const loadMaintenanceHistory = async (id) => {
  try {
    console.log('Fetching maintenance history for ID:', id);
    const history = await equipmentStore.fetchMaintenanceHistory(id);
    console.log('Received maintenance history:', history);
    
    if (history) {
      maintenanceHistory.value = history;
    } else {
      console.warn('No maintenance history returned for ID:', id);
      maintenanceHistory.value = [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error);
    maintenanceHistory.value = [];
  }
};

// Handle maintenance button click
const handleMaintenance = (id) => {
  router.push(`/equipment/${id}/maintenance`);
};

// Handle edit button click
const handleEdit = (id) => {
  router.push(`/equipment/${id}/edit`);
};

onMounted(() => {
  console.log('EquipmentDetails component mounted, route params:', route.params);
  fetchEquipmentDetails();
});

// Handle button clicks directly instead of emitting events
</script>