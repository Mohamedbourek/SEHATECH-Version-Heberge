// Service d'intégration avec le service Python de reconnaissance faciale
import axios from 'axios';

// Récupérer l'URL du service de reconnaissance faciale depuis les variables d'environnement
const FACE_API_URL = import.meta.env.VITE_FACE_RECOGNITION_API || 'http://localhost:5001/api'

class FaceRecognitionService {
  constructor() {
    this.apiUrl = FACE_API_URL
    this.isConnected = false
    this.lastError = null
    
    // Vérifier la connexion au démarrage
    this.checkConnection();
  }
  
  /**
   * Vérifie la connexion avec le service de reconnaissance faciale
   */
  async checkConnection() {
    try {
      // Réduire le timeout pour éviter d'attendre trop longtemps
      const response = await axios.get(`${this.apiUrl}/status`, {
        timeout: 2000 // Timeout de 2 secondes pour une réponse plus rapide
      })
      this.isConnected = response.status === 200
      console.log('[FaceRecognitionService] Statut du service:', response.data)
      
      // Remettre à zéro l'erreur si la connexion est réussie
      if (this.isConnected) {
        this.lastError = null
      }
      
      return this.isConnected
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur de connexion:', error.message || error)
      this.isConnected = false
      this.lastError = error.message || 'Erreur de connexion inconnue'
      
      // Ajouter plus de détails sur l'erreur
      if (error.code === 'ECONNABORTED') {
        this.lastError = 'Timeout: le service ne répond pas dans le délai imparti'
      } else if (error.code === 'ERR_NETWORK') {
        this.lastError = 'Erreur réseau: le service n\'est pas accessible'
      } else if (error.response) {
        this.lastError = `Erreur HTTP ${error.response.status}: ${error.response.statusText}`
      }
      
      return false
    }
  }
  
  /**
   * Obtient le statut du service
   */
  async getStatus() {
    try {
      const response = await axios.get(`${this.apiUrl}/status`)
      return response.data
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la récupération du statut:', error)
      throw error
    }
  }
  
