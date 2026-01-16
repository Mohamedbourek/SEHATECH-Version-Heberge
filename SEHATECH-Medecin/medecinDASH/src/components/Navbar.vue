<template>
  <div class="sidebar-layout">
    <!-- Sidebar -->
    <nav class="sidebar">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="brand flex items-center">
          <img src="@/assets/images/logo.png" alt="Logo" class="h-8 w-8 mr-2" />
          <span class="brand-title text-xl font-bold text-primary-600 dark:text-primary-400">
            Medecin Dashboard
          </span>
        </div>
      </div>

      <!-- Navigation principale -->
      <div class="sidebar-nav">
        <router-link 
          v-for="item in filteredNavigationItems" 
          :key="item.path"
          :to="item.path"
          :class="['nav-link', { 'active': isCurrentRoute(item.path) }]"
        >
          <component :is="item.icon" class="w-6 h-6" />
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
      </div>

      <!-- Section du bas -->
      <div class="sidebar-footer">
        <!-- Thème -->
        <button @click="toggleTheme" class="theme-button">
          <Sun v-if="isDark" class="w-6 h-6" />
          <Moon v-else class="w-6 h-6" />
          <span class="ml-3">{{ isDark ? 'Mode clair' : 'Mode sombre' }}</span>
        </button>

        <!-- Profil -->
        <div class="relative">
          <button 
            @click="toggleProfileMenu"
            class="profile-button"
          >
            <div class="flex items-center w-full">
              <img 
                :src="authStore.user?.medecin?.photo || userAvatar" 
                alt="Profile"
                class="w-10 h-10 rounded-full object-cover border-2 border-primary-200"
              />
              <div class="profile-info ml-3">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Dr.{{ authStore.user?.nom }} {{ authStore.user?.prenom }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ authStore.user?.role || 'Médecin' }}
                </div>
              </div>
              <ChevronDown class="w-4 h-4 ml-auto text-gray-400" />
            </div>
          </button>

          <!-- Menu profil -->
          <div 
            v-show="showProfileMenu"
            class="profile-dropdown active"
          >
            <div class="py-2">
  <router-link 
    to="/profile" 
                class="menu-item"
                @click="showProfileMenu = false"
              >
                <UserCircle class="w-5 h-5" />
                <span>Mon profil</span>
              </router-link>
              
              <router-link 
                to="/settings" 
                class="menu-item"
                @click="showProfileMenu = false"
              >
                <Settings2 class="w-5 h-5" />
                <span>Paramètres</span>
              </router-link>

              <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
              <button 
                @click="handleLogout" 
                class="menu-item text-red-600 dark:text-red-400 w-full"
              >
                <LogOut class="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Header pour la recherche et les notifications -->
    <header class="top-header">
      <div class="header-content">
        <!-- Recherche -->
        <div class="search-container">
          <div class="relative">
            <input 
              ref="searchInput"
              v-model="searchQuery"
              type="text" 
              placeholder="Rechercher patients, rendez-vous..." 
              class="search-input"
              @focus="handleSearchFocus"
            />
            <div class="search-icon-container">
              <Loader2 v-if="isSearching" class="w-5 h-5 animate-spin text-gray-400" />
              <Search v-else class="w-5 h-5 text-gray-400" />
            </div>

            <!-- Résultats de recherche -->
            <div 
              v-if="showSearchResults && (searchResults.length > 0 || isSearching)" 
              class="search-results"
            >
              <div v-if="isSearching" class="search-message">
                Recherche en cours...
              </div>
              
              <template v-else>
                <div
                  v-for="(result, index) in searchResults"
                  :key="result.id"
                  :class="[
                    'search-result-item',
                    { 'selected': index === selectedResultIndex }
                  ]"
                  @click="handleResultClick(result)"
                  @mouseenter="selectedResultIndex = index"
                >
                  <component :is="result.icon" class="w-5 h-5 text-gray-400" />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ result.title }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ result.subtitle }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="relative">
          <button 
            class="notification-button" 
            @click="toggleNotifications"
            :class="{ 'has-notifications': notificationCount > 0 }"
          >
            <Bell class="w-6 h-6" />
            <div v-if="notificationCount" class="notification-badge">
              {{ notificationCount }}
            </div>
          </button>

          <!-- Dropdown Notifications -->
          <div 
            v-show="showNotifications" 
            class="notifications-dropdown"
          >
            <div class="notifications-header">
              <h3 class="text-lg font-medium">Notifications</h3>
              <button 
                v-if="notifications.length > 0"
                @click="markAllAsRead" 
                class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Tout marquer comme lu
              </button>
            </div>

            <div class="notifications-content">
              <template v-if="notifications.length > 0">
                <div 
                  v-for="notification in notifications" 
                  :key="notification.id"
                  class="notification-item"
                  :class="{ 'unread': !notification.read }"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="notification-icon" :class="notification.type">
                    <component :is="getNotificationIcon(notification.type)" class="w-5 h-5" />
                  </div>
                  <div class="notification-body">
                    <p class="notification-text">{{ notification.message }}</p>
                    <span class="notification-time">{{ notification.time }}</span>
                  </div>
                </div>
              </template>
              <div v-else class="no-notifications">
                Aucune notification
              </div>
            </div>

  
          </div>
        </div>
      </div>
    </header>
    
    <!-- Toast Notifications -->
    <div class="toast-container">
      <div 
        v-for="toast in activeToasts" 
        :key="toast.id"
        class="toast-notification"
        :class="getToastClass(toast.type)"
      >
        <div class="toast-icon">
          <component :is="getNotificationIcon(toast.type)" class="w-5 h-5" />
        </div>
        <div class="toast-content">
          <p class="toast-text">{{ toast.message }}</p>
        </div>
        <button @click="dismissToast(toast.id)" class="toast-close">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template> 

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  ChevronDown, 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings,
  User,
  LogOut,
  Search,
  Loader2,
  UserCircle,
  Settings2,
  AlertCircle,
  MessageSquare,
  Files,
  Building2,
  Stethoscope,
  X
} from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { assets } from '@/utils/assets'
import { useAuthStore } from '@/stores/auth'
import debounce from 'lodash/debounce'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
// État
const isScrolled = ref(false)
const showProfileMenu = ref(false)
const showMobileMenu = ref(false)
const notificationCount = computed(() => notificationStore.unreadCount)
const userAvatar = ref(assets.defaultAvatar)

