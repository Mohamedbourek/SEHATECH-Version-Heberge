<template>
  <div class="camera-container">
    <!-- Bouton de configuration avancée -->
    <button @click="openAdvancedConfig" class="absolute top-3 right-14 z-10 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-md">
      <i class="fas fa-cog"></i>
    </button>
    
    <!-- Bouton pour changer la qualité de la vidéo -->
    <button @click="cycleQuality" class="absolute top-3 right-3 z-10 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-md">
      <i class="fas fa-video"></i>
    </button>
    
    <!-- Affichage de la caméra -->
    <div class="camera-view" :class="{ 'camera-disabled': !isActive }">
      <div v-if="isActive" class="relative">
        <video 
          ref="videoRef"
          class="w-full h-full rounded-lg object-cover"
          autoplay
          muted
          playsinline
        ></video>
        
        <!-- Canvas pour la détection faciale -->
        <canvas 
          v-if="showDetection" 
          ref="canvasRef"
          class="absolute top-0 left-0 w-full h-full pointer-events-none"
        ></canvas>
        
        <!-- Indicateurs -->
        <div class="camera-indicators">
          <div class="recording-indicator">
            <div class="pulse-dot"></div>
            <span class="text-xs">En direct</span>
          </div>
          <div v-if="detectionCount > 0" class="ml-3 text-xs px-2 py-1 bg-blue-500/70 rounded-full text-white">
            {{ detectionCount }} {{ detectionCount > 1 ? 'personnes détectées' : 'personne détectée' }}
          </div>
          <!-- Affichage des patients reconnus -->
          <div v-if="recognizedPatients.length > 0" class="ml-3 text-xs px-2 py-1 bg-green-500/70 rounded-full text-white">
            Patient: {{ recognizedPatients.join(', ') }}
          </div>
        </div>

        <!-- Contrôles -->
        <div class="camera-controls">
          <button 
            @click="toggleDetection"
            class="control-btn mr-2"
            title="Détection faciale"
          >
            <User v-if="!showDetection" class="w-4 h-4" />
            <UserCheck v-else class="w-4 h-4" />
          </button>
          <button 
            @click="toggleFlash"
            class="control-btn mr-2"
            title="Flash"
          >
            <Zap class="w-4 h-4" />
          </button>
          <button 
            @click="toggleFullscreen"
            class="control-btn mr-2"
            title="Plein écran"
          >
            <Maximize2 v-if="!isFullscreen" class="w-4 h-4" />
            <Minimize2 v-else class="w-4 h-4" />
          </button>
          <button 
            @click="captureFace"
            class="control-btn mr-2 bg-blue-500/70 hover:bg-blue-600/70"
            title="Enregistrer visage"
          >
            <CameraIcon class="w-4 h-4" />
          </button>
          <!-- Ajouter un bouton de redémarrage du service Python à côté du bouton de détection faciale -->
          <button 
            v-if="!pythonServiceAvailable && !showDetection"
            @click="restartFaceDetection"
            class="control-btn mr-2 bg-yellow-500/70 hover:bg-yellow-600/70"
            title="Redémarrer la détection faciale"
          >
            <span class="refresh-icon">⟳</span>
          </button>
        </div>

        <!-- Statut de connexion -->
        <div 
          v-if="connectionError" 
          class="absolute bottom-4 left-4 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg"
        >
          Connexion perdue
        </div>
        
        <!-- Modal pour l'enregistrement de visage -->
        <div v-if="showCaptureModal" class="face-capture-modal">
          <div class="face-capture-content">
            <h3 class="text-lg font-bold mb-4">Enregistrer le visage du patient</h3>
            <div class="mb-4">
              <label class="block text-sm mb-1">ID du patient:</label>
              <input 
                v-model="capturePatientId" 
                type="text" 
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Entrez l'ID du patient"
              />
            </div>
            <div class="preview-container mb-4">
              <img v-if="captureImageUrl" :src="captureImageUrl" class="w-full h-auto rounded-lg" />
              <div v-else class="flex items-center justify-center h-48 bg-gray-200 dark:bg-gray-600 rounded-lg">
                <p class="text-gray-500 dark:text-gray-300">Aucune image capturée</p>
              </div>
            </div>
            <div class="flex justify-end space-x-2">
              <button 
                @click="closeCaptureModal" 
                class="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Annuler
              </button>
              <button 
                @click="saveCapturedFace" 
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                :disabled="!captureImageUrl || !capturePatientId"
                :class="{'opacity-50 cursor-not-allowed': !captureImageUrl || !capturePatientId}"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- État désactivé -->
      <div v-else class="camera-disabled-overlay">
        <VideoOff class="w-12 h-12 text-gray-400" />
        <p class="mt-2 text-gray-500">Caméra désactivée</p>
      </div>
    </div>

    <!-- Configuration rapide de la caméra -->
    <div v-if="isActive" class="camera-quick-settings mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div class="flex flex-wrap items-center gap-2">
        <!-- Résolution -->
        <div class="flex items-center">
          <label class="text-xs mr-2 whitespace-nowrap">Résolution:</label>
          <select 
            v-model="quickResolution" 
            class="text-xs py-1 px-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            @change="applyQuickSettings"
          >
            <option value="3">320x240 (Rapide)</option>
            <option value="4">400x296 (Basse)</option>
            <option value="5">640x480 (Moyenne)</option>
            <option value="6">800x600 (Haute)</option>
            <option value="7">1024x768 (Ultra)</option>
          </select>
        </div>

        <!-- Qualité JPEG -->
        <div class="flex items-center">
          <label class="text-xs mr-2 whitespace-nowrap">Qualité:</label>
          <select 
            v-model="quickQuality" 
            class="text-xs py-1 px-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            @change="applyQuickSettings"
          >
            <option value="20">Très basse (Rapide)</option>
            <option value="15">Basse</option>
            <option value="10">Moyenne</option>
            <option value="5">Haute</option>
            <option value="3">Très haute</option>
          </select>
        </div>

        <!-- Luminosité -->
        <div class="flex items-center">
          <label class="text-xs mr-2 whitespace-nowrap">Luminosité:</label>
          <input 
            type="range" 
            v-model.number="quickBrightness"
            min="-2" 
            max="2" 
            step="1"
            class="w-24 h-4"
            @change="applyQuickSettings"
          />
          <span class="text-xs ml-1">{{ quickBrightness }}</span>
        </div>

        <!-- Contraste -->
        <div class="flex items-center">
          <label class="text-xs mr-2 whitespace-nowrap">Contraste:</label>
          <input 
            type="range" 
            v-model.number="quickContrast"
            min="-2" 
            max="2" 
            step="1"
            class="w-24 h-4"
            @change="applyQuickSettings"
          />
          <span class="text-xs ml-1">{{ quickContrast }}</span>
        </div>

        <!-- Saturation -->
        <div class="flex items-center">
          <label class="text-xs mr-2 whitespace-nowrap">Saturation:</label>
          <input 
            type="range" 
            v-model.number="quickSaturation"
            min="-2" 
            max="2" 
            step="1"
            class="w-24 h-4"
            @change="applyQuickSettings"
          />
          <span class="text-xs ml-1">{{ quickSaturation }}</span>
        </div>

        <!-- Préréglages rapides -->
        <div class="flex items-center ml-auto">
          <button 
            v-for="preset in ['ultralow', 'low', 'medium', 'high', 'ultrahigh']" 
            :key="preset"
            @click="applyPreset(preset); updateQuickSettings()"
            :class="[
              'text-xs px-2 py-1 rounded mx-1',
              selectedPreset === preset 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
            ]"
          >
            {{ preset === 'ultralow' ? 'Très rapide' :
               preset === 'low' ? 'Rapide' :
               preset === 'medium' ? 'Standard' :
               preset === 'high' ? 'Haute qualité' :
               'Ultra HD' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de configuration avancée -->
  <div v-if="showAdvancedConfigModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Configuration avancée de la caméra</h2>
        <button @click="closeAdvancedConfigModal" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Préréglages de qualité -->
      <div class="mb-6">
        <h3 class="font-semibold mb-2">Préréglages rapides</h3>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="preset in availablePresets" 
            :key="preset"
            @click="applyPreset(preset)"
            :class="[
              'px-3 py-1 rounded-md border',
              selectedPreset === preset 
                ? 'bg-blue-500 text-white border-blue-600' 
                : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
            ]"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- Paramètres personnalisés -->
      <div>
        <h3 class="font-semibold mb-2">Paramètres personnalisés</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(details, key) in availableParameters" :key="key" class="flex flex-col">
            <label :for="key" class="text-sm font-medium mb-1">
              {{ key }} 
              <span v-if="details.description" class="text-xs text-gray-500">
                ({{ details.description }})
              </span>
            </label>
            
            <!-- Input pour les paramètres numériques avec sliders -->
            <template v-if="details.type === 'number' || details.type === 'integer'">
              <div class="flex items-center">
                <input 
                  :id="key"
                  type="range"
                  v-model.number="advancedSettings[key]"
                  :min="details.min"
                  :max="details.max"
                  :step="details.type === 'integer' ? 1 : 0.1"
                  class="flex-grow"
                />
                <input 
                  type="number"
                  v-model.number="advancedSettings[key]"
                  :min="details.min"
                  :max="details.max"
                  :step="details.type === 'integer' ? 1 : 0.1"
                  class="w-16 ml-2 px-2 py-1 border rounded"
                />
              </div>
            </template>
            
            <!-- Select pour les paramètres avec options prédéfinies -->
            <template v-else-if="details.options">
              <select 
                :id="key"
                v-model="advancedSettings[key]"
                class="border rounded px-2 py-1"
              >
                <option v-for="option in details.options" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </template>
            
            <!-- Input standard pour les autres types -->
            <template v-else>
              <input 
                :id="key"
                :type="details.type === 'boolean' ? 'checkbox' : 'text'"
                v-model="advancedSettings[key]"
                class="border rounded px-2 py-1"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div class="mt-6 flex justify-end gap-3">
        <button 
          @click="closeAdvancedConfigModal"
          class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          Annuler
        </button>
        <button 
          @click="applyCustomSettings"
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Appliquer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { Maximize2, Minimize2, VideoOff, User, UserCheck, Zap, Camera as CameraIcon } from 'lucide-vue-next'
import cameraService from '@/services/cameraService'
import faceRecognitionService from '@/services/faceRecognitionService'
import * as faceapi from 'face-api.js'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  roomNumber: {
    type: String,
    required: true
  }
})

