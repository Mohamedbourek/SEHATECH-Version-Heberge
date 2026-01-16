<template>
  <div class="space-y-6">
    <!-- Indicateur de chargement -->
    <div v-if="loading" class="flex justify-center items-center min-h-[200px]">
      <Loader2 class="w-8 h-8 animate-spin text-primary-600" />
    </div>

    <!-- Dossier Médical -->
    <template v-else-if="record">
      <!-- En-tête avec actions -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6">
        <div class="flex items-center space-x-4">
          <button @click="router.back()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <ArrowLeft class="w-6 h-6" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Dossier Médical de {{ patientName }}
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              ID: {{ record._id }} | Créé le : {{ formatDate(record.dateEntree) }}
            </p>
          </div>
        </div>
        <div class="flex space-x-3 mt-4 md:mt-0">
          <button @click="handlePrint" class="btn btn-secondary">
            <Printer class="w-4 h-4 mr-2" />
            Imprimer
          </button>
          <button v-if="canEdit" @click="showEditForm = true" class="btn btn-primary">
            <Edit class="w-4 h-4 mr-2" />
            Modifier
          </button>
          <button v-if="canArchive" @click="confirmArchive" class="btn btn-warning">
            <Archive class="w-4 h-4 mr-2" />
            Archiver
          </button>
        </div>
      </div>

      <!-- Statut du dossier -->
      <div class="mb-6">
        <span class="px-4 py-2 text-base font-medium rounded-full" :class="statusClasses[record.status || 'unknown']">
          {{ getDossierStatus(record) }}
        </span>
        <div class="mt-2 text-sm text-gray-500">
          Dernière mise à jour : {{ formatDate(record.derniereMiseAJour) }}
          <span v-if="record.dateSortie"> | Date de sortie : {{ formatDate(record.dateSortie) }}</span>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="grid grid-cols-1 gap-6">
        <!-- Informations Patient -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <User class="w-6 h-6 mr-2" /> Informations Patient
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Nom Complet</p>
              <p class="mt-1 text-lg font-medium">{{ patientName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Date de Naissance</p>
              <p class="mt-1">{{ formatDate(record.patient?.utilisateur?.dateNaissance) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Âge</p>
              <p class="mt-1">{{ patientAge }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Genre</p>
              <p class="mt-1">{{ record.patient?.utilisateur?.genre }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Téléphone</p>
              <p class="mt-1">{{ record.patient?.utilisateur?.telephone }}</p>
            </div>
            <div class="md:col-span-2">
              <p class="text-sm text-gray-500">Adresse</p>
              <p class="mt-1">{{ record.patient?.utilisateur?.adresse }}</p>
            </div>
          </div>
        </div>

        <!-- Médecin Traitant -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <User class="w-6 h-6 mr-2" /> Médecin Traitant
          </h2>
          <div v-if="treatingDoctor">
            <div>
              <p class="text-sm text-gray-500">Nom</p>
              <p class="mt-1">{{ treatingDoctor.utilisateur?.prenom }} {{ treatingDoctor.utilisateur?.nom }}</p>
            </div>
            <div class="mt-4">
              <p class="text-sm text-gray-500">Spécialité</p>
              <p class="mt-1">{{ treatingDoctor.specialite }}</p>
            </div>
            <div class="mt-4">
              <p class="text-sm text-gray-500">Téléphone</p>
              <p class="mt-1">{{ treatingDoctor.utilisateur?.telephone }}</p>
            </div>
          </div>
          <div v-else class="text-gray-500">
            Aucun médecin traitant enregistré
          </div>
        </div>

        <!-- Traitement & Surveillance - Visible uniquement pour les médecins -->
        <div v-if="isMedecin" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Pill class="w-6 h-6 mr-2" /> Traitement & Surveillance
          </h2>
          <div>
            <p class="text-sm text-gray-500">Traitement en cours</p>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ record.traitement || '-' }}
            </p>
          </div>
          <div class="mt-4">
            <p class="text-sm text-gray-500">Plan de surveillance</p>
            <p class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ record.surveillance || '-' }}
            </p>
          </div>
        </div>

        <!-- Contact d'urgence -->
        <div v-if="emergencyContact" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <User class="w-6 h-6 mr-2" /> Contact d'urgence
          </h2>
          <div>
            <p class="text-sm text-gray-500">Nom</p>
            <p class="mt-1">{{ emergencyContact.nom || emergencyContact.name }}</p>
          </div>
          <div class="mt-4">
            <p class="text-sm text-gray-500">Lien de parenté</p>
            <p class="mt-1">{{ emergencyContact.relation || emergencyContact.relationship }}</p>
          </div>
          <div class="mt-4">
            <p class="text-sm text-gray-500">Téléphone</p>
            <p class="mt-1">{{ emergencyContact.telephone || emergencyContact.phone }}</p>
          </div>
          <div class="mt-4">
            <p class="text-sm text-gray-500">Adresse</p>
            <p class="mt-1">{{ emergencyContact.adresse || emergencyContact.address }}</p>
          </div>
        </div>

        <!-- Antécédents Médicaux - Visible uniquement pour les médecins -->
        <div v-if="isMedecin" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <History class="w-6 h-6 mr-2" /> Antécédents Médicaux
          </h2>
          <div v-if="record.antecedents">
            <div v-if="Array.isArray(record.antecedents) && record.antecedents.length">
              <ul class="list-disc pl-5 space-y-1">
                <li v-for="(item, index) in record.antecedents" :key="index">
                  {{ item }}
                </li>
              </ul>
            </div>
            <div v-else>
              <div v-if="record.antecedents.medicaux && record.antecedents.medicaux.length">
                <h3 class="font-semibold text-gray-600">Médicaux</h3>
                <ul class="list-disc pl-5">
                  <li v-for="(item, index) in record.antecedents.medicaux" :key="index">
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div v-if="record.antecedents.chirurgicaux && record.antecedents.chirurgicaux.length" class="mt-2">
                <h3 class="font-semibold text-gray-600">Chirurgicaux</h3>
                <ul class="list-disc pl-5">
                  <li v-for="(item, index) in record.antecedents.chirurgicaux" :key="index">
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div v-if="record.antecedents.familiaux && record.antecedents.familiaux.length" class="mt-2">
                <h3 class="font-semibold text-gray-600">Familiaux</h3>
                <ul class="list-disc pl-5">
                  <li v-for="(item, index) in record.antecedents.familiaux" :key="index">
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div v-if="!record.antecedents.medicaux?.length && !record.antecedents.chirurgicaux?.length && !record.antecedents.familiaux?.length" class="text-gray-500">
                Aucun antécédent enregistré
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500">
            Aucun antécédent enregistré
          </div>
        </div>

        <!-- Consultations - Visible uniquement pour les médecins -->
        <div v-if="isMedecin" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Stethoscope class="w-6 h-6 mr-2" /> Consultations
          </h2>
          <div v-if="record.consultations && record.consultations.length" class="space-y-4">
            <div
              v-for="consultation in record.consultations"
              :key="consultation._id"
              class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
            >
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <p class="font-medium text-lg">{{ formatDate(consultation.dateConsultation) }}</p>
                  <p class="text-sm text-gray-500">
                    Dr. {{ consultation.medecin?.utilisateur?.prenom }} {{ consultation.medecin?.utilisateur?.nom }}
                  </p>
                </div>
              </div>
              <div class="mt-2 space-y-1">
                <p class="text-sm"><span class="font-semibold">Motif :</span> {{ consultation.motifConsultation }}</p>
                <p class="text-sm"><span class="font-semibold">Observations :</span> {{ consultation.observations }}</p>
                <p class="text-sm"><span class="font-semibold">Diagnostic :</span> {{ consultation.diagnostic }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-500">
            Aucune consultation enregistrée
          </div>
        </div>

        <!-- Examens Médicaux - Visible uniquement pour les médecins -->
        <div v-if="isMedecin" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Microscope class="w-6 h-6 mr-2" /> Examens Médicaux
          </h2>
          <div v-if="record.examens && record.examens.length" class="space-y-4">
            <div v-for="examen in record.examens" :key="examen._id" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <p class="font-medium text-lg">{{ examen.type }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(examen.date) }}</p>
                </div>
                <span class="mt-2 sm:mt-0 px-3 py-1 text-xs rounded-full" :class="examenStatusClasses[examen.statut]">
                  {{ examenStatutLabels[examen.statut] }}
                </span>
              </div>
              <div class="mt-2">
                <p class="text-sm font-medium text-gray-500">Résultats :</p>
                <p class="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
                  {{ Array.isArray(examen.resultat) ? examen.resultat.join('\n') : examen.resultat }}
                </p>
              </div>
              <div v-if="examen.interpretation" class="mt-3 border-t pt-2">
                <p class="text-sm font-medium text-gray-500">Interprétation :</p>
                <p class="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
                  {{ examen.interpretation }}
                </p>
              </div>
              <!-- Affichage des fichiers joints -->
              <div v-if="examen.fichiers && examen.fichiers.length" class="mt-3">
                <p class="text-sm font-medium text-gray-500">Fichiers joints :</p>
                <ul class="list-disc pl-5">
                  <li v-for="(file, index) in examen.fichiers" :key="index">
                    <a :href="`${baseUrl}/storage/${file}`" target="_blank" class="text-blue-600 hover:underline">
                      Document {{ index + 1 }}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-500">
            Aucun examen enregistré
          </div>
        </div>

        <!-- Évolution Clinique - Visible uniquement pour les médecins -->
        <div v-if="isMedecin" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <TrendingUp class="w-6 h-6 mr-2" /> Évolution Clinique
          </h2>
          <div v-if="record.evolution && record.evolution.length" class="space-y-4">
            <div v-for="(evo, index) in record.evolution" :key="index" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-medium">{{ evo.nomMesure }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(evo.dateDeMesure) }}</p>
                </div>
                <span class="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  {{ evo.etat }}
                </span>
              </div>
              <div class="mt-2">
                <p class="text-sm">{{ evo.valeurDeMesure }} (Valeur mesurée)</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-500">
            Aucune donnée d'évolution enregistrée
          </div>
          <div v-if="record.evolution && record.evolution.length" class="mt-4">
            <p class="text-sm font-medium text-gray-500">Évolutions récupérées:</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ JSON.stringify(record.evolution) }}
            </p>
          </div>
        </div>

        <!-- Documents Uploadés - Visible uniquement pour les médecins -->
        <div v-if="isMedecin" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Paperclip class="w-6 h-6 mr-2" /> Documents
          </h2>
          <div v-if="record.documents && record.documents.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(doc, index) in record.documents" :key="index" class="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <Paperclip class="w-5 h-5 text-gray-600" />
              <div class="flex-1">
                <p class="text-sm font-medium truncate">Document {{ index + 1 }}</p>
                <p class="text-xs text-gray-500 truncate">{{ doc }}</p>
              </div>
              <a :href="`${baseUrl}/storage/${doc}`" target="_blank" class="btn btn-secondary text-sm">
                Télécharger
              </a>
            </div>
          </div>
          <div v-else class="text-gray-500">
            Aucun document disponible
          </div>
        </div>

        <!-- Rapports Médicaux -->
        <div v-if="record.rapports && record.rapports.length" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <FileText class="w-6 h-6 mr-2" /> Rapports Médicaux
          </h2>
          <div class="space-y-4">
            <div v-for="rapport in record.rapports" :key="rapport._id" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div class="flex justify-between items-center">
                <p class="font-medium">Rapport du {{ formatDate(rapport.date) }}</p>
                <p class="text-sm text-gray-500">
                  Dr. {{ rapport.medecin?.utilisateur?.prenom }} {{ rapport.medecin?.utilisateur?.nom }}
                </p>
              </div>
              <p class="mt-2 text-sm whitespace-pre-line">{{ rapport.contenu }}</p>
            </div>
          </div>
        </div>

        <!-- Historique du Dossier -->
        <div v-if="record.historique && record.historique.length" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Clock class="w-6 h-6 mr-2" /> Historique des Modifications
          </h2>
          <div class="space-y-4">
            <div v-for="(hist, index) in record.historique" :key="index" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div class="flex justify-between items-center">
                <p class="font-medium">{{ capitalize(hist.type_modification) }}</p>
                <p class="text-sm text-gray-500">{{ formatDate(hist.date) }}</p>
              </div>
              <pre class="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
{{ JSON.stringify(hist.details, null, 2) }}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Message d'erreur si aucun dossier n'est trouvé -->
    <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
      Dossier non trouvé
    </div>

    <!-- Modal de création/modification -->
    <MedicalRecordForm
      v-if="showEditForm"
      :record="selectedRecord"
      @save="handleSave"
      @cancel="closeForm"
    />
    <ConfirmationModal
      v-if="showArchiveConfirm"
      title="Archiver le dossier"
      message="Êtes-vous sûr de vouloir archiver ce dossier médical ? Cette action ne peut pas être annulée."
      @confirm="archiveRecord"
      @cancel="showArchiveConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft, User, Stethoscope, Microscope, TrendingUp,
  Pill, Printer, Edit, Archive, Loader2, Paperclip, FileText, Clock, History,
  Search, Plus, Eye, Edit2, ArrowUpDown, Trash2
} from 'lucide-vue-next'
import { useMedicalRecordStore } from '@/stores/medicalRecord'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import MedicalRecordForm from '@/components/medical/MedicalRecordForm.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { usePatientStore } from '@/stores/patients'
import { useDoctorStore } from '@/stores/doctors'
import { useExamensStore } from '@/stores/examens'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const medicalRecordStore = useMedicalRecordStore()
const authStore = useAuthStore()
const patientStore = usePatientStore()
const doctorStore = useDoctorStore()
const examensStore = useExamensStore()

