<template>
  <BaseModal
    :title="alert ? 'Modifier l\'alerte' : 'Nouvelle alerte'"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Type d'alerte -->
      <div>
        <label class="form-label" for="alert-type">Type d'alerte</label>
        <select
          id="alert-type"
          v-model="form.type"
          required
          class="form-select"
        >
          <option value="SYSTEM">Système</option>
          <option value="SECURITY">Sécurité</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="GENERAL">Général</option>
        </select>
      </div>

      <!-- Priorité -->
      <div>
        <label class="form-label" for="alert-priority">Priorité</label>
        <div class="grid grid-cols-4 gap-3">
          <label
            v-for="priority in priorities"
            :key="priority.value"
            class="relative flex cursor-pointer rounded-lg border p-4 focus:outline-none"
            :class="[
              form.priority === priority.value 
                ? priorityActiveClasses[priority.value]
                : 'border-gray-300 hover:border-gray-400'
            ]"
          >
            <input
              type="radio"
              :value="priority.value"
              v-model="form.priority"
              class="sr-only"
            />
            <span class="flex flex-col">
              <span class="flex items-center justify-center">
                <component 
                  :is="priority.icon" 
                  class="w-6 h-6"
                  :class="priorityIconClasses[priority.value]"
                />
              </span>
              <span 
                class="mt-2 text-xs font-medium text-center"
                :class="form.priority === priority.value ? 'text-gray-900 dark:text-white' : 'text-gray-500'"
              >
                {{ priority.label }}
              </span>
            </span>
          </label>
        </div>
      </div>

      <!-- Titre -->
      <div>
        <label class="form-label" for="alert-title">Titre</label>
        <input
          id="alert-title"
          v-model="form.title"
          type="text"
          required
          class="form-input"
          placeholder="Titre de l'alerte"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="form-label" for="alert-description">Description</label>
        <textarea
          id="alert-description"
          v-model="form.description"
          rows="3"
          required
          class="form-textarea"
          placeholder="Description détaillée de l'alerte"
        ></textarea>
      </div>

      <!-- Date d'expiration -->
      <div>
        <label class="form-label" for="alert-expiry">Date d'expiration</label>
        <input
          id="alert-expiry"
          v-model="form.expiryDate"
          type="datetime-local"
          class="form-input"
        />
        <p class="mt-1 text-sm text-gray-500">
          Laissez vide pour une alerte sans date d'expiration
        </p>
      </div>

      <!-- Destinataires -->
      <div>
        <label class="form-label">Destinataires</label>
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              v-model="form.recipients.all"
              class="form-checkbox"
              @change="toggleAllRecipients"
            />
            <span class="ml-2 text-sm">Tous les utilisateurs</span>
          </label>
          <div v-if="!form.recipients.all" class="ml-6 space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="form.recipients.admins"
                class="form-checkbox"
              />
              <span class="ml-2 text-sm">Administrateurs</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="form.recipients.staff"
                class="form-checkbox"
              />
              <span class="ml-2 text-sm">Personnel</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
          :disabled="isSubmitting"
        >
          <Loader2 
            v-if="isSubmitting" 
            class="w-4 h-4 mr-2 animate-spin"
          />
          {{ alert ? 'Mettre à jour' : 'Créer' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { AlertTriangle, AlertOctagon, AlertCircle, Info, Loader2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  alert: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const priorities = [
  { value: 'LOW', label: 'Basse', icon: Info },
  { value: 'MEDIUM', label: 'Moyenne', icon: AlertCircle },
  { value: 'HIGH', label: 'Haute', icon: AlertTriangle },
  { value: 'CRITICAL', label: 'Critique', icon: AlertOctagon }
]

const priorityActiveClasses = {
  LOW: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
  MEDIUM: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
  HIGH: 'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
  CRITICAL: 'border-red-500 bg-red-50 dark:bg-red-900/10'
}

const priorityIconClasses = {
  LOW: 'text-blue-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-500'
}

const form = ref({
  type: 'GENERAL',
  priority: 'MEDIUM',
  title: '',
  description: '',
  expiryDate: '',
  recipients: {
    all: true,
    admins: false,
    staff: false
  }
})

const isSubmitting = ref(false)

onMounted(() => {
  if (props.alert) {
    form.value = {
      ...props.alert,
      recipients: {
        all: props.alert.recipients?.includes('all'),
        admins: props.alert.recipients?.includes('admins'),
        staff: props.alert.recipients?.includes('staff')
      }
    }
  }
})

const toggleAllRecipients = () => {
  if (form.value.recipients.all) {
    form.value.recipients.admins = false
    form.value.recipients.staff = false
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  isSubmitting.value = true
  try {
    const recipients = form.value.recipients.all 
      ? ['all']
      : Object.entries(form.value.recipients)
          .filter(([key, value]) => value && key !== 'all')
          .map(([key]) => key)

    const alertData = {
      type: form.value.type,
      priority: form.value.priority,
      title: form.value.title,
      description: form.value.description,
      expiryDate: form.value.expiryDate || null,
      recipients
    }

    if (props.alert) {
      alertData.id = props.alert.id
    }

    await emit('save', alertData)
    emit('close')
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}

.form-checkbox {
  @apply rounded border-gray-300 text-primary-600 shadow-sm 
         focus:border-primary-500 focus:ring-primary-500
         dark:border-gray-600 dark:bg-gray-700;
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