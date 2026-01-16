<template>
  <div class="appointments-view p-6">
    <!-- En-tête -->
    <header class="mb-6">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Rendez-vous</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ todayAppointments.length }} rendez-vous aujourd'hui
          </p>
        </div>
        <button 
          @click="showNewAppointmentModal = true"
          class="btn-primary flex items-center"
          :disabled="isLoading"
        >
          <Plus class="w-5 h-5 mr-2" />
          Nouveau rendez-vous
        </button>
      </div>

      <!-- Filtres et recherche -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher par nom du patient, type ou statut..."
            class="search-input"
            :disabled="isLoading"
          />
          <Search class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <div class="flex gap-4">
          <select v-model="filterStatus" class="filter-select" :disabled="isLoading">
            <option value="">Tous les statuts</option>
            <option value="planifie">En attente</option>
            <option value="confirme">Confirmé</option>
            <option value="en cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
          <select v-model="filterDate" class="filter-select" :disabled="isLoading">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="all">Tous</option>
          </select>
        </div>
      </div>
    </header>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <Loader class="w-8 h-8 text-primary-600 animate-spin" />
      <span class="ml-2 text-gray-600 dark:text-gray-400">Chargement des rendez-vous...</span>
    </div>

    <!-- Error message -->
    <div v-else-if="errorMessage" class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
      <p>{{ errorMessage }}</p>
      <button 
        @click="appointmentStore.fetchAppointments()"
        class="mt-2 px-3 py-1 bg-red-200 dark:bg-red-800 rounded-md hover:bg-red-300 dark:hover:bg-red-700"
      >
        Réessayer
      </button>
    </div>

    <!-- Calendrier mensuel -->
    <div v-else class="calendar-container">
      <!-- En-tête des jours -->
      <div class="calendar-header">
        <div v-for="day in weekDays" :key="day" class="calendar-header-cell">
          {{ day }}
        </div>
      </div>
        
      <!-- Grille du calendrier -->
      <div class="calendar-grid">
        <div 
          v-for="date in calendarDays" 
          :key="date.toISOString()"
          class="calendar-cell"
          :class="{ 
            'other-month': !isSameMonth(date, currentMonth),
            'today': isToday(date)
          }"
        >
          <div class="date-header">
            <span class="date-number">{{ format(date, 'd') }}</span>
          </div>
          
          <div class="appointments-container">
            <TransitionGroup name="list">
              <div 
                v-for="appointment in getAppointmentsForDay(date)"
                :key="appointment._id"
                class="calendar-appointment"
                :class="[getStatusClass(appointment.statut), 'hover:scale-105']"
                @click="viewAppointmentDetails(appointment)"
              >
                <div class="flex flex-col">
                  <span class="appointment-time font-medium">
                    {{ formatTime(appointment.date) }}
                  </span>
                  <span class="appointment-patient truncate">
                    {{ getPatientName(appointment) }}
                  </span>
                  <span class="appointment-type text-xs opacity-75">
                    {{ appointment.type }}
                  </span>
                </div>
              </div>
            </TransitionGroup>
            
            <div v-if="getAppointmentsForDay(date).length === 0 && isSameMonth(date, currentMonth)" 
                 class="text-xs text-gray-400 dark:text-gray-600 text-center py-1">
              Aucun rendez-vous
            </div>
          </div>
        </div>
      </div>
    </div>
              
    <!-- Modal de détails -->
    <Modal 
      v-if="showDetailsModal"
      title="Détails du rendez-vous"
      @close="closeDetailsModal"
    >
      <div class="p-6 space-y-6">
        <!-- Patient Info -->
        <!-- Patient Info section in Modal -->
        <div class="flex items-center space-x-4">
  <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
    <UserCircle class="w-8 h-8 text-gray-500 dark:text-gray-400" />
  </div>
  <div>
    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
      {{ selectedAppointment?.patient?.utilisateur?.prenom }} 
      {{ selectedAppointment?.patient?.utilisateur?.nom }}
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      {{ formatTime(selectedAppointment?.date) }}
    </p>
  </div>
