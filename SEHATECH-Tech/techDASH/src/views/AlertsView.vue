<template>
  <div class="container mx-auto px-4 py-6">

    <!-- En-tête avec badge de notifications -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Centre d'alertes
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestion et suivi des alertes en temps réel
        </p>
      </div>
      
      <!-- Badge de notifications non lues -->
      <div class="relative">
        <button 
          class="btn btn-outline flex items-center"
          @click="showNotificationsModal = true"
        >
          <Bell class="w-5 h-5 mr-2" />
          Notifications
          <span 
            v-if="notificationCount > 0"
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {{ notificationCount }}
          </span>
        </button>
      </div>
    </div>

    

    <!-- Filtres et actions -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div class="flex flex-wrap gap-4 items-center justify-between">
        <div class="flex flex-wrap gap-4">
          <select v-model="selectedSeverity" class="form-select w-40">
            <option value="all">Toutes sévérités</option>
            <option value="critical">Critiques</option>
            <option value="warning">Avertissements</option>
            <option value="info">Informations</option>
          </select>
          <select v-model="selectedStatus" class="form-select w-40">
            <option value="all">Tous statuts</option>
            <option value="active">Actives</option>
            <option value="acknowledged">Reconnues</option>
            <option value="resolved">Résolues</option>
          </select>
          <!-- Modification du filtre des types pour inclure les types de maintenance -->
          <select v-model="selectedType" class="form-select w-48">
            <option value="all">Tous types</option>
            <option value="equipment">Équipements</option>
            <option value="environment">Environnement</option>
            <option value="maintenance_planifiee">Maintenance planifiée</option>
          </select>
          <div class="relative">
            <input
              v-model="search"
              type="text"
              class="form-input pl-10"
              placeholder="Rechercher..."
            />
            <SearchIcon class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            class="btn btn-outline"
            @click="exportAlerts"
          >
            <FileDownIcon class="w-4 h-4 mr-2" />
            Exporter
          </button>
          <button 
            class="btn btn-primary"
            @click="acknowledgeAllAlerts"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Tout reconnaître
          </button>
        </div>
      </div>
    </div>

    <!-- Timeline des alertes -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          Historique des alertes
        </h2>
      </div>
      
      <div class="flow-root">
        <ul class="p-6 space-y-6">
          <li 
            v-for="alert in filteredAlerts" 
            :key="alert.id"
            class="relative flex gap-6"
          >
            <!-- Indicateur de sévérité -->
            <div 
              class="flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-800"
              :class="getSeverityClass(alert.severity)"
            >
              <component 
                :is="getAlertIcon(alert.type)"
                class="h-4 w-4 text-white"
              />
            </div>

            <!-- Contenu de l'alerte -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ alert.title }}
                  </h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ alert.message }}
                  </p>
                  <!-- Modification de l'affichage des alertes pour les maintenances -->
                  <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{{ formatDate(alert.date) }}</span>
                    <span>·</span>
                    <span class="flex items-center">
                      <component 
                        :is="getTypeIcon(alert.type)"
                        class="w-4 h-4 mr-1"
                      />
                      {{ typeLabels[alert.type] || alert.type }}
                    </span>
                    <span v-if="alert.type.includes('maintenance') && alert.equipment">·</span>
                    <span 
                      v-if="alert.equipment"
                      class="flex items-center text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                      @click="viewEquipment(alert.equipment.id)"
                    >
                      <Monitor class="w-4 h-4 mr-1" />
                      {{ alert.equipment.name }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span 
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getStatusBadgeClass(alert.status)"
                  >
                    {{ statusLabels[alert.status] }}
                  </span>
                  <div class="flex items-center">
                   
                    <button 
                      v-if="alert.status !== 'Terminée'"
                      class="btn-icon text-gray-400 hover:text-gray-500"
                      @click="resolveAlert(alert)"
                      title="Résoudre"
                    >
                      <CheckCircle class="w-4 h-4" />
                    </button>
                    <button 
                      class="btn-icon text-gray-400 hover:text-gray-500"
                      @click="showAlertDetails(alert)"
                      title="Détails"
                    >
                      <Info class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- État vide -->
      <div 
        v-if="filteredAlerts.length === 0"
        class="p-12 text-center"
      >
        <Bell class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Aucune alerte
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Aucune alerte ne correspond à vos critères de recherche
        </p>
      </div>
    </div>

    <!-- Modal de détails -->
    <Modal
      v-if="showDetailsModal"
      :title="selectedAlert?.title"
      @close="closeDetailsModal"
    >
      <div class="space-y-4">
        <div>
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Détails de l'alerte
          </h4>
          <div class="mt-2 space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">ID</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ selectedAlert?.id }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Date</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatDate(selectedAlert?.date) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Type</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ selectedAlert?.type }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Sévérité</span>
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getSeverityBadgeClass(selectedAlert?.severity)"
              >
                {{ severityLabels[selectedAlert?.severity] }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Statut</span>
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getStatusBadgeClass(selectedAlert?.status)"
              >
                {{ statusLabels[selectedAlert?.status] }}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Message
          </h4>
          <p class="mt-2 text-sm text-gray-900 dark:text-white">
            {{ selectedAlert?.message }}
          </p>
        </div>

        <div v-if="selectedAlert?.equipment">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Équipement concerné
          </h4>
          <div class="mt-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ selectedAlert.equipment.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ selectedAlert.equipment.serialNumber }}
                </p>
              </div>
              <button 
                class="btn btn-outline"
                @click="viewEquipment(selectedAlert.equipment.id)"
              >
                <Eye class="w-4 h-4 mr-2" />
                Voir
              </button>
            </div>
          </div>
        </div>

        <div v-if="selectedAlert?.history?.length">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Historique
          </h4>
          <div class="mt-2 space-y-2">
            <div 
              v-for="(event, index) in selectedAlert.history"
              :key="index"
              class="flex items-start space-x-3 text-sm"
            >
              <div class="flex-shrink-0">
                <component 
                  :is="getEventIcon(event.type)"
                  class="w-5 h-5"
                  :class="getEventIconColor(event.type)"
                />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ event.action }}
                </p>
                <p class="text-gray-500 dark:text-gray-400">
                  {{ formatDate(event.date) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #actions>
        <div class="flex justify-end space-x-3">
          <button 
            class="btn btn-outline"
            @click="closeDetailsModal"
          >
            Fermer
          </button>
          <button 
            v-if="selectedAlert?.status === 'active'"
            class="btn btn-primary"
            @click="acknowledgeFromModal"
          >
            Reconnaître
          </button>
          <button 
            v-if="selectedAlert?.status !== 'resolved'"
            class="btn btn-success"
            @click="resolveFromModal"
          >
            Résoudre
          </button>
        </div>
      </template>
    </Modal>

    <!-- Notification -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
    <div
    v-if="notification && notification.show"
    class="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 
           rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5"
  >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <component 
                :is="notification.type === 'success' ? CheckCircle : XCircle"
                class="h-6 w-6"
                :class="notification.type === 'success' ? 'text-green-400' : 'text-red-400'"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ notification.title }}
              </p>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ notification.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 
                       hover:text-gray-500 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-primary-500"
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

    <!-- Modal de notifications -->
    <Modal
      v-if="showNotificationsModal"
      title="Notifications"
      @close="showNotificationsModal = false"
    >
      <div class="space-y-4">
        <div v-if="notificationsStore.loading" class="text-center py-4">
          <p class="text-gray-500 dark:text-gray-400">Chargement des notifications...</p>
        </div>
        
        <div v-else-if="notificationsStore.notifications.length === 0" class="text-center py-4">
          <Bell class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucune notification
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vous n'avez pas de notifications non lues
          </p>
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="notification in notificationsStore.notifications" 
            :key="notification._id"
            class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ notification.type === 'rappel_maintenance' ? 'Rappel de maintenance' : notification.type === 'maintenance_planifiee' ? 'Planification une maintenance' : notification.type }}
                </p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ notification.contenu }}
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {{ formatDate(notification.dateEnvoi) }}
                </p>
                <!-- Ajout des informations supplémentaires pour les maintenances -->
                <div v-if="notification.donnees_supplementaires && notification.donnees_supplementaires.equipement_nom" 
                     class="mt-1 flex items-center text-xs text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                     @click="viewEquipment(notification.donnees_supplementaires.equipement_id)">
                  <Monitor class="w-3 h-3 mr-1" />
                  {{ notification.donnees_supplementaires.equipement_nom }}
                </div>
              </div>
              <button 
                class="btn-icon text-gray-400 hover:text-gray-500"
                @click="markNotificationAsRead(notification._id)"
                title="Marquer comme lu"
              >
                <Check class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <template #actions>
        <div class="flex justify-end space-x-3">
          <button 
            class="btn btn-outline"
            @click="showNotificationsModal = false"
          >
            Fermer
          </button>
          <button 
            v-if="notificationCount > 0"
            class="btn btn-primary"
            @click="markAllNotificationsAsRead"
          >
            Tout marquer comme lu
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  SearchIcon,
  FileDownIcon,
  Check,
  Info,
  Eye,
  Monitor,
  Wrench,
  Shield,
  Settings,
  X,
  Thermometer,
  XCircle
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import Modal from '@/components/common/Modal.vue'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useNotificationsStore } from '@/stores/notifications' // Import the notifications store


