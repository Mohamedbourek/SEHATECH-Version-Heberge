<template>
  <div class="medication-search">
    <div class="relative">
      <input
        type="text"
        v-model="searchQuery"
        class="form-input pr-10"
        :placeholder="placeholder"
        @focus="handleFocus"
        @input="handleInput"
        @blur="handleBlur"
        :required="required"
      />
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <div v-if="loading" class="animate-spin">
          <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
        <Search v-else class="w-5 h-5 text-gray-400" />
      </div>

      <!-- Résultats de recherche -->
      <div 
        v-if="showResults && searchResults.length > 0"
        class="results-container"
      >
        <div 
          v-for="med in searchResults"
          :key="med._id"
          class="result-item"
          @mousedown="selectMedication(med)"
        >
          <div class="flex items-start">
            <Pill class="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" />
            <div class="ml-2">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ med.nomCommercial }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ med.nomGenerique || 'Générique non spécifié' }} - {{ med.forme || 'Forme non spécifiée' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Message si aucun résultat -->
      <div 
        v-if="showResults && searchQuery && !loading && searchResults.length === 0"
        class="results-container py-3 text-center text-gray-500 dark:text-gray-400"
      >
        Aucun médicament trouvé
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Search, Pill } from 'lucide-vue-next'
import { useMedicationStore } from '@/stores/medicationStore'
import { debounce } from 'lodash'

const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Rechercher un médicament...'
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const medicationStore = useMedicationStore()
const searchQuery = ref('')
const showResults = ref(false)
const searchResults = ref([])
const loading = ref(false)
const selectedMedication = ref(null)

// Charger les médicaments au montage du composant
onMounted(async () => {
  if (props.modelValue) {
    try {
      loading.value = true
      // Si nous avons déjà un ID de médicament, essayons de récupérer ses détails
      await medicationStore.getMedications()
      const medication = medicationStore.getMedicamentById(props.modelValue)
      if (medication) {
        searchQuery.value = medication.nomCommercial
        selectedMedication.value = medication
      }
    } catch (error) {
      console.error('Erreur lors du chargement du médicament:', error)
    } finally {
      loading.value = false
    }
  }
})

// Surveiller les changements de modelValue
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    searchQuery.value = ''
    selectedMedication.value = null
  }
}, { immediate: true })

// Fonction pour rechercher des médicaments (debounced)
const searchMedications = debounce(async (query) => {
  if (!query || query.length < 2) {
    searchResults.value = []
    return
  }
  
  try {
    loading.value = true
    const results = await medicationStore.searchMedications(query)
    searchResults.value = results
  } catch (error) {
    console.error('Erreur lors de la recherche de médicaments:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}, 300)

function handleInput() {
  if (searchQuery.value !== selectedMedication.value?.nomCommercial) {
    // L'utilisateur a modifié la recherche, réinitialiser la sélection
    emit('update:modelValue', '')
    selectedMedication.value = null
  }
  searchMedications(searchQuery.value)
}

function handleFocus() {
  showResults.value = true
  if (searchQuery.value.length >= 2) {
    searchMedications(searchQuery.value)
  }
}

function selectMedication(medication) {
  searchQuery.value = medication.nomCommercial
  selectedMedication.value = medication
  emit('update:modelValue', medication._id)
  emit('select', medication)
  showResults.value = false
}

function handleBlur() {
  setTimeout(() => {
    showResults.value = false
    
    // Si l'utilisateur n'a pas sélectionné un médicament valide, réinitialiser
    if (!selectedMedication.value && searchQuery.value) {
      searchQuery.value = ''
      emit('update:modelValue', '')
    }
  }, 200)
}
</script>

<style scoped>
.medication-search {
  @apply relative;
}

.results-container {
  @apply absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg 
         border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto;
}

.result-item {
  @apply px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer;
}

/* Scrollbar personnalisée */
.results-container {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.400') theme('colors.gray.100');
}

.results-container::-webkit-scrollbar {
  @apply w-1.5;
}

.results-container::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700 rounded-full;
}

.results-container::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-500 rounded-full 
         hover:bg-gray-500 dark:hover:bg-gray-400;
}
</style> 