const videoRef = ref(null)
const canvasRef = ref(null)
const isFullscreen = ref(false)
const connectionError = ref(false)
const showDetection = ref(false)
const detectionCount = ref(0)
const detectionInterval = ref(null)

// Gestion de la qualité vidéo
const qualityLevels = ['low', 'medium', 'high']
const currentQuality = ref('low') // Démarrer avec une qualité basse pour de meilleures performances
const qualityIndicator = computed(() => {
  switch(currentQuality.value) {
    case 'low': return 'L'
    case 'medium': return 'M'
    case 'high': return 'H'
    default: return 'L'
  }
})

// Variables pour la reconnaissance faciale
const recognizedPatients = ref([])
const pythonServiceAvailable = ref(false) // Variable pour indiquer si le service Python est disponible

// Variables pour la capture de visage
const showCaptureModal = ref(false)
const capturePatientId = ref('')
const captureImageUrl = ref('')

// Ajout d'une variable pour le contrôle du modal de configuration avancée
const showAdvancedConfigModal = ref(false)
const availablePresets = ref([])
const availableParameters = ref({})
const advancedSettings = ref({})
const selectedPreset = ref('medium')

// Ajouter la variable pour suivre les erreurs consécutives
const consecutiveErrors = ref(0)

// Variables pour les paramètres rapides
const quickResolution = ref('5') // Par défaut: 640x480
const quickQuality = ref('10') // Par défaut: qualité moyenne
const quickBrightness = ref(0) // Par défaut: luminosité normale
const quickContrast = ref(0) // Par défaut: contraste normal
const quickSaturation = ref(0) // Par défaut: saturation normale

