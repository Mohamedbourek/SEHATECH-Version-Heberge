import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import mqttService from '@/services/mqtt'
import SensorService from '@/services/SensorService'

export const useIotStore = defineStore('iot', () => {
  // État - utiliser reactive pour une meilleure réactivité
  const sensorData = reactive({
    temperature: {
      id: 'temp-sensor-1',
      name: 'Capteur de température',
      type: 'temperature',
      value: 0,
      unit: '°C',
      status: 'normal',
      lastUpdate: new Date().toISOString(),
      icon: 'Thermometer'
    },
    humidity: {
      id: 'hum-sensor-1',
      name: 'Capteur d\'humidité',
      type: 'humidity',
      value: 0,
      unit: '%',
      status: 'normal',
      lastUpdate: new Date().toISOString(),
      icon: 'Droplets'
    },
    gas: {
      id: 'gas-sensor-1',
      name: 'Capteur de gaz',
      type: 'gas',
      value: 0,
      detected: false,
      unit: 'ppm',
      status: 'normal',
      lastUpdate: new Date().toISOString(),
      icon: 'Wind'
    },
    flame: {
      id: 'flame-sensor-1',
      name: 'Détecteur de flamme',
      type: 'flame',
      value: 0,
      detected: false,
      status: 'normal',
      lastUpdate: new Date().toISOString(),
      icon: 'Flame'
    },
    vibration: {
      id: 'vibration-sensor-1',
      name: 'Détecteur de vibration',
      type: 'vibration',
      detected: false,
      status: 'normal',
      lastUpdate: new Date().toISOString(),
      icon: 'Activity'
    }
  })

  const sensorHistory = reactive({
    temperature: [],
    humidity: [],
    gas: []
  })

  const alerts = ref([])
  const isConnected = ref(false)
  const arduinoStatus = ref({
    connected: false,
    lastSeen: null
  })

  // Topics à utiliser pour correspondre aux topics Arduino
  const mqttTopics = [
    'arduino/sensors/temperature', // Données de température
    'arduino/sensors/humidity',    // Données d'humidité
    'arduino/sensors/gas',         // Données de gaz
    'arduino/sensors/flame',       // Données de flamme
    'arduino/sensors/vibration',   // Données de vibration
    'arduino/alerts'               // Alertes
  ]

  // Getters
  const sensorsByType = computed(() => sensorData)
  
  const activeSensors = computed(() => {
    return Object.values(sensorData).filter(sensor => 
      sensor.lastUpdate && 
      new Date(sensor.lastUpdate) > new Date(Date.now() - 5 * 60 * 1000)
    ).length
  })
  
  const activeAlerts = computed(() => alerts.value.length)
  
  const connectionStatus = computed(() => ({
    connected: isConnected.value,
    arduino: arduinoStatus.value.connected,
    lastArduinoUpdate: arduinoStatus.value.lastSeen
  }))
  
  // Actions
  function init() {
    console.log('Initialisation du module IoT')
    
    // Tenter de se connecter au MQTT
    connectToMQTT()
    
    // Configurer une mise à jour périodique
    const updateTimer = setInterval(() => {
      refreshSensorData()
    }, 1000) // Actualiser toutes les 1 seconde
    
    // Retourner une fonction de nettoyage
    return () => {
      clearInterval(updateTimer)
    }
  }

  async function connectToMQTT() {
    try {
      // Essayer prioritairement les brokers MQTT directs sans WebSockets
      const brokers = [
        'mqtt://192.168.1.3:1883',      // Serveur Arduino MQTT - prioritaire
        'mqtt://localhost:1883',        // Broker local - secondaire
        'mqtt://broker.emqx.io:1883'    // Broker public - fallback
      ]
      
      let connected = false
      let connectionErrors = []
      
      console.log('Tentative de connexion MQTT...');
      
      for (const broker of brokers) {
        try {
          console.log(`Tentative de connexion au broker MQTT: ${broker}`)
          await mqttService.connect(broker)
          connected = true
          console.log(`✅ Connexion réussie au broker: ${broker}`)
          break
        } catch (err) {
          console.warn(`❌ Échec de connexion au broker ${broker}:`, err)
          connectionErrors.push({ broker, error: err.message || 'Erreur inconnue' })
        }
      }
      
      if (!connected) {
        console.error('❌ Impossible de se connecter à aucun broker MQTT')
        console.error('Détails des erreurs:', connectionErrors)
        
        // Si nous n'avons pas pu nous connecter, essayer d'utiliser le broker public de secours
        try {
          console.log('🔄 Tentative de connexion au broker public de secours...')
          await mqttService.connect('mqtt://broker.emqx.io:1883')
          connected = true
          console.log('✅ Connexion réussie au broker public de secours')
        } catch (err) {
          console.error('❌ Échec de la connexion au broker public de secours:', err)
          throw new Error('Impossible de se connecter à aucun broker MQTT')
        }
      }
      
      isConnected.value = true
      console.log('Connexion MQTT établie')
      
      // Abonnement aux topics définis dans mqttTopics
      for (const topic of mqttTopics) {
        console.log(`Abonnement au topic MQTT: ${topic}`);
        try {
          mqttService.subscribe(topic, (data) => {
            console.log(`Données reçues sur ${topic}:`, data)
            
            // Traitement des données selon le topic
            if (topic.startsWith('arduino/sensors/')) {
              const sensorType = topic.split('/')[2]
              handleSensorData(sensorType, data)
            } else if (topic === 'arduino/alerts') {
              handleAlert(data)
            }
          })
        } catch (subscribeErr) {
          console.error(`Erreur lors de l'abonnement au topic ${topic}:`, subscribeErr)
        }
      }
      
      // Récupération des données initiales depuis l'API si disponible
      try {
        console.log('Récupération des données capteurs depuis l\'API...')
        const apiSensors = await SensorService.getAllSensors()
        if (apiSensors && apiSensors.data) {
          console.log('Données capteurs reçues de l\'API:', apiSensors.data)
          // Mise à jour des valeurs initiales si disponibles
          Object.keys(apiSensors.data).forEach(sensorType => {
            if (sensorData[sensorType]) {
              updateSensor(sensorType, SensorService.formatSensorData(apiSensors.data[sensorType]))
            }
          })
        }
      } catch (apiErr) {
        console.warn('Impossible de récupérer les données depuis l\'API:', apiErr)
        // Continuer l'exécution même si API inaccessible - on se basera uniquement sur MQTT
      }
      
      return true
    } catch (error) {
      console.error('Erreur de connexion MQTT', error)
      isConnected.value = false
      return false
    }
  }

  function handleSensorData(type, data) {
    console.log(`Traitement des données du capteur ${type}:`, data)
    
    if (!sensorData[type]) {
      console.warn(`Type de capteur inconnu: ${type}`)
      return
    }
    
    // Mise à jour du statut Arduino (car nous recevons des données)
    if (!arduinoStatus.value.connected) {
      arduinoStatus.value = {
        connected: true,
        lastSeen: new Date()
      }
    } else {
      arduinoStatus.value.lastSeen = new Date()
    }
    
    // Adapter selon le format de l'Arduino
    switch (type) {
      case 'temperature':
        // Format: {"t":25.0,"timestamp":"123456789"}
        if (data.t !== undefined) {
          const timestamp = data.timestamp ? new Date().toISOString() : new Date().toISOString();
          updateSensor(type, {
            value: parseFloat(data.t).toFixed(1),
            status: getSensorStatus(type, data.t),
            lastUpdate: timestamp
          })
          // Mise à jour de l'historique
          if (sensorHistory[type]) {
            if (sensorHistory[type].length >= 100) sensorHistory[type].shift()
            sensorHistory[type].push(parseFloat(data.t))
          }
        }
        break
        
      case 'humidity':
        // Format: {"h":45.0,"timestamp":"123456789"}
        if (data.h !== undefined) {
          const timestamp = data.timestamp ? new Date().toISOString() : new Date().toISOString();
          updateSensor(type, {
            value: parseFloat(data.h).toFixed(1),
            status: getSensorStatus(type, data.h),
            lastUpdate: timestamp
          })
          // Mise à jour de l'historique
          if (sensorHistory[type]) {
            if (sensorHistory[type].length >= 100) sensorHistory[type].shift()
            sensorHistory[type].push(parseFloat(data.h))
          }
        }
        break
        
      case 'gas':
        // Format: {"gd":0,"ga":100,"timestamp":"123456789"}
        if (data.ga !== undefined || data.gd !== undefined) {
          const gasDetected = data.gd === 1;
          const timestamp = data.timestamp ? new Date().toISOString() : new Date().toISOString();
          updateSensor(type, {
            value: data.ga !== undefined ? parseInt(data.ga) : sensorData[type].value,
            detected: gasDetected,
            status: gasDetected ? 'alert' : getSensorStatus(type, data.ga),
            lastUpdate: timestamp
          })
          // Mise à jour de l'historique
          if (sensorHistory[type] && data.ga !== undefined) {
            if (sensorHistory[type].length >= 100) sensorHistory[type].shift()
            sensorHistory[type].push(parseInt(data.ga))
          }
        }
        break
        
      case 'flame':
        // Format: {"fd":0,"fa":1000,"timestamp":"123456789"}
        if (data.fa !== undefined || data.fd !== undefined) {
          const flameDetected = data.fd === 1;
          const timestamp = data.timestamp ? new Date().toISOString() : new Date().toISOString();
          updateSensor(type, {
            value: data.fa !== undefined ? parseInt(data.fa) : sensorData[type].value,
            detected: flameDetected,
            status: flameDetected ? 'alert' : 'normal',
            lastUpdate: timestamp
          })
        }
        break
        
      case 'vibration':
        // Format: {"v":1,"timestamp":"123456789"}
        if (data.v !== undefined) {
          const vibDetected = data.v === 1;
          const timestamp = data.timestamp ? new Date().toISOString() : new Date().toISOString();
          updateSensor(type, {
            detected: vibDetected,
            status: vibDetected ? 'alert' : 'normal',
            lastUpdate: timestamp
          })
        }
        break
    }
    
    // Vérifier si on doit générer une alerte
    checkSensorAlert(type, sensorData[type].value, sensorData[type].detected)
  }
  
  function handleAlert(data) {
    console.log('Traitement de l\'alerte:', data)
    
    // Format d'alerte Arduino: {"alert":"temperature","value":30.5,"timestamp":"12345678"}
    const alert = {
      id: `alert-${Date.now()}`,
      timestamp: data.timestamp ? new Date().toISOString() : new Date().toISOString(),
      type: data.alert,
      label: getAlertLabel(data.alert),
      value: data.value,
      status: 'active',
      acknowledged: false
    }
    
    // Vérifier si l'alerte existe déjà
    const existingIndex = alerts.value.findIndex(a => a.type === alert.type && a.status === 'active')
    if (existingIndex >= 0) {
      // Mettre à jour l'alerte existante
      alerts.value[existingIndex] = {
        ...alerts.value[existingIndex],
        timestamp: alert.timestamp,
        value: alert.value
      }
    } else {
      // Ajouter une nouvelle alerte
      alerts.value.push(alert)
    }
    
    // Limiter le nombre d'alertes stockées
    if (alerts.value.length > 50) {
      // Garder les 50 alertes les plus récentes
      alerts.value = alerts.value.slice(-50)
    }
  }

  function updateSensor(type, data) {
    if (sensorData[type]) {
      Object.keys(data).forEach(key => {
        // Ne mettre à jour que si la valeur est définie
        if (data[key] !== undefined) {
          sensorData[type][key] = data[key]
        }
      })
      sensorData[type].lastUpdate = new Date().toISOString()
      console.log(`Capteur ${type} mis à jour:`, sensorData[type])
    } else {
      console.warn(`Type de capteur inconnu: ${type}`)
    }
  }

  function getSensorStatus(type, value) {
    if (value === undefined || value === null) return 'normal'
    
    const thresholds = {
      temperature: { min: 20, max: 25, criticalMin: 18, criticalMax: 28 },
      humidity: { min: 30, max: 60, criticalMin: 20, criticalMax: 70 },
      gas: { min: 0, max: 100, criticalMin: 0, criticalMax: 150 },
      sound: { min: 0, max: 60, criticalMin: 0, criticalMax: 75 }
    }
    
    if (!thresholds[type]) return 'normal'
    
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return 'normal'
    
    const { min, max, criticalMin, criticalMax } = thresholds[type]
    
    if (numValue < criticalMin || numValue > criticalMax) {
      return 'alert'
    } else if (numValue < min || numValue > max) {
      return 'warning'
    }
    
    return 'normal'
  }

  function getAlertLabel(type) {
    const alertLabels = {
      temperature: 'Température élevée',
      gas: 'Détection de gaz',
      flame: 'Détection de flamme',
      vibration: 'Vibration détectée',
      high_temperature: 'Température élevée',
      gas_detected: 'Détection de gaz',
      flame_detected: 'Détection de flamme',
      vibration_detected: 'Vibration détectée'
    }
    
    return alertLabels[type] || 'Alerte inconnue'
  }

  function checkSensorAlert(type, value, detected) {
    let shouldAlert = false
    let alertType = type
    let alertValue = value
    
    switch (type) {
      case 'temperature':
        shouldAlert = value > 28
        alertType = 'high_temperature'
        break
      case 'gas':
        shouldAlert = detected === true
        alertType = 'gas_detected'
        break
      case 'flame':
        shouldAlert = detected === true
        alertType = 'flame_detected'
        break
      case 'vibration':
        shouldAlert = detected === true
        alertType = 'vibration_detected'
        break
    }
    
    if (shouldAlert) {
      handleAlert({
        type: alertType,
        value: alertValue,
        timestamp: new Date().toISOString()
      })
    }
  }

  function refreshData() {
    // Si MQTT est connecté, rafraîchir l'état des connexions
    if (isConnected.value) {
      // Vérifier si Arduino est toujours connecté (timeout de 30s)
      if (arduinoStatus.value.lastSeen) {
        const lastSeenTime = new Date(arduinoStatus.value.lastSeen).getTime()
        const currentTime = Date.now()
        
        if (currentTime - lastSeenTime > 30000) { // 30 secondes
          arduinoStatus.value.connected = false
        }
      }
      
      // Tenter de se reconnecter si nécessaire
      if (!mqttService.isConnected()) {
        connectToMQTT()
      }
    } else {
      // Tenter de se connecter à MQTT
      connectToMQTT()
    }
  }
  
  function cleanup() {
    if (isConnected.value && mqttService.isConnected()) {
      mqttService.disconnect()
      isConnected.value = false
    }
  }

  function acknowledgeAlert(alertId) {
    const index = alerts.value.findIndex(a => a.id === alertId)
    if (index >= 0) {
      alerts.value[index].acknowledged = true
      alerts.value[index].status = 'acknowledged'
    }
  }
  
  function clearAlert(alertId) {
    alerts.value = alerts.value.filter(a => a.id !== alertId)
  }
  
  function clearAllAlerts() {
    alerts.value = []
  }

  async function testMQTTConnection() {
    try {
      const results = await mqttService.testBrokers()
      console.log('Résultats des tests de connexion MQTT:', results)
      return results
    } catch (error) {
      console.error('Erreur lors du test des brokers MQTT:', error)
      return []
    }
  }
  
  async function refreshSensorData() {
    try {
      console.log('Actualisation automatique des données des capteurs...')
      const response = await SensorService.getAllSensors()
      
      if (response && response.sensors && response.sensors.length > 0) {
        // Mise à jour du store avec les nouvelles données
        response.sensors.forEach(sensor => {
          if (sensor.type && sensorData[sensor.type]) {
            const formatted = SensorService.formatSensorData(sensor)
            updateSensor(sensor.type, formatted)
          }
        })
        console.log('Données capteurs mises à jour avec succès')
      }
      
      // Vérifier aussi le statut de l'Arduino
      const arduinoStatusResp = await SensorService.getArduinoStatus()
      if (arduinoStatusResp) {
        arduinoStatus.value = {
          connected: arduinoStatusResp.connected,
          lastSeen: arduinoStatusResp.last_seen
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'actualisation automatique des données:', error)
    }
  }

  return {
    // État
    sensorData,
    sensorHistory,
    alerts,
    isConnected,
    arduinoStatus,
    
    // Getters
    sensorsByType,
    activeSensors,
    activeAlerts,
    connectionStatus,
    
    // Actions
    init,
    connectToMQTT,
    refreshData,
    cleanup,
    acknowledgeAlert,
    clearAlert,
    clearAllAlerts,
    testMQTTConnection
  }
})
