<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des rendez-vous
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Planification et suivi des rendez-vous
        </p>
      </div>
      <button class="btn btn-primary" @click="handleNewAppointment">
        <Plus class="w-4 h-4 mr-2" />
        Nouveau rendez-vous
      </button>
    </header>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
      <StatCard title="Total rendez-vous" :value="stats.total" icon="Calendar" trend="up" :percentage="5"
        color="blue" />
      <StatCard title="Confirmés" :value="stats.confirmed" icon="CheckCircle" trend="up" :percentage="8"
        color="green" />
      <StatCard title="En attente" :value="stats.planifie" icon="Clock" trend="down" :percentage="3" color="yellow" />
      <StatCard title="Annulés" :value="stats.cancelled" icon="XCircle" trend="up" :percentage="2" color="red" />
      <StatCard title="Terminés" :value="stats.finished" icon="CheckSquare" trend="up" :percentage="0" color="blue" />
    </div>

    <!-- Filtres -->
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-[200px]">
        <input v-model="filters.search" type="text" placeholder="Rechercher..." class="form-input" />
      </div>
      <div class="w-48">
        <select v-model="filters.status" class="form-select">
          <option value="">Tous les statuts</option>
          <option value="planifie">Planifiés</option>
          <option value="confirme">Confirmés</option>
          <option value="annule">Annulés</option>
          <option value="termine">Terminés</option>
        </select>
      </div>
      <div class="w-48">
        <select v-model="filters.type" class="form-select">
          <option value="">Tous les types</option>
          <option value="CONSULTATION">Consultation</option>
          <option value="Contrôle">Contrôle</option>
          <option value="EXAMEN">Examen</option>
          <option value="SUIVI">Suivi</option>
          <option value="URGENCE">Urgence</option>
        </select>
      </div>
      <div class="w-48">
        <select v-model="filters.doctor" class="form-select" :disabled="isLoading">
          <option value="">Tous les médecins</option>
          <template v-if="!isLoading && doctors?.length">
            <option v-for="doctor in doctors" :key="doctor._id || doctor.id" :value="doctor._id || doctor.id">
              {{ getFormattedDoctorName(doctor) }}
            </option>
          </template>
          <option v-else-if="isLoading" disabled>Chargement...</option>
          <option v-else disabled>Aucun médecin disponible</option>
        </select>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Liste des rendez-vous -->
    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="table-th">Patient</th>
              <th scope="col" class="table-th">Date & Heure</th>
              <th scope="col" class="table-th">Type</th>
              <th scope="col" class="table-th">Médecin</th>
              <th scope="col" class="table-th">Statut</th>
              <th scope="col" class="table-th">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="appointment in filteredAppointments" :key="appointment.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td class="table-td">
                <div class="flex items-center">
                  <UserCircle class="w-8 h-8 text-gray-400 mr-3" />
                  <div>
                    <div class="font-medium">
                      {{ getFormattedPatientName(appointment.patient) }}
                    </div>
                    <div class="text-sm text-gray-500">
                      ID: {{ appointment.patient?.id || 'N/A' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="table-td">
                <div class="text-sm">
                  {{ formatDate(appointment.date) }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ formatTime(appointment.date) }}
                </div>
              </td>
              <td class="table-td">
                <span class="type-badge" :class="typeClasses[appointment.type]">
                  {{ typeLabels[appointment.type] }}
                </span>
              </td>
              <td class="table-td">
                {{ getFormattedDoctorName(appointment.medecin) }}
              </td>
              <td class="table-td">
                <span class="status-badge" :class="statusClasses[appointment.statut]">
                  {{ statusLabels[appointment.statut] }}
                </span>
              </td>
              <td class="table-td">
                <div class="flex items-center space-x-3">
                  <!-- Boutons d'édition et suppression -->
                  <button class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    @click="editAppointment(appointment)">
                    <Edit class="w-5 h-5" />
                  </button>
                  <button class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    @click="showDeleteConfirm(appointment)">
                    <Trash2 class="w-5 h-5" />
                  </button>
                  <!-- Boutons de mise à jour du statut sous forme d'icônes -->
                  <button v-if="appointment.statut !== 'confirme'" @click="updateStatus(appointment, 'confirme')"
                    class="text-green-600 hover:text-green-800">
                    <CheckCircle class="w-5 h-5" />
                  </button>
                  <button v-if="appointment.statut !== 'annule'" @click="updateStatus(appointment, 'annule')"
                    class="text-red-600 hover:text-red-800">
                    <XCircle class="w-5 h-5" />
                  </button>
                  <button v-if="appointment.statut !== 'termine'" @click="updateStatus(appointment, 'termine')"
                    class="text-blue-600 hover:text-blue-800">
                    <CheckSquare class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <AppointmentFormModal v-if="showNewAppointmentModal" :appointment="selectedAppointment" :doctors="doctors"
      @close="handleCloseModal" @submit="handleSubmit" />

    <ConfirmationModal v-if="showDeleteModal" title="Supprimer le rendez-vous"
      message="Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible."
      @confirm="confirmDelete" @cancel="showDeleteModal = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, UserCircle, Edit, Trash2, CheckCircle, XCircle, CheckSquare } from 'lucide-vue-next'
import { useAppointmentStore } from '@/stores/appointments'
import { useDoctorStore } from '@/stores/doctors'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/dashboard/StatCard.vue'
import AppointmentFormModal from '@/components/appointments/AppointmentFormModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const appointmentStore = useAppointmentStore()
const doctorStore = useDoctorStore()
const { success: toastSuccess, error: toastError } = useToast()

// État local
const isLoading = ref(true)
const showNewAppointmentModal = ref(false)
const showDeleteModal = ref(false)
const selectedAppointment = ref(null)
const filters = ref({
  search: '',
  status: '',
  type: '',
  doctor: ''
})

// Statistiques (en utilisant des statuts en minuscules)
const stats = computed(() => {
  const apps = appointmentStore.appointments || []
  if (!Array.isArray(apps)) return { total: 0, confirmed: 0, planifie: 0, cancelled: 0, finished: 0 }
  return {
    total: apps.length,
    confirmed: apps.filter(a => a?.statut === 'confirme').length,
    planifie: apps.filter(a => a?.statut === 'planifie').length,
    cancelled: apps.filter(a => a?.statut === 'annule').length,
    finished: apps.filter(a => a?.statut === 'termine').length,
  }
})

// Liste des médecins depuis le store doctor
const doctors = computed(() => doctorStore.doctors || [])

// Classes et labels pour le type de rendez-vous
const typeClasses = {
  CONSULTATION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
  Contrôle: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
  EXAMEN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400',
  SUIVI: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  URGENCE: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
}

const typeLabels = {
  CONSULTATION: 'Consultation',
  EXAMEN: 'Examen',
  Contrôle: 'Contrôle',
  SUIVI: 'Suivi',
  URGENCE: 'Urgence'
}

// Classes et labels pour le statut (clés en minuscules)
const statusClasses = {
  planifie: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
  confirme: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  annule: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
  termine: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
}

const statusLabels = {
  planifie: 'Planifié',
  confirme: 'Confirmé',
  annule: 'Annulé',
  termine: 'Terminé'
}

// Filtrage des rendez-vous selon les critères sélectionnés
const filteredAppointments = computed(() => {
  const apps = appointmentStore.appointments || []
  if (!Array.isArray(apps)) return []

  let result = apps.filter(app => app != null)

  if (filters.value.search) {
    const term = filters.value.search.toLowerCase()
    result = result.filter(app => {
      const patientName = getFormattedPatientName(app.patient).toLowerCase()
      const doctorName = getFormattedDoctorName(app.medecin).toLowerCase()
      return patientName.includes(term) || doctorName.includes(term)
    })
  }
  if (filters.value.status) {
    result = result.filter(app => app.statut === filters.value.status)
  }
  if (filters.value.type) {
    result = result.filter(app => app.type === filters.value.type)
  }
  if (filters.value.doctor) {
    result = result.filter(app => {
      // Log the entire appointment object to see its structure
      //console.log('Appointment object:', JSON.stringify(app));
      
      // Check all possible locations for doctor ID
      const doctorId = app.medecin_id || 
                       (app.medecin && (app.medecin._id || app.medecin.id)) || 
                       app.doctor_id || 
                       app.doctorId;
                       
      console.log('Found doctor ID:', doctorId, 'Comparing with:', filters.value.doctor);
      return doctorId === filters.value.doctor;
    });
  }
  return result.sort((a, b) => new Date(a.date) - new Date(b.date))
})

// Fonction utilitaire pour obtenir un objet Date valide
const parseAppointmentDate = (dateVal) => {
  if (dateVal instanceof Date) return dateVal
  if (typeof dateVal === 'string') return parseISO(dateVal)
  return new Date(dateVal)
}

// Méthodes de formatage avec vérification de la validité
const formatDate = (date) => {
  if (!date) return 'Date non définie'
  const parsedDate = parseAppointmentDate(date)
  if (!isValid(parsedDate)) {
    console.error('Date invalide pour:', date)
    return 'Date invalide'
  }
  return format(parsedDate, 'dd MMMM yyyy', { locale: fr })
}

const formatTime = (date) => {
  if (!date) return '--:--'
  const parsedDate = parseAppointmentDate(date)
  if (!isValid(parsedDate)) {
    console.error('Heure invalide pour:', date)
    return '--:--'
  }
  return format(parsedDate, 'HH:mm')
}

// Gestion de l'édition et de la création
const editAppointment = (appointment) => {
  selectedAppointment.value = appointment
  showNewAppointmentModal.value = true
}

const handleNewAppointment = () => {
  selectedAppointment.value = null
  showNewAppointmentModal.value = true
}

const handleCloseModal = () => {
  showNewAppointmentModal.value = false
  selectedAppointment.value = null
}

// Soumission du formulaire (création ou mise à jour)
const handleSubmit = async (appointmentData) => {
  try {
    if (selectedAppointment.value) {
      await appointmentStore.updateAppointment(selectedAppointment.value.id, appointmentData)
      toastSuccess('Rendez-vous mis à jour avec succès')
    } else {
      const newApp = await appointmentStore.createAppointment(appointmentData)
      console.log('Nouveau rendez-vous créé:', newApp)
      toastSuccess('Rendez-vous créé avec succès')
    }
    await appointmentStore.fetchAppointments()
    handleCloseModal()
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err)
    toastError('Erreur lors de la sauvegarde du rendez-vous')
  }
}

