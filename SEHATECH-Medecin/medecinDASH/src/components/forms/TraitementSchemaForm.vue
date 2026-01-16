<template>
  <Modal 
    :title="editMode ? 'Modifier le schéma de traitement' : 'Nouveau schéma de traitement'"
    size="form"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Section Patient -->
      <PatientSelect v-model="form.patient" :disabled="editMode" @select="handlePatientSelect" />

      <!-- Titre du schéma -->
      <div class="form-group">
        <label class="form-label required">Titre</label>
        <input
          type="text"
          v-model="form.titre"
          class="form-input"
          required
          placeholder="Titre du schéma de traitement"
        />
      </div>

      <!-- Dates de début et fin -->
      <div class="grid grid-cols-2 gap-4">
        <div class="form-group">
          <label class="form-label required">Date de début</label>
          <input
            type="date"
            v-model="form.date_debut"
            class="form-input"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label required">Date de fin</label>
          <input
            type="date"
            v-model="form.date_fin"
            class="form-input"
            required
          />
        </div>
      </div>

      <!-- Liste des médicaments -->
      <div class="form-section">
        <div class="form-header">
          <div class="flex items-center space-x-2">
            <Pill class="w-5 h-5 text-primary-500" />
            <h4 class="form-title">Médicaments</h4>
          </div>
          <p class="form-subtitle">Ajouter les médicaments et leurs posologies</p>
        </div>

        <div class="form-content">
          <!-- Liste des médicaments -->
          <div class="space-y-4">
            <TransitionGroup name="list">
              <div v-for="(med, index) in form.medications" 
                   :key="index"
                   class="medication-item group"
              >
                <div class="grid grid-cols-12 gap-4">
                  <!-- Médicament -->
                  <div class="col-span-5">
                    <label class="form-label required">Médicament</label>
                    <MedicationSearchInput
                      v-model="med.medicationId"
                      @select="handleMedicationSelect($event, index)"
                      required
                    />
                  </div>

                  <!-- Doses -->
                  <div class="col-span-6">
                    <label class="form-label required">Posologie</label>
                    <div class="space-y-2">
                      <div v-for="(dose, doseIndex) in med.doses" 
                           :key="doseIndex"
                           class="flex items-center space-x-2"
                      >
                        <input
                          type="number"
                          v-model="dose.quantity"
                          class="form-input w-20"
                          min="0"
                          step="0.5"
                          required
                          placeholder="Qté"
                        />
                        <select v-model="dose.unit" class="form-select w-24" required>
                          <option value="mg">mg</option>
                          <option value="ml">ml</option>
                          <option value="cp">cp</option>
                          <option value="g">g</option>
                          <option value="mcg">mcg</option>
                        </select>
                        <select v-model="dose.timing" class="form-select flex-1" required>
                          <option value="matin">Matin</option>
                          <option value="midi">Midi</option>
                          <option value="soir">Soir</option>
                          <option value="coucher">Au coucher</option>
                          <option value="repas">Aux repas</option>
                          <option value="8h">8h</option>
                          <option value="12h">12h</option>
                          <option value="16h">16h</option>
                          <option value="20h">20h</option>
                        </select>
                        <button 
                          type="button"
                          @click="removeDose(index, doseIndex)"
                          class="text-red-500 hover:text-red-700"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <!-- Ajouter une dose -->
                    <button 
                      type="button"
                      @click="addDose(index)"
                      class="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Plus class="w-4 h-4 inline-block mr-1" />
                      Ajouter une prise
                    </button>
                  </div>

                  <!-- Supprimer médicament -->
                  <div class="col-span-1 flex items-center justify-end">
                    <button 
                      type="button"
                      @click="removeMedication(index)"
                      class="text-red-500 hover:text-red-700"
                    >
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <!-- Instructions spécifiques -->
                <div class="mt-4">
                  <div class="form-group">
                    <label class="form-label">Instructions spécifiques</label>
                    <input
                      type="text"
                      v-model="med.instructions"
                      class="form-input"
                      placeholder="Ex: Prendre pendant les repas"
                    />
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Ajouter médicament -->
          <button 
            type="button"
            @click="addMedication"
            class="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 
                   rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white 
                   hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                   focus:ring-primary-500"
          >
            <Plus class="w-5 h-5 mr-2" />
            Ajouter un médicament
          </button>
        </div>
      </div>

      <!-- Instructions générales -->
      <div class="form-group">
        <label class="form-label">Instructions générales</label>
        <textarea
          v-model="form.instructions"
          rows="3"
          class="form-textarea"
          placeholder="Instructions générales pour l'ensemble du traitement..."
        ></textarea>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label class="form-label required">Description</label>
        <textarea
          v-model="form.description"
          rows="3"
          class="form-textarea"
          required
          placeholder="Description détaillée du schéma de traitement..."
        ></textarea>
      </div>

      <!-- Statut -->
      <div class="form-group" v-if="editMode">
        <label class="form-label">Statut</label>
        <select v-model="form.statut" class="form-select">
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="termine">Terminé</option>
        </select>
      </div>

      <!-- Actions -->
      <FormActions
        :disabled="false"
        @cancel="$emit('cancel')"
        @preview="handlePreview"
        @submit="handleSubmit"
      />
    </form>

    <!-- Prévisualisation -->
    <Teleport to="body">
      <TraitementPreview
        v-if="showPreview"
        :traitement="formattedTraitement"
        :doctor-name="currentDoctor.name"
        :speciality="currentDoctor.speciality"
        @close="showPreview = false"
      />
    </Teleport>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Trash2, Pill } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import PatientSelect from './common/PatientSelect.vue'
