<template>
  <div class="space-y-6">
    <!-- En-tête avec statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Chambres</h3>
        <div class="flex items-center mt-2">
          <p class="text-3xl font-semibold text-gray-900 dark:text-white">
            {{ roomStore.rooms.length }}
          </p>
          <span class="ml-2 text-sm text-gray-500">chambres</span>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Disponibles</h3>
        <div class="flex items-center mt-2">
          <p class="text-3xl font-semibold text-green-600 dark:text-green-400">
            {{ roomStore.availableRooms.length }}
          </p>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Occupées</h3>
        <p class="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
          {{ roomStore.occupiedRooms.length }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">En Nettoyage</h3>
        <p class="mt-2 text-3xl font-semibold text-purple-600 dark:text-purple-400">
          {{ roomStore.rooms.filter(room => room.etat === 'nettoyage').length }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">En Maintenance</h3>
        <p class="mt-2 text-3xl font-semibold text-yellow-600 dark:text-yellow-400">
          {{ roomStore.rooms.filter(room => room.etat === 'maintenance').length }}
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
            placeholder="Rechercher une chambre..."
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
            <option value="simple">Chambre simple</option>
            <option value="double">Chambre double</option>
            <option value="suite">Suite</option>
          </select>
          <select
            v-model="statusFilter"
            class="form-select appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Tous les statuts</option>
            <option value="disponible">Disponible</option>
            <option value="occupee">Occupée</option>
            <option value="maintenance">En maintenance</option>
            <option value="nettoyage">En nettoyage</option>
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
          @click="showAddRoomModal = true"
        >
          <Plus class="w-5 h-5" />
          Nouvelle chambre
        </button>
        <button
          class="btn btn-secondary flex items-center gap-2"
          @click="router.push('/bloc-operatoire')"
        >
          <Scissors class="w-5 h-5" />
          Gérer blocs opératoires
        </button>
      </div>
    </div>

    <!-- Vue en grille des chambres -->
    <div v-if="roomStore.isLoading" class="flex justify-center items-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
    </div>
    
    <div v-else-if="roomStore.error" class="text-center py-12">
      <AlertCircle class="w-12 h-12 mx-auto text-red-500 mb-4" />
      <p class="text-gray-500 dark:text-gray-400">{{ roomStore.error }}</p>
      <button
        class="mt-4 btn btn-secondary"
        @click="loadRooms"
      >
        Réessayer
      </button>
    </div>
    
    <div v-else-if="filteredRooms.length === 0" class="text-center py-12">
      <FolderX class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p class="text-gray-500 dark:text-gray-400">Aucune chambre trouvée</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="room in paginatedRooms"
        :key="room._id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 overflow-hidden group"
      >
        <div class="relative p-6">
          <!-- Status Indicator (Top Right Corner) -->
          <div class="absolute top-0 right-0 p-4">
            <span 
              class="status-badge flex items-center shadow-sm"
              :class="statusClasses[room.etat]"
            >
              <span 
                class="w-2.5 h-2.5 rounded-full mr-2 animate-pulse"
                :class="{
                  'bg-green-500': room.etat === 'disponible',
                  'bg-blue-500': room.etat === 'occupee',
                  'bg-yellow-500': room.etat === 'maintenance',
                  'bg-purple-500': room.etat === 'nettoyage'
                }"
              ></span>
              {{ statusLabels[room.etat] }}
            </span>
          </div>

          <!-- Room Info -->
          <div class="mb-6 mt-10">
            <div class="flex items-center mb-2">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white text-center w-full">
                Chambre {{ room.numero }}
              </h3>
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Building2 class="w-4 h-4 mr-2" />
              {{ typeLabels[room.type] }}
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              <Building class="w-4 h-4 mr-2" />
              Étage {{ room.etage }}
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              <Package class="w-4 h-4 mr-2" />
              {{ room.equipements?.join(', ') || 'Aucun équipement' }}
            </div>
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              <Building class="w-4 h-4 mr-2" />
              Service: {{ room.service || 'Non spécifié' }}
            </div>
            <div v-if="room.notes" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <StickyNote class="w-4 h-4 mr-2 inline" />
              {{ room.notes }}
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <!-- Status Actions -->
            <div class="flex items-center space-x-2">
              <button
                v-if="room.etat !== 'disponible'"
                class="btn-status bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-400"
                @click="updateStatus(room._id, 'disponible')"
                title="Marquer comme disponible"
              >
                <CheckCircle class="w-4 h-4" />
              </button>
              <button
                v-if="room.etat !== 'occupee'"
                class="btn-status bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400"
                @click="updateStatus(room._id, 'occupee')"
                title="Marquer comme occupée"
              >
                <Bed class="w-4 h-4" />
              </button>
              <button
                v-if="room.etat !== 'maintenance'"
                class="btn-status bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-800/50 dark:text-yellow-400"
                @click="updateStatus(room._id, 'maintenance')"
                title="Mettre en maintenance"
              >
                <Wrench class="w-4 h-4" />
              </button>
              <button
                v-if="room.etat !== 'nettoyage'"
                class="btn-status bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 dark:text-purple-400"
                @click="updateStatus(room._id, 'nettoyage')"
                title="Mettre en nettoyage"
              >
                <Brush class="w-4 h-4" />
              </button>
            </div>

            <!-- Management Actions -->
            <div class="flex items-center space-x-2">
              <button
                class="btn-action bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400"
                @click="editRoom(room)"
                title="Modifier"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                class="btn-action bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400"
                @click="confirmDeleteRoom(room)"
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

    <!-- Modal d'ajout/édition de chambre -->
    <BaseModal
      v-if="showAddRoomModal"
      :title="editingRoom ? 'Modifier la chambre' : 'Nouvelle chambre'"
      @close="handleCloseModal"
    >
      <form @submit.prevent="handleSubmitRoom" class="space-y-6">
        <div>
          <label class="form-label" for="room-number">Numéro de chambre</label>
          <input
            id="room-number"
            v-model="roomForm.numero"
            type="text"
            class="form-input"
            required
          />
        </div>

        <div>
          <label class="form-label" for="room-type">Type de chambre</label>
          <select
            id="room-type"
            v-model="roomForm.type"
            class="form-select"
            required
          >
            <option value="simple">Chambre simple</option>
            <option value="double">Chambre double</option>
            <option value="suite">Suite</option>
            <option value="technique">Technique</option>
          </select>
        </div>

        <div>
          <label class="form-label" for="room-floor">Étage</label>
          <input
            id="room-floor"
            v-model="roomForm.etage"
            type="number"
            min="0"
            class="form-input"
            required
          />
        </div>

        <div>
          <label class="form-label" for="room-equipment">Équipements</label>
          <div class="space-y-2">
            <label class="inline-flex items-center space-x-2">
              <input type="checkbox" v-model="roomForm.equipements" value="WiFi" class="form-checkbox" />
              <span>WiFi</span>
            </label>
            <label class="inline-flex items-center space-x-2">
              <input type="checkbox" v-model="roomForm.equipements" value="TV" class="form-checkbox" />
              <span>TV</span>
            </label>
            <label class="inline-flex items-center space-x-2">
              <input type="checkbox" v-model="roomForm.equipements" value="Climatisation" class="form-checkbox" />
              <span>Climatisation</span>
            </label>
            <label class="inline-flex items-center space-x-2">
              <input type="checkbox" v-model="roomForm.equipements" value="Téléphone" class="form-checkbox" />
              <span>Téléphone</span>
            </label>
            <label class="inline-flex items-center space-x-2">
              <input type="checkbox" v-model="roomForm.equipements" value="Camera" class="form-checkbox" />
              <span>Camera</span>
            </label>
          </div>
        </div>

        <div>
          <label class="form-label" for="room-notes">Notes</label>
          <textarea
            id="room-notes"
            v-model="roomForm.notes"
            class="form-textarea"
            rows="3"
            placeholder="Ajoutez des notes supplémentaires..."
          ></textarea>
        </div>

        <div>
          <label class="form-label" for="room-status">État de la chambre</label>
          <select
            id="room-status"
            v-model="roomForm.etat"
            class="form-select"
            required
          >
            <option value="disponible">Disponible</option>
            <option value="occupee">Occupée</option>
            <option value="maintenance">En maintenance</option>
            <option value="nettoyage">En nettoyage</option>
          </select>
        </div>

        <div>
          <label class="form-label" for="room-service">Service</label>
          <input
            id="room-service"
            v-model="roomForm.service"
            type="text"
            class="form-input"
            placeholder="Nom du service"
          />
        </div>

        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" @click="handleCloseModal">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary">
            {{ editingRoom ? 'Modifier' : 'Ajouter' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Modal de confirmation de suppression -->
    <ConfirmationModal
      v-if="showDeleteModal"
      title="Supprimer la chambre"
      :message="`Êtes-vous sûr de vouloir supprimer la chambre ${roomToDelete?.numero} ?`"
      type="danger"
      @confirm="deleteRoom"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Loader2, Edit2, Trash2, Search, Wrench, FolderX, AlertCircle, CheckCircle, Building2, Building, Package, StickyNote, Brush, Bed, Scissors } from 'lucide-vue-next'
import { useRoomStore } from '@/stores/room'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { useRouter } from 'vue-router'

const roomStore = useRoomStore()
const toast = useToast()
const router = useRouter()

// État local
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const serviceFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(12)

const showAddRoomModal = ref(false)
const showDeleteModal = ref(false)
const roomToDelete = ref(null)
const editingRoom = ref(null)

const roomForm = ref({
  numero: '',
  type: 'simple',
  etat: 'disponible',
  etage: 1,
  equipements: [],
  notes: '',
  service: ''
})

// Constantes pour les labels et classes
const typeLabels = {
  simple: 'Chambre simple',
  double: 'Chambre double',
  suite: 'Suite',
  technique: 'Technique'
}

const statusLabels = {
  disponible: 'Disponible',
  occupee: 'Occupée',
  maintenance: 'En maintenance',
  nettoyage: 'En nettoyage'
}

const statusClasses = {
  disponible: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  occupee: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  nettoyage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
}

// Computed properties
const filteredRooms = computed(() => {
  return roomStore.rooms.filter(room => {
    const matchesSearch = String(room.numero).toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = !typeFilter.value || room.type === typeFilter.value
    const matchesStatus = !statusFilter.value || room.etat === statusFilter.value
    const matchesService = !serviceFilter.value || room.service === serviceFilter.value
    return matchesSearch && matchesType && matchesStatus && matchesService
  })
})

const totalPages = computed(() => 
  Math.ceil(filteredRooms.value.length / itemsPerPage.value)
)

const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRooms.value.slice(start, end)
})

