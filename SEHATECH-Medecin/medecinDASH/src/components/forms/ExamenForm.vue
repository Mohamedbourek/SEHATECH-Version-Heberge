<template>
  <Modal 
    :title="props.initialData && props.initialData._id ? 'Modifier l\'examen' : 'Nouvel examen'"
    size="form"
    @close="handleClose"
  >
    <form @submit.prevent="submit" class="space-y-6">
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

      <!-- Détails de l'examen -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <Microscope class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Détails de l'examen</h4>
          </div>
          <p class="form-subtitle">Informations sur l'examen médical</p>
        </div>

        <div class="form-content space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label required">Type d'examen</label>
              <select v-model="form.type" class="form-select" required>
                <option value="biologie">Analyse biologique</option>
                <option value="imagerie">Imagerie médicale</option>
                <option value="cardiologie">Examen cardiologique</option>
                <option value="neurologie">Examen neurologique</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Date</label>
              <input 
                type="date" 
                v-model="form.date" 
                class="form-input" 
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Résultats attendus</label>
            <textarea
              v-model="form.resultat.description"
              rows="3"
              class="form-textarea"
              required
              placeholder="Description des résultats attendus..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Interprétation</label>
            <textarea
              v-model="form.interpretation"
              rows="3"
              class="form-textarea"
              placeholder="Interprétation des résultats..."
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label">Statut</label>
              <select v-model="form.statut" class="form-select">
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="terminé">Terminé</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Priorité</label>
              <select v-model="form.priorite" class="form-select">
                <option value="normale">Normale</option>
                <option value="urgent">Urgent</option>
                <option value="tres_urgent">Très urgent</option>
              </select>
            </div>
          </div>

          <!-- Fichiers (à implémenter ultérieurement) -->
          <!-- <div class="form-group">
            <label class="form-label">Fichiers</label>
            <input type="file" multiple class="form-input" />
          </div> -->
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

    <!-- Prévisualisation -->
    <Teleport to="body">
      <ExamenPreview
        v-if="showPreview"
        :examen="formattedExamen"
        :doctor-name="currentDoctor.name"
        :speciality="currentDoctor.speciality"
        :hospital-name="hospitalName"
        @close="showPreview = false"
      />
    </Teleport>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Microscope, UserCircle, Search } from 'lucide-vue-next'
import ExamenPreview from '@/components/preview/ExamenPreview.vue'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { useExamenStore } from '@/stores/examenStore'
import { usePatientStore } from '@/stores/patientStore'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import { useNotification } from '@/composables/useNotification'
import axiosInstance from '@/services/axios'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel', 'close'])

const authStore = useAuthStore()
const configStore = useConfigStore()
const examenStore = useExamenStore()
const patientStore = usePatientStore()
const { showNotification } = useNotification()
const showPreview = ref(false)
const showPatientSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const isSearching = ref(false)
const searchTimeout = ref(null)
const patientName = ref('')