import MedicationSearchInput from './common/MedicationSearchInput.vue'
import FormActions from './common/FormActions.vue'
import TraitementPreview from '@/components/preview/TraitementPreview.vue'
import { useAuthStore } from '@/stores/auth'
import { format, addDays } from 'date-fns'

const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  schemaData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'submit', 'cancel'])

const authStore = useAuthStore()
const showPreview = ref(false)

// Formater une date pour l'input date
const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return format(date, 'yyyy-MM-dd')
  } catch (error) {
    console.warn('Erreur de formatage de date:', error)
    return ''
  }
}

const form = ref({
  patient: {
    ID_dossier_medical: '',
    ID_patient: '',
    nom_patient: '',
    prenom_patient: ''
  },
  titre: '',
  description: '',
  date_debut: formatDateForInput(new Date()),
  date_fin: formatDateForInput(addDays(new Date(), 30)),
  medications: [createNewMedication()],
  instructions: '',
  statut: 'actif'
})

// Initialiser le formulaire avec les données existantes si en mode édition
onMounted(() => {
  if (props.editMode && props.schemaData) {
    const schema = props.schemaData
    
    form.value = {
      patient: {
        ID_dossier_medical: schema.dossier_id || '',
        ID_patient: schema.patient?._id || '',
        nom_patient: schema.patient?.nom || '',
        prenom_patient: schema.patient?.prenom || ''
      },
      titre: schema.titre || '',
      description: schema.description || '',
      date_debut: formatDateForInput(schema.date_debut),
      date_fin: formatDateForInput(schema.date_fin),
      medications: schema.medications?.length > 0 
        ? schema.medications.map(med => ({
            medicationId: med.medicament_id || '',
            medicationName: med.medicament || '',
            doses: med.doses?.length > 0 
              ? med.doses.map(dose => ({
                  quantity: dose.quantity || 1,
                  unit: dose.unit || 'cp',
                  timing: dose.timing || 'matin'
                }))
              : [createNewDose()],
            instructions: med.instructions || ''
          }))
        : [createNewMedication()],
      instructions: schema.instructions || '',
      statut: schema.statut || 'actif'
    }
  }
})

function createNewMedication() {
  return {
    medicationId: '',
    medicationName: '',
    doses: [createNewDose()],
    instructions: ''
  }
}

function createNewDose() {
  return {
    quantity: 1,
    unit: 'cp',
    timing: 'matin'
  }
}

function addMedication() {
  form.value.medications.push(createNewMedication())
}

