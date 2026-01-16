<template>


  <div class="dashboard p-6">
    <header class="mb-8">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ currentDateTime }}</p>
        </div>
        <div class="flex items-center gap-4">
          <button 
            class="btn-refresh p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'animate-spin': isRefreshing }"
            @click="refreshData"
          >
            <RefreshCw class="w-5 h-5" />
          </button>
          <button 
            @click="toggleLiveMonitoring" 
            class="live-monitoring-btn"
            :class="{ 'active': isLiveMonitoringActive }"
          >
            <Activity class="w-5 h-5" />
            <span class="hidden lg:inline ml-2">Surveillance en direct</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="stat in stats" 
          :key="stat.label" 
          class="stat-card"
          :class="{'alert': stat.isAlert}"
        >
          <div class="flex items-center">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="stat.iconBg"
            >
              <component :is="getIconComponent(stat.icon)" class="w-6 h-6" :class="stat.iconColor" />
            </div>
            <div class="ml-4 flex-1">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ stat.label }}</h3>
              <div class="flex items-center justify-between">
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stat.value }}</p>
                <div class="flex items-center gap-2">
                  <span 
                    v-if="stat.trend !== undefined" 
                    class="text-sm flex items-center"
                    :class="stat.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                  >
                    <component 
                      :is="stat.trend > 0 ? TrendingUp : TrendingDown"
                      class="w-4 h-4 mr-1"
                    />
                    {{ Math.abs(stat.trend) }}%
                  </span>
                  <span v-if="stat.timeframe" class="text-xs text-gray-500">
                    {{ stat.timeframe }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="stat.details" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ stat.details }}
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Section de surveillance des chambres -->
      <section class="dashboard-card" v-if="!dashboardStore.isLoading">
        <div class="flex items-center justify-between mb-6">
          <h2 class="section-title">
            <Building2 class="w-5 h-5 text-blue-500 mr-2" />
            Surveillance des chambres
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({{ criticalRooms.length }})
            </span>
          </h2>
          <div>
            <button 
              @click="toggleAllCameras" 
              class="action-btn mr-2"
              :title="areAllCamerasActive ? 'Désactiver les caméras' : 'Activer les caméras'"
            >
              <Video v-if="!areAllCamerasActive" class="w-4 h-4" />
              <VideoOff v-else class="w-4 h-4" />
            </button>
            <router-link to="/rooms" class="view-all-link">
              Voir tous
              <ChevronRight class="w-4 h-4 ml-1" />
            </router-link>
          </div>
        </div>
        
        <div v-if="patientStore.isLoading" class="flex justify-center items-center h-40">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
        
        <div v-else-if="criticalRooms.length === 0" class="empty-state">
          <Building2 class="w-8 h-8 text-gray-400 mb-2" />
          <p>Aucune chambre avec patients critiques</p>
        </div>
        
        <div v-else class="rooms-grid">
          <div v-for="room in criticalRooms.slice(0, 3)" 
               :key="room.numero" 
               class="room-preview-card"
          >
            <div class="room-header">
              <h3 class="font-medium text-lg">
                Chambre {{ room.numero }}
                <span :class="['room-status-badge', getRoomStatusClass(room.status)]">
                  {{ room.status }}
                </span>
              </h3>
              <button 
                @click="toggleRoomCamera(room.numero)"
                class="room-action-btn"
              >
                <Video v-if="!room.camerasActive" class="w-4 h-4" />
                <VideoOff v-else class="w-4 h-4" />
              </button>
            </div>
            
            <div v-if="room.camerasActive" class="room-video-container">
              <div class="flex justify-center items-center h-32 bg-gray-800 text-gray-400 text-sm rounded-lg">
                <span>Caméra de surveillance non disponible</span>
              </div>
            </div>
            
            <div class="patients-preview">
              <div v-for="patient in room.patients" 
                   :key="patient.id"
                   class="patient-preview"
                  :class="{'critical': patient.etat === 'Critique'}"
              >
                <div class="flex items-center justify-between p-3">
                  <div class="flex items-center space-x-3">
                    <UserCircle class="w-6 h-6 text-gray-400" />
                    <div>
                      <span class="font-medium text-gray-900 dark:text-white">
                        {{ patient.nom }} {{ patient.prenom }}
                      </span>
                      <span :class="['status-badge ml-2', getStatusClass(patient.etat)]">
                        {{ patient.etat }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-4">
                    <div class="vital-sign" :class="{'alert': isVitalSignCritical(patient.signesVitaux.frequenceCardiaque, 'heartRate')}">
                      <Heart class="w-4 h-4" />
                      <span>{{ patient.signesVitaux.frequenceCardiaque }}</span>
                    </div>
                    <div class="vital-sign" :class="{'alert': isVitalSignCritical(patient.signesVitaux.temperature, 'temperature')}">
                      <Thermometer class="w-4 h-4" />
                      <span>{{ patient.signesVitaux.temperature }}°</span>
                    </div>
                    <div class="vital-sign" :class="{'alert': isVitalSignCritical(patient.signesVitaux.respiration, 'respiration')}">
                      <Wind class="w-4 h-4" />
                      <span>{{ patient.signesVitaux.respiration }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section des documents rapides et des prochains rendez-vous -->
      <section class="dashboard-card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="section-title">
            <ClipboardList class="w-5 h-5 text-blue-500 mr-2" />
            Documents rapides
          </h2>
        </div>

        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <button 
              @click="showBilletSalleModal = true"
              class="document-action-btn"
            >
              <div class="btn-content">
                <div class="doc-icon bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                  <FileText class="w-6 h-6" />
                </div>
                <div class="doc-text">
                  <span class="doc-title">Billet de salle</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Créer un nouveau billet</span>
                </div>
              </div>
            </button>
            
            <button 
              @click="createOrdonnance"
              class="document-action-btn"
            >
              <div class="btn-content">
                <div class="doc-icon bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <ClipboardList class="w-6 h-6" />
                </div>
                <div class="doc-text">
                  <span class="doc-title">Ordonnance</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Nouvelle prescription</span>
                </div>
              </div>
            </button>
            
            <button 
              @click="createCertificat"
              class="document-action-btn"
            >
              <div class="btn-content">
                <div class="doc-icon bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                  <FileCheck class="w-6 h-6" />
                </div>
                <div class="doc-text">
                  <span class="doc-title">Certificat</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Certificat médical</span>
                </div>
              </div>
            </button>
            
            <button 
              @click="createCompteRendu"
              class="document-action-btn"
            >
              <div class="btn-content">
                <div class="doc-icon bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                  <FileText class="w-6 h-6" />
                </div>
                <div class="doc-text">
                  <span class="doc-title">Compte rendu</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Rapport de consultation</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Prochains rendez-vous -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Calendar class="w-5 h-5 text-purple-500 mr-2" />
              Prochains rendez-vous
            </h3>
          </div>
          
          <div v-if="appointmentStore.loading" class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
          
          <div class="space-y-3" v-else>
            <div v-if="upcomingAppointments.length === 0" class="empty-state">
              <Calendar class="w-8 h-8 text-gray-400 mb-2" />
              <p>Aucun rendez-vous prévu</p>
            </div>
            
            <div 
              v-else
              v-for="appointment in upcomingAppointments.slice(0, 3)" 
              :key="appointment.id"
              class="appointment-card"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 
                             flex items-center justify-center">
                    <Clock class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white">
                      {{ appointment.patient.nom }} {{ appointment.patient.prenom }}
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                     {{ formatTime(appointment.heureDebut)  }} - {{ formatTime(appointment.heureFin) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span :class="getAppointmentTypeClass(appointment.type)" class="appointment-type-badge">
                    {{ appointment.type }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Alertes flottantes -->
    <TransitionGroup 
      tag="div" 
      name="alerts" 
      class="fixed bottom-4 right-4 space-y-2 z-50"
    >
      <div 
        v-for="alert in activeAlerts" 
        :key="alert.id"
        class="alert-toast"
        :class="{
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/20 dark:text-red-400': alert.type === 'critical',
          'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/20 dark:text-yellow-400': alert.type === 'warning',
          'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800/20 dark:text-green-400': alert.type === 'success',
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/20 dark:text-blue-400': alert.type === 'info',
          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800/20 dark:text-gray-400': !alert.type || alert.type === 'error'
        }"
      >
        <component :is="alert.icon" class="w-5 h-5" />
        <span>{{ alert.message }}</span>
        <button @click="dismissAlert(alert.id)" class="ml-2">
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>

    <!-- Modal Billet de Salle -->
    <BilletSalleModal
      v-if="showBilletSalleModal"
      @close="showBilletSalleModal = false"
    />

    <!-- Modals des formulaires -->
    <PrescriptionForm
      v-if="showPrescriptionForm"
      @submit="handlePrescriptionSubmit"
      @cancel="showPrescriptionForm = false"
      @close="showPrescriptionForm = false"
    />

    <ConsultationForm
      v-if="showConsultationForm"
      @submit="handleConsultationSubmit"
      @cancel="showConsultationForm = false"
      @close="showConsultationForm = false"
    />

    <RapportForm
      v-if="showRapportForm"
      @submit="handleRapportSubmit"
      @cancel="showRapportForm = false"
      @close="showRapportForm = false"
    />

    <CertificatForm
      v-if="showCertificatForm"
      @submit="handleCertificatSubmit"
      @cancel="showCertificatForm = false"
      @close="showCertificatForm = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientStore } from '@/stores/patients'
import { useAppointmentStore } from '@/stores/appointments'
import { useDashboardStore } from '@/stores/dashboardStore';
import { format } from 'date-fns'
import { 
  Activity, AlertCircle, Calendar, ChevronRight, 
  Heart, Thermometer, Wind, RefreshCw,
  TrendingUp, TrendingDown, Users, Clock,
  AlertTriangle, Calendar as CalendarIcon, Play,
  CheckCircle, UserCircle, Building2, Video, VideoOff,
  X, ExternalLink, ClipboardList, FileText, FileCheck,
  Pill, Stethoscope
} from 'lucide-vue-next'
import BilletSalleModal from '@/components/medical/BilletSalleModal.vue'
import DocumentCard from '@/components/cards/DocumentCard.vue'
import PrescriptionForm from '@/components/forms/PrescriptionForm.vue'
import ConsultationForm from '@/components/forms/ConsultationForm.vue'
import RapportForm from '@/components/forms/RapportForm.vue'
import CertificatForm from '@/components/forms/CertificatForm.vue'
import axios from '@/services/axios'

const router = useRouter()
const patientStore = usePatientStore()
const appointmentStore = useAppointmentStore()
const dashboardStore = useDashboardStore()
const currentDateTime = ref('')
const isRefreshing = ref(false)
const isLiveMonitoringActive = ref(true)
const activeAlerts = ref([])
const showBilletSalleModal = ref(false)
const showPrescriptionForm = ref(false)
const showConsultationForm = ref(false)
const showRapportForm = ref(false)
const showCertificatForm = ref(false)
const roomFilter = ref('all')
let timer
let monitoringTimer

// Computed properties
const areAllCamerasActive = computed(() => {
  const rooms = patientStore.rooms || []
  return rooms.length > 0 && rooms.every(room => room.camerasActive)
})

// Stats
const stats = computed(() => {
  if (dashboardStore.isLoading) {
    return [
      {
        label: 'Patients actifs',
        value: '...',
        icon: 'Users',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600'
      },
      {
        label: 'Consultations aujourd\'hui',
        value: '...',
        icon: 'Clock',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600'
      },
      {
        label: 'Rendez-vous à venir',
        value: '...',
        icon: 'CalendarIcon',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600'
      },
      {
        label: 'Alertes',
        value: '...',
        icon: 'AlertTriangle',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600'
      }
    ]
  }
  
  // Si les stats sont un tableau, utilisez-les directement
  if (Array.isArray(dashboardStore.stats)) {
    return dashboardStore.stats.map(stat => ({
      ...stat,
      iconColor: getIconColor(stat.icon)
    }))
  }
  
  // Fallback au cas où stats n'est pas un tableau
  return [
    {
      label: 'Patients hospitalisés',
      value: patientStore.patientsHospitalises?.length || 0,
      trend: 0,
      icon: 'Users',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Consultations aujourd\'hui',
      value: appointmentStore.todayAppointments?.length || 0,
      trend: 0,
      icon: 'Clock',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      label: 'Rendez-vous à venir',
      value: upcomingAppointments.value?.length || 0,
      trend: 0,
      icon: 'CalendarIcon',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Patients critiques',
      value: criticalPatients.value?.length || 0,
      trend: 0,
      icon: 'AlertTriangle',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      isAlert: criticalPatients.value?.length > 0
    }
  ]
})

function getIconColor(iconName) {
  const colors = {
    'Users': 'text-blue-600',
    'Clock': 'text-green-600',
    'CalendarIcon': 'text-purple-600',
    'AlertTriangle': 'text-red-600',
    'Stethoscope': 'text-indigo-600'
  }
  return colors[iconName] || 'text-gray-600'
}

// Computed properties pour les patients
const criticalPatients = computed(() => 
  patientStore.patientsHospitalises?.filter(p => p.status === 'Critique') || []
)

const criticalRooms = computed(() => {
  // Grouper les patients par chambre
  const rooms = []
  const patientsGroups = {}
  
  // Créer des groupes par numéro de chambre
  patientStore.patientsHospitalises?.forEach(patient => {
    if (patient.chambre_numero) {
      if (!patientsGroups[patient.chambre_numero]) {
        patientsGroups[patient.chambre_numero] = []
      }
      patientsGroups[patient.chambre_numero].push(patient)
    }
  })
  
  // Créer des objets de chambre à partir de ces groupes
  Object.keys(patientsGroups).forEach(chambreNumero => {
    const patients = patientsGroups[chambreNumero]
    const hasCritical = patients.some(p => p.status === 'Critique')
    const hasObservation = patients.some(p => p.status === 'Attention')
    
    // N'ajouter que les chambres avec des patients critiques ou en observation
    if (hasCritical || hasObservation) {
      rooms.push({
        numero: chambreNumero,
        status: hasCritical ? 'critique' : 'attention',
        patients: patients.map(p => {
          // Extraire le prénom et le nom depuis la propriété nom
          let prenom = '', nom = '';
          const nomComplet = p.nom || '';
          if (nomComplet.includes(' ')) {
            [nom, prenom] = nomComplet.split(' ', 2);
          } else {
            nom = nomComplet;
          }
          
          return {
            id: p.patient_id || p.id,
            nom: nom,
            prenom: prenom,
            etat: p.status,
            signesVitaux: {
              frequenceCardiaque: p.parametres.frequenceCardiaque,
              temperature: p.parametres.temperature,
              respiration: p.parametres.saturationO2
            }
          }
        }),
        camerasActive: false
      })
    }
  })
  
  return rooms
})

const upcomingAppointments = computed(() => {
  // Filtre pour les rendez-vous à venir (aujourd'hui ou dans le futur)
  return appointmentStore.appointments
    .filter(appointment => {
      try {
        const appointmentDate = new Date(appointment.date || appointment.dateDebut)
        return appointmentDate >= new Date(new Date().setHours(0, 0, 0, 0))
      } catch (error) {
        console.error('Error processing appointment date:', error)
        return false
      }
    })
    .slice(0, 10) // Limiter à 10 rendez-vous
    .map(appointment => {
      // Date de fin calculée (30 minutes après le début si non spécifiée)
      let heureFin;
      const appointmentDate = new Date(appointment.date || appointment.dateDebut);
      
      if (appointment.dateFin) {
        heureFin = new Date(appointment.dateFin).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        heureFin = new Date(appointmentDate.getTime() + 30*60000).toLocaleTimeString('fr-FR', {
          hour: '2-digit', 
          minute: '2-digit'
        });
      }
      
      // Nom du patient
      let nom = 'Patient', prenom = '';
      
      if (appointment.patient?.utilisateur) {
        nom = appointment.patient.utilisateur.nom || 'Patient';
        prenom = appointment.patient.utilisateur.prenom || '';
      } else if (appointment.patient) {
        nom = appointment.patient.nom || 'Patient';
        prenom = appointment.patient.prenom || '';
      } else if (appointment.nom_patient) {
        nom = appointment.nom_patient;
      }
      
      return {
        id: appointment._id || appointment.id,
        type: appointment.type || 'Consultation',
        heureDebut: appointmentDate.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        heureFin: heureFin,
        patient: {
          nom: nom,
          prenom: prenom
        }
      }
    })
})

// Functions
const updateDateTime = () => {
  const now = new Date()
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  currentDateTime.value = new Intl.DateTimeFormat('fr-FR', options).format(now)
}

const formatTime = (time) => {
  // Si time est déjà au format hh:mm, on le retourne directement
  if (typeof time === 'string' && time.match(/^\d{1,2}:\d{2}$/)) {
    // Convert hh:mm format to Date and subtract 1 hour
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours - 1, minutes); // Subtract 1 hour
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  try {
    if (typeof time === 'string') {
      // Create date and subtract 1 hour
      const date = new Date(`2000-01-01T${time}`);
      date.setHours(date.getHours() - 1); // Subtract 1 hour
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return time;
  } catch (error) {
    console.error('Error formatting time:', error, time);
    return time;
  }
}

const vitalSignThresholds = {
  heartRate: { min: 60, max: 100 },
  temperature: { min: 36.5, max: 37.5 },
  respiration: { min: 92, max: 100 } // Pour la saturation en O2
}

const isVitalSignCritical = (value, type) => {
  if (!value || !type || value === '--') return false
  const threshold = vitalSignThresholds[type]
  if (!threshold) return false
  
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return false
  
  return numValue < threshold.min || numValue > threshold.max
}

const refreshData = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([
      patientStore.fetchPatientsHospitalises(),
      dashboardStore.fetchDashboardStats(),
      appointmentStore.fetchAppointments()
    ])
    
    // Ajouter une alerte pour les patients critiques
    const criticalCount = criticalPatients.value.length
    if (criticalCount > 0) {
      addAlert({
        id: Date.now(),
        message: `${criticalCount} patient${criticalCount > 1 ? 's' : ''} en état critique`,
        icon: AlertTriangle,
        type: 'critical'
      })
    }
  } catch (error) {
    console.error('Erreur lors du rafraîchissement des données:', error)
    addAlert({
      id: Date.now(),
      message: 'Erreur lors du rafraîchissement des données',
      icon: AlertCircle,
      type: 'error'
    })
  } finally {
    isRefreshing.value = false
  }
}

const getRoomStatusClass = (status) => {
  switch (status) {
    case 'critique': return 'bg-red-100 text-red-800'
    case 'attention': return 'bg-yellow-100 text-yellow-800'
    case 'occupée': return 'bg-blue-100 text-blue-800'
    case 'disponible': return 'bg-green-100 text-green-800'
    case 'nettoyage': return 'bg-yellow-100 text-yellow-800'
    default: return ''
  }
}

const getStatusClass = (etat) => {
  switch (etat) {
    case 'Stable': return 'bg-green-100 text-green-800'
    case 'Critique': return 'bg-red-100 text-red-800'
    case 'Attention': return 'bg-yellow-100 text-yellow-800'
    default: return ''
  }
}

const getIconComponent = (iconName) => {
  const iconMap = {
    'Users': Users,
    'Clock': Clock,
    'CalendarIcon': CalendarIcon,
    'Stethoscope': Stethoscope,
    'AlertTriangle': AlertTriangle
  };
  return typeof iconName === 'string' ? iconMap[iconName] || Users : iconName;
};

const toggleRoomCamera = (roomNumber) => {
  // Trouver l'index de la chambre dans le tableau
  const roomIndex = criticalRooms.value.findIndex(room => room.numero === roomNumber)
  if (roomIndex !== -1) {
    // Créer une copie de la chambre
    const room = { ...criticalRooms.value[roomIndex] }
    // Inverser l'état des caméras
    room.camerasActive = !room.camerasActive
    // Mettre à jour le tableau des chambres
    criticalRooms.value[roomIndex] = room
  }
}

const toggleLiveMonitoring = () => {
  isLiveMonitoringActive.value = !isLiveMonitoringActive.value
  
  if (isLiveMonitoringActive.value) {
    // Démarrer le monitoring
    monitoringTimer = setInterval(() => {
      // Mettre à jour les données des patients critiques
      criticalPatients.value.forEach(patient => {
        patientStore.refreshPatientVitals(patient.patient_id)
      })
    }, 10000)
  } else {
    // Arrêter le monitoring
    if (monitoringTimer) clearInterval(monitoringTimer)
  }
}

const toggleAllCameras = () => {
  const newState = !areAllCamerasActive.value
  criticalRooms.value.forEach(room => {
    room.camerasActive = newState
  })
}

const addAlert = (alert) => {
  activeAlerts.value.push(alert)
  // Supprimer automatiquement l'alerte après 5 secondes
  setTimeout(() => {
    dismissAlert(alert.id)
  }, 5000)
}

const dismissAlert = (alertId) => {
  activeAlerts.value = activeAlerts.value.filter(alert => alert.id !== alertId)
}

const getAppointmentTypeClass = (type) => {
  const classes = {
    'consultation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'suivi': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'urgence': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'contrôle': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  }
  return classes[type?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

// Fonctions pour les formulaires
const createOrdonnance = () => {
  showPrescriptionForm.value = true
}

const createCertificat = () => {
  showCertificatForm.value = true
}

const createCompteRendu = () => {
  showRapportForm.value = true
}

// Handlers pour les soumissions de formulaires
async function handlePrescriptionSubmit(data) {
  try {
    // Soumettre l'ordonnance à l'API
    const response = await axios.post('/prescriptions', data, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
    });
    
    console.log('Ordonnance créée avec succès', response.data);
    showPrescriptionForm.value = false;
    addAlert({
      id: Date.now(),
      message: 'Ordonnance créée avec succès',
      icon: CheckCircle,
      type: 'success'
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'ordonnance:', error);
    addAlert({
      id: Date.now(),
      message: error.response?.data?.message || 'Erreur lors de la création de l\'ordonnance',
      icon: AlertCircle,
      type: 'error'
    });
  }
}

async function handleConsultationSubmit(data) {
  try {
    // Soumettre la consultation à l'API
    const response = await axios.post('/consultations', data, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
    });
    
    console.log('Consultation enregistrée avec succès', response.data);
    showConsultationForm.value = false;
    addAlert({
      id: Date.now(),
      message: 'Consultation enregistrée avec succès',
      icon: CheckCircle,
      type: 'success'
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la consultation:', error);
    addAlert({
      id: Date.now(),
      message: error.response?.data?.message || 'Erreur lors de l\'enregistrement de la consultation',
      icon: AlertCircle,
      type: 'error'
    });
  }
}

async function handleRapportSubmit(data) {
  try {
    // Soumettre le rapport à l'API
    const response = await axios.post('/rapports', data, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
    });
    
    console.log('Rapport créé avec succès', response.data);
    showRapportForm.value = false;
    addAlert({
      id: Date.now(),
      message: 'Rapport créé avec succès',
      icon: CheckCircle,
      type: 'success'
    });
  } catch (error) {
    console.error('Erreur lors de la création du rapport:', error);
    addAlert({
      id: Date.now(),
      message: error.response?.data?.message || 'Erreur lors de la création du rapport',
      icon: AlertCircle,
      type: 'error'
    });
  }
}

async function handleCertificatSubmit(data) {
  try {
    // Soumettre le certificat à l'API
    const response = await axios.post('/certificats', data, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
    });
    
    console.log('Certificat créé avec succès', response.data);
    showCertificatForm.value = false;
    addAlert({
      id: Date.now(),
      message: 'Certificat créé avec succès',
      icon: CheckCircle,
      type: 'success'
    });
  } catch (error) {
    console.error('Erreur lors de la création du certificat:', error);
    addAlert({
      id: Date.now(),
      message: error.response?.data?.message || 'Erreur lors de la création du certificat',
      icon: AlertCircle,
      type: 'error'
    });
  }
}

// Lifecycle hooks
onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 60000)
  refreshData()
  
  // Mise en place du monitoring en direct si activé
  if (isLiveMonitoringActive.value) {
    monitoringTimer = setInterval(() => {
      // Mettre à jour les données des patients critiques
      if (patientStore.patientsHospitalises && patientStore.patientsHospitalises.length > 0) {
        criticalPatients.value.forEach(patient => {
          patientStore.refreshPatientVitals(patient.patient_id)
        })
      }
    }, 10000)
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (monitoringTimer) clearInterval(monitoringTimer)
})

// Watch pour les changements d'état des patients
watch(() => patientStore.patientsHospitalises, (newPatients, oldPatients) => {
  if (newPatients && oldPatients) {
    // Vérifier s'il y a de nouveaux patients critiques
    newPatients.forEach(newPatient => {
      const oldPatient = oldPatients.find(p => p.patient_id === newPatient.patient_id)
      if (oldPatient && oldPatient.status !== 'Critique' && newPatient.status === 'Critique') {
        // Un patient vient de devenir critique
        addAlert({
          id: Date.now(),
          message: `Le patient ${newPatient.nom} est maintenant en état critique`,
          icon: AlertTriangle,
          type: 'critical'
        })
      }
    })
  }
}, { deep: true })
</script>

<style scoped>
.dashboard {
  @apply bg-gray-50 dark:bg-gray-900 min-h-screen;
}

.dashboard-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 
         transform hover:shadow-lg transition-all duration-300;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white flex items-center;
}

.view-all-link {
  @apply text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 
         dark:hover:text-blue-300 flex items-center transition-colors;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm
         transform hover:scale-105 transition-all duration-300;
}

.monitoring-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 
         dark:border-gray-700 transform hover:scale-105 transition-all duration-300;
}

.appointment-card {
  @apply p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
         dark:border-gray-700 hover:shadow-md transition-all duration-200;
}

.appointment-time {
  @apply px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50
         text-blue-600 dark:text-blue-400 text-sm font-medium;
}

.action-button {
  @apply p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
         transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
         focus:ring-primary-500 dark:focus:ring-offset-gray-800;
}

.vital-signs-grid {
  @apply grid grid-cols-3 gap-4 mt-4;
}

.vital-sign {
  @apply flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300;
}

.vital-sign.alert {
  @apply text-red-600 dark:text-red-400;
  animation: pulse-red 2s infinite;
}

.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

/* Animations */
@keyframes pulse-red {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.empty-state {
  @apply flex flex-col items-center justify-center py-8 
          text-gray-500 dark:text-gray-400 bg-gray-50 
          dark:bg-gray-800/50 rounded-lg;
}

.vital-signs-compact {
  @apply flex items-center space-x-3;
}

.vital-signs-compact .vital-sign {
  @apply flex items-center space-x-1 px-2 py-1 rounded-md text-xs
         bg-gray-50 dark:bg-gray-700/50;
}

.patient-critical-card {
  @apply p-4 rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800
         hover:shadow-md transition-all duration-300;
}

.pulse-dot {
  @apply w-2 h-2 rounded-full bg-green-500;
  animation: pulse 2s infinite;
}

.rooms-grid {
  @apply space-y-4;
}

.room-preview-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden;
}

.room-header {
  @apply flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b dark:border-gray-700;
}

.room-title {
  @apply text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2;
}

.room-status-badge {
  @apply ml-2 px-2 py-0.5 text-xs font-medium rounded-full;
}

.patients-preview {
  @apply space-y-3;
}

.patient-preview {
  @apply border-b last:border-0 dark:border-gray-700
         hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors;
}

.patient-preview.critical {
  @apply bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500;
}

.patient-info {
  @apply flex justify-between items-center mb-2;
}

.vital-signs-compact {
  @apply flex items-center space-x-3;
}

.vital-signs-compact .vital-sign {
  @apply flex items-center space-x-1 px-2 py-1 rounded-md text-xs
         bg-gray-100 dark:bg-gray-600/50;
}

.vital-sign.alert {
  @apply bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400
         animate-pulse;
}

.video-preview {
  @apply mt-4 grid grid-cols-1 gap-4;
}

.video-feed {
  @apply relative aspect-video rounded-lg overflow-hidden bg-gray-900;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.main-monitoring-section {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6;
}

.monitoring-overview-card {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6;
}

.critical-room-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm;
}

.patient-monitoring-card {
  @apply mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg;
}

.camera-toggle-btn {
  @apply p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
         text-gray-600 dark:text-gray-300 transition-colors;
}

.status-indicator {
  @apply inline-block w-2 h-2 rounded-full ml-2;
}

.real-time-vitals {
  @apply flex flex-col space-y-1 items-end;
}

.quick-stats-container {
  @apply flex flex-col gap-4;
}

.stats-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm;
}

