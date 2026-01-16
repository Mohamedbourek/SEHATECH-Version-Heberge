<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Alertes administratives
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gérez les alertes et notifications du système
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Notification Badge -->
        <div class="relative">
          <!-- In the template section, update the button and panel classes -->
          <!-- Remove the HTML comment in the template -->
          <button 
            @click="toggleNotificationPanel"
            class="notification-button p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <Bell class="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span v-if="notificationCount > 0" 
                  class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {{ notificationCount > 9 ? '9+' : notificationCount }}
            </span>
          </button>
          
          <!-- Remove the HTML comment here too -->
          <div v-if="showNotificationPanel" 
               class="notification-panel absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden">
            <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 class="font-medium">Notifications</h3>
              <button @click="markAllNotificationsAsRead" 
                      class="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400">
                Tout marquer comme lu
              </button>
            </div>
            <div class="max-h-96 overflow-y-auto">
              <div v-if="unreadNotifications.length === 0" class="p-4 text-center text-gray-500">
                Aucune notification non lue
              </div>
              <div v-else>
                <div v-for="notification in unreadNotifications" 
                     :key="notification._id" 
                     class="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div class="flex items-start">
                    <div class="flex-shrink-0 mr-3">
                      <div class="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                        <Bell class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ notification.contenu }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        {{ formatDate(notification.dateEnvoi) }}
                      </p>
                    </div>
                    <button @click="markNotificationAsRead(notification._id)" 
                            class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Check class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
              <button @click="navigateToAllNotifications" 
                      class="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400">
                Voir toutes les notifications
              </button>
            </div>
          </div>
        </div>
        
        <button
          @click="showCreateAlert = true"
          class="btn btn-primary"
        >
          <BellPlus class="w-4 h-4 mr-2" />
          Nouvelle alerte
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Type -->
        <div>
          <label class="form-label" for="filter-type">Type</label>
          <select
            id="filter-type"
            v-model="filters.type"
            class="form-select"
          >
            <option value="">Tous les types</option>
            <option value="SYSTEM">Système</option>
            <option value="SECURITY">Sécurité</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="GENERAL">Général</option>
          </select>
        </div>

        <!-- Priorité -->
        <div>
          <label class="form-label" for="filter-priority">Priorité</label>
          <select
            id="filter-priority"
            v-model="filters.priority"
            class="form-select"
          >
            <option value="">Toutes les priorités</option>
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>
        </div>

        <!-- Statut -->
        <div>
          <label class="form-label" for="filter-status">Statut</label>
          <select
            id="filter-status"
            v-model="filters.status"
            class="form-select"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expirée</option>
            <option value="DISMISSED">Rejetée</option>
          </select>
        </div>

        <!-- Recherche -->
        <div>
          <label class="form-label" for="search">Recherche</label>
          <div class="relative">
            <input
              id="search"
              v-model="filters.search"
              type="text"
              class="form-input pl-10"
              placeholder="Rechercher..."
            />
            <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des alertes -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- En-tête du tableau -->
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-12 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div class="col-span-3">Titre</div>
            <div class="col-span-2">Type</div>
            <div class="col-span-2">Priorité</div>
            <div class="col-span-2">Date</div>
            <div class="col-span-2">Statut</div>
            <div class="col-span-1">Actions</div>
          </div>
        </div>

        <!-- Corps du tableau -->
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="notification in filteredBilletSalleNotifications"
            :key="notification._id"
            class="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <!-- Titre et description -->
            <div class="col-span-3">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ notification.titre || 'Demande de billet de salle' }}
              </div>
              <div class="text-sm text-gray-500 truncate">
                {{ notification.contenu }}
              </div>
            </div>

            <!-- Type -->
            <div class="col-span-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                Billet de salle
              </span>
            </div>

            <!-- Priorité -->
            <div class="col-span-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getPriorityClass(notification)">
                {{ getPriorityLabel(notification) }}
              </span>
            </div>

            <!-- Date -->
            <div class="col-span-2 text-sm text-gray-500">
              {{ formatDate(notification.dateEnvoi) }}
            </div>

            <!-- Statut -->
            <div class="col-span-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(notification)">
                {{ getStatusLabel(notification) }}
              </span>
            </div>

            <!-- Actions -->
            <div class="col-span-1">
              <div class="flex items-center space-x-2">
                <button
                  @click="viewNotificationDetails(notification)"
                  class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  @click="markNotificationAsRead(notification._id)"
                  class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                >
                  <Check class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AlertFormModal
      v-if="showCreateAlert"
      :alert="selectedAlert"
      @close="closeAlertModal"
      @save="handleSaveAlert"
    />

    <ConfirmationModal
      v-if="showDeleteModal"
      title="Supprimer l'alerte"
      :message="`Êtes-vous sûr de vouloir supprimer l'alerte '${selectedAlert?.title}' ?`"
      type="danger"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BellPlus, Search, Edit2, Trash2, Bell, Check } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import AlertFormModal from '@/components/alerts/AlertFormModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { useAlertStore } from '@/stores/alert'
