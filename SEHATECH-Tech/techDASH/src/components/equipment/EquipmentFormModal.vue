<template>
  <BaseModal
    :title="equipment ? 'Modifier l\'équipement' : 'Ajouter un équipement'"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Informations de base -->
      <div class="space-y-4">
        <div class="form-group">
          <label class="form-label required">Type d'équipement</label>
          <input
            v-model="form.type"
            type="text"
            class="form-input"
            required
          />
        </div>

       

        <div class="form-group">
          <label class="form-label required">Numéro de série</label>
          <input
            v-model="form.numero_serie"
            type="text"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label required">Service</label>
          <select v-model="form.service" class="form-select" required>
            <option value="">Sélectionner un service</option>
            <option value="Cardiologie">Cardiologie</option>
            <option value="Radiologie">Radiologie</option>
            <option value="Laboratoire">Laboratoire</option>
            <option value="Urgences">Urgences</option>
            <option value="Réanimation">Réanimation</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Location</label>
          <select v-model="form.chambre" class="form-select" required>
            <option value="">Sélectionner une chambre</option>
            <option v-for="room in rooms" :key="room._id" :value="room._id">
              {{ room.numero }} 
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label required">État</label>
          <select v-model="form.etat" class="form-select" required>
            <option value="">Sélectionner un état</option>
            <option value="Fonctionnel">Fonctionnel</option>
            <option value="maintenance">En maintenance</option>
            <option value="Disponible">Disponible</option>
            <option value="En panne">En panne</option>
          </select>
        </div>
      </div>

      <!-- Maintenance -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium">Configuration de maintenance</h3>
        
        <div class="form-group">
          <label class="form-label required">Fréquence de maintenance (jours)</label>
          <input
            v-model.number="form.frequence_maintenance"
            type="number"
            min="1"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Instructions de maintenance</label>
          <textarea
            v-model="form.instructions_maintenance"
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Prochain contrôle</label>
          <input
            v-model="form.prochainControle"
            type="date"
            class="form-input"
          />
        </div>
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
          :disabled="isSubmitting"
        >
          <Loader2Icon 
            v-if="isSubmitting"
            class="w-4 h-4 mr-2 animate-spin"
          />
          {{ equipment ? 'Mettre à jour' : 'Ajouter' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Loader2Icon } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import apiClient from '@/services/axios'

const props = defineProps({
  equipment: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const isSubmitting = ref(false)
const rawRooms = ref([])

// Filter and process rooms to handle unusual data format
const rooms = computed(() => {
  if (!Array.isArray(rawRooms.value)) {
    console.warn('rawRooms is not an array:', rawRooms.value)
    return []
  }
  
  return rawRooms.value.filter(room => {
    // Filter out rooms with $code properties
    const isValidRoom = typeof room.numero === 'string' && 
                        typeof room._id === 'string' &&
                        !room.numero.$code;
    
    // Additional filtering based on equipment type
    if (!isValidRoom) return false;
    
    // Filter rooms based on equipment type
    const equipmentType = form.value.type.toLowerCase();
    
    // Logic to match equipment types with appropriate room types
    if (equipmentType.includes('scanner') || equipmentType.includes('irm') || equipmentType.includes('radiologie')) {
      return room.type === 'technique' || room.type === 'examen';
    }
    
    if (equipmentType.includes('moniteur') || equipmentType.includes('respirateur')) {
      return room.type === 'chambre' || room.type === 'soins' || room.type === 'réanimation';
    }
    
    if (equipmentType.includes('laboratoire') || equipmentType.includes('analyse')) {
      return room.type === 'laboratoire';
    }
    
    // If no specific match, show all valid rooms
    return true;
  });
});

// Fetch rooms from API
async function fetchRooms() {
  try {
    const token = localStorage.getItem('Token_TECHNICIEN')
    if (!token) {
      console.error('Authentication required')
      return
    }
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const response = await apiClient.get('/chambres')
    console.log('Raw room data:', response.data)
    
    // Ensure we're setting an array
    if (Array.isArray(response.data)) {
      rawRooms.value = response.data
    } else if (response.data && Array.isArray(response.data.data)) {
      rawRooms.value = response.data.data
    } else {
      console.warn('Unexpected API response format:', response.data)
      rawRooms.value = []
    }
    
    console.log('Filtered rooms:', rooms.value)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    rawRooms.value = []
  }
}

onMounted(() => {
  fetchRooms()
})

// Format date for input field
function formatDateForInput(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}
// Initialiser le formulaire avec les données de l'équipement ou des valeurs par défaut
const form = ref({
  type: props.equipment?.type || props.equipment?.name || '',
  model: props.equipment?.model || '',
  numero_serie: props.equipment?.numero_serie || props.equipment?.serialNumber || '',
  service: props.equipment?.service || props.equipment?.department || '',
  chambre: props.equipment?.chambre?._id || '',
  etat: props.equipment?.etat || props.equipment?.status || 'Fonctionnel',
  frequence_maintenance: props.equipment?.frequence_maintenance || props.equipment?.maintenanceInterval || 30,
  instructions_maintenance: props.equipment?.instructions_maintenance || props.equipment?.maintenanceInstructions || '',
  prochainControle: formatDateForInput(props.equipment?.prochainControle || props.equipment?.nextCheck)
})

async function handleSubmit() {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    // Find the selected room
    const selectedRoom = rooms.value.find(room => room._id === form.value.chambre)
    
    // Prepare data for API
    const formData = {
      ...form.value,
      // Include both API and local field names for compatibility
      name: form.value.type,
      serialNumber: form.value.numero_serie,
      status: form.value.etat,
      department: form.value.service,
      maintenanceInterval: form.value.frequence_maintenance,
      maintenanceInstructions: form.value.instructions_maintenance,
      nextCheck: form.value.prochainControle,
      // Include room information with the correct field name for API
      chambre_id: form.value.chambre,
      chambre_numero: selectedRoom?.numero || ''
    }
    
    console.log('Submitting form with data:', formData)
    
    await emit('save', {
      _id: props.equipment?._id,
      id: props.equipment?.id,
      ...formData
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-label.required:after {
  content: " *";
  @apply text-red-500;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600
         shadow-sm focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:text-white;
}
</style>