const uniqueServices = computed(() => {
  const services = roomStore.rooms.map(room => room.service).filter(service => service)
  return [...new Set(services)]
})

// Methods
const loadRooms = async () => {
  try {
    await roomStore.fetchRooms()
  } catch (error) {
    toast.error('Erreur lors du chargement des chambres')
  }
}

const handleSubmitRoom = async () => {
  try {
    let result;
    if (editingRoom.value) {
      result = await roomStore.updateRoom(editingRoom.value._id, roomForm.value)
      if (result) {
        toast.success('Chambre modifiée avec succès')
        handleCloseModal()
        await loadRooms()
      }
    } else {
      result = await roomStore.addRoom(roomForm.value)
      if (result) {
        toast.success('Chambre ajoutée avec succès')
        handleCloseModal()
        await loadRooms()
      }
    }
  } catch (error) {
    toast.error(error.message || 'Erreur lors de l\'opération')
  }
}

const confirmDeleteRoom = (room) => {
  roomToDelete.value = room
  showDeleteModal.value = true
}

const deleteRoom = async () => {
  try {
    const result = await roomStore.deleteRoom(roomToDelete.value._id)
    if (result.success) {
      toast.success(result.message)
      await loadRooms() // Refresh the room list
    } else {
      toast.error(result.message)
    }
    showDeleteModal.value = false
    roomToDelete.value = null
  } catch (error) {
    toast.error(error.message || 'Erreur lors de la suppression de la chambre')
    showDeleteModal.value = false
    roomToDelete.value = null
  }
}