// Vérifier la disponibilité du service Python de reconnaissance faciale
onMounted(async () => {
  try {
    console.log('[RoomCamera] Vérification de la disponibilité du service Python...');
    const isConnected = await faceRecognitionService.checkConnection();
    pythonServiceAvailable.value = isConnected;
    
    if (isConnected) {
      console.log('[RoomCamera] Service Python disponible, activation de la détection par défaut');
      showDetection.value = true;
      
      // Tester et configurer la caméra
      try {
        const status = await faceRecognitionService.getStatus();
        console.log('[RoomCamera] Statut du service Python:', status);
        
        // Récupérer les paramètres actuels de la caméra
        try {
          const cameraSettings = await faceRecognitionService.getCameraAdvancedSettings();
          if (cameraSettings.camera && cameraSettings.camera.settings) {
            advancedSettings.value = { ...cameraSettings.camera.settings };
            selectedPreset.value = cameraSettings.camera.quality || 'medium';
            
            // Initialiser les paramètres rapides
            updateQuickSettings();
          }
        } catch (settingsError) {
          console.warn('[RoomCamera] Erreur lors de la récupération des paramètres de la caméra:', settingsError);
        }
        
        // Vérifier si l'IP de la caméra est correctement configurée
        const cameraIp = cameraService.cameraBaseUrl.replace('http://', '');
        
        // Si l'IP de la caméra dans le service est différente, la mettre à jour
        if (status.camera && status.camera.ip !== cameraIp) {
          console.log(`[RoomCamera] Mise à jour de l'IP de la caméra: ${cameraIp}`);
          await faceRecognitionService.setCameraIp(cameraIp);
        }
      } catch (err) {
        console.warn('[RoomCamera] Erreur lors de la configuration du service Python:', err);
      }
    } else {
      console.warn('[RoomCamera] Service Python non disponible');
    }
  } catch (error) {
    console.warn('[RoomCamera] Erreur lors de la vérification du service Python:', error);
    pythonServiceAvailable.value = false;
  }
  
  // Charger les modèles de détection faciale (comme fallback)
  try {
    await cameraService.initializeFaceDetection();
    console.log('[RoomCamera] Modèles de détection faciale préchargés');
  } catch (error) {
    console.warn('[RoomCamera] Erreur lors du chargement des modèles de détection:', error);
  }
})

// Fonction pour cycler entre les niveaux de qualité
async function cycleQuality() {
  // Trouver l'index actuel
  const currentIndex = qualityLevels.indexOf(currentQuality.value)
  // Passer au niveau suivant (revenir au début si on est à la fin)
  const nextIndex = (currentIndex + 1) % qualityLevels.length
  currentQuality.value = qualityLevels[nextIndex]
  
  console.log(`[RoomCamera] Changement de qualité: ${currentQuality.value}`)
  
  // Appliquer le nouveau niveau de qualité
  try {
    // Si le service Python est disponible, configurer la qualité via le service Python
    if (pythonServiceAvailable.value) {
      try {
        console.log('[RoomCamera] Configuration de la qualité via le service Python')
        await faceRecognitionService.setCameraQuality(currentQuality.value)
      } catch (pythonError) {
        console.error('[RoomCamera] Erreur lors de la configuration de la qualité via le service Python:', pythonError)
        // Vérifier si le service est toujours disponible
        pythonServiceAvailable.value = false
        // Tenter une reconnexion
        try {
          const isConnected = await faceRecognitionService.checkConnection()
          pythonServiceAvailable.value = isConnected
          if (!isConnected && showDetection.value) {
            console.warn('[RoomCamera] Service Python indisponible, désactivation de la détection faciale')
            showDetection.value = false
          }
        } catch (e) {
          pythonServiceAvailable.value = false
        }
      }
    }
    
    // Configurer également via le service caméra direct (ESP32)
    try {
      await cameraService.setCameraQuality(currentQuality.value)
    } catch (cameraError) {
      console.error('[RoomCamera] Erreur lors de la configuration de la qualité via la caméra directe:', cameraError)
    }
    
    // Vérifier le type de flux actuel
    const container = videoRef.value?.parentNode
    const usingIframe = container?.querySelector('iframe.camera-iframe')
    const isPythonStream = usingIframe?.src.includes('/api/camera/live')
    
    if (isPythonStream && pythonServiceAvailable.value) {
      // Pour le flux Python, redémarrer le flux avec les nouveaux paramètres de qualité
      console.log('[RoomCamera] Redémarrage du flux Python avec la nouvelle qualité')
      useDirectPythonStream()
    } else if (usingIframe) {
      // Pour le flux MJPEG direct, rafraîchir l'iframe
      console.log('[RoomCamera] Rafraîchissement du flux MJPEG direct')
      usingIframe.src = usingIframe.src.split('?')[0] + `?t=${Date.now()}`
    } else if (videoRef.value) {
      // Pour les autres types de flux, utiliser la méthode standard
      console.log('[RoomCamera] Rafraîchissement du flux vidéo standard')
      cameraService.refreshVideoStream(videoRef.value)
    }
  } catch (error) {
    console.error(`[RoomCamera] Erreur lors du changement de qualité:`, error)
  }
}

