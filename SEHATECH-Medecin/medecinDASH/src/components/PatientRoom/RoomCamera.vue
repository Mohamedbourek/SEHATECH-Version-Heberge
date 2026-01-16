<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useCameraStore } from '@/stores/cameraStore';
import { usePatientStore } from '@/stores/patientStore';
import { useToast } from 'vue-toastification';
import FaceRecognition from '@/components/FaceRecognition.vue';

const props = defineProps({
  patientId: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    required: true
  }
});

// Stores et services
const cameraStore = useCameraStore();
const patientStore = usePatientStore();
const toast = useToast();

// Références
const faceRecognitionComponent = ref(null);

// État
const loading = ref(false);
const recognizing = ref(false);
const registering = ref(false);
const cameraConnected = ref(false);
const lastRecognitionResult = ref(null);
const lastDetection = ref(null);
const displayRecognitionPanel = ref(false);
const recognizedPatientId = ref(null);
const recognitionConfidence = ref(0);

// Computed
const patient = computed(() => {
  return patientStore.getPatientById(props.patientId);
});

const patientName = computed(() => {
  if (!patient.value) return 'Patient inconnu';
  return `${patient.value.prenom} ${patient.value.nom}`;
});

const serviceUrl = computed(() => {
  return import.meta.env.VITE_FACE_RECOGNITION_SERVICE_URL || 'http://localhost:5001';
});

const cameraIp = computed(() => {
  return import.meta.env.VITE_ESP32_CAM_IP || '192.168.1.8';
});

const matchFound = computed(() => {
  return recognizedPatientId.value === props.patientId;
});

const isFaceDetectionEnabled = computed(() => {
  const configValue = import.meta.env.VITE_FACE_DETECTION_ENABLED;
  return configValue === 'true' || configValue === true;
});

// Méthodes
const onCameraStatusChanged = (status) => {
  cameraConnected.value = status.connected;
};

const onError = (error) => {
  console.error('Erreur caméra:', error);
  toast.error(`Erreur caméra: ${error.message}`);
};

const onFaceDetected = (result) => {
  lastDetection.value = result;
};

const onFaceRecognized = (result) => {
  lastRecognitionResult.value = result;
  recognizing.value = false;
  displayRecognitionPanel.value = true;
  
  // Analyse du résultat
  const patientDetected = result.faces.find(
    face => face.patient_id === props.patientId && face.confidence > 0.6
  );
  
  if (patientDetected) {
    recognizedPatientId.value = patientDetected.patient_id;
    recognitionConfidence.value = patientDetected.confidence;
    toast.success(`Patient ${patientName.value} reconnu avec une confiance de ${Math.round(patientDetected.confidence * 100)}%`);
  } else if (result.faces.length > 0) {
    const bestMatch = result.faces.reduce(
      (prev, current) => (prev.confidence > current.confidence) ? prev : current
    );
    
    recognizedPatientId.value = bestMatch.patient_id;
    recognitionConfidence.value = bestMatch.confidence;
    
    if (bestMatch.name !== 'Inconnu' && bestMatch.confidence > 0.6) {
      toast.warning(`Personne reconnue: ${bestMatch.name}. Ce n'est pas le patient ${patientName.value}.`);
    } else {
      toast.warning('Personne non reconnue.');
    }
  } else {
    toast.error('Aucun visage détecté.');
    recognizedPatientId.value = null;
    recognitionConfidence.value = 0;
  }
};

const detectFaces = async () => {
  if (!faceRecognitionComponent.value) return;
  
  try {
    loading.value = true;
    const result = await faceRecognitionComponent.value.detectFaces();
    loading.value = false;
    
    if (result && result.faces && result.faces.length > 0) {
      toast.info(`${result.faces.length} visage(s) détecté(s)`);
      lastDetection.value = result;
    } else {
      toast.warning('Aucun visage détecté');
    }
  } catch (error) {
    console.error('Erreur détection visages:', error);
    toast.error('Erreur lors de la détection des visages');
    loading.value = false;
  }
};

