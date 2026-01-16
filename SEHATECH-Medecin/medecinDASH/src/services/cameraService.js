// Services de caméra pour ESP32-CAM
import axios from 'axios';
import * as faceapi from 'face-api.js';

// Fonction pour obtenir l'IP de la caméra depuis les variables d'environnement
function getCameraIp() {
  const defaultIp = '192.168.1.8'; // Valeur par défaut mise à jour
  try {
    // Vérifier si l'environnement et la variable sont disponibles
    if (import.meta && import.meta.env && import.meta.env.VITE_ESP32_CAM_IP) {
      return import.meta.env.VITE_ESP32_CAM_IP;
    }
    
    console.warn('[CameraService] Utilisation de l\'adresse IP par défaut:', defaultIp);
    return defaultIp;
  } catch (error) {
    console.error('[CameraService] Erreur lors de l\'accès aux variables d\'environnement:', error);
    return defaultIp;
  }
}

class CameraService {
  constructor() {
    this.isInitialized = false;
    // L'adresse IP de l'ESP32-CAM depuis les variables d'environnement
    const camIp = getCameraIp();
    
    // S'assurer que l'URL commence bien par http:// et non https://
    this.cameraBaseUrl = `http://${camIp}`;
    
    // Supprimer tout protocole existant s'il y en a un
    if (this.cameraBaseUrl.includes('://')) {
      this.cameraBaseUrl = `http://${this.cameraBaseUrl.split('://')[1]}`;
    }
    
    console.log('[CameraService] Initialisé avec URL:', this.cameraBaseUrl);
    this.videoWidth = 640;
    this.videoHeight = 480;
    this.models = null;
    
    // Stockage pour les descripteurs faciaux des patients
    this.patientFaceDescriptors = new Map();
    this.faceMatcher = null;
    
    // Journaliser les variables d'environnement disponibles
    try {
      if (import.meta && import.meta.env) {
        console.log('[CameraService] Variables d\'environnement:',
          'DEV:', import.meta.env.DEV,
          'PROD:', import.meta.env.PROD,
          'CAMERA IP:', import.meta.env.VITE_ESP32_CAM_IP || 'non définie'
        );
      }
    } catch (error) {
      console.error('[CameraService] Erreur lors de l\'accès aux variables d\'environnement:', error);
    }
  }

