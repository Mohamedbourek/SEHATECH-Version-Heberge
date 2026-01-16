<template>
  <div class="medication-search">
    <div class="form-group">
      <label class="form-label required">Médicament</label>
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          class="form-input"
          placeholder="Rechercher un médicament..."
          @input="handleSearch"
          required
        />
        <!-- Suggestions dropdown -->
        <div v-if="suggestions.length > 0"
          class="absolute z-50 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion._id"
            @click="selectMedication(suggestion)"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
          >
            <div class="font-medium">{{ suggestion.nomCommercial }}</div>
            <div class="text-sm text-gray-600">
              {{ suggestion.nomGenerique }} - {{ suggestion.dosage }} - {{ suggestion.forme }}
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Informations du médicament sélectionné -->
    <div v-if="selectedMedication" 
         class="medication-info mt-4 p-3 bg-gray-50 rounded-lg"
    >
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-500">Nom commercial:</span>
          <p class="font-medium text-gray-900">
            {{ selectedMedication.nomCommercial }}
          </p>
        </div>
        <div>
          <span class="text-gray-500">Nom générique:</span>
          <p class="font-medium text-gray-900">
            {{ selectedMedication.nomGenerique }}
          </p>
        </div>
        <div>
          <span class="text-gray-500">Dosage:</span>
          <p class="font-medium text-gray-900">
            {{ selectedMedication.dosage }}
          </p>
        </div>
        <div>
          <span class="text-gray-500">Forme:</span>
          <p class="font-medium text-gray-900">
            {{ selectedMedication.forme }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMedicationStore } from '@/stores/medicationStore'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const medicationStore = useMedicationStore()
const searchQuery = ref('')
const suggestions = ref([])
const selectedMedication = ref(null)
const searchTimeout = ref(null)

// Initialiser la recherche avec la valeur existante si disponible
if (props.modelValue && props.modelValue.nomCommercial) {
  searchQuery.value = props.modelValue.nomCommercial
  selectedMedication.value = props.modelValue
}

// Fonction de recherche avec debounce
async function handleSearch() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  
  if (!searchQuery.value || searchQuery.value.length < 2) {
    suggestions.value = []
    return
  }
  
  searchTimeout.value = setTimeout(async () => {
    try {
      const results = await medicationStore.searchMedications(searchQuery.value)
      suggestions.value = results
    } catch (error) {
      console.error('Erreur lors de la recherche de médicaments:', error)
      suggestions.value = []
    }
  }, 200)
}

// Sélectionner un médicament
function selectMedication(medication) {
  selectedMedication.value = medication
  searchQuery.value = medication.nomCommercial
  suggestions.value = []
  
  emit('update:modelValue', medication)
  emit('select', medication)
}

// Surveiller les changements de modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.nomCommercial) {
    searchQuery.value = newValue.nomCommercial
    selectedMedication.value = newValue
  } else {
    searchQuery.value = ''
    selectedMedication.value = null
  }
}, { deep: true })
</script>

<style scoped>
.form-input {
  @apply block w-full rounded-lg border-gray-300 shadow-sm 
         focus:border-primary-500 focus:ring-primary-500 
         sm:text-sm transition-colors duration-200;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-label.required:after {
  content: " *";
  @apply text-red-500;
}

.medication-info {
  @apply border border-gray-200;
}
</style> 