const recognizeFaces = async () => {
  if (!faceRecognitionComponent.value) return;
  
  try {
    recognizing.value = true;
    await faceRecognitionComponent.value.recognizeFaces();
    // Note: Le résultat est traité par l'événement onFaceRecognized
  } catch (error) {
    console.error('Erreur reconnaissance visages:', error);
    toast.error('Erreur lors de la reconnaissance des visages');
    recognizing.value = false;
  }
};

const registerFace = async () => {
  if (!faceRecognitionComponent.value || !patient.value) return;
  
  try {
    registering.value = true;
    const result = await faceRecognitionComponent.value.registerFace(
      props.patientId,
      patientName.value
    );
    
    if (result && result.status === 'success') {
      toast.success(`Visage de ${patientName.value} enregistré avec succès`);
    } else {
      toast.error('Erreur lors de l\'enregistrement du visage');
    }
    
    registering.value = false;
  } catch (error) {
    console.error('Erreur enregistrement visage:', error);
    toast.error('Erreur lors de l\'enregistrement du visage');
    registering.value = false;
  }
};

const closeRecognitionPanel = () => {
  displayRecognitionPanel.value = false;
};

onMounted(() => {
  if (isFaceDetectionEnabled.value) {
    cameraStore.setCameraStatus({
      patientId: props.patientId,
      roomId: props.roomId,
      connected: false,
      lastCheck: new Date()
    });
  }
});

// Observer les changements de statut de la caméra
watch(cameraConnected, (newStatus) => {
  cameraStore.setCameraStatus({
    patientId: props.patientId,
    roomId: props.roomId,
    connected: newStatus,
    lastCheck: new Date()
  });
});
</script>

<template>
  <div class="room-camera-container">
    <div v-if="isFaceDetectionEnabled" class="camera-module">
      <FaceRecognition
        ref="faceRecognitionComponent"
        :camera-ip="cameraIp"
        :service-url="serviceUrl"
        :auto-reconnect="true"
        :show-controls="false"
        @face-detected="onFaceDetected"
        @face-recognized="onFaceRecognized"
        @camera-status-changed="onCameraStatusChanged"
        @error="onError"
      />
      
      <div class="camera-controls">
        <button 
          @click="detectFaces" 
          :disabled="loading || recognizing || registering || !cameraConnected"
          class="control-btn detect-btn"
        >
          <i class="fas fa-eye"></i> Détecter
        </button>
        
        <button 
          @click="recognizeFaces" 
          :disabled="loading || recognizing || registering || !cameraConnected"
          class="control-btn recognize-btn"
        >
          <i class="fas fa-id-card"></i> Reconnaître
        </button>
        
        <button 
          @click="registerFace" 
          :disabled="loading || recognizing || registering || !cameraConnected"
          class="control-btn register-btn"
        >
          <i class="fas fa-user-plus"></i> Enregistrer
        </button>
      </div>
      
      <div v-if="displayRecognitionPanel" class="recognition-panel">
        <div class="panel-header">
          <h3>Résultat de reconnaissance</h3>
          <button @click="closeRecognitionPanel" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="panel-content">
          <div v-if="recognizedPatientId && recognitionConfidence > 0.6" 
               class="recognition-result"
               :class="{ 'match': matchFound, 'no-match': !matchFound }">
            <div v-if="matchFound" class="match-message">
              <i class="fas fa-check-circle"></i>
              <span>Identité confirmée</span>
            </div>
            <div v-else class="mismatch-message">
              <i class="fas fa-exclamation-triangle"></i>
              <span>Attention: personne différente détectée</span>
            </div>
            
            <div class="confidence-bar">
              <div class="confidence-label">Confiance:</div>
              <div class="progress-container">
                <div class="progress-bar" :style="{ width: `${recognitionConfidence * 100}%` }"></div>
              </div>
              <div class="confidence-value">{{ Math.round(recognitionConfidence * 100) }}%</div>
            </div>
          </div>
          
          <div v-else class="no-recognition">
            <i class="fas fa-user-slash"></i>
            <span>Personne non reconnue</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="camera-disabled">
      <i class="fas fa-video-slash"></i>
      <p>La reconnaissance faciale est désactivée</p>
    </div>
  </div>
