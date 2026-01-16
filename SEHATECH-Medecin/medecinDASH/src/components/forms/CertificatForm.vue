<template>
  <Modal 
    title="Nouveau certificat"
    size="form"
    @close="$emit('close')"
  >
    <form @submit.prevent="submit" class="space-y-8">
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
          <div class="grid grid-cols-1 gap-6">
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

            <div class="form-group">
              <label class="form-label">Période</label>
              <div class="grid grid-cols-2 gap-4">
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

            <div class="form-group">
              <label class="form-label required">Contenu</label>
              <textarea
                v-model="form.contenu"
                rows="6"
                class="form-textarea"
                required
                placeholder="Contenu détaillé du certificat..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <FormActions
        :disabled="!isFormValid"
        @cancel="$emit('cancel')"
        @preview="handlePreview"
        @submit="handleSubmit"
      />
    </form>

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

    <!-- Modal de recherche patient -->
    <PatientSearchModal
      v-if="showPatientSearch"
      @close="showPatientSearch = false"
      @select="handlePatientSelect"
    />
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  UserCircle, FileCheck, Search
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import FormActions from './common/FormActions.vue'
import CertificatPreview from '@/components/preview/CertificatPreview.vue'
import { generateCertificatPDF } from '@/utils/pdfGenerator'
import { useAuthStore } from '@/stores/auth'
import { usePatientStore } from '@/stores/patientStore'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'cancel', 'close'])

const authStore = useAuthStore()
const showPreview = ref(false)

const form = ref({
  ID_dossier_medical: props.initialData?.ID_dossier_medical || '',
  type: props.initialData?.type || 'medical',
  motif: props.initialData?.motif || '',
  dateDebut: props.initialData?.dateDebut || '',
  dateFin: props.initialData?.dateFin || '',
  contenu: props.initialData?.contenu || ''
})

const patientName = ref('')
const showPatientSearch = ref(false)
let searchTimeout
const selectedPatient = ref(null)

const isFormValid = computed(() => {
  return form.value.ID_dossier_medical && 
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

function handlePatientSelect(patient) {
  form.value.ID_dossier_medical = patient.ID_dossier_medical
  patientName.value = `${patient.nom} ${patient.prenom}`
  showPatientSearch.value = false
}

function handlePatientInput(event) {
  const name = event.target.value
  patientName.value = name
  
  // Recherche automatique si l'utilisateur tape plus de 2 caractères
  if (name.length >= 2) {
    // Petite temporisation pour éviter trop d'appels API
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(async () => {
      try {
        console.log(`Recherche de patients pour: "${name}"`);
        const patientStore = usePatientStore()
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
    // Réinitialiser l'ID du dossier médical si moins de 2 caractères
    form.value.ID_dossier_medical = '';
  }
}

function handlePreview() {
  showPreview.value = true
}

function handleSubmit() {
  emit('submit', form.value)
}
</script> 