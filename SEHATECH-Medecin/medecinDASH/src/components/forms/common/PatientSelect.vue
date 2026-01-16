<template>
  <div class="form-section dark:bg-gray-800">
    <div class="form-header">
      <div class="flex items-center space-x-2">
        <UserCircle class="w-5 h-5 text-primary-500" />
        <h4 class="form-title dark:text-white">Patient</h4>
      </div>
    </div>
    <div class="form-content">
      <div class="form-group">
        <label class="form-label required dark:text-gray-300">Patient</label>
        <div class="flex space-x-3">
          <div class="flex-1 relative">
            <input 
              type="text"
              v-model="localPatientName"
              class="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Nom du patient"
              @input="debouncedHandlePatientInput"
              @focus="showResults = true"
              required
            />
            
            <!-- Liste des résultats de recherche -->
            <div v-if="showResults && filteredResults.length > 0" 
                 class="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
              <div v-for="result in filteredResults" 
                   :key="result._id"
                   @click="handleSelect(result)"
                   class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ result.utilisateur?.nom }} {{ result.utilisateur?.prenom }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  ID: {{ result._id }}
                </div>
              </div>
            </div>
            
            <!-- Message si aucun résultat -->
            <div v-if="showResults && noResults" 
                 class="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
              <span class="text-gray-500 dark:text-gray-400">Aucun patient trouvé</span>
            </div>
            
            <!-- Indicateur de chargement -->
            <div v-if="isSearching" 
                 class="absolute right-3 top-2.5">
              <Loader2 class="w-5 h-5 animate-spin text-gray-400" />
            </div>
          </div>
          <button 
            type="button"
            class="btn btn-secondary flex items-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
            @click="showSearch = true"
          >
            <Search class="w-4 h-4 mr-2" />
            Rechercher
          </button>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Saisissez le nom ou utilisez la recherche
        </p>
      </div>
    </div>

    <!-- Modal de recherche patient -->
    <PatientSearchModal
      v-if="showSearch"
      @close="showSearch = false"
      @select="handleSelect"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { UserCircle, Search, Loader2 } from 'lucide-vue-next'
import PatientSearchModal from '@/components/PatientSearchModal.vue'
import { usePatientStore } from '@/stores/patientStore'

const patientStore = usePatientStore()
const showSearch = ref(false)
const localPatientName = ref('')
const searchResults = ref([])
const cachedResults = ref([]) // Mise en cache locale
const showResults = ref(false)
const isSearching = ref(false)
const searchTimeout = ref(null)
const lastSearchQuery = ref('')

const emit = defineEmits(['update:modelValue', 'select'])

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      _id: null,
      nom: '',
      prenom: '',
      dateNaissance: null,
      utilisateur: null
    })
  }
})

// Résultats filtrés localement pour une réactivité immédiate
const filteredResults = computed(() => {
  const query = localPatientName.value.toLowerCase().trim();
  
  // Si le texte est très court, ne montrer que les résultats mis en cache
  if (query.length < 2) {
    return cachedResults.value.slice(0, 10);
  }
  
  // Filtrer d'abord parmi les résultats en cache
  const localMatches = cachedResults.value.filter(patient => {
    const nom = patient.utilisateur?.nom?.toLowerCase() || '';
    const prenom = patient.utilisateur?.prenom?.toLowerCase() || '';
    const fullName = `${nom} ${prenom}`.trim();
    return fullName.includes(query);
  });
  
  // Si nous avons des résultats en cache qui correspondent, les retourner
  if (localMatches.length > 0) {
    return localMatches.slice(0, 10);
  }
  
  // Sinon retourner les résultats de la recherche API
  return searchResults.value.slice(0, 10);
});

const noResults = computed(() => {
  return localPatientName.value.length >= 2 && 
         !isSearching.value && 
         filteredResults.value.length === 0;
})

