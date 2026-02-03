<template>
  <BaseModal
    title="Planification de maintenance"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- En-tête avec informations de l'équipement -->
      <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <component 
              :is="getCategoryIcon(equipment.category || equipment.type)"
              class="w-6 h-6 text-gray-500"
            />
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ equipment.name || equipment.type }}
            </h3>
            <p class="text-sm text-gray-500">
              Numéro de série: {{ equipment.serialNumber || equipment.numero_serie }}
            </p>
          </div>
        </div>
      </div>

      <!-- Formulaire de planification -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Technicien assigné -->
        <div>
          <label class="form-label required" for="technicien">Technicien assigné</label>
          <select
            id="technicien"
            v-model="form.technicien_id"
            required
            class="form-select"
          >
            <option value="">Sélectionner un technicien</option>
            <option v-for="tech in technicians" :key="tech._id" :value="tech._id">
              {{ tech.utilisateur?.nom || tech.nom || tech.name }}
            </option>
          </select>
        </div>

        <!-- Type de maintenance -->
        <div>
          <label class="form-label required" for="type">Type de maintenance</label>
          <select
            id="type"
            v-model="form.type"
            required
            class="form-select"
          >
            <option value="">Sélectionner un type</option>
            <option value="Préventive">Maintenance préventive</option>
            <option value="Corrective">Maintenance corrective</option>
            <option value="Inspection">Inspection</option>
            <option value="Calibration">Calibration</option>
          </select>
        </div>

        <!-- Date planifiée -->
        <div>
          <label class="form-label required" for="date">Date planifiée</label>
          <input
            id="date"
            v-model="form.date_scheduled"
            type="date"
            required
            class="form-input"
            :min="today"
          />
        </div>

        <!-- Statut -->
        <div>
          <label class="form-label required" for="status">Statut</label>
          <select
            id="status"
            v-model="form.status"
            required
            class="form-select"
          >
            <option value="">Sélectionner un statut</option>
            <option value="Planifiée">Planifiée</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminée</option>
            <option value="Annulée">Annulée</option>
          </select>
        </div>

        <!-- Notes -->
        <div>
          <label class="form-label" for="notes">Notes</label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="3"
            class="form-textarea"
            placeholder="Détaillez les tâches à effectuer..."
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button 
            type="button"
            class="btn btn-outline"
            @click="$emit('close')"
          >
            Annuler
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || maintenanceStore.loading"
          >
            <Loader2Icon 
              v-if="isSubmitting || maintenanceStore.loading"
              class="w-4 h-4 mr-2 animate-spin"
            />
            Planifier
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { format } from 'date-fns'
import { 
  BeakerIcon,
  Cpu as CpuIcon,
  Wrench as ToolIcon,
  Loader2 as Loader2Icon
} from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  equipment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

const maintenanceStore = useMaintenanceStore()
const authStore = useAuthStore()
const isSubmitting = ref(false)
const today = format(new Date(), 'yyyy-MM-dd')
// Update the technician selection part
// Get technicians from the store
const technicians = computed(() => maintenanceStore.technicians)

// Initialize form with default values
const form = ref({
  technicien_id: '', // Remove the authStore.user?._id reference
  equipment_id: props.equipment?._id || props.equipment?.id || '',
  date_scheduled: today,
  type: '',
  status: 'Planifiée',
  notes: ''
})

// Fetch technicians when component is mounted
onMounted(async () => {
  try {
    await maintenanceStore.fetchTechnicians()
    
    // If technicians are loaded, set the current user as default if they're a technician
    if (maintenanceStore.technicians.length > 0) {
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

function getCategoryIcon(category) {
  const categoryLower = (category || '').toLowerCase()
  if (categoryLower.includes('lab') || categoryLower.includes('analyse')) {
    return BeakerIcon
  } else if (categoryLower.includes('monitor') || categoryLower.includes('cpu')) {
    return CpuIcon
  } else {
    return ToolIcon
  }
}

async function handleSubmit() {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    // Prepare data for API
    const maintenanceData = {
      technicien_id: form.value.technicien_id,
      equipment_id: form.value.equipment_id,
      date_scheduled: form.value.date_scheduled,
      type: form.value.type,
      status: form.value.status,
      notes: form.value.notes
    }
    
    // Schedule maintenance using the store
    const result = await maintenanceStore.scheduleMaintenance(maintenanceData)
    
    // Emit save event with the result
    await emit('save', result)
  } catch (error) {
    console.error('Error scheduling maintenance:', error)
  } finally {
    isSubmitting.value = false
  }
}
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
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}
</style>