<template>
  <BaseModal
    title="Changer le mot de passe"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Mot de passe actuel -->
      <div>
        <label class="form-label" for="current-password">
          Mot de passe actuel
        </label>
        <div class="relative">
          <input
            id="current-password"
            v-model="form.currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            required
            class="form-input pr-10"
            placeholder="Entrez votre mot de passe actuel"
          />
          <button
            type="button"
            @click="showCurrentPassword = !showCurrentPassword"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <Eye v-if="showCurrentPassword" class="h-5 w-5 text-gray-400" />
            <EyeOff v-else class="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      <!-- Nouveau mot de passe -->
      <div>
        <label class="form-label" for="new-password">
          Nouveau mot de passe
        </label>
        <div class="relative">
          <input
            id="new-password"
            v-model="form.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            required
            class="form-input pr-10"
            placeholder="Entrez votre nouveau mot de passe"
          />
          <button
            type="button"
            @click="showNewPassword = !showNewPassword"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <Eye v-if="showNewPassword" class="h-5 w-5 text-gray-400" />
            <EyeOff v-else class="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <!-- Indicateur de force du mot de passe -->
        <div class="mt-1">
          <div class="flex items-center space-x-2">
            <div 
              v-for="(strength, index) in passwordStrengthBars" 
              :key="index"
              class="h-1 flex-1 rounded-full"
              :class="[
                passwordStrength >= index + 1
                  ? strengthColors[passwordStrength - 1]
                  : 'bg-gray-200 dark:bg-gray-700'
              ]"
            />
          </div>
          <p 
            class="mt-1 text-sm"
            :class="strengthTextColors[passwordStrength - 1]"
          >
            {{ strengthLabels[passwordStrength - 1] }}
          </p>
        </div>
      </div>

      <!-- Confirmation du nouveau mot de passe -->
      <div>
        <label class="form-label" for="confirm-password">
          Confirmer le nouveau mot de passe
        </label>
        <div class="relative">
          <input
            id="confirm-password"
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            required
            class="form-input pr-10"
            placeholder="Confirmez votre nouveau mot de passe"
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <Eye v-if="showConfirmPassword" class="h-5 w-5 text-gray-400" />
            <EyeOff v-else class="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <!-- Message d'erreur si les mots de passe ne correspondent pas -->
        <p
          v-if="passwordMismatch"
          class="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          Les mots de passe ne correspondent pas
        </p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('close')"
        >
          Annuler
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isValid || isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          Changer le mot de passe
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'

const emit = defineEmits(['close', 'save'])

const isLoading = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Validation du mot de passe
const passwordStrength = computed(() => {
  const password = form.value.newPassword
  if (!password) return 1

  let strength = 1
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  return strength
})

const passwordStrengthBars = [1, 2, 3, 4]

const strengthLabels = [
  'Très faible',
  'Faible',
  'Moyen',
  'Fort',
  'Très fort'
]

const strengthColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-green-600'
]

const strengthTextColors = [
  'text-red-600 dark:text-red-400',
  'text-orange-600 dark:text-orange-400',
  'text-yellow-600 dark:text-yellow-400',
  'text-green-600 dark:text-green-400',
  'text-green-700 dark:text-green-300'
]

const passwordMismatch = computed(() => {
  return form.value.newPassword && 
         form.value.confirmPassword && 
         form.value.newPassword !== form.value.confirmPassword
})

const isValid = computed(() => {
  return form.value.currentPassword &&
         form.value.newPassword &&
         form.value.confirmPassword &&
         form.value.newPassword === form.value.confirmPassword &&
         passwordStrength.value >= 3
})

const handleSubmit = async () => {
  if (!isValid.value) return

  isLoading.value = true
  try {
    await emit('save', {
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword
    })
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
  } finally {
    isLoading.value = false
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
</style> 