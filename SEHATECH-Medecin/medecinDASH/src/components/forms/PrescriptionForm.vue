<template>
  <Modal 
    title="Nouvelle prescription"
    size="form"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Section Patient -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <UserCircle class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Patient</h4>
          </div>
          <p class="form-subtitle">Sélectionnez le patient concerné</p>
        </div>
        <div class="form-content">
          <PatientSelect v-model="form.patient" />
        </div>
      </div>

      <!-- Médicaments -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <Pill class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Médicaments</h4>
          </div>
          <p class="form-subtitle">Liste des médicaments prescrits</p>
        </div>
        <div class="form-content">
          <TransitionGroup 
            name="list" 
            tag="div" 
            class="space-y-4"
          >
            <div v-for="(med, index) in form.medicaments" 
                 :key="index"
                 class="medication-item group"
            >
              <!-- En-tête du médicament -->
              <div class="medication-header">
                <div class="flex items-center space-x-2">
                  <div class="medication-number">
                    {{ index + 1 }}
                  </div>
                  <h5 class="text-base font-medium text-gray-900 dark:text-white">
                    Médicament {{ index + 1 }}
                  </h5>
                </div>
                <button 
                  v-if="form.medicaments.length > 1"
                  @click="removeMedication(index)"
                  class="delete-button opacity-0 group-hover:opacity-100"
                  type="button"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <!-- Détails du médicament -->
              <div class="mt-4 space-y-4">
                <!-- Sélection du médicament avec suggestions -->
                <div class="form-group">
                  <MedicamentSearch 
                    v-model="med.medicament" 
                    @select="handleMedicationSelect($event, index)" 
                  />
                </div>

                <!-- Posologie et durée -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="form-group">
                    <label class="form-label required">Posologie</label>
                    <div class="relative">
                      <input 
                        type="text"
                        :value="med.medicament?.posologieStandard || med.posologie"
                        class="form-input"
                        placeholder="Ex: 1 comprimé 3x/jour"
                        required
                        @input="(e) => med.posologie = (e.target as HTMLInputElement).value"
                      />
                      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Clock class="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Durée du traitement</label>
                    <div class="relative">
                      <input 
                        type="text"
                        :value="med.medicament?.dureeTraitement || med.duree"
                        class="form-input"
                        placeholder="Ex: 7 jours"
                        @input="(e) => med.duree = (e.target as HTMLInputElement).value"
                      />
                      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Calendar class="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="form-group">
                    <label class="form-label required">Fréquence</label>
                    <div class="relative">
                      <input 
                        type="text"
                        v-model="med.frequence"
                        class="form-input"
                        placeholder="Ex: 1 fois par jour"
                        required
                      />
                      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Clock class="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <!-- Quantité et voie d'administration -->
                  <div class="form-group">
                    <label class="form-label required">Quantité</label>
                    <div class="relative">
                      <input 
                        type="number"
                        :value="med.medicament?.quantiteStandard ?? med.quantite ?? 1"
                        class="form-input"
                        min="1"
                        required
                        @input="onQuantiteInput($event, med)"
                      />
                      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Package class="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Instructions spécifiques -->
                <div class="form-group">
                  <label class="form-label">Instructions spécifiques</label>
                  <textarea 
                    v-model="med.instructions"
                    class="form-textarea"
                    rows="2"
                    placeholder="Ex: À prendre pendant les repas"
                  ></textarea>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <button 
            type="button"
            @click="addMedication"
            class="add-medication-button mt-4"
          >
            <Plus class="w-4 h-4 mr-2" />
            Ajouter un médicament
          </button>
        </div>
      </div>

      <!-- Options supplémentaires -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <Settings class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Options</h4>
          </div>
          <p class="form-subtitle">Paramètres de l'ordonnance</p>
        </div>
        <div class="form-content">
          <div class="space-y-4">
            <!-- Notes pour le pharmacien -->
            <div class="form-group">
              <label class="form-label">Notes pour le pharmacien</label>
              <textarea
                v-model="form.pharmacistNotes"
                class="form-textarea"
                rows="3"
                placeholder="Instructions spéciales pour le pharmacien..."
              ></textarea>
            </div>

            <!-- Options de l'ordonnance -->
            <div class="flex flex-wrap gap-4">
              <label class="checkbox-label">
                <input 
                  type="checkbox"
                  v-model="form.renouvelable"
                  class="form-checkbox"
                />
                <span>Ordonnance renouvelable</span>
              </label>

              <label class="checkbox-label">
                <input 
                  type="checkbox"
                  v-model="form.urgent"
                  class="form-checkbox"
                />
                <span>Urgent</span>
              </label>

              <label class="checkbox-label">
                <input 
                  type="checkbox"
                  v-model="form.nonSubstituable"
                  class="form-checkbox"
                />
                <span>Non substituable</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <FormActions
        :disabled="!isFormValid"
        :is-preview-enabled="true"
        :is-valid="isFormValid"
        :is-submitting="isSubmitting"
        @cancel="handleClose"
        @preview="previewPrescription"
        @submit="handleSubmit" 
      />
    </form>

    <!-- Prévisualisation -->
    <DocumentPreviewSection
      v-if="showPreview"
      title="Aperçu de l'ordonnance"
      :doctorName="doctorName"
      :speciality="doctorSpeciality"
      :show-logo="true"
      @close="showPreview = false"
      @print="printPrescription"
    >
      <template #content>
        <div class="preview-content">
          <h3>Patient :</h3>
          <p>
            {{ form.patient.utilisateur.nom }} {{ form.patient.utilisateur.prenom }}
          </p>
          <h3>Médicaments :</h3>
          <ul>
            <li v-for="(med, index) in form.medicaments" :key="index">
              <strong>Médicament {{ index + 1 }} :</strong>
              {{ med.medicament?.nomCommercial || med.searchQuery }}
              <br>
              <small>
                Posologie : {{ med.posologie }} | Quantité : {{ med.quantite }} | Durée : {{ med.duree }}
              </small>
            </li>
          </ul>
          <h3>Notes pour le pharmacien :</h3>
          <p>{{ form.pharmacistNotes }}</p>
        </div>
      </template>
    </DocumentPreviewSection>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { 
  Pill, Settings, Calendar, Clock,
  Plus, Trash2, UserCircle, Package
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSelect from './common/PatientSelect.vue'
import FormActions from './common/FormActions.vue'
import DocumentPreviewSection from './common/DocumentPreviewSection.vue'
import MedicamentSearch from '@/components/medical/MedicamentSearch.vue'
import { generatePrescriptionPDF } from '@/utils/pdfGenerator'
import { useNotification } from '@/composables/useNotification'
import { useToastStore } from '@/stores/toast'
// Import stores
import { useAuthStore } from '@/stores/auth'
import { useMedicationStore } from '@/stores/medicationStore'
import { useOrdonnanceStore } from '@/stores/ordonnanceStore'

// Définition des interfaces
interface Utilisateur {
  nom: string;
  prenom: string;
}

interface Patient {
  _id: string | null;
  dossier_id?: string | null;
  utilisateur: Utilisateur;
}

interface Medicament {
  ID_medicament: string;
  medicament: any;
  searchQuery: string;
  posologie: string;
  quantite: number;
  duree: string;
  frequence: string;
  voieAdmin: string;
  instructions: string;
}

interface FormData {
  patient: Patient;
  medicaments: Medicament[];
  pharmacistNotes: string;
  renouvelable: boolean;
  urgent: boolean;
  nonSubstituable: boolean;
}

const authStore = useAuthStore()
const toastStore = useToastStore()

// Add computed properties for doctor info
const doctorName = computed(() => {
  const user = authStore.user
  return user ? `${user.nom} ${user.prenom}` : ''
})

const doctorSpeciality = computed(() => {
  const roleId = localStorage.getItem('role_id')
  if (!roleId) return 'Médecin généraliste'
  
  return authStore.user?.medecin?.specialite || 'Médecin généraliste'
})
const medicationStore = useMedicationStore()
const ordonnanceStore = useOrdonnanceStore()
const { showNotification } = useNotification()

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel', 'close'])

const form = ref<FormData>({
  patient: {
    _id: null,
    dossier_id: null,
    utilisateur: {
      nom: '',
      prenom: ''
    }
  },
  medicaments: [{
    ID_medicament: '',
    medicament: null,
    searchQuery: '',
    posologie: '',
    quantite: 1,
    duree: '',
    frequence: '1 fois par jour',
    voieAdmin: 'orale',
    instructions: ''
  }],
  pharmacistNotes: '',
  renouvelable: false,
  urgent: false,
  nonSubstituable: false
})


const showPreview = ref(false)
const isSubmitting = ref(false)

const isFormValid = computed(() => {
  // Consider the form valid if patient has a defined _id or if the patient's name is non-empty
  const patient = form.value.patient;
  const hasPatient =
    (patient && patient._id) ||
    (patient && patient.utilisateur && patient.utilisateur.nom && patient.utilisateur.nom.trim() !== '');
  
  return hasPatient && form.value.medicaments.length > 0;
});

watch(() => form.value.patient, (newPatient) => {
  console.log('Updated patient:', newPatient);
}, { deep: true });

// Reactive reference for medication search suggestions
const medicationSuggestions = ref([])

// Function to search medications using medicationStore
async function searchMedications(query: string): Promise<void> {
  if (!query || query.length < 2) {
    medicationSuggestions.value = []
    return
  }
  
  try {
    const results = await medicationStore.searchMedications(query)
    // Adapt the response structure if needed
    medicationSuggestions.value = results?.medicaments || results || []
  } catch (error) {
    console.error('Error searching medications:', error)
    medicationSuggestions.value = []
  }
}
function onQuantiteInput(e: Event, med: any) {
  const target = e.target as HTMLInputElement
  const parsed = parseInt(target.value)
  med.quantite = isNaN(parsed) ? 1 : parsed
}
// Function to get medication info from medicationStore
function getMedicamentInfo(id: string) {
  if (!id) return null
  
  // Chercher d'abord dans les médicaments du formulaire
  const med = form.value.medicaments.find(m => m.ID_medicament === id)
  if (med && med.medicament) {
    return med.medicament
  }
  
  // Sinon, chercher dans le store
  return medicationStore.getMedicamentById(id)
}



// Watch for changes in medicationStore.medications for debugging
watch(() => medicationStore.medications, (newMedications) => {
  if (newMedications) {
    console.log('Medications loaded:', newMedications.length)
  }
})

// Handler for selecting a medication from suggestions
function handleMedicationSelect(medication: any, index: number) {
  const med = form.value.medicaments[index]
  med.ID_medicament = medication._id
  med.medicament = medication
  med.searchQuery = medication.nomCommercial
  med.posologie = medication.posologieStandard || ''
  med.voieAdmin = medication.voieAdministration || 'orale'
}

// Function to add a new medication field in the form
function addMedication() {
  form.value.medicaments.push({
    ID_medicament: '',
    medicament: null,
    searchQuery: '',
    posologie: '',
    quantite: 1,
    duree: '',
    frequence: '1 fois par jour',
    voieAdmin: 'orale',
    instructions: ''
  })
}

// Function to remove a medication from the form
function removeMedication(index: number) {
  form.value.medicaments.splice(index, 1)
}

// Handler for closing the modal and resetting the form
function handleClose() {
  form.value = {
    patient: {
      _id: null,
      dossier_id: null,
      utilisateur: {
        nom: '',
        prenom: ''
      }
    },
    medicaments: [{
      ID_medicament: '',
      medicament: null,
      searchQuery: '',
      posologie: '',
      quantite: 1,
      duree: '',
      frequence: '1 fois par jour',
      voieAdmin: 'orale',
      instructions: ''
    }],
    pharmacistNotes: '',
    renouvelable: false,
    urgent: false,
    nonSubstituable: false
  }
  
  showPreview.value = false
  emit('close')
}

// Function to preview the prescription
async function previewPrescription() {
  showPreview.value = true
  try {
    await generatePrescriptionPDF(form.value, true)
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Erreur lors de la génération de l\'aperçu'
    })
  }
}

