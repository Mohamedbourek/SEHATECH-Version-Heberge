<template>
  <div class="space-y-6">
    <!-- Stats rapides -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total équipements"
        :value="equipments.length"
        icon="Monitor"
        color="blue"
      />
      <StatCard
        title="En maintenance"
        :value="maintenanceCount"
        icon="Wrench"
        color="yellow"
        trend="up"
        :percentage="maintenancePercentage"
      />
      <StatCard
        title="Alertes actives"
        :value="alertCount"
        icon="AlertTriangle"
        color="red"
        trend="down"
        :percentage="alertPercentage"
      />
    </div>

    <!-- Filtres et actions -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex flex-wrap gap-4">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            class="form-input pl-10"
            placeholder="Rechercher un équipement..."
          />
          <SearchIcon class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        
        <select v-model="department" class="form-select w-48">
          <option value="all">Tous les services</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">
            {{ dept.name }}
          </option>
        </select>
        
        <select v-model="status" class="form-select w-40">
          <option value="all">Tous les statuts</option>
          <option v-for="status in statuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>
      
      <div class="flex items-center space-x-3">
        <button 
          class="btn btn-outline"
          @click="exportData"
        >
          <FileDownIcon class="w-4 h-4 mr-2" />
          Exporter
        </button>
      <button 
        class="btn btn-primary"
          @click="showAddModal = true"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Ajouter un équipement
      </button>
      </div>
    </div>

    <!-- Liste des équipements avec état de chargement -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-if="loading">
        <div 
          v-for="n in 6" 
          :key="n"
          class="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-[400px]"
        ></div>
      </template>
      <template v-else-if="filteredEquipments.length === 0">
        <div class="col-span-full py-12 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full 
                      bg-gray-100 dark:bg-gray-800 mb-4">
            <SearchX class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun équipement trouvé
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      </template>
      <template v-else>
        <EquipmentCard
        v-for="equipment in paginatedEquipments" 
        :key="equipment.id"
          :equipment="equipment"
          @edit="editEquipment"
          @maintenance="scheduleMaintenance"
          @view-history="viewHistory"
          @status-change="handleStatusChange"
        />
      </template>
    </div>

    <!-- Pagination -->
    <div v-if="filteredEquipments.length > 0" class="mt-6">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Affichage de {{ (currentPage - 1) * itemsPerPage + 1 }} à {{ Math.min(currentPage * itemsPerPage, filteredEquipments.length) }} sur {{ filteredEquipments.length }} équipements
        </div>
        <div class="flex space-x-2">
          <button 
            @click="prevPage"
            :disabled="currentPage <= 1"
            class="btn btn-outline py-1 px-2 disabled:opacity-50"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <div class="flex space-x-1">
            <button 
              v-for="page in totalPages" 
              :key="page"
              @click="goToPage(page)"
              :class="[
                'px-3 py-1 rounded text-sm',
                currentPage === page 
                  ? 'bg-primary-600 text-white dark:bg-primary-500' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              {{ page }}
            </button>
          </div>
          <button 
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            class="btn btn-outline py-1 px-2 disabled:opacity-50"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <EquipmentFormModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @save="handleAddEquipment"
    />

    <EquipmentFormModal
      v-if="showEditModal"
      :equipment="selectedEquipment"
      @close="showEditModal = false"
      @save="handleEditEquipment"
    />

    <MaintenanceScheduleModal
      v-if="showMaintenanceModal"
      :equipment="selectedEquipment"
      @close="showMaintenanceModal = false"
      @save="handleScheduleMaintenance"
    />

    <!-- Notification améliorée -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="notification"
        class="fixed bottom-4 right-4 z-50 max-w-md w-full md:max-w-lg"
      >
        <div 
          class="rounded-lg shadow-xl p-4 backdrop-blur-sm"
          :class="{
            'bg-green-50/90 dark:bg-green-900/90': notification.type === 'success',
            'bg-red-50/90 dark:bg-red-900/90': notification.type === 'error'
          }"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <CheckCircle 
                v-if="notification.type === 'success'"
                class="h-6 w-6 text-green-400"
              />
              <XCircle
                v-else
                class="h-6 w-6 text-red-400"
              />
            </div>
            <div class="ml-3 w-0 flex-1">
              <p 
                class="text-base font-medium"
                :class="{
                  'text-green-800 dark:text-green-200': notification.type === 'success',
                  'text-red-800 dark:text-red-200': notification.type === 'error'
                }"
              >
                {{ notification.title }}
              </p>
              <p 
                class="mt-1 text-sm"
                :class="{
                  'text-green-700 dark:text-green-300': notification.type === 'success',
                  'text-red-700 dark:text-red-300': notification.type === 'error'
                }"
              >
                {{ notification.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                @click="notification = null"
              >
                <span class="sr-only">Fermer</span>
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch  } from 'vue'
import { useRouter } from 'vue-router'
import { useEquipmentStore } from '@/stores/equipment'
import { storeToRefs } from 'pinia'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  SearchIcon,
  PlusIcon,
  FileDownIcon,
  MonitorIcon,
  WrenchIcon,
  AlertTriangleIcon,
  SearchX,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Info as InfoIcon,
  X as XIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import EquipmentCard from './EquipmentCard.vue'
import EquipmentFormModal from './EquipmentFormModal.vue'
import MaintenanceScheduleModal from '@/components/maintenance/MaintenanceScheduleModal.vue'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const { equipments, loading } = storeToRefs(equipmentStore)

// États locaux
const search = ref('')
const department = ref('all')
const status = ref('all')
const showAddModal = ref(false)
const showEditModal = ref(false)
const showMaintenanceModal = ref(false)
const selectedEquipment = ref(null)
const isUpdating = ref(false) // New ref for tracking update operations

const currentPage = ref(1)
const itemsPerPage = ref(10)
// Définition des labels de statut
const statusLabels = {
  operational: 'Fonctionnel',
  maintenance: 'En maintenance',
  available: 'Disponible',
  error: 'En panne'
}

// Définition des départements
const departments = [
  { id: 'Cardiologie', name: 'Cardiologie' },
  { id: 'Radiologie', name: 'Radiologie' },
  { id: 'Laboratoire', name: 'Laboratoire' }
]

const statuses = [
  { value: 'operational', label: 'Opérationnel' },
  { value: 'maintenance', label: 'En maintenance' },
  { value: 'available', label: 'Disponible' },
  { value: 'error', label: 'En panne' }
]

// Computed properties
const filteredEquipments = computed(() => {
  const filtered = equipments.value.filter(equipment => {
    // Support both old and new data structure
    const name = equipment.name || equipment.type || ''
    const dept = equipment.department || equipment.service || ''
    const equipStatus = equipment.status || equipment.etat || ''
    
    const matchesSearch = name.toLowerCase().includes(search.value.toLowerCase())
    const matchesDepartment = department.value === 'all' || dept === department.value
    const matchesStatus = status.value === 'all' || equipStatus === status.value
    return matchesSearch && matchesDepartment && matchesStatus
  })
  
  return filtered
})

const paginatedEquipments = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return filteredEquipments.value.slice(startIndex, endIndex)
})

