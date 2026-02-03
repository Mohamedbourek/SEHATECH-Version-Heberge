<template>
  <BaseModal
    title="Configuration des alertes"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- En-tête avec informations du capteur -->
      <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <component 
              :is="sensor.icon || 'Gauge'"
              class="w-6 h-6 text-gray-500"
            />
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ sensor.name }}
            </h3>
            <p class="text-sm text-gray-500">
              ID: {{ sensor.id }} | Type: {{ sensor.type }}
            </p>
          </div>
        </div>
      </div>

      <!-- Configuration des seuils -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium">Seuils d'alerte</h4>
        
        <!-- Seuil critique -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Seuil minimal critique</label>
            <div class="flex items-center space-x-2">
              <input
                v-model.number="form.thresholds.critical.min"
                type="number"
                class="form-input"
                :step="sensor.precision || 0.1"
              />
              <span class="text-sm text-gray-500">{{ sensor.unit }}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Seuil maximal critique</label>
            <div class="flex items-center space-x-2">
              <input
                v-model.number="form.thresholds.critical.max"
                type="number"
                class="form-input"
                :step="sensor.precision || 0.1"
              />
              <span class="text-sm text-gray-500">{{ sensor.unit }}</span>
            </div>
          </div>
        </div>

        <!-- Seuil d'avertissement -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Seuil minimal d'avertissement</label>
            <div class="flex items-center space-x-2">
              <input
                v-model.number="form.thresholds.warning.min"
                type="number"
                class="form-input"
                :step="sensor.precision || 0.1"
              />
              <span class="text-sm text-gray-500">{{ sensor.unit }}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Seuil maximal d'avertissement</label>
            <div class="flex items-center space-x-2">
              <input
                v-model.number="form.thresholds.warning.max"
                type="number"
                class="form-input"
                :step="sensor.precision || 0.1"
              />
              <span class="text-sm text-gray-500">{{ sensor.unit }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration des notifications -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium">Notifications</h4>
        
        <div class="space-y-3">
          <!-- Email -->
          <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div class="flex items-center space-x-3">
              <Mail class="w-5 h-5 text-gray-400" />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications par email
                </p>
                <p class="text-sm text-gray-500">
                  Recevoir les alertes par email
                </p>
              </div>
            </div>
            <Switch
              v-model="form.notifications.email"
              class="switch"
            />
          </div>

          <!-- SMS -->
          <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div class="flex items-center space-x-3">
              <MessageSquare class="w-5 h-5 text-gray-400" />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications par SMS
                </p>
                <p class="text-sm text-gray-500">
                  Recevoir les alertes par SMS
                </p>
              </div>
            </div>
            <Switch
              v-model="form.notifications.sms"
              class="switch"
            />
          </div>

          <!-- Push -->
          <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div class="flex items-center space-x-3">
              <Bell class="w-5 h-5 text-gray-400" />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications push
                </p>
                <p class="text-sm text-gray-500">
                  Recevoir les alertes sur le navigateur
                </p>
              </div>
            </div>
            <Switch
              v-model="form.notifications.push"
              class="switch"
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button 
          type="button"
          class="btn btn-outline"
          @click="$emit('close')"
        >
          Annuler
        </button>
        <button 
          type="button"
          class="btn btn-primary"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <Loader2 
            v-if="isSubmitting"
            class="w-4 h-4 mr-2 animate-spin"
          />
          Enregistrer
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import { 
  Gauge, Mail, MessageSquare, Bell, Loader2 
} from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import Switch from '@/components/common/Switch.vue'

const props = defineProps({
  sensor: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

const isSubmitting = ref(false)

// Formulaire avec valeurs par défaut
const form = ref({
  thresholds: {
    critical: {
      min: props.sensor.limits?.critical?.min || null,
      max: props.sensor.limits?.critical?.max || null
    },
    warning: {
      min: props.sensor.limits?.warning?.min || null,
      max: props.sensor.limits?.warning?.max || null
    }
  },
  notifications: {
    email: props.sensor.notifications?.email || false,
    sms: props.sensor.notifications?.sms || false,
    push: props.sensor.notifications?.push || true
  }
})

async function handleSubmit() {
  isSubmitting.value = true
  try {
    await emit('save', {
      sensorId: props.sensor.id,
      ...form.value
    })
    emit('close')
  } catch (error) {
    console.error('Error saving alert config:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.switch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full
         bg-gray-200 dark:bg-gray-700 transition-colors duration-200
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

.switch[data-checked="true"] {
  @apply bg-primary-600;
}

.switch::after {
  content: '';
  @apply absolute h-4 w-4 transform rounded-full bg-white transition duration-200;
  left: 0.25rem;
}

.switch[data-checked="true"]::after {
  @apply translate-x-5;
}
</style> 