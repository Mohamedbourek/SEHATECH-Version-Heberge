import mqtt from 'mqtt'

class MQTTService {
  constructor() {
    this.client = null
    this.connected = false
    this.topics = []
    this.callbacks = {}
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.connectionStatus = {
      arduino: false,
      backend: false,
      lastArduinoUpdate: null,
      lastBackendUpdate: null
    }
    this.deviceInfo = {
      arduino: {
        id: null,
        ip: null,
        lastSeen: null
      }
    }
  }

  connect(brokerUrl = 'mqtt://localhost:1883', options = {}) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Tentative de connexion au broker MQTT:', brokerUrl)
        
        // Dans un environnement navigateur, utiliser mqtt:// pour se connecter
        // directement via TCP au lieu de WebSockets
        let correctedUrl = brokerUrl;
        
        // Le client Id devrait être unique pour chaque connexion
        const clientId = `techDASH_${Math.random().toString(16).substring(2, 10)}`
        console.log(`ID Client: ${clientId}`)
        
        // Afficher les informations de connexion
        console.log(`Configuration de connexion MQTT:
        - URL: ${correctedUrl}
        - ClientID: ${clientId}
        - Environnement: ${typeof window !== 'undefined' ? 'Navigateur' : 'Node.js'}`);
        
        const mqttOptions = {
          ...options,
          reconnectPeriod: 3000,
          connectTimeout: 5000,
          clientId: clientId,
          keepalive: 60,
          username: options.username || '',
          password: options.password || '',
          clean: true
        }
        
        this.client = mqtt.connect(correctedUrl, mqttOptions)

        this.client.on('connect', () => {
          console.log('Connecté au broker MQTT')
          this.connected = true
          this.reconnectAttempts = 0
          
          // Réabonnement aux topics précédents en cas de reconnexion
          if (this.topics.length > 0) {
            this.topics.forEach(topic => {
              this.client.subscribe(topic)
            })
          }
          
          // Publication de statut connecté
          this.publish('techDASH/status', JSON.stringify({
            clientId: clientId,
            status: 'online',
            timestamp: new Date().toISOString()
          }))
          
          resolve(true)
        })

        this.client.on('error', (error) => {
          console.error('Erreur de connexion MQTT:', error)
          this.reconnectAttempts++
          
          if (this.reconnectAttempts > this.maxReconnectAttempts) {
            console.error('Nombre maximal de tentatives de reconnexion atteint')
            reject(error)
          }
        })

        this.client.on('message', (topic, message) => {
          try {
            console.log(`Message reçu sur ${topic}:`, message.toString())
            
            let payload
            try {
              payload = JSON.parse(message.toString())
            } catch (e) {
              console.log('Message non-JSON reçu, tentative de traitement:', message.toString())
              // Pour les messages Arduino qui ne seraient pas en JSON
              const rawValue = message.toString().trim()
              
              // Tentative de conversion en nombres si approprié
              const numValue = parseFloat(rawValue)
              payload = !isNaN(numValue) ? { value: numValue } : { value: rawValue }
            }
            
            // Mise à jour du statut Arduino
            if (topic.startsWith('arduino/')) {
              this.connectionStatus.arduino = true
              this.connectionStatus.lastArduinoUpdate = new Date()
            }
            
            // Exécution des callbacks enregistrés pour ce topic
            if (this.callbacks[topic]) {
              this.callbacks[topic].forEach(callback => {
                callback(payload)
              })
            }
            
            // Gestion des wildcards (si nécessaire)
            Object.keys(this.callbacks).forEach(registeredTopic => {
              if (registeredTopic.includes('#') && this.topicMatchesWildcard(topic, registeredTopic)) {
                this.callbacks[registeredTopic].forEach(callback => {
                  callback(payload)
                })
              }
            })
          } catch (error) {
            console.error('Erreur de traitement du message MQTT:', error)
          }
        })

        this.client.on('disconnect', () => {
          console.log('Déconnecté du broker MQTT')
          this.connected = false
        })
        
        this.client.on('reconnect', () => {
          console.log('Tentative de reconnexion MQTT...')
        })
        
