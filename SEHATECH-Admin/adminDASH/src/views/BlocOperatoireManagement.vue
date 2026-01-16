<template>
  <div class="space-y-6">
    <!-- En-tête avec statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Blocs Opératoires</h3>
        <div class="flex items-center mt-2">
          <p class="text-3xl font-semibold text-gray-900 dark:text-white">
            {{ blocStore.blocs.length }}
          </p>
          <span class="ml-2 text-sm text-gray-500">blocs</span>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Disponibles</h3>
        <div class="flex items-center mt-2">
          <p class="text-3xl font-semibold text-green-600 dark:text-green-400">
            {{ blocStore.availableBlocs.length }}
          </p>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Occupés</h3>
        <p class="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
          {{ blocStore.occupiedBlocs.length }}
        </p>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-0">
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Rechercher un bloc opératoire..."
            class="form-input pl-10 w-full"
          />
          <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      <div class="flex gap-2">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">Filtrer par:</span>
          <select
            v-model="typeFilter"
            class="form-select appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Tous les types</option>
            <option value="general">Général</option>
            <option value="cardiaque">Cardiaque</option>
            <option value="orthopedie">Orthopédie</option>
            <option value="neurochirurgie">Neurochirurgie</option>
            <option value="obstetrique">Obstétrique</option>
          </select>
          <select
            v-model="statusFilter"
            class="form-select appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Tous les statuts</option>
            <option value="disponible">Disponible</option>
            <option value="occupe">Occupé</option>
            <option value="maintenance">En maintenance</option>
          </select>
          <select
            v-model="serviceFilter"
            class="form-select appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Tous les services</option>
            <option v-for="service in uniqueServices" :key="service" :value="service">{{ service }}</option>
          </select>
        </div>
        <button
          class="btn btn-primary flex items-center gap-2"
          @click="showAddBlocModal = true"
        >
          <Plus class="w-5 h-5" />
          Nouveau bloc opératoire
        </button>
      </div>
    </div>

    <!-- Vue en grille des blocs opératoires -->
    <div v-if="blocStore.isLoading" class="flex justify-center items-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
    </div>
    
    <div v-else-if="blocStore.error" class="text-center py-12">
      <AlertCircle class="w-12 h-12 mx-auto text-red-500 mb-4" />
      <p class="text-gray-500 dark:text-gray-400">{{ blocStore.error }}</p>
      <button
        class="mt-4 btn btn-secondary"
        @click="loadBlocs"
      >
        Réessayer
      </button>
    </div>
    
    <div v-else-if="filteredBlocs.length === 0" class="text-center py-12">
      <FolderX class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p class="text-gray-500 dark:text-gray-400">Aucun bloc opératoire trouvé</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="bloc in paginatedBlocs"
        :key="bloc._id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 overflow-hidden group"
      >
        <div class="relative p-6">
          <!-- Status Indicator (Top Right Corner) -->
          <div class="absolute top-0 right-0 p-4">
            <span 
              class="status-badge flex items-center shadow-sm"
              :class="statusClasses[bloc.statut]"
            >
              <span 
                class="w-2.5 h-2.5 rounded-full mr-2 animate-pulse"
                :class="{
                  'bg-green-500': bloc.statut === 'disponible',
                  'bg-blue-500': bloc.statut === 'occupe',
                  'bg-yellow-500': bloc.statut === 'maintenance'
                }"
              ></span>
              {{ statusLabels[bloc.statut] }}
            </span>
          </div>

          <!-- Bloc Info -->
          <div class="mb-6 mt-10">
            <div class="flex items-center mb-2">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white text-center w-full">
                Bloc {{ bloc.numerosalle }}
              </h3>
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Building2 class="w-4 h-4 mr-2" />
              {{ typeLabels[bloc.type] || bloc.type }}
            </div>
            <div v-if="bloc.service" class="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              <Building class="w-4 h-4 mr-2" />
              Service: {{ bloc.service }}
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <!-- Status Actions -->
            <div class="flex items-center space-x-2">
              <button
                v-if="bloc.statut !== 'disponible'"
                class="btn-status bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-400"
                @click="updateStatus(bloc._id, 'disponible')"
                title="Marquer comme disponible"
              >
                <CheckCircle class="w-4 h-4" />
              </button>
              <button
                v-if="bloc.statut !== 'occupe'"
                class="btn-status bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400"
                @click="updateStatus(bloc._id, 'occupe')"
                title="Marquer comme occupé"
              >
                <Ticket class="w-4 h-4" />
              </button>
              <button
                v-if="bloc.statut !== 'maintenance'"
                class="btn-status bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-800/50 dark:text-yellow-400"
                @click="updateStatus(bloc._id, 'maintenance')"
                title="Mettre en maintenance"
              >
                <Wrench class="w-4 h-4" />
              </button>
            </div>

            <!-- Management Actions -->
            <div class="flex items-center space-x-2">
              <button
                class="btn-action bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400"
                @click="editBloc(bloc)"
                title="Modifier"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                class="btn-action bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400"
                @click="confirmDeleteBloc(bloc)"
                title="Supprimer"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex justify-center mt-6">
      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="currentPage = page"
          :class="[
            'btn',
            currentPage === page ? 'btn-primary' : 'btn-secondary',
            'px-4 py-2'
          ]"
        >
          {{ page }}
        </button>
      </nav>
    </div>

    <!-- Modal d'ajout/édition de bloc opératoire -->
    <BaseModal
      v-if="showAddBlocModal"
      :title="editingBloc ? 'Modifier le bloc opératoire' : 'Nouveau bloc opératoire'"
      @close="handleCloseModal"
    >
      <form @submit.prevent="handleSubmitBloc" class="space-y-6">
        <div>
          <label class="form-label" for="bloc-number">Numéro de salle</label>
          <input
            id="bloc-number"
            v-model="blocForm.numerosalle"
            type="text"
            class="form-input"
            required
          />
        </div>

        <div>
          <label class="form-label" for="bloc-type">Type de bloc</label>
          <select
            id="bloc-type"
            v-model="blocForm.type"
            class="form-select"
            required
          >
            <option value="general">Général</option>
            <option value="cardiaque">Cardiaque</option>
            <option value="orthopedie">Orthopédie</option>
            <option value="neurochirurgie">Neurochirurgie</option>
            <option value="obstetrique">Obstétrique</option>
          </select>
        </div>

        <div>
          <label class="form-label" for="bloc-service">Service</label>
          <input
            id="bloc-service"
            v-model="blocForm.service"
            type="text"
            class="form-input"
            placeholder="Nom du service"
          />
        </div>

        <div>
          <label class="form-label" for="bloc-status">Statut du bloc</label>
          <select
            id="bloc-status"
            v-model="blocForm.statut"
            class="form-select"
            required
          >
            <option value="disponible">Disponible</option>
            <option value="occupe">Occupé</option>
            <option value="maintenance">En maintenance</option>
          </select>
        </div>

        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" @click="handleCloseModal">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary">
            {{ editingBloc ? 'Modifier' : 'Ajouter' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Modal de confirmation de suppression -->
    <ConfirmationModal
      v-if="showDeleteModal"
      title="Supprimer le bloc opératoire"
      :message="`Êtes-vous sûr de vouloir supprimer le bloc opératoire ${blocToDelete?.numerosalle} ?`"
      type="danger"
      @confirm="deleteBloc"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Loader2, Edit2, Trash2, Search, Wrench, FolderX, AlertCircle, CheckCircle, Building2, Ticket, Building } from 'lucide-vue-next'
import { useBlocOperatoireStore } from '@/stores/blocOperatoire'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const blocStore = useBlocOperatoireStore()
const toast = useToast()

// État local
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const serviceFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(12)

const showAddBlocModal = ref(false)
const showDeleteModal = ref(false)
const blocToDelete = ref(null)
const editingBloc = ref(null)

const blocForm = ref({
  numerosalle: '',
  type: 'general',
  statut: 'disponible',
  service: ''
})

// Constantes pour les labels et classes
const typeLabels = {
  general: 'Bloc général',
  cardiaque: 'Bloc cardiaque',
  orthopedie: 'Bloc orthopédie',
  neurochirurgie: 'Bloc neurochirurgie',
  obstetrique: 'Bloc obstétrique'
}

const statusLabels = {
  disponible: 'Disponible',
  occupe: 'Occupé',
  maintenance: 'En maintenance'
}

const statusClasses = {
  disponible: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  occupe: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
}

// Computed properties
const filteredBlocs = computed(() => {
  return blocStore.blocs.filter(bloc => {
    const matchesSearch = String(bloc.numerosalle).toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !typeFilter.value || bloc.type === typeFilter.value
    const matchesStatus = !statusFilter.value || bloc.statut === statusFilter.value
    const matchesService = !serviceFilter.value || bloc.service === serviceFilter.value
    return matchesSearch && matchesType && matchesStatus && matchesService
  })
})

const uniqueServices = computed(() => {
  const services = blocStore.blocs.map(bloc => bloc.service).filter(service => service)
  return [...new Set(services)]
})

const totalPages = computed(() => 
  Math.ceil(filteredBlocs.value.length / itemsPerPage.value)
)

const paginatedBlocs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredBlocs.value.slice(start, end)
})

