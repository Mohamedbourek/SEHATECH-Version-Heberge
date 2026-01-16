<template>
  <Modal 
    :title="props.initialData && props.initialData._id ? 'Modifier le rapport' : 'Nouveau rapport'"
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
                <div v-if="showResults && searchQuery && searchResults.length === 0 && !isSearching" 
                     class="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p class="text-gray-500 dark:text-gray-400">Aucun patient trouvé</p>
                </div>
                <!-- Indicateur de chargement -->
                <div v-if="isSearching" 
                     class="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p class="text-gray-500 dark:text-gray-400 flex items-center">
                    <span class="animate-spin mr-2">⟳</span> Recherche en cours...
                  </p>
                </div>
              </div>
              <button 
                type="button"
                class="btn btn-secondary flex items-center"
                @click="showPatientSearch = true"
              >
                <Search class="w-4 h-4 mr-2" />
                Rechercher
              </button>
            </div>
            <p v-if="patientName" class="mt-2 text-sm text-primary-600 dark:text-primary-400">
              Patient sélectionné: {{ patientName }}
            </p>
          </div>
        </div>
      </div>

      <!-- Informations du rapport -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <ClipboardList class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Informations du rapport</h4>
          </div>
          <p class="form-subtitle">Détails du rapport médical</p>
        </div>
        <div class="form-content space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label required">Type de rapport</label>
              <select v-model="form.type" class="form-select" required>
                <option value="consultation">Consultation</option>
                <option value="hospitalisation">Hospitalisation</option>
                <option value="intervention">Intervention</option>
                <option value="suivi">Suivi</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Date</label>
              <input 
                type="date"
                v-model="form.date"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Contenu</label>
            <textarea
              v-model="form.contenu"
              rows="8"
              class="form-textarea"
              required
              placeholder="Contenu détaillé du rapport..."
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
  UserCircle, ClipboardList, Search
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/stores/auth'
import { useRapportStore } from '@/stores/rapportStore'
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
  medecin_id: localStorage.getItem('role_id') || '',
  type: 'consultation',
  contenu: '',
  date: new Date().toISOString().split('T')[0]
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
    form.value.type?.trim() &&
    form.value.contenu?.trim()
  );
  
  return valid;
})

// Fonction pour gérer la sélection d'un patient
async function handlePatientSelect(patient) {
  try {
    console.log('Patient sélectionné:', patient);
    
    // Mettre à jour le nom du patient pour l'affichage
    patientName.value = `${patient.utilisateur?.nom || ''} ${patient.utilisateur?.prenom || ''}`.trim();
    
    // Mettre à jour l'ID du patient dans le formulaire
    form.value.patient_id = patient._id;
    
    // Trouver l'ID du dossier médical
    let dossierId = null;
    
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
      medecin_id: localStorage.getItem('role_id') || '',
      type: 'consultation',
      contenu: '',
      date: new Date().toISOString().split('T')[0]
    };
  }
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

    if (!form.value.contenu) {
      showNotification({
        type: 'error',
        message: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }

    // Vérifier si nous avons un ID de médecin
    if (!form.value.medecin_id) {
      // Essayer de récupérer l'ID du médecin depuis le localStorage
      form.value.medecin_id = localStorage.getItem('role_id');
      
      if (!form.value.medecin_id) {
        showNotification({
          type: 'error',
          message: 'Impossible de déterminer le médecin. Veuillez vous reconnecter.'
        });
        return;
      }
    }

    console.log('Données du formulaire avant envoi:', {
      dossier_id: form.value.dossier_id,
      medecin_id: form.value.medecin_id,
      type: form.value.type,
      contenu: form.value.contenu,
      date: form.value.date
    });

    const rapportStore = useRapportStore();
    
    const rapportData = {
      dossier_id: form.value.dossier_id,
      patient_id: form.value.patient_id,
      medecin_id: form.value.medecin_id,
      type: form.value.type,
      contenu: form.value.contenu,
      date: form.value.date
    };

    console.log('Tentative d\'envoi des données:', rapportData);
    
    let response;
    
    // Si nous avons un ID, c'est une mise à jour
    if (props.initialData && props.initialData._id) {
      console.log('Mise à jour du rapport:', props.initialData._id);
      response = await rapportStore.updateRapport(props.initialData._id, {
        type: form.value.type,
        contenu: form.value.contenu,
        date: form.value.date
      });
      
      showNotification({
        type: 'success',
        message: 'Rapport mis à jour avec succès'
      });
    } else {
      // Sinon, c'est une création
      console.log('Création d\'un nouveau rapport');
      response = await rapportStore.createRapport(rapportData);
      
      showNotification({
        type: 'success',
        message: 'Rapport enregistré avec succès'
      });
    }
    
    console.log('Réponse du serveur:', response);
    
    emit('submit', response);
    handleClose();
  } catch (error) {
    console.error('Erreur API:', error);
    const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
    showNotification({
      type: 'error',
      message: message
    });
  }
}

function handleClose() {
  form.value = {
    patient_id: '',
    dossier_id: '',
    medecin_id: localStorage.getItem('role_id') || '',
    type: 'consultation',
    contenu: '',
    date: new Date().toISOString().split('T')[0]
  }
  patientName.value = ''
  emit('close')
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
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  
  // Récupérer l'ID du médecin
  await fetchMedecinId()
  
  // Initialiser le formulaire avec les données existantes si disponibles
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    console.log('Initialisation du formulaire avec les données:', props.initialData)
    
    // Remplir le formulaire avec les données existantes
    form.value = {
      patient_id: props.initialData.patient_id || '',
      dossier_id: props.initialData.dossier_id || '',
      medecin_id: props.initialData.medecin_id || form.value.medecin_id,
      type: props.initialData.type || 'consultation',
      contenu: props.initialData.contenu || '',
      date: props.initialData.date ? new Date(props.initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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

// Fonction pour récupérer l'ID du médecin
async function fetchMedecinId() {
  try {
    const roleId = localStorage.getItem('role_id')
    if (!roleId) {
      console.error('ID de rôle non trouvé dans localStorage')
      return
    }
    
    const response = await axiosInstance.get(`/medecins/${roleId}`)
    if (response.data && response.data._id) {
      console.log('ID du médecin récupéré:', response.data._id)
      form.value.medecin_id = response.data._id
    } else {
      console.error('ID du médecin non trouvé dans la réponse:', response.data)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID du médecin:', error)
  }
}

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

.form-header {
  @apply p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 
         dark:bg-gray-800/80;
}

.form-title {
  @apply text-lg font-medium text-gray-900 dark:text-white;
}

.form-subtitle {
  @apply mt-1 text-sm text-gray-500 dark:text-gray-400;
}

.form-content {
  @apply p-4;
}

.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-label.required::after {
  content: "*";
  @apply ml-1 text-red-500;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
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
         dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 
         dark:hover:bg-gray-600;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-[9998];
}

.modal-content {
  @apply relative z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl;
}
</style> 