        this.client.on('offline', () => {
          console.log('Client MQTT hors ligne')
          this.connected = false
        })
      } catch (error) {
        console.error('Erreur lors de l\'initialisation MQTT:', error)
        reject(error)
      }
    })
  }
  
  topicMatchesWildcard(topic, wildcardTopic) {
    const topicParts = topic.split('/')
    const wildcardParts = wildcardTopic.split('/')
    
    if (wildcardParts.length > topicParts.length && wildcardParts[wildcardParts.length - 1] !== '#') {
      return false
    }
    
    for (let i = 0; i < wildcardParts.length; i++) {
      if (wildcardParts[i] === '#') {
        return true
      }
      
      if (wildcardParts[i] !== '+' && wildcardParts[i] !== topicParts[i]) {
        return false
      }
    }
    
    return topicParts.length === wildcardParts.length
  }

  subscribe(topic, callback) {
    console.log(`Tentative de s'abonner à ${topic}...`);
    
    if (!this.client || !this.connected) {
      console.warn(`Client MQTT non connecté (client: ${!!this.client}, connected: ${this.connected}). Impossible de s'abonner à ${topic}.`)
      return false
    }
    
    try {
      // Ajouter le topic à notre liste de topics si pas déjà présent
      if (!this.topics.includes(topic)) {
        this.topics.push(topic)
      }
      
      // Si aucun callback n'est fourni, on crée un callback par défaut
      if (!callback) {
        callback = (data) => {
          console.log(`Message reçu sur ${topic}:`, data)
        }
      }
      
      // Initialiser le tableau de callbacks pour ce topic si ce n'est pas déjà fait
      if (!this.callbacks[topic]) {
        this.callbacks[topic] = []
      }
      
      // Ajouter le callback à notre liste de callbacks pour ce topic
      this.callbacks[topic].push(callback)
      
      // S'abonner au topic avec QoS 0 (at most once)
      this.client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error(`Erreur lors de l'abonnement à ${topic}:`, err)
          return false
        }
        console.log(`Abonné au topic ${topic} avec succès`)
      })
      
      return true
    } catch (error) {
      console.error(`Erreur lors de l'abonnement à ${topic}:`, error)
      return false
    }
  }

  unsubscribe(topic) {
    if (!this.connected || !this.topics.includes(topic)) {
      return false
    }

    this.client.unsubscribe(topic, (err) => {
      if (err) {
        console.error(`Erreur lors du désabonnement du topic ${topic}:`, err)
        return
      }
      console.log(`Désabonné du topic: ${topic}`)
    })

    // Suppression du topic et des callbacks associés
    this.topics = this.topics.filter(t => t !== topic)
    delete this.callbacks[topic]

    return true
  }

  publish(topic, message) {
    if (!this.connected) {
      console.warn('Client MQTT non connecté. Impossible de publier.')
      return false
    }

    const payload = typeof message === 'object' ? JSON.stringify(message) : message

    this.client.publish(topic, payload, (err) => {
      if (err) {
        console.error(`Erreur lors de la publication sur le topic ${topic}:`, err)
        return false
      }
    })

    return true
  }

  disconnect() {
    if (this.client && this.connected) {
      // Publier un message de déconnexion
      if (this.client.connected) {
        this.publish('techDASH/status', JSON.stringify({
          clientId: this.client.options.clientId,
          status: 'offline',
          timestamp: new Date().toISOString()
        }))
      }
      
      this.client.end()
      this.connected = false
      this.topics = []
      this.callbacks = {}
      console.log('Déconnecté du broker MQTT')
    }
  }

  isConnected() {
    return this.connected
  }
  
  getConnectionStatus() {
    return this.connectionStatus
  }
  
  // Méthode pour vérifier si Arduino est en ligne
  isArduinoConnected() {
    // Si pas de mise à jour depuis plus de 15 secondes, considérer comme hors ligne
    if (!this.connectionStatus.lastArduinoUpdate) return false
    
    const timeoutMs = 15000 // 15 secondes
    return this.connectionStatus.arduino && 
           (new Date() - this.connectionStatus.lastArduinoUpdate) < timeoutMs
  }

  async testBrokerConnection(brokerUrl) {
    console.log(`Test de connexion au broker: ${brokerUrl}`)
    try {
      const client = mqtt.connect(brokerUrl, {
        connectTimeout: 5000,
        clientId: `test_${Math.random().toString(16).substring(2, 10)}`
      })
      
      return new Promise((resolve, reject) => {
        client.on('connect', () => {
          console.log(`✅ Connexion réussie à ${brokerUrl}`)
          client.end()
          resolve(true)
        })
        
        client.on('error', (err) => {
          console.error(`❌ Erreur de connexion à ${brokerUrl}:`, err)
          client.end()
          reject(err)
        })
        
        // Timeout après 5 secondes
        setTimeout(() => {
          client.end()
          reject(new Error(`Timeout de connexion à ${brokerUrl}`))
        }, 5000)
      })
    } catch (err) {
      console.error(`❌ Exception lors de la connexion à ${brokerUrl}:`, err)
      throw err
    }
  }

  async testBrokers() {
    const brokers = [
      'mqtt://localhost:1883',
      'mqtt://192.168.1.3:1883', // Adresse IP de l'Arduino
      'mqtt://broker.emqx.io:1883'
    ]
    
    const results = []
    
    for (const broker of brokers) {
      try {
        const success = await this.testBrokerConnection(broker)
        results.push({ broker, success, error: null })
      } catch (error) {
        results.push({ broker, success: false, error: error.message })
      }
    }
    
    return results
  }
}

// Exporter une instance unique du service
const mqttService = new MQTTService()
export default mqttService
