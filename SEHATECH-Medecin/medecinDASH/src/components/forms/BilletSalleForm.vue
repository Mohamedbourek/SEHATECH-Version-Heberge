<template>
  <Modal 
    :title="initialData && initialData._id ? 'Modifier la demande de billet de salle' : 'Nouvelle demande de billet de salle'"
    size="form"
    @close="handleClose"
  >
    <form @submit.prevent="submit" class="space-y-8">
      <!-- Section Patient -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <UserCircle class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Patient</h4>
          </div>
        </div>
        <div class="form-content">
          <div class="form-group relative">
            <label class="form-label required">Patient</label>
            <div class="flex space-x-3">
              <div class="flex-1 relative">
                <input 
                  type="text"
                  v-model="patientName"
                  class="form-input"
                  placeholder="Nom du patient"
                  disabled
                  required
                />
              </div>
              <button 
                type="button"
                class="btn btn-secondary flex items-center"
                @click="showPatientSearch = true"
                :disabled="!!initialData"
              >
                <Search class="w-4 h-4 mr-2" />
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Motif d'hospitalisation -->
      <div class="form-group">
        <label class="form-label required">Motif d'hospitalisation</label>
        <textarea 
          v-model="form.motif" 
          class="form-textarea" 
          rows="3"
          required
          placeholder="Raison de la demande d'hospitalisation..."
        ></textarea>
      </div>

      <!-- Date de fin prévue -->
      <div class="form-group">
        <label class="form-label">Date de fin prévue</label>
        <input 
          type="date" 
          v-model="form.dateFin" 
          class="form-input"
          :min="minDate"
        />
      </div>

      <!-- Détails supplémentaires -->
      <div class="form-group">
        <label class="form-label">Détails médicaux</label>
        <div class="space-y-3">
          <div v-for="(detail, index) in form.details" :key="index" class="flex items-start space-x-2">
            <input 
              type="text" 
              v-model="form.details[index]" 
              class="form-input flex-1" 
              placeholder="Détail médical important..."
            />
            <button 
              type="button" 
              @click="removeDetail(index)" 
              class="btn-icon text-red-500"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <button 
            type="button" 
            @click="addDetail" 
            class="btn btn-secondary inline-flex items-center text-sm"
          >
            <Plus class="w-4 h-4 mr-1" />
            Ajouter un détail
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button 
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
        >
          Annuler
        </button>
        <button 
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid"
        >
          {{ initialData && initialData._id ? 'Mettre à jour' : 'Enregistrer' }}
        </button>
      </div>
    </form>

    <!-- Modal de recherche patient -->
    <PatientSearchModal
      v-if="showPatientSearch"
      @close="showPatientSearch = false"
      @select="handlePatientSelect"
    />
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { UserCircle, Search, Plus, Trash2 } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import { format, addDays } from 'date-fns'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['submit', 'close'])

const showPatientSearch = ref(false)
const patientName = ref('')
const patientId = ref('')
const dossierId = ref('')

const form = ref({
  motif: '',
  dateFin: '',
  details: []
})

// Date minimum pour la date de fin (aujourd'hui)
const minDate = computed(() => {
  return format(new Date(), 'yyyy-MM-dd')
})

// Initialiser le formulaire avec les données existantes si disponibles
onMounted(() => {
  if (props.initialData) {
    form.value.motif = props.initialData.motif || ''
    form.value.dateFin = props.initialData.dateFin ? format(new Date(props.initialData.dateFin), 'yyyy-MM-dd') : ''
    form.value.details = props.initialData.details || []
    
    // Récupérer les informations du patient
    if (props.initialData.patient) {
      patientName.value = `${props.initialData.patient.utilisateur?.nom || ''} ${props.initialData.patient.utilisateur?.prenom || ''}`.trim()
      patientId.value = props.initialData.patient_id || props.initialData.patient?._id || ''
    }
  }
})

const isFormValid = computed(() => {
  return form.value.motif && patientId.value
})

function handlePatientSelect(patient) {
  patientName.value = `${patient.utilisateur?.nom || ''} ${patient.utilisateur?.prenom || ''}`.trim()
  patientId.value = patient._id
  dossierId.value = patient.dossier_medical?._id || ''
  showPatientSearch.value = false
}

function handleClose() {
  emit('close')
}

function addDetail() {
  form.value.details.push('')
}

function removeDetail(index) {
  form.value.details.splice(index, 1)
}

function submit() {
  if (!isFormValid.value) return
  
  // Filtrer les détails vides
  const filteredDetails = form.value.details.filter(detail => detail.trim() !== '')
  
  // Préparer les données à envoyer
  const formData = {
    patient_id: patientId.value,
    motif: form.value.motif,
    details: filteredDetails,
    dateFin: form.value.dateFin ? new Date(form.value.dateFin).toISOString() : null
  }
  
  // Si c'est une mise à jour, ajouter l'ID
  if (props.initialData && props.initialData._id) {
    formData._id = props.initialData._id
  }
  
  console.log('Données du billet de salle à soumettre:', formData)
  emit('submit', formData)
}
</script>

<style scoped>
.form-section {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
         dark:border-gray-700 p-6 space-y-6;
}

.form-header {
  @apply mb-4;
}

.form-title {
  @apply text-lg font-medium text-gray-900 dark:text-white;
}

.form-content {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-label.required::after {
  content: "*";
  @apply text-red-500 ml-1;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}

.btn-icon {
  @apply p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
         transition-colors duration-200;
}

.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg 
         focus:outline-none focus:ring-2 focus:ring-offset-2 
         disabled:opacity-50 dark:focus:ring-offset-gray-900;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 
         focus:ring-primary-500 dark:focus:ring-primary-400;
}

.btn-secondary {
  @apply text-gray-700 dark:text-gray-300 hover:bg-gray-100 
         dark:hover:bg-gray-700;
}
</style> 