const router = useRouter()

const notificationsStore = useNotificationsStore() // Use the notifications store

// Add a computed property for notification count
const notificationCount = computed(() => {
  return notificationsStore.unreadCount || 0
})

// États
const selectedSeverity = ref('all')
const selectedStatus = ref('all')
const selectedType = ref('all')
const search = ref('')
const showDetailsModal = ref(false)
const selectedAlert = ref(null)
const showNotificationsModal = ref(false) // Add this for notifications modal
const previousNotificationCount = ref(0)
const audioElement = ref(null)
// Labels
const severityLabels = {
  critical: 'Critique',
  warning: 'Avertissement',
  info: 'Information'
}

const statusLabels = {
  active: 'Planifiée',
  acknowledged: 'En_cours',
  resolved: 'Résolue'
}





// Ajout du store maintenance
const maintenanceStore = useMaintenanceStore()

// Ajout de types d'alertes spécifiques à la maintenance
const typeLabels = {
  equipment: 'Équipement',
  environment: 'Environnement',
  security: 'Sécurité',
  system: 'Système',
  maintenance_planifiee: 'Maintenance planifiée', // Nouveau type
  rappel_maintenance: 'Rappel de maintenance'     // Nouveau type
}

// Données simulées
const alerts = ref([
  {
    id: 1,
    title: 'Défaut détecteur',
    message: 'Défaut détecté sur le détecteur du Scanner IRM',
    type: 'equipment',
    severity: 'critical',
    status: 'active',
    date: '2024-02-15T10:30:00',
    equipment: {
      id: 1,
      name: 'Scanner IRM',
      serialNumber: 'IRM-2023-001'
    },
    history: [
      {
        type: 'creation',
        action: 'Alerte créée',
        date: '2024-02-15T10:30:00'
      }
    ]
  },
  {
    id: 2,
    title: 'Température élevée',
    message: 'Température anormalement élevée dans la salle d\'opération',
    type: 'environment',
    severity: 'warning',
    status: 'acknowledged',
    date: '2024-02-15T09:15:00',
    history: [
      {
        type: 'creation',
        action: 'Alerte créée',
        date: '2024-02-15T09:15:00'
      },
      {
        type: 'acknowledgment',
        action: 'Alerte reconnue par John Doe',
        date: '2024-02-15T09:20:00'
      }
    ]
  },
  // ... autres alertes
])

