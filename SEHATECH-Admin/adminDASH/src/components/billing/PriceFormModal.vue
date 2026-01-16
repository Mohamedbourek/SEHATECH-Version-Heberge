<template>
  <BaseModal :title="price ? 'Modifier le tarif' : 'Nouveau tarif'" @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <!-- Nom -->
        <div class="sm:col-span-2">
          <label class="form-label" for="price-name">Nom de la prestation</label>
          <input
            id="price-name"
            v-model="form.nom"
            type="text"
            required
            class="form-input"
          />
        </div>

        <!-- Catégorie -->
        <div class="sm:col-span-2">
          <label class="form-label" for="price-category">Catégorie</label>
          <select
            id="price-category"
            v-model="form.categorie"
            required
            class="form-select"
          >
            <option value="Consultation">Consultation</option>
            <option value="Radiologie">Radiologie</option>
            <option value="Analyses">Analyses</option>
            <option value="Chirurgie">Chirurgie</option>
          </select>
        </div>

        <!-- Tarif normal -->
        <div>
          <label class="form-label" for="base-price">Tarif normal</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              DA
            </span>
            <input
              id="base-price"
              v-model.number="form.prixBase"
              type="number"
              min="0"
              step="0.01"
              required
              class="form-input pl-12"
            />
          </div>
        </div>

        <!-- Tarif CNAS -->
        <div>
          <label class="form-label" for="insurance-price">Tarif CNAS</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              DA
            </span>
            <input
              id="insurance-price"
              v-model.number="form.prixAssurance"
              type="number"
              min="0"
              step="0.01"
              required
              class="form-input pl-12"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="sm:col-span-2">
          <label class="form-label" for="price-description">Description</label>
          <textarea
            id="price-description"
            v-model="form.description"
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          {{ price ? 'Mettre à jour' : 'Ajouter' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  price: {
    type: Object,
    default: null
  }
})
const emit = defineEmits(['close', 'save'])
const toast = useToast()

// Internal form state with default values
const form = ref({
  nom: '',
  categorie: 'Consultation',
  prixBase: 0,
  prixAssurance: 0,
  description: '',
  statut: 'ACTIF'
})
const isSubmitting = ref(false)

// Watch for changes in the "price" prop so that when a tariff is selected for editing, the form is updated
watch(
  () => props.price,
  (newPrice) => {
    if (newPrice) {
      form.value = { ...newPrice }
    } else {
      form.value = {
        nom: '',
        categorie: 'Consultation',
        prixBase: 0,
        prixAssurance: 0,
        description: '',
        statut: 'ACTIF'
      }
    }
  },
  { immediate: true }
)

const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const priceData = {
      nom: form.value.nom,
      categorie: form.value.categorie,
      prixBase: Number(form.value.prixBase),
      prixAssurance: Number(form.value.prixAssurance),
      description: form.value.description
    }
    // If editing an existing tariff, include its id
    await emit('save', props.price?.id ? { ...priceData, id: props.price.id } : priceData)
    emit('close')
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du tarif:", error)
    toast.error(error.message || "Erreur lors de l'enregistrement du tarif")
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
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm 
         focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white sm:text-sm;
}
</style>
