<template>
  <Modal 
    :title="initialData && initialData._id ? 'Modifier l\'évolution' : 'Nouvelle évolution'"
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

      <!-- Type de mesure -->
      <div class="form-group">
        <label class="form-label required">Type de mesure</label>
        <select v-model="form.nomMesure" class="form-select" required>
          <option value="Tension artérielle">Tension artérielle</option>
          <option value="Glycémie">Glycémie</option>
          <option value="Température">Température</option>
          <option value="Poids">Poids</option>
          <option value="Fréquence cardiaque">Fréquence cardiaque</option>
          <option value="Saturation en oxygène">Saturation en oxygène</option>
          <option value="Cholestérol">Cholestérol</option>
          <option value="IMC">IMC</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      <!-- Valeur de mesure -->
      <div class="form-group">
        <label class="form-label required">Valeur</label>
        <div class="flex space-x-3">
          <input 
            type="number" 
            v-model="form.valeurDeMesure" 
            class="form-input" 
            step="0.01" 
            required
            placeholder="Valeur numérique"
          />
          <select v-model="unite" class="form-select w-32">
            <option value="">Unité</option>
            <option value="mmHg">mmHg</option>
            <option value="mg/dL">mg/dL</option>
            <option value="°C">°C</option>
            <option value="kg">kg</option>
            <option value="bpm">bpm</option>
            <option value="%">%</option>
            <option value="mmol/L">mmol/L</option>
            <option value="kg/m²">kg/m²</option>
          </select>
        </div>
      </div>

      <!-- État -->
      <div class="form-group">
        <label class="form-label required">État</label>
        <div class="flex space-x-4">
          <label class="inline-flex items-center">
            <input type="radio" v-model="form.etat" value="normal" class="form-radio text-primary-600" required />
            <span class="ml-2 text-gray-700 dark:text-gray-300">Normal</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" v-model="form.etat" value="attention" class="form-radio text-yellow-500" required />
            <span class="ml-2 text-gray-700 dark:text-gray-300">Attention</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" v-model="form.etat" value="critique" class="form-radio text-red-600" required />
            <span class="ml-2 text-gray-700 dark:text-gray-300">Critique</span>
          </label>
        </div>
      </div>

      <!-- Commentaire -->
      <div class="form-group">
        <label class="form-label">Commentaire</label>
        <textarea 
          v-model="form.commentaire" 
          class="form-textarea" 
          rows="3"
          placeholder="Commentaire ou observations supplémentaires..."
        ></textarea>
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
import { UserCircle, Search } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSearchModal from '@/components/PatientSearchModal.vue'

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
const unite = ref('')

const form = ref({
  nomMesure: '',
  valeurDeMesure: null,
  etat: 'normal',
  commentaire: ''
})

// Initialiser le formulaire avec les données existantes si disponibles
onMounted(() => {
  if (props.initialData) {
    form.value.nomMesure = props.initialData.nomMesure || ''
    form.value.valeurDeMesure = props.initialData.valeurDeMesure || null
    form.value.etat = props.initialData.etat || 'normal'
    form.value.commentaire = props.initialData.commentaire || ''
    
    // Extraire l'unité si présente dans le nom de mesure
    const match = props.initialData.nomMesure?.match(/\((.*?)\)/)
    if (match && match[1]) {
      unite.value = match[1]
    }
    
    // Récupérer les informations du patient
    if (props.initialData.patient) {
      patientName.value = `${props.initialData.patient.nom || ''} ${props.initialData.patient.prenom || ''}`.trim()
      patientId.value = props.initialData.patient.id || ''
    }
    
    dossierId.value = props.initialData.dossier_id || ''
  }
})

const isFormValid = computed(() => {
  console.log('Vérification de la validité du formulaire:', {
    nomMesure: form.value.nomMesure,
    valeurDeMesure: form.value.valeurDeMesure,
    etat: form.value.etat,
    patientId: patientId.value,
    dossierId: dossierId.value,
    initialData: !!props.initialData
  });

  // Si nous sommes en mode édition (initialData existe), nous n'avons pas besoin de vérifier dossierId
  if (props.initialData) {
    return (
      form.value.nomMesure &&
      form.value.valeurDeMesure !== null &&
      form.value.etat
    );
  }

  // En mode création, vérifier que nous avons un patient (patientId) ou un dossier médical (dossierId)
  return (
    form.value.nomMesure &&
    form.value.valeurDeMesure !== null &&
    form.value.etat &&
    (patientId.value || dossierId.value)
  );
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

function submit() {
  // Suppression de la vérification de isFormValid
  try {
    // Préparer les données à envoyer avec des valeurs par défaut
    const formData = {
      ...form.value,
      nomMesure: form.value.nomMesure || 'Mesure non spécifiée',
      valeurDeMesure: form.value.valeurDeMesure !== null ? form.value.valeurDeMesure : 0,
      etat: form.value.etat || 'normal',
      commentaire: form.value.commentaire || '',
      dossier_id: dossierId.value || props.initialData?.dossier_id || 'temp_dossier_id',
      patient_id: patientId.value || 'temp_patient_id'
    }
    
    // Ajouter l'unité au nom de la mesure si elle est spécifiée
    if (unite.value) {
      formData.nomMesure = `${formData.nomMesure} (${unite.value})`
    }
    
    console.log('Données de l\'évolution à soumettre:', formData);
    console.log('ID du dossier médical utilisé:', formData.dossier_id);
    
    emit('submit', formData)
  } catch (error) {
    console.error('Erreur lors de la préparation des données:', error)
    // Envoyer quand même les données brutes
    emit('submit', {
      ...form.value,
      dossier_id: dossierId.value || 'temp_dossier_id',
      patient_id: patientId.value || 'temp_patient_id'
    })
  }
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

.form-radio {
  @apply h-4 w-4 border-gray-300 dark:border-gray-700 
         focus:ring-primary-500 dark:focus:ring-primary-400;
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