import { useNotificationStore } from '@/stores/notification'
import { useToast } from '@/composables/useToast'

const alertStore = useAlertStore()
const notificationStore = useNotificationStore()
const toast = useToast()
const router = useRouter()

// États
const showCreateAlert = ref(false)
const showDeleteModal = ref(false)
const selectedAlert = ref(null)
const showNotificationPanel = ref(false)
const notificationCheckInterval = ref(null)
const lastNotificationCount = ref(0)
const filters = ref({
  type: '',
  priority: '',
  status: '',
  search: ''
})

// Classes et labels
const typeClasses = {
  SYSTEM: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  SECURITY: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  MAINTENANCE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  GENERAL: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
}

const typeLabels = {
  SYSTEM: 'Système',
  SECURITY: 'Sécurité',
  MAINTENANCE: 'Maintenance',
  GENERAL: 'Général'
}

const priorityClasses = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
}

const priorityLabels = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique'
}

const statusClasses = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  DISMISSED: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
}

const statusLabels = {
  ACTIVE: 'Active',
  EXPIRED: 'Expirée',
  DISMISSED: 'Rejetée'
}

// Computed
const filteredAlerts = computed(() => {
  let alerts = alertStore.alerts

  if (filters.value.type) {
    alerts = alerts.filter(alert => alert.type === filters.value.type)
  }

  if (filters.value.priority) {
    alerts = alerts.filter(alert => alert.priority === filters.value.priority)
  }

  if (filters.value.status) {
    alerts = alerts.filter(alert => alert.status === filters.value.status)
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    alerts = alerts.filter(alert => 
      alert.title.toLowerCase().includes(search) ||
      alert.description.toLowerCase().includes(search)
    )
  }

  return alerts
})

const notificationCount = computed(() => notificationStore.notificationCount)
const unreadNotifications = computed(() => notificationStore.unreadNotifications)

// Méthodes
const formatDate = (date) => {
  if (!date) return 'Date non disponible';
  
  try {
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr });
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return 'Date invalide';
  }
}

const editAlert = (alert) => {
  selectedAlert.value = alert
  showCreateAlert.value = true
}

const deleteAlert = (alert) => {
  selectedAlert.value = alert
  showDeleteModal.value = true
}

const handleSaveAlert = async (alertData) => {
  try {
    if (alertData.id) {
      await alertStore.updateAlert(alertData)
      toast.success('Alerte mise à jour avec succès')
    } else {
      await alertStore.createAlert(alertData)
      toast.success('Alerte créée avec succès')
    }
    closeAlertModal()
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde de l\'alerte')
    console.error(error)
  }
}

const confirmDelete = async () => {
  try {
    await alertStore.deleteAlert(selectedAlert.value.id)
    toast.success('Alerte supprimée avec succès')
    closeDeleteModal()
  } catch (error) {
    toast.error('Erreur lors de la suppression de l\'alerte')
    console.error(error)
  }
}

const closeAlertModal = () => {
  showCreateAlert.value = false
  selectedAlert.value = null
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedAlert.value = null
}

// Nouvelles méthodes pour les notifications
const toggleNotificationPanel = () => {
  showNotificationPanel.value = !showNotificationPanel.value
}

