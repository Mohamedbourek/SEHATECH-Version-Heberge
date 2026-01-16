<template>
  <Modal 
    :title="props.initialData && props.initialData._id ? 'Modifier la consultation' : 'Nouvelle consultation'"
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
                  v-model="searchQuery"
                  class="form-input"
                  placeholder="Rechercher un patient..."
                  @input="handleSearch"
                  @focus="showResults = true"
                />
                <!-- Liste des résultats -->
                <div v-if="showResults && searchResults.length > 0" 
                     class="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                  <div v-for="result in searchResults" 
                       :key="result._id"
                       @click="selectResult(result)"
                       class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ result.utilisateur?.nom }} {{ result.utilisateur?.prenom }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      Dossier: {{ result.dossiers_medicaux?.[0]?._id || 'Non disponible' }}
                    </div>
                  </div>
                </div>
                <!-- Message si aucun résultat -->
                <div v-else-if="showResults && searchQuery && !isSearching" 
                     class="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p class="text-gray-500 dark:text-gray-400">Aucun patient trouvé</p>
                </div>
              </div>
              <button 
                type="button"
                class="btn btn-secondary flex items-center"
                @click="showPatientSearch = true"
              >
                <Search class="w-4 h-4 mr-2" />
                Avancé
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Détails de la consultation -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <Stethoscope class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Détails de la consultation</h4>
          </div>
        </div>
        <div class="form-content space-y-4">
          <div class="form-group">
            <label class="form-label required">Motif de consultation</label>
            <input 
              type="text"
              v-model="form.motifConsultation"
              class="form-input"
              required
              placeholder="Ex: Douleurs abdominales"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Observations</label>
            <textarea
              v-model="form.observations"
              rows="3"
              class="form-textarea"
              placeholder="Observations cliniques..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label required">Diagnostic</label>
            <textarea
              v-model="form.diagnostic"
              rows="3"
              class="form-textarea"
              required
              placeholder="Diagnostic principal..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid"
        >
          Enregistrer
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  UserCircle, Stethoscope, Activity, Heart, HeartPulse,
  Thermometer, Gauge, FileText, Plus, Trash2, Calendar,
  ClipboardList, Eye, Search
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import FormActions from './common/FormActions.vue'
import ConsultationPreview from '@/components/preview/ConsultationPreview.vue'
import { generateConsultationPDF } from '@/utils/pdfGenerator'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/stores/auth'
import { useConsultationStore } from '@/stores/consultationStore'
import { usePatientStore } from '@/stores/patientStore'
import axiosInstance from '@/services/axios'

const { showNotification } = useNotification()
const authStore = useAuthStore()
const patientStore = usePatientStore()

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel', 'close'])

const form = ref({
  patient_id: '',
  dossier_id: '',
  motifConsultation: '',
  observations: '',
  diagnostic: ''
})

const patientName = ref('')
const showPatientSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const isSearching = ref(false)
const searchTimeout = ref(null)

const isFormValid = computed(() => {
  const valid = Boolean(
    form.value.dossier_id && // On vérifie que le dossier_id existe
    form.value.motifConsultation?.trim() &&
    form.value.diagnostic?.trim()
  );
  
  console.log('État de la validation:', {
    dossier_id: form.value.dossier_id,
    motifConsultation: form.value.motifConsultation,
    diagnostic: form.value.diagnostic,
    isValid: valid
  });
  
  return valid;
})

async function handlePatientSelect(patient) {
  console.log('Patient sélectionné (données complètes):', JSON.stringify(patient, null, 2));
  
  try {
    // Vérifier la structure du patient et ses propriétés
    if (!patient) {
      throw new Error('Aucun patient sélectionné');
    }

    // Réinitialiser le formulaire
    form.value = {
      patient_id: '',
      dossier_id: '',
      motifConsultation: '',
      observations: '',
      diagnostic: ''
    };

    // Récupérer les informations du patient selon toutes les structures possibles
    let nom = '', prenom = '';
    
    if (patient.utilisateur) {
      // Structure avec utilisateur
      nom = patient.utilisateur.nom;
      prenom = patient.utilisateur.prenom;
      form.value.patient_id = patient._id;
    } else if (patient.nom && patient.prenom) {
      // Structure directe avec nom et prénom
      nom = patient.nom;
      prenom = patient.prenom;
      form.value.patient_id = patient._id || patient.id;
    } else if (typeof patient === 'object') {
      // Parcourir l'objet pour trouver nom et prénom
      Object.entries(patient).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if (value.nom) nom = value.nom;
          if (value.prenom) prenom = value.prenom;
        }
      });
      form.value.patient_id = patient._id || patient.id;
    }

    console.log('Informations extraites:', { nom, prenom });

    // Construire le nom complet
    const nomComplet = `${nom || ''} ${prenom || ''}`.trim();
    if (!nomComplet) {
      throw new Error('Impossible de récupérer le nom du patient');
    }
    
    // Mettre à jour le nom du patient dans l'input
    patientName.value = nomComplet;

    // Vérifier toutes les possibilités de dossier médical
    let dossierId = null;

    // Log pour déboguer la structure du dossier
    console.log('Vérification des structures possibles:', {
      dossiersMedicaux: patient.dossiers_medicaux,
      premierDossier: patient.dossiers_medicaux?.[0],
      dossierMedical: patient.dossier_medical,
      dossierDirectId: patient.dossier_id
    });

    // Vérifier toutes les possibilités dans l'ordre de priorité
    if (patient.dossiers_medicaux?.length > 0) {
      dossierId = patient.dossiers_medicaux[0]._id;
    } else if (patient.dossier_medical?._id) {
      dossierId = patient.dossier_medical._id;
    } else if (patient.dossier_medical?.id) {
      dossierId = patient.dossier_medical.id;
    } else if (patient.dossier_id) {
      dossierId = patient.dossier_id;
    }

    if (!dossierId) {
      throw new Error('Pas de dossier médical trouvé pour ce patient');
    }

    form.value.dossier_id = dossierId;

    console.log('État final du formulaire:', {
      patient_id: form.value.patient_id,
      dossier_id: form.value.dossier_id,
      patientName: patientName.value
    });

    // Fermer le modal de recherche
    showPatientSearch.value = false;

  } catch (error) {
    console.error('Erreur lors de la sélection du patient:', error);
    showNotification({
      type: 'error',
      message: error.message || 'Erreur lors de la récupération des informations du patient'
    });
    // Réinitialiser en cas d'erreur
    patientName.value = '';
    form.value = {
      patient_id: '',
      dossier_id: '',
      motifConsultation: '',
      observations: '',
      diagnostic: ''
    };
  }
}

