<template>
  <BaseModal title="Grille tarifaire" @close="$emit('close')">
    <div class="space-y-6">
      <!-- En-tête avec boutons -->
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Liste des tarifs
        </h3>
        <div class="flex items-center space-x-3">
          <button @click="handleAddPrice" class="btn btn-primary">
            <Plus class="w-4 h-4 mr-2" />
            Nouveau tarif
          </button>
          <button
            @click="$emit('close')"
            class="btn-icon text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Fermer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Tableau des tarifs -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="table-header">Prestation</th>
              <th class="table-header">Catégorie</th>
              <th class="table-header">Tarif normal</th>
              <th class="table-header">Tarif CNAS</th>
              <th class="table-header">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="price in formattedPrices" :key="price.id">
              <td class="table-cell">{{ price.name }}</td>
              <td class="table-cell">{{ price.category }}</td>
              <td class="table-cell">{{ formatCurrency(price.basePrice) }}</td>
              <td class="table-cell">{{ formatCurrency(price.insurancePrice) }}</td>
              <td class="table-cell">
                <div class="flex space-x-2">
                  <button
                    @click="handleEdit(price)"
                    class="btn-icon text-blue-500"
                    title="Modifier"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleDelete(price)"
                    class="btn-icon text-red-500"
                    title="Supprimer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de formulaire -->
    <PriceFormModal
      v-if="showFormModal"
      :price="selectedPrice"
      @close="closeFormModal"
      @save="handleSavePrice"
    />

    <!-- Modal de confirmation de suppression -->
    <ConfirmationModal
      v-if="showDeleteModal"
      title="Supprimer le tarif"
      :message="`Êtes-vous sûr de vouloir supprimer le tarif '${selectedPrice?.name}' ?`"
      type="danger"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Edit2, Trash2, X } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currency'
import BaseModal from '@/components/BaseModal.vue'
import PriceFormModal from './PriceFormModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { useToast } from '@/composables/useToast'
import { useBillingStore } from '@/stores/billing'

const props = defineProps({
  prices: {
    type: Array,
    required: true
  }
})
const emit = defineEmits(['close', 'add', 'edit', 'delete'])
const toast = useToast()
const billingStore = useBillingStore()

// Propriété calculée pour formater les données du tarif
const formattedPrices = computed(() => {
  return props.prices.map(price => ({
    id: price.id || price._id,
    name: price.name || price.nom,
    category: price.category || price.categorie,
    basePrice: price.basePrice || price.prixBase,
    insurancePrice: price.insurancePrice || price.prixAssurance,
    description: price.description || ''
  }))
})


// État local
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const selectedPrice = ref(null)

// Gestion des événements
const handleAddPrice = () => {
  selectedPrice.value = null
  showFormModal.value = true
}

const handleEdit = (price) => {
  selectedPrice.value = price
  showFormModal.value = true
}

const handleDelete = (price) => {
  selectedPrice.value = price
  showDeleteModal.value = true
}

const handleSavePrice = async (priceData) => {
  try {
    if (selectedPrice.value) {
      // Mise à jour d'un tarif existant
      await billingStore.updatePrice(selectedPrice.value.id, priceData)
      toast.success('Tarif mis à jour avec succès')
    } else {
      // Création d'un nouveau tarif
      await billingStore.createPrice(priceData)
      toast.success('Tarif ajouté avec succès')
    }
    await billingStore.fetchPrices() // Rafraîchissement de la liste des tarifs
    closeFormModal()
  } catch (error) {
    toast.error("Erreur lors de l'enregistrement du tarif")
    console.error(error)
  }
}

const confirmDelete = async () => {
  try {
    if (!selectedPrice.value) return
    await billingStore.deletePrice(selectedPrice.value.id)
    toast.success('Tarif supprimé avec succès')
    await billingStore.fetchPrices() // Rafraîchissement de la liste des tarifs
    closeDeleteModal()
  } catch (error) {
    toast.error("Erreur lors de la suppression du tarif")
    console.error(error)
  }
}

const closeFormModal = () => {
  showFormModal.value = false
  selectedPrice.value = null
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedPrice.value = null
}
</script>

<style scoped>
.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}
.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100;
}
.btn-icon {
  @apply p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
}
</style>
