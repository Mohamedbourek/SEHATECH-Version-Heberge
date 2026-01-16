<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Patient -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Nom du patient</label>
          <input
            type="text"
            v-model="form.patientName"
            class="input"
            placeholder="Nom complet du patient"
            :readonly="!!selectedPatient"
            required
          />
          <p v-if="selectedPatient" class="mt-1 text-sm text-primary-600">
            Patient sélectionné: {{ selectedPatient.utilisateur?.nom }} {{ selectedPatient.utilisateur?.prenom }}
          </p>
        </div>
        <div>
          <label class="label">Rechercher un patient</label>
          <PatientSearch
            v-model="form.patientId"
            :selectedPatient="selectedPatient"
            @select="handlePatientSelect"
          />
        </div>
      </div>
    </div>

    <!-- Date et heure -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label">Date</label>
        <input
          type="date"
          v-model="form.date"
          class="input"
          required
        >
      </div>
      <div>
        <label class="label">Heure</label>
        <select
          v-model="form.time"
          class="input"
          required
        >
          <option v-for="time in availableTimeSlots" :key="time" :value="time">
            {{ time }}
          </option>
        </select>
      </div>
    </div>

    <!-- Type de consultation -->
    <div>
      <label class="label">Type de consultation</label>
      <select
        v-model="form.type"
        class="input"
        required
      >
        <option value="routine">Consultation de routine</option>
        <option value="followup">Suivi</option>
        <option value="emergency">Urgence</option>
      </select>
    </div>

    <!-- Durée -->
    <div>
      <label class="label">Durée</label>
      <select
        v-model="form.duration"
        class="input"
        required
      >
        <option value="15">15 minutes</option>
        <option value="30">30 minutes</option>
        <option value="45">45 minutes</option>
        <option value="60">1 heure</option>
      </select>
    </div>

    <!-- Notes -->
    <div>
      <label class="label">Notes</label>
      <textarea
        v-model="form.notes"
        class="input"
        rows="3"
        placeholder="Notes supplémentaires..."
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
      >
        Confirmer
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import PatientSearch from '../PatientSearch.vue'
import { usePatientStore } from '@/stores/patientStore'

const patientStore = usePatientStore()

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  availableTimeSlots: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit', 'cancel'])

const selectedPatient = ref(null)

const form = ref({
  patientId: props.initialData?.patientId || '',
  patientName: props.initialData?.patientName || '',
  date: props.initialData?.date || '',
  time: props.initialData?.time || '',
  type: props.initialData?.type || 'routine',
  duration: props.initialData?.duration || '30',
  notes: props.initialData?.notes || ''
})

// Si nous avons des données initiales avec un ID patient, charger les détails du patient
async function loadInitialPatient() {
  if (props.initialData?.patientId) {
    try {
      console.log('Chargement des données du patient initial:', props.initialData.patientId)
      // Essayer de charger les détails complets du patient
      const patients = await patientStore.searchPatients(props.initialData.patientName || '')
      const foundPatient = patients.find(p => p._id === props.initialData.patientId)
      
      if (foundPatient) {
        console.log('Patient trouvé dans les résultats de recherche:', foundPatient)
        selectedPatient.value = foundPatient
        form.value.patientName = `${foundPatient.utilisateur?.nom || ''} ${foundPatient.utilisateur?.prenom || ''}`.trim()
      } else {
        // Si nous ne trouvons pas le patient, utiliser les données initiales
        console.log('Patient non trouvé, utilisation des données initiales')
        selectedPatient.value = {
          _id: props.initialData.patientId,
          patientName: props.initialData.patientName,
          utilisateur: {
            nom: props.initialData.patientName.split(' ')[0] || '',
            prenom: props.initialData.patientName.split(' ')[1] || ''
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du patient:', error)
      // Fallback sur les données initiales basiques
      selectedPatient.value = {
        _id: props.initialData.patientId,
        patientName: props.initialData.patientName
      }
    }
  }
}

onMounted(() => {
  loadInitialPatient()
})

function handlePatientSelect(patient) {
  console.log('Patient sélectionné dans le formulaire:', patient)
  selectedPatient.value = patient
  form.value.patientId = patient._id
  
  // S'assurer que nous avons les données utilisateur
  if (patient.utilisateur) {
    form.value.patientName = `${patient.utilisateur.nom || ''} ${patient.utilisateur.prenom || ''}`.trim()
    console.log('Nom du patient défini:', form.value.patientName)
  } else {
    form.value.patientName = patient.patientName || `Patient ID: ${patient._id}`
  }
}

// Observer les changements dans selectedPatient
watch(() => selectedPatient.value, (newVal) => {
  if (newVal) {
    console.log('selectedPatient a changé:', newVal)
  }
}, { deep: true })

function formatDate(date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

function handleSubmit() {
  emit('submit', { ...form.value })
}
</script>

<style scoped>
.label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.input {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white sm:text-sm;
}

.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-outline {
  @apply border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}
</style>