const record = ref(null)
const showEditForm = ref(false)
const showArchiveConfirm = ref(false)
const loading = ref(true)
const error = ref(null)

// Base URL pour les téléchargements
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Configuration des statuts
const statusClasses = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
}
const getDossierStatus = (dossier) => {
  return dossier && dossier.is_archived ? 'Archivé' : 'Actif'
}
const statusLabels = {
  active: 'Actif',
  archived: 'Archivé',
  unknown: 'Inconnu'
}
const examenStatutLabels = {
  pending: 'En attente',
  completed: 'Terminé',
  cancelled: 'Annulé'
}
const examenStatusClasses = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const patientName = computed(() => {
  if (!record.value?.patient?.utilisateur) return 'Patient inconnu'
  const { prenom, nom } = record.value.patient.utilisateur
  return `${prenom} ${nom}`
})

const patientAge = computed(() => {
  const birth = record.value?.patient?.utilisateur?.dateNaissance
  if (birth) {
    const birthDate = new Date(birth)
    const diffMs = Date.now() - birthDate.getTime()
    const ageDate = new Date(diffMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }
  return '-'
})

const emergencyContact = computed(() => {
  if (record.value?.patient) {
    console.log(record.value.patient.contacts_urgence)
    if (record.value.patient.contacts_urgence && record.value.patient.contacts_urgence.length) {
      return record.value.patient.contacts_urgence[0]
    }
   
  }
  return null
})

// Récupération du médecin traitant
const treatingDoctor = computed(() => {
  if (record.value?.medecin) {
    return record.value.medecin
  } else if (record.value?.medecin_id) {
    return doctorStore.doctors.find(d => d._id === record.value.medecin_id) || null
  }
  return null
})

const canEdit = computed(() => {
  return (!record.value?.is_archived && record.value?._id) &&
         (authStore.user.role === 'admin' || authStore.user.role === 'medecin')
})
const canArchive = computed(() => {
  return !record.value?.is_archived && record.value?._id
})

const formatDate = (date) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
  } catch (error) {
    return '-'
  }
}

