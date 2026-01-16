<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500/10 via-white to-secondary-500/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/30">
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <img src="@/assets/images/logo.png" alt="Logo" class="h-20 w-auto" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Médecin
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Connectez-vous à votre espace
          </p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div class="mt-1 relative">
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="input-field"
                :class="{ 'error': errors.email }"
                placeholder="Email"
                :disabled="isLoading"
              />
              <Mail class="input-icon" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mot de passe
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input-field"
                :class="{ 'error': errors.password }"
                placeholder="••••••••"
                :disabled="isLoading"
              />
              <Lock class="input-icon" />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                :disabled="isLoading"
              >
                <Eye v-if="showPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600" />
                <EyeOff v-else class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                v-model="rememberMe"
                class="checkbox"
                :disabled="isLoading"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Se souvenir de moi
              </label>
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary w-full flex justify-center"
            :disabled="isLoading"
          >
            <Loader2 v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" />
            {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
          </button>
        </form>

        <!-- Toast Notifications -->
        <div class="fixed top-4 right-4 z-50">
          <TransitionGroup name="toast">
            <div
              v-if="errors.email"
              key="email"
              class="mb-2 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-md"
            >
              <div class="flex items-center">
                <span class="mr-2">⚠️</span>
                {{ errors.email }}
              </div>
            </div>

            <div
              v-if="errors.password"
              key="password"
              class="mb-2 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-md"
            >
              <div class="flex items-center">
                <span class="mr-2">⚠️</span>
                {{ errors.password }}
              </div>
            </div>

            <div
              v-if="globalError"
              key="global"
              class="mb-2 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-md"
            >
              <div class="flex items-center">
                <span class="mr-2">⚠️</span>
                {{ globalError }}
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/services/axios'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const isLoading = ref(false)
const globalError = ref('')
const errors = reactive({
  email: '',
  password: ''
})

let tokenRefreshInterval

// Check for existing token and set up token refresh on component mount
onMounted(() => {
  const token = localStorage.getItem('Token_MEDECIN')
  const isAuthenticated = localStorage.getItem('isAuthenticated')
  const user = JSON.parse(localStorage.getItem('user'))
  
  if (token && isAuthenticated === 'true' && user) {
    authStore.checkAuth().then(() => {
      if (authStore.isAuthenticated) {
        setupTokenRefresh()
        router.push('/dashboard')
      }
    })
  }
})

// Clean up interval on component unmount
onBeforeUnmount(() => {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval)
  }
})

// Set up automatic token refresh
const setupTokenRefresh = () => {
  // Refresh token every 55 minutes (5 minutes before typical 1-hour expiration)
  tokenRefreshInterval = setInterval(async () => {
    try {
      const response = await apiClient.post('/refresh-token')
      const { Token_MEDECIN: newToken } = response.data
      
      if (newToken) {
        localStorage.setItem('Token_MEDECIN', newToken)
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      // If token refresh fails, redirect to login
      authStore.logout()
      router.push('/login')
    }
  }, 55 * 60 * 1000) // 55 minutes in milliseconds
}

const validateForm = () => {
  let isValid = true
  errors.email = ''
  errors.password = ''

  if (!email.value) {
    errors.email = 'L\'email est requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Veuillez entrer une adresse email valide'
    isValid = false
  }

  if (!password.value) {
    errors.password = 'Le mot de passe est requis'
    isValid = false
  } else if (password.value.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  globalError.value = ''
  
  if (!validateForm()) return

  try {
    isLoading.value = true
    await authStore.login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value
    })
    setupTokenRefresh()
    router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    if (error.response?.status === 401) {
      globalError.value = 'Email ou mot de passe incorrect'
    } else if (error.response?.status === 429) {
      globalError.value = 'Trop de tentatives de connexion. Veuillez réessayer plus tard.'
    } else if (error.response?.data?.message) {
      globalError.value = error.response.data.message
    } else if (!navigator.onLine) {
      globalError.value = 'Erreur de connexion internet. Veuillez vérifier votre connexion.'
    } else if (error.code === 'ECONNABORTED') {
      globalError.value = 'La requête a pris trop de temps. Veuillez réessayer.'
    } else if (error.response?.status >= 500) {
      globalError.value = 'Une erreur serveur est survenue. Veuillez réessayer plus tard.'
    } else {
      globalError.value = 'Une erreur est survenue lors de la connexion. Veuillez réessayer.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.input-field {
  @apply block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
         dark:bg-gray-700 dark:text-white text-sm;
}

.input-field.error {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

.input-icon {
  @apply absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400;
}

.checkbox {
  @apply h-4 w-4 rounded border-gray-300 text-primary-600 
         focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700;
}

.btn-primary {
  @apply py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium 
         text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 
         focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 
         disabled:cursor-not-allowed;
}

/* Toast animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>