.stat-item {
  @apply flex justify-between items-center p-3 bg-gray-50 
         dark:bg-gray-700/50 rounded-lg;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.stat-value {
  @apply text-lg font-semibold;
}

.room-video-container {
  @apply relative aspect-video rounded-lg overflow-hidden mb-4;
}

.room-video {
  @apply w-full h-full object-cover;
}

.face-detection-canvas {
  @apply absolute inset-0 w-full h-full;
}

.face-detection-overlay {
  @apply absolute bottom-0 left-0 right-0 p-2
         bg-gradient-to-t from-black/70 to-transparent;
}

.patient-detection-status {
  @apply flex items-center text-sm text-white mb-1 opacity-50;
}

.patient-detection-status.detected {
  @apply opacity-100;
}

.detection-dot {
  @apply w-2 h-2 rounded-full bg-red-500 mr-2;
}

.detection-dot.active {
  @apply bg-green-500 animate-pulse;
}

.detection-info {
  @apply text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50
         text-blue-700 dark:text-blue-300 ml-2;
}

.action-btn {
  @apply p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
         text-gray-600 dark:text-gray-400 transition-colors;
}

.document-action-btn {
  @apply w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700
         bg-white dark:bg-gray-800 
         transition-all duration-300
         hover:bg-gray-50 dark:hover:bg-gray-700/50
         hover:shadow-lg hover:-translate-y-0.5
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
         dark:focus:ring-offset-gray-800
         active:transform active:scale-95;
}

.btn-content {
  @apply flex items-center space-x-4;
}

.doc-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center
         transform transition-transform group-hover:scale-110
         shadow-sm;
}

