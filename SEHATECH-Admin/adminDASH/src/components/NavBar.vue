<template>
  <!-- Sidebar -->
  <aside class="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
    <!-- Logo et titre -->
    <div class="px-4 py-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <img 
            src="@/assets/logo.svg"
            alt="Logo"
            class="h-8 w-8"
          />
          <span class="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
            Smart Hospital
          </span>
        </div>
        
        <!-- Notification indicator -->
        <div v-if="notificationCount > 0" class="relative">
          <Bell class="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {{ notificationCount > 9 ? '9+' : notificationCount }}
          </span>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-4 overflow-y-auto">
      <ul class="space-y-1">
        <li v-for="item in navigationItems" :key="item.path">
          <router-link
            :to="item.path"
            class="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              route.path === item.path
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-100'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
            ]"
          >
            <div class="relative">
              <component
                v-if="!item.customIcon"
                :is="item.icon"
                class="w-5 h-5 mr-3 transition-colors duration-200"
                :class="route.path === item.path ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'"
              />
              <template v-else>
                <Bell class="w-5 h-5 mr-3 transition-colors duration-200" :class="route.path === item.path ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'" />
                <span 
                  v-if="notificationCount > 0"
                  class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
                >
                  {{ notificationCount > 9 ? '9+' : notificationCount }}
                </span>
              </template>
            </div>
            {{ item.name }}
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Profil utilisateur -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div 
        class="flex items-center p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
        @click="openProfileSettings"
      >
        <!-- Avatar et infos -->
        <div class="flex items-center flex-1">
          <div class="relative w-10 h-10">
            <img
              v-if="user?.avatar"
              :src="user.avatar"
              class="rounded-full w-full h-full object-cover"
              alt="Avatar"
            />
            <div 
              v-else 
              class="w-full h-full rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center"
            >
              <span class="text-primary-600 dark:text-primary-400 text-sm font-medium">
                {{ userInitials }}
              </span>
            </div>
            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-gray-800"></div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ user?.fullName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ user?.role }}
            </p>
          </div>
        </div>

        <!-- Menu actions -->
        <div class="flex items-center gap-2">
          <button
            @click.stop="toggleTheme"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Changer le thème"
          >
            <component :is="isDarkMode ? Sun : Moon" class="w-4 h-4" />
          </button>
          <button
            @click.stop="handleLogout"
            class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Se déconnecter"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Profil -->
    <BaseModal
      v-if="showProfileModal"
      title="Mon profil"
      @close="showProfileModal = false"
    >
      <form @submit.prevent="updateProfile" class="space-y-6">
        
        <!-- Informations personnelles -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label class="form-label" for="nom">Nom</label>
            <input
              id="nom"
              v-model="profileForm.nom"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label" for="prenom">Prénom</label>
            <input
              id="prenom"
              v-model="profileForm.prenom"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              required
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label" for="telephone">Téléphone</label>
            <input
              id="telephone"
              v-model="profileForm.telephone"
              type="tel"
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label" for="role">Rôle</label>
            <input
              id="role"
              v-model="profileForm.role"
              type="text"
              disabled
              class="form-input bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showProfileModal = false"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isUpdating"
          >
            <Loader2 
              v-if="isUpdating"
              class="w-4 h-4 mr-2 animate-spin"
            />
            Enregistrer
          </button>
        </div>
      </form>
    </BaseModal>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Receipt,
  Users,
  FolderOpen,
  Bell,
  LogOut,
  Loader2,
  Sun,
  Moon,
  Scissors
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import BaseModal from '@/components/BaseModal.vue'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { isDarkMode, toggleTheme } = useTheme()
const toast = useToast()

// États
const showProfileModal = ref(false)
const fileInput = ref(null)
const isUpdating = ref(false)
const notificationCheckInterval = ref(null)

// Computed property for notification count
const notificationCount = computed(() => {
  // Check if unreadNotifications exists and has items
  if (notificationStore.unreadNotifications && notificationStore.unreadNotifications.length > 0) {
    console.log('Unread notifications count:', notificationStore.unreadNotifications.length);
    return notificationStore.unreadNotifications.length;
  }
  return 0;
})