// Computed properties
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const matchesSeverity = selectedSeverity.value === 'all' || alert.severity === selectedSeverity.value
    const matchesStatus = selectedStatus.value === 'all' || alert.status === selectedStatus.value
    const matchesType = selectedType.value === 'all' || alert.type === selectedType.value
    const matchesSearch = search.value === '' || 
      alert.title.toLowerCase().includes(search.value.toLowerCase()) ||
      alert.message.toLowerCase().includes(search.value.toLowerCase()) ||
      alert.equipment?.name.toLowerCase().includes(search.value.toLowerCase())
    return matchesSeverity && matchesStatus && matchesType && matchesSearch
  })
})

const criticalCount = computed(() => 
  alerts.value.filter(a => a.severity === 'critical' && a.status === 'active').length
)

const activeCount = computed(() => 
  alerts.value.filter(a => a.status === 'active').length
)

const avgResolutionTime = computed(() => {
  const resolvedAlerts = alerts.value.filter(a => a.status === 'resolved')
  if (resolvedAlerts.length === 0) return 0
  // Calcul simulé
  return Math.round(45 + Math.random() * 30)
})

const resolutionRate = computed(() => {
  const resolved = alerts.value.filter(a => a.status === 'resolved').length
  return Math.round((resolved / alerts.value.length) * 100) || 0
})

// Tendances simulées
const criticalTrend = 'down'
const criticalChange = 15
const activeTrend = 'down'
const activeChange = 8

// Méthodes
function formatDate(date) {
  if (!date) return 'Non disponible'
  try {
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })
  } catch (error) {
    return 'Date invalide'
  }
}