</div>
    
        <!-- Appointment Details -->
        <div class="grid grid-cols-2 gap-4">
          <div class="info-group">
            <span class="info-label">Type</span>
            <span class="info-value font-medium text-gray-900 dark:text-white">
              {{ selectedAppointment?.type }}
            </span>
          </div>
          <div class="info-group">
            <span class="info-label">Statut</span>
            <span :class="['status-badge', getStatusClass(selectedAppointment?.statut)]">
              {{ selectedAppointment?.statut }}
            </span>
          </div>
          <div class="info-group">
            <span class="info-label">Durée</span>
            <span class="info-value font-medium text-gray-900 dark:text-white">
              {{ selectedAppointment?.duration || 30 }} minutes
            </span>
          </div>
          <div class="info-group">
            <span class="info-label">Médecin</span>
            <span class="info-value font-medium text-gray-900 dark:text-white">
              {{ currentMedecinName }}
            </span>
          </div>
        </div>
    
        <!-- Notes -->
       
        
        <!-- Actions -->
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            class="btn-secondary"
            @click="closeDetailsModal"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal de création de rendez-vous -->
    <Modal 
      v-if="showNewAppointmentModal"
      title="Nouveau rendez-vous"
      @close="showNewAppointmentModal = false"
    >
      <div class="p-6">
        <form @submit.prevent="handleNewAppointment" class="space-y-6">
          <div class="space-y-4">
            <div>
              <label class="form-label">Patient</label>
              <div class="relative">
                <input 
                  v-model="patientSearch"
                  type="text"
                  class="form-input"
                  placeholder="Rechercher un patient par nom..."
                  @input="filterPatients"
                  autocomplete="off"
                />
                <Search class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                
                <!-- Dropdown for patient search results -->
                <div v-if="filteredPatients.length > 0 && patientSearch" 
                     class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto">
                  <div v-for="patient in filteredPatients" 
                       :key="patient.id"
                       @click="selectPatient(patient)"
                       class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    {{ patient.utilisateur.prenom }} {{ patient.utilisateur.nom }} 
                  </div>
                </div>
              </div>
              
              <!-- Selected patient display -->
              <div v-if="selectedPatient" class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md flex justify-between items-center">
                <div>
                  <span class="font-medium">{{ selectedPatient.prenom }} {{ selectedPatient.nom }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">(ID: {{ selectedPatient.id }})</span>
                </div>
                <button type="button" @click="clearSelectedPatient" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <XCircle class="w-5 h-5" />
                </button>
              </div>
              
              <p v-if="!selectedPatient" class="text-xs text-red-500 mt-1">
                Veuillez sélectionner un patient
              </p>
            </div>
            <div>
              <label class="form-label">Type</label>
              <select 
                v-model="newAppointment.type"
                class="form-select"
                required
              >
                <option value="Consultation">Consultation</option>
                <option value="Suivi">Suivi</option>
                <option value="Urgence">Urgence</option>
                <option value="Contrôle">Contrôle</option>
              </select>
            </div>

            <div>
              <label class="form-label">Date et heure</label>
              <input 
                v-model="newAppointment.time"
                type="datetime-local"
                class="form-input"
                required
              />
            </div>

            <div>
              <label class="form-label">Durée (minutes)</label>
              <input 
                v-model.number="newAppointment.duration"
                type="number"
                min="15"
                step="15"
                class="form-input"
                required
              />
            </div>

            <div>
              <label class="form-label">Médecin</label>
              <div class="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                <div class="flex items-center">
                  <UserCircle class="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <span>{{ currentMedecinName || 'Médecin actuel' }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">(ID: {{ currentMedecinId || 'Non disponible' }})</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-4 mt-6">
            <button 
              type="button"
              @click="showNewAppointmentModal = false"
              class="btn-secondary"
            >
              Annuler
            </button>
            <button 
              type="submit"
              class="btn-primary"
              :disabled="appointmentStore.loading"
            >
              <span v-if="appointmentStore.loading">
                <Loader class="w-4 h-4 mr-2 inline animate-spin" />
                Création...
              </span>
              <span v-else>Créer le rendez-vous</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppointmentStore } from '@/stores/appointments'
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, addMonths, subMonths,
  isSameMonth, isToday as _isToday
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Search, Plus, ChevronLeft, ChevronRight, UserCircle,
  Loader, XCircle
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import axios from 'axios'

const appointmentStore = useAppointmentStore()

// Fetch appointments when component is mounted
onMounted(async () => {
  await appointmentStore.fetchAppointments()
})

// Search and status filters (applied to header and calendar)
const searchQuery = ref('')
const filterStatus = ref('')
// Date filter for the calendar grid only (today/week/month/all)
const filterDate = ref('today')

const showDetailsModal = ref(false)
const selectedAppointment = ref(null)
const showNewAppointmentModal = ref(false)
// Adapt the new appointment form to use IDs instead of names
const newAppointment = ref({
  patientId: '',
  type: 'Consultation',
  time: '',
  duration: 30,
  doctorId: '',
  notes: ''
})

