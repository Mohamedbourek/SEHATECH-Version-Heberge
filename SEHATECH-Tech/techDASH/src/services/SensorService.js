import axios from 'axios';

// Configuration de l'URL de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Service pour gérer les interactions avec l'API des capteurs
 */
export default {
  /**
   * Récupère toutes les données de capteurs
   * @returns {Promise} Données de tous les capteurs et statistiques
   */
  async getAllSensors() {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensors`);
      console.log('Réponse brute de l\'API des capteurs:', response.data);
      
      // Si la réponse est déjà au format {sensors: [], stats: {}}
      if (response.data && response.data.sensors !== undefined) {
        return response.data;
      }
      
      // Si la réponse est un tableau de capteurs directement
      if (Array.isArray(response.data)) {
        return {
          sensors: response.data,
          stats: this.calculateStats(response.data)
        };
      }
      
      // Si la réponse est un objet avec des capteurs par type
      if (response.data && typeof response.data === 'object') {
        // Convertir l'objet en tableau de capteurs
        const sensorsArray = [];
        Object.entries(response.data).forEach(([type, data]) => {
          if (typeof data === 'object') {
            sensorsArray.push({
              ...data,
              type: type
            });
          }
        });
        
        return {
          sensors: sensorsArray,
          stats: this.calculateStats(sensorsArray)
        };
      }
      
      // Format par défaut si aucun des formats ci-dessus n'est détecté
      return {
        sensors: [],
        stats: {
          activeSensors: 0,
          activeAlerts: 0,
          availability: 0,
          responseTime: 150,
          sensorsTrend: 'stable'
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données des capteurs:', error);
      throw error;
    }
  },

  /**
   * Calcule les statistiques à partir des données des capteurs
   * @param {Array} sensors - Tableau de capteurs
   * @returns {Object} Statistiques calculées
   */
  calculateStats(sensors) {
    // Compter les capteurs actifs (mise à jour récente)
    const activeSensors = Array.isArray(sensors) ? 
      sensors.filter(s => s.lastUpdate && new Date(s.lastUpdate) > new Date(Date.now() - 5 * 60 * 1000)).length : 0;
    
    // Compter les alertes actives
    const activeAlerts = Array.isArray(sensors) ? 
      sensors.filter(s => s.status === 'warning' || s.status === 'error' || s.detected === true).length : 0;
    
    return {
      activeSensors,
      activeAlerts,
      availability: 95, // Valeur estimée
      responseTime: 150, // ms
      sensorsTrend: 'stable',
      alertsTrend: activeAlerts > 0 ? 'up' : 'stable'
    };
  },

  /**
   * Récupère les données d'un capteur spécifique
   * @param {string} sensorId - Identifiant du capteur
   * @returns {Promise} Données détaillées du capteur
   */
  async getSensor(sensorId) {
    try {
      // Ajouter un timestamp à la requête pour éviter la mise en cache
      const timestamp = new Date().getTime();
      const response = await axios.get(`${API_BASE_URL}/sensors/${sensorId}?t=${timestamp}`);
      console.log(`Réponse de l'API pour le capteur ${sensorId}:`, response.data);
      
      // Retourner les données telles quelles pour un traitement ultérieur
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du capteur ${sensorId}:`, error);
      
      // Essayer de récupérer tous les capteurs et filtrer
      try {
        const allSensors = await this.getAllSensors();
        if (allSensors && allSensors.sensors && allSensors.sensors.length > 0) {
          const sensor = allSensors.sensors.find(s => s.id === sensorId);
          if (sensor) {
            return sensor;
          }
        }
      } catch (e) {
        console.error('Erreur lors de la tentative de récupération alternative:', e);
      }
      
      throw error;
    }
  },

  /**
   * Transforme les données brutes d'un capteur en format utilisable
   * @param {Object} sensorData - Données brutes du capteur
   * @returns {Object} Données formatées
   */
  formatSensorData(sensorData) {
    if (!sensorData) return {};
    
    // Adaptation des données Arduino au format attendu
    // Exemple : { "t": 25.0, "timestamp": "123456789" } => { currentValue: 25.0, ... }
    let currentValue = sensorData.currentValue;
    let historyData = sensorData.history || [];
    
    // Format Arduino température
    if (sensorData.t !== undefined) {
      currentValue = parseFloat(sensorData.t);
    } 
    // Format Arduino humidité
    else if (sensorData.h !== undefined) {
      currentValue = parseFloat(sensorData.h);
    }
    // Format Arduino gaz
    else if (sensorData.ga !== undefined) {
      currentValue = parseInt(sensorData.ga);
    }
    
    // Détection pour les capteurs binaires
    let detected = sensorData.detected || false;
    
    // Format Arduino flamme ou gaz (détection)
    if (sensorData.fd !== undefined) {
      detected = sensorData.fd === 1;
    } else if (sensorData.gd !== undefined) {
      detected = sensorData.gd === 1;
    } else if (sensorData.v !== undefined) {
      detected = sensorData.v === 1;
    }
    
    // Statut déterminé à partir des seuils ou de la détection
    let status = sensorData.status || 'normal';
    if (detected) {
      status = 'alert';
    }
    
    // Si l'historique existe, s'assurer qu'il est au bon format
    if (Array.isArray(historyData) && historyData.length > 0 && typeof historyData[0] !== 'object') {
      // Transformer l'historique en tableau d'objets avec timestamp
      const now = new Date();
      historyData = historyData.map((value, index) => {
        const date = new Date(now);
        // Récent au début, ancien à la fin
        date.setSeconds(date.getSeconds() - (historyData.length - index) * 30);
        
        return {
          timestamp: date.toISOString(),
          value: value,
          status: this.getSensorStatusFromValue(sensorData.type || 'unknown', value)
        };
      });
    }
    
    return {
      ...sensorData,
      currentValue: currentValue !== undefined ? currentValue : (sensorData.currentValue || 0),
      detected: detected,
      status: status,
      // Utiliser l'historique transformé
      history: historyData,
      // Définit une tendance par défaut
      trend: sensorData.trend || 'stable',
      // Définit une variation par défaut
      variation: sensorData.variation || 0,
      // Définit des limites par défaut
      limits: sensorData.limits || { min: 0, max: 100 },
      // Garantir qu'il y a une date de dernière mise à jour
      lastUpdate: sensorData.lastUpdate || sensorData.timestamp || new Date().toISOString()
    };
  },

  /**
   * Détermine le statut d'un capteur en fonction de sa valeur et de son type
   * @param {string} sensorType - Type de capteur
   * @param {number} value - Valeur du capteur
   * @returns {string} Statut du capteur (normal, warning, error)
   */
  getSensorStatusFromValue(sensorType, value) {
    if (value === null || value === undefined) {
      return 'normal';
    }
    
    // Déterminer le statut en fonction du type de capteur
    switch (sensorType) {
      case 'temperature':
        if (value > 30) return 'error';
        if (value > 27 || value < 18) return 'warning';
        return 'normal';
        
      case 'humidity':
        if (value > 70 || value < 30) return 'warning';
        return 'normal';
        
      case 'gas':
        return value > 400 ? 'warning' : 'normal';
        
      case 'flame':
        return value < 800 ? 'error' : 'normal';
        
      case 'vibration':
        return value > 0 ? 'warning' : 'normal';
        
      default:
        return 'normal';
    }
  },

  /**
   * Récupère l'état de connexion actuel de l'Arduino
   * @returns {Promise<Object>} Informations sur l'état de l'Arduino
   */
  async getArduinoStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensors/status/arduino`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de l\'Arduino:', error);
      return {
        connected: false,
        last_seen: null,
        ip: null
      };
    }
  }
}; 