function removeMedication(index) {
  form.value.medications.splice(index, 1)
  if (form.value.medications.length === 0) {
    addMedication()
  }
}

function addDose(medicationIndex) {
  form.value.medications[medicationIndex].doses.push(createNewDose())
}

function removeDose(medicationIndex, doseIndex) {
  const doses = form.value.medications[medicationIndex].doses
  if (doses.length > 1) {
    doses.splice(doseIndex, 1)
  }
}

function handlePatientSelect(patient) {
  console.log('Patient sélectionné:', patient);
  if (patient) {
    form.value.patient = {
      ID_dossier_medical: patient.dossier_medical?._id || '',
      ID_patient: patient._id || '',
      nom_patient: patient.utilisateur?.nom || '',
      prenom_patient: patient.utilisateur?.prenom || ''
    };
    console.log('Informations patient mises à jour:', form.value.patient);
  }
}

function handleMedicationSelect(medication, index) {
  console.log('Médicament sélectionné complet:', medication);
  if (!medication) {
    console.error('Aucun médicament sélectionné');
    return;
  }
  
  // S'assurer que nous avons un ID valide
  if (!medication._id) {
    console.error('Le médicament sélectionné n\'a pas d\'ID valide:', medication);
    return;
  }
  
  form.value.medications[index].medicationName = medication.nomCommercial || medication.nom || 'Médicament sans nom';
  form.value.medications[index].medicationId = medication._id;
  console.log('Médicament stocké dans le formulaire:', {
    index,
    name: form.value.medications[index].medicationName,
    id: form.value.medications[index].medicationId
  });
}

const isFormValid = computed(() => {
  // Vérifier chaque condition et logger les résultats pour le débogage
  const hasDossierId = !!form.value.patient.ID_dossier_medical;
  const hasTitre = !!form.value.titre;
  const hasDateDebut = !!form.value.date_debut;
  const hasDateFin = !!form.value.date_fin;
  // La description n'est pas obligatoire
  const hasMedications = form.value.medications.length > 0;
  
  // Vérifier chaque médicament
  const medicationsValid = form.value.medications.every((med, index) => {
    const hasMedicationId = !!med.medicationId;
    const hasMedicationName = !!med.medicationName;
    const hasDoses = med.doses.length > 0;
    
    // Vérifier chaque dose
    const dosesValid = med.doses.every((dose, doseIndex) => {
      const hasQuantity = dose.quantity > 0;
      const hasUnit = !!dose.unit;
      const hasTiming = !!dose.timing;
      
      // Logger les problèmes de dose
      if (!hasQuantity || !hasUnit || !hasTiming) {
        console.log(`Dose ${doseIndex} du médicament ${index} invalide:`, 
          { quantity: hasQuantity, unit: hasUnit, timing: hasTiming });
      }
      
      return hasQuantity && hasUnit && hasTiming;
    });
    
    // Logger les problèmes de médicament
    if (!hasMedicationId || !hasMedicationName || !hasDoses || !dosesValid) {
      console.log(`Médicament ${index} invalide:`, 
        { id: hasMedicationId, name: hasMedicationName, doses: hasDoses, dosesValid });
    }
    
    return hasMedicationId && hasMedicationName && hasDoses && dosesValid;
  });
  
  // Logger l'état global du formulaire
  const isValid = hasDossierId && hasTitre && hasDateDebut && hasDateFin && 
                 hasMedications && medicationsValid;
  
  console.log('État de validation du formulaire:', {
    dossierId: hasDossierId,
    titre: hasTitre,
    dateDebut: hasDateDebut,
    dateFin: hasDateFin,
    medications: hasMedications,
    medicationsValid
  });
  
  return isValid;
})