const fetchExamens = async (dossierId) => {
  try {
    console.log('Fetching examens for dossierId:', dossierId);
    const response = await examensStore.fetchExamens(dossierId);
    record.value.examens = response.data;
    console.log('Examens récupérés:', record.value.examens);
  } catch (err) {
    console.error('Erreur lors du chargement des examens:', err);
    toast.error('Erreur lors du chargement des examens');
  }
};

const fetchRecord = async () => {
  try {
    loading.value = true
    error.value = null
    record.value = await medicalRecordStore.fetchRecord(route.params.id)
    if (record.value?._id) {
      await fetchExamens(record.value._id);
    }
    console.log('Record fetched:', record.value)
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement du dossier'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecord()
})

// Fonction de capitalisation pour l'historique
const capitalize = (value) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// Filtres, tri et pagination
const searchQuery = ref('')
const filterStatus = ref('')
const filterDateRange = ref('')
const filterDateStart = ref('')
const filterDateEnd = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortKey = ref('derniereMiseAJour')
const sortOrder = ref('desc')
const showCreateForm = ref(false)
const selectedRecord = ref(null)

const enrichedRecords = computed(() => {
  return medicalRecordStore.records.map(rec => {
    const firstName = rec.patient?.utilisateur?.prenom || ''
    const lastName = rec.patient?.utilisateur?.nom || ''
    const fullName = `${firstName} ${lastName}`.trim()
    const status = rec.is_archived ? 'archived' : 'active'
    return { ...rec, fullName, status }
  })
})

