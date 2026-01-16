<template>
  <Modal
    :title="surgery?.id ? 'Modifier l\'intervention' : 'Nouvelle intervention'"
    size="xl"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Contenu principal -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <!-- En-tête du formulaire -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Informations de l'intervention
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Remplissez les informations nécessaires pour planifier l'intervention chirurgicale
          </p>
        </div>

        <!-- Corps du formulaire -->
        <div class="p-6 space-y-6">
          <!-- Patient et Type d'intervention -->
          <div class="grid grid-cols-2 gap-8">
            <div class="form-group">
              <label class="form-label required">Patient</label>
              <div class="relative">
                <button 
                  type="button"
                  @click="showPatientSearch = true"
                  class="form-input pl-10 text-left w-full flex justify-between items-center"
                >
                  <span v-if="selectedPatient">
                    {{ selectedPatient.nom }} {{ selectedPatient.prenom }}
                  </span>
                  <span v-else class="text-gray-400">
                    Sélectionner un patient
                  </span>
                  <Search class="w-4 h-4 text-gray-400" />
                </button>
                <UserCircle class="form-icon" />
              </div>
              <p v-if="errors.patient" class="form-error">{{ errors.patient }}</p>
            </div>

            <div class="form-group">
              <label class="form-label required">Type d'intervention</label>
              <div class="relative">
                <select v-model="form.type_operation" class="form-select pl-10" required>
                  <option value="">Sélectionner le type</option>
                  <option value="Chirurgie cardiaque">Chirurgie cardiaque</option>
                  <option value="Chirurgie orthopédique">Chirurgie orthopédique</option>
                  <option value="Neurochirurgie">Neurochirurgie</option>
                  <option value="Chirurgie générale">Chirurgie générale</option>
                </select>
                <Stethoscope class="form-icon" />
              </div>
            </div>
          </div>

          <!-- Date et Heure -->
          <div class="grid grid-cols-2 gap-8">
            <div class="form-group">
              <label class="form-label required">Date</label>
              <div class="relative">
                <input
                  type="date"
                  v-model="form.date"
                  class="form-input pl-10"
                  required
                  :min="minDate"
                />
                <Calendar class="form-icon" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label required">Heure</label>
              <div class="relative">
                <input
                  type="time"
                  v-model="timeOnly"
                  class="form-input pl-10"
                  required
                  @input="updateDateWithTime"
                />
                <Clock class="form-icon" />
              </div>
            </div>
          </div>

          <!-- Durée et Salle -->
          <div class="grid grid-cols-2 gap-8">
            <div class="form-group">
              <label class="form-label required">Durée (min)</label>
              <div class="relative">
                <input
                  type="number"
                  v-model="form.duree_prevue"
                  class="form-input pl-10"
                  min="15"
                  step="15"
                  required
                />
                <Timer class="form-icon" />
              </div>
              <p class="form-help">Durée minimale : 15 minutes</p>
            </div>
            <div class="form-group">
              <label class="form-label required">Bloc Opératoire</label>
              <div class="relative">
                <select v-model="form.blocOperatoire_id" class="form-select pl-10" required>
                  <option value="">Sélectionner un bloc</option>
                   <option v-for="bloc in blocsOperatoires" 
                          :key="bloc._id" 
                          :value="bloc._id">
                    Bloc {{ bloc.numerosalle }} - {{ bloc.type }}
                  </option>
                </select>
              <Building2 class="form-icon" />
                  </div>
              </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label class="form-label">Notes</label>
            <div class="relative">
              <textarea
                v-model="form.notes"
                rows="4"
                class="form-textarea pl-10"
                placeholder="Notes importantes concernant l'intervention..."
              ></textarea>
              <ClipboardList class="form-icon top-3" />
            </div>
          </div>

          <!-- Consentement et informations importantes -->
          <div class="form-group border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <div class="flex items-start mb-4">
              <div class="flex-shrink-0">
                <AlertCircle class="w-5 h-5 text-amber-500" />
              </div>
              <div class="ml-3">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  Consentement et informations importantes
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Assurez-vous d'avoir obtenu le consentement du patient et vérifié les points suivants
                </p>
              </div>
            </div>

            <div class="space-y-4 ml-8">
              <label class="flex items-start">
                <input
                  type="checkbox"
                  v-model="form.consent.patientInformed"
                  required
                  class="form-checkbox mt-1"
                />
                <span class="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Le patient a été informé des risques et des alternatives possibles
                </span>
              </label>

              <label class="flex items-start">
                <input
                  type="checkbox"
                  v-model="form.consent.signedForm"
                  required
                  class="form-checkbox mt-1"
                />
                <span class="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Le formulaire de consentement a été signé par le patient
                </span>
              </label>

              <label class="flex items-start">
                <input
                  type="checkbox"
                  v-model="form.consent.preOpChecks"
                  required
                  class="form-checkbox mt-1"
                />
                <span class="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Les examens pré-opératoires sont à jour et validés
                </span>
              </label>

              <div class="form-group mt-4">
                <label class="form-label">Commentaires supplémentaires</label>
                <textarea
                  v-model="form.consent.comments"
                  rows="2"
                  class="form-textarea"
                  placeholder="Autres informations concernant le consentement..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Barre d'actions -->
      <div class="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700 mt-6">
        <div class="flex justify-between items-center space-x-4">
          <div class="flex items-center space-x-3">
            <button
              type="button"
              class="btn btn-secondary"
              @click="showPreview = true"
            >
              <Eye class="w-4 h-4 mr-2" />
              Aperçu
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="printSurgery"
            >
              <Printer class="w-4 h-4 mr-2" />
              Imprimer
            </button>
          </div>
          <div class="flex items-center space-x-3">
            <button
              type="button"
              class="btn btn-secondary"
              @click="$emit('close')"
            >
              <X class="w-4 h-4 mr-2" />
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <Save class="w-4 h-4 mr-2" />
              {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </form>

    <!-- Ajouter le modal de prévisualisation -->
    <Modal
      v-if="showPreview"
      title="Aperçu de l'intervention"
      size="lg"
      @close="showPreview = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6" id="surgery-preview">
        <!-- En-tête -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Fiche d'intervention chirurgicale
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            {{ form.date ? formatDate(form.date) : 'Non définie' }}
          </p>
        </div>

        <!-- Informations principales -->
        <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="preview-card">
            <h3 class="preview-title">Patient</h3>
            <p class="preview-content">{{ getPatientName(form.patient_id) }}</p>
          </div>

          <div class="preview-card">
            <h3 class="preview-title">Type d'intervention</h3>
            <p class="preview-content">{{ getSurgeryTypeLabel(form.type_operation) }}</p>
          </div>

          <div class="preview-card">
            <h3 class="preview-title">Date et heure</h3>
            <p class="preview-content">{{ form.date ? formatDate(form.date) : 'Non définie' }} à {{ form.heure_debut }}</p>
          </div>

          <div class="preview-card">
            <h3 class="preview-title">Durée prévue</h3>
            <p class="preview-content">{{ form.duree_prevue }} minutes</p>
          </div>

          <div class="preview-card">
            <h3 class="preview-title">Salle</h3>
            <p class="preview-content">{{ getSalleLabel(form.salle_operation) }}</p>
          </div>
        </div>

        <!-- Notes -->
        <div class="preview-section bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 class="preview-title mb-2">Notes</h3>
          <p class="preview-content whitespace-pre-line">{{ form.notes || 'Aucune note' }}</p>
        </div>

        <!-- Consentement -->
        <div class="space-y-4">
          <h3 class="preview-title">Consentement et vérifications</h3>
          <div class="space-y-3">
            <div class="consent-item" :class="form.consent.patientInformed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
              <CheckCircle2 :class="form.consent.patientInformed ? 'text-green-500' : 'text-red-500'" class="w-5 h-5" />
              <span class="ml-3">Information du patient</span>
            </div>
            <div class="consent-item" :class="form.consent.signedForm ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
              <CheckCircle2 :class="form.consent.signedForm ? 'text-green-500' : 'text-red-500'" class="w-5 h-5" />
              <span class="ml-3">Formulaire de consentement signé</span>
            </div>
            <div class="consent-item" :class="form.consent.preOpChecks ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
              <CheckCircle2 :class="form.consent.preOpChecks ? 'text-green-500' : 'text-red-500'" class="w-5 h-5" />
              <span class="ml-3">Examens pré-opératoires validés</span>
            </div>
          </div>

          <div v-if="form.consent.comments" class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mt-4">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Commentaires :</h4>
            <p class="text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {{ form.consent.comments }}
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3 px-6 py-4">
          <button
            type="button"
            class="btn btn-secondary"
            @click="printSurgery"
          >
            <Printer class="w-4 h-4 mr-2" />
            Imprimer
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="showPreview = false"
          >
            Fermer
          </button>
        </div>
      </template>
    </Modal>

    <!-- Ajouter le modal de recherche de patient -->
    <PatientSearchModal
      v-if="showPatientSearch"
      @close="showPatientSearch = false"
      @select="handlePatientSelect"
    />
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  UserCircle, Stethoscope, Calendar, Clock, Timer,
  Building2, ClipboardList, Save, X, AlertCircle, Eye, Printer, CheckCircle2, Search
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import { useSurgeryStore } from '@/stores/surgery'
import { useBlocOperatoireStore } from '@/stores/blocOperatoire'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import axiosInstance from '@/services/axios'

const surgeryStore = useSurgeryStore()
const surgeries = ref([])
const blocOperatoireStore = useBlocOperatoireStore()
const props = defineProps({
  surgery: {
    type: Object,
    default: null
  }
})
const authStore = useAuthStore()


const emit = defineEmits(['close', 'submit'])
const { showNotification } = useNotification()

// États
const isSubmitting = ref(false)
const blocsOperatoires = ref([])
const showPatientSearch = ref(false)
const selectedPatient = ref(null)
const errors = ref({
  patient: null
})

// Date minimum (aujourd'hui)
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Formulaire
const form = ref({
  date: '',
  type_operation: '',
  duree_prevue: '',
  heure_debut: '',
  notes: '',
  statut: 'planifie',
  patient_id: '',
  dossier_id: '',
  medecin_id: authStore.user?.medecin?._id || '',
  salle_operation: '',
  blocOperatoire_id: '',
  consent: {
    patientInformed: false,
    signedForm: false,
    preOpChecks: false,
    comments: ''
  }
})
// Add this with your other refs
const timeOnly = ref('')

// Add this function to combine date and time
function updateDateWithTime() {
  if (form.value.date && timeOnly.value) {
    // Create a new date object from the date string
    const dateObj = new Date(form.value.date)
    
    // Parse the time string (HH:MM)
    const [hours, minutes] = timeOnly.value.split(':').map(Number)
    
    // Set the hours and minutes in local time
    dateObj.setHours(hours, minutes, 0, 0)
    
    // Create an ISO string but preserve the local time by adjusting for timezone offset
    const tzOffset = dateObj.getTimezoneOffset() * 60000 // offset in milliseconds
    const adjustedDate = new Date(dateObj.getTime() - tzOffset)
    
    // Stocker la date ISO complète dans une autre propriété
    form.value.date_complete = adjustedDate.toISOString()
    
    // Garder form.value.date au format yyyy-MM-dd pour l'input HTML
    // form.value.date reste inchangé car il est déjà au bon format
  }
}

// Add this to onMounted to extract time from existing date if editing
onMounted(async () => {
  try {
    // Fetch operating rooms
    await blocOperatoireStore.fetchBlocsOperatoires()
    blocsOperatoires.value = blocOperatoireStore.blocsOperatoires

    // Fetch surgeries
    await surgeryStore.fetchSurgeries()
    surgeries.value = surgeryStore.surgeries
    
    if (props.surgery) {
      // Extract date and time from the surgery date
      const surgeryDate = props.surgery.date ? new Date(props.surgery.date) : null
      
      form.value = {
        date: surgeryDate ? surgeryDate.toISOString().split('T')[0] : '',
        type_operation: props.surgery.type_operation || props.surgery.type || '',
        duree_prevue: props.surgery.duree_prevue || '',
        notes: props.surgery.notes || props.surgery.rapportOperation || '',
        statut: props.surgery.statut || 'planifie',
        patient_id: props.surgery.patient_id || '',
        dossier_id: props.surgery.dossier_id || '',
        medecin_id: props.surgery.medecin_id || authStore.user?.medecin?._id || '',
        salle_operation: props.surgery.salle_operation || '',
        blocOperatoire_id: props.surgery.blocOperatoire_id || '',
        consent: {
          patientInformed: false,
          signedForm: false,
          preOpChecks: false,
          comments: ''
        }
      }
      
      // Set the time from the surgery date
      if (surgeryDate) {
        const hours = surgeryDate.getHours().toString().padStart(2, '0')
        const minutes = surgeryDate.getMinutes().toString().padStart(2, '0')
        timeOnly.value = `${hours}:${minutes}`
      }
    }
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Erreur lors du chargement des données'
    })
  }
})