// Update these methods to handle potential component unmounting
const markNotificationAsRead = async (notificationId) => {
  try {
    if (!notificationStore) return;
    await notificationStore.markAsRead(notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

const markAllNotificationsAsRead = async () => {
  try {
    if (!notificationStore) return;
    await notificationStore.markAllAsRead();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

const checkForNewNotifications = async () => {
  try {
    if (!notificationStore) return;
    
    const previousCount = notificationCount.value;
    await notificationStore.fetchUnreadNotifications();
    
    // Si le nombre de notifications a augmenté, afficher un toast
    if (notificationCount.value > previousCount) {
      const newNotificationsCount = notificationCount.value - previousCount;
      console.log('New notifications:', newNotificationsCount);
      
      // Use a flag to check if component is still mounted
      if (isComponentMounted.value) {
        setTimeout(() => {
          toast.info(`${newNotificationsCount} nouvelle${newNotificationsCount > 1 ? 's' : ''} notification${newNotificationsCount > 1 ? 's' : ''}`);
        }, 300);
      }
    }
    
    lastNotificationCount.value = notificationCount.value;
  } catch (error) {
    console.error('Error checking for new notifications:', error);
  }
}

// After the checkForNewNotifications function and before the isComponentMounted declaration

// Fermer le panneau de notification quand on clique ailleurs
const handleClickOutside = (event) => {
  if (!isComponentMounted.value) return;
  
  const panel = document.querySelector('.notification-panel');
  const button = document.querySelector('.notification-button');
  
  if (showNotificationPanel.value && panel && !panel.contains(event.target) && button && !button.contains(event.target)) {
    showNotificationPanel.value = false;
  }
}

// Add a mounted flag to track component lifecycle
const isComponentMounted = ref(true);

// Update lifecycle hooks
// Add these computed properties and methods to your script section
// Add this after your existing computed properties

// New computed property for filtered billet salle notifications
const filteredBilletSalleNotifications = computed(() => {
  // Get notifications of type demande_billet_salle
  let notifications = notificationStore.notifications.filter(
    notification => notification.type === 'demande_billet_salle'
  );
  
  // Apply additional filters if needed
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    notifications = notifications.filter(notification => 
      (notification.titre || '').toLowerCase().includes(search) ||
      (notification.contenu || '').toLowerCase().includes(search)
    );
  }
  
  if (filters.value.status) {
    notifications = notifications.filter(notification => {
      // Map notification status to alert status format
      const status = notification.statut === 'non_lu' ? 'ACTIVE' : 
                    notification.statut === 'lu' ? 'DISMISSED' : 'EXPIRED';
      return status === filters.value.status;
    });
  }
  
  return notifications;
});

// Helper methods for notification display
const getPriorityClass = (notification) => {
  // Determine priority based on notification data or default to MEDIUM
  const priority = notification.priorite || 'MEDIUM';
  return priorityClasses[priority] || priorityClasses.MEDIUM;
};

const getPriorityLabel = (notification) => {
  const priority = notification.priorite || 'MEDIUM';
  return priorityLabels[priority] || priorityLabels.MEDIUM;
};

const getStatusClass = (notification) => {
  const status = notification.statut === 'non_lu' ? 'ACTIVE' : 
                notification.statut === 'lu' ? 'DISMISSED' : 'EXPIRED';
  return statusClasses[status];
};

const getStatusLabel = (notification) => {
  const status = notification.statut === 'non_lu' ? 'ACTIVE' : 
                notification.statut === 'lu' ? 'DISMISSED' : 'EXPIRED';
  return statusLabels[status];
};

const viewNotificationDetails = (notification) => {
  // Implement viewing notification details
  // This could open a modal or navigate to a details page
  console.log('View notification details:', notification);
  // For now, we'll just mark it as selected
  selectedAlert.value = {
    id: notification._id,
    title: notification.titre || 'Demande de billet de salle',
    description: notification.contenu,
    type: 'MAINTENANCE',
    priority: notification.priorite || 'MEDIUM',
    status: notification.statut === 'non_lu' ? 'ACTIVE' : 'DISMISSED',
    createdAt: notification.dateEnvoi
  };
  showCreateAlert.value = true;
};

// Update the onMounted hook to fetch all notifications
onMounted(async () => {
  isComponentMounted.value = true;
  
  try {
    // Charger les alertes et les notifications
    await Promise.all([
      notificationStore.fetchAllNotifications(), // Change this line to fetch all notifications
      notificationStore.fetchUnreadNotifications()
    ]);
    
    if (isComponentMounted.value) {
      lastNotificationCount.value = notificationCount.value;
      
      // Vérifier les nouvelles notifications toutes les 30 secondes
      notificationCheckInterval.value = setInterval(checkForNewNotifications, 30000);
      
      // Ajouter l'écouteur de clic pour fermer le panneau
      document.addEventListener('click', handleClickOutside);
    }
  } catch (error) {
    console.error('Error in component mount:', error);
  }
});

onUnmounted(() => {
  isComponentMounted.value = false;
  
  // Nettoyer l'intervalle et l'écouteur
  if (notificationCheckInterval.value) {
    clearInterval(notificationCheckInterval.value);
  }
  document.removeEventListener('click', handleClickOutside);
})

// Surveiller les changements de route pour fermer le panneau
watch(() => router.currentRoute.value, () => {
  showNotificationPanel.value = false
})
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200
         flex items-center justify-center;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}

.notification-panel {
  @apply absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden;
}

.notification-button {
  @apply p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600;
}
</style>