const form = ref({
  patient: {
    id: props.initialData?.patient_id || '',
    nom: props.initialData?.patient?.utilisateur?.nom || '',
    prenom: props.initialData?.patient?.utilisateur?.prenom || ''
  },
  dossier_id: props.initialData?.dossier_id || '',
  medecin_id: props.initialData?.medecin_id || '',
  type: props.initialData?.type || 'biologie',
  date: props.initialData?.date ? new Date(props.initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  resultat: props.initialData?.resultat || { description: '', valeurs: {} },
  interpretation: props.initialData?.interpretation || '',
  statut: props.initialData?.statut || 'en_attente',
  priorite: props.initialData?.priorite || 'normale',
  fichiers: props.initialData?.fichiers || []
})

// Données formatées pour la prévisualisation
const formattedExamen = computed(() => ({
  ...form.value,
  patientName: `${form.value.patient.nom} ${form.value.patient.prenom}`,
  patientId: form.value.patient.id,
  examens: [{
    type: form.value.type,
    statut: form.value.statut,
    description: form.value.resultat.description,
    interpretation: form.value.interpretation
  }]
}))

// Informations du médecin connecté
const currentDoctor = computed(() => ({
  name: authStore.user?.name || '',
  speciality: authStore.user?.speciality || 'Médecin généraliste'
}))

const hospitalName = computed(() => configStore.hospitalName)

const isFormValid = computed(() => {
  return form.value.dossier_id && 
         form.value.type &&
         form.value.date &&
         form.value.resultat.description
})

// Récupérer l'ID du médecin
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

function handlePatientSelect(patient) {
  console.log('Patient sélectionné:', patient)
  
  // Mettre à jour les informations du patient
  form.value.patient.id = patient._id
  form.value.patient.nom = patient.utilisateur?.nom || ''
  form.value.patient.prenom = patient.utilisateur?.prenom || ''
  patientName.value = `${patient.utilisateur?.nom || ''} ${patient.utilisateur?.prenom || ''}`.trim()
  
  // Récupérer l'ID du dossier médical
  if (patient.dossiers_medicaux && patient.dossiers_medicaux.length > 0) {
    form.value.dossier_id = patient.dossiers_medicaux[0]._id
    console.log('Dossier médical trouvé dans dossiers_medicaux:', form.value.dossier_id)
  } else if (patient.dossier_medical?._id) {
    form.value.dossier_id = patient.dossier_medical._id
    console.log('Dossier médical trouvé dans dossier_medical:', form.value.dossier_id)
  } else if (patient.dossier_id) {
    form.value.dossier_id = patient.dossier_id
    console.log('Dossier ID trouvé directement:', form.value.dossier_id)
  } else {
    console.warn('Aucun dossier médical trouvé pour ce patient')
    showNotification({
      type: 'warning',
      message: 'Aucun dossier médical trouvé pour ce patient. Veuillez en créer un avant de continuer.'
    })
  }
  
  console.log('Dossier ID final:', form.value.dossier_id)
  showPatientSearch.value = false
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

function handlePrint() {
  if (!showPreview.value) {
    showPreview.value = true
    setTimeout(() => {
      window.print()
    }, 100)
  } else {
    window.print()
  }
}

function handlePreview() {
  showPreview.value = true
}

function handleClose() {
  form.value = {
    patient: {
      id: '',
      nom: '',
      prenom: ''
    },
    dossier_id: '',
    medecin_id: localStorage.getItem('role_id') || '',
    type: 'biologie',
    date: new Date().toISOString().split('T')[0],
    resultat: { description: '', valeurs: {} },
    interpretation: '',
    statut: 'en_attente', // Set default status instead of empty string
    priorite: 'normale',   // Set default priority instead of empty string
    fichiers: []
  }
  patientName.value = ''
  emit('close')
}

// Fermer les résultats lors du clic à l'extérieur
function handleClickOutside(event) {
  const searchContainer = document.querySelector('.form-group.relative')
  if (searchContainer && !searchContainer.contains(event.target)) {
    showResults.value = false
  }
}

async function submit() {
  try {
    if (!isFormValid.value) {
      showNotification({
        type: 'error',
        message: 'Veuillez remplir tous les champs obligatoires'
      })
      return
    }
    
    // Vérifier si nous avons un ID de médecin
    if (!form.value.medecin_id) {
      await fetchMedecinId()
      
      if (!form.value.medecin_id) {
        showNotification({
          type: 'error',
          message: 'Impossible de déterminer le médecin. Veuillez vous reconnecter.'
        })
        return
      }
    }
    
    // Ensure status has a value if not selected
    if (!form.value.statut) {
      form.value.statut = 'en_attente'
    }
    
    console.log('Données du formulaire avant envoi:', form.value)
    
    const examenData = {
      dossier_id: form.value.dossier_id,
      medecin_id: form.value.medecin_id,
      type: form.value.type,
      date: form.value.date,
      resultat: form.value.resultat,
      interpretation: form.value.interpretation,
      statut: form.value.statut,
      priorite: form.value.priorite,
      fichiers: form.value.fichiers
    }
    
    console.log('Données à envoyer:', examenData)
    
    let response
    
    if (props.initialData && props.initialData._id) {
      // Mise à jour d'un examen existant
      response = await examenStore.updateExamen(props.initialData._id, examenData)
      showNotification({
        type: 'success',
        message: 'Examen mis à jour avec succès'
      })
    } else {
      // Création d'un nouvel examen
      response = await examenStore.createExamen(examenData)
      showNotification({
        type: 'success',
        message: 'Examen créé avec succès'
      })
    }
    
    console.log('Réponse du serveur:', response)
    
    emit('submit', response)
    handleClose()
  } catch (error) {
    console.error('Erreur lors de la soumission du formulaire:', error)
    showNotification({
      type: 'error',
      message: error.message || 'Erreur lors de la création de l\'examen'
    })
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await fetchMedecinId()
  
  // Si nous avons des données initiales, initialiser le formulaire
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    console.log('Initialisation avec les données:', props.initialData)
    
    // Si nous avons un dossier_id mais pas de patient, essayer de récupérer les infos du patient
    if (props.initialData.dossier_id && !props.initialData.patient) {
      try {
        const response = await axiosInstance.get(`/dossiers-medicaux/${props.initialData.dossier_id}`)
        if (response.data && response.data.patient) {
          form.value.patient = {
            id: response.data.patient._id,
            nom: response.data.patient.utilisateur?.nom || '',
            prenom: response.data.patient.utilisateur?.prenom || ''
          }
          patientName.value = `${response.data.patient.utilisateur?.nom || ''} ${response.data.patient.utilisateur?.prenom || ''}`.trim()
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du patient:', error)
      }
    } else if (props.initialData.patient) {
      patientName.value = `${props.initialData.patient.utilisateur?.nom || ''} ${props.initialData.patient.utilisateur?.prenom || ''}`.trim()
    }
  }
})

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
</style>