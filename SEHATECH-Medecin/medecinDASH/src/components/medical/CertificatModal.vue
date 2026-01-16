<template>
  <Modal 
    :title="editMode ? 'Modifier le certificat' : 'Nouveau certificat'"
    size="lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
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
          <div class="form-group">
            <label class="form-label required">Patient</label>
            <div class="flex space-x-3">
              <div class="flex-1">
                <input 
                  type="text"
                  v-model="patientName"
                  class="form-input"
                  placeholder="Nom du patient"
                  @input="handlePatientInput"
                  :class="{'border-red-500': !form.patient_id && formSubmitted}"
                />
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
            <p v-if="!form.patient_id" class="text-sm text-red-500 mt-1">
              Veuillez sélectionner un patient
            </p>
          </div>
        </div>
      </div>

      <!-- Détails du certificat -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <FileCheck class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Détails du certificat</h4>
          </div>
          <p class="form-subtitle">Informations du certificat médical</p>
        </div>
        <div class="form-content">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group">
              <label class="form-label required">Type de certificat</label>
              <select v-model="form.type" class="form-select" required>
                <option value="aptitude">Certificat d'aptitude</option>
                <option value="inaptitude">Certificat d'inaptitude</option>
                <option value="presence">Certificat de présence</option>
                <option value="medical">Certificat médical</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Motif</label>
              <input 
                type="text"
                v-model="form.motif"
                class="form-input"
                required
                placeholder="Motif du certificat"
              />
            </div>

            <div class="form-group md:col-span-2">
              <label class="form-label">Période</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm text-gray-500">Du</label>
                  <input 
                    type="date"
                    v-model="form.dateDebut"
                    class="form-input"
                  />
                </div>
                <div>
                  <label class="text-sm text-gray-500">Au</label>
                  <input 
                    type="date"
                    v-model="form.dateFin"
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <div class="form-group md:col-span-2">
              <label class="form-label required">Contenu</label>
              <textarea
                v-model="form.contenu"
                rows="6"
                class="form-textarea"
                required
                placeholder="Contenu détaillé du certificat..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Statut</label>
              <select v-model="form.statut" class="form-select">
                <option value="actif">Actif</option>
                <option value="expire">Expiré</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
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
          type="button"
          class="btn btn-outline"
          @click="handlePreview"
        >
          Prévisualiser
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid"
        >
          {{ editMode ? 'Mettre à jour' : 'Enregistrer' }}
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
      <CertificatPreview
        v-if="showPreview"
        :certificat="formattedCertificat"
        :doctor-name="currentDoctor.name"
        :speciality="currentDoctor.speciality"
        :address="currentDoctor.address"
        :city="currentDoctor.city"
        @close="showPreview = false"
      />
    </Teleport>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  UserCircle, FileCheck, Search
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import CertificatPreview from '@/components/preview/CertificatPreview.vue'
import { useAuthStore } from '@/stores/auth'
import { useCertificatStore } from '@/stores/certificatStore'
import { useNotification } from '@/composables/useNotification'
import { usePatientStore } from '@/stores/patientStore'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel', 'close'])

const authStore = useAuthStore()
const certificatStore = useCertificatStore()
const { showNotification } = useNotification()
const patientStore = usePatientStore()

const showPreview = ref(false)
const showPatientSearch = ref(false)
const patientName = ref('')
const selectedPatient = ref(null)
const isLoading = ref(false)
const editMode = computed(() => !!props.initialData?._id || !!props.initialData?.id)
const searchTimeout = ref(null)
const formSubmitted = ref(false)

const form = ref({
  patient_id: props.initialData?.patient_id || '',
  type: props.initialData?.type || 'medical',
  motif: props.initialData?.motif || '',
  contenu: props.initialData?.contenu || '',
  dateDebut: props.initialData?.dateDebut || '',
  dateFin: props.initialData?.dateFin || '',
  statut: props.initialData?.statut || 'actif'
})

// Initialiser le nom du patient si on est en mode édition
onMounted(() => {
  if (editMode.value && props.initialData?.patient) {
    patientName.value = `${props.initialData.patient.nom} ${props.initialData.patient.prenom}`
    selectedPatient.value = props.initialData.patient
  }
})

const isFormValid = computed(() => {
  return form.value.patient_id && 
         form.value.type &&
         form.value.motif &&
         form.value.contenu
})

// Données formatées pour la prévisualisation
const formattedCertificat = computed(() => ({
  ...form.value,
  date: new Date(),
  patientName: patientName.value,
  dateNaissance: selectedPatient.value?.dateNaissance
}))

// Informations du médecin connecté
const currentDoctor = computed(() => ({
  name: authStore.user?.name || '',
  speciality: authStore.user?.speciality || 'Médecin généraliste',
  address: authStore.user?.address || '',
  city: authStore.user?.city || ''
}))

