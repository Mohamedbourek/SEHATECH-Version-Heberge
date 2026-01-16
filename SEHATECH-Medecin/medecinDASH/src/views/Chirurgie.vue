<template>
  <div v-if="isSurgeon" class="space-y-6">
    <!-- En-tête avec statistiques -->
    <header class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Planification chirurgicale
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos interventions chirurgicales et votre planning opératoire
          </p>
        </div>
        <button
          @click="showNewSurgeryModal = true"
          class="btn btn-primary flex items-center"
        >
          <Plus class="w-5 h-5 mr-2" />
          Nouvelle intervention
        </button>
      </div>

      <!-- Stats rapides -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div class="stat-card">
          <div class="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/20">
            <Calendar class="w-5 h-5" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ todayOperations }}</div>
            <div class="stat-label">Aujourd'hui</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-green-100 text-green-600 dark:bg-green-900/20">
            <CheckCircle class="w-5 h-5" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ completedOperations }}</div>
            <div class="stat-label">Terminées</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-amber-100 text-amber-600 dark:bg-amber-900/20">
            <Clock class="w-5 h-5" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ upcomingOperations }}</div>
            <div class="stat-label">À venir</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-red-100 text-red-600 dark:bg-red-900/20">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ urgentOperations }}</div>
            <div class="stat-label">Urgentes</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Filtres et recherche -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Barre de recherche plus compacte -->
        <div class="relative w-64">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Rechercher..."
            class="form-input pl-9 py-1.5 text-sm w-full"
          />
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <!-- Filtres plus compacts -->
        <select 
          v-model="filterStatus" 
          class="form-select py-1.5 text-sm w-36"
        >
          <option value="all">Statut</option>
          <option value="planifiée">Planifiée</option>
          <option value="en_cours">En cours</option>
          <option value="terminée">Terminée</option>
        </select>

        <select 
  v-model="filterSalle" 
  class="form-select py-1.5 text-sm w-32"
>
  <option value="all">Salle</option>
  <option 
    v-for="bloc in blocsOperatoires" 
    :key="bloc._id" 
    :value="bloc.numerosalle"
  >
    Bloc {{ bloc.numerosalle || bloc.numeroSalle  }}
  </option>
</select>

        <!-- Boutons d'action plus compacts -->
        <div class="flex items-center gap-2 ml-auto">
          <button 
            class="btn btn-icon-sm"
            title="Exporter"
            @click="exportData"
          >
            <Download class="w-4 h-4" />
          </button>
          <button 
            class="btn btn-icon-sm"
            title="Imprimer"
            @click="printPlanning"
          >
            <Printer class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Vue calendrier/liste -->
    <div class="flex space-x-2 mb-4">
      <button
        @click="viewMode = 'calendar'"
        :class="['btn', viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary']"
      >
        <CalendarDays class="w-4 h-4 mr-2" />
        Calendrier
      </button>
      <button
        @click="viewMode = 'list'"
        :class="['btn', viewMode === 'list' ? 'btn-primary' : 'btn-secondary']"
      >
        <List class="w-4 h-4 mr-2" />
        Liste
      </button>
    </div>

    <!-- Vue Calendrier -->
    <div v-if="viewMode === 'calendar'" class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="p-6">
        <SurgeryCalendar 
          :events="filteredSurgeries"
          @event-click="handleSurgeryClick"
          @date-select="handleDateSelect"
        />
      </div>
    </div>

    <!-- Vue Liste -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" class="table-header">Patient</th>
              <th scope="col" class="table-header">Type</th>
              <th scope="col" class="table-header">Date</th>
              <th scope="col" class="table-header">Heure</th>
              <th scope="col" class="table-header">Salle</th>
              <th scope="col" class="table-header">Statut</th>
              <th scope="col" class="table-header">Actions</th>
            </tr>
          </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
        <tr v-for="surgery in filteredSurgeries" :key="surgery._id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
          <td class="table-cell">
            {{ surgery.dossier?.patient?.utilisateur?.nom }} {{ surgery.dossier?.patient?.utilisateur?.prenom }}
          </td>
          <td class="table-cell">{{ surgery.type }}</td>
          <td class="table-cell">{{ formatDate(surgery.date) }}</td>
          <td class="table-cell">{{ formatTime(surgery.date)  }}</td>
          <td class="table-cell">{{ surgery.numerosalle || surgery.bloc_operatoire?.numerosalle }}</td>
          <td class="table-cell">
            <span :class="getStatusBadgeClass(surgery.statut)">
              {{ getStatusLabel(surgery.statut) }}
            </span>
          </td>
          
          <td class="table-cell">
            <div class="flex space-x-2">
              <button @click="editSurgery(surgery)" class="btn-icon" title="Modifier">
                <Edit2 class="w-4 h-4 text-blue-500" />
              </button>
              <button @click="deleteSurgery(surgery)" class="btn-icon" title="Supprimer">
                <Trash2 class="w-4 h-4 text-red-500" />
              </button>
              <button 
                v-if="surgery.statut === 'planifiée'"
                @click="startSurgery(surgery)" 
                class="btn-icon" 
                title="Démarrer"
              >
                <Play class="w-4 h-4 text-green-500" />
              </button>
              <button 
                v-if="surgery.statut === 'en_cours'"
                @click="completeSurgery(surgery)" 
                class="btn-icon" 
                title="Terminer"
              >
                <CheckCircle class="w-4 h-4 text-purple-500" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <SurgeryFormModal
      v-if="showNewSurgeryModal"
      :surgery="selectedSurgery"
      @close="closeModal"
      @submit="handleSurgerySubmit"
    />

    <ConfirmationModal
      v-if="showDeleteModal"
      title="Supprimer l'intervention"
      message="Êtes-vous sûr de vouloir supprimer cette intervention chirurgicale ?"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
  <div v-else class="text-center py-12">
    <div class="text-gray-500 dark:text-gray-400">
      <Stethoscope class="w-12 h-12 mx-auto mb-4" />
      <h2 class="text-lg font-medium">Accès non autorisé</h2>
      <p class="mt-1">Cette section est réservée aux chirurgiens.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Plus, Calendar, Clock, Stethoscope, Edit2, Trash2,
  Search, Download, CalendarDays, List, Play, CheckCircle,
  AlertCircle, AlertTriangle, Printer
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useSurgeryStore } from '@/stores/surgery'
import SurgeryCalendar from '@/components/surgery/SurgeryCalendar.vue'
import SurgeryFormModal from '@/components/surgery/SurgeryFormModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { useNotification } from '@/composables/useNotification'
import { exportToExcel } from '@/utils/export'
import { useBlocOperatoireStore } from '@/stores/blocOperatoire'

