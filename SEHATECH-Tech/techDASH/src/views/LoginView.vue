<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500/10 via-white to-secondary-500/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/30">
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <img src="@/assets/images/logo.png" alt="Logo" class="h-20 w-auto" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Technicien
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Connectez-vous à votre espace
          </p>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-md">
          <div class="flex items-center">
            <span class="mr-2">⚠️</span>
            {{ error }}
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
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
                placeholder="Email"
                :disabled="isLoading"
              />
              <Loader2Icon v-if="isLoading" class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
            </div>
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
                placeholder="••••••••"
                :disabled="isLoading"
              />
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
                v-model="form.rememberMe"
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
            <Loader2Icon v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" />
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
import { Loader2Icon, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(false)
const error = computed(() => authStore.error)
const showPassword = ref(false)

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

async function handleLogin() {
  isLoading.value = true
  try {
    await authStore.login(form.value)
    router.push('/')
  } catch (err) {
    // Error is already handled in the store
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.input-field {
  @apply block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 
         rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
         dark:bg-gray-700 dark:text-white text-sm;
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