// Gestion de la caméra
async function startCamera() {
  console.log(`[RoomCamera] Démarrage de la caméra pour chambre ${props.roomNumber}, état actif:`, props.isActive);
  
  try {
    if (!props.isActive) {
      console.log('[RoomCamera] La caméra n\'est pas active, sortie de la fonction');
      return;
    }
    
    // Vérifier l'élément vidéo
    if (!videoRef.value) {
      console.error('[RoomCamera] L\'élément vidéo n\'est pas disponible');
      return;
    }
    
    console.log('[RoomCamera] Mode:', import.meta.env.DEV ? 'développement' : 'production');
    
    // Vérifier si le service Python est disponible
    if (!pythonServiceAvailable.value) {
      console.log('[RoomCamera] Vérification de la disponibilité du service Python...');
      try {
        const isConnected = await faceRecognitionService.checkConnection();
        pythonServiceAvailable.value = isConnected;
        console.log('[RoomCamera] Service Python disponible:', isConnected);
        
        if (isConnected) {
          console.log('[RoomCamera] Activation automatique de la détection faciale via le service Python');
          showDetection.value = true;
        }
      } catch (error) {
        console.error('[RoomCamera] Erreur lors de la vérification du service Python:', error);
        pythonServiceAvailable.value = false;
      }
    }
    
    // 1. Vérifier le statut de la caméra via le service Python (évite CORS)
    if (pythonServiceAvailable.value) {
      try {
        console.log('[RoomCamera] Vérification du statut de la caméra via le service Python...');
        const proxyStatus = await cameraService.getCameraStatusViaProxy();
        
        if (proxyStatus.success && proxyStatus.camera?.connected) {
          console.log('[RoomCamera] Caméra connectée via le service Python:', proxyStatus);
          
          // La caméra est connectée via le proxy, utiliser le service Python
          connectionError.value = false;
          useDirectPythonStream();
          return;
        } else {
          console.warn('[RoomCamera] La caméra n\'est pas connectée via le service Python:', proxyStatus);
          
          // Tenter d'initialiser la caméra
          try {
            console.log('[RoomCamera] Tentative d\'initialisation de la caméra...');
            const camIp = cameraService.cameraBaseUrl.replace('http://', '');
            const initResult = await faceRecognitionService.initializeCamera(camIp);
            
            if (initResult.status === 'success') {
              console.log('[RoomCamera] Caméra initialisée avec succès:', initResult.message);
              connectionError.value = false;
              useDirectPythonStream();
              return;
            } else {
              console.warn('[RoomCamera] Échec de l\'initialisation de la caméra:', initResult.message);
            }
          } catch (initError) {
            console.error('[RoomCamera] Erreur lors de l\'initialisation de la caméra:', initError);
          }
        }
      } catch (statusError) {
        console.error('[RoomCamera] Erreur lors de la vérification du statut via proxy:', statusError);
      }
    }
    
    // 2. Si le service Python n'est pas disponible ou a échoué, tenter une connexion directe
    // Note: cela échouera probablement à cause de CORS, mais nous essayons quand même
    console.log('[RoomCamera] Test de connectivité directe avec la caméra...');
    const connectivityTest = await cameraService.testConnectivity();
    
    if (!connectivityTest.success) {
      console.error('[RoomCamera] Échec de connexion directe à la caméra:', connectivityTest.message);
      connectionError.value = true;
      
      // Afficher un message d'erreur explicatif sur les erreurs CORS
      if (connectivityTest.cors === 'blocked') {
        console.warn('[RoomCamera] Erreur CORS détectée lors de l\'accès à la caméra');
        
        // Si le service Python est disponible, utiliser le flux proxy malgré tout
        if (pythonServiceAvailable.value) {
          console.log('[RoomCamera] Utilisation du flux via le service Python malgré l\'erreur CORS');
          useDirectPythonStream();
          return;
        } else {
          alert('Erreur CORS: Impossible d\'accéder directement à la caméra ESP32 depuis le navigateur.\n' +
                'Assurez-vous que le service Python est en cours d\'exécution pour servir de proxy.');
        }
      } else {
        alert('Impossible de se connecter à la caméra ESP32. Vérifiez son IP et si elle est bien allumée.');
      }
      return;
    }
    
    console.log('[RoomCamera] Connectivité directe avec la caméra établie:', connectivityTest);
    
    // Définir la qualité de la caméra
    try {
      await cameraService.setCameraQuality(currentQuality.value);
    } catch (error) {
      console.warn('[RoomCamera] Impossible de configurer la qualité de la caméra:', error);
    }
    
    // Par sécurité, utiliser toujours le flux via le proxy Python si disponible
    if (pythonServiceAvailable.value) {
      useDirectPythonStream();
    } else {
      // Sinon, tenter d'utiliser le flux MJPEG direct (risque d'erreurs CORS)
      useDirectMjpegStream();
    }
    
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de l\'accès à la caméra:', error);
    connectionError.value = true;
    
    // Tenter d'utiliser le service Python comme fallback
    if (pythonServiceAvailable.value) {
      useDirectPythonStream();
    } else {
      alert('Erreur lors de l\'accès à la caméra. Veuillez vérifier que le service Python est en cours d\'exécution.');
    }
  }
}