function handlePatientInput(event) {
  const name = event.target.value
  patientName.value = name
  
  // Recherche automatique si l'utilisateur tape plus de 2 caractères
  if (name.length >= 2) {
    // Petite temporisation pour éviter trop d'appels API
    clearTimeout(searchTimeout.value)
    searchTimeout.value = setTimeout(async () => {
      try {
        console.log(`Recherche de patients pour: "${name}"`);
        const results = await patientStore.searchPatients(name)
        
        if (results && results.length > 0) {
          console.log(`${results.length} patients trouvés`);
          
          // Vérifier s'il y a une correspondance exacte
          const exactMatch = results.find(p => 
            (p.utilisateur?.nom?.toLowerCase() + ' ' + p.utilisateur?.prenom?.toLowerCase()) === name.toLowerCase() ||
            (p.utilisateur?.prenom?.toLowerCase() + ' ' + p.utilisateur?.nom?.toLowerCase()) === name.toLowerCase()
          );
          
          if (exactMatch) {
            console.log('Correspondance exacte trouvée, sélection automatique');
            handlePatientSelect(exactMatch);
          } else if (results.length === 1) {
            // Si on trouve un seul patient, on le sélectionne automatiquement
            console.log('Un seul résultat trouvé, sélection automatique');
            handlePatientSelect(results[0]);
          } else {
            // Si on a plusieurs résultats, on ouvre la modal de recherche
            console.log('Plusieurs résultats trouvés, ouverture de la modal');
            showPatientSearch.value = true;
          }
        } else {
          console.log('Aucun patient trouvé');
        }
      } catch (error) {
        console.error('Erreur lors de la recherche automatique:', error);
      }
    }, 300)
  } else {
    // Réinitialiser l'ID du patient si moins de 2 caractères
    form.value.patient_id = '';
    selectedPatient.value = null;
  }
}

function handlePatientSelect(patient) {
  console.log('Patient sélectionné dans CertificatModal:', patient);
  
  // S'assurer que nous avons un ID valide
  const patientId = patient._id || patient.id;
  
  if (!patientId) {
    console.error('Erreur: ID du patient manquant dans les données sélectionnées', patient);
    showNotification({
      type: 'error',
      message: 'ID du patient manquant, impossible de continuer'
    });
    return;
  }
  
  form.value.patient_id = patientId;
  patientName.value = `${patient.nom || ''} ${patient.prenom || ''}`.trim();
  selectedPatient.value = patient;
  showPatientSearch.value = false;
  
  console.log('Formulaire mis à jour avec l\'ID du patient:', form.value);
}

function handlePreview() {
  showPreview.value = true
}

async function handleSubmit() {
  console.log('Soumission du formulaire de certificat:', form.value);
  
  // Éviter la double soumission
  if (isLoading.value) {
    console.log('Soumission déjà en cours, ignorée');
    return;
  }
  
  // Validation côté client
  if (!form.value.patient_id) {
    showNotification({
      type: 'error',
      message: 'Veuillez sélectionner un patient'
    });
    return;
  }
  
  if (!form.value.type) {
    showNotification({
      type: 'error',
      message: 'Veuillez sélectionner un type de certificat'
    });
    return;
  }
  
  if (!form.value.motif) {
    showNotification({
      type: 'error',
      message: 'Veuillez saisir un motif'
    });
    return;
  }
  
  if (!form.value.contenu) {
    showNotification({
      type: 'error',
      message: 'Veuillez saisir le contenu du certificat'
    });
    return;
  }
  
  isLoading.value = true;
  formSubmitted.value = true;
  
  try {
    // Préparation des données
    const certificatData = { ...form.value };
    
    // Conversion des dates au format ISO
    if (certificatData.dateDebut) {
      certificatData.dateDebut = new Date(certificatData.dateDebut).toISOString();
    }
    
    if (certificatData.dateFin) {
      certificatData.dateFin = new Date(certificatData.dateFin).toISOString();
    }
    
    console.log('Données préparées pour envoi:', certificatData);
    
    // Création ou mise à jour du certificat
    if (props.initialData && props.initialData._id) {
      await certificatStore.updateCertificat(props.initialData._id, certificatData);
      showNotification({
        type: 'success',
        message: 'Certificat mis à jour avec succès'
      });
    } else {
      await certificatStore.createCertificat(certificatData);
      showNotification({
        type: 'success',
        message: 'Certificat créé avec succès'
      });
    }
    
    // Fermer le modal et rafraîchir les données
    emit('close');
    emit('refresh');

    // Réinitialiser le formulaire
    resetForm();
  } catch (error) {
    console.error('Erreur lors de la soumission du certificat:', error);
    
    let errorMessage = 'Une erreur est survenue lors de la création du certificat';
    
    // Extraction des messages d'erreur spécifiques
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification({
      type: 'error',
      message: errorMessage
    });
  } finally {
    isLoading.value = false;
    formSubmitted.value = false;
  }
}

// Fonction pour réinitialiser le formulaire
function resetForm() {
  form.value = {
    patient_id: '',
    type: 'medical',
    motif: '',
    contenu: '',
    dateDebut: '',
    dateFin: '',
    statut: 'actif'
  };
  patientName.value = '';
  selectedPatient.value = null;
}
</script>

<style scoped>
.form-section {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
         dark:border-gray-700 p-6;
}

.form-header {
  @apply mb-4;
}

.form-title {
  @apply text-lg font-medium text-gray-900 dark:text-white;
}

.form-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-1;
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
         dark:bg-gray-800 dark:text-white sm:text-sm transition-colors
         dark:placeholder-gray-400;
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

.btn-outline {
  @apply bg-white text-primary-600 border border-primary-500 
         hover:bg-primary-50 focus:ring-primary-500
         dark:bg-transparent dark:text-primary-400 dark:border-primary-500
         dark:hover:bg-primary-900/20;
}
</style> 