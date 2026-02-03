<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
           transition-all duration-200 border border-gray-200 dark:border-gray-700
           overflow-hidden"
  >
    <!-- En-tête avec statut -->
    <div class="p-6">
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <div 
            class="p-2.5 rounded-lg"
            :class="statusClasses[safeStatus].bg"
          >
            <component 
              :is="equipment.icon || 'Monitor'"
              class="w-6 h-6"
              :class="statusClasses[safeStatus].icon"
            />
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ equipment.type || equipment.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ equipment.model || equipment.numero_serie }}
            </p>
          </div>
        </div>
        <span 
          class="px-2.5 py-1 text-xs font-medium rounded-full"
          :class="statusClasses[safeStatus].badge"
        >
          {{ statusLabel }}
        </span>
      </div>

      <!-- Informations -->
      <div class="mt-6 space-y-4">
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <MapPin class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
          Service {{ equipment.location || equipment.service || 'Non spécifié' }}
        </div>
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Calendar class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
          Dernière maintenance: {{ formatDate(equipment.derniereMaintenance || equipment.lastMaintenance) }}
        </div>
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Calendar class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
          Prochain contrôle: {{ formatDate(equipment.prochainControle || equipment.nextCheck) }}
        </div>
      </div>

      <!-- Indicateurs -->
      <div class="mt-6 grid grid-cols-2 gap-4">
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">Numéro de série</p>
          <div class="mt-1 flex items-baseline">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {{ equipment.numero_serie || equipment.serialNumber }}
            </p>
          </div>
        </div>
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">Service</p>
          <div class="mt-1 flex items-baseline">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
               {{ equipment.service || equipment.department || 'Non spécifié' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-center">
        <!-- Statut actuel -->
        <span 
          class="px-2.5 py-1 text-xs font-medium rounded-full"
          :class="statusClasses[safeStatus].badge"
        >
          {{ statusLabel }}
        </span>

        <!-- Actions -->
        <div class="flex space-x-2">
          <!-- Boutons conditionnels selon le statut -->
          <template v-if="safeStatus === 'operational'">
            <button 
              class="btn-icon"
              @click="$emit('maintenance', equipment)"
              title="Planifier une maintenance"
            >
              <WrenchIcon class="w-5 h-5" />
            </button>
            <button 
              class="btn-icon"
              @click="$emit('status-change', equipment, 'available')"
              title="Mettre en disponible"
            >
              <CheckCircleIcon class="w-5 h-5" />
            </button>
          </template>

          <template v-else-if="safeStatus === 'maintenance'">
            <button 
              class="btn-icon text-green-500 hover:text-green-600"
              @click="$emit('status-change', equipment, 'operational')"
              title="Terminer la maintenance"
            >
              <CheckCircleIcon class="w-5 h-5" />
            </button>
          </template>

          <template v-else-if="safeStatus === 'available'">
            <button 
              class="btn-icon text-blue-500 hover:text-blue-600"
              @click="$emit('status-change', equipment, 'operational')"
              title="Remettre en service"
            >
              <ArrowUpCircleIcon class="w-5 h-5" />
            </button>
          </template>

          <!-- Boutons toujours présents -->
          <button 
            class="btn-icon"
            @click="$emit('view-history', equipment._id || equipment.id)"
            title="Historique"
          >
            <History class="w-5 h-5" />
          </button>
          <button 
            class="btn-icon"
            @click="$emit('edit', equipment)"
            title="Paramètres"
          >
            <Settings class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Monitor,
  MapPin,
  Calendar,
  AlertCircle,
  Wrench as WrenchIcon,
  History,
  Settings,
  CheckCircle as CheckCircleIcon,
  ArrowUpCircle as ArrowUpCircleIcon
} from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { computed } from 'vue'

const props = defineProps({
  equipment: {
    type: Object,
    required: true
  }
})

// Map API status values to our internal status keys
const statusMap = {
  'Fonctionnel': 'operational',
  'En maintenance': 'maintenance',
  'Disponible': 'available',
  'En panne': 'error'
}

const statusClasses = {
  operational: {
    bg: 'bg-green-100/80 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300'
  },
  maintenance: {
    bg: 'bg-yellow-100/80 dark:bg-yellow-900/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-300'
  },
  available: {
    bg: 'bg-blue-100/80 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300'
  },
  error: {
    bg: 'bg-red-100/80 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300'
  }
}

const statusLabels = {
  operational: 'Opérationnel',
  maintenance: 'En maintenance',
  available: 'Disponible',
  error: 'En panne'
}

// Computed property to safely get the status
const safeStatus = computed(() => {
  // First try to map the API status to our internal status
  if (props.equipment.etat && statusMap[props.equipment.etat]) {
    return statusMap[props.equipment.etat];
  }
  
  // Fall back to direct status if available
  const status = props.equipment.status;
  return statusClasses[status] ? status : 'operational';
})

// Get the display label for the current status
const statusLabel = computed(() => {
  // If we have the original API status, use that directly
  if (props.equipment.etat) {
    return props.equipment.etat;
  }
  
  // Otherwise use our mapped labels
  return statusLabels[safeStatus.value];
})

function formatDate(date) {
  if (!date) return 'Non disponible'
  try {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr })
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

defineEmits(['maintenance', 'view-history', 'edit', 'status-change'])
</script>

<style scoped>
.btn-icon {
  @apply p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
         dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800
         transition-colors duration-200 focus:outline-none focus:ring-2
         focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900;
}
</style>