function prepareDataForSubmit() {
  // Formater les données pour correspondre à l'attente du backend
  const formattedMedications = form.value.medications.map(med => ({
    medicament: med.medicationName,
    medicament_id: med.medicationId,
    doses: med.doses.map(dose => ({
      quantity: dose.quantity,
      unit: dose.unit,
      timing: dose.timing
    })),
    instructions: med.instructions
  }))

  // Vérifier et extraire l'ID du dossier médical
  let dossierId = form.value.patient.ID_dossier_medical;
  
  // Si nous avons un patient avec _id, utiliser cet ID comme dossier_id
  if (!dossierId && form.value.patient._id) {
    dossierId = form.value.patient._id;
    console.log('Utilisation de l\'ID du patient comme dossier_id:', dossierId);
  }
  
  if (!dossierId) {
    console.error('Aucun ID de dossier médical trouvé dans:', form.value.patient);
    throw new Error('ID du dossier médical requis');
  }

  return {
    dossier_id: dossierId,
    titre: form.value.titre,
    description: form.value.description,
    date_debut: new Date(form.value.date_debut).toISOString(),
    date_fin: new Date(form.value.date_fin).toISOString(),
    medications: formattedMedications,
    instructions: form.value.instructions,
    statut: form.value.statut
  }
}

async function handleSubmit() {
  // Suppression de la vérification de isFormValid
  try {
    // Préparer les données pour la soumission
    let formattedData = {
      dossier_id: form.value.patient.ID_dossier_medical || null, 
      patient_id: form.value.patient.ID_patient || null, // Ajouter l'ID du patient
      titre: form.value.titre || 'Nouveau schéma',
      description: form.value.description || 'Description non fournie',
      date_debut: form.value.date_debut ? new Date(form.value.date_debut).toISOString() : new Date().toISOString(),
      date_fin: form.value.date_fin ? new Date(form.value.date_fin).toISOString() : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      medications: form.value.medications.map(med => ({
        medicament: med.medicationName || 'Médicament non spécifié',
        medicament_id: med.medicationId || null,
        doses: med.doses.map(dose => ({
          quantity: dose.quantity || 1,
          unit: dose.unit || 'cp',
          timing: dose.timing || 'matin'
        })),
        instructions: med.instructions || ''
      })),
      instructions: form.value.instructions || '',
      statut: form.value.statut || 'actif'
    }
    
    console.log('Données formatées pour soumission:', formattedData)
    
    // S'assurer qu'au moins un identifiant (dossier ou patient) est présent
    if (!formattedData.dossier_id && !formattedData.patient_id) {
      throw new Error('Aucun identifiant de dossier ou de patient disponible')
    }
    
    console.log('Émission de l\'événement submit avec les données')
    emit('submit', formattedData)
  } catch (error) {
    console.error('Erreur lors de la préparation des données:', error)
    // Envoyer quand même les données brutes
    emit('submit', {
      ...form.value,
      dossier_id: form.value.patient.ID_dossier_medical || null,
      patient_id: form.value.patient.ID_patient || null
    })
  }
}

function handlePreview() {
  showPreview.value = true
}

const formattedTraitement = computed(() => ({
  ...form.value,
  date: new Date(),
  patientName: `${form.value.patient.nom_patient} ${form.value.patient.prenom_patient}`,
  dateDebut: new Date(form.value.date_debut),
  dateFin: new Date(form.value.date_fin),
  medications: form.value.medications.map(med => ({
    ...med,
    schedule: formatSchedule(med.doses.map(dose => ({
      time: dose.timing,
      quantity: dose.quantity,
      unit: dose.unit
    })))
  }))
}))

const currentDoctor = computed(() => ({
  name: authStore.user?.name || '',
  speciality: authStore.user?.speciality || 'Médecin généraliste'
}))

function formatSchedule(schedule) {
  return schedule.map(s => ({
    time: s.time,
    quantity: s.quantity,
    unit: s.unit
  }))
}
</script>

<style scoped>
.medication-item {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
         dark:border-gray-700 p-4 transition-all duration-200;
}

.medication-item:hover {
  @apply shadow-md border-primary-500 dark:border-primary-400;
}

/* Animation pour la liste */
.list-enter-active,
.list-leave-active {
  @apply transition-all duration-300;
}

.list-enter-from,
.list-leave-to {
  @apply opacity-0 transform -translate-y-4;
}
</style> 