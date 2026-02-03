<template>
  <Teleport to="body">
    <Modal
      v-if="modelValue"
      :model-value="modelValue"
      title="Planifier une maintenance"
      @close="$emit('update:modelValue', false)"
    >
      <div class="space-y-6">
        <!-- Sélection de l'équipement -->
        <div>
          <label class="form-label">Équipement</label>
          <select 
            v-model="form.equipmentId"
            class="form-select"
            :class="{ 'border-red-500': errors.equipmentId }"
          >
            <option value="">Sélectionner un équipement</option>
            <option 
              v-for="equipment in availableEquipments" 
              :key="equipment.id"
              :value="equipment.id"
            >
              {{ equipment.name }} ({{ equipment.department }})
            </option>
          </select>
          <p v-if="errors.equipmentId" class="mt-1 text-sm text-red-500">
            {{ errors.equipmentId }}
          </p>
        </div>

        <!-- Type de maintenance -->
        <div>
          <label class="form-label">Type de maintenance</label>
          <select 
            v-model="form.type"
            class="form-select"
            :class="{ 'border-red-500': errors.type }"
          >
            <option value="">Sélectionner un type</option>
            <option value="preventive">Maintenance préventive</option>
            <option value="corrective">Maintenance corrective</option>
            <option value="calibration">Calibration</option>
            <option value="inspection">Inspection</option>
            <option value="upgrade">Mise à niveau</option>
          </select>
          <p v-if="errors.type" class="mt-1 text-sm text-red-500">
            {{ errors.type }}
          </p>
        </div>

        <!-- Date et heure -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Date</label>
            <input 
              type="date"
              v-model="form.date"
              class="form-input"
              :class="{ 'border-red-500': errors.date }"
              :min="minDate"
            />
            <p v-if="errors.date" class="mt-1 text-sm text-red-500">
              {{ errors.date }}
            </p>
          </div>
          <div>
            <label class="form-label">Heure</label>
            <input 
              type="time"
              v-model="form.time"
              class="form-input"
              :class="{ 'border-red-500': errors.time }"
            />
            <p v-if="errors.time" class="mt-1 text-sm text-red-500">
              {{ errors.time }}
            </p>
          </div>
        </div>

        <!-- Durée estimée -->
        <div>
          <label class="form-label">Durée estimée (heures)</label>
          <input 
            type="number"
            v-model.number="form.duration"
            class="form-input"
            :class="{ 'border-red-500': errors.duration }"
            min="0.5"
            step="0.5"
          />
          <p v-if="errors.duration" class="mt-1 text-sm text-red-500">
            {{ errors.duration }}
          </p>
        </div>

        <!-- Technicien assigné -->
        <div>
          <label class="form-label">Technicien assigné</label>
          <select 
            v-model="form.technicianId"
            class="form-select"
            :class="{ 'border-red-500': errors.technicianId }"
          >
            <option value="">Sélectionner un technicien</option>
            <option 
              v-for="tech in availableTechnicians" 
              :key="tech.id"
              :value="tech.id"
            >
              {{ tech.name }} ({{ tech.speciality }})
            </option>
          </select>
          <p v-if="errors.technicianId" class="mt-1 text-sm text-red-500">
            {{ errors.technicianId }}
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
      </div>

      <!-- Actions -->
      <template #actions>
        <button 
          class="btn btn-outline"
          @click="$emit('update:modelValue', false)"
        >
          Annuler
        </button>
        <button 
          class="btn btn-primary ml-3"
          :disabled="loading"
          @click="handleSubmit"
        >
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          Planifier
        </button>
      </template>
    </Modal>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { format, addDays } from 'date-fns'
import { Loader2 } from 'lucide-vue-next'
import Modal from '@/components/common/Modal.vue'

const props = defineProps({
  modelValue: Boolean,
  equipments: {
    type: Array,
    default: () => []
  },
  technicians: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

// État du formulaire
const form = ref({
  equipmentId: '',
  type: '',
  date: '',
  time: '',
  duration: 1,
  technicianId: '',
  notes: ''
})

const errors = ref({})
const loading = ref(false)

// Computed
const minDate = computed(() => {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd')
})

const availableEquipments = computed(() => {
  return props.equipments.filter(e => e.status !== 'maintenance')
})

const availableTechnicians = computed(() => {
  return props.technicians.filter(t => t.available)
})

// Gestion des écouteurs d'événements
let resizeListener = null

onMounted(() => {
  // Initialisation sécurisée
  nextTick(() => {
    resizeListener = () => {
      // Logique de redimensionnement si nécessaire
    }
    window.addEventListener('resize', resizeListener)
  })
})

onBeforeUnmount(() => {
  // Nettoyage des écouteurs
  if (resizeListener) {
    window.removeEventListener('resize', resizeListener)
  }
})

// Réinitialisation du formulaire lors de la fermeture
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    // Réinitialiser le formulaire
    form.value = {
      equipmentId: '',
      type: '',
      date: '',
      time: '',
      duration: 1,
      technicianId: '',
      notes: ''
    }
    errors.value = {}
  }
})

// Méthodes
function validateForm() {
  errors.value = {}
  
  if (!form.value.equipmentId) {
    errors.value.equipmentId = 'Veuillez sélectionner un équipement'
  }
  
  if (!form.value.type) {
    errors.value.type = 'Veuillez sélectionner un type de maintenance'
  }
  
  if (!form.value.date) {
    errors.value.date = 'Veuillez sélectionner une date'
  }
  
  if (!form.value.time) {
    errors.value.time = 'Veuillez sélectionner une heure'
  }
  
  if (!form.value.duration || form.value.duration < 0.5) {
    errors.value.duration = 'La durée doit être d\'au moins 30 minutes'
  }
  
  if (!form.value.technicianId) {
    errors.value.technicianId = 'Veuillez sélectionner un technicien'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    // Formatage des données
    const maintenanceData = {
      ...form.value,
      scheduledDate: `${form.value.date}T${form.value.time}:00`,
      status: 'scheduled'
    }
    
    emit('submit', maintenanceData)
    emit('update:modelValue', false)
    
    // Réinitialisation du formulaire
    form.value = {
      equipmentId: '',
      type: '',
      date: '',
      time: '',
      duration: 1,
      technicianId: '',
      notes: ''
    }
  } catch (error) {
    console.error('Error scheduling maintenance:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select,
.form-textarea {
  @apply w-full rounded-lg border-gray-300 dark:border-gray-600
         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
}
</style> 