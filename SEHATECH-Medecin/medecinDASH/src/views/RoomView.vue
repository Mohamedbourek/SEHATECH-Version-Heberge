<template>
  <div class="p-6">
    <header class="mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Chambres</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ chambreStore.chambres.length }} chambres sous surveillance
          </p>
        </div>
        <div class="flex items-center gap-4">
          <button 
            @click="chambreStore.toggleAllCameras"
            class="btn-primary flex items-center gap-2"
          >
            <Video v-if="!chambreStore.areAllCamerasActive" class="w-5 h-5" />
            <VideoOff v-else class="w-5 h-5" />
            {{ chambreStore.areAllCamerasActive ? 'Désactiver toutes les caméras' : 'Activer toutes les caméras' }}
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="mt-4 flex gap-4">
        <select v-model="filterEtat" class="form-select">
          <option value="all">Toutes les chambres</option>
          <option value="occupee">Occupées</option>
          <option value="disponible">Disponibles</option>
          <option value="maintenance">En maintenance</option>
          <option value="nettoyage">En nettoyage</option>
        </select>
        
        <select v-model="filterType" class="form-select">
          <option value="all">Tous les types</option>
          <option value="simple">Simple</option>
          <option value="double">Double</option>
          <option value="suite">Suite</option>
          <option value="soins_intensifs">Soins intensifs</option>
          <option value="technique">Technique</option>
        </select>
        
        <select v-model="filterService" class="form-select">
          <option value="all">Tous les services</option>
          <option v-for="service in availableServices" :key="service" :value="service">
            {{ service }}
          </option>
        </select>
        
        <select v-model="filterCamera" class="form-select">
          <option value="all">Toutes les chambres</option>
          <option value="avec">Chambres avec caméra</option>
          <option value="sans">Chambres sans caméra</option>
        </select>
      </div>
    </header>

    <!-- Indicateur de chargement -->
    <div v-if="chambreStore.isLoading" class="flex justify-center items-center py-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="chambreStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
      <strong class="font-bold">Erreur!</strong>
      <span class="block sm:inline"> {{ chambreStore.error }}</span>
    </div>

    <!-- Statistiques d'occupation -->
    <div v-else-if="chambreStore.stats" class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total</h3>
        <p class="text-2xl font-bold">{{ chambreStore.stats.total }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Disponibles</h3>
        <p class="text-2xl font-bold text-green-600">{{ chambreStore.stats.disponibles }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Occupées</h3>
        <p class="text-2xl font-bold text-blue-600">{{ chambreStore.stats.occupees }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Maintenance</h3>
        <p class="text-2xl font-bold text-yellow-600">{{ chambreStore.stats.maintenance }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Nettoyage</h3>
        <p class="text-2xl font-bold text-purple-600">{{ chambreStore.stats.nettoyage }}</p>
      </div>
    </div>

    <!-- Grille des chambres -->
    <div v-if="!chambreStore.isLoading && filteredChambres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="chambre in filteredChambres" 
           :key="chambre._id" 
           class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
      >
        <!-- En-tête de la chambre -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Chambre {{ chambre.numero }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ chambreStore.formatType(chambre.type) }} - Étage {{ chambre.etage || '?' }}
                <span v-if="chambre.service" class="ml-1">- {{ chambre.service }}</span>
              </p>
            </div>
            <div :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              {
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': chambre.etat === 'disponible',
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': chambre.etat === 'occupee',
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': chambre.etat === 'maintenance',
                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400': chambre.etat === 'nettoyage'
              }
            ]">
              {{ chambreStore.formatEtat(chambre.etat) }}
            </div>
          </div>
        </div>
        
        <!-- Contenu de la chambre -->
        <div class="p-4">
          <!-- Caméra (uniquement pour les types de chambres qui en ont) -->
          <div v-if="chambreStore.hasCameraSupport(chambre.type)" class="mb-4">
            <div class="mb-2 flex justify-between items-center">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Surveillance vidéo</h4>
              <div class="text-xs px-2 py-1 rounded-full" :class="chambre.camerasActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'">
                {{ chambre.camerasActive ? 'Caméra active' : 'Caméra inactive' }}
              </div>
            </div>
            <RoomCamera 
              :key="'camera-' + chambre._id + '-' + (chambre.camerasActive ? 'active' : 'inactive')"
              :is-active="chambre.camerasActive"
              :room-number="chambre.numero"
            />
          </div>
          
          <!-- Équipements -->
          <div v-if="chambre.equipements && chambre.equipements.length > 0" class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Équipements</h4>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="(equipement, index) in chambre.equipements" 
                :key="index"
                class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs flex items-center"
              >
                <span v-if="typeof equipement === 'string'">{{ equipement }}</span>
                <span v-else-if="equipement.nom">{{ equipement.nom }}</span>
                <span v-else-if="equipement.name">{{ equipement.name }}</span>
                <span v-else>Équipement</span>
                
                <span 
                  v-if="equipement.statut || equipement.status" 
                  :class="[
                    'ml-1 w-2 h-2 rounded-full',
                    {
                      'bg-green-500': (equipement.statut || equipement.status) === 'fonctionnel',
                      'bg-yellow-500': (equipement.statut || equipement.status) === 'maintenance',
                      'bg-red-500': (equipement.statut || equipement.status) === 'défectueux'
                    }
                  ]"
                ></span>
              </span>
            </div>
          </div>
          
          <!-- Patients -->
          <div v-if="getPatientsForRoom(chambre._id).length > 0" class="space-y-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Patients hospitalisés</h4>
            <div 
              v-for="patient in getPatientsForRoom(chambre._id)" 
              :key="patient.id"
              class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">
                    {{ patient.nom }}
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Depuis {{ formatDate(patient.dateEntree) }}
                  </p>
                </div>
                <div class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {{ patient.motif || 'Hospitalisation' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Chambre vide -->
          <div v-else-if="chambre.etat !== 'maintenance' && chambre.etat !== 'nettoyage'" class="text-center py-6 text-gray-500 dark:text-gray-400">
            <p>Aucun patient</p>
          </div>
        </div>
        
        <!-- Actions de la chambre -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <button 
              v-if="chambreStore.hasCameraSupport(chambre.type)"
              @click="chambreStore.toggleRoomCamera(chambre._id)"
              class="btn btn-secondary flex items-center space-x-2"
            >
              <Video v-if="!chambre.camerasActive" class="w-4 h-4" />
              <VideoOff v-else class="w-4 h-4" />
              <span>{{ chambre.camerasActive ? 'Désactiver' : 'Activer' }} caméra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Message si aucune chambre trouvée -->
    <div v-else-if="!chambreStore.isLoading && filteredChambres.length === 0" class="text-center py-10">
      <p class="text-gray-500 dark:text-gray-400">Aucune chambre ne correspond aux critères de filtrage.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Video, VideoOff } from 'lucide-vue-next'
import RoomCamera from '@/components/RoomCamera.vue'
import { useChambreStore } from '@/stores/chambreStore'
import { usePatientStore } from '@/stores/patients'

// Utiliser les stores pour la gestion des chambres et des patients
const chambreStore = useChambreStore()
const patientStore = usePatientStore()

// Filtres locaux
const filterEtat = ref('all')
const filterType = ref('all')
const filterService = ref('all')
const filterCamera = ref('all')

// Filtrer les chambres selon les critères
const filteredChambres = computed(() => {
  return chambreStore.chambres.filter(chambre => {
    const matchEtat = filterEtat.value === 'all' || chambre.etat === filterEtat.value
    const matchType = filterType.value === 'all' || chambre.type === filterType.value
    const matchService = filterService.value === 'all' || chambre.service === filterService.value
    const matchCamera = filterCamera.value === 'all' || 
                        (chambreStore.hasCameraSupport(chambre.type) && filterCamera.value === 'avec') || 
                        (!chambreStore.hasCameraSupport(chambre.type) && filterCamera.value === 'sans')
    return matchEtat && matchType && matchService && matchCamera
  })
})

// Obtenir la liste des services disponibles
const availableServices = computed(() => {
  const services = chambreStore.chambres
    .map(chambre => chambre.service)
    .filter(service => service && service.trim() !== '')
  
  // Éliminer les doublons et trier par ordre alphabétique
  return [...new Set(services)].sort()
})

// Formater une date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  }).format(date)
}

// Obtenir les patients hospitalisés pour une chambre spécifique
const getPatientsForRoom = (chambre_id) => {
  return patientStore.getPatientsParChambre(chambre_id)
}

// Charger les données au montage du composant
onMounted(async () => {
  console.log('[RoomView] Chargement des données...');
  await chambreStore.fetchChambres();
  await chambreStore.fetchStats();
  await patientStore.fetchPatientsHospitalises();
  
  console.log('[RoomView] Données chargées');
  console.log('[RoomView] Nombre de chambres:', chambreStore.chambres.length);
  console.log('[RoomView] Chambres avec caméra:', chambreStore.chambresAvecCamera.length);
  
  // Afficher l'état des caméras pour le débogage
  chambreStore.chambres.forEach(chambre => {
    if (chambreStore.hasCameraSupport(chambre.type)) {
      console.log(`[RoomView] Chambre ${chambre.numero}: caméra ${chambre.camerasActive ? 'active' : 'inactive'}`);
    }
  });
})
</script>

<style scoped>
.btn-primary {
  @apply px-4 py-2 bg-primary-600 text-white rounded-lg 
         hover:bg-primary-700 transition-colors
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
         dark:focus:ring-offset-gray-900;
}

.form-select {
  @apply rounded-lg border-gray-300 dark:border-gray-700
         bg-white dark:bg-gray-800 
         text-gray-900 dark:text-white
         focus:ring-primary-500 focus:border-primary-500;
}

.btn-secondary {
  @apply px-3 py-2 bg-gray-100 dark:bg-gray-700 
         text-gray-700 dark:text-gray-300
         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600
         transition-colors duration-200;
}
</style> 