// État pour la recherche
const searchQuery = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])
const isSearching = ref(false)
const selectedResultIndex = ref(-1)

// État des notifications
// État des notifications
const showNotifications = ref(false)
const notifications = computed(() => notificationStore.notifications)

// Toast notifications
const activeToasts = ref([])
const toastTimeout = 5000 // 5 seconds

// Function to show a toast notification
const showToast = (notification) => {
  const toast = {
    id: Date.now(),
    type: notification.type,
    message: notification.message,
    time: notification.time
  }
  
  activeToasts.value.push(toast)
  
  // Auto-dismiss after timeout
  setTimeout(() => {
    dismissToast(toast.id)
  }, toastTimeout)
}

// Function to dismiss a toast
const dismissToast = (id) => {
  activeToasts.value = activeToasts.value.filter(toast => toast.id !== id)
}

// Handle notification click
const handleNotificationClick = (notification) => {
  // Marquer comme lue via le store
  notificationStore.markAsRead(notification.id)
  
  // Afficher comme toast selon le type de notification
  if (notification.type === 'rappel_operation') {
    showToast(notification)
  }
  else if (notification.type === 'exam') {
    showToast(notification)
  }
  else if (notification.type === 'appointment') {
    showToast(notification)
  }
  
  // Logique supplémentaire selon le type de notification
  if (notification.rawData && notification.rawData.donnees_supplementaires) {
    const data = notification.rawData.donnees_supplementaires
    
    // Rediriger vers la page appropriée selon le type
    if (notification.type === 'rappel_operation' && data.operation_id) {
      router.push(`/chirurgie?operation=${data.operation_id}`)
    }
    else if (notification.type === 'exam' && data.examen_id) {
      router.push(`/medical-records?examen=${data.examen_id}`)
    }
    else if (notification.type === 'appointment' && data.rendez_vous_id) {
      router.push(`/appointments?id=${data.rendez_vous_id}`)
    }
  }
}

// Get toast class based on type
const getToastClass = (type) => {
  switch (type) {
    case 'rappel_operation':
      return 'toast-primary'
    case 'message':
      return 'toast-success'
    case 'alert':
      return 'toast-warning'
    case 'appointment':
      return 'toast-info'
    case 'exam':
      return 'toast-info'
    default:
      return 'toast-info'
  }
}

// Catégories de recherche
const searchCategories = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  RECORDS: 'records'
}

const navigationItems = [
  {
    name: 'Tableau de bord',
    path: '/dashboard',
    icon: Home
  },
  {
    name: 'Patients',
    path: '/patients',
    icon: Users
  },
  {
    name: 'Dossiers médicaux',
    path: '/medical-records',
    icon: FileText
  },
  {
    name: 'Rendez-vous',
    path: '/appointments',
    icon: Calendar
  },
  {
    name: 'Documents',
    path: '/documents',
    icon: Files
  },
  {
    name: 'Chambres',
    path: '/rooms',
    icon: Building2
  }
]

