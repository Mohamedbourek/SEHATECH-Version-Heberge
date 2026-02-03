<template>
  <div class="sidebar-layout">
    <!-- Sidebar -->
    <nav class="sidebar">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="brand flex items-center">
          <img src="@/assets/images/logo.png" alt="Logo" class="h-8 w-8 mr-2" />
          <span class="brand-title text-xl font-bold text-primary-600 dark:text-primary-400">
            Technicien
          </span>
        </div>
      </div>

      <!-- Navigation principale -->
      <div class="sidebar-nav">
        <router-link 
          v-for="item in navigationItems" 
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
        <ThemeToggle />
        <!-- Profil -->
        <div class="relative">
          <button 
            @click="toggleProfileMenu"
            class="profile-button"
          >
            <div class="flex items-center w-full">
             
              <div class="profile-info ml-3">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-200">
                   Tech {{ authStore.user?.nom  }} {{ authStore.user?.prenom  }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ authStore.user?.role || 'Technicien' }}
                </div>
              </div>
              <ChevronDownIcon class="w-4 h-4 ml-auto text-gray-400" />
            </div>
          </button>

          <!-- Menu profil -->
          <div 
            v-show="showProfileMenu"
            class="profile-dropdown"
          >
            <div class="py-2">
              <router-link 
                to="/profile" 
                class="menu-item"
                @click="showProfileMenu = false"
              >
                <UserCircleIcon class="w-5 h-5" />
                <span>Mon profil</span>
              </router-link>
              
              <router-link 
                to="/settings" 
                class="menu-item"
                @click="showProfileMenu = false"
              >
                <Settings2Icon class="w-5 h-5" />
                <span>Paramètres</span>
              </router-link>

              <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
              <button 
                @click="handleLogout" 
                class="menu-item text-red-600 dark:text-red-400 w-full"
                :disabled="isLoggingOut"
              >
                <LogOutIcon v-if="!isLoggingOut" class="w-5 h-5" />
                <Loader2Icon v-else class="w-5 h-5 animate-spin" />
                <span>{{ isLoggingOut ? 'Déconnexion...' : 'Déconnexion' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import {
  LayoutDashboard,
  Monitor,
  Activity,
  Bell,
  Settings2 as Settings2Icon,
  LogOut as LogOutIcon,
  ChevronDown as ChevronDownIcon,
  UserCircle as UserCircleIcon,
  Loader2 as Loader2Icon
} from 'lucide-vue-next'

const navigationItems = [
  {
    name: 'Tableau de bord',
    path: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Équipements',
    path: '/equipment',
    icon: Monitor
  },
  {
    name: 'Monitoring',
    path: '/monitoring',
    icon: Activity
  },
  {
    name: 'Alertes',
    path: '/alerts',
    icon: Bell
  },
  {
    name: 'Paramètres',
    path: '/settings',
    icon: Settings2Icon
  }
]

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isLoggingOut = ref(false)

const showProfileMenu = ref(false)
const userAvatar = computed(() => authStore.user?.avatar || './assets/default-avatar.png')

const isCurrentRoute = (path) => {
  return route.path === path
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await authStore.logout()
    showProfileMenu.value = false
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  } finally {
    isLoggingOut.value = false
  }
}

// Fermer le menu profil au clic en dehors
const closeProfileMenu = (event) => {
  if (!event.target.closest('.profile-dropdown') && !event.target.closest('button')) {
    showProfileMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeProfileMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeProfileMenu)
})
</script>

<style scoped>
.sidebar {
  @apply fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg
         flex flex-col;
}

.sidebar-nav {
  @apply flex-1 px-4 py-4 space-y-1 overflow-y-auto;
}

.sidebar-footer {
  @apply p-4 border-t border-gray-200 dark:border-gray-800 space-y-4;
}

.brand {
  @apply flex items-center justify-center px-4 py-5;
}

.brand-title {
  @apply text-2xl font-bold text-primary-600 dark:text-primary-400
         tracking-wide;
}

.nav-link {
  @apply flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 
         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg
         transition-colors duration-200 space-x-3;
}

.nav-link.active {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
}

.nav-text {
  @apply text-sm font-medium;
}

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
         rounded-lg shadow-lg border border-gray-200 dark:border-gray-700;
}

.menu-item {
  @apply flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 
         hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150;
}
</style>