watch(() => props.modelValue, (newVal) => {
  if (newVal?.utilisateur) {
    localPatientName.value = `${newVal.utilisateur.nom || ''} ${newVal.utilisateur.prenom || ''}`.trim()
  } else if (newVal?.nom && newVal?.prenom) {
    localPatientName.value = `${newVal.nom} ${newVal.prenom}`.trim()
  }
  
  // Si nous avons un patient sélectionné, l'ajouter au cache
  if (newVal?._id) {
    const existingIndex = cachedResults.value.findIndex(p => p._id === newVal._id);
    if (existingIndex === -1) {
      cachedResults.value.unshift({
        _id: newVal._id,
        utilisateur: newVal.utilisateur || { 
          nom: newVal.nom || '', 
          prenom: newVal.prenom || '' 
        }
      });
      
      // Limiter la taille du cache local
      if (cachedResults.value.length > 20) {
        cachedResults.value = cachedResults.value.slice(0, 20);
      }
    }
  }
}, { immediate: true })

// Fonction de debounce pour limiter les appels API
function debouncedHandlePatientInput() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  
  // Filtrage local immédiat
  const query = localPatientName.value.toLowerCase().trim();
  
  // Mise à jour du modèle avec les valeurs saisies
  const [nom = '', prenom = ''] = localPatientName.value.split(' ');
  emit('update:modelValue', {
    _id: null,
    utilisateur: {
      nom: nom,
      prenom: prenom
    }
  });
  
  // Si la requête est trop courte, ne pas effectuer de recherche API
  if (query.length < 2) {
    isSearching.value = false;
    return;
  }
  
  // Si la requête est identique à la dernière requête, ne pas effectuer de recherche API
  if (query === lastSearchQuery.value) {
    showResults.value = true;
    return;
  }
  
  isSearching.value = true;
  
  // Attendre 500ms avant de lancer la requête API
  searchTimeout.value = setTimeout(async () => {
    try {
      lastSearchQuery.value = query;
      const results = await patientStore.searchPatients(query);
      searchResults.value = results;
      
      // Ajouter les nouveaux résultats au cache local s'ils n'y sont pas déjà
      results.forEach(patient => {
        const existingIndex = cachedResults.value.findIndex(p => p._id === patient._id);
        if (existingIndex === -1) {
          cachedResults.value.push(patient);
        }
      });
      
      showResults.value = true;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 500); // Augmenter le délai à 500ms pour réduire les appels API fréquents
}

// Écouteur pour fermer les résultats lors du clic à l'extérieur
function handleClickOutside(event) {
  const container = document.querySelector('.form-group.relative');
  if (container && !container.contains(event.target)) {
    showResults.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  
  // Chargement initial des patients récents si disponible
  const recentPatientsJSON = localStorage.getItem('recentPatients');
  if (recentPatientsJSON) {
    try {
      const recentPatients = JSON.parse(recentPatientsJSON);
      cachedResults.value = recentPatients;
    } catch (e) {
      console.error('Erreur lors du chargement des patients récents:', e);
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
})

async function handlePatientInput() {
  debouncedHandlePatientInput();
}

function handleSelect(patient) {
  console.log('Selected patient:', patient);
  
  const utilisateur = patient.utilisateur || { 
    nom: patient.nom || '', 
    prenom: patient.prenom || '' 
  };
  
  const updatedPatient = {
    _id: patient._id,
    dossier_id: patient.dossiers_medicaux?.[0]?._id || null,
    utilisateur: utilisateur
  };
  
  emit('update:modelValue', updatedPatient);
  
  localPatientName.value = `${utilisateur.nom} ${utilisateur.prenom}`.trim();
  
  emit('select', updatedPatient);
  showSearch.value = false;
  showResults.value = false;
  
  // Ajouter le patient sélectionné au début du cache pour un accès rapide
  const existingIndex = cachedResults.value.findIndex(p => p._id === patient._id);
  if (existingIndex !== -1) {
    // Si le patient existe déjà, le déplacer au début
    const existingPatient = cachedResults.value.splice(existingIndex, 1)[0];
    cachedResults.value.unshift(existingPatient);
  } else {
    // Sinon, l'ajouter au début
    cachedResults.value.unshift(patient);
  }
  
  // Limiter la taille du cache et sauvegarder dans localStorage
  if (cachedResults.value.length > 20) {
    cachedResults.value = cachedResults.value.slice(0, 20);
  }
  
  // Sauvegarder les patients récents dans localStorage
  try {
    localStorage.setItem('recentPatients', JSON.stringify(cachedResults.value));
  } catch (e) {
    console.error('Erreur lors de la sauvegarde des patients récents:', e);
  }
}
</script>