// Utiliser le flux direct MJPEG de l'ESP32-CAM
function useDirectMjpegStream() {
  try {
    // Récupérer l'URL du stream direct
    const timestamp = new Date().getTime();
    let streamUrl = cameraService.getCameraStreamUrl(false);
    
    if (streamUrl.startsWith('https://')) {
      streamUrl = streamUrl.replace('https://', 'http://');
    }
    
    // Ajouter un timestamp pour éviter la mise en cache
    streamUrl = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
    console.log('[RoomCamera] URL du stream direct MJPEG:', streamUrl);
    
    // Nettoyer l'élément vidéo précédent
    if (videoRef.value) {
      if (videoRef.value.srcObject) {
        const tracks = videoRef.value.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      videoRef.value.srcObject = null;
      videoRef.value.src = "";
    }
    
    // Utiliser un iframe pour le flux MJPEG (méthode la plus compatible)
    const container = videoRef.value.parentNode;
    
    // Supprimer l'iframe existant s'il y en a un
    const existingIframe = container.querySelector('iframe.camera-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }
    
    // Créer un nouvel iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'camera-iframe';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '0.5rem';
    iframe.style.background = '#000';
    iframe.src = streamUrl;
    
    // Cacher la vidéo et ajouter l'iframe
    videoRef.value.style.display = 'none';
    container.insertBefore(iframe, videoRef.value);
    
    console.log('[RoomCamera] Flux MJPEG chargé via iframe');
    connectionError.value = false;
    
    // Si la détection est activée, capturer des images à intervalles réguliers
    if (showDetection.value) {
      startFaceDetection();
    }
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de l\'utilisation du flux MJPEG:', error);
    connectionError.value = true;
  }
}

// Utiliser le flux du service Python avec détection faciale
function useDirectPythonStream() {
  try {
    // Récupérer l'URL du service Python avec paramètres de qualité
    // Ajouter les paramètres de qualité vidéo en fonction du niveau actuel
    let quality = "low";
    switch(currentQuality.value) {
      case "medium": quality = "medium"; break;
      case "high": quality = "high"; break;
      default: quality = "low";
    }
    
    const pythonUrl = `${faceRecognitionService.apiUrl}/camera/live?draw=true&quality=${quality}&t=${Date.now()}`;
    console.log('[RoomCamera] Utilisation du flux avec détection du service Python:', pythonUrl);
    
    // Nettoyer l'élément vidéo précédent
    if (videoRef.value) {
      if (videoRef.value.srcObject) {
        const tracks = videoRef.value.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      videoRef.value.srcObject = null;
      videoRef.value.src = "";
    }
    
    // Utiliser un iframe pour le flux MJPEG (méthode la plus compatible)
    const container = videoRef.value.parentNode;
    
    // Supprimer l'iframe existant s'il y en a un
    const existingIframe = container.querySelector('iframe.camera-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }
    
    // Créer un nouvel iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'camera-iframe';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '0.5rem';
    iframe.style.background = '#000';
    iframe.src = pythonUrl;
    
    // Ajouter un message de chargement pendant que l'iframe se charge
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.style.position = 'absolute';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '50%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.color = 'white';
    loadingMessage.style.background = 'rgba(0,0,0,0.5)';
    loadingMessage.style.padding = '10px 20px';
    loadingMessage.style.borderRadius = '5px';
    loadingMessage.style.zIndex = '10';
    loadingMessage.textContent = 'Chargement du flux vidéo...';
    container.appendChild(loadingMessage);
    
    // Supprimer le message de chargement quand l'iframe est chargé
    iframe.onload = () => {
      if (container.contains(loadingMessage)) {
        container.removeChild(loadingMessage);
      }
    };
    
    // Cacher la vidéo et ajouter l'iframe
    videoRef.value.style.display = 'none';
    container.insertBefore(iframe, videoRef.value);
    
    console.log('[RoomCamera] Flux Python avec détection chargé via iframe');
    connectionError.value = false;
    
    // Interroger les détections à intervalles réguliers
    if (showDetection.value) {
      // Utiliser un intervalle plus long car le service Python fait déjà la détection
      if (detectionInterval.value) {
        clearInterval(detectionInterval.value);
      }
      
      detectionInterval.value = setInterval(async () => {
        try {
          const result = await faceRecognitionService.getLastRecognition();
          detectionCount.value = result.count || 0;
          
          // Récupérer les noms des patients reconnus
          if (result.faces && result.faces.length > 0) {
            const identifiedFaces = result.faces.filter(face => 
              face.name && face.name !== "Inconnu" && 
              (face.confidence === undefined || face.confidence > 0.6)
            );
            recognizedPatients.value = [...new Set(identifiedFaces.map(face => face.name))];
          } else {
            recognizedPatients.value = [];
          }
        } catch (error) {
          console.warn('[RoomCamera] Erreur lors de la récupération des détections:', error);
        }
      }, 2000);
    }
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de l\'utilisation du flux Python:', error);
    connectionError.value = true;
    
    // Essayer le flux MJPEG direct en fallback
    useDirectMjpegStream();
  }
}

function stopCamera() {
  if (detectionInterval.value) {
    clearInterval(detectionInterval.value)
    detectionInterval.value = null
  }
    
  if (videoRef.value) {
    if (videoRef.value.srcObject) {
      // Arrêter les pistes du flux local
      const tracks = videoRef.value.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }
    videoRef.value.srcObject = null
    videoRef.value.src = ''
  }
}

// Activer/désactiver la détection faciale
async function toggleDetection() {
  showDetection.value = !showDetection.value
  
  if (showDetection.value) {
    await startFaceDetection()
  } else {
    stopFaceDetection()
  }
}

// Fonction pour détecter les visages via le service Python
async function detectFacesWithPythonService() {
  if (!props.isActive || !videoRef.value) {
    return;
  }
  
  try {
    let result;
    
    // Vérifier si nous utilisons directement le flux du service Python
    const container = videoRef.value.parentNode;
    const usingIframe = container?.querySelector('iframe.camera-iframe');
    const isDirectPythonStream = usingIframe?.src.includes('/api/camera/live');
    
    if (!isDirectPythonStream) {
      // Capturer l'image actuelle de la vidéo
      const canvas = document.createElement('canvas');
      const video = videoRef.value;
      
      // Vérifier si la vidéo a des dimensions valides
      if (!video.videoWidth || !video.videoHeight) {
        console.warn('[RoomCamera] Dimensions vidéo non valides, utilisation des dimensions par défaut');
        canvas.width = 640;
        canvas.height = 480;
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      const ctx = canvas.getContext('2d');
      
      // Dessiner l'image actuelle de la vidéo sur le canvas
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        console.error('[RoomCamera] Erreur lors du dessin de la vidéo sur le canvas:', e);
        return;
      }
      
      // Convertir en base64
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8); // Qualité 80% pour réduire la taille
      
      // Envoyer au service Python pour détection
      result = await faceRecognitionService.detectFaces(imageBase64, true);
    } else {
      // Si nous utilisons déjà le flux Python, demander simplement les dernières détections
      try {
        result = await faceRecognitionService.getLastRecognition();
      } catch (e) {
        console.warn('[RoomCamera] Erreur lors de la récupération de la dernière reconnaissance:', e);
        result = { count: 0, faces: [] };
      }
    }
    
    // Mettre à jour le compteur de détections
    detectionCount.value = result.count || 0;
    
    // Récupérer les noms des patients reconnus
    if (result.faces && result.faces.length > 0) {
      // Filtrer les visages avec un nom autre que "Inconnu"
      const identifiedFaces = result.faces.filter(face => 
        face.name && face.name !== "Inconnu" && 
        // Ajouter un filtre sur la confiance minimale (60%)
        (face.confidence === undefined || face.confidence > 0.6)
      );
      
      // Extraire les noms uniques des visages identifiés
      const uniqueNames = [...new Set(identifiedFaces.map(face => face.name))];
      recognizedPatients.value = uniqueNames;
    } else {
      recognizedPatients.value = [];
    }
    
    // Si nous n'utilisons pas déjà le flux Python avec détection,
    // afficher l'image avec les détections sur le canvas
    if (!isDirectPythonStream && result.image && canvasRef.value) {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.value) return;
        
        const canvas = canvasRef.value;
        const videoWidth = videoRef.value.videoWidth || 640;
        const videoHeight = videoRef.value.videoHeight || 480;
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = result.image;
    }
    
    connectionError.value = false;
    
    // Si nous avions des erreurs précédemment et que maintenant ça fonctionne
    if (consecutiveErrors.value > 0) {
      console.log('[RoomCamera] Connexion rétablie au service Python après', consecutiveErrors.value, 'erreurs');
      consecutiveErrors.value = 0;
    }
  } catch (error) {
    console.error('[RoomCamera] Erreur de détection avec le service Python:', error);
    consecutiveErrors.value++;
    
    // Si nous avons plusieurs erreurs consécutives, désactiver la détection
    if (consecutiveErrors.value >= 3) {
      console.warn('[RoomCamera] Désactivation automatique de la détection faciale après', consecutiveErrors.value, 'erreurs consécutives');
      stopFaceDetection();
      showDetection.value = false;
      
      // Afficher une notification à l'utilisateur
      const notificationContainer = document.createElement('div');
      notificationContainer.className = 'detection-error-notification';
      notificationContainer.innerHTML = `
        <div class="p-3 bg-red-100 border border-red-200 rounded-lg">
          <p class="text-red-800 text-sm">La détection faciale a été désactivée car le service Python n'est pas accessible.</p>
        </div>
      `;
      
      const container = videoRef.value.parentNode;
      container.appendChild(notificationContainer);
      
      // Supprimer la notification après 5 secondes
      setTimeout(() => {
        if (container.contains(notificationContainer)) {
          container.removeChild(notificationContainer);
        }
      }, 5000);
      
      // Mettre à jour l'état du service Python
      pythonServiceAvailable.value = false;
    }
    
    connectionError.value = true;
    detectionCount.value = 0;
    recognizedPatients.value = [];
  }
}

