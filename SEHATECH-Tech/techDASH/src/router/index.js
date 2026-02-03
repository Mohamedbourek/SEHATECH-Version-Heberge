import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Pré-importer les composants principaux pour éviter les problèmes de chargement dynamique
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      const authStore = useAuthStore()
      return authStore.isAuthenticated ? '/dashboard' : '/login'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      title: 'Tableau de bord'
    }
  },
  {
    path: '/equipment',
    name: 'equipment',
    component: () => import('@/views/equipment/EquipmentView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Équipements'
    }
  },
  {
    path: '/equipment/:id',
    name: 'equipment-details',
    component: () => import('@/views/equipment/EquipmentDetailsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Détails de l\'équipement'
    }
  },
  {
    path: '/equipment/:id/history',
    name: 'equipment-history',
    component: () => import('@/views/equipment/EquipmentHistoryView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Historique de l\'équipement'
    }
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: () => import('@/views/MonitoringView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Monitoring'
    }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('@/views/AlertsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Alertes'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Paramètres'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      title: 'Connexion'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/profileview.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mon profil'
    }
  },
  {
    path: '/profile/settings',
    name: 'ProfileSettings',
    component: () => import('@/views/profile/ProfileSettingsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Paramètres du profil'
    }
  },
  {
    path: '/profile/notifications',
    name: 'ProfileNotifications',
    component: () => import('@/views/profile/NotificationsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Notifications'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth) {
    try {
      const isValid = await authStore.checkAuth()
      if (!isValid) {
        next('/login')
        return
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      next('/login')
      return
    }
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router