// Fonction pour gérer la sélection d'un patient
function handlePatientSelect(patient) {
  console.log('Patient sélectionné:', patient);
  
  // Mettre à jour le patient sélectionné même s'il n'a pas de dossier médical
  selectedPatient.value = {
    id: patient._id,
    nom: patient.nom || patient.utilisateur?.nom || 'Patient',
    prenom: patient.prenom || patient.utilisateur?.prenom || 'sans nom',
    dossier_id: patient.dossiers_medicaux && patient.dossiers_medicaux.length > 0 
               ? patient.dossiers_medicaux[0]._id 
               : null
  };
  
  form.value.patient_id = patient._id;
  
  // Vérifier si le patient a un dossier médical
  if (!patient.dossiers_medicaux || patient.dossiers_medicaux.length === 0) {
    console.warn('Patient sans dossier médical:', patient);
    
    // Essayer de récupérer le dossier médical directement depuis l'API
    axiosInstance.get(`/patients/${patient._id}`)
      .then(response => {
        if (response.data && response.data.dossiers_medicaux && response.data.dossiers_medicaux.length > 0) {
          console.log('Dossier médical récupéré:', response.data.dossiers_medicaux[0]);
          
          // Mettre à jour le patient avec le dossier médical
          selectedPatient.value.dossier_id = response.data.dossiers_medicaux[0]._id;
          form.value.dossier_id = selectedPatient.value.dossier_id;
          errors.value.patient = null;
          
          showNotification({
            type: 'success',
            message: 'Patient avec dossier médical sélectionné avec succès'
          });
        } else if (response.data && response.data.dossier_medical) {
          // Fallback pour l'ancien format de réponse API
          console.log('Dossier médical récupéré (ancien format):', response.data.dossier_medical);
          
          selectedPatient.value.dossier_id = response.data.dossier_medical._id || response.data.dossier_medical;
          form.value.dossier_id = selectedPatient.value.dossier_id;
          errors.value.patient = null;
          
          showNotification({
            type: 'success',
            message: 'Patient avec dossier médical sélectionné avec succès'
          });
        } else {
          // Nous gardons quand même le patient même sans dossier
          showNotification({
            type: 'warning',
            message: "Ce patient n'a pas de dossier médical, mais l'intervention peut quand même être créée"
          });
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération du dossier médical:', error);
        showNotification({
          type: 'warning',
          message: "Impossible de vérifier le dossier médical, l'intervention sera créée avec les informations disponibles"
        });
      });
  } else {
    // Le patient a déjà un dossier médical
    selectedPatient.value.dossier_id = patient.dossiers_medicaux[0]._id;
    form.value.dossier_id = selectedPatient.value.dossier_id;
    errors.value.patient = null;
    
    showNotification({
      type: 'success',
      message: 'Patient sélectionné avec succès'
    });
  }
  
  showPatientSearch.value = false;
}

const selectedBlocNumerosalle = computed(() => {
  const selectedBloc = blocsOperatoires.value.find(
    bloc => bloc._id === form.value.blocOperatoire_id
  )
  // Retourner le numéro de salle ou 'Non spécifié' si non disponible
  return selectedBloc?.numeroSalle || 'Non spécifié'
})

// Soumission du formulaire
async function handleSubmit() {
  try {
    // Vérifier si un patient est sélectionné
    if (!selectedPatient.value || !selectedPatient.value.id) {
      errors.value.patient = "Veuillez sélectionner un patient";
      showNotification({
        type: 'error',
        message: 'Veuillez sélectionner un patient'
      });
      return;
    }
    
    // Vérifier que tous les champs obligatoires sont remplis
    if (!form.value.type_operation || !form.value.date || !timeOnly.value || !form.value.blocOperatoire_id) {
      showNotification({
        type: 'error',
        message: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }
    
    // Make sure date and time are combined
    updateDateWithTime();
    
    // Vérifier que la durée est un nombre
    if (isNaN(form.value.duree_prevue) || form.value.duree_prevue <= 0) {
      showNotification({
        type: 'error',
        message: 'La durée doit être un nombre positif'
      });
      return;
    }
    
    // Vérifier que le bloc sélectionné a un numéro de salle
    if (!selectedBlocNumerosalle.value) {
      showNotification({
        type: 'error',
        message: 'Le bloc opératoire sélectionné n\'a pas de numéro de salle'
      });
      return;
    }
    
    // Vérifier si le patient a un dossier médical
    if (!selectedPatient.value.dossier_id) {
      console.warn("Patient sans dossier médical, tentative de création de l'opération sans dossier");
      showNotification({
        type: 'warning',
        message: "Un dossier médical est requis pour créer une opération. Veuillez contacter l'administrateur."
      });
      return;
    }
    
    isSubmitting.value = true;
    
    // Formater la date si nécessaire
    const date_operation = form.value.date_complete || form.value.date;
    
    const surgeryData = {
      patient_id: selectedPatient.value.id,
      type_operation: form.value.type_operation,
      date_operation: date_operation,
      heure_debut: form.value.heure_debut,
      duree_prevue: parseInt(form.value.duree_prevue),
      salle_operation: selectedBlocNumerosalle.value,
      notes: form.value.notes || '',
      medecin_id: authStore.user?.medecin?._id,
      statut: 'planifie',
      // Ajouter explicitement le dossier_id et blocOperatoire_id
      dossier_id: selectedPatient.value.dossier_id,
      blocOperatoire_id: form.value.blocOperatoire_id
    }
    
    // Ajouter id si on modifie une intervention existante
    if (props.surgery?._id) {
      surgeryData.id = props.surgery._id;
    }
    
    console.log('Données d\'opération à soumettre:', surgeryData);
    
    // Vérification finale des données obligatoires
    if (!surgeryData.dossier_id) {
      throw new Error("Dossier médical manquant");
    }
    
    if (!surgeryData.blocOperatoire_id) {
      throw new Error("Bloc opératoire manquant");
    }
    
    emit('submit', surgeryData);
    emit('close');
  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    showNotification({
      type: 'error',
      message: `Erreur lors de l'enregistrement: ${error.message}`
    });
  } finally {
    isSubmitting.value = false;
  }
}

// État pour le modal de prévisualisation
const showPreview = ref(false)

// Fonctions utilitaires
function formatDate(date) {
  if (!date) return ''
  try {
    // S'assurer que la date est au bon format
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(parsedDate, 'dd MMMM yyyy', { locale: fr })
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return ''
  }
}

function getPatientName(dossierId) {
  const surgery = surgeries.value.find(s => s.dossier?._id === dossierId)
  if (!surgery?.dossier?.patient?.utilisateur) return 'Inconnu'
  console.log(surgery?.dossier?.patient?.utilisateur)
  const { nom, prenom } = surgery.dossier.patient.utilisateur
  return `${nom} ${prenom}`
}

function getSurgeryTypeLabel(type) {
  const types = {
    appendicectomy: 'Appendicectomie',
    cholecystectomy: 'Cholécystectomie',
    hernia: 'Hernie',
    colonoscopy: 'Coloscopie'
  }
  return types[type] || 'Inconnu'
}

function getSalleLabel(salle) {
  const salles = {
    'bloc-a': 'Bloc A',
    'bloc-b': 'Bloc B',
    'bloc-c': 'Bloc C'
  }
  return salles[salle] || 'Inconnu'
}

function printSurgery() {
  const printContent = document.getElementById('surgery-preview')
  const WinPrint = window.open('', '', 'width=900,height=650')
  WinPrint.document.write(`
    <html>
      <head>
        <title>Fiche d'intervention chirurgicale</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
          }
          .header h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h3 {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .section p {
            margin: 0;
            color: #333;
            font-size: 16px;
          }
          .consent-item {
            display: flex;
            align-items: center;
            padding: 12px;
            background: #f9f9f9;
            margin-bottom: 10px;
            border-radius: 6px;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `)
  WinPrint.document.close()
  WinPrint.focus()
  setTimeout(() => {
    WinPrint.print()
    WinPrint.close()
  }, 250)
}
</script>

<style scoped>
/* Améliorer les styles */
.form-group {
  @apply space-y-2 relative;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-label.required:after {
  content: " *";
  @apply text-red-500;
}

.form-help {
  @apply mt-1 text-sm text-gray-500 dark:text-gray-400;
}

.form-icon {
  @apply absolute left-3 top-1/2 -translate-y-1/2 
         w-5 h-5 text-gray-400 pointer-events-none;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 
         shadow-sm focus:border-primary-500 
         focus:ring-primary-500 focus:ring-opacity-50
         dark:bg-gray-700 dark:border-gray-600 
         dark:text-white transition-colors duration-200
         hover:border-gray-400 dark:hover:border-gray-500;
}

.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium 
         rounded-lg transition-colors duration-200
         focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 
         focus:ring-primary-500 shadow-sm;
}

.btn-secondary {
  @apply bg-white text-gray-700 hover:bg-gray-50 
         border border-gray-300 focus:ring-primary-500
         dark:bg-gray-800 dark:text-gray-300 
         dark:border-gray-600 dark:hover:bg-gray-700;
}

.form-section {
  @apply bg-white dark:bg-gray-800 rounded-lg 
         border border-gray-200 dark:border-gray-700 
         overflow-hidden transition-shadow p-6;
}

.section-header {
  @apply text-lg font-medium text-gray-900 
         dark:text-white mb-4;
}

/* Styles pour les checkboxes */
.form-checkbox {
  @apply rounded border-gray-300 text-primary-600
         focus:ring-primary-500 dark:border-gray-600
         dark:bg-gray-700 dark:checked:bg-primary-500
         h-4 w-4 transition-colors duration-200;
}

.checkbox-label {
  @apply ml-3 text-sm text-gray-700 dark:text-gray-300;
}

.preview-card {
  @apply bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4;
}

.preview-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.preview-content {
  @apply text-gray-900 dark:text-white text-base;
}

.consent-item {
  @apply flex items-center p-4 rounded-lg;
}
</style>