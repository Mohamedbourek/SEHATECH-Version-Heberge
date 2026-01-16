<template>
  <Modal 
    title="Ajouter un rapport médical"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="p-6 space-y-6 dark:bg-gray-800">
      <div class="form-group">
        <label class="form-label">Titre du rapport</label>
        <input type="text" v-model="form.titre" class="form-input" placeholder="Titre du rapport (optionnel)" />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Si laissé vide, un titre sera généré automatiquement à partir du type et de la date
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label class="form-label">Type de rapport</label>
          <select v-model="form.type" class="form-select">
            <option value="consultation">Consultation</option>
            <option value="hospitalisation">Hospitalisation</option>
            <option value="chirurgie">Chirurgie</option>
            <option value="suivi">Suivi</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" v-model="form.date" class="form-input" />
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Contenu du rapport</label>
        <textarea v-model="form.contenu" class="form-textarea" rows="8" placeholder="Saisissez le contenu du rapport..."></textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button 
          type="button"
          class="btn btn-secondary dark:bg-gray-700 dark:text-gray-300 
                 dark:border-gray-600 dark:hover:bg-gray-600"
          @click="$emit('close')"
        >
          Annuler
        </button>
        <button 
          type="submit"
          class="btn btn-primary dark:bg-primary-600 dark:hover:bg-primary-700 
                 dark:text-white"
          :disabled="isSubmitting"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          Enregistrer
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import { useRapportStore } from '@/stores/rapportStore'
import '@/components/forms/FormStyles.vue'

const props = defineProps({
  dossierId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'created'])

const rapportStore = useRapportStore()
const isSubmitting = ref(false)

// Initialiser le formulaire
const form = ref({
  titre: '',
  type: 'consultation',
  date: new Date().toISOString().split('T')[0],
  contenu: ''
})

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    const rapportData = {
      dossier_id: props.dossierId,
      titre: form.value.titre,
      type: form.value.type,
      date: form.value.date,
      contenu: form.value.contenu
    }
    
    const newRapport = await rapportStore.createRapport(rapportData)
    emit('created', newRapport)
    emit('close')
  } catch (error) {
    console.error('Erreur lors de la création du rapport:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input {
  @apply block w-full rounded-md border-gray-300 shadow-sm
         focus:border-primary-500 focus:ring-primary-500 sm:text-sm
         dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}

.form-textarea {
  @apply block w-full rounded-md border-gray-300 shadow-sm
         focus:border-primary-500 focus:ring-primary-500 sm:text-sm
         dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}

.form-select {
  @apply block w-full rounded-md border-gray-300 shadow-sm
         focus:border-primary-500 focus:ring-primary-500 sm:text-sm
         dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}
</style> 