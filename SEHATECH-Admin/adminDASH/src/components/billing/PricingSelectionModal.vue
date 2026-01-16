<template>
  <BaseModal title="Sélectionner une prestation" @close="$emit('close')">
    <div class="space-y-6">
      <!-- Recherche -->
      <div>
        <input
          v-model="search"
          type="text"
          class="form-input"
          placeholder="Rechercher une prestation..."
        />
      </div>

      <!-- Liste des prestations -->
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <button
          v-for="price in filteredPrices"
          :key="price.id"
          class="w-full text-left p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
          @click="selectPrice(price)"
        >
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ price.name }}
              </p>
              <p class="text-sm text-gray-500">
                {{ price.description }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(price.basePrice) }}
              </p>
              <p class="text-sm text-gray-500">
                Base {{ formatCurrency(price.insurancePrice) }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import { formatCurrency } from '@/utils/currency'

const props = defineProps({
  prices: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'select'])

const search = ref('')

const filteredPrices = computed(() => {
  if (!search.value) return props.prices
  const searchLower = search.value.toLowerCase()
  return props.prices.filter(price =>
    price.name.toLowerCase().includes(searchLower) ||
    (price.description && price.description.toLowerCase().includes(searchLower))
  )
})

const selectPrice = (price) => {
  emit('select', price)
  emit('close')
}
</script>