// Ajouter un computed pour les items de navigation filtrés
// Update the computed property for filtered navigation items
const filteredNavigationItems = computed(() => {
const items = [...navigationItems]

// Add surgery item for surgeons (neurochirurgie and traumatologie)
const surgeonSpecialties = ['neurochirurgie', 'traumatologie']
const userSpeciality = authStore.user?.medecin?.specialite?.toLowerCase()
console.log('User Speciality:', userSpeciality) // Debug log

if (userSpeciality && surgeonSpecialties.includes(userSpeciality)) {
items.push({
name: 'Chirurgie',
path: '/chirurgie',
icon: Stethoscope
})
}

return items
})

const route = useRoute()
const { isDark, toggleTheme } = useTheme()

// Gestion du scroll
const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', closeProfileMenu)
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
  if (authStore.user?.role === 'medecin') {
    

    await Promise.all([
      notificationStore.fetchOperationNotifications(),
      notificationStore.fetchExamenNotifications(),
      notificationStore.fetchRendezVousNotifications() 
    ])
    
    //startNotificationPolling()
   
  }
})

let pollingInterval = null
const startNotificationPolling = () => {
  pollingInterval = setInterval(async() => {
    await Promise.all([
      notificationStore.fetchOperationNotifications(),
      notificationStore.fetchExamenNotifications(),
      notificationStore.fetchRendezVousNotifications() 
    ])
  }, 30000*6) 
}

onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', closeProfileMenu)
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})

// Méthodes
const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const isCurrentRoute = (path) => {
  return route.path === path
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const closeProfileMenu = (event) => {
  if (!event.target.closest('.profile-dropdown') && !event.target.closest('button')) {
    showProfileMenu.value = false
  }
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const markAllAsRead = async () => {
 await notificationStore.markAllAsRead()
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'appointment':
      return Calendar
    case 'rappel_operation':
      return Calendar
    case 'message':
      return MessageSquare
    case 'alert':
      return AlertCircle
    case 'exam':
      return FileText
    default:
      return Bell
  }
}

// Recherche simulée (à remplacer par vos appels API réels)
const performSearch = async (query) => {
  if (!query.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 300))

    // Simuler des résultats
    searchResults.value = [
      {
        id: 1,
        type: searchCategories.PATIENTS,
        title: 'Jean Dupont',
        subtitle: 'Patient - 45 ans',
        icon: Users,
        path: '/patients/1'
      },
      {
        id: 2,
        type: searchCategories.APPOINTMENTS,
        title: 'RDV - Marie Martin',
        subtitle: 'Aujourd\'hui à 14:00',
        icon: Calendar,
        path: '/appointments/2'
      },
      {
        id: 3,
        type: searchCategories.RECORDS,
        title: 'Dossier #12345',
        subtitle: 'Dernière mise à jour: hier',
        icon: FileText,
        path: '/medical-records/3'
      }
    ].filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(query.toLowerCase())
    )
  } finally {
    isSearching.value = false
  }
}

// Debounce la recherche pour éviter trop d'appels
const debouncedSearch = debounce(performSearch, 300)

// Observer les changements de la recherche
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

// Gérer la navigation avec les flèches
const handleKeydown = (e) => {
  if (!showSearchResults.value) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedResultIndex.value = Math.min(
        selectedResultIndex.value + 1,
        searchResults.value.length - 1
      )
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedResultIndex.value = Math.max(selectedResultIndex.value - 1, -1)
      break
    case 'Enter':
      e.preventDefault()
      if (selectedResultIndex.value >= 0) {
        handleResultClick(searchResults.value[selectedResultIndex.value])
      }
      break
    case 'Escape':
      e.preventDefault()
      closeSearch()
      break
  }
}

// Fermer la recherche
const closeSearch = () => {
  showSearchResults.value = false
  selectedResultIndex.value = -1
}

// Gérer le clic sur un résultat
const handleResultClick = (result) => {
  router.push(result.path)
  closeSearch()
  searchQuery.value = ''
}

// Gestionnaire de focus
const searchInput = ref(null)
const handleSearchFocus = () => {
  showSearchResults.value = true
}

// Fermer au clic en dehors
const handleClickOutside = (event) => {
  const searchContainer = document.querySelector('.search-container')
  if (searchContainer && !searchContainer.contains(event.target)) {
    closeSearch()
  }

  const notifContainer = document.querySelector('.notifications-dropdown')
  if (notifContainer && !notifContainer.contains(event.target) && 
      !event.target.closest('.notification-button')) {
    showNotifications.value = false
  }
}
</script>

<style scoped>
/* Layout */
.sidebar-layout {
  @apply fixed inset-y-0 left-0 z-50;
}

/* Sidebar */
.sidebar {
  @apply flex flex-col h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800;
}

.sidebar-header {
  @apply p-4 h-20 flex items-center border-b border-gray-200 dark:border-gray-800;
}

.sidebar-nav {
  @apply flex-1 py-6 space-y-2 overflow-y-auto;
}