  /**
   * Prend un instantané de la caméra
   * @param {boolean} draw - Indique si la détection doit être dessinée sur l'image
   */
  async getSnapshot(draw = false) {
    try {
      const response = await axios.get(`${this.apiUrl}/camera/snapshot`, {
        params: { draw },
        responseType: 'blob'
      })
      return URL.createObjectURL(response.data)
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la prise d\'instantané:', error)
      throw error
    }
  }
  
  /**
   * Obtient l'URL du flux vidéo
   */
  async getStreamUrl() {
    try {
      const response = await axios.get(`${this.apiUrl}/camera/stream`)
      return response.data.stream_url
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la récupération de l\'URL du flux:', error)
      throw error
    }
  }
  
  /**
   * Détecte les visages dans une image avec retry en cas d'échec
   * @param {Blob|string} imageData - L'image sous forme de Blob ou de chaîne Base64
   * @param {boolean} draw - Indique si la détection doit être dessinée sur l'image
   * @param {number} retryCount - Le nombre de tentatives déjà effectuées (usage interne)
   */
  async detectFaces(imageData, draw = false, retryCount = 0) {
    try {
      const formData = new FormData()
      
      // Si imageData est un Blob, l'ajouter directement
      if (imageData instanceof Blob) {
        formData.append('image', imageData)
      } 
      // Si c'est une chaîne base64
      else if (typeof imageData === 'string') {
        formData.append('image_data', imageData)
      }
      
      const response = await axios.post(`${this.apiUrl}/faces/detect?draw=${draw}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 5000 // Timeout de 5 secondes
      })
      
      // Si on avait perdu la connexion et qu'elle est rétablie maintenant
      if (!this.isConnected) {
        this.isConnected = true
        console.log('[FaceRecognitionService] Connexion rétablie au service')
      }
      
      return response.data
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la détection des visages:', error)
      this.isConnected = false
      
      // Si c'est un timeout ou une erreur réseau et que nous n'avons pas dépassé le nombre max de tentatives
      if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && retryCount < 1) {
        console.log('[FaceRecognitionService] Nouvelle tentative de détection des visages...')
        return new Promise(resolve => {
          // Attendre 500ms avant de réessayer
          setTimeout(async () => {
            try {
              const result = await this.detectFaces(imageData, draw, retryCount + 1)
              resolve(result)
            } catch (retryError) {
              resolve({ count: 0, faces: [] })
            }
          }, 500)
        })
      }
      
      // Retourner un résultat vide en cas d'échec définitif
      return { count: 0, faces: [] }
    }
  }
  
  /**
   * Configure l'adresse IP de la caméra
   * @param {string} ip - L'adresse IP de la caméra
   */
  async setCameraIp(ip) {
    try {
      const response = await axios.post(`${this.apiUrl}/camera/configure`, {
        ip
      })
      return response.data
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la configuration de la caméra:', error)
      throw error
    }
  }
  
  /**
   * Tente de reconnecter la caméra
   */
  async reconnectCamera() {
    try {
      const response = await axios.post(`${this.apiUrl}/camera/reconnect`)
      return response.data
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la reconnexion de la caméra:', error)
      throw error
    }
  }
  
  /**
   * Recharge la base de données des visages
   */
  async reloadDatabase() {
    try {
      const response = await axios.post(`${this.apiUrl}/database/reload`)
      return response.data
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors du rechargement de la base de données:', error)
      throw error
    }
  }
  
  /**
   * Capture une image de la caméra pour l'enregistrement d'un visage
   * @param {string} patientId - L'ID du patient
   * @param {string} imageBase64 - L'image du visage en base64
   */
  async registerFace(patientId, imageBase64) {
    try {
      const formData = new FormData()
      formData.append('patient_id', patientId)
      
      // Supprimer le préfixe data:image si présent
      const base64Data = imageBase64.includes('data:image') 
        ? imageBase64.split(',')[1] 
        : imageBase64
        
      formData.append('image_data', base64Data)
      
      const response = await axios.post(`${this.apiUrl}/faces/register`, formData)
      return response.data
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de l\'enregistrement du visage:', error)
      throw error
    }
  }
  
  // Obtenir les paramètres du service
  async getSettings() {
    try {
      const response = await axios.get(`${this.apiUrl}/settings`);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la récupération des paramètres:', error);
      throw error;
    }
  }
  
  // Mettre à jour les paramètres
  async updateSettings(settings) {
    try {
      const response = await axios.post(`${this.apiUrl}/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  }
  
  // Enregistrer un visage depuis la caméra
  async registerFaceFromCamera(patientId) {
    try {
      const response = await axios.post(`${this.apiUrl}/faces/register`, {
        patient_id: patientId,
        method: 'camera'
      });
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de l\'enregistrement du visage depuis la caméra:', error);
      throw error;
    }
  }
  
  // Enregistrer un visage depuis la base de données
  async registerFaceFromDatabase(patientId) {
    try {
      const response = await axios.post(`${this.apiUrl}/faces/register`, {
        patient_id: patientId,
        method: 'database'
      });
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de l\'enregistrement du visage depuis la base de données:', error);
      throw error;
    }
  }
  
  // Enregistrer un visage à partir d'une image base64
  async registerFaceFromImage(patientId, imageBase64) {
    try {
      const response = await axios.post(`${this.apiUrl}/faces/register`, {
        patient_id: patientId,
        image: imageBase64
      });
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de l\'enregistrement du visage depuis l\'image:', error);
      throw error;
    }
  }
  
  // Reconnaître un visage depuis la caméra
  async recognizeFaceFromCamera() {
    try {
      const response = await axios.post(`${this.apiUrl}/faces/recognize`, {
        method: 'camera'
      });
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la reconnaissance faciale depuis la caméra:', error);
      throw error;
    }
  }
  
  // Reconnaître un visage à partir d'une image base64
  async recognizeFaceFromImage(imageBase64) {
    try {
      const response = await axios.post(`${this.apiUrl}/faces/recognize`, {
        image: imageBase64
      });
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la reconnaissance faciale depuis l\'image:', error);
      throw error;
    }
  }
  
  /**
   * Récupère la dernière reconnaissance sans envoyer d'image, avec retry
   * @param {number} retryCount - Le nombre de tentatives déjà effectuées (usage interne)
   */
  async getLastRecognition(retryCount = 0) {
    try {
      const response = await axios.get(`${this.apiUrl}/faces/last`, {
        timeout: 3000 // Timeout de 3 secondes
      })
      
      // Si on avait perdu la connexion et qu'elle est rétablie maintenant
      if (!this.isConnected) {
        this.isConnected = true
        console.log('[FaceRecognitionService] Connexion rétablie au service')
      }
      
      return response.data
    } catch (error) {
      // Si l'endpoint n'existe pas, retourner un objet vide
      console.warn('[FaceRecognitionService] Erreur lors de la récupération de la dernière reconnaissance:', error)
      this.isConnected = false
      
      // Si c'est un timeout ou une erreur réseau et que nous n'avons pas dépassé le nombre max de tentatives
      if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && retryCount < 1) {
        console.log('[FaceRecognitionService] Nouvelle tentative de récupération de la dernière reconnaissance...')
        return new Promise(resolve => {
          // Attendre 500ms avant de réessayer
          setTimeout(async () => {
            try {
              const result = await this.getLastRecognition(retryCount + 1)
              resolve(result)
            } catch (retryError) {
              resolve({ count: 0, faces: [] })
            }
          }, 500)
        })
      }
      
      return { count: 0, faces: [] }
    }
  }
  
  // Obtenir l'URL de l'image de la dernière reconnaissance
  getLastRecognitionImageUrl() {
    return `${this.apiUrl}/faces/last-recognition-image`;
  }
  
  // Obtenir la liste des patients
  async getPatients() {
    try {
      const response = await axios.get(`${this.apiUrl}/patients`);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la récupération des patients:', error);
      throw error;
    }
  }
  
  // Obtenir un patient spécifique
  async getPatient(patientId) {
    try {
      const response = await axios.get(`${this.apiUrl}/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`[FaceRecognitionService] Erreur lors de la récupération du patient ${patientId}:`, error);
      throw error;
    }
  }
  
  // Obtenir la liste des patients sans encodage facial
  async getPatientsWithoutFaceEncoding() {
    try {
      const response = await axios.get(`${this.apiUrl}/patients/without-face-encoding`);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la récupération des patients sans encodage facial:', error);
      throw error;
    }
  }
  
  // Capturer une image depuis la caméra
  getCaptureImageUrl() {
    return `${this.apiUrl}/camera/capture?t=${new Date().getTime()}`;
  }
  
  // Obtenir l'état de la caméra
  async getCameraStatus() {
    try {
      const response = await axios.get(`${this.apiUrl}/camera/status`);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la récupération de l\'état de la caméra:', error);
      throw error;
    }
  }
  
  // Définir la qualité de la caméra
  async setCameraQuality(quality) {
    try {
      const data = { quality };
      const response = await axios.post(`${this.apiUrl}/camera/quality`, data);
      console.log('[FaceRecognitionService] Configuration de la qualité de la caméra:', response.data);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la configuration de la qualité de la caméra:', error);
      throw error;
    }
  }
  
  // Recharger les encodages faciaux
  async reloadFaces() {
    try {
      const response = await axios.post(`${this.apiUrl}/system/reload-faces`);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors du rechargement des encodages faciaux:', error);
      throw error;
    }
  }
  
  // Enregistrer tous les patients
  async registerAllPatients() {
    try {
      const response = await axios.post(`${this.apiUrl}/system/register-all-patients`);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de l\'enregistrement de tous les patients:', error);
      throw error;
    }
  }
  
  /**
   * Initialise la caméra et démarre le streaming
   * @param {string} ip - L'adresse IP de la caméra (optionnel)
   */
  async initializeCamera(ip = null) {
    try {
      const data = ip ? { ip } : {};
      const response = await axios.post(`${this.apiUrl}/camera/initialize`, data);
      console.log('[FaceRecognitionService] Initialisation de la caméra:', response.data);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de l\'initialisation de la caméra:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les paramètres avancés de la caméra
   * @returns {Promise<Object>} Les paramètres de la caméra et les options disponibles
   */
  async getCameraAdvancedSettings() {
    try {
      const response = await axios.get(`${this.apiUrl}/camera/advanced-config`);
      console.log('[FaceRecognitionService] Paramètres avancés de la caméra:', response.data);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la récupération des paramètres avancés de la caméra:', error);
      throw error;
    }
  }

  /**
   * Configure les paramètres avancés de la caméra
   * @param {Object} settings - Les paramètres à appliquer
   * @returns {Promise<Object>} Le résultat de la configuration
   */
  async configureCameraAdvanced(settings) {
    try {
      const response = await axios.post(`${this.apiUrl}/camera/advanced-config`, {
        settings: settings
      });
      console.log('[FaceRecognitionService] Configuration avancée de la caméra appliquée:', response.data);
      return response.data;
    } catch (error) {
      console.error('[FaceRecognitionService] Erreur lors de la configuration avancée de la caméra:', error);
      throw error;
    }
  }

  /**
   * Applique un préréglage de qualité à la caméra
   * @param {string} preset - Le préréglage à appliquer (ultralow, low, medium, high, ultrahigh)
   * @returns {Promise<Object>} Le résultat de la configuration
   */
  async applyCameraPreset(preset) {
    try {
      const response = await axios.post(`${this.apiUrl}/camera/advanced-config`, {
        preset: preset
      });
      console.log(`[FaceRecognitionService] Préréglage "${preset}" appliqué:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[FaceRecognitionService] Erreur lors de l'application du préréglage "${preset}":`, error);
      throw error;
    }
  }
}

export default new FaceRecognitionService(); 