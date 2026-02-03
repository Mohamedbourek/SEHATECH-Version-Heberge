<template>
  <div class="space-y-6">
    <!-- Notification -->
    <div 
      v-if="notification && notification.show"
      class="fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300"
      :class="{
        'bg-green-50 border-l-4 border-green-500': notification.type === 'success',
        'bg-red-50 border-l-4 border-red-500': notification.type === 'error',
        'bg-blue-50 border-l-4 border-blue-500': notification.type === 'info'
      }"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <CheckCircleIcon 
            v-if="notification.type === 'success'" 
            class="w-5 h-5 text-green-500" 
          />
          <XCircleIcon 
            v-if="notification.type === 'error'" 
            class="w-5 h-5 text-red-500" 
          />
          <InfoIcon 
            v-if="notification.type === 'info'" 
            class="w-5 h-5 text-blue-500" 
          />
        </div>
        <div class="ml-3">
          <h3 
            class="text-sm font-medium"
            :class="{
              'text-green-800': notification.type === 'success',
              'text-red-800': notification.type === 'error',
              'text-blue-800': notification.type === 'info'
            }"
          >
            {{ notification.title }}
          </h3>
          <div 
            class="mt-1 text-sm"
            :class="{
              'text-green-700': notification.type === 'success',
              'text-red-700': notification.type === 'error',
              'text-blue-700': notification.type === 'info'
            }"
          >
            {{ notification.message }}
          </div>
        </div>
        <button 
          @click="notification = null"
          class="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <XIcon class="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>

    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
      <div 
        v-if="equipment"
        class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
      >
        <component 
          :is="getEquipmentIcon(equipment.type || equipment.category)"
          class="w-5 h-5"
        />
        <span>{{ equipment.name || equipment.type }}</span>
      </div>
    </div>

    <!-- Formulaire -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Type de maintenance -->
      <div>
        <label class="form-label required">Type de maintenance</label>
        <select 
          v-model="form.type"
          class="form-select"
          :class="{ 'border-red-500': errors.type }"
          required
        >
          <option value="">Sélectionner un type</option>
          <option 
            v-for="type in maintenanceTypes" 
            :key="type.value"
            :value="type.value"
          >
            {{ type.label }}
          </option>
        </select>
        <p v-if="errors.type" class="mt-1 text-sm text-red-500">
          {{ errors.type }}
        </p>
      </div>

      <!-- Date planifiée -->
      <div>
        <label class="form-label required">Date planifiée</label>
        <input 
          type="date"
          v-model="form.date_scheduled"
          class="form-input"
          :min="minDate"
          :class="{ 'border-red-500': errors.date_scheduled }"
          required
        />
        <p v-if="errors.date_scheduled" class="mt-1 text-sm text-red-500">
          {{ errors.date_scheduled }}
        </p>
      </div>

      <!-- Technicien -->
      <div>
        <label class="form-label required">Technicien assigné</label>
        <div v-if="maintenanceStore.loading" class="flex items-center space-x-2">
          <Loader2 class="w-4 h-4 animate-spin text-primary-500" />
          <span class="text-sm text-gray-500">Chargement des techniciens...</span>
        </div>
        <select 
          v-else
          v-model="form.technicien_id"
          class="form-select"
          :class="{ 'border-red-500': errors.technicien_id }"
          required
        >
          <option value="">Sélectionner un technicien</option>
          <option 
            v-for="tech in technicians" 
            :key="tech._id"
            :value="tech._id"
          >
          Technicien {{ tech.utilisateur?.nom }} {{ tech.utilisateur?.prenom }}
          </option>
        </select>
        <p v-if="errors.technicien_id" class="mt-1 text-sm text-red-500">
          {{ errors.technicien_id }}
        </p>
        <p v-if="technicians.length === 0 && !maintenanceStore.loading" class="text-sm text-red-500 mt-1">
          Aucun technicien disponible. Veuillez contacter l'administrateur.
        </p>
      </div>

      <!-- Statut -->
      <div>
        <label class="form-label required">Statut</label>
        <select 
          v-model="form.status"
          class="form-select"
          :class="{ 'border-red-500': errors.status }"
          required
        >
          <option value="">Sélectionner un statut</option>
          <option value="Planifiée">Planifiée</option>
          <option value="En cours">En cours</option>
          <option value="Terminée">Terminée</option>
          <option value="Annulée">Annulée</option>
        </select>
        <p v-if="errors.status" class="mt-1 text-sm text-red-500">
          {{ errors.status }}
        </p>
      </div>

      <!-- Notes -->
      <div>
        <label class="form-label">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="form-textarea"
          placeholder="Instructions ou remarques particulières..."
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button 
          type="button"
          class="btn btn-outline"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <button 
          type="submit"
          class="btn btn-primary"
          :disabled="loading || maintenanceStore.loading"
        >
          <Loader2 v-if="loading || maintenanceStore.loading" class="w-4 h-4 mr-2 animate-spin" />
          {{ submitLabel }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format, addDays } from 'date-fns'
