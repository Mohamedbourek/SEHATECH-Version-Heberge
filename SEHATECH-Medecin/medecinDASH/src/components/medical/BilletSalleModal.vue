<template>
  <Modal 
    title="Billet de salle"
    size="xl"
    @close="$emit('close')"
  >
    <div class="p-6 space-y-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Sélection du patient -->
        <div class="form-section">
          <h3 class="form-section-title">Patient</h3>
          <div class="space-y-4">
            <div class="flex space-x-3">
              <div class="flex-1 relative">
                <input 
                  type="text" 
                  class="form-input"
                  placeholder="Rechercher un patient..."
                  v-model="patientName"
                  :readonly="!isManualEntry"
                  @click="handlePatientClick"
                />
                <button 
                  v-if="!isManualEntry"
                  type="button"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500"
                  @click="showPatientSearch = true"
                >
                  <Search class="w-5 h-5" />
                </button>
              </div>
              <button 
                type="button"
                class="btn btn-secondary"
                @click="toggleEntryMode"
              >
                {{ isManualEntry ? 'Rechercher' : 'Saisie manuelle' }}
              </button>
            </div>

            <div v-if="isManualEntry" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label required">Nom</label>
                <input 
                  type="text" 
                  class="form-input"
                  v-model="manualPatient.nom"
                  required
                />
              </div>
              <div>
                <label class="form-label required">Prénom</label>
                <input 
                  type="text" 
                  class="form-input"
                  v-model="manualPatient.prenom"
                  required
                />
              </div>
              <div>
                <label class="form-label required">Date de naissance</label>
                <input 
                  type="date" 
                  class="form-input"
                  v-model="manualPatient.dateNaissance"
                  required
                />
              </div>
              <div>
                <label class="form-label">Téléphone</label>
                <input 
                  type="tel" 
                  class="form-input"
                  v-model="manualPatient.telephone"
                />
              </div>
            </div>

            <p v-if="!isFormValid && !initialData" class="text-sm text-red-500 mt-1">
              {{ isManualEntry ? 'Veuillez remplir tous les champs obligatoires' : 'Veuillez sélectionner un patient' }}
            </p>
          </div>
        </div>

        <!-- Type de demande -->
        <div class="form-section">
          <h3 class="form-section-title">Type de demande</h3>
          <div class="flex space-x-4">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                v-model="form.typeDemande" 
                value="hospitalisation"
                class="form-radio"
              />
              <span>Hospitalisation</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                v-model="form.typeDemande" 
                value="operation"
                class="form-radio"
              />
              <span>Opération</span>
            </label>
          </div>
        </div>

        <!-- Informations générales -->
        <div class="form-section">
          <h3 class="form-section-title">Informations générales</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label required">Motif</label>
              <input 
                v-model="form.motif"
                type="text"
                class="form-input"
                required
                placeholder="Motif de la demande"
              />
            </div>
            <div>
              <label class="form-label required">Niveau d'urgence</label>
              <select 
                v-model="form.niveauUrgence"
                class="form-select"
                required
              >
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            <div>
              <label class="form-label required">Date souhaitée</label>
              <input 
                v-model="form.dateDebut"
                type="date"
                class="form-input"
                required
                :min="minDate"
              />
            </div>
            <div>
              <label class="form-label">Date de fin estimée</label>
              <input 
                v-model="form.dateFin"
                type="date"
                class="form-input"
                :min="form.dateDebut"
              />
            </div>
          </div>
        </div>

        <!-- Détails spécifiques à l'hospitalisation -->
        <div v-if="form.typeDemande === 'hospitalisation'" class="form-section">
          <h3 class="form-section-title">Détails de l'hospitalisation</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Service</label>
              <select 
                v-model="form.service"
                class="form-select"
              >
                <option value="cardiologie">Cardiologie</option>
                <option value="pneumologie">Pneumologie</option>
                <option value="neurologie">Neurologie</option>
                <option value="pediatrie">Pédiatrie</option>
                <option value="geriatrie">Gériatrie</option>
                <option value="gynecologie">Gynécologie</option>
                <option value="orthopédie">Orthopédie</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label class="form-label">Type de chambre</label>
              <select 
                v-model="form.typeChambre"
                class="form-select"
              >
                <option value="standard">Standard</option>
                <option value="double">Double</option>
                <option value="individuelle">Individuelle</option>
                <option value="suite">Suite</option>
                <option value="soins_intensifs">Soins intensifs</option>
              </select>
            </div>
          </div>
          <div class="mt-4">
            <label class="form-label">Besoins spécifiques</label>
            <textarea 
              v-model="form.besoinsSpecifiques"
              rows="3"
              class="form-textarea"
              placeholder="Équipements spéciaux, régime alimentaire, etc."
            ></textarea>
          </div>
        </div>

        <!-- Détails spécifiques à l'opération -->
        <div v-if="form.typeDemande === 'operation'" class="form-section">
          <h3 class="form-section-title">Détails de l'opération</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Type d'opération</label>
              <select 
                v-model="form.typeOperation"
                class="form-select"
              >
                <option value="chirurgie_generale">Chirurgie générale</option>
                <option value="chirurgie_cardiaque">Chirurgie cardiaque</option>
                <option value="neurochirurgie">Neurochirurgie</option>
                <option value="orthopedique">Chirurgie orthopédique</option>
                <option value="plastique">Chirurgie plastique</option>
                <option value="ophtalmologique">Chirurgie ophtalmologique</option>
                <option value="orl">ORL</option>
                <option value="gynecologique">Chirurgie gynécologique</option>
                <option value="urologique">Chirurgie urologique</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label class="form-label">Durée estimée (heures)</label>
              <input 
                v-model="form.dureeEstimee"
                type="number"
                min="0.5"
                step="0.5"
                class="form-input"
                placeholder="Durée en heures"
              />
            </div>
            <div>
              <label class="form-label">Anesthésie</label>
              <select 
                v-model="form.typeAnesthesie"
                class="form-select"
              >
                <option value="locale">Locale</option>
                <option value="locoregionale">Locorégionale</option>
                <option value="generale">Générale</option>
                <option value="sedation">Sédation</option>
                <option value="aucune">Aucune</option>
              </select>
            </div>
            <div>
              <label class="form-label">Hospitalisation post-op</label>
              <select 
                v-model="form.hospitalisationPostOp"
                class="form-select"
              >
                <option value="non">Non (ambulatoire)</option>
                <option value="jour">Hospitalisation de jour</option>
                <option value="courte">Courte durée (1-2 jours)</option>
                <option value="standard">Standard (3-7 jours)</option>
                <option value="longue">Longue durée (> 7 jours)</option>
              </select>
            </div>
          </div>
          <div class="mt-4">
            <label class="form-label">Détails de la procédure</label>
            <textarea 
              v-model="form.detailsProcedure"
              rows="3"
              class="form-textarea"
              placeholder="Description détaillée de la procédure chirurgicale"
            ></textarea>
          </div>
        </div>

        <!-- Notes et instructions -->
        <div class="form-section">
          <h3 class="form-section-title">Notes et instructions</h3>
          <div>
            <label class="form-label">Instructions spéciales</label>
            <textarea 
              v-model="form.instructions"
              rows="3"
              class="form-textarea"
              placeholder="Instructions pour le personnel soignant"
            ></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button 
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            Annuler
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
            :disabled="!isFormValid || isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
            Enregistrer
          </button>
        </div>
      </form>

      <!-- Modal de recherche de patient -->
      <PatientSearchModal 
        v-if="showPatientSearch"
        @select="handlePatientSelect"
        @close="showPatientSearch = false"
      />
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Loader2 } from 'lucide-vue-next'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import Modal from '@/components/Modal.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit', 'cancel'])

