<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
    @click="$emit('view-details', patient)"
  >
    <div class="p-4">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <UserCircle class="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ patient.nom }} {{ patient.prenom }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Chambre {{ patient.chambre }}
          </p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">État</p>
          <span :class="[
            'inline-flex items-center mt-1 px-2 py-1 text-sm font-medium rounded-full',
            getStatusClass(patient.etat)
          ]">
            {{ patient.etat }}
          </span>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Date d'admission</p>
          <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {{ formatDate(patient.dateAdmission) }}
          </p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-4">
        <div class="vital-sign" :class="{'alert': isVitalSignCritical(patient.signesVitaux.frequenceCardiaque, 'heartRate')}">
          <Heart class="w-5 h-5" />
          <span>{{ patient.signesVitaux.frequenceCardiaque }} bpm</span>
        </div>

        <div class="vital-sign" :class="{'alert': isVitalSignCritical(patient.signesVitaux.temperature, 'temperature')}">
          <Thermometer class="w-5 h-5" />
          <span>{{ patient.signesVitaux.temperature }}°C</span>
        </div>

        <div class="vital-sign" :class="{'alert': isVitalSignCritical(patient.signesVitaux.respiration, 'respiration')}">
          <Wind class="w-5 h-5" />
          <span>{{ patient.signesVitaux.respiration }} rpm</span>
        </div>
      </div>

      <div v-if="showVideoFeed" class="mt-4">
        <div class="video-feed">
          <video 
            :id="`video-${patient.id}`" 
            ref="videoFeed"
            autoplay 
            class="rounded-lg w-full"
          ></video>
          <div class="video-overlay">
            <div class="face-detection-status" v-if="patient.faceData?.lastDetection">
              <span class="detection-confidence">
                Confiance: {{ Math.round(patient.faceData.lastDetection.confidence * 100) }}%
              </span>
              <span class="detection-expression">
                Expression: {{ patient.faceData.lastDetection.expression }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex justify-between items-center">
      <div class="text-sm">
        <span class="text-gray-500 dark:text-gray-400">Médecin traitant:</span>
        <span class="ml-1 text-gray-900 dark:text-gray-100">{{ patient.medecinTraitant }}</span>
      </div>
      <button 
        @click.stop="toggleVideo" 
        class="action-btn"
        :title="showVideoFeed ? 'Désactiver la caméra' : 'Activer la caméra'"
      >
        <Video v-if="!showVideoFeed" class="w-5 h-5" />
        <VideoOff v-else class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Heart, Thermometer, Wind, Video, VideoOff, UserCircle } from 'lucide-vue-next'
import * as faceapi from 'face-api.js'
import { usePatientStore } from '@/stores/patient'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view-details'])
const patientStore = usePatientStore()
const showVideoFeed = ref(false)
const videoFeed = ref(null)
let faceDetectionInterval = null

const formatDate = (date) => {
  return format(new Date(date), 'PPP', { locale: fr })
}

const getStatusClass = (etat) => {
  switch (etat) {
    case 'Stable': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
    case 'Critique': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
    case 'En observation': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
    default: return ''
  }
}

const isVitalSignCritical = (value, type) => {
  const thresholds = {
    heartRate: { min: 60, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    respiration: { min: 12, max: 20 }
  }
  
  if (!value || !type || !thresholds[type]) return false
  const { min, max } = thresholds[type]
  return value < min || value > max
}

const toggleVideo = async () => {
  showVideoFeed.value = !showVideoFeed.value
  if (showVideoFeed.value) {
    await initializeVideo()
  } else {
    stopVideo()
  }
}

// ... Réutiliser les fonctions de reconnaissance faciale du RoomMonitoring
const initializeVideo = async () => {
  try {
    await initializeFaceDetection()
    const video = document.getElementById(`video-${props.patient.id}`)
    if (video) {
      await startVideoStream(video)
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la vidéo:', error)
    showVideoFeed.value = false
  }
}

// ... Autres fonctions de gestion vidéo

onBeforeUnmount(() => {
  stopVideo()
})
</script>

<style scoped>
.vital-sign {
  @apply flex items-center justify-center space-x-2 p-2 rounded-lg 
         bg-gray-50 dark:bg-gray-700/50 text-sm;
}

.vital-sign.alert {
  @apply text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20;
  animation: pulse 2s infinite;
}

.video-feed {
  @apply relative aspect-video rounded-lg overflow-hidden;
}

.video-overlay {
  @apply absolute bottom-0 left-0 right-0 
         bg-gradient-to-t from-black/70 to-transparent
         p-2;
}

.face-detection-status {
  @apply flex justify-between text-xs text-white;
}

.action-btn {
  @apply p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
         text-gray-600 dark:text-gray-300 transition-colors;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
