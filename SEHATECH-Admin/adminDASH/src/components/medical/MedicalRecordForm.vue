<template>
  <BaseModal :title="record ? 'Modifier le dossier' : 'Nouveau dossier'" @close="cancelCreation">
    <!-- Bouton de fermeture "X" en haut à droite -->
    <button @click="cancelCreation" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
      aria-label="Fermer">
      &times;
    </button>

    <!-- Navigation entre étapes -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <nav class="flex space-x-4">
        <button v-for="(step, index) in steps" :key="index" type="button"
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200" :class="currentStep === index
    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'" @click="currentStep = index">
          <span class="flex items-center">
            <span class="w-6 h-6 flex items-center justify-center rounded-full border mr-2" :class="currentStep === index
    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
    : 'border-gray-300 dark:border-gray-600'">
              {{ index + 1 }}
            </span>
            {{ step }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Section de recherche de patient (sous la navigation) -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <label class="form-label" for="patient-search">Rechercher un patient</label>
      <div class="relative">
        <input id="patient-search" v-model="patientSearch" type="text" class="form-input w-full"
          placeholder="Rechercher par nom, prénom ou téléphone..." @input="searchPatients" />
        <ul v-if="filteredPatients.length && patientSearch"
          class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <li v-for="patientItem in filteredPatients" :key="patientItem._id" @click="selectPatient(patientItem)"
            class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center">
            <div>
              <div class="font-medium">
                {{ patientItem.utilisateur.prenom }} {{ patientItem.utilisateur.nom }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Tél: {{ patientItem.utilisateur.telephone }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Formulaire -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Step 0: Infos Patient & Médecin -->
      <div v-if="currentStep === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <!-- Informations Patient (lecture seule) -->
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Informations Patient</h3>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label class="form-label">Prénom</label>
              <input type="text" :value="patient?.utilisateur?.prenom" disabled class="form-input bg-gray-50" />
            </div>
            <div>
              <label class="form-label">Nom</label>
              <input type="text" :value="patient?.utilisateur?.nom" disabled class="form-input bg-gray-50" />
            </div>
            <div>
              <label class="form-label">Date de naissance</label>
              <input type="text" :value="formattedBirthDate" disabled class="form-input bg-gray-50" />
            </div>
            <div>
              <label class="form-label">Âge</label>
              <input type="number" :value="patientAge" disabled class="form-input bg-gray-50" />
            </div>
            <div class="sm:col-span-2">
              <label class="form-label">Adresse</label>
              <textarea :value="patient?.utilisateur?.adresse" disabled class="form-textarea bg-gray-50"></textarea>
            </div>
            <div>
              <label class="form-label">Téléphone</label>
              <input type="tel" :value="patient?.utilisateur?.telephone" disabled class="form-input bg-gray-50" />
            </div>
          </div>
        </div>

        <!-- Médecin Traitant -->
        <div class="mb-6">
          <label class="form-label" for="traitant">Médecin traitant</label>
          <input id="traitant" v-model="doctorSearch" type="text" class="form-input"
            placeholder="Rechercher un médecin..." />
          <ul v-if="filteredDoctors.length" class="border border-gray-300 rounded mt-2 max-h-48 overflow-y-auto">
            <li v-for="doctor in filteredDoctors" :key="doctor._id" @click="selectDoctor(doctor)"
              class="p-2 hover:bg-gray-100 cursor-pointer">
              {{ doctor.utilisateur.prenom }} {{ doctor.utilisateur.nom }} - {{ doctor.specialite }}
            </li>
          </ul>
          <div v-if="form.traitant">
            <p class="mt-2 text-sm">
              Médecin sélectionné :
              {{ form.traitant.utilisateur.prenom }} {{ form.traitant.utilisateur.nom }} - {{ form.traitant.specialite
              }}
            </p>
          </div>
        </div>

        <!-- Emergency Contact (lecture seule) -->
        <div class="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h4 class="text-base font-medium text-gray-900 dark:text-white mb-4">Contact d'urgence</h4>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label class="form-label" for="emergency-name">Nom complet</label>
              <input id="emergency-name" :value="form.emergencyContact.name" type="text" disabled
                class="form-input bg-gray-50" />
            </div>
            <div>
              <label class="form-label" for="emergency-relationship">Lien de parenté</label>
              <input id="emergency-relationship" :value="form.emergencyContact.relationship" type="text" disabled
                class="form-input bg-gray-50" />
            </div>
            <div>
              <label class="form-label" for="emergency-phone">Téléphone principal</label>
              <input id="emergency-phone" :value="form.emergencyContact.phone" type="tel" disabled
                class="form-input bg-gray-50" />
            </div>
            <div>
              <label class="form-label" for="emergency-phone-alt">Téléphone secondaire</label>
              <input id="emergency-phone-alt" :value="form.emergencyContact.phoneAlt" type="tel" disabled
                class="form-input bg-gray-50" />
            </div>
            <div class="sm:col-span-2">
              <label class="form-label" for="emergency-address">Adresse</label>
              <textarea id="emergency-address" :value="form.emergencyContact.address" disabled
                class="form-textarea bg-gray-50"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 1: Détails de la Consultation -->
      <div v-else-if="currentStep === 1" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Détails de la Consultation</h3>
        <div class="space-y-6">
          <div>
            <label class="form-label" for="dateEntree">Date d'entrée</label>
            <input id="dateEntree" v-model="form.dateEntree" type="datetime-local" required class="form-input" />
          </div>
          <div>
            <label class="form-label" for="raisonEntree">Motif de consultation</label>
            <textarea id="raisonEntree" v-model="form.raisonEntree" rows="3" required class="form-textarea"></textarea>
          </div>
          <div>
            <label class="form-label" for="observations">Observations</label>
            <textarea id="observations" v-model="form.consultationObservations" rows="3" required
              class="form-textarea"></textarea>
          </div>
          <div>
            <label class="form-label" for="consultationDiagnostic">Diagnostic de consultation</label>
            <textarea id="consultationDiagnostic" v-model="form.consultationDiagnostic" rows="3" required
              class="form-textarea"></textarea>
          </div>
        </div>
      </div>

      <!-- Step 2: Antécédents -->
      <div v-else-if="currentStep === 2" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Antécédents</h3>
          <div class="space-y-6">
            <div>
              <label class="form-label">Antécédents médicaux</label>
              <div class="space-y-2">
                <div v-for="(item, index) in form.antecedentsMedicaux" :key="index" class="flex gap-2">
                  <input v-model="form.antecedentsMedicaux[index]" type="text" class="form-input flex-1" />
                  <button type="button" class="text-red-500 hover:text-red-700"
                    @click="removeHistoryItem('medical', index)">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
                <button type="button" class="btn btn-secondary w-full" @click="addHistoryItem('medical')">
                  <Plus class="w-4 h-4 mr-2" />
                  Ajouter un antécédent médical
                </button>
              </div>
            </div>
            <div>
              <label class="form-label">Antécédents chirurgicaux</label>
              <div class="space-y-2">
                <div v-for="(item, index) in form.antecedentsChirurgicaux" :key="index" class="flex gap-2">
                  <input v-model="form.antecedentsChirurgicaux[index]" type="text" class="form-input flex-1" />
                  <button type="button" class="text-red-500 hover:text-red-700"
                    @click="removeHistoryItem('surgical', index)">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
                <button type="button" class="btn btn-secondary w-full" @click="addHistoryItem('surgical')">
                  <Plus class="w-4 h-4 mr-2" />
                  Ajouter un antécédent chirurgical
                </button>
              </div>
            </div>
            <div>
              <label class="form-label">Antécédents familiaux</label>
              <div class="space-y-2">
                <div v-for="(item, index) in form.antecedentsFamiliaux" :key="index" class="flex gap-2">
                  <input v-model="form.antecedentsFamiliaux[index]" type="text" class="form-input flex-1" />
                  <button type="button" class="text-red-500 hover:text-red-700"
                    @click="removeHistoryItem('family', index)">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
                <button type="button" class="btn btn-secondary w-full" @click="addHistoryItem('family')">
                  <Plus class="w-4 h-4 mr-2" />
                  Ajouter un antécédent familial
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Examens -->
      <div v-else-if="currentStep === 3" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Examens</h3>
          <div class="space-y-6">
            <div>
              <label class="form-label" for="examenType">Type d'examen</label>
              <input id="examenType" v-model="form.examen.type" type="text" required class="form-input"
                placeholder="Ex : Radiologie, Biologie..." />
            </div>
            <div>
              <label class="form-label" for="examenDate">Date de l'examen</label>
              <input id="examenDate" v-model="form.examen.date" type="datetime-local" required class="form-input" />
            </div>
            <div>
              <label class="form-label" for="examenResultat">Résultats</label>
              <textarea id="examenResultat" v-model="form.examen.resultatText" rows="4" class="form-textarea"
                placeholder="Saisir les résultats (chaque ligne sera un élément)"></textarea>
            </div>
            <div>
              <label class="form-label" for="examenInterpretation">Interprétation</label>
              <textarea id="examenInterpretation" v-model="form.examen.interpretation" rows="3" class="form-textarea"
                placeholder="Saisir l'interprétation si applicable"></textarea>
            </div>
            <div>
              <label class="form-label" for="examenStatut">Statut</label>
              <select id="examenStatut" v-model="form.examen.statut" class="form-select" required>
                <option value="">Sélectionner</option>
                <option value="en_attente">En attente</option>
                <option value="effectue">Effectué</option>
                <option value="analyse">Analyse</option>
                <option value="valide">Valide</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="examenFichiers">Fichiers à télécharger</label>
              <input id="examenFichiers" type="file" multiple @change="handleExamenFileUpload" class="form-input" />
              <div v-if="form.examen.fichiers && form.examen.fichiers.length" class="mt-2">
                <ul class="list-disc pl-5">
                  <li v-for="(file, index) in form.examen.fichiers" :key="index">
                    {{ file.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Traitements -->
      <div v-else-if="currentStep === 4" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Diagnostic et Traitement</h3>
          <div>
            <label class="form-label" for="diagnostic">Diagnostic</label>
            <textarea id="diagnostic" v-model="form.diagnostic" rows="3" required class="form-textarea"></textarea>
          </div>
          <div>
            <label class="form-label" for="traitement">Traitement / Chirurgie</label>
            <textarea id="traitement" v-model="form.traitement" rows="3" class="form-textarea"></textarea>
          </div>
          <div>
            <label class="form-label" for="surveillance">Surveillance</label>
            <textarea id="surveillance" v-model="form.surveillance" rows="3" class="form-textarea"></textarea>
          </div>
          <div>
            <label class="form-label" for="evolution">Évolution</label>
            <textarea id="evolution" v-model="evolutionText" rows="3" class="form-textarea"></textarea>
          </div>
          <!-- Upload de Documents -->
          <div class="mb-6">
            <label class="form-label" for="documents">Documents à télécharger</label>
            <input id="documents" type="file" multiple @change="handleFileUpload" class="form-input" />
            <div v-if="form.documents.length" class="mt-2">
              <ul class="list-disc pl-5">
                <li v-for="(file, index) in form.documents" :key="index">
                  {{ file.name }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button type="button" class="btn btn-secondary flex items-center"
          @click="currentStep === 0 ? cancelCreation() : previousStep()">
          <ChevronLeft class="w-4 h-4 mr-2" />
          {{ currentStep === 0 ? 'Annuler' : 'Précédent' }}
        </button>
        <div class="flex space-x-3">
          <button type="submit" class="btn btn-primary flex items-center" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
            <Save v-else class="w-4 h-4 mr-2" />
            Enregistrer
          </button>
          <button v-if="currentStep < steps.length - 1" type="button" class="btn btn-primary flex items-center"
            @click="nextStep">
            Suivant
            <ChevronRight class="w-4 h-4 ml-2" />
          </button>
          <button v-else type="button" class="btn btn-success flex items-center" @click="finishForm">
            Terminer
            <Check class="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Save, Check } from 'lucide-vue-next';
import BaseModal from '@/components/BaseModal.vue';
import { useMedicalRecordStore } from '@/stores/medicalRecord';
import { useAuthStore } from '@/stores/auth';
import { useDoctorStore } from '@/stores/doctors';
import { usePatientStore } from '@/stores/patients';
import { useConsultationsStore } from '@/stores/consultations';
import { useExamensStore } from '@/stores/examens';
import { useAlertStore } from '@/stores/alert';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  record: {
    type: Object,
    default: null
  },
  patientId: {
    type: [String, Object],
    required: false
  }
});
const emit = defineEmits(['save', 'cancel']);
const toast = useToast();
const medicalRecordStore = useMedicalRecordStore();
const authStore = useAuthStore();
const doctorStore = useDoctorStore();
const patientStore = usePatientStore();
const consultationsStore = useConsultationsStore();
const examensStore = useExamensStore();
const alertStore = useAlertStore();

// Recherche et sélection de patient
const patientSearch = ref('');
const filteredPatients = computed(() => {
  if (!patientSearch.value) return [];
  const searchTerm = patientSearch.value.toLowerCase();
  return patientStore.patients.filter(patientItem => {
    const fullName = `${patientItem.utilisateur.prenom} ${patientItem.utilisateur.nom}`.toLowerCase();
    const phone = patientItem.utilisateur.telephone?.toLowerCase() || '';
    return fullName.includes(searchTerm) || phone.includes(searchTerm);
  });
});
const searchPatients = async () => {
  if (!patientSearch.value) return;
  try {
    await patientStore.searchPatients(patientSearch.value);
  } catch (error) {
    toast.error('Erreur lors de la recherche des patients');
  }
};
const selectPatient = async (selectedPatient) => {
  try {
    patientSearch.value = `${selectedPatient.utilisateur.prenom} ${selectedPatient.utilisateur.nom}`;
    let patientData = patientStore.patients.find(p => p._id === selectedPatient._id);
    if (!patientData || !patientData.contactsUrgence || !patientData.contactsUrgence.length) {
      patientData = await patientStore.fetchPatientById(selectedPatient._id);
    }
    patient.value = patientData;
    const emergency =
      (patient.value.contacts_urgence && patient.value.contacts_urgence.length)
        ? patient.value.contacts_urgence[0]
        : (patient.value.emergencyContact ||
          patient.value.utilisateur?.contacts_urgence?.[0] ||
          patient.value.utilisateur?.emergencyContact);
    if (emergency && typeof emergency === 'object') {
      form.value.emergencyContact = {
        name: emergency.nom || emergency.name || '',
        relationship: emergency.relation || emergency.relationship || '',
        phone: emergency.telephone || emergency.phone || '',
        phoneAlt: emergency.telephone_secondaire || emergency.phoneAlt || '',
        address: emergency.adresse || emergency.address || ''
      };
    } else {
      form.value.emergencyContact = {
        name: '',
        relationship: '',
        phone: '',
        phoneAlt: '',
        address: ''
      };
    }
    if (patient.value.antecedentsMedicaux && patient.value.antecedentsMedicaux.length > 0) {
      form.value.antecedentsMedicaux = [...patient.value.antecedentsMedicaux];
    }
    if (patient.value.antecedentsChirurgicaux && patient.value.antecedentsChirurgicaux.length > 0) {
      form.value.antecedentsChirurgicaux = [...patient.value.antecedentsChirurgicaux];
    }
    if (patient.value.antecedentsFamiliaux && patient.value.antecedentsFamiliaux.length > 0) {
      form.value.antecedentsFamiliaux = [...patient.value.antecedentsFamiliaux];
    }
    toast.success('Données du patient chargées avec succès');
  } catch (error) {
    toast.error('Erreur lors du chargement des données du patient');
    console.error('Erreur lors du chargement des données du patient:', error);
  }
};

// Pour afficher le patient sélectionné en lecture seule
const patient = ref(
  props.patientId
    ? (typeof props.patientId === 'object'
      ? props.patientId
      : patientStore.patients.find(p => p._id === props.patientId))
    : null
);
const formattedBirthDate = computed(() => {
  const birth = patient.value?.dateNaissance || patient.value?.utilisateur?.dateNaissance;
  return birth ? new Date(birth).toLocaleDateString() : '';
});
const patientAge = computed(() => {
  const birth = patient.value?.dateNaissance || patient.value?.utilisateur?.dateNaissance;
  if (birth) {
    const birthDate = new Date(birth);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
  return '';
});

// Structure du formulaire incluant les champs de consultation et d'examen
const form = ref({
  dateEntree: props.record?.dateEntree || new Date().toISOString().slice(0, 16),
  raisonEntree: props.record?.raisonEntree || '',
  consultationObservations: props.record?.consultation?.observations || '',
  consultationDiagnostic: props.record?.consultation?.diagnostic || '',
  antecedentsMedicaux: props.record?.antecedents?.medicaux || [],
  antecedentsChirurgicaux: props.record?.antecedents?.chirurgicaux || [],
  antecedentsFamiliaux: props.record?.antecedents?.familiaux || [],
  // Objet examen dédié
  examen: {
    type: props.record?.examen?.type || '',
    date: props.record?.examen?.date ? new Date(props.record.examen.date).toISOString().slice(0, 16) : '',
    resultatText: props.record?.examen?.resultat ? props.record.examen.resultat.join('\n') : '',
    interpretation: props.record?.examen?.interpretation || '',
    statut: props.record?.examen?.statut || '',
    fichiers: props.record?.examen?.fichiers || []
  },
  diagnostic: props.record?.diagnostic || '',
  traitement: props.record?.traitement || '',
  surveillance: props.record?.surveillance || '',
  evolution: props.record?.evolution || [],
  documents: props.record?.documents || [],
  traitant: props.record?.traitant || null,
  emergencyContact: props.record?.emergencyContact || {
    name: '',
    relationship: '',
    phone: '',
    phoneAlt: '',
    address: '',
    notes: ''
  }
});

const steps = ['Infos & Médecin'];
const currentStep = ref(0);
const isSubmitting = ref(false);

const nextStep = () => {
  if (currentStep.value < steps.length - 1) currentStep.value++;
};
const previousStep = () => {
  if (currentStep.value > 0) currentStep.value--;
};

// Gestion des antécédents
const addHistoryItem = (type) => {
  const historyMap = {
    medical: 'antecedentsMedicaux',
    surgical: 'antecedentsChirurgicaux',
    family: 'antecedentsFamiliaux'
  };
  form.value[historyMap[type]].push('');
};
const removeHistoryItem = (type, index) => {
  const historyMap = {
    medical: 'antecedentsMedicaux',
    surgical: 'antecedentsChirurgicaux',
    family: 'antecedentsFamiliaux'
  };
  form.value[historyMap[type]].splice(index, 1);
};

const evolutionText = computed({
  get() {
    return Array.isArray(form.value.evolution)
      ? form.value.evolution.join('\n')
      : '';
  },
  set(value) {
    form.value.evolution = value.split('\n').filter(line => line.trim() !== '');
  }
});

// Recherche et sélection du médecin
const doctorSearch = ref('');
const filteredDoctors = computed(() => {
  if (!doctorSearch.value) return doctorStore.doctors;
  const searchTerm = doctorSearch.value.toLowerCase();
  return doctorStore.doctors.filter(doctor => {
    const fullName = `${doctor.utilisateur.prenom} ${doctor.utilisateur.nom}`.toLowerCase();
    return fullName.includes(searchTerm) || doctor.specialite.toLowerCase().includes(searchTerm);
  });
});
const selectDoctor = (doctor) => {
  form.value.traitant = doctor;
  doctorSearch.value = `${doctor.utilisateur.prenom} ${doctor.utilisateur.nom}`;
};

// Fonction de téléchargement de fichiers pour documents généraux
const handleFileUpload = (event) => {
  const selectedFiles = event.target.files;
  form.value.documents = Array.from(selectedFiles);
};

// Fonction de téléchargement de fichiers pour l'examen
const handleExamenFileUpload = (event) => {
  const selectedFiles = event.target.files;
  form.value.examen.fichiers = Array.from(selectedFiles);
};

// Fonction pour fermer immédiatement le formulaire
const cancelCreation = () => {
  emit('cancel');
};

// Fonction finishForm : déclenche handleSubmit et ferme le formulaire immédiatement
const finishForm = async () => {
  await handleSubmit();
  // handleSubmit émet 'save' en cas de succès
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    // Vérification de la sélection du patient et du médecin traitant
    if (!patient.value || !form.value.traitant) {
      const toast = useToast();
      toast.error('Veuillez sélectionner un patient et un médecin traitant');
      console.error('Patient ou médecin non sélectionné', { patient: patient.value, traitant: form.value.traitant });
      return;
    }

    // Fusionner les antécédents
    const antecedents = [
      ...form.value.antecedentsMedicaux.filter(item => item.trim()),
      ...form.value.antecedentsChirurgicaux.filter(item => item.trim()),
      ...form.value.antecedentsFamiliaux.filter(item => item.trim())
    ];
    console.log('Antécédents fusionnés:', antecedents);

    // Préparer les données pour l'examen
    const examenDataForRecord = {
      type: form.value.examen.type,
      date: form.value.examen.date,
      resultat: form.value.examen.resultatText.split('\n').filter(line => line.trim() !== ''),
      interpretation: form.value.examen.interpretation,
      statut: form.value.examen.statut
    };
    console.log('Données examen préparées:', examenDataForRecord);

    // Préparer les données du dossier médical
    const recordData = {
      dateEntree: form.value.dateEntree,
      raisonEntree: form.value.raisonEntree,
      antecedents,
      examen: examenDataForRecord,
      diagnostic: form.value.diagnostic,
      traitement: form.value.traitement,
      surveillance: form.value.surveillance,
      evolution: Array.isArray(form.value.evolution)
        ? form.value.evolution
        : [form.value.evolution].filter(Boolean),
      documents: form.value.documents,
      medecin_id: form.value.traitant ? form.value.traitant._id : undefined,
      emergencyContact: form.value.emergencyContact
    };
    console.log('Données dossier préparées:', recordData);

    // Détermination de l'ID du patient
    const patientIdToUse =
      props.patientId && typeof props.patientId === 'string'
        ? props.patientId
        : patient.value && (patient.value._id || patient.value);
    console.log('Patient ID utilisé:', patientIdToUse);
    if (!patientIdToUse) throw new Error('Patient ID manquant');

    let dossier = null;
    if (props.record) {
      dossier = await medicalRecordStore.updateRecord(props.record._id, recordData);
      console.log('Dossier mis à jour:', dossier);
      toast.success('Dossier mis à jour avec succès');
    } else {
      dossier = await medicalRecordStore.createRecord(patientIdToUse, recordData);
      console.log('Dossier créé:', dossier);
      toast.success('Dossier créé avec succès');
    }

    const dossierId = dossier._id;
    console.log('ID du dossier:', dossierId);

    // Création de la consultation (si l'utilisateur n'est pas admin)
    if (authStore.user.role !== 'admin') {
      const consultationData = {
        patient: patient.value._id,
        medecin: form.value.traitant._id,
        dateConsultation: form.value.dateEntree,
        motifConsultation: form.value.raisonEntree,
        observations: form.value.consultationObservations,
        diagnostic: form.value.consultationDiagnostic
      };
      console.log('Données de consultation:', consultationData);

      if (props.record) {
        await consultationsStore.updateConsultation(dossierId, consultationData);
        console.log('Consultation mise à jour');
      } else {
        await consultationsStore.addConsultation(dossierId, consultationData);
        console.log('Consultation créée');
      }
    }
    console.log('Fichiers sélectionnés:', form.value.examen.fichiers);

    // Création de l'examen si les champs obligatoires sont renseignés
    if (form.value.examen.type && form.value.examen.date) {
      const examenPayload = {
        ...examenDataForRecord,
        fichiers: form.value.examen.fichiers,
        dossier_id: dossierId,
        medecin_id: form.value.traitant ? form.value.traitant._id : undefined
      };
      console.log('Données examen envoyées:', examenPayload);
      await examensStore.addExamen(dossierId, examenPayload);
      console.log('Examen créé');
    }

    // Fermer immédiatement le formulaire
    emit('save');
  } catch (error) {
    const toast = useToast();
    toast.error(error.message || "Erreur lors de l'enregistrement");
    console.error('Erreur lors de la soumission du formulaire:', error);
  } finally {
    isSubmitting.value = false;
  }
};


</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white sm:text-sm transition-colors duration-200;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[120px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600;
}

.btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700;
}

.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600;
}

.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