// État local
const patientId = ref('')
const patientName = ref('')
const showPatientSearch = ref(false)
const isSubmitting = ref(false)
const isManualEntry = ref(false)
const manualPatient = ref({
  nom: '',
  prenom: '',
  dateNaissance: '',
  telephone: ''
})

// Date minimale (aujourd'hui)
const minDate = new Date().toISOString().split('T')[0]

// Formulaire
const form = ref({
  typeDemande: 'hospitalisation',
  motif: '',
  niveauUrgence: 'moyen',
  dateDebut: minDate,
  dateFin: '',
  
  // Champs pour hospitalisation
  service: 'cardiologie',
  typeChambre: 'standard',
  besoinsSpecifiques: '',
  
  // Champs pour opération
  typeOperation: 'chirurgie_generale',
  dureeEstimee: 1,
  typeAnesthesie: 'generale',
  hospitalisationPostOp: 'standard',
  detailsProcedure: '',
  
  // Commun
  instructions: ''
})

// Initialiser le formulaire avec les données existantes si disponibles
onMounted(() => {
  if (props.initialData) {
    // Données communes
    form.value.typeDemande = props.initialData.typeDemande || 'hospitalisation'
    form.value.motif = props.initialData.motif || ''
    form.value.niveauUrgence = props.initialData.niveauUrgence || 'moyen'
    form.value.dateDebut = props.initialData.dateDebut ? new Date(props.initialData.dateDebut).toISOString().split('T')[0] : minDate
    form.value.dateFin = props.initialData.dateFin ? new Date(props.initialData.dateFin).toISOString().split('T')[0] : ''
    form.value.instructions = props.initialData.instructions || ''
    
    // Données spécifiques à l'hospitalisation
    if (props.initialData.typeDemande === 'hospitalisation') {
      form.value.service = props.initialData.service || 'cardiologie'
      form.value.typeChambre = props.initialData.typeChambre || 'standard'
      form.value.besoinsSpecifiques = props.initialData.besoinsSpecifiques || ''
    }
    
    // Données spécifiques à l'opération
    if (props.initialData.typeDemande === 'operation') {
      form.value.typeOperation = props.initialData.typeOperation || 'chirurgie_generale'
      form.value.dureeEstimee = props.initialData.dureeEstimee || 1
      form.value.typeAnesthesie = props.initialData.typeAnesthesie || 'generale'
      form.value.hospitalisationPostOp = props.initialData.hospitalisationPostOp || 'standard'
      form.value.detailsProcedure = props.initialData.detailsProcedure || ''
    }
    
    // Informations du patient
    if (props.initialData.patient) {
      patientId.value = props.initialData.patient._id || props.initialData.patient_id
      patientName.value = props.initialData.patient.nom 
        ? `${props.initialData.patient.nom} ${props.initialData.patient.prenom}`
        : props.initialData.patient.utilisateur 
          ? `${props.initialData.patient.utilisateur.nom} ${props.initialData.patient.utilisateur.prenom}`
          : 'Patient sélectionné'
    }
  }
})

