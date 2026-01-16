<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500/10 via-white to-secondary-500/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/30">
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <img src="@/assets/logo.png" alt="Logo" class="h-20 w-auto" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Administrateur
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Connectez-vous à votre espace administrateur
          </p>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div class="mt-1 relative">
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="input-field"
                :class="{ 'error': errors.email }"
                placeholder="Email"
                :disabled="isLoading"
              />
              <Mail class="input-icon" />
            </div>
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mot de passe
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="form.password"
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
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember"
                v-model="form.remember"
                type="checkbox"
                class="checkbox"
                :disabled="isLoading"
              />
              <label for="remember" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Se souvenir de moi
              </label>
            </div>

            <div class="text-sm">
              <button 
                type="button" 
                @click="handleForgotPassword"
                class="font-medium text-primary-600 hover:text-primary-500"
                :disabled="isLoading"
              >
                Mot de passe oublié ?
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary w-full flex justify-center"
            :disabled="isLoading"
          >
            <Loader v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" />
            {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { Eye, EyeOff, Loader, Mail, Lock } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  email: '',
  password: '',
  remember: false
})

const errors = ref({
  email: '',
  password: ''
})

const isLoading = ref(false)
const showPassword = ref(false)

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(form.value.email)
})

const isValidPassword = computed(() => {
  return form.value.password.length >= 6
})

const validateForm = () => {
  let isValid = true
  errors.value.email = ''
  errors.value.password = ''

  if (!form.value.email) {
    errors.value.email = 'L\'email est requis'
    isValid = false
  } else if (!isValidEmail.value) {
    errors.value.email = 'Format d\'email invalide'
    isValid = false
  }

  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est requis'
    isValid = false
  } else if (!isValidPassword.value) {
    errors.value.password = 'Le mot de passe doit contenir au moins 6 caractères'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  errors.value = { email: '', password: '' }
  
  try {
    await authStore.login({
      email: form.value.email,
      password: form.value.password,
      remember: form.value.remember
    })
    
    router.push('/dashboard')
    toast.success('Connexion réussie', 'Bienvenue sur votre tableau de bord')
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Vérifiez vos identifiants et réessayez'
    toast.error('Erreur de connexion', errorMessage)
    
    if (error.response?.data?.errors) {
      errors.value = {
        email: error.response.data.errors.email?.[0] || '',
        password: error.response.data.errors.password?.[0] || ''
      }
    }
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = async () => {
  if (!form.value.email) {
    toast.error(
      'Email requis',
      'Veuillez saisir votre adresse email'
    )
    return
  }

  try {
    await authStore.forgotPassword(form.value.email)
    toast.info(
      'Email envoyé',
      'Les instructions de réinitialisation ont été envoyées à votre adresse email'
    )
  } catch (error) {
    toast.error(
      'Erreur',
      'Impossible d\'envoyer l\'email de réinitialisation'
    )
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
</style>