.sidebar-footer {
  @apply p-4 border-t border-gray-200 dark:border-gray-800 space-y-4;
}

/* Brand */
.brand {
  @apply flex items-center justify-center px-4 py-5;
}

.brand-title {
  @apply text-2xl font-bold text-primary-600 dark:text-primary-400
         tracking-wide;
}

/* Navigation Links */
.nav-link {
  @apply flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 
         dark:hover:bg-gray-800 transition-colors duration-200 space-x-3;
}

.nav-link.active {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
}

.nav-text {
  @apply text-sm font-medium;
}

/* Top Header */
.top-header {
  @apply fixed top-0 left-64 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 
         dark:border-gray-800 z-40;
}

.header-content {
  @apply h-full px-6 flex items-center justify-between;
}

/* Search */
.search-container {
  @apply relative w-96;
}

.search-icon-container {
  @apply absolute right-3 top-1/2 -translate-y-1/2;
}

/* Profile */
.theme-button {
  @apply flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-200 
         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200;
}

.profile-button {
  @apply w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
         transition-colors duration-200;
}

.profile-info {
  @apply flex-1 text-left overflow-hidden;
}

.profile-dropdown {
  @apply absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 
         rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
         transform transition-all duration-200;
}

.menu-item {
  @apply flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 
         hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150;
}

/* Autres styles existants restent inchangés */

/* Search Results */
.search-results {
  @apply absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 
         rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
         max-h-96 overflow-y-auto z-50;
}

.search-message {
  @apply p-4 text-sm text-gray-500 dark:text-gray-400 text-center;
}

.search-result-item {
  @apply flex items-center space-x-3 px-4 py-3 cursor-pointer
         hover:bg-gray-50 dark:hover:bg-gray-700/50
         transition-colors duration-150;
}

.search-result-item.selected {
  @apply bg-gray-50 dark:bg-gray-700/50;
}

/* Améliorer l'input de recherche */
.search-input {
  @apply w-full pl-4 pr-10 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 
         border border-gray-300 dark:border-gray-700
         text-gray-900 dark:text-gray-100
         placeholder-gray-500 dark:placeholder-gray-400
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
         transition-all duration-200;
}

/* Notifications */
.notification-button {
  @apply relative p-2 rounded-lg text-gray-600 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-800
         transition-all duration-200;
}

.notification-button.has-notifications {
  @apply text-primary-600 dark:text-primary-400;
}

.notification-badge {
  @apply absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center
         bg-red-500 text-white text-xs font-medium rounded-full;
}

.notifications-dropdown {
  @apply absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800
         rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
         overflow-hidden z-50;
}

.notifications-header {
  @apply flex items-center justify-between px-4 py-3
         border-b border-gray-200 dark:border-gray-700;
}

.notifications-content {
  @apply max-h-[400px] overflow-y-auto;
}

.notification-item {
  @apply flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50
         border-b border-gray-200 dark:border-gray-700 last:border-0
         transition-colors duration-150;
}

.notification-item.unread {
  @apply bg-primary-50 dark:bg-primary-900/20;
}

.notification-icon {
  @apply flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center;
}

.notification-icon.appointment {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400;
}

.notification-icon.message {
  @apply bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400;
}

.notification-icon.alert {
  @apply bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400;
}

.notification-icon.exam {
  @apply bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400;
}

.notification-body {
  @apply flex-1 min-w-0;
}

.notification-text {
  @apply text-sm text-gray-900 dark:text-white;
}

.notification-time {
  @apply block text-xs text-gray-500 dark:text-gray-400 mt-1;
}

.notifications-footer {
  @apply px-4 py-3 bg-gray-50 dark:bg-gray-700/50
         border-t border-gray-200 dark:border-gray-700
         text-center;
}

.no-notifications {
  @apply py-8 text-center text-gray-500 dark:text-gray-400;
}

/* Toast Notifications */
.toast-container {
  @apply fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md;
}

.toast-notification {
  @apply flex items-center gap-3 p-4 rounded-lg shadow-lg border
         transform transition-all duration-300 animate-slideIn;
}

.toast-primary {
  @apply bg-blue-50 border-blue-200 text-blue-800
         dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300;
}

.toast-success {
  @apply bg-green-50 border-green-200 text-green-800
         dark:bg-green-900/30 dark:border-green-800 dark:text-green-300;
}

.toast-warning {
  @apply bg-yellow-50 border-yellow-200 text-yellow-800
         dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300;
}

.toast-info {
  @apply bg-gray-50 border-gray-200 text-gray-800
         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300;
}

.toast-icon {
  @apply flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center;
}

.toast-content {
  @apply flex-1 min-w-0;
}

.toast-text {
  @apply text-sm font-medium;
}

.toast-close {
  @apply p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10
         transition-colors duration-150;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}
</style>