.doc-text {
  @apply flex flex-col items-start;
}

.doc-title {
  @apply font-medium text-gray-900 dark:text-white mb-0.5
         transform transition-all group-hover:translate-x-0.5;
}

.appointment-type-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.header-actions {
  @apply flex items-center justify-between;
}

.dashboard-content {
  @apply grid gap-6;
}

.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
         focus:outline-none focus:ring-2 focus:ring-offset-2 
         disabled:opacity-50 transition-all duration-200;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 
         focus:ring-primary-500 dark:focus:ring-primary-400
         shadow-sm hover:shadow-md;
}

.live-monitoring-btn {
  @apply flex items-center px-3 py-2 rounded-lg
         bg-gray-100 dark:bg-gray-700 
         hover:bg-gray-200 dark:hover:bg-gray-600
         text-gray-700 dark:text-gray-300;
}

.live-monitoring-btn.active {
  @apply bg-green-100 dark:bg-green-900/50
         text-green-700 dark:text-green-400;
}

.alert-toast {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
         border border-gray-200 dark:border-gray-700 text-sm;
}

.alerts-enter-active,
.alerts-leave-active {
  transition: all 0.3s ease;
}

.alerts-enter-from,
.alerts-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.stat-card.alert {
  @apply border-l-4 border-red-500;
}

.room-action-btn {
  @apply p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
         text-gray-600 dark:text-gray-400 transition-colors;
}
</style>