<template>
  <BaseModal :title="isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'" @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Section Patient -->
      <div>
        <label class="form-label" for="patient-search">Patient</label>
        <div class="space-y-4">
          <!-- Recherche de patient -->
          <div class="relative" v-if="!form.patient_id">
            <input id="patient-search" v-model="searchQuery" type="text" class="form-input pl-10"
              placeholder="Rechercher un patient..." @focus="showResults = true" @blur="handleSearchBlur"
              @input="searchPatients" required />
            <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/3 -translate-y-1/2" />
            <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 class="w-4 h-4 animate-spin text-primary-500" />
            </div>
            <!-- Liste déroulante des patients recherchés -->
            <div v-if="showResults && filteredPatients?.length"
              class="absolute z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mt-1 max-h-48 overflow-y-auto w-full">
              <ul>
                <li v-for="patient in filteredPatients" :key="patient.id" @mousedown.prevent="selectPatient(patient)"
                  class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {{ `${patient.nom} ${patient.prenom}` }}
                </li>
              </ul>
            </div>
            <!-- Lien pour créer un nouveau patient en cas de non-correspondance -->
            <div v-if="showResults && searchQuery && filteredPatients?.length === 0" class="mt-2 text-sm text-gray-500">
              Aucun patient trouvé.
              <RouterLink to="/users" class="text-primary-500 underline">
                Créer un nouveau patient
              </RouterLink>
            </div>
            <p class="mt-1 text-sm text-gray-500">
              Commencez à taper le nom du patient pour le rechercher
            </p>
          </div>
          <!-- Si un patient est sélectionné, afficher son nom -->
          <div v-else class="p-2 border rounded bg-gray-50 dark:bg-gray-700">
            Patient sélectionné :
            <span class="font-medium">
              {{ selectedPatient?.utilisateur?.nom || selectedPatient?.nom || '' }} {{
    selectedPatient?.utilisateur?.prenom || selectedPatient?.prenom || '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Section Médecin -->
      <div>
        <label class="form-label" for="doctor">Médecin</label>
        <select id="doctor" v-model="form.medecin_id" required class="form-select">
          <option value="">Sélectionner un médecin</option>
          <option v-for="doctor in doctors" :key="doctor._id" :value="doctor._id">
            Dr. {{ doctor.utilisateur.nom }} {{ doctor.utilisateur.prenom }} - {{ doctor.specialite }}
          </option>

        </select>
      </div>

      <!-- Date et Heure -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label" for="date">Date</label>
          <input id="date" v-model="form.date" type="date" required class="form-input" :min="minDate" />
        </div>
        <div>
          <label class="form-label" for="time">Heure</label>
          <select id="time" v-model="form.time" required class="form-select">
            <option value="">Sélectionner une heure</option>
            <option v-for="time in availableTimes" :key="time" :value="time">
              {{ time }}
            </option>
          </select>
        </div>
      </div>

      <!-- Type de rendez-vous -->
      <div>
        <label class="form-label" for="type">Type de rendez-vous</label>
        <select id="type" v-model="form.type" required class="form-select">
          <option value="">Sélectionner un type</option>
          <option value="CONSULTATION">Consultation</option>
          <option value="EXAMEN">Examen</option>
          <option value="SUIVI">Suivi</option>
          <option value="URGENCE">Urgence</option>
        </select>
      </div>

      <!-- Durée -->
      <div>
        <label class="form-label" for="duration">Durée</label>
        <select id="duration" v-model="form.duration" required class="form-select">
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 heure</option>
        </select>
      </div>

      <!-- Statut (en mode édition) -->
      <div v-if="isEditing">
        <label class="form-label" for="status">Statut</label>
        <p class="text-xs text-gray-500 mb-1">(Les valeurs sont en minuscules pour la validation backend)</p>
        <select id="status" v-model="form.statut" required class="form-select">
          <option value="planifie">Planifié</option>
          <option value="confirme">Confirmé</option>
          <option value="annule">Annulé</option>
          <option value="termine">Terminé</option>
        </select>
      </div>

      <!-- Notes -->
      <div>
        <label class="form-label" for="notes">Notes</label>
        <textarea id="notes" v-model="form.notes" rows="3" class="form-textarea"
          placeholder="Notes additionnelles..."></textarea>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isSubmitting">
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting || !isFormValid">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          {{ isEditing ? 'Mettre à jour' : 'Créer' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format, addMinutes, parse, isAfter } from 'date-fns'
import { Loader2 } from 'lucide-vue-next'
import { Search } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { usePatientStore } from '@/stores/patients'
import { useDebounce } from '@vueuse/core'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'

const props = defineProps({
  appointment: {
    type: Object,
    default: null
  },
  doctors: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const isSubmitting = ref(false)
const selectedPatient = ref(null)
const searchQuery = ref('')
const showResults = ref(false)
const filteredPatients = ref([])
const isSearching = ref(false)

const form = ref({
  patient_id: null,
  medecin_id: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  time: '09:00',
  type: '',
  duration: '30',
  notes: '',
  statut: 'planifie'
})

const isEditing = computed(() => !!props.appointment)
const minDate = computed(() => format(new Date(), 'yyyy-MM-dd'))

const isFormValid = computed(() => {
  return form.value.patient_id &&
    form.value.medecin_id &&
    form.value.date &&
    form.value.time &&
    form.value.type &&
    form.value.duration
})

const availableTimes = computed(() => {
  const times = []
  const start = parse('08:00', 'HH:mm', new Date())
  const end = parse('18:00', 'HH:mm', new Date())
  let current = start
  while (isAfter(end, current)) {
    times.push(format(current, 'HH:mm'))
    current = addMinutes(current, 15)
  }
  return times
})

const patientStore = usePatientStore()

const searchPatients = useDebounce(async () => {
  if (searchQuery.value.length < 2) {
    filteredPatients.value = []
    return
  }
  isSearching.value = true
  try {
    const results = await patientStore.searchPatients(searchQuery.value.trim())
    console.log("Résultats de la recherche :", results)
    filteredPatients.value = results.map(patient => ({
      id: patient._id,
      nom: patient.nom,       // Déjà renseigné par searchPatients
      prenom: patient.prenom  // Déjà renseigné par searchPatients
    }))
  } catch (error) {
    console.error('Erreur lors de la recherche :', error)
    filteredPatients.value = []
  } finally {
    isSearching.value = false
  }
}, 300)

const selectPatient = (patient) => {
  console.log("Patient sélectionné :", patient)
  selectedPatient.value = patient
  form.value.patient_id = patient.id
  console.log("form.patient_id =", form.value.patient_id)
  searchQuery.value = `${patient.nom} ${patient.prenom}`
  showResults.value = false
}


const handleSearchBlur = () => {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

watch(() => props.appointment, async (newVal) => {
  console.log("Changement de l'appointment :", newVal)
  if (newVal) {
    const dateObj = new Date(newVal.date)
    form.value = {
      ...newVal,
      medecin_id: newVal.medecin?._id || newVal.medecin?.id || '',
      date: format(dateObj, 'yyyy-MM-dd'),
      time: format(dateObj, 'HH:mm'),
      duration: newVal.duration || '30',
      statut: newVal.statut || 'planifie'
    }

    if (newVal.patient) {
      console.log("Données complètes du patient présentes dans l'appointment.")
      selectedPatient.value = {
        id: newVal.patient._id || newVal.patient.id,
        nom: newVal.patient.utilisateur?.nom || newVal.patient.nom,
        prenom: newVal.patient.utilisateur?.prenom || newVal.patient.prenom
      }
      form.value.patient_id = selectedPatient.value?.id || null
      searchQuery.value = newVal.patient.utilisateur
        ? `${newVal.patient.utilisateur.nom} ${newVal.patient.utilisateur.prenom}`
        : newVal.patient.nom
    } else if (newVal.patient_id) {
      console.log("Patient incomplet dans l'appointment, récupération des données complètes pour l'ID :", newVal.patient_id)
      try {
        // Ici, on utilise fetchPatients avec un filtre par _id
        const fullPatients = await patientStore.fetchPatients({ _id: newVal.patient_id })
        const patientData = Array.isArray(fullPatients) ? fullPatients[0] : fullPatients
        console.log("Données complètes récupérées :", patientData)
        selectedPatient.value = {
          id: patientData._id || patientData.id,
          nom: patientData.nom,
          prenom: patientData.prenom
        }
        form.value.patient_id = selectedPatient.value?.id
        searchQuery.value = `${selectedPatient.value.nom} ${selectedPatient.value.prenom}`
      } catch (err) {
        console.error("Erreur lors du chargement complet du patient :", err)
      }
    } else {
      selectedPatient.value = null
      searchQuery.value = ''
    }
  }
}, { immediate: true })

const handleSubmit = async () => {
  console.log("Form Valid:", isFormValid.value, form.value)
  if (!isFormValid.value) return

  isSubmitting.value = true
  try {
    // S'assurer que la date est au bon format
    const [year, month, day] = form.value.date.split('-')
    const [hours, minutes] = form.value.time.split(':')
    
    // Créer la date en UTC
    const dateTime = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    ))
    
    // Vérifier si la date est dans le futur
    if (dateTime <= new Date()) {
      throw new Error('La date du rendez-vous doit être dans le futur')
    }

    const submitData = {
      ...(isEditing.value ? { id: props.appointment.id } : {}),
      patient_id: form.value.patient_id,
      medecin_id: form.value.medecin_id,
      date: dateTime.toISOString(),
      type: form.value.type,
      duration: parseInt(form.value.duration),
      notes: form.value.notes || '',
      statut: isEditing.value ? form.value.statut : 'planifie'
    }

    console.log('Données à soumettre:', submitData)
    emit('submit', submitData)
    emit('close')
  } catch (error) {
    console.error('Erreur lors de la soumission :', error)
    const toast = useToast()
    toast.error(error.message || 'Erreur lors de la soumission du formulaire')
    isSubmitting.value = false
    return
  } finally {
    isSubmitting.value = false
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
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white sm:text-sm;
}
</style>
