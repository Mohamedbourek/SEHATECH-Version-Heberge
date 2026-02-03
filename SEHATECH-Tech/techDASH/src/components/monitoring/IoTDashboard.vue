<template>
  <div class="space-y-6">
    <!-- En-tête avec statut de connexion -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div 
          class="w-3 h-3 rounded-full"
          :class="connectionStatus.color"
        ></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ connectionStatus.label }}
        </span>
      </div>
      <div class="flex items-center space-x-4">
        <select v-model="timeRange" class="form-select w-40">
          <option value="1h">Dernière heure</option>
          <option value="6h">6 heures</option>
          <option value="24h">24 heures</option>
          <option value="7d">7 jours</option>
        </select>
        <button 
          class="btn btn-outline btn-sm"
          @click="refreshData"
          :disabled="isRefreshing"
        >
          <RefreshCw 
            class="w-4 h-4 mr-2"
            :class="{ 'animate-spin': isRefreshing }"
          />
          Actualiser
        </button>
      </div>
    </div>

    <!-- Statistiques globales -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        title="Capteurs actifs"
        :value="stats.activeSensors"
        icon="Activity"
        :trend="stats.sensorsTrend"
        :percentage="stats.sensorsChange"
        color="blue"
      />
      <StatCard
        title="Alertes actives"
        :value="stats.activeAlerts"
        icon="AlertTriangle"
        :trend="stats.alertsTrend"
        :percentage="stats.alertsChange"
        color="red"
      />
      <StatCard
        title="Taux de disponibilité"
        :value="`${stats.availability}%`"
        icon="CheckCircle"
        :trend="stats.availabilityTrend"
        :percentage="stats.availabilityChange"
        color="green"
      />
      <StatCard
        title="Temps de réponse"
        :value="`${stats.responseTime}ms`"
        icon="Zap"
        :trend="stats.responseTrend"
        :percentage="stats.responseChange"
        color="yellow"
      />
    </div>

    <!-- Grille des capteurs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="sensor in sensors" 
        :key="sensor.id"
        class="sensor-card"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <!-- En-tête du capteur -->
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div 
                class="p-2 rounded-lg"
                :class="statusClasses[sensor.status].bg"
              >
                <component 
                  :is="getSensorIcon(sensor)"
                  class="w-6 h-6"
                  :class="statusClasses[sensor.status].icon"
                />
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ sensor.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ sensor.equipment }}
                </p>
              </div>
            </div>
            <span 
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="statusClasses[sensor.status].badge"
            >
              {{ statusLabels[sensor.status] }}
            </span>
          </div>

          <!-- Valeur actuelle -->
          <div class="mt-4">
            <div class="flex items-baseline">
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ sensor.currentValue }}
              </p>
              <p class="ml-2 text-sm text-gray-500">
                {{ sensor.unit }}
              </p>
            </div>
            <div class="mt-1 flex items-center">
              <component 
                :is="getTrendIcon(sensor.trend)"
                class="w-4 h-4 mr-1"
                :class="getTrendColor(sensor.trend)"
              />
              <span 
                class="text-sm"
                :class="getTrendColor(sensor.trend)"
              >
                {{ sensor.variation }}%
              </span>
            </div>
          </div>

          <!-- Mini graphique -->
          <div class="mt-4 h-20">
            <SensorChart 
              :data="sensor.history"
              :color="getSensorChartColor(sensor.status)"
              :limits="sensor.limits"
            />
          </div>

          <!-- Dernière mise à jour -->
          <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div class="flex items-center">
              <Clock class="w-4 h-4 mr-1" />
              {{ formatDate(sensor.lastUpdate) }}
            </div>
            <button 
              class="btn btn-ghost btn-sm"
              @click="showDetails(sensor.id)"
            >
              Plus de détails
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucun capteur -->
    <div 
      v-if="sensors.length === 0"
      class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg"
    >
      <div class="flex justify-center">
        <Gauge class="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        Aucun capteur réel trouvé
      </h3>
      <p class="mt-2 text-gray-500">
        Vérifiez que l'API Backend est en cours d'exécution et que les capteurs sont connectés.
      </p>
      <div class="mt-4 flex justify-center">
        <button 
          @click="refreshData" 
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
          :disabled="isRefreshing"
        >
          {{ isRefreshing ? 'Actualisation...' : 'Réessayer' }}
        </button>
      </div>
    </div>

    <!-- Modal de détails -->
    <SensorDetailsModal
      v-if="selectedSensorId"
      :sensor-id="selectedSensorId"
      @close="selectedSensorId = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  RefreshCw, Gauge, Clock, TrendingUp,
  TrendingDown, Minus, Thermometer, Droplets, Flame, Activity, Wind
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import SensorChart from './SensorChart.vue'
import SensorDetailsModal from './SensorDetailsModal.vue'
import WebSocketService from '@/services/WebSocketService'