// Methods
const loadBlocs = async () => {
  try {
    await blocStore.fetchBlocs()
  } catch (error) {
    toast.error('Erreur lors du chargement des blocs opératoires')
  }
}

const handleSubmitBloc = async () => {
  try {
    let result;
    if (editingBloc.value) {
      result = await blocStore.updateBloc(editingBloc.value._id, blocForm.value)
      if (result.success) {
        toast.success('Bloc opératoire modifié avec succès')
        handleCloseModal()
        await loadBlocs()
      }
    } else {
      result = await blocStore.addBloc(blocForm.value)
      if (result.success) {
        toast.success('Bloc opératoire ajouté avec succès')
        handleCloseModal()
        await loadBlocs()
      }
    }
  } catch (error) {
    toast.error(error.message || 'Erreur lors de l\'opération')
  }
}

const confirmDeleteBloc = (bloc) => {
  blocToDelete.value = bloc
  showDeleteModal.value = true
}

const deleteBloc = async () => {
  try {
    const result = await blocStore.deleteBloc(blocToDelete.value._id)
    if (result.success) {
      toast.success(result.message)
      await loadBlocs() // Refresh the bloc list
    } else {
      toast.error(result.message)
    }
    showDeleteModal.value = false
    blocToDelete.value = null
  } catch (error) {
    toast.error(error.message || 'Erreur lors de la suppression du bloc opératoire')
    showDeleteModal.value = false
    blocToDelete.value = null
  }
}