// Fonction pour la détection faciale (utilise uniquement le service Python)
async function startFaceDetection() {
  if (!showDetection.value || !props.isActive) {
    if (detectionInterval.value) {
      clearInterval(detectionInterval.value);
      detectionInterval.value = null;
    }
    return;
  }
  
  // Vérifier si le service Python est disponible
  if (!pythonServiceAvailable.value) {
    try {
      console.log('[RoomCamera] Vérification de la disponibilité du service Python avant de démarrer la détection');
      const isConnected = await faceRecognitionService.checkConnection();
      
      if (!isConnected) {
        console.warn('[RoomCamera] Service Python non disponible, désactivation de la détection faciale');
        showDetection.value = false;
        
        // Afficher une notification à l'utilisateur
        alert('La détection faciale n\'est pas disponible car le service Python n\'est pas accessible. Vérifiez que le serveur Python est en cours d\'exécution.');
        return;
      }
      
      pythonServiceAvailable.value = true;
    } catch (error) {
      console.error('[RoomCamera] Erreur lors de la vérification du service Python:', error);
      showDetection.value = false;
      alert('La détection faciale n\'est pas disponible en raison d\'une erreur de connexion au service Python.');
      return;
    }
  }
  
  // Utiliser le service Python pour la détection
  console.log('[RoomCamera] Utilisation du service Python pour la détection faciale');
  
  // Réinitialiser le compteur d'erreurs consécutives
  consecutiveErrors.value = 0;
  
  // Démarrer une détection périodique
  if (detectionInterval.value) {
    clearInterval(detectionInterval.value);
  }
  
  // Détecter immédiatement
  await detectFacesWithPythonService();
  
  // Puis toutes les 2 secondes pour réduire la charge
  detectionInterval.value = setInterval(async () => {
    await detectFacesWithPythonService();
  }, 2000); // Intervalle de 2 secondes pour réduire les erreurs en cas de latence réseau
}

// Observer les changements de l'état de détection
watch(showDetection, (newValue) => {
  if (newValue) {
    startFaceDetection()
  } else {
    if (detectionInterval.value) {
      clearInterval(detectionInterval.value)
      detectionInterval.value = null
    }
    
    // Effacer le canvas si la détection est désactivée
    if (canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    }
    
    // Réinitialiser les compteurs
    detectionCount.value = 0
    recognizedPatients.value = []
  }
})

// Observer les changements de l'état de la caméra
watch(() => props.isActive, (newValue) => {
  if (newValue) {
    startCamera()
    if (showDetection.value) {
      startFaceDetection()
    }
  } else {
    if (detectionInterval.value) {
      clearInterval(detectionInterval.value)
      detectionInterval.value = null
    }
    
    // Réinitialiser les compteurs
    detectionCount.value = 0
    recognizedPatients.value = []
  }
})

// Activer/désactiver le flash
async function toggleFlash() {
  try {
    // En développement, ne fait rien
    if (import.meta.env.DEV) {
      console.log('Toggle flash (simulation)')
      return
    }
    
    // En production, envoie une commande au ESP32-CAM
    const flashOn = await cameraService.toggleFlash(true)
    
    // Après 1 seconde, éteindre le flash
    setTimeout(() => {
      cameraService.toggleFlash(false)
    }, 1000)
  } catch (error) {
    console.error('Erreur lors du contrôle du flash:', error)
  }
}