const totalPages = computed(() => {
  return Math.ceil(filteredEquipments.value.length / itemsPerPage.value) || 1
})

const maintenanceCount = computed(() => {
  return equipments.value.filter(eq => (eq.status || eq.etat) === 'maintenance').length
})

const maintenancePercentage = computed(() => {
  return equipments.value.length ? Math.round((maintenanceCount.value / equipments.value.length) * 100) : 0
})

const alertCount = computed(() => {
  // For MongoDB data, we might not have alerts yet
  return equipments.value.filter(eq => eq.alerts?.length > 0).length
})

const alertPercentage = computed(() => {
  return equipments.value.length ? Math.round((alertCount.value / equipments.value.length) * 100) : 0
})

// Méthodes
function goToPage(page) {
  currentPage.value = page
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Update the handleEditEquipment function
async function handleEditEquipment(data) {
  try {
    isUpdating.value = true // Set updating state to true
    // Support MongoDB _id
    const id = selectedEquipment.value._id || selectedEquipment.value.id
    await equipmentStore.updateEquipment(id, data)
    
    // Refresh equipment data
    await equipmentStore.fetchEquipments()
    
    showEditModal.value = false
    showNotification('Succès', 'Équipement mis à jour avec succès')
  } catch (error) {
    console.error('Error updating equipment:', error)
    showNotification('Erreur', 'Impossible de mettre à jour l\'équipement', 'error')
  } finally {
    isUpdating.value = false // Reset updating state
  }
}

// Also update handleAddEquipment for consistency
async function handleAddEquipment(data) {
  try {
    isUpdating.value = true // Set updating state to true
    await equipmentStore.addEquipment(data)
    
    // Refresh equipment data
    await equipmentStore.fetchEquipments()
    
    showAddModal.value = false
    showNotification('Succès', 'Équipement ajouté avec succès')
  } catch (error) {
    console.error('Error adding equipment:', error)
    showNotification('Erreur', 'Impossible d\'ajouter l\'équipement', 'error')
  } finally {
    isUpdating.value = false // Reset updating state
  }
}

// Update handleStatusChange function as well
async function handleStatusChange(equipment, newStatus) {
  try {
    isUpdating.value = true // Set updating state to true
    // Support MongoDB _id
    const id = equipment._id || equipment.id
    await equipmentStore.updateEquipment(id, {
      ...equipment,
      status: newStatus,
      etat: newStatus, // For MongoDB
      ...(newStatus === 'Fonctionnel' ? { 
        lastMaintenance: new Date().toISOString(),
        derniereMaintenance: new Date().toISOString() // For MongoDB
      } : {})
    })
    
    // Refresh equipment data
    await equipmentStore.fetchEquipments()
    
    showNotification('Succès', `État de l'équipement mis à jour : ${statusLabels[newStatus]}`)
  } catch (error) {
    console.error('Error updating status:', error)
    showNotification('Erreur', 'Impossible de mettre à jour l\'état', 'error')
  } finally {
    isUpdating.value = false // Reset updating state
  }
}

// Update handleScheduleMaintenance function
async function handleScheduleMaintenance(data) {
  try {
    isUpdating.value = true // Set updating state to true
    
    // The modal is already closed by the MaintenanceScheduleModal component
    // when it emits the 'save' event
    
    // Update equipment status if needed
    if (selectedEquipment.value) {
      const id = selectedEquipment.value._id || selectedEquipment.value.id
      await equipmentStore.updateEquipment(id, {
        status: 'maintenance',
        etat: 'maintenance', // For MongoDB compatibility
        lastMaintenance: new Date().toISOString(),
        derniereMaintenance: new Date().toISOString() // For MongoDB compatibility
      })
    }
    
    // Refresh equipment data
    await equipmentStore.fetchEquipments()
    
    showNotification('Succès', 'Maintenance planifiée avec succès')
  } catch (error) {
    console.error('Error scheduling maintenance:', error)
    showNotification('Erreur', 'Impossible de planifier la maintenance', 'error')
  } finally {
    isUpdating.value = false // Reset updating state
  }
}

function editEquipment(equipment) {
  selectedEquipment.value = equipment
  showEditModal.value = true
}

function scheduleMaintenance(equipment) {
  selectedEquipment.value = equipment
  showMaintenanceModal.value = true
}

function viewHistory(equipmentId) {
  router.push(`/equipment/${equipmentId}/history`)
}

// Add this import at the top of your script section
import { useMaintenanceStore } from '@/stores/maintenance'

// Add this near your other store declarations
const maintenanceStore = useMaintenanceStore()

watch([search, department, status], () => {
  currentPage.value = 1
})

// Add this to your onMounted function
onMounted(async () => {
  if (equipments.value.length === 0) {
    await equipmentStore.fetchEquipments()
  }
  
  // Fetch technicians data
  try {
    await maintenanceStore.fetchTechnicians()
  } catch (error) {
    console.error('Error fetching technicians:', error)
    showNotification('Erreur', 'Impossible de récupérer les techniciens', 'error')
  }
})

// Update your exportData function's technician name formatting
function exportData() {
  try {
    // Préparer les données pour l'export
    const exportData = equipments.value.map(eq => {
      // Formater la date de dernière maintenance de manière sécurisée
      let formattedDate = 'Non disponible'
      try {
        if (eq.lastMaintenance || eq.derniereMaintenance) {
          formattedDate = format(
            new Date(eq.lastMaintenance || eq.derniereMaintenance), 
            'dd/MM/yyyy', 
            { locale: fr }
          )
        }
      } catch (error) {
        console.error('Erreur de formatage de date:', error)
        formattedDate = 'Date invalide'
      }

      // Get next check date
      let nextCheckDate = 'Non disponible'
      try {
        if (eq.nextCheck || eq.prochainControle) {
          nextCheckDate = format(
            new Date(eq.nextCheck || eq.prochainControle), 
            'dd/MM/yyyy', 
            { locale: fr }
          )
        }
      } catch (error) {
        console.error('Erreur de formatage de date:', error)
        nextCheckDate = 'Date invalide'
      }

      // Format technician name using the fetched technicians data
      let technicianName = 'Non assigné'
      if (eq.technicien_id || eq.technicienID) {
        const techId = eq.technicien_id || eq.technicienID
        const technician = maintenanceStore.technicians.find(t => t._id === techId)
        
        if (technician) {
          if (technician.utilisateur) {
            technicianName = `${technician.utilisateur.nom || ''} ${technician.utilisateur.prenom || ''}`.trim()
          } else if (technician.nom || technician.prenom) {
            technicianName = `${technician.nom || ''} ${technician.prenom || ''}`.trim()
          }
        }
      }
      
      // If we still have an empty string, set to default
      if (!technicianName.trim()) {
        technicianName = 'Non assigné'
      }

      return {
        'Nom': eq.name || eq.type || '',
        'Numéro de série': eq.serialNumber || eq.numero_serie || '',
        'Service': departments.find(d => d.id === (eq.department || eq.service))?.name || eq.department || eq.service || '',
        'Localisation': eq.chambre?.numero || eq.location || '',
        'Statut': statusLabels[eq.status || eq.etat] || eq.status || eq.etat || '',
        'Dernière maintenance': formattedDate,
        'Prochain contrôle': nextCheckDate,
        'Technicien': technicianName
      }
    })

    // Créer un workbook Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Équipements')

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 35 }, // Nom
      { wch: 30 }, // Modèle
      { wch: 25 }, // Numéro de série
      { wch: 20 }, // Service
      { wch: 25 }, // Localisation
      { wch: 20 }, // Statut
      { wch: 18 }, // Disponibilité
      { wch: 15 }, // MTBF
      { wch: 25 }, // Dernière maintenance
      { wch: 18 }  // Alertes actives
    ]
    worksheet['!cols'] = columnWidths

    // Ajouter des styles pour l'en-tête
    const headerStyle = {
      font: { 
        bold: true,
        color: { rgb: "FFFFFF" }
      },
      fill: { 
        fgColor: { rgb: "4F46E5" }
      },
      alignment: { 
        horizontal: "center",
        vertical: "center"
      },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    }

    // Appliquer les styles à l'en-tête
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C })
      worksheet[address].s = headerStyle
    }

    // Générer le nom du fichier avec la date
    const date = format(new Date(), 'yyyy-MM-dd-HH-mm', { locale: fr })
    const fileName = `equipements_${date}.xlsx`

    // Déclencher le téléchargement
    XLSX.writeFile(workbook, fileName)

    // Afficher une notification de succès
    showNotification(
      'Export réussi',
      `${equipments.value.length} équipements ont été exportés dans "${fileName}"`,
      'success'
    )
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    showNotification(
      'Échec de l\'export',
      'Une erreur est survenue lors de l\'export des équipements. Veuillez réessayer.',
      'error'
    )
  }
}

// Fonction de notification améliorée
const notification = ref(null)
let notificationTimeout = null

function showNotification(title, message, type = 'success') {
  // Nettoyer le timeout précédent si existe
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }

  notification.value = {
    show: true,
    title,
    message,
    type
  }

  // Définir un nouveau timeout
  notificationTimeout = setTimeout(() => {
    notification.value = null
  }, 5000) // Augmenté à 5 secondes pour une meilleure lisibilité
}

// Nettoyer le timeout lors du démontage du composant
onUnmounted(() => {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }
})

// Chargement initial des données
onMounted(async () => {
  if (equipments.value.length === 0) {
    await equipmentStore.fetchEquipments()
  }
})




</script>

<style scoped>
.equipment-card {
  @apply transition-transform duration-200 hover:transform hover:scale-105;
}

.btn-icon {
  @apply p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700;
}

.btn-ghost {
  @apply text-gray-500 hover:text-gray-700 dark:text-gray-400 
         dark:hover:text-gray-200;
}
</style>