const authStore = useAuthStore()
const surgeryStore = useSurgeryStore()
const blocOperatoireStore = useBlocOperatoireStore()
const blocsOperatoires = ref([])
const { showNotification } = useNotification()
// Update the computed property for surgeon check
const isSurgeon = computed(() => {
  const surgeonSpecialties = ['neurochirurgie', 'traumatologie']
  const userSpeciality = authStore.user?.medecin?.specialite?.toLowerCase()
  console.log('User Speciality:', userSpeciality) // Debug log
  console.log('Includes check:', surgeonSpecialties.includes(userSpeciality)) // Debug log
  return userSpeciality && surgeonSpecialties.includes(userSpeciality)
})
// Add this with other refs at the top of the script
const showNewSurgeryModal = ref(false)
const showDeleteModal = ref(false)
const selectedSurgery = ref(null)
const surgeryToDelete = ref(null)
const searchQuery = ref('')
const filterStatus = ref('all')
const filterSalle = ref('all')
const viewMode = ref('calendar')

// Update the surgeries computed property
const surgeries = computed(() => surgeryStore.surgeries)

// Update the statistics computations
const todayOperations = computed(() => surgeryStore.stats?.todayOperations || 0)
const completedOperations = computed(() => surgeryStore.stats?.completedOperations || 0)
const upcomingOperations = computed(() => surgeryStore.stats?.upcomingOperations || 0)
const urgentOperations = computed(() => surgeryStore.stats?.urgentOperations || 0)

// Filtrage des chirurgies
const filteredSurgeries = computed(() => {
  let filtered = [...surgeries.value];

  // Recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(s => {
      const patientName = `${s.patient?.nom || ''} ${s.patient?.prenom || ''}`.toLowerCase();
      const typeOperation = (s.type_operation || '').toLowerCase();
      return patientName.includes(query) || typeOperation.includes(query);
    });
  }

  // Filtre par statut
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(s => s.statut === filterStatus.value);
  }

  // Filtre par salle
  if (filterSalle.value !== 'all') {
    filtered = filtered.filter(s => s.bloc_operatoire?.numerosalle === filterSalle.value);
  }

  return filtered;
})

