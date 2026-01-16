import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      const authStore = useAuthStore()
      return authStore.isAuthenticated ? '/dashboard' : '/login'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      requiresAuth: true,
      title: 'Tableau de bord'
    }
  },
  {
    path: '/hospitalizations',
    name: 'hospitalizations',
    component: () => import('../views/HospitalizationManagement.vue'),
    meta: {
      requiresAuth: true,
      title: 'Gestion des Hospitalisations',
      roles: ['admin', 'medecin', 'infirmier']
    }
  },
  {
    path: '/rooms',
    name: 'Rooms',
    component: () => import('../views/RoomManagement.vue'),
    meta: {
      requiresAuth: true,
      title: 'Gestion des chambres'
    }
  },
  {
    path: '/bloc-operatoire',
    name: 'BlocOperatoire',
    component: () => import('../views/BlocOperatoireManagement.vue'),
    meta: {
      requiresAuth: true,
      title: 'Gestion des blocs opératoires'
    }
  },
  {
    path: '/appointments',
    name: 'Appointments',
    component: () => import('../views/Appointments.vue'),
    meta: {
      requiresAuth: true,
      title: 'Rendez-vous'
    }
  },
  {
    path: '/billing',
    name: 'Billing',
    component: () => import('@/views/Billing.vue'),
    meta: {
      requiresAuth: true,
      title: 'Facturation'
    }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/Users.vue'),
    meta: {
      requiresAuth: true,
      title: 'Gestion des utilisateurs'
    }
  },
  {
    path: '/medical-records',
    name: 'medical-records',
    component: () => import('@/views/MedicalRecords.vue'),
    meta: {
      requiresAuth: true,
      title: 'Dossiers Médicaux'
    }
  },
  {
    path: '/medical-records/:id',
    name: 'MedicalRecordDetails',
    component: () => import('@/views/MedicalRecordDetails.vue'),
    meta: {
      requiresAuth: true,
      title: 'Dossier Médical'
    }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('../views/Alerts.vue'),
    meta: {
      requiresAuth: true,
      title: 'Alertes'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: {
      requiresAuth: true,
      title: 'Paramètres'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router