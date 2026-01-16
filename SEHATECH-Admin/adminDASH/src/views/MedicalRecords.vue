<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Dossiers Médicaux
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredRecords.length }} dossier(s) trouvé(s)
        </p>
      </div>
      <button @click="showCreateForm = true" class="btn btn-primary">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau dossier
      </button>
    </div>

    <!-- Filtres améliorés -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Recherche -->
        <div class="md:col-span-1">
          <label class="form-label" for="search">Recherche</label>
          <div class="relative">
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              class="form-input pl-10"
              placeholder="Rechercher par nom, ID ou traitement..."
            />
            <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <!-- Filtre par statut -->
        <div>
          <label class="form-label" for="filter-status">Statut</label>
          <select id="filter-status" v-model="filterStatus" class="form-select">
            <option value="">Tous les statuts</option>
            <option v-for="(label, value) in statusLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <!-- Filtre par période -->
        <div>
          <label class="form-label" for="date-range">Période</label>
          <select id="date-range" v-model="filterDateRange" class="form-select">
            <option value="">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        <!-- Dates personnalisées -->
        <div v-if="filterDateRange === 'custom'" class="md:col-span-3 grid grid-cols-2 gap-4">
          <div>
            <label class="form-label" for="date-start">Date début</label>
            <input id="date-start" v-model="filterDateStart" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="date-end">Date fin</label>
            <input id="date-end" v-model="filterDateEnd" type="date" class="form-input" />
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des dossiers avec tri -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <!-- En-tête de la liste avec tri -->
      <div class="bg-gray-50 dark:bg-gray-700 px-6 py-3">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-4">
            <button
              @click="sortBy('fullName')"
              class="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Patient
              <ArrowUpDown class="w-4 h-4 ml-1" />
            </button>
          </div>

          <div class="col-span-2">
            <button
              @click="sortBy('derniereMiseAJour')"
              class="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Mise à jour
              <ArrowUpDown class="w-4 h-4 ml-1" />
            </button>
          </div>
          <div class="col-span-2">
            <button
              @click="sortBy('status')"
              class="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Statut
              <ArrowUpDown class="w-4 h-4 ml-1" />
            </button>
          </div>
          <div class="col-span-2">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Actions
            </span>
          </div>
        </div>
      </div>

      <!-- Liste des dossiers -->
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="record in sortedAndFilteredRecords"
          :key="record._id || record.id"
          class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ record.fullName }}
                </h3>
                <div class="mt-1 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>ID: {{ record._id || record.id }}</span>
                  <span>•</span>
                  <span>{{ formatDate(record.derniereMiseAJour) }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <span
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="statusClasses[record.status]"
              >
                {{ statusLabels[record.status] }}
              </span>
              <div class="flex space-x-2">
                <router-link
                  :to="`/medical-records/${record._id || record.id}`"
                  class="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                  title="Voir le dossier"
                >
                  <Eye class="w-5 h-5" />
                </router-link>
                <button
                  @click="editRecord(record)"
                  class="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                  title="Modifier"
                >
                  <Edit2 class="w-5 h-5" />
                </button>
                <button
                  @click="archiveRecord(record)"
                  class="text-yellow-600 hover:text-yellow-900 dark:hover:text-yellow-400"
                  title="Archiver"
                >
                  <Archive class="w-5 h-5" />
                </button>
                <button
                  @click="deleteRecord(record)"
                  class="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                  title="Supprimer"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Traitement
              </p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ record.traitement || '-' }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Dernière consultation
              </p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{
                  record.consultations?.length
                    ? formatDate(record.consultations[record.consultations.length - 1].dateConsultation)
                    : '-'
                }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Dernière mise à jour
              </p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ formatDate(record.derniereMiseAJour) || '-' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Affichage de
              <span class="font-medium">{{ paginationStart }}</span>
              à
              <span class="font-medium">{{ paginationEnd }}</span>
              sur
              <span class="font-medium">{{ filteredRecords.length }}</span>
              résultats
            </span>
          </div>

          <div class="flex space-x-2">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="btn btn-secondary"
            >
              Précédent
            </button>
            <button
              @click="currentPage++"
              :disabled="currentPage >= totalPages"
              class="btn btn-secondary"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Message d'erreur si dossier non trouvé -->
    <div v-if="filteredRecords.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
      Dossier non trouvé
    </div>

    <!-- Modal de création/modification -->
    <MedicalRecordForm
      v-if="showCreateForm"
      :record="selectedRecord"
      @save="handleSave"
      @cancel="closeForm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRoute } from 'vue-router'
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Archive,
  ArrowUpDown,
  Trash2
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import MedicalRecordForm from '@/components/medical/MedicalRecordForm.vue'
import { useMedicalRecordStore } from '@/stores/medicalRecord'
import { usePatientStore } from '@/stores/patients'
import { useDoctorStore } from '@/stores/doctors'
import { useExamensStore } from '@/stores/examens'

