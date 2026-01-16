<template>
  <div class="evolutions-list">
    <div class="header-section mb-6">
      <div class="flex justify-between items-center">
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <Activity class="w-5 h-5 mr-2 text-primary-500" />
          Évolutions du patient
        </h3>
        <button 
          @click="showAddEvolutionModal = true" 
          class="btn-primary-sm flex items-center"
          v-if="canAddEvolution"
        >
          <PlusCircle class="w-4 h-4 mr-1" />
          Ajouter une mesure
        </button>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Suivi des paramètres et de l'état du patient
      </p>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section mb-4 flex flex-wrap gap-2">
      <div class="flex-1 min-w-[200px]">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Rechercher une mesure..." 
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <select 
        v-model="filterType" 
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
               focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
      >
        <option value="">Tous les types</option>
        <option value="Tension">Tension</option>
        <option value="Température">Température</option>
        <option value="Glycémie">Glycémie</option>
        <option value="Poids">Poids</option>
        <option value="Fréquence cardiaque">Fréquence cardiaque</option>
        <option value="Saturation O2">Saturation O2</option>
      </select>
      <select 
        v-model="filterEtat" 
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
               focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
      >
        <option value="">Tous les états</option>
        <option value="normal">Normal</option>
        <option value="attention">Attention</option>
        <option value="critique">Critique</option>
      </select>
    </div>

    <!-- Liste des évolutions -->
    <div v-if="loading" class="flex justify-center my-8">
      <div class="loader"></div>
    </div>

    <div v-else-if="filteredEvolutions.length === 0" class="empty-state">
      <div class="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Activity class="w-12 h-12 text-gray-400 mb-4" />
        <h4 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Aucune évolution enregistrée</h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          {{ 
            filterType || filterEtat || searchQuery 
              ? "Aucune évolution ne correspond à vos critères de recherche." 
              : "Ajoutez des mesures pour suivre l'évolution de l'état du patient."
          }}
        </p>
        <button 
          v-if="canAddEvolution && !filterType && !filterEtat && !searchQuery" 
          @click="showAddEvolutionModal = true" 
          class="btn-primary-sm mt-4"
        >
          Ajouter une première mesure
        </button>
      </div>
    </div>

    <div v-else class="evolutions-grid">
      <div 
        v-for="evolution in filteredEvolutions" 
        :key="evolution._id"
        class="evolution-card"
        :class="getEtatClass(evolution.etat)"
      >
        <div class="card-header">
          <div class="flex items-center">
            <div class="evolution-icon" :class="getEtatIconClass(evolution.etat)">
              <component :is="getIconForMesure(evolution.nomMesure)" class="w-5 h-5" />
            </div>
            <div class="ml-3">
              <h4 class="text-base font-medium text-gray-800 dark:text-gray-200">
                {{ evolution.nomMesure }}
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(evolution.dateDeMesure) }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="evolution-badge" :class="getEtatBadgeClass(evolution.etat)">
              {{ getEtatLabel(evolution.etat) }}
            </span>
            <div class="dropdown" v-if="canEditEvolution">
              <button class="dropdown-trigger">
                <MoreVertical class="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
              </button>
              <div class="dropdown-menu">
                <button @click="editEvolution(evolution)" class="dropdown-item">
                  <Edit class="w-4 h-4 mr-2" />
                  Modifier
                </button>
                <button @click="confirmDelete(evolution)" class="dropdown-item text-red-600 dark:text-red-400">
                  <Trash2 class="w-4 h-4 mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card-content">
          <div class="value-display">
            <span class="text-2xl font-bold" :class="getEtatTextClass(evolution.etat)">
              {{ formatValue(evolution.valeurDeMesure, evolution.nomMesure) }}
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400 ml-1">
              {{ getUnitForMesure(evolution.nomMesure) }}
            </span>
          </div>
          
          <p v-if="evolution.commentaire" class="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {{ evolution.commentaire }}
          </p>
          
          <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <UserCircle class="w-4 h-4 mr-1" />
            Dr. {{ evolution.medecin?.prenom }} {{ evolution.medecin?.nom }}
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout d'évolution -->
    <Modal 
      v-if="showAddEvolutionModal" 
      title="Ajouter une mesure" 
      @close="showAddEvolutionModal = false"
    >
      <div class="p-6">
        <form @submit.prevent="submitEvolution">
          <div class="form-group mb-4">
            <label class="form-label">Type de mesure</label>
            <select 
              v-model="newEvolution.nomMesure" 
              class="form-select"
              required
            >
              <option value="" disabled>Sélectionner un type</option>
              <option value="Tension">Tension</option>
              <option value="Température">Température</option>
              <option value="Glycémie">Glycémie</option>
              <option value="Poids">Poids</option>
              <option value="Fréquence cardiaque">Fréquence cardiaque</option>
              <option value="Saturation O2">Saturation O2</option>
            </select>
          </div>
          
          <div class="form-group mb-4">
            <label class="form-label">Valeur</label>
            <input 
              v-model.number="newEvolution.valeurDeMesure" 
              type="number" 
              step="0.01"
              class="form-input"
              required
            />
          </div>
          
          <div class="form-group mb-4">
            <label class="form-label">État</label>
            <select 
              v-model="newEvolution.etat" 
              class="form-select"
              required
            >
              <option value="normal">Normal</option>
              <option value="attention">Attention</option>
              <option value="critique">Critique</option>
            </select>
          </div>
          
          <div class="form-group mb-6">
            <label class="form-label">Commentaire</label>
            <textarea 
              v-model="newEvolution.commentaire" 
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button 
              type="button" 
              @click="showAddEvolutionModal = false" 
              class="btn-secondary"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              class="btn-primary"
              :disabled="loading"
            >
              <Loader v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- Modal de modification d'évolution -->
    <Modal 
      v-if="showEditEvolutionModal" 
      title="Modifier la mesure" 
      @close="showEditEvolutionModal = false"
    >
      <div class="p-6">
        <form @submit.prevent="updateEvolutionData">
          <div class="form-group mb-4">
            <label class="form-label">Type de mesure</label>
            <select 
              v-model="editingEvolution.nomMesure" 
              class="form-select"
              required
            >
              <option value="" disabled>Sélectionner un type</option>
              <option value="Tension">Tension</option>
              <option value="Température">Température</option>
              <option value="Glycémie">Glycémie</option>
              <option value="Poids">Poids</option>
              <option value="Fréquence cardiaque">Fréquence cardiaque</option>
              <option value="Saturation O2">Saturation O2</option>
            </select>
          </div>
          
          <div class="form-group mb-4">
            <label class="form-label">Valeur</label>
            <input 
              v-model.number="editingEvolution.valeurDeMesure" 
              type="number" 
              step="0.01"
              class="form-input"
              required
            />
          </div>
          
          <div class="form-group mb-4">
            <label class="form-label">État</label>
            <select 
              v-model="editingEvolution.etat" 
              class="form-select"
              required
            >
              <option value="normal">Normal</option>
              <option value="attention">Attention</option>
              <option value="critique">Critique</option>
            </select>
          </div>
          
          <div class="form-group mb-6">
            <label class="form-label">Commentaire</label>
            <textarea 
              v-model="editingEvolution.commentaire" 
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button 
              type="button" 
              @click="showEditEvolutionModal = false" 
              class="btn-secondary"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              class="btn-primary"
              :disabled="loading"
            >
              <Loader v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
              Mettre à jour
            </button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- Modal de confirmation de suppression -->
    <Modal 
      v-if="showDeleteConfirmModal" 
      title="Confirmer la suppression" 
      @close="showDeleteConfirmModal = false"
      size="sm"
    >
      <div class="p-6">
        <p class="text-gray-700 dark:text-gray-300 mb-6">
          Êtes-vous sûr de vouloir supprimer cette mesure ? Cette action est irréversible.
        </p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="showDeleteConfirmModal = false" 
            class="btn-secondary"
          >
            Annuler
          </button>
          <button 
            @click="deleteEvolutionConfirmed" 
            class="btn-danger"
            :disabled="loading"
          >
            <Loader v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Activity, PlusCircle, Edit, Trash2, UserCircle, 
  Thermometer, Heart, Droplet, Scale, BarChart2, 
  Percent, MoreVertical, Loader
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import { useEvolutionStore } from '@/stores/evolutionStore'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  dossierId: {
    type: String,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

// Stores et composables
const evolutionStore = useEvolutionStore()
const authStore = useAuthStore()
const { showToast } = useToast()

// État local
const evolutions = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const filterType = ref('')
const filterEtat = ref('')
const showAddEvolutionModal = ref(false)
const showEditEvolutionModal = ref(false)
const showDeleteConfirmModal = ref(false)
const newEvolution = ref({
  nomMesure: '',
  valeurDeMesure: null,
  etat: 'normal',
  commentaire: ''
})
const editingEvolution = ref(null)
const evolutionToDelete = ref(null)

// Permissions
const canAddEvolution = computed(() => {
  return props.canEdit && authStore.user?.role === 'medecin'
})

const canEditEvolution = computed(() => {
  return props.canEdit && authStore.user?.role === 'medecin'
})

// Évolutions filtrées
const filteredEvolutions = computed(() => {
  return evolutions.value
    .filter(evolution => {
      const matchesSearch = searchQuery.value === '' || 
        evolution.nomMesure.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (evolution.commentaire && evolution.commentaire.toLowerCase().includes(searchQuery.value.toLowerCase()))
      
      const matchesType = filterType.value === '' || evolution.nomMesure === filterType.value
      const matchesEtat = filterEtat.value === '' || evolution.etat === filterEtat.value
      
      return matchesSearch && matchesType && matchesEtat
    })
    .sort((a, b) => new Date(b.dateDeMesure) - new Date(a.dateDeMesure))
})

// Charger les évolutions au montage
onMounted(async () => {
  await fetchEvolutions()
})

// Surveiller les changements de dossier
watch(() => props.dossierId, async () => {
  if (props.dossierId) {
    await fetchEvolutions()
  }
})

// Méthodes
async function fetchEvolutions() {
  if (!props.dossierId) return
  
  loading.value = true
  error.value = null
  
  try {
    const result = await evolutionStore.fetchEvolutions(props.dossierId)
    evolutions.value = result
  } catch (err) {
    console.error('Erreur lors du chargement des évolutions:', err)
    error.value = 'Impossible de charger les évolutions'
    showToast('Erreur lors du chargement des évolutions', 'error')
  } finally {
    loading.value = false
  }
}

async function submitEvolution() {
  loading.value = true
  
  try {
    const evolutionData = {
      ...newEvolution.value,
      dossier_id: props.dossierId
    }
    
    const result = await evolutionStore.createEvolution(evolutionData)
    evolutions.value.unshift(result)
    
    showToast('Mesure ajoutée avec succès', 'success')
    resetForm()
    showAddEvolutionModal.value = false
  } catch (err) {
    console.error('Erreur lors de l\'ajout de l\'évolution:', err)
    showToast('Erreur lors de l\'ajout de la mesure', 'error')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  newEvolution.value = {
    nomMesure: '',
    valeurDeMesure: null,
    etat: 'normal',
    commentaire: ''
  }
}

function editEvolution(evolution) {
  editingEvolution.value = { ...evolution }
  showEditEvolutionModal.value = true
}

async function updateEvolutionData() {
  if (!editingEvolution.value) return
  
  loading.value = true
  
  try {
    const result = await evolutionStore.updateEvolution(
      editingEvolution.value._id, 
      {
        nomMesure: editingEvolution.value.nomMesure,
        valeurDeMesure: editingEvolution.value.valeurDeMesure,
        etat: editingEvolution.value.etat,
        commentaire: editingEvolution.value.commentaire
      }
    )
    
    // Mettre à jour l'évolution dans la liste locale
    const index = evolutions.value.findIndex(e => e._id === editingEvolution.value._id)
    if (index !== -1) {
      evolutions.value[index] = { ...evolutions.value[index], ...editingEvolution.value }
    }
    
    showToast('Mesure mise à jour avec succès', 'success')
    showEditEvolutionModal.value = false
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'évolution:', err)
    showToast('Erreur lors de la mise à jour de la mesure', 'error')
  } finally {
    loading.value = false
  }
}

function confirmDelete(evolution) {
  evolutionToDelete.value = evolution
  showDeleteConfirmModal.value = true
}

async function deleteEvolutionConfirmed() {
  if (!evolutionToDelete.value) return
  
  loading.value = true
  
  try {
    await evolutionStore.deleteEvolution(evolutionToDelete.value._id)
    
    // Supprimer l'évolution de la liste locale
    evolutions.value = evolutions.value.filter(e => e._id !== evolutionToDelete.value._id)
    
    showToast('Mesure supprimée avec succès', 'success')
    showDeleteConfirmModal.value = false
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'évolution:', err)
    showToast('Erreur lors de la suppression de la mesure', 'error')
  } finally {
    loading.value = false
    evolutionToDelete.value = null
  }
}