// États
const isRefreshing = ref(false)
const timeRange = ref('1h')
const selectedSensorId = ref(null)
const sensors = ref([]);
const sensorHistory = ref({
  temperature: [],
  humidity: [],
  gas: []
});
const stats = ref({
  activeSensors: 0,
  activeAlerts: 0,
  availability: 0,
  responseTime: 0,
  sensorsTrend: 'stable',
  alertsTrend: 'stable',
  availabilityTrend: 'stable',
  responseTrend: 'stable',
  sensorsChange: 0,
  alertsChange: 0,
  availabilityChange: 0,
  responseChange: 0
});
let updateInterval = null;
const lastUpdate = ref(null);
const dataAvailable = ref(false);

// Map des icônes par type de capteur
const sensorIcons = {
  'temperature': Thermometer,
  'humidity': Droplets,
  'flame': Flame,
  'gas': Wind,
  'vibration': Activity,
  'default': Gauge
};

// Classes et labels pour les statuts
const statusClasses = {
  normal: {
    bg: 'bg-green-100 dark:bg-green-900/50',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/50',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-900/50',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
}

const statusLabels = {
  normal: 'Normal',
  warning: 'Attention',
  error: 'Critique'
}

// Statut de connexion
const connectionStatus = computed(() => {
  if (isRefreshing.value) {
    return { label: 'Actualisation...', color: 'bg-yellow-500' };
  }
  
  if (dataAvailable.value) {
    return { label: 'Données disponibles', color: 'bg-green-500' };
  } else {
    return { label: 'Aucune donnée disponible', color: 'bg-red-500' };
  }
});

// Fonctions utilitaires
function formatDate(date) {
  if (!date) return '--:--:--';
  try {
    return format(new Date(date), 'HH:mm:ss', { locale: fr })
  } catch (e) {
    return '--:--:--';
  }
}

function getTrendIcon(trend) {
  return {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus
  }[trend] || Minus;
}

function getTrendColor(trend) {
  return {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400'
  }[trend] || 'text-gray-600 dark:text-gray-400';
}

function getSensorChartColor(status) {
  return {
    normal: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444'
  }[status] || '#22C55E';
}

function getSensorIcon(sensor) {
  const type = sensor.type;
  return sensorIcons[type] || sensorIcons.default;
}

// Gestionnaire d'événements WebSocket
function handleWebSocketUpdate(data) {
  // Mettre à jour les capteurs depuis WebSocketService
  updateSensorsFromWebSocket();
}

function updateSensorsFromWebSocket() {
  const wsState = WebSocketService.getState();
  
  // Mettre à jour les données des capteurs
  if (wsState.sensors && wsState.sensors.length > 0) {
    sensors.value = formatSensorsFromWs(wsState.sensors);
    dataAvailable.value = true;
    lastUpdate.value = wsState.lastUpdate || new Date();
    
    // Mettre à jour les statistiques en fonction des capteurs disponibles
    updateStats(wsState.sensors);
  } else {
    sensors.value = [];
    dataAvailable.value = false;
  }
}

// Mettre à jour les statistiques en fonction des capteurs
function updateStats(sensorData) {
  // Calculer le nombre de capteurs actifs
  stats.value.activeSensors = sensorData.length;
  
  // Calculer le nombre d'alertes actives (capteurs en état d'alerte)
  stats.value.activeAlerts = sensorData.filter(s => s.status === 'error').length;
  
  // Calculer le taux de disponibilité (capteurs en ligne)
  const totalSensors = sensorData.length;
  const availableSensors = sensorData.filter(s => s.timestamp && new Date(s.timestamp) > new Date(Date.now() - 60000)).length;
  stats.value.availability = totalSensors > 0 ? Math.round((availableSensors / totalSensors) * 100) : 0;
  
  // Simuler un temps de réponse (entre 50 et 200 ms)
  stats.value.responseTime = Math.floor(Math.random() * 150) + 50;
}

// Actions
async function refreshData() {
  isRefreshing.value = true;
  try {
    // Se connecter ou reconnecter au WebSocket
    if (!WebSocketService.getState().connected) {
      await WebSocketService.connect();
    }
    
    // Demander les données des capteurs
    WebSocketService.sendMessage({ type: 'get_sensors' });
    
    // Mettre à jour à partir des données WebSocket
    updateSensorsFromWebSocket();
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données via WebSocket:', error);
    sensors.value = [];
    dataAvailable.value = false;
  } finally {
    isRefreshing.value = false;
  }
}

// Convertir les données WebSocket en format utilisable par le composant
function formatSensorsFromWs(sensorsArray) {
  if (!sensorsArray || !Array.isArray(sensorsArray) || sensorsArray.length === 0) {
    return [];
  }
  
  return sensorsArray.map(sensorData => {
    return {
      id: sensorData.id || `sensor-${sensorData.type || 'unknown'}`,
      name: sensorData.name || `Capteur ${sensorData.type || 'inconnu'}`,
      equipment: sensorData.equipment || 'Salle capteurs',
      currentValue: typeof sensorData.currentValue === 'number' 
        ? sensorData.currentValue.toFixed(1) 
        : sensorData.currentValue || 0,
      unit: sensorData.unit || '',
      status: sensorData.status || 'normal',
      trend: sensorData.trend || 'stable',
      variation: sensorData.variation || 0,
      lastUpdate: sensorData.timestamp || new Date().toISOString(),
      history: sensorData.history || Array(100).fill(0),
      limits: sensorData.limits || { min: 0, max: 100 },
      type: sensorData.type || 'unknown'
    };
  });
}

async function showDetails(sensorId) {
  // Trouver le capteur sélectionné
  const selectedSensor = sensors.value.find(s => s.id === sensorId);
  
  if (selectedSensor) {
    selectedSensorId.value = sensorId;
    
    // Rechercher le composant SensorDetailsModal et lui passer les props
    // La réference au composant peut varier selon votre implémentation
    const modal = document.getElementById('sensor-details-modal');
    if (modal && modal.__vueParentComponent) {
      const component = modal.__vueParentComponent.ctx;
      if (component) {
        component.show = true;
        component.sensor = selectedSensor;
      }
    }
  }
}

// Mise à jour périodique
onMounted(async () => {
  // S'abonner aux événements WebSocket
  WebSocketService.addEventListener('sensor_update', handleWebSocketUpdate);
  WebSocketService.addEventListener('sensors_update', handleWebSocketUpdate);
  
  // Récupérer les données initiales
  await refreshData();
  
  // Configurer l'intervalle de mise à jour
  updateInterval = setInterval(() => {
    if (!isRefreshing.value) {
      updateSensorsFromWebSocket();
    }
  }, 1000); // Actualiser toutes les 1 seconde
});

onUnmounted(() => {
  // Nettoyer les timers et les écouteurs d'événements
  if (updateInterval) clearInterval(updateInterval);
  
  WebSocketService.removeEventListener('sensor_update', handleWebSocketUpdate);
  WebSocketService.removeEventListener('sensors_update', handleWebSocketUpdate);
});
</script>

<style scoped>
.sensor-card {
  @apply transition-transform duration-200 hover:transform hover:scale-105;
}

.form-select {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600
         shadow-sm focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:text-white;
}

.btn-ghost {
  @apply text-gray-500 hover:text-gray-700 dark:text-gray-400 
         dark:hover:text-gray-200;
}
</style> 