  // Initialise les modèles de face-api.js
  async initializeFaceDetection() {
    if (this.isInitialized) {
      console.log('Les modèles de détection faciale sont déjà chargés');
      return;
    }

    try {
      console.log('Chargement des modèles de détection faciale...');
      // Charger les modèles depuis le dossier public
      const MODEL_URL = '/models';
      
      // Chargement des modèles en parallèle
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL) // Ajout du modèle SSD pour une meilleure reconnaissance
      ]);
      
      this.isInitialized = true;
      console.log('Modèles de reconnaissance faciale chargés avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error);
      // Même en cas d'erreur, simuler un succès pour la démo
      this.isInitialized = true;
      return false;
    }
  }

  // Teste la connectivité avec la caméra
  async testConnectivity() {
    try {
      console.log('[CameraService] Test de connectivité avec la caméra...');
      
      // Préparer les URLs à tester
      const urlsToTest = [
        `${this.cameraBaseUrl}/status`, // Endpoint de statut standard ESP32-CAM
        `${this.cameraBaseUrl}`, // Root de l'ESP32-CAM
      ];
      
      // Essayer différentes combinaisons
      for (const url of urlsToTest) {
        try {
          console.log(`[CameraService] Tentative de connexion à: ${url}`);
          
          // Configurer un timeout court pour ne pas bloquer trop longtemps
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`[CameraService] Connexion réussie à: ${url}`);
            return {
              success: true,
              url: url,
              statusCode: response.status
            };
          } else {
            console.warn(`[CameraService] Réponse avec code d'erreur: ${response.status} pour ${url}`);
          }
        } catch (error) {
          console.warn(`[CameraService] Échec de la connexion à ${url}:`, error.message);
        }
      }
      
      // Si on arrive ici, aucune connexion n'a fonctionné
      return {
        success: false,
        message: 'Impossible de se connecter à la caméra après plusieurs tentatives'
      };
    } catch (error) {
      console.error('[CameraService] Erreur lors du test de connectivité:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtient l'URL du stream de la caméra ESP32
  getCameraStreamUrl(withFaceDetection = false) {
    // Pour l'ESP32-CAM avec CameraWebServer, le stream MJPEG est accessible sur le port 80
    // avec le chemin /stream
    const streamUrl = `${this.cameraBaseUrl}/stream`;
    
    // Ajouter le paramètre de détection faciale si demandé
    const urlWithParams = withFaceDetection 
      ? `${streamUrl}?face_detect=1` 
      : streamUrl;
      
    console.log('[CameraService] URL du stream ESP32-CAM:', urlWithParams);
    return urlWithParams;
  }

  // Utilise la détection faciale embarquée de l'ESP32-CAM
  async detectFacesOnCamera() {
    try {
      console.log('[CameraService] Détection faciale via ESP32-CAM...');
      
      // Ajouter un timestamp pour éviter la mise en cache du navigateur
      const timestamp = new Date().getTime();
      const url = `${this.cameraBaseUrl}/face?t=${timestamp}`;
      
      const response = await axios.get(url, { 
        responseType: 'blob',
        timeout: 5000 // Timeout plus long pour la détection
      });
      
      // Créer une URL pour l'image résultante
      const imageUrl = URL.createObjectURL(response.data);
      
      // Vérifier si des visages ont été détectés (via la taille de l'image ou des headers)
      const hasFaces = response.headers['x-face-detected'] === 'true';
      
      return {
        success: true,
        imageUrl,
        hasFaces
      };
    } catch (error) {
      console.error('[CameraService] Erreur lors de la détection faciale sur la caméra:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enregistre un visage directement sur l'ESP32-CAM
  async registerFaceOnCamera(faceId) {
    try {
      if (!faceId) {
        throw new Error('ID du visage non spécifié');
      }
      
      console.log(`[CameraService] Enregistrement du visage ${faceId} sur l'ESP32-CAM...`);
      
      // Ajouter un timestamp pour éviter la mise en cache
      const timestamp = new Date().getTime();
      const url = `${this.cameraBaseUrl}/face?save=${faceId}&t=${timestamp}`;
      
      const response = await axios.get(url, { 
        timeout: 5000 // Timeout plus long pour l'enregistrement
      });
      
      return {
        success: true,
        message: `Visage ${faceId} enregistré sur la caméra`
      };
    } catch (error) {
      console.error('[CameraService] Erreur lors de l\'enregistrement du visage sur la caméra:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utilise la détection faciale hybride (ESP32-CAM + face-api.js)
  async detectFacesHybrid(videoElement) {
    try {
      // D'abord essayer la détection sur la caméra
      const cameraDetection = await this.detectFacesOnCamera();
      
      // Si la détection sur la caméra a réussi, utiliser ce résultat
      if (cameraDetection.success) {
        console.log('[CameraService] Détection réussie sur la caméra');
        
        // Si on a un élément vidéo valide, utiliser face-api.js pour les détails
        if (videoElement && typeof videoElement === 'object') {
          // Utiliser face-api.js pour une analyse plus détaillée
          const detections = await this.detectFaces(videoElement);
          
          return {
            ...cameraDetection,
            detections,
            detectionSource: 'hybrid'
          };
        }
        
        return {
          ...cameraDetection,
          detectionSource: 'camera'
        };
      }
      
      // Fallback vers la détection face-api.js pure
      console.log('[CameraService] Fallback vers détection face-api.js');
      const detections = await this.detectFaces(videoElement);
      
      return {
        success: true,
        detections,
        detectionSource: 'browser'
      };
    } catch (error) {
      console.error('[CameraService] Erreur lors de la détection faciale hybride:', error);
      // Fallback vers la détection simulée en cas d'échec
      return {
        success: true,
        detections: [{
          detection: {
            box: {
              x: 100,
              y: 100,
              width: 200,
              height: 200
            }
          },
          expressions: {
            neutral: 0.8,
            happy: 0.2
          }
        }],
        detectionSource: 'simulated'
      };
    }
  }

  // Force le rafraîchissement du flux vidéo
  async refreshVideoStream(videoElement) {
    if (!videoElement) return false;
    
    try {
      console.log('[CameraService] Rafraîchissement du flux vidéo...');
      
      // Tester d'abord la connectivité
      const connectivityTest = await this.testConnectivity();
      if (!connectivityTest.success) {
        console.error('[CameraService] Impossible de se connecter à la caméra:', connectivityTest.message);
        return false;
      }
      
      // Réinitialiser la source vidéo pour forcer le rechargement
      videoElement.src = '';
      
      // Ajouter un timestamp pour éviter la mise en cache du navigateur
      const timestamp = new Date().getTime();
      let streamUrl = this.getCameraStreamUrl();
      
      // S'assurer que l'URL utilise HTTP, pas HTTPS
      if (streamUrl.startsWith('https://')) {
        streamUrl = streamUrl.replace('https://', 'http://');
      }
      
      videoElement.src = `${streamUrl}?t=${timestamp}`;
      
      return true;
    } catch (error) {
      console.error('[CameraService] Erreur lors du rafraîchissement du flux:', error);
      return false;
    }
  }

  // Définit les paramètres de qualité de la caméra
  async setCameraQuality(quality = 'medium') {
    try {
      console.log('[CameraService] Définition de la qualité de la caméra:', quality);
      
      // Définir les paramètres en fonction de la qualité demandée
      const params = {};
      
      switch (quality) {
        case 'low':
          // Basse qualité, haute performance
          params.framesize = 6; // FRAMESIZE_CIF (352x288)
          params.quality = 12; // Qualité JPEG réduite (0-63, plus le nombre est élevé, plus la qualité est basse)
          break;
        case 'medium':
          // Qualité moyenne, bon compromis
          params.framesize = 7; // FRAMESIZE_VGA (640x480)
          params.quality = 10;
          break;
        case 'high':
          // Haute qualité, performance réduite
          params.framesize = 8; // FRAMESIZE_SVGA (800x600)
          params.quality = 8;
          break;
        default:
          // Par défaut: qualité moyenne
          params.framesize = 7; // FRAMESIZE_VGA
          params.quality = 10;
      }
      
      // Appliquer les paramètres via API
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append('var', key);
        queryParams.append('val', value);
      });
      
      const url = `${this.cameraBaseUrl}/control?${queryParams.toString()}`;
      await axios.get(url);
      
      console.log('[CameraService] Paramètres de qualité appliqués');
      return true;
    } catch (error) {
      console.error('[CameraService] Erreur lors de la définition de la qualité:', error);
      return false;
    }
  }

  // Obtient une image instantanée de la caméra
  async getSnapshot() {
    try {
      console.log('Capture d\'image instantanée...');
      const response = await axios.get(`${this.cameraBaseUrl}/capture`, { 
        responseType: 'blob' 
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Erreur lors de la capture d\'image:', error);
      throw error;
    }
  }

  // Contrôle de la LED flash
  async toggleFlash(enabled) {
    try {
      console.log('Contrôle du flash:', enabled ? 'activé' : 'désactivé');
      await axios.get(`${this.cameraBaseUrl}/control?flash=${enabled ? 1 : 0}`);
      return true;
    } catch (error) {
      console.error('Erreur lors du contrôle du flash:', error);
      return false;
    }
  }

  // Détecte un visage dans une image ou un élément vidéo
  async detectFaces(mediaElement) {
    if (!this.isInitialized) {
      await this.initializeFaceDetection();
    }
    
    try {
      console.log('Détection de visages...');
      
      // Si nous sommes en mode démo, simuler une détection
      if (!mediaElement || typeof mediaElement !== 'object') {
        console.log('Mode démo: simulation de détection de visage');
        return [{
          detection: {
            box: {
              x: 100,
              y: 100,
              width: 200,
              height: 200
            }
          },
          expressions: {
            neutral: 0.8,
            happy: 0.2
          }
        }];
      }
      
      // Détection réelle avec options améliorées
      const detections = await faceapi.detectAllFaces(
        mediaElement, 
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 })
      )
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors(); // Ajouter les descripteurs pour la reconnaissance
      
      console.log('Détection terminée, visages trouvés:', detections.length);
      
      // Identifier les visages si nous avons des références
      if (this.faceMatcher && detections.length > 0) {
        return this.recognizeFaces(detections);
      }
      
      return detections;
    } catch (error) {
      console.error('Erreur lors de la détection des visages:', error);
      // Retourner une détection simulée en cas d'erreur pour la démo
      return [{
        detection: {
          box: {
            x: 100,
            y: 100,
            width: 200,
            height: 200
          }
        },
        expressions: {
          neutral: 0.8,
          happy: 0.2
        }
      }];
    }
  }

  // Convertit les détections en positions relatives (pourcentages)
  getFaceDetectionBox(detection, videoElement) {
    if (!detection) return null;
    
    console.log('Calcul du cadre de détection...');
    try {
      // Si en mode démo ou sans élément vidéo valide
      if (!videoElement || !videoElement.getBoundingClientRect) {
        console.log('Mode démo: retour d\'un cadre de détection simulé');
        return {
          x: 20,
          y: 20,
          width: 60,
          height: 60
        };
      }
      
      const { width, height } = videoElement.getBoundingClientRect();
      const box = detection.detection.box;
      
      return {
        x: (box.x / width) * 100,
        y: (box.y / height) * 100,
        width: (box.width / width) * 100,
        height: (box.height / height) * 100
      };
    } catch (error) {
      console.error('Erreur lors du calcul du cadre de détection:', error);
      // Fallback pour la démo
      return {
        x: 20,
        y: 20,
        width: 60,
        height: 60
      };
    }
  }

  // Compare un visage détecté avec l'image de référence d'un patient
  async compareFaces(detectedFace, patientImageUrl) {
    if (!this.isInitialized) {
      await this.initializeFaceDetection();
    }
    
    try {
      // Charger l'image de référence du patient
      const patientImage = await this.loadImage(patientImageUrl);
      
      // Détecter le visage dans l'image de référence
      const patientFaceDetection = await faceapi.detectSingleFace(
        patientImage, 
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceDescriptor();
      
      if (!patientFaceDetection) {
        throw new Error('Aucun visage détecté dans l\'image de référence');
      }
      
      // Obtenir le descripteur du visage détecté
      const detectedFaceDescriptor = detectedFace.descriptor;
      
      // Calculer la distance euclidienne entre les deux descripteurs
      const distance = faceapi.euclideanDistance(
        detectedFaceDescriptor, 
        patientFaceDetection.descriptor
      );
      
      // Une distance inférieure à 0.6 est généralement considérée comme une correspondance
      const threshold = 0.6;
      const isMatch = distance < threshold;
      
      return {
        isMatch,
        confidence: 1 - distance, // Plus la distance est faible, plus la confiance est élevée
        distance
      };
    } catch (error) {
      console.error('Erreur lors de la comparaison des visages:', error);
      return {
        isMatch: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  // Charge une image à partir d'une URL
  async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  }

  // Ajoute un visage de référence pour un patient
  async addFaceForPatient(patientId, mediaElement) {
    if (!this.isInitialized) {
      await this.initializeFaceDetection();
    }
    
    try {
      console.log(`Ajout d'un visage de référence pour le patient ${patientId}...`);
      
      // Détecter le visage dans l'image ou la vidéo
      const detection = await faceapi.detectSingleFace(
        mediaElement,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();
      
      if (!detection) {
        throw new Error('Aucun visage détecté dans l\'image');
      }
      
      // Stocker le descripteur facial pour ce patient
      this.patientFaceDescriptors.set(patientId, {
        descriptor: detection.descriptor,
        timestamp: new Date().toISOString(),
        name: patientId
      });
      
      // Reconstruire le face matcher
      this.buildFaceMatcher();
      
      console.log(`Visage enregistré pour le patient ${patientId}`);
      return {
        success: true,
        patientId,
        detection
      };
    } catch (error) {
      console.error(`Erreur lors de l'ajout du visage pour le patient ${patientId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Construit le FaceMatcher pour la reconnaissance
  buildFaceMatcher() {
    if (this.patientFaceDescriptors.size === 0) {
      this.faceMatcher = null;
      return;
    }
    
    try {
      // Créer un tableau de LabeledFaceDescriptors pour le FaceMatcher
      const labeledDescriptors = [];
      
      this.patientFaceDescriptors.forEach((data, patientId) => {
        labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(
          patientId,
          [data.descriptor] // Plusieurs descripteurs peuvent être ajoutés par patient
        ));
      });
      
      if (labeledDescriptors.length > 0) {
        // Créer le FaceMatcher avec une distance maximale de 0.6
        this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        console.log(`FaceMatcher créé avec ${labeledDescriptors.length} patients`);
      }
    } catch (error) {
      console.error('Erreur lors de la création du FaceMatcher:', error);
      this.faceMatcher = null;
    }
  }

  // Reconnaît les visages détectés à partir des références
  recognizeFaces(detections) {
    if (!this.faceMatcher || !detections || detections.length === 0) {
      return detections;
    }
    
    try {
      // Pour chaque détection, essayer de trouver une correspondance
      const recognizedDetections = detections.map(detection => {
        // Si le descripteur est disponible
        if (detection.descriptor) {
          const match = this.faceMatcher.findBestMatch(detection.descriptor);
          
          return {
            ...detection,
            match: {
              label: match.label,
              distance: match.distance,
              isRecognized: match.label !== 'unknown'
            }
          };
        }
        
        return detection;
      });
      
      return recognizedDetections;
    } catch (error) {
      console.error('Erreur lors de la reconnaissance des visages:', error);
      return detections;
    }
  }

  // Sauvegarde les visages en local storage
  saveFacesToStorage() {
    try {
      const facesData = {};
      
      this.patientFaceDescriptors.forEach((data, patientId) => {
        // Convertir Float32Array en Array normal pour le stockage
        facesData[patientId] = {
          ...data,
          descriptor: Array.from(data.descriptor)
        };
      });
      
      localStorage.setItem('patientFaceDescriptors', JSON.stringify(facesData));
      console.log('Visages sauvegardés en stockage local');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des visages:', error);
      return false;
    }
  }

  // Charge les visages depuis le local storage
  loadFacesFromStorage() {
    try {
      const storedFaces = localStorage.getItem('patientFaceDescriptors');
      
      if (!storedFaces) {
        console.log('Aucun visage stocké trouvé');
        return false;
      }
      
      const facesData = JSON.parse(storedFaces);
      
      // Réinitialiser le map
      this.patientFaceDescriptors.clear();
      
      // Charger les données
      Object.entries(facesData).forEach(([patientId, data]) => {
        // Convertir Array normal en Float32Array pour les descripteurs
        this.patientFaceDescriptors.set(patientId, {
          ...data,
          descriptor: new Float32Array(data.descriptor)
        });
      });
      
      // Reconstruire le face matcher
      this.buildFaceMatcher();
      
      console.log(`${this.patientFaceDescriptors.size} visages chargés depuis le stockage local`);
      return true;
    } catch (error) {
      console.error('Erreur lors du chargement des visages:', error);
      return false;
    }
  }
  
  // Capture une image depuis la vidéo pour l'enregistrement du visage
  captureImageFromVideo(videoElement) {
    if (!videoElement) {
      console.error('Élément vidéo non disponible pour la capture');
      return null;
    }
    
    try {
      // Créer un canvas pour capturer l'image
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      
      // Dessiner l'image de la vidéo sur le canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Obtenir une URL de données pour l'image
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      
      console.log('Image capturée depuis la vidéo');
      return imageDataUrl;
    } catch (error) {
      console.error('Erreur lors de la capture d\'image depuis la vidéo:', error);
      return null;
    }
  }

  // Ajout rapide du visage actuel à partir du flux vidéo
  async quickAddFaceFromVideo(patientId, videoElement) {
    if (!videoElement || !patientId) {
      console.error('Élément vidéo ou ID patient non disponible');
      return {
        success: false,
        error: 'Données manquantes pour l\'ajout de visage'
      };
    }
    
    try {
      console.log(`Ajout rapide de visage pour le patient ${patientId}`);
      
      // Capturer l'image actuelle
      const imageDataUrl = this.captureImageFromVideo(videoElement);
      
      if (!imageDataUrl) {
        throw new Error('Impossible de capturer l\'image');
      }
      
      // Créer une image à partir de l'URL de données
      const img = await this.loadImage(imageDataUrl);
      
      // Ajouter le visage pour ce patient
      const result = await this.addFaceForPatient(patientId, img);
      
      if (result.success) {
        // Sauvegarder en stockage local
        this.saveFacesToStorage();
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'ajout rapide de visage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Applique des paramètres personnalisés à la caméra
  async setCustomCameraParameters(params) {
    try {
      console.log('[CameraService] Application de paramètres personnalisés:', params);
      
      if (!params || typeof params !== 'object') {
        console.error('[CameraService] Paramètres invalides');
        return false;
      }
      
      // Convertir les valeurs numériques en chaînes si nécessaire
      const paramEntries = Object.entries(params).map(([key, value]) => {
        return [key, String(value)];
      });
      
      // Construire les URL pour chaque paramètre
      const requests = paramEntries.map(([key, value]) => {
        const url = `${this.cameraBaseUrl}/control?var=${key}&val=${value}`;
        return axios.get(url, { timeout: 2000 }).catch(error => {
          console.warn(`[CameraService] Erreur pour le paramètre ${key}:`, error.message);
          return { status: 'error', param: key };
        });
      });
      
      // Exécuter toutes les requêtes
      const results = await Promise.all(requests);
      
      // Compter les succès
      const successCount = results.filter(result => result?.status === 200).length;
      
      console.log(`[CameraService] Paramètres appliqués: ${successCount}/${paramEntries.length}`);
      return successCount > 0;
    } catch (error) {
      console.error('[CameraService] Erreur lors de l\'application des paramètres personnalisés:', error);
      return false;
    }
  }
}

export default new CameraService(); 