// Access loading and error states from the store
const isLoading = computed(() => appointmentStore.loading)
const errorMessage = computed(() => appointmentStore.error)

const currentMonth = ref(new Date())
const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentMonth.value), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(currentMonth.value), { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
})

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1)
}

const previousMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1)
}

// Add these near the top of the script section, after the imports
const patients = ref([])
const patientSearch = ref('')
const selectedPatient = ref(null)

// Add this computed property
const filteredPatients = computed(() => {
  if (!patientSearch.value || patientSearch.value.length < 2) return []
  
  const search = patientSearch.value.toLowerCase()
  return patients.value.filter(patient => {
    const fullName = `${patient.utilisateur.prenom} ${patient.utilisateur.nom}`.toLowerCase()
    return fullName.includes(search)
  })
})

// Add this function for patient filtering
const filterPatients = () => {
  if (patientSearch.value.length < 2) return
  // The filtering is handled by the computed property
}

// Add this function to select a patient
const selectPatient = (patient) => {
  selectedPatient.value = patient
  newAppointment.value.patientId = patient._id  // Using MongoDB _id
  patientSearch.value = `${patient.utilisateur.prenom} ${patient.utilisateur.nom}`
}

// Add this function to clear selected patient
const clearSelectedPatient = () => {
  selectedPatient.value = null
  newAppointment.value.patientId = ''
  patientSearch.value = ''
}

// Update the onMounted hook to include fetchPatients
onMounted(async () => {
  console.log('Fetching appointments...')
  await appointmentStore.fetchAppointments()
  console.log('Appointments from store:', appointmentStore.appointments)
  getCurrentMedecinInfo()
  await fetchPatients() // Add this line
})

// Update filteredAppointments computed property
const filteredAppointments = computed(() => {
  return appointmentStore.appointments.filter(appointment => {
    const searchTerm = searchQuery.value.toLowerCase()
    const patientName = `${appointment.patient?.utilisateur?.prenom} ${appointment.patient?.utilisateur?.nom}`.toLowerCase()
    const appointmentType = appointment.type?.toLowerCase() || ''
    const appointmentStatus = appointment.statut?.toLowerCase() || ''
    
    const matchesSearch = patientName.includes(searchTerm) || 
                         appointmentType.includes(searchTerm) ||
                         appointmentStatus.includes(searchTerm)
    const matchesStatus = !filterStatus.value || appointment.statut === filterStatus.value
    
    let matchesDate = true
    const appointmentDate = new Date(appointment.date)
    if (filterDate.value === 'today') {
      matchesDate = _isToday(appointmentDate)
    }  if (filterDate.value === 'week') {
      const startWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
      const endWeek = endOfWeek(new Date(), { weekStartsOn: 6})
      matchesDate = appointmentDate >= startWeek && appointmentDate <= endWeek
    }  if (filterDate.value === 'month') {
      const startMonthDate = startOfMonth(new Date())
      const endMonthDate = endOfMonth(new Date())
      matchesDate = appointmentDate >= startMonthDate && appointmentDate <= endMonthDate
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })
})

// Header: always show today's appointments (ignoring filterDate)
// Update todayAppointments computed property
const todayAppointments = computed(() => {
  return appointmentStore.appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date)
    const patientName = getPatientName(appointment).toLowerCase()
    const matchesSearch = patientName.includes(searchQuery.value.toLowerCase())
    const matchesStatus = !filterStatus.value || appointment.statut === filterStatus.value
    return _isToday(appointmentDate) && matchesSearch && matchesStatus
  })
})

const formatTime = (time) => {
  try {
    if (!time) return ''
    // Parse the time string manually to avoid timezone adjustments
    const [datePart, timePart] = time.split('T')
    if (timePart) {
      const [hours, minutes] = timePart.split(':')
      return `${hours}:${minutes}`
    }
    return '09:00'
  } catch (error) {
    console.error('Error formatting time:', error)
    return '09:00'
  }
}

const formatDateTime = (time) => {
  try {
    if (!time) return ''
    return format(new Date(time), 'PPpp', { locale: fr })
  } catch (error) {
    console.error('Error formatting datetime:', error)
    return ''
  }
}

const isToday = (date) => _isToday(date)