const toast = useToast()
const medicalRecordStore = useMedicalRecordStore()
const patientStore = usePatientStore()
const doctorStore = useDoctorStore()
const examensStore = useExamensStore()
const route = useRoute()

// Récupérer l'ID du patient depuis l'URL (s'il existe)
const patientId = computed(() => route.params.patientId || null)

// Si un patient est spécifié, on le récupère via le store
const currentPatient = computed(() =>
  patientId.value ? patientStore.getPatientById(patientId.value) : null
)

// État local pour filtres, tri, modal, etc.
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

const statusClasses = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
}

const statusLabels = {
  active: 'Actif',
  archived: 'Archivé',
  pending: 'En attente'
}

// Enrichir les dossiers en ajoutant le nom complet du patient, la spécialité du médecin et le statut
const enrichedRecords = computed(() => {
  return medicalRecordStore.records.map(record => {
    const firstName = record.patient?.utilisateur?.prenom || ''
    const lastName = record.patient?.utilisateur?.nom || ''
    const fullName = `${firstName} ${lastName}`.trim()
    const status = record.is_archived ? 'archived' : 'active'
    return { ...record, fullName, status }
  })
})

const filteredRecords = computed(() => {
  let filtered = enrichedRecords.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      record =>
        record.fullName.toLowerCase().includes(query) ||
        String(record._id || record.id).toLowerCase().includes(query) ||
        (record.traitement || '').toLowerCase().includes(query)
    )
  }
  if (filterStatus.value) {
    filtered = filtered.filter(record => record.status === filterStatus.value)
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

const formatDate = (date) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
  } catch (error) {
    return '-'
  }
}

const editRecord = (record) => {
  selectedRecord.value = { ...record }
  showCreateForm.value = true
}

const archiveRecord = async (record) => {
  try {
    await medicalRecordStore.archiveRecord(record._id || record.id)
    toast.success('Dossier archivé', 'Le dossier a été archivé avec succès')
  } catch (error) {
    toast.error('Erreur', "Une erreur est survenue lors de l'archivage du dossier")
    console.error(error)
  }
}

const deleteRecord = async (record) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier médical ? Cette action est irréversible.')) {
    try {
      const recordId = record._id || record.id;
      await medicalRecordStore.deleteRecord(recordId)
      toast.success('Dossier supprimé', 'Le dossier a été supprimé avec succès')
      // Suppression en cascade des examens associés (si le backend ne le fait pas automatiquement)
      if (typeof examensStore.deleteExamensByDossier === 'function') {
        await examensStore.deleteExamensByDossier(recordId)
        console.log("Examens associés supprimés");
      }
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

const handleSave = async (recordData) => {
  try {
    // Journalisation des valeurs de patientId et recordData.patient_id
    console.log('patientId.value:', patientId.value);
    console.log('recordData.patient_id:', recordData.patient_id);

    // Vérification de la validité de patient_id
    if (!recordData.patient_id && !patientId.value) {
      throw new Error('patient_id est requis pour créer un dossier médical.');
    }

    const patientIdToUse = patientId.value || recordData.patient_id;
    if (!patientIdToUse) {
      throw new Error('patientIdToUse ne peut pas être null ou undefined.');
    }

    if (selectedRecord.value) {
      const recordId = selectedRecord.value._id || selectedRecord.value.id;
      await medicalRecordStore.updateRecord(recordId, recordData);
      toast.success('Dossier médical mis à jour avec succès');
    } else {
      await medicalRecordStore.createRecord(patientIdToUse, recordData);
      toast.success('Dossier médical créé avec succès');
    }
    closeForm();
    await medicalRecordStore.fetchRecords({ patient: patientId.value });
  } catch (error) {
    toast.error('Erreur', 'Erreur lors de la sauvegarde du dossier médical');
    console.error(error);
  }
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

onMounted(async () => {
  try {
    console.log("Fetching patients...");
    await patientStore.fetchPatients();
    console.log("Fetching doctors...");
    await doctorStore.fetchDoctors();
    console.log("Fetching medical records...");
    if (patientId.value) {
      await medicalRecordStore.fetchRecords({ patient: patientId.value });
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
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600;
}
</style>