// Gestion du plein écran
function toggleFullscreen() {
  try {
    // Vérifier si nous utilisons un iframe ou l'élément vidéo standard
    const container = videoRef.value?.parentNode
    const usingIframe = container?.querySelector('iframe.camera-iframe')
    
    // Élément à mettre en plein écran (iframe ou vidéo)
    const elementToFullscreen = usingIframe || videoRef.value
    
    if (!elementToFullscreen) {
      console.error('[RoomCamera] Aucun élément vidéo trouvé pour le plein écran')
      return
    }
    
  if (!document.fullscreenElement) {
      // Mettre en plein écran
      elementToFullscreen.requestFullscreen()
    isFullscreen.value = true
  } else {
      // Sortir du plein écran
    document.exitFullscreen()
    isFullscreen.value = false
  }
  } catch (error) {
    console.error('[RoomCamera] Erreur lors du basculement en plein écran:', error)
  }
}

// Fonction pour capturer un visage
async function captureFace() {
  if (!videoRef.value || !props.isActive) return
  
  try {
    // Capturer l'image actuelle
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.value.videoWidth
    canvas.height = videoRef.value.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
    
    // Convertir en base64
    captureImageUrl.value = canvas.toDataURL('image/jpeg')
    
    // Afficher le modal
    showCaptureModal.value = true
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de la capture du visage:', error)
  }
}

// Fonction pour enregistrer le visage capturé
async function saveCapturedFace() {
  if (!captureImageUrl.value || !capturePatientId.value) {
    return
  }
  
  try {
    await faceRecognitionService.registerFace(capturePatientId.value, captureImageUrl.value)
    
    // Fermer le modal et réinitialiser
    closeCaptureModal()
    
    // Recharger la base de données
    await faceRecognitionService.reloadDatabase()
    
    // Notification de succès (à implémenter selon votre système de notification)
    console.log('[RoomCamera] Visage enregistré avec succès')
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de l\'enregistrement du visage:', error)
  }
}

// Fonction pour fermer le modal de capture
function closeCaptureModal() {
  showCaptureModal.value = false
  capturePatientId.value = ''
  captureImageUrl.value = ''
}

// Surveillance des changements d'état
watch(() => props.isActive, (newValue, oldValue) => {
  console.log(`[RoomCamera] Changement d'état de la caméra: ${oldValue} -> ${newValue}`);
  
  if (newValue) {
    console.log('[RoomCamera] Démarrage de la caméra suite au changement d\'état');
    // Attendre un court délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
      startCamera();
    }, 1000);
  } else {
    console.log('[RoomCamera] Arrêt de la caméra suite au changement d\'état');
    stopCamera();
  }
})

// Lifecycle hooks
onMounted(() => {
  console.log('[RoomCamera] Composant monté, état actif:', props.isActive);
  
  if (props.isActive) {
    console.log('[RoomCamera] Activation automatique de la caméra au montage');
    // Attendre un court délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
      startCamera();
    }, 1000);
  }
  
  // Écouter les changements de plein écran
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
  
  // Précharger les modèles de détection faciale
  cameraService.initializeFaceDetection().then(() => {
    console.log('[RoomCamera] Modèles de détection faciale préchargés');
    
    // Charger les visages stockés
    cameraService.loadFacesFromStorage();
  });
})

onBeforeUnmount(() => {
  stopCamera()
  document.removeEventListener('fullscreenchange', () => {})
})

// Fonction pour ouvrir le modal de configuration avancée
async function openAdvancedConfig() {
  showAdvancedConfigModal.value = true
  
  try {
    // Récupérer les paramètres avancés
    const result = await faceRecognitionService.getCameraAdvancedSettings()
    availablePresets.value = result.availablePresets || []
    availableParameters.value = result.availableParameters || {}
    
    // Copier les paramètres actuels
    if (result.camera && result.camera.settings) {
      advancedSettings.value = { ...result.camera.settings }
      selectedPreset.value = result.camera.quality || 'medium'
      
      // Mettre à jour les contrôles rapides
      updateQuickSettings()
    }
    
    console.log('[RoomCamera] Paramètres avancés récupérés:', result)
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de la récupération des paramètres avancés:', error)
    alert('Erreur lors de la récupération des paramètres avancés de la caméra')
  }
}

// Fonction pour fermer le modal de configuration avancée
function closeAdvancedConfigModal() {
  showAdvancedConfigModal.value = false
}

// Fonction pour appliquer un préréglage de qualité
async function applyPreset(preset) {
  try {
    console.log(`[RoomCamera] Application du préréglage: ${preset}`)
    selectedPreset.value = preset
    const result = await faceRecognitionService.applyCameraPreset(preset)
    
    if (result.status === 'success') {
      // Mettre à jour les paramètres affichés
      if (result.camera && result.camera.settings) {
        advancedSettings.value = { ...result.camera.settings }
      }
      
      // Rafraîchir le flux vidéo
      refreshStream()
    } else {
      console.error('[RoomCamera] Erreur lors de l\'application du préréglage:', result.message)
    }
  } catch (error) {
    console.error(`[RoomCamera] Erreur lors de l'application du préréglage ${preset}:`, error)
    alert(`Erreur lors de l'application du préréglage: ${error.message || error}`)
  }
}

// Fonction pour appliquer les paramètres personnalisés
async function applyCustomSettings() {
  try {
    console.log('[RoomCamera] Application des paramètres personnalisés:', advancedSettings.value)
    const result = await faceRecognitionService.configureCameraAdvanced(advancedSettings.value)
    
    if (result.status === 'success') {
      // Rafraîchir le flux vidéo
      refreshStream()
      // Fermer le modal
      closeAdvancedConfigModal()
    } else {
      console.error('[RoomCamera] Erreur lors de l\'application des paramètres:', result.message)
      alert(`Erreur: ${result.message}`)
    }
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de l\'application des paramètres personnalisés:', error)
    alert(`Erreur lors de l'application des paramètres: ${error.message || error}`)
  }
}