const filteredRecords = computed(() => {
  let filtered = enrichedRecords.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      rec =>
        rec.fullName.toLowerCase().includes(query) ||
        String(rec._id || rec.id).toLowerCase().includes(query) ||
        (rec.traitement || '').toLowerCase().includes(query)
    )
  }
  if (filterStatus.value) {
    filtered = filtered.filter(rec => rec.status === filterStatus.value)
  }
  return filtered
})

const sortedAndFilteredRecords = computed(() => {
  let result = [...filteredRecords.value]
  result.sort((a, b) => {
    let aValue = a[sortKey.value]
    let bValue = b[sortKey.value]
    if (sortKey.value === 'derniereMiseAJour') {
      aValue = aValue ? new Date(aValue).getTime() : 0
      bValue = bValue ? new Date(bValue).getTime() : 0
    }
    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(filteredRecords.value.length / itemsPerPage.value)
)
const paginationStart = computed(() =>
  (currentPage.value - 1) * itemsPerPage.value + 1
)
const paginationEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, filteredRecords.value.length)
)

// Actions du composant
const editRecord = (rec) => {
  selectedRecord.value = { ...rec }
  showCreateForm.value = true
}

const archiveRecord = async (rec) => {
  try {
    await medicalRecordStore.archiveRecord(rec._id || rec.id)
    toast.success('Dossier archivé', 'Le dossier a été archivé avec succès')
  } catch (error) {
    toast.error('Erreur', "Une erreur est survenue lors de l'archivage du dossier")
    console.error(error)
  }
}

const deleteRecord = async (rec) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier médical ? Cette action est irréversible.')) {
    try {
      const recordId = rec._id || rec.id
      await medicalRecordStore.deleteRecord(recordId)
      toast.success('Dossier supprimé', 'Le dossier a été supprimé avec succès')
      // Ici, vous pouvez déclencher la suppression des examens associés côté backend
    } catch (error) {
      toast.error('Erreur', "Une erreur est survenue lors de la suppression du dossier")
      console.error(error)
    }
  }
}

