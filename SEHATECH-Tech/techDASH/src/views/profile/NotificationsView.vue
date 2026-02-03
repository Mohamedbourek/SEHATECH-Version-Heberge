<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-4xl mx-auto">
      <!-- En-tête -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gérez vos notifications et alertes
        </p>
      </div>

      <!-- Filtres -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div class="flex flex-wrap gap-4 items-center justify-between">
          <div class="flex flex-wrap gap-4">
            <select v-model="selectedType" class="form-select w-40">
              <option value="all">Tous types</option>
              <option value="alert">Alertes</option>
              <option value="maintenance">Maintenance</option>
              <option value="system">Système</option>
            </select>
            <select v-model="selectedStatus" class="form-select w-40">
              <option value="all">Tous statuts</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
          </div>
          <button 
            class="btn btn-outline"
            @click="markAllAsRead"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </button>
        </div>
      </div>

      <!-- Liste des notifications -->
      <div class="space-y-4">
        <div 
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
          :class="{ 'border-l-4 border-primary-500': !notification.read }"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-3">
                <div 
                  class="p-2 rounded-lg"
                  :class="getNotificationTypeClass(notification.type)"
                >
                  <component 
                    :is="getNotificationIcon(notification.type)"
                    class="w-5 h-5 text-white"
                  />
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ notification.title }}
                  </h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ notification.message }}
                  </p>
                  <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                    <time :datetime="notification.date">
                      {{ formatDate(notification.date) }}
                    </time>
                    <span v-if="notification.equipment">
                      · {{ notification.equipment.name }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button 
                  v-if="!notification.read"
                  class="btn-icon text-gray-400 hover:text-gray-500"
                  @click="markAsRead(notification)"
                  title="Marquer comme lu"
                >
                  <Check class="w-4 h-4" />
                </button>
                <button 
                  class="btn-icon text-gray-400 hover:text-gray-500"
                  @click="deleteNotification(notification)"
                  title="Supprimer"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- État vide -->
        <div 
          v-if="filteredNotifications.length === 0"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center"
        >
          <Bell class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucune notification
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vous n'avez aucune notification pour le moment.
          </p>
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
  Bell,
  AlertTriangle,
  Wrench,
  Settings,
  Check,
  CheckCircle,
  Trash2
} from 'lucide-vue-next'

const selectedType = ref('all')
const selectedStatus = ref('all')

// Données simulées
const notifications = ref([
  {
    id: 1,
    type: 'alert',
    title: 'Alerte critique',
    message: 'Défaut détecté sur le Scanner IRM',
    date: '2024-02-15T10:30:00',
    read: false,
    equipment: {
      id: 1,
      name: 'Scanner IRM'
    }
  },
  {
    id: 2,
    type: 'maintenance',
    title: 'Maintenance planifiée',
    message: 'Maintenance préventive prévue pour l\'échographe',
    date: '2024-02-15T09:15:00',
    read: true,
    equipment: {
      id: 2,
      name: 'Échographe cardiaque'
    }
  },
  {
    id: 3,
    type: 'system',
    title: 'Mise à jour système',
    message: 'Nouvelle version du système disponible',
    date: '2024-02-14T16:45:00',
    read: false
  }
])

const filteredNotifications = computed(() => {
  return notifications.value.filter(notification => {
    const matchesType = selectedType.value === 'all' || notification.type === selectedType.value
    const matchesStatus = selectedStatus.value === 'all' || 
      (selectedStatus.value === 'unread' && !notification.read) ||
      (selectedStatus.value === 'read' && notification.read)
    return matchesType && matchesStatus
  })
})

function formatDate(date) {
  if (!date) return 'Non disponible'
  try {
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })
  } catch (error) {
    return 'Date invalide'
  }
}

function getNotificationTypeClass(type) {
  const classes = {
    alert: 'bg-red-500',
    maintenance: 'bg-blue-500',
    system: 'bg-purple-500'
  }
  return classes[type] || 'bg-gray-500'
}

function getNotificationIcon(type) {
  const icons = {
    alert: AlertTriangle,
    maintenance: Wrench,
    system: Settings
  }
  return icons[type] || Bell
}

function markAsRead(notification) {
  notification.read = true
}

function markAllAsRead() {
  notifications.value.forEach(notification => {
    notification.read = true
  })
}

function deleteNotification(notification) {
  const index = notifications.value.findIndex(n => n.id === notification.id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
  }
}
</script>

<style scoped>
.btn-icon {
  @apply p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50
         transition-colors duration-200;
}
</style> 