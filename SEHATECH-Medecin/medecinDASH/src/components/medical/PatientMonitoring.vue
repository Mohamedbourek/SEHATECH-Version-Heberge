<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <!-- En-tête avec informations de connexion et contrôles -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Monitoring médical en temps réel
        </h2>
        <div 
          class="px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1"
          :class="connectionStatus.class"
        >
          <div class="w-2 h-2 rounded-full" :class="connectionStatus.dotColor"></div>
          {{ connectionStatus.text }}
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          @click="refreshData" 
          class="btn btn-outline btn-sm flex items-center space-x-1"
          :disabled="isRefreshing"
        >
          <span 
            class="w-4 h-4"
            :class="{ 'animate-spin': isRefreshing }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 21h5v-5"></path>
            </svg>
          </span>
          <span>{{ isRefreshing ? 'Actualisation...' : 'Actualiser' }}</span>
        </button>
      </div>
    </div>

    <!-- Message quand aucune donnée -->
    <div v-if="!hasMedicalData" class="text-center py-8">
      <div class="flex justify-center mb-3">
        <!-- Icône pour le moniteur cardiaque -->
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
          <path d="M21 8h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2"></path>
          <path d="M3 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3"></path>
          <path d="M3 12h18"></path>
          <path d="m7 16 3-3.5 2 2.5 3-3.5 2 2"></path>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">
        Aucune donnée médicale disponible
      </h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ areMedicalSensorsConnected ? 
          'Aucun patient hospitalisé n\'est actuellement sous monitoring médical.' :
          'Les capteurs médicaux (Arduino 2) ne sont pas connectés au système.'
        }}
      </p>
      <button 
        @click="refreshData"
        class="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-all duration-200"
        :disabled="isRefreshing"
      >
        {{ isRefreshing ? 'Actualisation...' : 'Actualiser' }}
      </button>
    </div>

    <!-- Affichage des patients avec leurs capteurs -->
    <div v-else class="space-y-6">
      <!-- Carte pour chaque patient -->
      <div 
        v-for="patient in patientsWithSensors" 
        :key="patient.id"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
        :class="{
          'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30': patient.status === 'error',
          'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30': patient.status === 'warning',
          'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30': patient.status === 'normal'
        }"
      >
        <!-- En-tête avec informations du patient -->
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">{{ patient.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Chambre {{ patient.room || '--' }} · ID: {{ patient.id }}
              </p>
            </div>
          </div>
          <div 
            class="px-2.5 py-1 text-xs font-medium rounded-full"
            :class="getStatusClass(patient.status)"
          >
            {{ getStatusText(patient.status) }}
          </div>
        </div>

        <!-- Grille des capteurs pour ce patient -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Capteur rythme cardiaque -->
          <div 
            v-if="patient.sensors.heartrate"
            class="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 rounded-lg border border-red-100 dark:border-red-900/30 p-3 shadow-sm"
          >
            <div class="flex justify-between items-start mb-1">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 mr-1">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
                Fréquence cardiaque
              </h4>
              <div 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getStatusClass(patient.sensors.heartrate.status)"
              >
                {{ getStatusText(patient.sensors.heartrate.status) }}
              </div>
            </div>
            <div class="flex items-baseline space-x-1 mb-1">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatValue(patient.sensors.heartrate.currentValue) }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ patient.sensors.heartrate.unit }}
              </span>
            </div>
            <div class="h-12 mt-2 mb-1">
              <!-- Historique graphique -->
              <div class="w-full h-full flex items-end space-x-0.5">
                <div 
                  v-for="(value, index) in getHistoryValues(patient.sensors.heartrate, 15)"
                  :key="index"
                  class="flex-1 bg-red-500 dark:bg-red-600 rounded-t-sm transition-all duration-200"
                  :style="{ height: `${calculateBarHeight(value, 150, 50)}%` }"
                ></div>
              </div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatTime(patient.sensors.heartrate.timestamp) }}
            </div>
          </div>

          <!-- Capteur SpO2 -->
          <div 
            v-if="patient.sensors.spo2"
            class="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-lg border border-blue-100 dark:border-blue-900/30 p-3 shadow-sm"
          >
            <div class="flex justify-between items-start mb-1">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500 mr-1">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12a4.1 4.1 0 0 0 4 4 4.1 4.1 0 0 0 4-4 4.1 4.1 0 0 0-4-4 4.1 4.1 0 0 0-4 4"></path>
                  <line x1="7" x2="7.1" y1="7" y2="7"></line>
                  <line x1="17" x2="17.1" y1="7" y2="7"></line>
                </svg>
                Saturation (SpO2)
              </h4>
              <div 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getStatusClass(patient.sensors.spo2.status)"
              >
                {{ getStatusText(patient.sensors.spo2.status) }}
              </div>
            </div>
            <div class="flex items-baseline space-x-1 mb-1">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatValue(patient.sensors.spo2.currentValue) }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ patient.sensors.spo2.unit }}
              </span>
            </div>
            <div class="h-12 mt-2 mb-1">
              <!-- Historique graphique -->
              <div class="w-full h-full flex items-end space-x-0.5">
                <div 
                  v-for="(value, index) in getHistoryValues(patient.sensors.spo2, 15)"
                  :key="index"
                  class="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t-sm transition-all duration-200"
                  :style="{ height: `${calculateBarHeight(value, 100, 90)}%` }"
                ></div>
              </div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatTime(patient.sensors.spo2.timestamp) }}
            </div>
          </div>

          <!-- Capteur température -->
          <div 
            v-if="patient.sensors.temperature"
            class="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 rounded-lg border border-orange-100 dark:border-orange-900/30 p-3 shadow-sm"
          >
            <div class="flex justify-between items-start mb-1">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500 mr-1">
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
                </svg>
                Température
              </h4>
              <div 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getStatusClass(patient.sensors.temperature.status)"
              >
                {{ getStatusText(patient.sensors.temperature.status) }}
              </div>
            </div>
            <div class="flex items-baseline space-x-1 mb-1">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatValue(patient.sensors.temperature.currentValue) }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ patient.sensors.temperature.unit }}
              </span>
            </div>
            <div class="h-12 mt-2 mb-1">
              <!-- Historique graphique -->
              <div class="w-full h-full flex items-end space-x-0.5">
                <div 
                  v-for="(value, index) in getHistoryValues(patient.sensors.temperature, 15)"
                  :key="index"
                  class="flex-1 bg-orange-500 dark:bg-orange-600 rounded-t-sm transition-all duration-200"
                  :style="{ height: `${calculateBarHeight(value, 40, 35)}%` }"
                ></div>
              </div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatTime(patient.sensors.temperature.timestamp) }}
            </div>
          </div>

          <!-- Capteur humidité -->
          <div 
            v-if="patient.sensors.humidity"
            class="bg-gradient-to-br from-teal-50 to-white dark:from-teal-900/20 dark:to-gray-800 rounded-lg border border-teal-100 dark:border-teal-900/30 p-3 shadow-sm"
          >
            <div class="flex justify-between items-start mb-1">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-teal-500 mr-1">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
                Humidité
              </h4>
              <div 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getStatusClass(patient.sensors.humidity.status)"
              >
                {{ getStatusText(patient.sensors.humidity.status) }}
              </div>
            </div>
            <div class="flex items-baseline space-x-1 mb-1">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatValue(patient.sensors.humidity.currentValue) }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ patient.sensors.humidity.unit }}
              </span>
            </div>
            <div class="h-12 mt-2 mb-1">
              <!-- Historique graphique -->
              <div class="w-full h-full flex items-end space-x-0.5">
                <div 
                  v-for="(value, index) in getHistoryValues(patient.sensors.humidity, 15)"
                  :key="index"
                  class="flex-1 bg-teal-500 dark:bg-teal-600 rounded-t-sm transition-all duration-200"
                  :style="{ height: `${calculateBarHeight(value, 100, 0)}%` }"
                ></div>
              </div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatTime(patient.sensors.humidity.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import WebSocketService from '@/services/WebSocketService';

// Injecter le store des patients si disponible 
const patientStore = inject('patientStore', null);

// État local
const isRefreshing = ref(false);
const refreshTimer = ref(null);
const sensors = ref([]);

// Obtenir les patients avec capteurs
const patientsWithSensors = computed(() => {
  // Structure de données pour les patients avec leurs capteurs
  const patients = [];
  
  // S'il n'y a pas de capteurs, retourner un tableau vide
  if (!sensors.value || sensors.value.length === 0) {
    return patients;
  }
  
  // Extraire les patients uniques à partir des capteurs
  const patientIds = [...new Set(sensors.value
    .filter(s => s.patient)
    .map(s => s.patient))];
  
  // Pour chaque patient, regrouper ses capteurs
  patientIds.forEach(patientId => {
    // Essayer de trouver les informations du patient via le store
    let patientInfo = patientStore ? 
      patientStore.patientsHospitalises.find(p => p.id === patientId) : null;
    
    // Préparer les données du patient
    const patient = {
      id: patientId,
      name: patientInfo ? `${patientInfo.nom} ${patientInfo.prenom}` : `Patient ${patientId}`,
      room: patientInfo ? patientInfo.chambre : '--',
      status: 'normal', // Sera mis à jour en fonction des capteurs
      sensors: {}
    };
    
    // Ajouter les capteurs de ce patient
    sensors.value
      .filter(s => s.patient === patientId)
      .forEach(sensor => {
        if (sensor.type === 'heartrate') {
          patient.sensors.heartrate = sensor;
        } else if (sensor.type === 'spo2') {
          patient.sensors.spo2 = sensor;
        } else if (sensor.type === 'medical_temperature') {
          patient.sensors.temperature = sensor;
        } else if (sensor.type === 'medical_humidity') {
          patient.sensors.humidity = sensor;
        }
        
        // Mettre à jour le statut global du patient en fonction des capteurs
        if (sensor.status === 'error' && patient.status !== 'error') {
          patient.status = 'error';
        } else if (sensor.status === 'warning' && patient.status === 'normal') {
          patient.status = 'warning';
        }
      });
    
    // Ajouter le patient à la liste s'il a au moins un capteur
    if (Object.keys(patient.sensors).length > 0) {
      patients.push(patient);
    }
  });
  
  // Si aucun patient n'a été trouvé mais qu'il y a des capteurs sans patient associé
  // Créer un patient "Non assigné" pour ces capteurs
  const unassignedSensors = sensors.value.filter(s => !s.patient);
  if (unassignedSensors.length > 0) {
    const unassignedPatient = {
      id: 'unassigned',
      name: 'Non assigné',
      room: '--',
      status: 'normal',
      sensors: {}
    };
    
    unassignedSensors.forEach(sensor => {
      if (sensor.type === 'heartrate') {
        unassignedPatient.sensors.heartrate = sensor;
      } else if (sensor.type === 'spo2') {
        unassignedPatient.sensors.spo2 = sensor;
      } else if (sensor.type === 'medical_temperature') {
        unassignedPatient.sensors.temperature = sensor;
      } else if (sensor.type === 'medical_humidity') {
        unassignedPatient.sensors.humidity = sensor;
      }
      
      // Mettre à jour le statut global
      if (sensor.status === 'error' && unassignedPatient.status !== 'error') {
        unassignedPatient.status = 'error';
      } else if (sensor.status === 'warning' && unassignedPatient.status === 'normal') {
        unassignedPatient.status = 'warning';
      }
    });
    
    if (Object.keys(unassignedPatient.sensors).length > 0) {
      patients.push(unassignedPatient);
    }
  }
  
  return patients;
});

// Vérifier si des données médicales sont disponibles
const hasMedicalData = computed(() => {
  return patientsWithSensors.value.length > 0;
});

// Vérifier si les capteurs médicaux sont connectés
const areMedicalSensorsConnected = computed(() => {
  const state = WebSocketService.getState();
  return state.arduinoStatus && state.arduinoStatus.arduino2 && 
         state.arduinoStatus.arduino2.connected;
});

// Statut de la connexion
const connectionStatus = computed(() => {
  if (isRefreshing.value) {
    return {
      text: 'Connexion en cours...',
      class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      dotColor: 'bg-yellow-500'
    };
  }

  if (areMedicalSensorsConnected.value) {
    return {
      text: 'Capteurs connectés',
      class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      dotColor: 'bg-green-500'
    };
  } else if (hasMedicalData.value) {
    return {
      text: 'Données disponibles (hors ligne)',
      class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      dotColor: 'bg-orange-500'
    };
  } else {
    return {
      text: 'Capteurs déconnectés',
      class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      dotColor: 'bg-red-500'
    };
  }
});

// Formater la valeur d'un capteur
function formatValue(value) {
  if (value === undefined || value === null) return '--';
  if (typeof value === 'number') {
    return value.toFixed(1);
  }
  return value;
}

// Formater l'heure
function formatTime(timestamp) {
  if (!timestamp) return '--:--';
  try {
    return format(new Date(timestamp), 'HH:mm:ss', { locale: fr });
  } catch (error) {
    return '--:--';
  }
}

// Obtenir la classe CSS pour le statut
function getStatusClass(status) {
  switch (status) {
    case 'normal':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

// Obtenir le texte du statut
function getStatusText(status) {
  switch (status) {
    case 'normal': return 'Normal';
    case 'warning': return 'Attention';
    case 'error': return 'Critique';
    default: return 'Inconnu';
  }
}

// Obtenir les valeurs d'historique pour un capteur
function getHistoryValues(sensor, count) {
  if (!sensor || !sensor.history || !Array.isArray(sensor.history)) {
    return Array(count).fill(0);
  }
  
  // Prendre les dernières valeurs
  const values = sensor.history.slice(-count);
  
  // Si pas assez de valeurs, compléter avec des zéros
  if (values.length < count) {
    return [...Array(count - values.length).fill(0), ...values];
  }
  
  return values;
}

// Calculer la hauteur des barres pour le mini-graphique
function calculateBarHeight(value, max, min) {
  if (value === undefined || value === null) return 0;
  
  // Limiter la valeur entre min et max
  const limitedValue = Math.max(min, Math.min(max, value));
  
  // Calculer le pourcentage (entre 5% minimum et 100% maximum)
  return 5 + ((limitedValue - min) / (max - min)) * 95;
}

// Gestionnaire d'événements WebSocket
function handleWebSocketUpdate(data) {
  const wsState = WebSocketService.getState();
  
  // Filtrer uniquement les capteurs médicaux (ceux de l'Arduino 2)
  sensors.value = wsState.sensors.filter(sensor => {
    return ['heartrate', 'spo2', 'medical_temperature', 'medical_humidity'].includes(sensor.type);
  });
}

// Fonction pour actualiser les données
async function refreshData() {
  if (isRefreshing.value) return;
  
  isRefreshing.value = true;
  
  try {
    // Se connecter au WebSocket si nécessaire
    if (!WebSocketService.getState().connected) {
      await WebSocketService.connect();
    }
    
    // Demander une mise à jour de l'état de l'Arduino
    WebSocketService.sendMessage({ type: 'get_arduino_status' });
    
    // Demander les données des capteurs
    WebSocketService.sendMessage({ type: 'get_sensors' });
    
    // Demander spécifiquement les données pour les patients hospitalisés
    if (patientStore) {
      patientStore.patientsHospitalises.forEach(patient => {
        if (patient.id) {
          WebSocketService.sendMessage({ 
            type: 'get_patient_sensors', 
            patient_id: patient.id 
          });
        }
      });
    }
    
    // Mettre à jour depuis les données du WebSocketService
    handleWebSocketUpdate();
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données via WebSocket:', error);
  } finally {
    isRefreshing.value = false;
  }
}

// Mise à jour périodique
function setupPeriodicRefresh() {
  refreshTimer.value = setInterval(() => {
    if (!isRefreshing.value) {
      handleWebSocketUpdate();
    }
  }, 1000); // Actualiser toutes les secondes
}

onMounted(async () => {
  // S'abonner aux événements WebSocket
  WebSocketService.addEventListener('arduino_status', handleWebSocketUpdate);
  WebSocketService.addEventListener('sensor_update', handleWebSocketUpdate);
  WebSocketService.addEventListener('sensors_update', handleWebSocketUpdate);
  
  // Récupérer les données initiales
  await refreshData();
  
  // Configurer l'actualisation périodique
  setupPeriodicRefresh();
});

onUnmounted(() => {
  // Nettoyer les minuteries
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
  }
  
  // Nettoyer les écouteurs d'événements
  WebSocketService.removeEventListener('arduino_status', handleWebSocketUpdate);
  WebSocketService.removeEventListener('sensor_update', handleWebSocketUpdate);
  WebSocketService.removeEventListener('sensors_update', handleWebSocketUpdate);
});
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-md transition-colors duration-200;
}

.btn-outline {
  @apply border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-700;
}

.btn-sm {
  @apply px-3 py-1 text-sm;
}
</style> 