const updateStatus = async (roomId, newStatus) => {
  try {
    const result = await roomStore.updateRoomStatus(roomId, newStatus)
    if (result.success) {
      toast.success(result.message)
      await loadRooms()
    } else {
      toast.error(result.message)
    }
  } catch (error) {
    toast.error(error.message || 'Erreur lors de la mise à jour du statut')
  }
}

const editRoom = (room) => {
  editingRoom.value = room
  roomForm.value = { ...room }
  showAddRoomModal.value = true
}

const handleCloseModal = () => {
  showAddRoomModal.value = false
  editingRoom.value = null
  roomForm.value = {
    numero: '',
    type: 'simple',
    etat: 'disponible',
    etage: 1,
    equipements: [],
    notes: '',
    service: ''
  }
}

// Chargement initial des chambres
onMounted(() => {
  loadRooms()
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

/* Room Card Inner Content */
.relative.p-6 {
  @apply bg-gradient-to-br from-transparent to-gray-50 dark:to-gray-800/50;
}

/* Room Number */
.text-xl.font-bold {
  @apply text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300;
}

/* Room Info Icons */
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

/* Notes Section */
[v-if="room.notes"] {
  @apply mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/20
    backdrop-blur-sm;
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

/* Checkbox Group Styling */
.space-y-2 {
  @apply grid grid-cols-2 gap-4;
}

.space-y-2 label {
  @apply flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700
    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200;
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