// Fonction pour rafraîchir le flux vidéo après changement de configuration
function refreshStream() {
  // Si nous utilisons le flux Python, redémarrer le flux
  console.log('[RoomCamera] Rafraîchissement du flux après configuration')
  
  // Vérifier le type de flux actuel
  const container = videoRef.value?.parentNode
  const usingIframe = container?.querySelector('iframe.camera-iframe')
  const isPythonStream = usingIframe?.src.includes('/api/camera/live')
  
  if (isPythonStream) {
    // Pour le flux Python, redémarrer avec les nouveaux paramètres
    useDirectPythonStream()
  } else if (usingIframe) {
    // Pour le flux MJPEG direct, rafraîchir l'iframe
    usingIframe.src = usingIframe.src.split('?')[0] + `?t=${Date.now()}`
  } else if (videoRef.value) {
    // Pour les autres types de flux, utiliser la méthode standard
    cameraService.refreshVideoStream(videoRef.value)
  }
}

// Ajouter une fonction pour tenter de redémarrer la détection faciale
async function restartFaceDetection() {
  try {
    console.log('[RoomCamera] Tentative de redémarrage de la détection faciale')
    
    // Vérifier si le service Python est disponible
    const isConnected = await faceRecognitionService.checkConnection()
    
    if (isConnected) {
      console.log('[RoomCamera] Service Python à nouveau disponible, réactivation de la détection faciale')
      pythonServiceAvailable.value = true
      consecutiveErrors.value = 0
      showDetection.value = true
      startFaceDetection()
      
      // Afficher une notification à l'utilisateur
      const notificationContainer = document.createElement('div')
      notificationContainer.className = 'detection-success-notification'
      notificationContainer.innerHTML = `
        <div class="p-3 bg-green-100 border border-green-200 rounded-lg">
          <p class="text-green-800 text-sm">Service de détection faciale reconnecté avec succès.</p>
        </div>
      `
      
      const container = videoRef.value?.parentNode
      if (container) {
        container.appendChild(notificationContainer)
        
        // Supprimer la notification après 5 secondes
        setTimeout(() => {
          if (container.contains(notificationContainer)) {
            container.removeChild(notificationContainer)
          }
        }, 5000)
      }
      
      return true
    } else {
      console.warn('[RoomCamera] Le service Python est toujours indisponible')
      return false
    }
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de la tentative de redémarrage:', error)
    return false
  }
}

// Fonction pour appliquer les paramètres rapides
async function applyQuickSettings() {
  try {
    console.log('[RoomCamera] Application des paramètres rapides')
    
    // Créer un objet avec les paramètres à appliquer
    const settings = {
      framesize: parseInt(quickResolution.value),
      quality: parseInt(quickQuality.value),
      brightness: quickBrightness.value,
      contrast: quickContrast.value,
      saturation: quickSaturation.value
    }
    
    console.log('[RoomCamera] Paramètres à appliquer:', settings)
    
    // Si le service Python est disponible, utiliser l'API avancée
    if (pythonServiceAvailable.value) {
      try {
        const result = await faceRecognitionService.configureCameraAdvanced(settings)
        console.log('[RoomCamera] Résultat de la configuration via Python:', result)
        
        // Mettre à jour les paramètres avancés
        if (result.status === 'success' && result.camera?.settings) {
          advancedSettings.value = { ...result.camera.settings }
        }
      } catch (error) {
        console.error('[RoomCamera] Erreur lors de la configuration via Python:', error)
        
        // Essayer via la caméra directe comme fallback
        try {
          await cameraService.setCustomCameraParameters(settings)
        } catch (directError) {
          console.error('[RoomCamera] Erreur lors de la configuration directe:', directError)
          throw directError
        }
      }
    } else {
      // Fallback: configurer directement via la caméra
      try {
        await cameraService.setCustomCameraParameters(settings)
      } catch (error) {
        console.error('[RoomCamera] Erreur lors de la configuration directe:', error)
        throw error
      }
    }
    
    // Rafraîchir le flux après application des paramètres
    refreshStream()
    
    return true
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de l\'application des paramètres rapides:', error)
    alert('Erreur lors de la modification des paramètres de la caméra')
    return false
  }
}

// Fonction pour mettre à jour les contrôles rapides en fonction des paramètres avancés
function updateQuickSettings() {
  try {
    // Si nous avons des paramètres avancés, les utiliser pour mettre à jour les contrôles rapides
    if (advancedSettings.value) {
      // Mettre à jour les valeurs des contrôles rapides
      quickResolution.value = String(advancedSettings.value.framesize || 5)
      quickQuality.value = String(advancedSettings.value.quality || 10)
      quickBrightness.value = advancedSettings.value.brightness || 0
      quickContrast.value = advancedSettings.value.contrast || 0
      quickSaturation.value = advancedSettings.value.saturation || 0
    }
    
    console.log('[RoomCamera] Contrôles rapides mis à jour avec les paramètres actuels')
  } catch (error) {
    console.error('[RoomCamera] Erreur lors de la mise à jour des contrôles rapides:', error)
  }
}
</script>

<style scoped>
.camera-container {
  @apply w-full;
}

.camera-view {
  @apply relative bg-gray-900 rounded-lg overflow-hidden aspect-video;
}

.camera-disabled {
  @apply bg-gray-800;
}

.camera-disabled-overlay {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.camera-indicators {
  @apply absolute top-4 left-4 flex items-center space-x-2;
}

.recording-indicator {
  @apply flex items-center space-x-2 px-2 py-1 bg-black/50 rounded-full text-white;
}

.pulse-dot {
  @apply w-2 h-2 bg-red-500 rounded-full;
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.camera-controls {
  @apply absolute bottom-4 right-4 flex items-center space-x-2;
}

.control-btn {
  @apply p-2 bg-black/50 rounded-full text-white 
         hover:bg-black/70 transition-colors duration-200;
}

.quality-btn {
  font-weight: bold;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.quality-indicator {
  font-size: 12px;
  font-weight: bold;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.face-capture-modal {
  @apply fixed inset-0 flex items-center justify-center z-50 bg-black/50;
}

.face-capture-content {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 dark:text-gray-200 shadow-xl;
}

.preview-container {
  @apply bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden;
  aspect-ratio: 4/3;
}

.camera-quick-settings {
  @apply w-full rounded-lg;
}
</style> 