function getSeverityClass(severity) {
  return {
    critical: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[severity]
}

function getSeverityBadgeClass(severity) {
  return {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
  }[severity]
}

function getStatusBadgeClass(status) {
  return {
    active: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    acknowledged: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  }[status]
}

function getAlertIcon(type) {
  return {
    equipment: Wrench,
    environment: Thermometer,
    security: Shield,
    system: Settings
  }[type] || AlertTriangle
}

// Modification de la fonction getTypeIcon pour inclure les icônes de maintenance
function getTypeIcon(type) {
  const icons = {
    equipment: Monitor,
    environment: Thermometer,
    security: Shield,
    system: Settings,
    maintenance_planifiee: Wrench,  // Icône pour maintenance planifiée
    rappel_maintenance: Clock       // Icône pour rappel de maintenance
  }
  return icons[type] || Settings
}

function getEventIcon(type) {
  return {
    creation: AlertTriangle,
    acknowledgment: Check,
    resolution: CheckCircle
  }[type]
}

function getEventIconColor(type) {
  return {
    creation: 'text-red-500',
    acknowledgment: 'text-yellow-500',
    resolution: 'text-green-500'
  }[type]
}

function viewEquipment(id) {
  router.push(`/equipment/${id}`)
}

function acknowledgeAlert(alert) {
  alert.status = 'acknowledged'
  alert.history.push({
    type: 'acknowledgment',
    action: 'Alerte reconnue',
    date: new Date().toISOString()
  })
}

function resolveAlert(alert) {
  alert.status = 'Terminée'
  alert.history.push({
    type: 'resolution',
    action: 'Alerte résolue',
    date: new Date().toISOString()
  })
}

function acknowledgeAllAlerts() {
  alerts.value.forEach(alert => {
    if (alert.status === 'active') {
      acknowledgeAlert(alert)
    }
  })
}

function showAlertDetails(alert) {
  selectedAlert.value = alert
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedAlert.value = null
}

function acknowledgeFromModal() {
  if (selectedAlert.value) {
    acknowledgeAlert(selectedAlert.value)
    closeDetailsModal()
  }
}

function resolveFromModal() {
  if (selectedAlert.value) {
    resolveAlert(selectedAlert.value)
    closeDetailsModal()
  }
}

async function exportAlerts() {
  try {
    // Préparation des données pour l'export
    const dataToExport = filteredAlerts.value.map(alert => ({
      ID: alert.id,
      Titre: alert.title,
      Message: alert.message,
      Type: getAlertTypeLabel(alert.type),
      Sévérité: getAlertSeverityLabel(alert.severity),
      Statut: getAlertStatusLabel(alert.status),
      'Date de création': format(new Date(alert.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
      'Équipement concerné': alert.equipment?.name || 'N/A',
      'Service': alert.department || 'N/A'
    }))

    // Conversion en CSV
    const csv = Papa.unparse(dataToExport, {
      delimiter: ';',
      header: true
    })

    // Ajout du BOM pour Excel
    const csvData = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    
    // Génération du nom de fichier
    const fileName = `alertes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    
    // Téléchargement du fichier
    saveAs(csvData, fileName)

    // Notification de succès
    showNotification(
      'Export réussi',
      'Le fichier des alertes a été téléchargé avec succès',
      'success'
    )
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    showNotification(
      'Erreur d\'export',
      'Une erreur est survenue lors de l\'export des alertes',
      'error'
    )
  }
}

// Fonction pour charger les alertes de maintenance
async function loadMaintenanceAlerts() {
  try {
    // Récupérer les maintenances planifiées
    const maintenances = await maintenanceStore.fetchMaintenances()
    
    // Convertir les maintenances en alertes
    const maintenanceAlerts = maintenances.map(maintenance => {
      return {
        id: maintenance._id,
        title: `Maintenance ${maintenance.type}`,
        message: maintenance.notes || `Maintenance planifiée pour l'équipement ${maintenance.ressource?.type || 'inconnu'}`,
        date: maintenance.date_scheduled,
        type: 'maintenance_planifiee',
        severity: maintenance.status === 'En_cours' ? 'warning' : 'info',
        status: mapMaintenanceStatusToAlertStatus(maintenance.status),
        equipment: maintenance.ressource ? {
          id: maintenance.ressource._id,
          name: maintenance.ressource.type || 'Équipement',
          serialNumber: maintenance.ressource.numero_serie || 'N/A'
        } : null,
        history: [
          {
            type: 'create',
            action: 'Maintenance créée',
            date: maintenance.created_at
          },
          ...(maintenance.updated_at !== maintenance.created_at ? [{
            type: 'update',
            action: 'Maintenance mise à jour',
            date: maintenance.updated_at
          }] : [])
        ]
      }
    })
    
    // Ajouter les alertes de maintenance à la liste des alertes
    // Filtrer d'abord les alertes existantes pour éviter les doublons
    alerts.value = [...alerts.value.filter(a => !a.id.toString().includes('maintenance')), ...maintenanceAlerts]
    
    // Récupérer le nombre de notifications non lues et les notifications
    await notificationsStore.fetchUnreadCount()
    await notificationsStore.fetchUnreadNotifications()
  } catch (error) {
    console.error('Erreur lors du chargement des alertes de maintenance:', error)
  }
}