// Fonctions utilitaires
function formatDate(dateString) {
  try {
    return format(new Date(dateString), 'PPP à HH:mm', { locale: fr })
  } catch (error) {
    console.warn('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

function formatValue(value, type) {
  if (value === null || value === undefined) return 'N/A'
  
  switch (type) {
    case 'Tension':
      return value.toString()
    case 'Température':
      return value.toFixed(1)
    case 'Glycémie':
      return value.toFixed(2)
    case 'Poids':
      return value.toFixed(1)
    case 'Fréquence cardiaque':
      return Math.round(value)
    case 'Saturation O2':
      return Math.round(value)
    default:
      return value.toString()
  }
}

function getUnitForMesure(type) {
  switch (type) {
    case 'Tension':
      return 'mmHg'
    case 'Température':
      return '°C'
    case 'Glycémie':
      return 'g/L'
    case 'Poids':
      return 'kg'
    case 'Fréquence cardiaque':
      return 'bpm'
    case 'Saturation O2':
      return '%'
    default:
      return ''
  }
}

function getIconForMesure(type) {
  switch (type) {
    case 'Tension':
      return Activity
    case 'Température':
      return Thermometer
    case 'Glycémie':
      return Droplet
    case 'Poids':
      return Scale
    case 'Fréquence cardiaque':
      return Heart
    case 'Saturation O2':
      return Percent
    default:
      return BarChart2
  }
}

function getEtatLabel(etat) {
  switch (etat) {
    case 'normal':
      return 'Normal'
    case 'attention':
      return 'Attention'
    case 'critique':
      return 'Critique'
    default:
      return 'Inconnu'
  }
}

function getEtatClass(etat) {
  switch (etat) {
    case 'normal':
      return 'evolution-normal'
    case 'attention':
      return 'evolution-attention'
    case 'critique':
      return 'evolution-critique'
    default:
      return ''
  }
}

function getEtatIconClass(etat) {
  switch (etat) {
    case 'normal':
      return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
    case 'attention':
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'critique':
      return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

function getEtatBadgeClass(etat) {
  switch (etat) {
    case 'normal':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'attention':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'critique':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

function getEtatTextClass(etat) {
  switch (etat) {
    case 'normal':
      return 'text-green-600 dark:text-green-400'
    case 'attention':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'critique':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-800 dark:text-gray-200'
  }
}
</script>

<style scoped>
.evolutions-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.evolution-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden
         border border-gray-200 dark:border-gray-700
         transition-all duration-200 hover:shadow-md;
}

.evolution-normal {
  @apply border-l-4 border-l-green-500;
}

.evolution-attention {
  @apply border-l-4 border-l-yellow-500;
}

.evolution-critique {
  @apply border-l-4 border-l-red-500;
}

.card-header {
  @apply p-4 flex justify-between items-start border-b border-gray-200 dark:border-gray-700;
}

.card-content {
  @apply p-4;
}

.evolution-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center;
}

.value-display {
  @apply flex items-baseline;
}

.evolution-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.dropdown {
  @apply relative;
}

.dropdown-trigger {
  @apply p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700;
}

.dropdown-menu {
  @apply absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 
         shadow-lg rounded-lg border border-gray-200 dark:border-gray-700
         z-10 hidden;
}

.dropdown:hover .dropdown-menu {
  @apply block;
}

.dropdown-item {
  @apply flex items-center w-full px-4 py-2 text-sm text-left
         hover:bg-gray-100 dark:hover:bg-gray-700;
}

.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input, .form-select, .form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white;
}

.btn-primary-sm {
  @apply px-3 py-1.5 bg-primary-600 text-white rounded-lg
         hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500
         transition-colors duration-200;
}

.btn-primary {
  @apply px-4 py-2 bg-primary-600 text-white rounded-lg
         hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500
         transition-colors duration-200 flex items-center justify-center;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg
         hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500
         transition-colors duration-200;
}

.btn-danger {
  @apply px-4 py-2 bg-red-600 text-white rounded-lg
         hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
         transition-colors duration-200 flex items-center justify-center;
}

.loader {
  @apply w-8 h-8 border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 rounded-full animate-spin;
}

.empty-state {
  @apply text-center;
}
</style> 