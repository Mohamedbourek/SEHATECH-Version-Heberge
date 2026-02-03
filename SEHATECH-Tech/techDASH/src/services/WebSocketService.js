import { reactive } from 'vue'

// Configuration WebSocket
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8765'

// État partagé
const state = reactive({
  socket: null,
  connected: false,
  reconnecting: false,
  sensors: [],
  arduinoStatus: {
    connected: false,
    lastSeen: null
  },
  lastUpdate: null,
  listeners: {}
})

/**
 * Service pour gérer les connexions WebSocket avec le bridge Python
 */
const WebSocketService = {
  /**
   * Se connecte au serveur WebSocket
   */
  connect() {
    if (state.socket && (state.socket.readyState === WebSocket.OPEN || state.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket déjà connecté ou en cours de connexion')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      console.log(`Tentative de connexion WebSocket à ${WS_URL}...`)
      state.reconnecting = true

      // Créer une nouvelle connexion WebSocket
      state.socket = new WebSocket(WS_URL)

      // Gestionnaire d'événement de connexion
      state.socket.onopen = () => {
        console.log('✅ Connexion WebSocket établie')
        state.connected = true
        state.reconnecting = false
        state.lastUpdate = new Date()
        this.requestInitialData()
        resolve()
      }

      // Gestionnaire d'événement de déconnexion
      state.socket.onclose = (event) => {
        console.log(`Connexion WebSocket fermée: ${event.code} - ${event.reason}`)
        state.connected = false
        
        if (!state.reconnecting) {
          // Tenter de se reconnecter après 3 secondes
          console.log('Tentative de reconnexion dans 3 secondes...')
          setTimeout(() => this.connect(), 3000)
        }
      }

      // Gestionnaire d'erreur
      state.socket.onerror = (error) => {
        console.error('Erreur WebSocket:', error)
        if (!state.connected) {
          reject(error)
        }
      }

      // Gestionnaire de messages
      state.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Erreur lors du traitement du message WebSocket:', error)
        }
      }
    })
  },

  /**
   * Se déconnecte du serveur WebSocket
   */
  disconnect() {
    if (state.socket) {
      state.socket.close()
      state.socket = null
      state.connected = false
    }
  },

  /**
   * Traite les messages reçus du serveur WebSocket
   */
  handleMessage(message) {
    // Mettre à jour l'horodatage de la dernière mise à jour
    state.lastUpdate = new Date()

    // Traiter différents types de messages
    switch (message.type) {
      case 'initial_data':
        console.log('Données initiales reçues:', message)
        if (message.sensors) {
          state.sensors = message.sensors
        }
        if (message.arduino_status) {
          state.arduinoStatus = {
            connected: message.arduino_status.connected,
            lastSeen: message.arduino_status.last_seen
          }
        }
        break

      case 'sensor_update':
        console.log(`Mise à jour du capteur ${message.sensor_type}:`, message.data)
        // Mettre à jour un capteur spécifique
        const sensorIndex = state.sensors.findIndex(s => s.type === message.sensor_type)
        if (sensorIndex >= 0) {
          state.sensors[sensorIndex] = message.data
        } else {
          state.sensors.push(message.data)
        }
        this.notifyListeners('sensor_update', message)
        break

      case 'sensors_update':
        console.log('Mise à jour de tous les capteurs:', message.sensors)
        if (message.sensors) {
          state.sensors = message.sensors
          this.notifyListeners('sensors_update', message)
        }
        break

      case 'arduino_status':
        console.log('Mise à jour du statut Arduino:', message)
        state.arduinoStatus = {
          connected: message.connected,
          lastSeen: message.last_seen
        }
        this.notifyListeners('arduino_status', message)
        break

      case 'alert':
        console.log('Alerte reçue:', message.data)
        this.notifyListeners('alert', message.data)
        break

      default:
        console.log('Message WebSocket non reconnu:', message)
    }
  },

  /**
   * Demande les données initiales au serveur
   */
  requestInitialData() {
    this.sendMessage({
      type: 'get_sensors'
    })
    
    this.sendMessage({
      type: 'get_arduino_status'
    })
  },

  /**
   * Envoie un message au serveur WebSocket
   */
  sendMessage(data) {
    if (state.connected && state.socket && state.socket.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify(data))
    } else {
      console.warn('Impossible d\'envoyer le message: WebSocket non connecté')
    }
  },

  /**
   * Ajoute un écouteur d'événements
   */
  addEventListener(event, callback) {
    if (!state.listeners[event]) {
      state.listeners[event] = []
    }
    state.listeners[event].push(callback)
  },

  /**
   * Supprime un écouteur d'événements
   */
  removeEventListener(event, callback) {
    if (state.listeners[event]) {
      state.listeners[event] = state.listeners[event].filter(cb => cb !== callback)
    }
  },

  /**
   * Notifie tous les écouteurs d'un événement
   */
  notifyListeners(event, data) {
    if (state.listeners[event]) {
      state.listeners[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Erreur dans un écouteur d'événement ${event}:`, error)
        }
      })
    }
  },

  /**
   * Récupère l'état actuel du service
   */
  getState() {
    return state
  },

  /**
   * Récupère toutes les données des capteurs
   */
  getAllSensors() {
    return state.sensors
  },

  /**
   * Récupère l'état de l'Arduino
   */
  getArduinoStatus() {
    return state.arduinoStatus
  }
}

export default WebSocketService 