function addSymptome() {
  form.value.symptomes.push('')
}

function removeSymptome(index) {
  form.value.symptomes.splice(index, 1)
}

function handlePreview() {
  showPreview.value = true
}

async function printConsultation() {
  try {
    const pdfBlob = await generateConsultationPDF(form.value, false)
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <body style="margin:0">
          <embed width="100%" height="100%" src="${URL.createObjectURL(pdfBlob)}" type="application/pdf" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Erreur lors de l\'impression'
    })
  }
}

function handlePatientInput(event) {
  const value = event.target.value;
  patientName.value = value;
  form.value.patient_id = value;
  
  console.log('Saisie patient:', {
    value: value,
    patientName: patientName.value,
    patient_id: form.value.patient_id
  });
}

async function submit() {
  try {
    if (!form.value.dossier_id) {
      showNotification({
        type: 'error',
        message: 'Veuillez sélectionner un patient avec un dossier médical'
      });
      return;
    }

    if (!form.value.motifConsultation || !form.value.diagnostic) {
      showNotification({
        type: 'error',
        message: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }

    // Préparer les données de base
    const consultationData = {
      dossier_id: form.value.dossier_id,
      patient_id: form.value.patient_id,
      motifConsultation: form.value.motifConsultation,
      observations: form.value.observations || '',
      diagnostic: form.value.diagnostic
    };

    // Si c'est une mise à jour, ajouter l'ID à l'objet de données
    if (props.initialData && props.initialData._id) {
      consultationData._id = props.initialData._id;
      console.log('Données de mise à jour à envoyer:', consultationData);
    } else {
      console.log('Données de création à envoyer:', consultationData);
    }
    
    // Envoyer les données au composant parent
    emit('submit', consultationData);
    handleClose();
  } catch (error) {
    console.error('Erreur dans le formulaire:', error);
    showNotification({
      type: 'error',
      message: error.message || 'Erreur lors de la préparation des données'
    });
  }
}

function handleClose() {
  form.value = {
    patient_id: '',
    dossier_id: '',
    motifConsultation: '',
    observations: '',
    diagnostic: ''
  }
  patientName.value = ''
  emit('close')
}

function handleActions(action) {
  switch(action) {
    case 'preview':
      handlePreview()
      break
    case 'print':
      if (!showPreview.value) {
        showPreview.value = true
        setTimeout(() => {
          window.print()
        }, 100)
      } else {
        window.print()
      }
      break
    // ... autres cas
  }
}

// Fonction de recherche avec debounce
async function handleSearch() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  
  searchTimeout.value = setTimeout(async () => {
    try {
      const results = await patientStore.searchPatients(searchQuery.value)
      searchResults.value = results
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      showNotification({
        type: 'error',
        message: 'Erreur lors de la recherche des patients'
      })
    } finally {
      isSearching.value = false
    }
  }, 300)
}

// Sélection d'un résultat de recherche
function selectResult(patient) {
  handlePatientSelect(patient)
  searchQuery.value = `${patient.utilisateur?.nom || ''} ${patient.utilisateur?.prenom || ''}`.trim()
  showResults.value = false
}

// Fermer les résultats lors du clic à l'extérieur
function handleClickOutside(event) {
  const searchContainer = document.querySelector('.form-group.relative')
  if (searchContainer && !searchContainer.contains(event.target)) {
    showResults.value = false
  }
}

// Gestionnaires d'événements pour le clic à l'extérieur
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // Initialiser le formulaire avec les données existantes si disponibles
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    console.log('Initialisation du formulaire avec les données:', props.initialData)
    
    // Remplir le formulaire avec les données existantes
    form.value = {
      patient_id: props.initialData.patient_id || '',
      dossier_id: props.initialData.dossier_id || '',
      motifConsultation: props.initialData.motifConsultation || props.initialData.motif || '',
      observations: props.initialData.observations || '',
      diagnostic: props.initialData.diagnostic || ''
    }
    
    // Si nous avons des informations sur le patient, afficher son nom
    if (props.initialData.patient) {
      patientName.value = `${props.initialData.patient.utilisateur?.nom || ''} ${props.initialData.patient.utilisateur?.prenom || ''}`.trim()
    } else if (props.initialData.medecin) {
      // Essayer de récupérer le patient associé au dossier
      fetchPatientInfo(props.initialData.dossier_id)
    }
  }
})

