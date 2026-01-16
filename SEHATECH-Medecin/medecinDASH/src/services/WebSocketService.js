/**
 * Service WebSocket pour la connexion au pont MQTT Arduino
 * Permet la réception en temps réel des données des capteurs médicaux
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.eventListeners = {};
    this.sensors = [];
    this.arduinoStatus = {
      arduino1: { connected: false, lastSeen: null },
      arduino2: { connected: false, lastSeen: null }
    };
    this.lastUpdate = null;
    
    // URL WebSocket fixe pour Render
    this.websocketUrl = 'wss://sehatech-api.onrender.com/ws';
  }

  /**
   * Connexion au serveur WebSocket
   */
  async connect() {
    if (this.socket && this.connected) {
      console.log('WebSocket already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.websocketUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected to', this.websocketUrl);
          this.connected = true;
          this.reconnectAttempts = 0;
          this._emitEvent('connection', { status: 'connected' });
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          this.connected = false;
          this._emitEvent('connection', { status: 'disconnected' });
          
          if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this._attemptReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this._emitEvent('error', { error });
          reject(error);
        };

        this.socket.onmessage = (event) => {
          this._handleMessage(event);
        };
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Déconnexion du WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Envoi d'un message au serveur WebSocket
   * @param {Object} message - Message à envoyer
   */
  sendMessage(message) {
    if (!this.socket || !this.connected) {
      console.warn('Cannot send message, WebSocket not connected');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Ajout d'un écouteur d'événement
   * @param {String} eventName - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  addEventListener(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
  }

  /**
   * Suppression d'un écouteur d'événement
   * @param {String} eventName - Nom de l'événement
   * @param {Function} callback - Fonction de callback à supprimer
   */
  removeEventListener(eventName, callback) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName] = this.eventListeners[eventName].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Récupérer l'état actuel du service
   * @returns {Object} État du service
   */
  getState() {
    return {
      connected: this.connected,
      reconnecting: this.reconnecting,
      sensors: this.sensors,
      arduinoStatus: this.arduinoStatus,
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Récupération d'un capteur par ID
   * @param {String} sensorId - ID du capteur
   * @returns {Object|null} Capteur ou null
   */
  getSensorById(sensorId) {
    return this.sensors.find(sensor => sensor.id === sensorId) || null;
  }

  /**
   * Filtrage des capteurs par type
   * @param {String} type - Type de capteur
   * @returns {Array} Capteurs filtrés
   */
  getSensorsByType(type) {
    return this.sensors.filter(sensor => sensor.type === type);
  }

  /**
   * Envoi d'un événement à tous les écouteurs
   * @param {String} eventName - Nom de l'événement
   * @param {Object} data - Données de l'événement
   * @private
   */
  _emitEvent(eventName, data) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventName} event listener:`, error);
        }
      });
    }
  }

  /**
   * Tentative de reconnexion au WebSocket
   * @private
   */
  _attemptReconnect() {
    if (this.reconnecting) return;

    this.reconnecting = true;
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.reconnecting = false;
      this.connect().catch(error => {
        console.error('Reconnection attempt failed:', error);
      });
    }, this.reconnectInterval);
  }

  /**
   * Traitement des messages entrants
   * @param {MessageEvent} event - Événement message
   * @private
   */
  _handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.lastUpdate = new Date();

      // Traiter les différents types de messages
      if (data.type === 'initial_data') {
        if (data.sensors) {
          this._processSensorData(data.sensors);
        }
        if (data.arduino_status) {
          this.arduinoStatus = data.arduino_status;
          this._emitEvent('arduino_status', this.arduinoStatus);
        }
      } 
      else if (data.type === 'sensor_data' || data.type === 'sensors_update') {
        if (data.sensors) {
          this._processSensorData(data.sensors);
        }
      } 
      else if (data.type === 'sensor_update') {
        if (data.sensor_type && data.data) {
          this._updateSensor(data.sensor_type, data.data);
          this._emitEvent('sensor_update', { 
            type: data.sensor_type, 
            data: data.data,
            medical: data.medical || false
          });
        }
      } 
      else if (data.type === 'arduino_status') {
        this.arduinoStatus = {
          ...this.arduinoStatus,
          ...(data.arduino1 && { arduino1: data.arduino1 }),
          ...(data.arduino2 && { arduino2: data.arduino2 }),
          ...(data.arduino && { [`arduino${data.arduino}`]: { 
            connected: data.connected, 
            lastSeen: data.last_seen 
          }})
        };
        this._emitEvent('arduino_status', this.arduinoStatus);
      } 
      else if (data.type === 'alert') {
        this._emitEvent('alert', data);
      }
      
      // Émettre un événement générique pour tout message
      this._emitEvent('message', data);
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * Traitement des données de capteurs
   * @param {Object} sensorData - Données de capteurs
   * @private
   */
  _processSensorData(sensorData) {
    // Si c'est une liste, traiter chaque capteur
    if (Array.isArray(sensorData)) {
      this.sensors = sensorData.map(sensor => {
        return this._formatSensor(sensor);
      });
    } 
    // Si c'est un objet, traiter chaque clé comme un type de capteur
    else if (typeof sensorData === 'object') {
      this.sensors = Object.entries(sensorData)
        .filter(([_, value]) => Object.keys(value).length > 0)
        .map(([type, data]) => {
          return this._formatSensor({
            type,
            ...data
          });
        });
    }

    this._emitEvent('sensors_update', this.sensors);
  }

  /**
   * Format d'un capteur pour l'utilisation interne
   * @param {Object} sensor - Données brutes du capteur
   * @returns {Object} Capteur formaté
   * @private
   */
  _formatSensor(sensor) {
    return {
      id: sensor.id || `sensor-${sensor.type || 'unknown'}`,
      name: sensor.name || `Capteur ${sensor.type || 'inconnu'}`,
      type: sensor.type || 'unknown',
      currentValue: sensor.currentValue !== undefined ? sensor.currentValue : 0,
      unit: sensor.unit || '',
      status: sensor.status || 'normal',
      timestamp: sensor.timestamp || new Date().toISOString(),
      history: sensor.history || [],
      patient: sensor.patient || null
    };
  }

  /**
   * Mise à jour d'un capteur spécifique
   * @param {String} type - Type de capteur
   * @param {Object} data - Nouvelles données
   * @private
   */
  _updateSensor(type, data) {
    const sensorIndex = this.sensors.findIndex(s => s.type === type && s.id === data.id);
    
    if (sensorIndex >= 0) {
      this.sensors[sensorIndex] = {
        ...this.sensors[sensorIndex],
        ...data
      };
    } else {
      this.sensors.push(this._formatSensor({
        type,
        ...data
      }));
    }
  }
}

// Créer une instance unique du service
const webSocketService = new WebSocketService();

export default webSocketService; 