const updateStatus = async (blocId, newStatus) => {
  try {
    const result = await blocStore.updateBlocStatus(blocId, newStatus)
    if (result.success) {
      toast.success(result.message)
      await loadBlocs()
    } else {
      toast.error(result.message)
    }
  } catch (error) {
    toast.error(error.message || 'Erreur lors de la mise à jour du statut')
  }
}

const editBloc = (bloc) => {
  editingBloc.value = bloc
  blocForm.value = { ...bloc }
  showAddBlocModal.value = true
}

const handleCloseModal = () => {
  showAddBlocModal.value = false
  editingBloc.value = null
  blocForm.value = {
    numerosalle: '',
    type: 'general',
    statut: 'disponible',
    service: ''
  }
}

// Chargement initial des blocs opératoires
onMounted(() => {
  loadBlocs()
})
</script>

<style scoped>
.status-badge {
  @apply px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 backdrop-blur-sm
    shadow-sm ring-1 ring-current ring-opacity-10;
}

.btn-action, .btn-status {
  @apply p-2 rounded-full transition-all duration-300 transform hover:scale-110 opacity-80 group-hover:opacity-100
    shadow-sm hover:shadow-lg ring-1 ring-current ring-opacity-10;
}

.btn-action:hover, .btn-status:hover {
  @apply shadow-lg ring-2 ring-opacity-50 -translate-y-0.5;
}

/* Bloc Card Inner Content */
.relative.p-6 {
  @apply bg-gradient-to-br from-transparent to-gray-50 dark:to-gray-800/50;
}

/* Bloc Number */
.text-xl.font-bold {
  @apply text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300;
}

/* Bloc Info Icons */
.w-4.h-4.mr-2 {
  @apply text-gray-400 group-hover:text-primary-500 transition-colors duration-300;
}

/* Status Indicator Pulse */
.w-2\.5.h-2\.5.rounded-full {
  @apply shadow-lg opacity-25;
}

/* Equipment List */
.flex.items-center.text-sm.text-gray-600 {
  @apply p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm
    hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200;
}

.error-message {
  @apply mt-1 text-sm text-red-600 dark:text-red-400;
}

/* Modal Enhancements */
.modal-content {
  @apply transform transition-all duration-300;
}

.modal-enter-from,
.modal-leave-to {
  @apply opacity-0 scale-95;
}

.modal-enter-to,
.modal-leave-from {
  @apply opacity-100 scale-100;
}

/* Form Section Spacing */
form > div:not(:last-child) {
  @apply mb-6;
}

/* Button Group Styling */
.flex.justify-end.space-x-3 {
  @apply mt-8 border-t dark:border-gray-700 pt-6;
}

/* Enhanced Transitions */
.transition-all {
  @apply duration-300 ease-in-out;
}
</style> 