// Fonction pour récupérer les informations du patient à partir du dossier
async function fetchPatientInfo(dossierId) {
  if (!dossierId) return
  
  try {
    const dossier = await axiosInstance.get(`/dossiers-medicaux/${dossierId}`)
    if (dossier.data && dossier.data.patient) {
      const patient = dossier.data.patient
      patientName.value = `${patient.utilisateur?.nom || ''} ${patient.utilisateur?.prenom || ''}`.trim()
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des informations du patient:', error)
  }
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.form-section {
  @apply bg-white dark:bg-gray-800 rounded-xl border border-gray-200 
         dark:border-gray-700 overflow-hidden transition-shadow
         hover:shadow-md mb-6;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm
         transition-colors duration-200;
}

.form-input:hover,
.form-select:hover,
.form-textarea:hover {
  @apply border-gray-400 dark:border-gray-600;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  @apply border-primary-500 ring-1 ring-primary-500;
}

.form-checkbox {
  @apply rounded border-gray-300 text-primary-600 
         focus:ring-primary-500 dark:border-gray-600 
         dark:bg-gray-700 dark:checked:bg-primary-600
         transition-colors duration-200;
}

.form-group {
  @apply relative mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1
         transition-colors duration-200;
}

.form-label.required:after {
  content: " *";
  @apply text-red-500;
}

/* Styles spécifiques pour les symptômes */
.symptom-list {
  @apply space-y-3 max-h-60 overflow-y-auto pr-2;
}

.symptom-item {
  @apply flex items-center space-x-2 bg-white dark:bg-gray-800 
         rounded-lg border border-gray-200 dark:border-gray-700 p-3
         transition-all duration-200 hover:border-primary-500 
         dark:hover:border-primary-400;
}

.delete-button {
  @apply text-red-500 hover:text-red-600 dark:text-red-400 
         dark:hover:text-red-300 transition-all duration-200;
}

.add-button {
  @apply w-full flex items-center justify-center px-4 py-2 
         border border-gray-300 dark:border-gray-600 rounded-lg 
         text-sm font-medium text-gray-700 dark:text-gray-300 
         hover:bg-gray-50 dark:hover:bg-gray-700 
         transition-colors duration-200;
}

/* Animations */
.list-enter-active,
.list-leave-active {
  @apply transition-all duration-300 ease-in-out;
}

.list-enter-from,
.list-leave-to {
  @apply opacity-0 transform translate-y-4;
}

.form-actions {
  @apply fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 
         border-t border-gray-200 dark:border-gray-700
         transition-all duration-200 z-10;
}

.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
         focus:outline-none focus:ring-2 focus:ring-offset-2 
         disabled:opacity-50 dark:focus:ring-offset-gray-900
         transition-all duration-200;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 
         focus:ring-primary-500 dark:focus:ring-primary-400
         shadow-sm hover:shadow-md;
}

.btn-secondary {
  @apply bg-white text-gray-700 hover:bg-gray-50 
         focus:ring-primary-500 border border-gray-300
         shadow-sm hover:shadow-md
         dark:bg-gray-700 dark:text-gray-200 
         dark:hover:bg-gray-600 dark:border-gray-600;
}

.btn-outline {
  @apply text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700
         dark:text-gray-300 dark:hover:bg-gray-700
         border border-transparent;
}

/* Ajouter un padding en bas du formulaire pour compenser la barre fixe */
form {
  @apply pb-20;
}

.form-input[readonly] {
  @apply bg-gray-50 dark:bg-gray-700 cursor-not-allowed;
}

/* Styles pour la liste des résultats */
.search-results {
  @apply absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 
         rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
         max-h-60 overflow-y-auto;
}

.search-result-item {
  @apply p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
         border-b border-gray-200 dark:border-gray-700 last:border-b-0
         relative z-[9999];
}

.search-result-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.search-result-info {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-[9998];
}

.modal-content {
  @apply relative z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl;
}
</style>