import { 
  Loader2,
  Stethoscope,
  Monitor,
  Syringe,
  Microscope,
  Activity,
  Cpu,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Info as InfoIcon,
  X as XIcon
} from 'lucide-vue-next'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  equipment: {
    type: Object,
    default: null
  },
  maintenance: {
    type: Object,
    default: null
  },
  title: {
    type: String,
    default: 'Planifier une maintenance'
  },
  description: {
    type: String,
    default: 'Remplissez les informations pour planifier une maintenance'
  },
  submitLabel: {
    type: String,
    default: 'Planifier'
  }
})

const emit = defineEmits(['submit', 'cancel'])

const maintenanceStore = useMaintenanceStore()
const authStore = useAuthStore()
const notification = ref(null)
let notificationTimeout = null


// État du formulaire
const form = ref({
  type: props.maintenance?.type || '',
  date_scheduled: props.maintenance?.date_scheduled ? format(new Date(props.maintenance.date_scheduled), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  technicien_id: props.maintenance?.technicien_id || '',
  equipment_id: props.equipment?._id || props.equipment?.id || '',
  status: props.maintenance?.status || 'Planifiée',
  notes: props.maintenance?.notes || ''
})

const errors = ref({})
const loading = ref(false)

// Types de maintenance
const maintenanceTypes = [
  { value: 'Préventive', label: 'Maintenance préventive' },
  { value: 'Corrective', label: 'Maintenance corrective' },
  { value: 'Calibration', label: 'Calibration' },
  { value: 'Inspection', label: 'Inspection' }
]

// Computed
const minDate = computed(() => {
  return format(new Date(), 'yyyy-MM-dd')
})

const technicians = computed(() => {
  return maintenanceStore.technicians || []
})

// Fetch technicians when component is mounted
onMounted(async () => {
  try {
    await maintenanceStore.fetchTechnicians()
    
    // If technicians are loaded, set the current user as default if they're a technician
    if (maintenanceStore.technicians.length > 0 && !form.value.technicien_id) {
      // Try to find the current user in the technicians list
      const currentUserTech = maintenanceStore.technicians.find(tech => 
        tech.utilisateur?._id === authStore.user?._id || 
        tech._id === authStore.user?._id
      )
      
      if (currentUserTech) {
        form.value.technicien_id = currentUserTech._id
      } else {
        // If current user not found, just use the first technician
        form.value.technicien_id = maintenanceStore.technicians[0]?._id || ''
      }
    }
  } catch (error) {
    console.error('Error fetching technicians:', error)
  }
})

// Méthodes
function getEquipmentIcon(type) {
  const typeLower = (type || '').toLowerCase()
  
  if (typeLower.includes('lab') || typeLower.includes('analyse')) {
    return Microscope
  } else if (typeLower.includes('monitor') || typeLower.includes('écran')) {
    return Monitor
  } else if (typeLower.includes('traitement') || typeLower.includes('treat')) {
    return Syringe
  } else if (typeLower.includes('diag')) {
    return Activity
  } else if (typeLower.includes('system') || typeLower.includes('cpu')) {
    return Cpu
  } else if (typeLower.includes('med')) {
    return Stethoscope
  } else {
    return Monitor
  }
}

function validateForm() {
  errors.value = {}
  
  if (!form.value.type) {
    errors.value.type = 'Veuillez sélectionner un type de maintenance'
  }
  
  if (!form.value.date_scheduled) {
    errors.value.date_scheduled = 'Veuillez sélectionner une date'
  }
  
  if (!form.value.technicien_id) {
    errors.value.technicien_id = 'Veuillez sélectionner un technicien'
  }
  
  if (!form.value.status) {
    errors.value.status = 'Veuillez sélectionner un statut'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const maintenanceData = {
      technicien_id: form.value.technicien_id,
      equipment_id: form.value.equipment_id,
      date_scheduled: form.value.date_scheduled,
      type: form.value.type,
      status: form.value.status,
      notes: form.value.notes
    }
    
    let result
    
    if (props.maintenance?._id) {
      // Update existing maintenance
      result = await maintenanceStore.updateMaintenance(props.maintenance._id, maintenanceData)
      showNotification('Succès', 'Maintenance planifiée avec succès')
    } else {
      // Create new maintenance
      result = await maintenanceStore.scheduleMaintenance(maintenanceData)
      showNotification('Succès', 'Maintenance planifiée avec succès')
    }
    
    emit('submit', result)
    
    // Reset form if not updating
    if (!props.maintenance) {
      form.value = {
        type: '',
        date_scheduled: format(new Date(), 'yyyy-MM-dd'),
        technicien_id: form.value.technicien_id, // Keep the same technician
        equipment_id: props.equipment?._id || props.equipment?.id || '',
        status: 'Planifiée',
        notes: ''
      }
    }
  } catch (error) {
    console.error('Error submitting maintenance:', error)
  } finally {
    loading.value = false
  }
}

function showNotification(title, message, type = 'success') {
  // Nettoyer le timeout précédent si existe
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }

  notification.value = {
    show: true,
    title,
    message,
    type
  }

  // Définir un nouveau timeout
  notificationTimeout = setTimeout(() => {
    notification.value = null
  }, 5000) // Augmenté à 5 secondes pour une meilleure lisibilité
}

onUnmounted(() => {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }
})
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-label.required:after {
  content: " *";
  @apply text-red-500;
}

.form-input,
.form-select,
.form-textarea {
  @apply w-full rounded-lg border-gray-300 dark:border-gray-600
         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
}
</style>