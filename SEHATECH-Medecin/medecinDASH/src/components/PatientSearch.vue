<template>
  <div class="relative">
    <input
      type="text"
      v-model="searchQuery"
      class="input w-full"
      placeholder="Rechercher un patient..."
      @input="handleInput"
      @focus="showResults = true"
    />
    
    <!-- Résultats de recherche -->
    <div 
      v-if="showResults && searchResults.length > 0" 
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
    >
      <div 
        v-for="patient in searchResults" 
        :key="patient._id"
        @click="selectPatient(patient)"
        class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      >
        <div class="font-medium text-gray-900 dark:text-white">
          {{ getPatientFullName(patient) }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          ID: {{ patient._id }}
        </div>
      </div>
    </div>
    
    <!-- Message si aucun résultat -->
    <div 
      v-if="showResults && noResults" 
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-center"
    >
      <span class="text-gray-500 dark:text-gray-400">Aucun patient trouvé</span>
    </div>
    
    <!-- Indicateur de chargement -->
    <div 
      v-if="isSearching" 
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-center"
    >
      <span class="text-gray-500 dark:text-gray-400">Recherche en cours...</span>
    </div>

    <!-- Affichage du patient sélectionné -->
    <div v-if="modelValue && searchQuery" class="mt-2 text-sm text-primary-600">
      Patient sélectionné: {{ searchQuery }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePatientStore } from '@/stores/patientStore'

const props = defineProps({
  modelValue: String, // ID du patient
  selectedPatient: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const patientStore = usePatientStore()
const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const isSearching = ref(false)
const searchTimeout = ref(null)

const noResults = computed(() => {
  return searchQuery.value.length >= 2 && 
         !isSearching.value && 
         searchResults.value.length === 0
})

// Si un patient est déjà sélectionné, afficher son nom
watch(() => props.selectedPatient, (newVal) => {
  if (newVal) {
    searchQuery.value = getPatientFullName(newVal)
    console.log('PatientSearch: patient sélectionné mis à jour', newVal, searchQuery.value)
  }
}, { immediate: true })

// Si modelValue change (ID du patient), mettre à jour la recherche
watch(() => props.modelValue, (newVal) => {
  if (newVal && searchQuery.value === '') {
    // Charger les détails du patient si nécessaire
    loadPatientDetails(newVal)
  }
}, { immediate: true })

// Gérer le clic à l'extérieur pour fermer les résultats
function handleClickOutside(event) {
  const container = document.querySelector('.relative')
  if (container && !container.contains(event.target)) {
    showResults.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // Si nous avons un patient sélectionné mais pas de texte dans la recherche
  if (props.selectedPatient && !searchQuery.value) {
    searchQuery.value = getPatientFullName(props.selectedPatient)
    console.log('PatientSearch (onMounted): Nom du patient défini', searchQuery.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

async function loadPatientDetails(patientId) {
  try {
    // Cette fonction devrait être implémentée dans le store si nécessaire
    // Pour l'instant, on suppose que cette fonctionnalité n'est pas requise
    console.log('PatientSearch: loadPatientDetails appelé avec ID', patientId)
  } catch (error) {
    console.error('Erreur lors du chargement des détails du patient:', error)
  }
}

function getPatientFullName(patient) {
  if (!patient) return ''
  
  if (patient.utilisateur) {
    const nom = patient.utilisateur.nom || ''
    const prenom = patient.utilisateur.prenom || ''
    return `${nom} ${prenom}`.trim()
  }
  
  return patient.patientName || 'Patient sans nom'
}

async function handleInput() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  
  if (!searchQuery.value.trim() || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  isSearching.value = true
  
  searchTimeout.value = setTimeout(async () => {
    try {
      const results = await patientStore.searchPatients(searchQuery.value)
      searchResults.value = results
      showResults.value = true
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

function selectPatient(patient) {
  console.log('PatientSearch: patient sélectionné', patient)
  emit('update:modelValue', patient._id)
  emit('select', patient)
  searchQuery.value = getPatientFullName(patient)
  showResults.value = false
}
</script> 