onMounted(async () => {
  if (isSurgeon.value) {
    try {
      await Promise.all([
        surgeryStore.fetchSurgeries(),
        surgeryStore.fetchStats(), // Make sure this is called
        blocOperatoireStore.fetchBlocsOperatoires()
      ])
      blocsOperatoires.value = blocOperatoireStore.blocsOperatoires
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Erreur lors du chargement des données'
      })
    }
  }
})

function formatTime(date) {
  if (!date) return 'Non définie';
  
  try {
    const dateObj = new Date(date);
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Heure invalide';
    }
    
    // Add 1 hour to the time
    dateObj.setHours(dateObj.getHours() - 1);
    
    // Format time as HH:MM
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Erreur de formatage d\'heure:', error, date);
    return 'Heure invalide';
  }
}

function formatDate(date) {
  if (!date) return 'Non définie';
  
  try {
    const dateObj = new Date(date);
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }
    return format(dateObj, 'dd MMMM yyyy', { locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error, date);
    return 'Date invalide';
  }
}

function handleSurgeryClick(surgery) {
  selectedSurgery.value = surgery
  showNewSurgeryModal.value = true
}

function handleDateSelect(date) {
  selectedSurgery.value = { date }
  showNewSurgeryModal.value = true
}

async function editSurgery(surgery) {
  try {
    console.log('Édition de l\'opération:', surgery);
    const details = await surgeryStore.getSurgery(surgery._id);
    console.log('Détails récupérés:', details);
    selectedSurgery.value = details;
    showNewSurgeryModal.value = true;
  } catch (error) {
    console.error('Erreur lors du chargement des détails:', error);
    showNotification({
      type: 'error',
      message: 'Erreur lors du chargement des détails de l\'intervention'
    })
  }
}

function deleteSurgery(surgery) {
  surgeryToDelete.value = surgery
  showDeleteModal.value = true
}

async function confirmDelete() {
  try {
    if (!surgeryToDelete.value || !surgeryToDelete.value._id) {
      showNotification({
        type: 'error',
        message: 'Impossible de supprimer : ID d\'opération manquant'
      });
      return;
    }
    
    console.log('Suppression de l\'opération:', surgeryToDelete.value._id);
    await surgeryStore.deleteSurgery(surgeryToDelete.value._id);
    
    showNotification({
      type: 'success',
      message: 'Intervention supprimée avec succès'
    });
    
    // Rafraîchir les données
    await surgeryStore.fetchSurgeries();
    await surgeryStore.fetchStats();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showNotification({
      type: 'error',
      message: 'Erreur lors de la suppression de l\'intervention'
    });
  } finally {
    showDeleteModal.value = false;
    surgeryToDelete.value = null;
  }
}

async function handleSurgerySubmit(surgeryData) {
  console.log('Traitement des données de l\'intervention:', surgeryData);
  
  try {
    // Validation des données minimales requises
    if (!surgeryData.patient_id || !surgeryData.type_operation || !surgeryData.date_operation) {
      showNotification({
        type: 'error',
        message: 'Informations d\'intervention incomplètes'
      });
      return;
    }
    
    // Vérifier que le dossier médical est présent
    if (!surgeryData.dossier_id) {
      showNotification({
        type: 'error',
        message: 'Le dossier médical du patient est requis'
      });
      return;
    }
    
    // Cette fonction transmet directement les données au store de chirurgie
    // qui se chargera de les formater correctement pour l'API backend
    
    if (surgeryData.id) {
      console.log('Mise à jour d\'une intervention existante:', surgeryData.id);
      await surgeryStore.updateSurgery({
        id: surgeryData.id,
        ...surgeryData
      });
      showNotification({
        type: 'success',
        message: 'Intervention mise à jour avec succès'
      });
    } else {
      console.log('Création d\'une nouvelle intervention');
      await surgeryStore.createSurgery(surgeryData);
      showNotification({
        type: 'success',
        message: 'Nouvelle intervention planifiée avec succès'
      });
    }
    
    closeModal();
    await surgeryStore.fetchSurgeries();
    await surgeryStore.fetchStats();
  } catch (error) {
    console.error('Erreur complète:', error);
    let errorMsg = 'Erreur lors de l\'enregistrement de l\'intervention';
    
    if (error.response) {
      console.error('Détails de la réponse d\'erreur:', error.response.data);
      if (error.response.data.error) {
        errorMsg = error.response.data.error;
      } else if (error.response.data.message) {
        errorMsg = error.response.data.message;
      }
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    showNotification({
      type: 'error',
      message: errorMsg
    });
  }
}

async function loadSurgeryDetails(id) {
  try {
    const surgery = await surgeryStore.getSurgery(id)
    selectedSurgery.value = surgery
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Erreur lors du chargement des détails de l\'intervention'
    })
  }
}
function closeModal() {
  showNewSurgeryModal.value = false
  selectedSurgery.value = null
}