const closeForm = () => {
  showCreateForm.value = false
  selectedRecord.value = null
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const isMedecin = computed(() => {
  return authStore.user.role === 'medecin';
})

// Fonction d'impression : récupère le PDF via le store et ouvre une fenêtre d'impression
const handlePrint = async () => {
  try {
    loading.value = true;
    const success = await medicalRecordStore.generatePDF(route.params.id);
    if (!success) {
      throw new Error('Échec de la génération du PDF');
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error.message);
    toast.error(`Erreur lors du téléchargement: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    console.log("Fetching patients...");
    await patientStore.fetchPatients();
    console.log("Fetching doctors...");
    await doctorStore.fetchDoctors();
    console.log("Fetching medical records...");
    if (route.params.patientId) {
      await medicalRecordStore.fetchRecords({ patient: route.params.patientId });
    } else {
      await medicalRecordStore.fetchRecords();
    }
    console.log("Fetched records:", medicalRecordStore.records);
  } catch (error) {
    toast.error('Erreur', 'Erreur lors du chargement des données');
    console.error("Error in onMounted:", error);
  }
});
</script>

<style scoped>
.form-select {
  @apply block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center shadow-md;
}
.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
.btn-secondary {
  @apply bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600;
}
.btn-warning {
  @apply bg-yellow-500 text-white hover:bg-yellow-600;
}
.shadow {
  @apply shadow-lg;
}
.text-primary {
  @apply text-blue-600;
}
.text-secondary {
  @apply text-gray-600;
}
.text-warning {
  @apply text-yellow-600;
}
.text-success {
  @apply text-green-600;
}
.text-danger {
  @apply text-red-600;
}
.bg-primary {
  @apply bg-blue-100;
}
.bg-secondary {
  @apply bg-gray-100;
}
.bg-warning {
  @apply bg-yellow-100;
}
.bg-success {
  @apply bg-green-100;
}
.bg-danger {
  @apply bg-red-100;
}
.transition {
  @apply transition-all duration-300 ease-in-out;
}

.field {
  @apply bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6;
}
.field-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-4;
}
.field-content {
  @apply text-sm text-gray-500;
}
.field-content p {
  @apply mt-1 text-lg font-medium text-gray-900 dark:text-white;
}
.field-content p span {
  @apply font-semibold;
}

.card {
  @apply bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-4 transition hover:shadow-lg;
}
.card-header {
  @apply flex justify-between items-center mb-2;
}
.card-title {
  @apply text-lg font-bold text-gray-900 dark:text-white;
}
.card-subtitle {
  @apply text-sm text-gray-500;
}
.badge {
  @apply px-3 py-1 text-xs font-semibold rounded-full;
}
.badge-pending {
  @apply bg-yellow-100 text-yellow-800;
}
.badge-completed {
  @apply bg-green-100 text-green-800;
}
.badge-cancelled {
  @apply bg-red-100 text-red-800;
}
</style>