const getAppointmentsForDay = (date) => {
  try {
    if (!date) return []
    const targetDate = format(date, 'yyyy-MM-dd')
    console.log('Target date:', targetDate) // Debug log

    return filteredAppointments.value.filter(appointment => {
      try {
        let appointmentDate = appointment.date
        
        // Handle different date formats
        if (appointmentDate.includes('T')) {
          // If date includes time (ISO format)
          appointmentDate = format(new Date(appointmentDate), 'yyyy-MM-dd')
        } else {
          // If date is just a date string
          appointmentDate = format(new Date(appointmentDate), 'yyyy-MM-dd')
        }
        
     
        
        return appointmentDate === targetDate
      } catch (error) {
        console.error('Error processing appointment date:', error, appointment)
        return false
      }
    }).sort((a, b) => {
      const timeA = new Date(a.date).getTime()
      const timeB = new Date(b.date).getTime()
      return timeA - timeB
    })
  } catch (error) {
    console.error('Error getting appointments for day:', error)
    return []
  }
}

// Update the fetchPatients function
const fetchPatients = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'https://sehatech-api.onrender.com/api'}/patients`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
    })
    
    patients.value = (response.data || []).map(patient => ({
      _id: patient._id,
      utilisateur_id: patient.utilisateur_id,
      groupeSanguin: patient.groupeSanguin,
      poids: patient.poids,
      taille: patient.taille,
      maladiesChroniques: patient.maladiesChroniques || [],
      created_at: patient.created_at,
      updated_at: patient.updated_at,
      utilisateur: {
        actif: patient.utilisateur?.actif || true,
        adresse: patient.utilisateur?.adresse || '',
        dateNaissance: patient.utilisateur?.dateNaissance || '',
        email: patient.utilisateur?.email || '',
        genre: patient.utilisateur?.genre || '',
        nom: patient.utilisateur?.nom || '',
        prenom: patient.utilisateur?.prenom || '',
        role: patient.utilisateur?.role || 'patient',
        telephone: patient.utilisateur?.telephone || '',
        _id: patient.utilisateur?._id
      }
    }))
  } catch (error) {
    console.error('Error fetching patients:', error)
    patients.value = []
  }
}

// Update the getPatientName function
const getPatientName = (appointment) => {
  // Case 1: Nested structure with patient.utilisateur
  if (appointment?.patient?.utilisateur) {
    return `${appointment.patient.utilisateur.prenom} ${appointment.patient.utilisateur.nom}`
  }
  // Case 2: Direct patient properties
  if (appointment?.patient?.prenom && appointment?.patient?.nom) {
    return `${appointment.patient.prenom} ${appointment.patient.nom}`
  }
  // Case 3: Direct appointment properties
  if (appointment?.prenom && appointment?.nom) {
    return `${appointment.prenom} ${appointment.nom}`
  }
  // Case 4: Utilisateur directly on appointment
  if (appointment?.utilisateur?.prenom && appointment?.utilisateur?.nom) {
    return `${appointment.utilisateur.prenom} ${appointment.utilisateur.nom}`
  }
  // If no name is found
  return 'Patient non spécifié'
}
console.log(getPatientName)

// Add this import at the top with other imports
import { useToastStore } from '@/stores/toast'

// Add this after other store declarations
const toastStore = useToastStore()

// Update the handleNewAppointment function
const handleNewAppointment = async () => {
  if (!selectedPatient.value) return
  
  try {
    // Debug logs
    console.log('Selected Patient:', selectedPatient.value)
    console.log('Selected Patient ID:', selectedPatient.value._id)
    console.log('Current Medecin ID:', localStorage.getItem('MedecinId'))

    // Fix timezone issue by manually formatting the date string
    const [datePart, timePart] = newAppointment.value.time.split('T')
    const [hours, minutes] = timePart.split(':')
    const adjustedHours = String(Number(hours) + 1).padStart(2, '0')
    const formattedDate = `${datePart} ${adjustedHours}:${minutes}`

    const appointmentData = {
      patient_id: selectedPatient.value._id,
      medecin_id: localStorage.getItem('MedecinId'),
      date: formattedDate, // Using the manually formatted date string
      type: newAppointment.value.type,
      statut: 'planifie'
    }
    
    console.log('Appointment data before sending:', appointmentData)
    
    if (!appointmentData.patient_id || !appointmentData.medecin_id) {
      throw new Error('Patient ID or Doctor ID is missing')
    }
    
    await appointmentStore.addAppointment(appointmentData)
    
    // Show success toast
    toastStore.show({
      type: 'success',
      message: 'Rendez-vous créé avec succès'
    })
    
    showNewAppointmentModal.value = false
    
    // Reset form
    newAppointment.value = {
      patientId: '',
      type: 'Consultation',
      time: '',
      duration: 30,
      doctorId: '',
      notes: ''
    }
    selectedPatient.value = null
    patientSearch.value = ''
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error.response?.data || error)
    toastStore.show({
      type: 'error',
      message: 'Erreur lors de la création du rendez-vous'
    })
  }
}
// Add these refs for current doctor information
const currentMedecinId = ref('')
const currentMedecinName = ref('')

// Add this function to get the current doctor info
const getCurrentMedecinInfo = async () => {
  try {
    const token = localStorage.getItem('Token_MEDECIN')
    const roleId = localStorage.getItem('role_id')
    console.log(roleId) // Get medecin ID from localStorage
    
    if (!token || !roleId) {
      console.warn('Missing authentication information')
      return
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL || 'https://sehatech-api.onrender.com/api'}/medecins/${roleId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    const medecin = response.data
    if (medecin?.utilisateur) {
      currentMedecinId.value = medecin._id
      currentMedecinName.value = `Dr. ${medecin.utilisateur.prenom} ${medecin.utilisateur.nom}`
      // Store the ID for future use
      localStorage.setItem('MedecinId', medecin._id)
    } else {
      console.warn('Invalid doctor data received:', medecin)
    }
  } catch (error) {
    console.error('Error fetching doctor info:', error)
    currentMedecinId.value = ''
    currentMedecinName.value = 'Médecin actuel'
  }
}
// Add this function near your other utility functions
const getStatusClass = (status) => {
  const statusMap = {
    'planifie': 'status-pending',
    'confirme': 'status-confirmed',
    'en cours': 'status-in-progress',
    'termine': 'status-completed',
    'annule': 'status-cancelled'
  }
  return statusMap[status] || 'status-pending'
}
const viewAppointmentDetails = async (appointment) => {
  console.log('Selected appointment:', appointment.patient.id)
  try {
    // Fetch patient details
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL || 'https://sehatech-api.onrender.com/api' }/patients/${appointment.patient.id}`,
      {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
      }
    )
    // Update the appointment with patient details
    appointment.patient = {
      ...response.data,
      utilisateur: response.data.utilisateur
    }
    selectedAppointment.value = appointment
    showDetailsModal.value = true
  } catch (error) {
    console.error('Error fetching patient details:', error)
    selectedAppointment.value = appointment
    showDetailsModal.value = true
  }
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedAppointment.value = null
}
</script>