function checkForNewNotifications() {
  const currentCount = notificationsStore.unreadCount || 0
  
  if (currentCount > previousNotificationCount.value && previousNotificationCount.value !== 0) {
    const newNotificationsCount = currentCount - previousNotificationCount.value
    
    // Update notification object directly
    notification.value = {
      show: true,
      title: 'Nouvelle notification',
      message: `Vous avez ${newNotificationsCount} nouvelle${newNotificationsCount > 1 ? 's' : ''} notification${newNotificationsCount > 1 ? 's' : ''}`,
      type: 'info'
    }
    
    // Clear any existing timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
    }
    
    // Set new timeout
    notificationTimeout = setTimeout(() => {
      notification.value = { show: false }
    }, 10000) // 10 seconds duration
  }
  
  // Update the previous count
  previousNotificationCount.value = currentCount
}

function showNotificationWithDuration(title, message, type = 'success', duration = 5000) {
  // Clear any existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }

  // Set notification data
  notification.value = {
    show: true,
    title,
    message,
    type
  }

  // Set timeout to hide notification
  notificationTimeout = setTimeout(() => {
    notification.value = { show: false }
  }, duration)
}

// Fonction pour mapper les statuts de maintenance aux statuts d'alerte
function mapMaintenanceStatusToAlertStatus(maintenanceStatus) {
  const statusMap = {
    'Planifiée': 'active',
    'En_cours': 'acknowledged',
    'Terminée': 'resolved'
  }
  return statusMap[maintenanceStatus] || 'active'
}

// Fonctions utilitaires pour les labels
function getAlertTypeLabel(type) {
  return {
    equipment: 'Équipement',
    environment: 'Environnement',
    security: 'Sécurité',
    system: 'Système'
  }[type] || type
}

function getAlertSeverityLabel(severity) {
  return {
    critical: 'Critique',
    warning: 'Avertissement',
    info: 'Information'
  }[severity] || severity
}

function getAlertStatusLabel(status) {
  return {
    active: 'Active',
    acknowledged: 'Reconnue',
    resolved: 'Terminée'
  }[status] || status
}

// Fonction pour marquer toutes les notifications comme lues
async function markAllNotificationsAsRead() {
  try {
    const response = await notificationsStore.markAllAsRead()
    if (response.success) {
      // Rafraîchir le compteur de notifications
      await notificationsStore.fetchUnreadCount()
      
      // Afficher une notification de succès
      showNotification(
        'Notifications traitées',
        `${response.count} notification(s) marquée(s) comme lue(s)`,
        'success'
      )
      // Fermer le modal des notifications si ouvert
      showNotificationsModal.value = false
    }
  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error)
    showNotification(
      'Erreur',
      'Impossible de marquer les notifications comme lues',
      'error'
    )
  }
}

function showNotification(title, message, type = 'success') {
  showNotificationWithDuration(title, message, type, 5000)
}

// Fonction pour marquer une notification spécifique comme lue
async function markNotificationAsRead(notificationId) {
  try {
    await notificationsStore.markAsRead(notificationId)
    // Rafraîchir les notifications
    await notificationsStore.fetchUnreadNotifications()
    await notificationsStore.fetchUnreadCount()
    
    // Si plus de notifications, fermer le modal
    if (notificationsStore.notifications.length === 0) {
      showNotificationsModal.value = false
    }
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error)
    showNotification(
      'Erreur',
      'Impossible de marquer la notification comme lue',
      'error'
    )
  }
}

// Système de notification
const notification = ref(null)
let notificationTimeout = null
let notificationInterval = null


onMounted(() => {
  loadMaintenanceAlerts()

  previousNotificationCount.value = notificationsStore.unreadCount || 0
  // Configurer un intervalle pour vérifier les nouvelles notifications
  notificationInterval = setInterval(() => {
    notificationsStore.fetchUnreadCount().then(() => {
      checkForNewNotifications()
    })
  }, 60000) // Vérifier toutes les minutes
})

// Single onUnmounted hook to clean up all resources
onUnmounted(() => {
  // Clear notification timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
    notificationTimeout = null
  }
  
  // Clear notification interval
  if (notificationInterval) {
    clearInterval(notificationInterval)
    notificationInterval = null
  }
})

</script>

<style scoped>
.btn-icon {
  @apply p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50
         transition-colors duration-200 relative;
}
</style>