// Function to print the prescription
async function printPrescription() {
  try {
    const pdfBlob = await generatePrescriptionPDF(form.value, false)
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

// Handler for form submission using the ordonnanceStore
async function handleSubmit() {
  if (!isFormValid.value) return
  
  try {
    isSubmitting.value = true

    const validMedicaments = form.value.medicaments.filter(med => 
      med.ID_medicament && 
      med.posologie && 
      med.quantite > 0 &&
      med.frequence
    )

    if (validMedicaments.length === 0) {
      throw new Error('Au moins un médicament valide est requis')
    }

    const submitData = {
      patient_id: form.value.patient._id, 
      dossier_id: form.value.patient.dossier_id || null,
      renouvelable: form.value.renouvelable,
      medicaments: validMedicaments.map(med => ({
        medicament_id: med.ID_medicament,
        posologie: med.posologie.trim(),
        duree: med.duree?.trim(),
        frequence: med.frequence,
        quantite: med.quantite,
        instructions: med.instructions?.trim() || null
      }))
    }
    
    console.log('Submitting data:', submitData)
    
    const result = await ordonnanceStore.createOrdonnance(submitData)
    
    toastStore.show({
      type: 'success',
      message: `L'ordonnance pour ${form.value.patient.utilisateur.nom} ${form.value.patient.utilisateur.prenom} a été créée avec succès`
    })
    
    handleClose()
    
  } catch (error) {
    console.error('Error creating ordonnance:', error)
    showNotification({
      type: 'error',
      message: error.response?.data?.message || 'Erreur lors de la création de l\'ordonnance'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.medication-item {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 
         dark:border-gray-700 transition-all duration-200
         hover:shadow-md;
}

.medication-header {
  @apply flex justify-between items-center mb-4;
}

.medication-number {
  @apply w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 
         flex items-center justify-center text-sm font-medium 
         text-primary-700 dark:text-primary-300;
}

.medication-info {
  @apply p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg;
}

.add-medication-button {
  @apply w-full flex items-center justify-center px-4 py-3 
         border-2 border-dashed border-gray-300 dark:border-gray-600 
         rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 
         hover:border-primary-500 dark:hover:border-primary-400 
         hover:text-primary-600 dark:hover:text-primary-400 
         transition-colors duration-200;
}

.delete-button {
  @apply text-red-500 hover:text-red-600 dark:text-red-400 
         dark:hover:text-red-300 transition-all duration-200;
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
</style>