<style scoped>
.appointments-view {
  @apply bg-gray-50 dark:bg-gray-900 min-h-screen;
}

/* Status colors */
.status-pending {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.status-confirmed {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
}

.status-in-progress {
  @apply bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
}

.status-completed {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.status-cancelled {
  @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

.search-input {
  @apply w-full pl-4 pr-10 py-2 rounded-lg bg-white dark:bg-gray-800 
         border border-gray-300 dark:border-gray-700
         text-gray-900 dark:text-gray-100
         placeholder-gray-500 dark:placeholder-gray-400
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
}

.filter-select {
  @apply px-4 py-2 rounded-lg bg-white dark:bg-gray-800 
         border border-gray-300 dark:border-gray-700
         text-gray-900 dark:text-gray-100
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
}

.calendar-container {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4;
}

.calendar-header {
  @apply grid grid-cols-7 mb-2;
}

.calendar-header-cell {
  @apply text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2;
}

.calendar-grid {
  @apply grid grid-cols-7 gap-1;
}

.calendar-cell {
  @apply min-h-[120px] p-1 border border-gray-200 dark:border-gray-700 
         relative bg-white dark:bg-gray-800;
}

.calendar-cell.other-month {
  @apply bg-gray-50 dark:bg-gray-900/50;
}

.calendar-cell.today {
  @apply bg-primary-50 dark:bg-primary-900/20;
}

.date-header {
  @apply flex justify-end mb-1;
}

.date-number {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.calendar-cell.today .date-number {
  @apply bg-primary-600 text-white rounded-full w-6 h-6 
         flex items-center justify-center;
}

.appointments-container {
  @apply space-y-1 overflow-y-auto max-h-[100px];
}

.calendar-appointment {
  @apply text-xs p-2 rounded cursor-pointer mb-1
         hover:opacity-90 transition-all duration-200
         flex flex-col;
}

.appointment-time {
  @apply text-sm font-semibold mb-0.5;
}

.appointment-patient {
  @apply text-xs font-medium;
}

.appointment-type {
  @apply text-xs mt-0.5;
}

.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium inline-flex items-center;
}

.info-group {
  @apply p-3 bg-gray-50 dark:bg-gray-800 rounded-lg;
}

/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.info-value {
  @apply block text-base;
}

.form-input,
.form-select,
.form-textarea {
  @apply w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white;
}

.btn-primary {
  @apply px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 
         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style>