// Fonctions utilitaires
function getStatusBadgeClass(status) {
  return {
    'planifiée': 'badge-info',
    'en_cours': 'badge-warning',
    'terminée': 'badge-success',
    'annulée': 'badge-error'
  }[status] || 'badge-info'
}

// Update status labels and classes
function getStatusLabel(status) {
  return {
    'planifiée': 'Planifiée',
    'en_cours': 'En cours',
    'terminée': 'Terminée',
    'annulée': 'Annulée'
  }[status] || status
}

// Actions
async function startSurgery(surgery) {
  try {
    // Update surgery status to in progress
    await surgeryStore.updateSurgery({
      ...surgery,
      statut: 'en_cours'
    })
    
   
    if (surgery.bloc_operatoire && surgery.bloc_operatoire._id) {
      await blocOperatoireStore.updateStatus(
        surgery.bloc_operatoire._id,
        'occupe'
      )
    }
    
    showNotification({
      type: 'success',
      message: 'Intervention démarrée'
    })
    
    // Refresh data
    await Promise.all([
      surgeryStore.fetchSurgeries(),
      surgeryStore.fetchStats(),
      blocOperatoireStore.fetchBlocsOperatoires()
    ])
    
    
    blocsOperatoires.value = blocOperatoireStore.blocsOperatoires
  } catch (error) {
    console.error('Erreur lors du démarrage:', error)
    showNotification({
      type: 'error',
      message: 'Erreur lors du démarrage de l\'intervention'
    })
  }
}

async function completeSurgery(surgery) {
  try {
    await surgeryStore.updateSurgery({
      ...surgery,
      statut: 'terminée'
    })

    if (surgery.bloc_operatoire && surgery.bloc_operatoire._id) {
      await blocOperatoireStore.updateStatus(
        surgery.bloc_operatoire._id,
        'disponible'
      )
    }
    showNotification({
      type: 'success',
      message: 'Intervention terminée'
    })
    await Promise.all([
      surgeryStore.fetchSurgeries(),
      surgeryStore.fetchStats(),
      blocOperatoireStore.fetchBlocsOperatoires()
    ])
    
    
    blocsOperatoires.value = blocOperatoireStore.blocsOperatoires
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Erreur lors de la finalisation de l\'intervention'
    })
  }
}

function exportData() {
  const data = surgeries.value.map(s => ({
    'Patient': `${s.dossier.patient.utilisateur.nom || ''} ${s.dossier.patient.utilisateur.prenom || ''}`,
    'Type': s.type || '',
    'Date': s.date ? formatDate(s.date) : '',
    'Heure': formatTime(s.date) || '',
    'Salle': s.bloc_operatoire.numerosalle || '',
    'Statut': getStatusLabel(s.statut || '')
  }));

  exportToExcel(data, 'planning_chirurgical');
}

function printPlanning() {
  // Implementation of printPlanning function
}
</script>

<style scoped>
.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-4 
         shadow-sm border border-gray-200 dark:border-gray-700
         hover:shadow-md transition-shadow duration-200;
}

.stat-icon {
  @apply p-3 rounded-full;
}

.stat-content {
  @apply flex-1;
}

.stat-value {
  @apply text-2xl font-semibold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.form-input,
.form-select {
  @apply rounded-md border-gray-300 shadow-sm
         focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:border-gray-600 dark:text-white
         hover:border-gray-400 dark:hover:border-gray-500
         transition-colors duration-200;
}

.btn {
  @apply inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium
         focus:outline-none focus:ring-2 focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-all duration-200 shadow-sm;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700
         focus:ring-primary-500
         transform hover:-translate-y-0.5;
}

.btn-secondary {
  @apply bg-white text-gray-700 hover:bg-gray-50 border border-gray-300
         focus:ring-primary-500
         dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600
         dark:hover:bg-gray-700
         transform hover:-translate-y-0.5;
}

.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white;
}

.badge-info {
  @apply px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400;
}

.badge-warning {
  @apply px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400;
}

.badge-success {
  @apply px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400;
}

.badge-error {
  @apply px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400;
}

.btn-icon {
  @apply p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.btn-icon-sm {
  @apply p-1.5 rounded-lg text-gray-500 hover:text-gray-700 
         hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300
         dark:hover:bg-gray-700 transition-colors;
}
</style>