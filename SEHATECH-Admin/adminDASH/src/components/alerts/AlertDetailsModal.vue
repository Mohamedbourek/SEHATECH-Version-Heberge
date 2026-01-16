<template>
  <BaseModal
    title="Détails de l'alerte"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- En-tête avec statut et priorité -->
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ alert.resourceName }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ alert.location }}
          </p>
        </div>
        <div class="flex space-x-2">
          <span 
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="priorityClasses[alert.priority]"
          >
            {{ priorityLabels[alert.priority] }}
          </span>
          <span 
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="statusClasses[alert.status]"
          >
            {{ statusLabels[alert.status] }}
          </span>
        </div>
      </div>

      <!-- Informations principales -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label class="form-label">Description</label>
          <p class="text-sm text-gray-900 dark:text-white">
            {{ alert.description }}
          </p>
        </div>
        <div>
          <label class="form-label">Date de création</label>
          <p class="text-sm text-gray-900 dark:text-white">
            {{ formatDate(alert.date) }}
          </p>
        </div>
        <div>
          <label class="form-label">Catégorie</label>
          <p class="text-sm text-gray-900 dark:text-white">
            {{ categoryLabels[alert.category] }}
          </p>
        </div>
        <div>
          <label class="form-label">Assigné à</label>
          <p class="text-sm text-gray-900 dark:text-white">
            {{ alert.assignedTo || 'Non assigné' }}
          </p>
        </div>
      </div>

      <!-- Formulaire de mise à jour -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Mettre à jour l'alerte
        </h4>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <!-- Statut -->
          <div>
            <label class="form-label" for="alert-status">Statut</label>
            <select
              id="alert-status"
              v-model="form.status"
              class="form-select"
            >
              <option value="new">Nouvelle</option>
              <option value="in-progress">En cours</option>
              <option value="resolved">Résolue</option>
            </select>
          </div>

          <!-- Assignation -->
          <div>
            <label class="form-label" for="alert-assigned">Assigné à</label>
            <input
              id="alert-assigned"
              v-model="form.assignedTo"
              type="text"
              class="form-input"
              placeholder="Nom du technicien"
            />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Notes
        </h4>
        <!-- Liste des notes -->
        <div class="space-y-4 mb-4">
          <div
            v-for="note in alert.notes"
            :key="note.date"
            class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
          >
            <div class="flex justify-between text-sm">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ note.author }}
              </span>
              <span class="text-gray-500 dark:text-gray-400">
                {{ formatDate(note.date) }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {{ note.content }}
            </p>
          </div>
        </div>

        <!-- Ajout de note -->
        <div class="space-y-3">
          <textarea
            v-model="newNote"
            rows="3"
            class="form-textarea"
            placeholder="Ajouter une note..."
          ></textarea>
          <button
            type="button"
            class="btn btn-secondary w-full"
            :disabled="!newNote.trim()"
            @click="addNote"
          >
            Ajouter une note
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('close')"
        >
          Fermer
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleUpdate"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import BaseModal from '@/components/BaseModal.vue'
import { useAlertStore } from '@/stores/alert'

const alertStore = useAlertStore()

const props = defineProps({
  alert: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'update'])

const form = ref({
  status: '',
  assignedTo: ''
})

const newNote = ref('')

// Classes et labels
const priorityClasses = {
  'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400',
  'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
  'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400',
  'critical': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
}

const priorityLabels = {
  'low': 'Basse',
  'medium': 'Moyenne',
  'high': 'Haute',
  'critical': 'Critique'
}

const statusClasses = {
  'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
  'resolved': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
}

const statusLabels = {
  'new': 'Nouvelle',
  'in-progress': 'En cours',
  'resolved': 'Résolue'
}

const categoryLabels = {
  'maintenance': 'Maintenance',
  'technical': 'Technique',
  'security': 'Sécurité',
  'other': 'Autre'
}

onMounted(() => {
  form.value = {
    status: props.alert.status,
    assignedTo: props.alert.assignedTo || ''
  }
})

const formatDate = (date) => {
  return format(new Date(date), 'PPP à HH:mm', { locale: fr })
}

const handleUpdate = async () => {
  const updateData = {
    id: props.alert.id,
    status: form.value.status,
    assignedTo: form.value.assignedTo
  }
  emit('update', updateData)
}

const addNote = async () => {
  if (!newNote.value.trim()) return

  try {
    await alertStore.addNote(props.alert.id, {
      author: 'Utilisateur actuel', // À remplacer par l'utilisateur connecté
      content: newNote.value.trim()
    })
    newNote.value = ''
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la note:', error)
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}
</style> 