// Validation du formulaire
const isFormValid = computed(() => {
  const patientValidation = isManualEntry.value
    ? manualPatient.value.nom && manualPatient.value.prenom && manualPatient.value.dateNaissance
    : (patientId.value || props.initialData?.patient_id)

  const baseValidation = 
    form.value.motif && 
    form.value.niveauUrgence && 
    form.value.dateDebut &&
    patientValidation
  
  if (form.value.typeDemande === 'hospitalisation') {
    return baseValidation && form.value.service && form.value.typeChambre
  } else if (form.value.typeDemande === 'operation') {
    return baseValidation && form.value.typeOperation && form.value.typeAnesthesie
  }
  
  return baseValidation
})

// Gestion de la sélection du patient
function handlePatientSelect(patient) {
  patientId.value = patient._id
  patientName.value = `${patient.utilisateur?.nom || ''} ${patient.utilisateur?.prenom || ''}`.trim()
  showPatientSearch.value = false
  isManualEntry.value = false
}

// Basculer entre la recherche et la saisie manuelle
function toggleEntryMode() {
  isManualEntry.value = !isManualEntry.value
  if (isManualEntry.value) {
    patientId.value = ''
    patientName.value = ''
  } else {
    manualPatient.value = {
      nom: '',
      prenom: '',
      dateNaissance: '',
      telephone: ''
    }
  }
}

// Soumission du formulaire
async function handleSubmit() {
  if (!isFormValid.value) return
  
  try {
    isSubmitting.value = true
    
    // Préparer les données à envoyer
    const formData = {
      ...form.value,
      patient_id: null,
      manual_patient: null,
      nom: null,
      prenom: null
    }

    // Gérer les informations du patient selon le mode de saisie
    if (isManualEntry.value) {
      if (!manualPatient.value.nom || !manualPatient.value.prenom || !manualPatient.value.dateNaissance) {
        throw new Error('Veuillez remplir tous les champs obligatoires du patient')
      }
      formData.nom = manualPatient.value.nom
      formData.prenom = manualPatient.value.prenom
      formData.manual_patient = manualPatient.value
    } else {
      const selectedPatientId = patientId.value || props.initialData?.patient_id
      if (!selectedPatientId) {
        throw new Error('Veuillez sélectionner un patient')
      }
      formData.patient_id = selectedPatientId
    }
    
    // Ajouter les détails spécifiques selon le type de demande
    if (form.value.typeDemande === 'hospitalisation') {
      formData.details = [
        { type: 'service', valeur: form.value.service },
        { type: 'typeChambre', valeur: form.value.typeChambre },
        { type: 'besoinsSpecifiques', valeur: form.value.besoinsSpecifiques }
      ]
    } else if (form.value.typeDemande === 'operation') {
      formData.details = [
        { type: 'typeOperation', valeur: form.value.typeOperation },
        { type: 'dureeEstimee', valeur: form.value.dureeEstimee },
        { type: 'typeAnesthesie', valeur: form.value.typeAnesthesie },
        { type: 'hospitalisationPostOp', valeur: form.value.hospitalisationPostOp },
        { type: 'detailsProcedure', valeur: form.value.detailsProcedure }
      ]
    }
    
    // Émettre l'événement de soumission
    emit('submit', formData)
  } catch (error) {
    console.error('Erreur lors de la soumission du formulaire:', error)
  } finally {
    isSubmitting.value = false
  }
}
// Add the method in the script section
function handlePatientClick() {
  if (!isManualEntry.value) {
    showPatientSearch.value = true
  }
}
</script>

<style scoped>
.form-section {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
         dark:border-gray-700 p-6 space-y-4;
}

.form-section-title {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-label.required::after {
  content: "*";
  @apply text-red-500 ml-1;
}

.form-input,
.form-select,
.form-textarea,
.form-radio {
  @apply rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:border-gray-600 dark:text-white;
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
  @apply bg-white text-gray-700 border border-gray-300 
         hover:bg-gray-50 focus:ring-primary-500
         dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
         dark:hover:bg-gray-600 dark:hover:text-white;
}
</style>