// Fetch notifications on component mount
onMounted(async () => {
  try {
    console.log('Fetching notifications...');
    await notificationStore.fetchUnreadNotifications();
    console.log('Fetched notifications:', notificationStore.unreadNotifications);
    
    // Check for new notifications every 30 seconds
    notificationCheckInterval.value = setInterval(async () => {
      await notificationStore.fetchUnreadNotifications();
    }, 30000);
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
})

// Clean up interval on component unmount
onUnmounted(() => {
  if (notificationCheckInterval.value) {
    clearInterval(notificationCheckInterval.value)
  }
})

// Navigation items - make this computed to ensure reactivity
const navigationItems = computed(() => [
  { name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Hospitalisation', path: '/hospitalizations', icon: BedDouble },
  { name: 'Chambres', path: '/rooms', icon: BedDouble },
  { name: 'Blocs opératoires', path: '/bloc-operatoire', icon: Scissors },
  { name: 'Rendez-vous', path: '/appointments', icon: CalendarDays },
  { name: 'Facturation', path: '/billing', icon: Receipt },
  { name: 'Utilisateurs', path: '/users', icon: Users },
  { name: 'Dossiers médicaux', path: '/medical-records', icon: FolderOpen },
  { 
    name: 'Alertes', 
    path: '/alerts', 
    icon: Bell, 
    badge: notificationCount,
    customIcon: true 
  }
])

// Add a watcher to update navigation items when notification count changes
watch(notificationCount, () => {
  // This will trigger a re-evaluation of the navigationItems computed property
  console.log('Notification count changed:', notificationCount.value);
})

// Gestion des données utilisateur et de l'état de chargement
const isLoadingUser = ref(false)
const userError = ref(null)
const user = computed(() => {
  const userData = authStore.user
  return {
    fullName: userData ? `${userData.nom || ''} ${userData.prenom || ''}`.trim() : 'Chargement...',
    role: userData?.role || 'Chargement...'
  }
})

// Actualisation des données utilisateur dès changement d'état d'authentification
watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
  if (!isAuthenticated) {
    router.push('/login')
    return
  }
  try {
    isLoadingUser.value = true
    await authStore.fetchUser()
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error)
    userError.value = 'Erreur lors du chargement du profil'
    toast.error('Impossible de charger les informations du profil')
  } finally {
    isLoadingUser.value = false
  }
}, { immediate: true })

const userInitials = computed(() => {
  const userData = authStore.user
  if (!userData) return '...'
  const nom = userData.nom || ''
  const prenom = userData.prenom || ''
  return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase()
})

// Formulaire de profil et état de validation
const profileForm = ref({
  nom: authStore.user?.nom || '',
  prenom: authStore.user?.prenom || '',
  email: authStore.user?.email || '',
  telephone: authStore.user?.telephone || '',
  role: authStore.user?.role || ''
})

const formErrors = ref({
  nom: '',
  prenom: '',
  email: '',
  telephone: ''
})

// Ouvre la modale en réinitialisant le formulaire avec les données actuelles de l'utilisateur
const openProfileSettings = () => {
  profileForm.value = {
    nom: authStore.user?.nom || '',
    prenom: authStore.user?.prenom || '',
    email: authStore.user?.email || '',
    telephone: authStore.user?.telephone || '',
    role: authStore.user?.role || ''
  }
  formErrors.value = { nom: '', prenom: '', email: '', telephone: '' }
  showProfileModal.value = true
}

// Déconnexion
const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
    toast.success('Déconnexion réussie')
  } catch (error) {
    console.error('Erreur de déconnexion:', error)
    toast.error(error?.response?.data?.message || 'Erreur lors de la déconnexion')
  }
}

// Validation du formulaire de profil
const validateForm = () => {
  let isValid = true
  formErrors.value = { nom: '', prenom: '', email: '', telephone: '' }

  if (!profileForm.value.nom?.trim()) {
    formErrors.value.nom = 'Le nom est requis'
    isValid = false
  }
  if (!profileForm.value.prenom?.trim()) {
    formErrors.value.prenom = 'Le prénom est requis'
    isValid = false
  }
  if (!profileForm.value.email?.trim()) {
    formErrors.value.email = 'L\'email est requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.value.email)) {
    formErrors.value.email = 'Format d\'email invalide'
    isValid = false
  }
  if (profileForm.value.telephone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(profileForm.value.telephone)) {
    formErrors.value.telephone = 'Format de téléphone invalide'
    isValid = false
  }
  return isValid
}

// Mise à jour du profil via le store
const updateProfile = async () => {
  if (!validateForm()) {
    toast.error('Veuillez corriger les erreurs du formulaire')
    return
  }
  isUpdating.value = true
  try {
    // Ensure all form fields are properly trimmed and validated
    const updatedProfile = {
      nom: profileForm.value.nom.trim(),
      prenom: profileForm.value.prenom.trim(),
      email: profileForm.value.email.trim(),
      telephone: profileForm.value.telephone?.trim() || null,
      role: authStore.user?.role,
      _id: authStore.user?._id || authStore.user?.id
    }

    console.log('Données du formulaire à envoyer:', updatedProfile)
    console.log('État actuel du store:', authStore.user)

    // Update profile in auth store
    await authStore.updateProfile(updatedProfile)
    
    // Refresh user data
    await authStore.fetchUser()
    
    // Update local form data with fresh user data
    profileForm.value = {
      nom: authStore.user?.nom || '',
      prenom: authStore.user?.prenom || '',
      email: authStore.user?.email || '',
      telephone: authStore.user?.telephone || '',
      role: authStore.user?.role || ''
    }
    
    toast.success('Profil mis à jour avec succès')
    showProfileModal.value = false
  } catch (error) {
    console.error('Erreur de mise à jour du profil:', error)
    const errorMessage = error?.response?.data?.message || error.message || 'Erreur lors de la mise à jour du profil'
    toast.error(errorMessage)
  } finally {
    isUpdating.value = false
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200
         flex items-center justify-center min-w-[100px];
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700
         disabled:bg-primary-400 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300
         hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300
         dark:border-gray-600 dark:hover:bg-gray-700;
}
</style>