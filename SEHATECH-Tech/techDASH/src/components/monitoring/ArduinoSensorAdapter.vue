<template>
  <div>
    <!-- Indicateur de connexion Arduino -->
    <div v-if="!showIndicatorOnly" class="mb-4 p-3 rounded-lg" :class="connectionClass">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" :class="connectionStatus.color"></div>
          <span class="text-sm font-medium">{{ connectionStatus.label }}</span>
        </div>
        <button 
          @click="refreshData" 
          class="text-xs px-2 py-1 rounded-full bg-white/20 hover:bg-white/30"
          :disabled="isRefreshing"
        >
          {{ isRefreshing ? 'Actualisation...' : 'Actualiser' }}
        </button>
      </div>
    </div>
    
    <!-- Composant enfant -->
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import WebSocketService from '@/services/WebSocketService'

const props = defineProps({
  showIndicatorOnly: {
    type: Boolean,
    default: false
  }
})

const isRefreshing = ref(false)
const updateTimer = ref(null)
const dataAvailable = ref(false)
const lastUpdate = ref(null)
const arduinoStatus = ref({
  connected: false,
  lastSeen: null
})

// Observer les changements d'état de WebSocketService
function updateFromWebSocketState() {
  const state = WebSocketService.getState()
  arduinoStatus.value = state.arduinoStatus
  dataAvailable.value = state.sensors.length > 0
  lastUpdate.value = state.lastUpdate
}

// Statut de connexion
const connectionStatus = computed(() => {
  if (isRefreshing.value) {
    return { 
      label: 'Récupération des données réelles...', 
      color: 'bg-yellow-500',
      connected: false
    }
  }
  
  if (arduinoStatus.value.connected) {
    return { 
      label: 'Arduino connecté', 
      color: 'bg-green-500',
      connected: true 
    }
  } else if (dataAvailable.value) {
    return { 
      label: 'Capteurs disponibles (Arduino hors ligne)', 
      color: 'bg-orange-500',
      connected: true 
    }
  } else {
    return { 
      label: 'Arduino non disponible - vérifiez la connexion', 
      color: 'bg-red-500',
      connected: false 
    }
  }
})

// Classe CSS pour le conteneur d'état
const connectionClass = computed(() => {
  if (arduinoStatus.value.connected) {
    return 'bg-green-600/10 border border-green-600/20 text-green-800 dark:text-green-200'
  } else if (isRefreshing.value) {
    return 'bg-yellow-600/10 border border-yellow-600/20 text-yellow-800 dark:text-yellow-200'
  } else if (dataAvailable.value) {
    return 'bg-orange-600/10 border border-orange-600/20 text-orange-800 dark:text-orange-200'
  } else {
    return 'bg-red-600/10 border border-red-600/20 text-red-800 dark:text-red-200'
  }
})

// Récupérer les données des capteurs via WebSocket
async function refreshData() {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  
  try {
    // Se connecter au WebSocket si nécessaire
    if (!WebSocketService.getState().connected) {
      await WebSocketService.connect()
    }
    
    // Demander une mise à jour de l'état de l'Arduino
    WebSocketService.sendMessage({ type: 'get_arduino_status' })
    
    // Demander les données des capteurs
    WebSocketService.sendMessage({ type: 'get_sensors' })
    
    // Mettre à jour le composant avec les données WebSocket
    updateFromWebSocketState()
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données via WebSocket:', error)
    dataAvailable.value = false
  } finally {
    isRefreshing.value = false
  }
}

// Gestionnaire d'événements WebSocket
function handleWebSocketUpdate(data) {
  updateFromWebSocketState()
}

// Vérification périodique des données
function setupPeriodicStatusCheck() {
  updateTimer.value = setInterval(() => {
    if (!isRefreshing.value) {
      updateFromWebSocketState()
    }
  }, 1000) // Vérifier toutes les 1 seconde
}

onMounted(async () => {
  // S'abonner aux événements WebSocket
  WebSocketService.addEventListener('arduino_status', handleWebSocketUpdate)
  WebSocketService.addEventListener('sensor_update', handleWebSocketUpdate)
  WebSocketService.addEventListener('sensors_update', handleWebSocketUpdate)
  
  // Se connecter au WebSocket et récupérer les données initiales
  await refreshData()
  
  // Configurer la vérification périodique
  setupPeriodicStatusCheck()
})

onUnmounted(() => {
  // Nettoyer les timers et les événements
  if (updateTimer.value) {
    clearInterval(updateTimer.value)
    updateTimer.value = null
  }
  
  // Supprimer les écouteurs d'événements
  WebSocketService.removeEventListener('arduino_status', handleWebSocketUpdate)
  WebSocketService.removeEventListener('sensor_update', handleWebSocketUpdate)
  WebSocketService.removeEventListener('sensors_update', handleWebSocketUpdate)
})
</script> 