// Mise à jour du statut d'un rendez-vous via une icône
const updateStatus = async (appointment, newStatus) => {
  try {
    await appointmentStore.updateAppointment(appointment.id, { statut: newStatus })
    toastSuccess(`Rendez-vous mis à jour en ${statusLabels[newStatus]}`)
    await appointmentStore.fetchAppointments()
  } catch (err) {
    console.error("Erreur lors de la mise à jour du statut", err)
    toastError("Erreur lors de la mise à jour du statut du rendez-vous")
  }
}

// Suppression du rendez-vous
const showDeleteConfirm = (appointment) => {
  selectedAppointment.value = appointment
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  try {
    await appointmentStore.deleteAppointment(selectedAppointment.value.id)
    toastSuccess('Rendez-vous supprimé avec succès')
    showDeleteModal.value = false
  } catch (err) {
    console.error('Erreur lors de la suppression:', err)
    toastError('Erreur lors de la suppression du rendez-vous')
  }
}

// Formatage des noms
const getFormattedDoctorName = (doctor) => {
  if (!doctor) return 'Non assigné'
  const nom = doctor.nom || (doctor.utilisateur && doctor.utilisateur.nom) || ''
  const prenom = doctor.prenom || (doctor.utilisateur && doctor.utilisateur.prenom) || ''
  return `Dr. ${nom} ${prenom}`.trim() || 'Non assigné'
}

const getFormattedPatientName = (patient) => {
  if (!patient) return 'Patient non assigné'
  const nom = patient.nom || (patient.utilisateur && patient.utilisateur.nom) || ''
  const prenom = patient.prenom || (patient.utilisateur && patient.utilisateur.prenom) || ''
  return `${nom} ${prenom}`.trim() || 'Patient sans nom'
}

// Chargement initial des données
onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      appointmentStore.fetchAppointments(),
      doctorStore.fetchDoctors()
    ])
  } catch (err) {
    console.error('Erreur lors du chargement des données:', err)
    toastError('Impossible de charger les données')
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.table-th {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-50 dark:bg-gray-700;
}

.table-td {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300;
}

.type-badge,
.status-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.form-input,
.form-select {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed;
}

.form-select:disabled,
.form-input:disabled {
  @apply cursor-not-allowed bg-gray-100 dark:bg-gray-700;
}
</style>