</template>

<style scoped>
.room-camera-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.camera-module {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.camera-controls {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  background-color: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
}

.control-btn {
  padding: 8px 15px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.control-btn i {
  margin-right: 5px;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.detect-btn {
  background-color: var(--color-primary-lighter, #e3f2fd);
  color: var(--color-primary, #1976d2);
}

.detect-btn:hover:not(:disabled) {
  background-color: var(--color-primary-light, #bbdefb);
}

.recognize-btn {
  background-color: var(--color-success-lighter, #e8f5e9);
  color: var(--color-success, #2e7d32);
}

.recognize-btn:hover:not(:disabled) {
  background-color: var(--color-success-light, #c8e6c9);
}

.register-btn {
  background-color: var(--color-warning-lighter, #fff8e1);
  color: var(--color-warning, #ff8f00);
}

.register-btn:hover:not(:disabled) {
  background-color: var(--color-warning-light, #ffecb3);
}

.recognition-panel {
  position: absolute;
  bottom: 60px;
  left: 10px;
  right: 10px;
  background-color: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 10;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-heading);
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-light);
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--color-text);
}

.panel-content {
  padding: 15px;
}

.recognition-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border-radius: 6px;
}

.match {
  background-color: var(--color-success-lighter, #e8f5e9);
}

.no-match {
  background-color: var(--color-warning-lighter, #fff8e1);
}

.match-message {
  display: flex;
  align-items: center;
  color: var(--color-success, #2e7d32);
  margin-bottom: 15px;
  font-weight: 600;
}

.mismatch-message {
  display: flex;
  align-items: center;
  color: var(--color-warning-dark, #e65100);
  margin-bottom: 15px;
  font-weight: 600;
}

.match-message i,
.mismatch-message i {
  font-size: 24px;
  margin-right: 10px;
}

.confidence-bar {
  width: 100%;
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.confidence-label {
  width: 80px;
  font-size: 14px;
  color: var(--color-text);
}

.progress-container {
  flex: 1;
  height: 10px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  overflow: hidden;
  margin: 0 10px;
}

.progress-bar {
  height: 100%;
  background-color: var(--color-primary, #1976d2);
  border-radius: 5px;
}

.confidence-value {
  width: 50px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.no-recognition {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-error, #d32f2f);
  padding: 20px;
}

.no-recognition i {
  font-size: 32px;
  margin-bottom: 15px;
}

.camera-disabled {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-light);
  background-color: var(--color-background-mute);
  padding: 30px;
  text-align: center;
}

.camera-disabled i {
  font-size: 36px;
  margin-bottom: 15px;
  opacity: 0.5;
}

/* Styles pour le mode sombre */
@media (prefers-color-scheme: dark) {
  .detect-btn {
    background-color: rgba(25, 118, 210, 0.15);
  }

  .detect-btn:hover:not(:disabled) {
    background-color: rgba(25, 118, 210, 0.25);
  }

  .recognize-btn {
    background-color: rgba(46, 125, 50, 0.15);
  }

  .recognize-btn:hover:not(:disabled) {
    background-color: rgba(46, 125, 50, 0.25);
  }

  .register-btn {
    background-color: rgba(255, 143, 0, 0.15);
  }

  .register-btn:hover:not(:disabled) {
    background-color: rgba(255, 143, 0, 0.25);
  }

  .match {
    background-color: rgba(46, 125, 50, 0.15);
  }

  .no-match {
    background-color: rgba(255, 143, 0, 0.15);
  }
}
</style> 