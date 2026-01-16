<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gérez vos notifications et préférences
        </p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="markAllAsRead"
          class="btn btn-secondary"
          :disabled="!unreadNotifications.length"
        >
          <Check class="w-4 h-4 mr-2" />
          Tout marquer comme lu
        </button>
      </div>
    </header>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Notifications non lues"
        :value="stats.unreadCount"
        icon="Bell"
        trend="up"
        :percentage="12"
      />
      <StatCard
        title="Alertes importantes"
        :value="stats.importantCount"
        icon="AlertTriangle"
        trend="up"
        :percentage="8"
      />
      <StatCard
        title="Notifications aujourd'hui"
        :value="stats.todayCount"
        icon="Calendar"
        trend="up"
        :percentage="15"
      />
    </div>

    <!-- Filtres -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        <div class="flex-1 min-w-0">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Rechercher dans les notifications..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                     focus:ring-primary-500 focus:border-primary-500
                     dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <select
            v-model="filterType"
            class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-lg
                   focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                   dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tous les types</option>
            <option value="alert">Alertes</option>
            <option value="info">Informations</option>
            <option value="success">Succès</option>
            <option value="warning">Avertissements</option>
          </select>
          <select
            v-model="filterStatus"
            class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-lg
                   focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                   dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="unread">Non lues</option>
            <option value="read">Lues</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Liste des notifications -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'bg-primary-50 dark:bg-primary-900/10': !notification.read }"
        >
          <div class="flex items-start space-x-4">
            <!-- Icône -->
            <div 
              class="flex-shrink-0 rounded-full p-2"
              :class="notificationTypeClasses[notification.type]"
            >
              <component 
                :is="notificationTypeIcons[notification.type]"
                class="w-5 h-5"
              />
            </div>

            <!-- Contenu -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p 
                  class="text-sm font-medium text-gray-900 dark:text-white"
                  :class="{ 'font-semibold': !notification.read }"
                >
                  {{ notification.title }}
                </p>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(notification.date) }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ notification.message }}
              </p>
              <div class="mt-2 flex items-center space-x-4">
                <button
                  v-if="!notification.read"
                  @click="markAsRead(notification.id)"
                  class="text-sm text-primary-600 hover:text-primary-700 dark:hover:text-primary-400"
                >
                  Marquer comme lu
                </button>
                <button
                  v-if="notification.actionLabel"
                  @click="handleAction(notification)"
                  class="text-sm text-primary-600 hover:text-primary-700 dark:hover:text-primary-400"
                >
                  {{ notification.actionLabel }}
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex-shrink-0">
              <button
                @click="deleteNotification(notification.id)"
                class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Bell, AlertTriangle, Calendar, Search, Check, 
  Trash2, Info, AlertCircle, CheckCircle 
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// État local
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')

// Classes et icônes par type de notification
const notificationTypeClasses = {
  alert: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400'
}

const notificationTypeIcons = {
  alert: AlertCircle,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle
}

// Statistiques
const stats = computed(() => notificationStore.stats)

// Notifications non lues
const unreadNotifications = computed(() => 
  notificationStore.notifications.filter(n => !n.read)
)

// Filtrage des notifications
const filteredNotifications = computed(() => {
  let notifications = notificationStore.notifications

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    notifications = notifications.filter(notification => 
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query)
    )
  }

  if (filterType.value) {
    notifications = notifications.filter(notification => 
      notification.type === filterType.value
    )
  }

  if (filterStatus.value) {
    const isUnread = filterStatus.value === 'unread'
    notifications = notifications.filter(notification => 
      isUnread ? !notification.read : notification.read
    )
  }

  return notifications
})

// Formatage
const formatDate = (date) => {
  return format(new Date(date), 'PPP à HH:mm', { locale: fr })
}

// Actions
const markAsRead = async (notificationId) => {
  try {
    await notificationStore.markAsRead(notificationId)
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await notificationStore.markAllAsRead()
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error)
  }
}

const deleteNotification = async (notificationId) => {
  try {
    await notificationStore.deleteNotification(notificationId)
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error)
  }
}

const handleAction = (notification) => {
  // Gérer l'action spécifique de la notification
  if (notification.action) {
    notification.action()
  }
}
</script> 