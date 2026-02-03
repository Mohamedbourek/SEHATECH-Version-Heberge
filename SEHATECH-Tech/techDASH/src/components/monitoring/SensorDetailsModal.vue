<template>
  <BaseModal
    :title="sensor?.name || 'Détails du capteur'"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- En-tête avec statut -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div 
            class="p-3 rounded-lg"
            :class="statusClasses[sensor?.status || 'normal'].bg"
          >
            <Activity 
              class="w-6 h-6"
              :class="statusClasses[sensor?.status || 'normal'].icon"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500">ID: {{ sensor?.id }}</p>
            <p class="text-sm text-gray-500">Type: {{ sensor?.type }}</p>
          </div>
        </div>
        <span 
          class="px-3 py-1 text-sm font-medium rounded-full"
          :class="statusClasses[sensor?.status || 'normal'].badge"
        >
          {{ statusLabels[sensor?.status || 'normal'] }}
        </span>
      </div>

      <!-- Valeurs actuelles -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p class="text-sm text-gray-500">Valeur actuelle</p>
          <p class="mt-1 text-2xl font-semibold">
            {{ sensor?.currentValue }} {{ sensor?.unit }}
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p class="text-sm text-gray-500">Dernière mise à jour</p>
          <p class="mt-1 text-lg font-medium">
            {{ formatDate(sensor?.lastUpdate) }}
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p class="text-sm text-gray-500">Variation</p>
          <div class="mt-1 flex items-center">
            <component 
              :is="getTrendIcon(sensor?.trend)"
              class="w-5 h-5 mr-2"
              :class="getTrendColor(sensor?.trend)"
            />
            <span class="text-lg font-medium" :class="getTrendColor(sensor?.trend)">
              {{ sensor?.variation }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Graphique détaillé -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div class="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav class="flex -mb-px space-x-8">
            <button 
              @click="activeTab = 'details'"
              class="py-2 text-sm font-medium border-b-2 whitespace-nowrap"
              :class="activeTab === 'details' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700'"
            >
              Détails
            </button>
            <button 
              @click="activeTab = 'chart'"
              class="py-2 text-sm font-medium border-b-2 whitespace-nowrap"
              :class="activeTab === 'chart' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700'"
            >
              Graphique
            </button>
            <button 
              @click="activeTab = 'history'"
              class="py-2 text-sm font-medium border-b-2 whitespace-nowrap"
              :class="activeTab === 'history' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700'"
            >
              Historique
            </button>
          </nav>
        </div>

        <!-- Contenu des onglets -->
        <div v-if="activeTab === 'details'" class="space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Valeur minimale</p>
              <p class="font-medium">{{ historyStats.min }} {{ sensor?.unit }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Valeur maximale</p>
              <p class="font-medium">{{ historyStats.max }} {{ sensor?.unit }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Valeur moyenne</p>
              <p class="font-medium">{{ historyStats.avg }} {{ sensor?.unit }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Dernière mise à jour</p>
              <p class="font-medium">{{ formatDate(sensor?.lastUpdate) }}</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'chart'" class="h-64">
          <DetailedSensorChart 
            :data="sensor?.history || []"
            :color="getSensorChartColor(sensor?.status)"
            :limits="sensor?.limits"
          />
        </div>

        <div v-if="activeTab === 'history'" class="space-y-4">
          <div class="flex justify-end space-x-2 mb-2">
            <button 
              @click="exportHistory('csv')"
              class="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-800/50"
            >
              <Download class="w-3 h-3 inline-block mr-1" />
              Exporter CSV
            </button>
            <button 
              @click="exportHistory('json')"
              class="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-800/50"
            >
              <Download class="w-3 h-3 inline-block mr-1" />
              Exporter JSON
            </button>
          </div>
          <div class="max-h-64 overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Horodatage</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valeur</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(entry, index) in historyEntries" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">{{ formatDate(entry.timestamp) }}</td>
                  <td class="px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">{{ entry.value }} {{ sensor?.unit }}</td>
                  <td class="px-4 py-2">
                    <span 
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="statusClasses[entry.status || 'normal'].badge"
                    >
                      {{ statusLabels[entry.status || 'normal'] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Paramètres -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h3 class="text-lg font-medium mb-4">Paramètres</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Seuil minimal</p>
            <p class="mt-1 font-medium">
              {{ sensor?.limits.min }} {{ sensor?.unit }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Seuil maximal</p>
            <p class="mt-1 font-medium">
              {{ sensor?.limits.max }} {{ sensor?.unit }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Intervalle de mesure</p>
            <p class="mt-1 font-medium">
              {{ sensor?.interval || '30' }} secondes
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Précision</p>
            <p class="mt-1 font-medium">
              ± {{ sensor?.precision || '0.1' }} {{ sensor?.unit }}
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button 
          class="btn btn-outline"
          @click="downloadData"
        >
          <Download class="w-4 h-4 mr-2" />
          Exporter les données
        </button>
        <button 
          class="btn btn-primary"
          @click="configureAlerts"
        >
          <Bell class="w-4 h-4 mr-2" />
          Configurer les alertes
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Activity, TrendingUp, TrendingDown, Minus,
  Download, Bell
} from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import DetailedSensorChart from './DetailedSensorChart.vue'
import SensorService from '@/services/SensorService'

const props = defineProps({
  sensorId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

// État
const sensor = ref(null)
const isLoading = ref(false)
const activeTab = ref('details')  // Onglet actif par défaut
const refreshInterval = ref(null) // Pour stocker l'intervalle de rafraîchissement

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

// Données calculées pour l'historique
const historyEntries = computed(() => {
  if (!sensor.value || !Array.isArray(sensor.value.history)) {
    return [];
  }
  
  // Si l'historique est un tableau d'objets avec {timestamp, value, status}
  if (typeof sensor.value.history[0] === 'object') {
    // Trier les entrées par horodatage du plus récent au plus ancien
    return [...sensor.value.history].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }
  
  // Si l'historique est un simple tableau de valeurs
  const entries = sensor.value.history.map((value, index) => {
    // Créer des horodatages réels: le plus récent pour le dernier élément
    const date = new Date();
    // Le dernier élément du tableau a le timestamp le plus récent
    date.setSeconds(date.getSeconds() - (sensor.value.history.length - 1 - index) * 30);
    
    return {
      timestamp: date.toISOString(),
      value: value,
      status: determineStatus(value)
    };
  });
  
  // Inverser pour avoir le plus récent en premier
  return entries.reverse();
});

// Statistiques de l'historique
const historyStats = computed(() => {
  if (!historyEntries.value || historyEntries.value.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const values = historyEntries.value.map(entry => 
    typeof entry === 'object' ? entry.value : entry
  );
  
  const sum = values.reduce((acc, val) => acc + parseFloat(val || 0), 0);
  
  return {
    min: Math.min(...values).toFixed(1),
    max: Math.max(...values).toFixed(1),
    avg: (sum / values.length).toFixed(1)
  };
});

// Fonctions utilitaires
function formatDate(date) {
  if (!date) return '-'
  return format(new Date(date), 'PPp', { locale: fr })
}

function getTrendIcon(trend) {
  return {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus
  }[trend || 'stable']
}

function getTrendColor(trend) {
  return {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400'
  }[trend || 'stable']
}

function getSensorChartColor(status) {
  return {
    normal: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444'
  }[status || 'normal']
}

function determineStatus(value) {
  if (!sensor.value || !sensor.value.limits) return 'normal';
  
  const { min, max } = sensor.value.limits;
  
  if (value > max || value < min) {
    return 'error';
  } else if (value > max * 0.8 || value < min * 1.2) {
    return 'warning';
  }
  
  return 'normal';
}

// Actions
function exportHistory(format) {
  if (!sensor.value || !historyEntries.value) return;
  
  if (format === 'csv') {
    // Créer un CSV avec les données d'historique
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Horodatage,Valeur,Statut\n" 
      + historyEntries.value.map(entry => {
        return `"${entry.timestamp}",${entry.value},"${entry.status}"`;
      }).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `capteur_${sensor.value.id}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
  } else if (format === 'json') {
    // Créer un JSON avec les données d'historique
    const jsonContent = "data:text/json;charset=utf-8," 
      + JSON.stringify({
        sensor_id: sensor.value.id,
        sensor_type: sensor.value.type,
        unit: sensor.value.unit,
        data: historyEntries.value
      }, null, 2);
      
    const encodedUri = encodeURI(jsonContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `capteur_${sensor.value.id}_${new Date().toISOString()}.json`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
  }
}

function downloadData() {
  exportHistory('csv');
}

function configureAlerts() {
  // Implémenter la configuration des alertes
  console.log('Configuring alerts for sensor:', props.sensorId);
}

// Chargement des données depuis l'API
async function loadSensorData() {
  isLoading.value = true;
  try {
    // Récupérer les données du capteur via SensorService
    const response = await SensorService.getSensor(props.sensorId);
    console.log('Réponse API capteur spécifique:', response);
    
    // La structure peut être différente entre getAllSensors et getSensor
    // Vérifier les deux possibilités
    let sensorData = null;
    
    if (response && response.data) {
      // Format {data: {...}}
      sensorData = response.data;
    } else if (response && typeof response === 'object') {
      // Format direct de l'objet capteur
      sensorData = response;
    }
    
    if (sensorData) {
      // Formater les données pour l'affichage
      const formattedData = SensorService.formatSensorData(sensorData);
      
      sensor.value = {
        id: props.sensorId,
        name: formattedData.name || 'Capteur',
        type: formattedData.type || 'Inconnu',
        status: formattedData.status || 'normal',
        currentValue: formattedData.currentValue,
        unit: formattedData.unit || '',
        lastUpdate: formattedData.lastUpdate || new Date(),
        trend: formattedData.trend || 'stable',
        variation: formattedData.variation || 0,
        history: formattedData.history || Array(100).fill(0),
        limits: formattedData.limits || {
          min: 0,
          max: 100
        },
        interval: formattedData.interval || 30,
        precision: formattedData.precision || 0.1
      };
    } else {
      // Aucune donnée disponible
      console.warn('Aucune donnée réelle disponible pour ce capteur');
      emit('close'); // Fermer le modal
      alert('Aucune donnée réelle n\'est disponible pour ce capteur.');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des détails du capteur:', error);
    emit('close'); // Fermer le modal
    alert('Erreur lors de la récupération des données réelles du capteur.');
  } finally {
    isLoading.value = false;
  }
}

// Configuration de l'auto-rafraîchissement
function setupAutoRefresh() {
  // Rafraîchir les données toutes les 5 secondes
  refreshInterval.value = setInterval(async () => {
    await loadSensorData();
  }, 5000);
}

// Nettoyage de l'intervalle lors de la fermeture du composant
onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

// Chargement des données
onMounted(async () => {
  await loadSensorData();
  setupAutoRefresh();
});
</script> 