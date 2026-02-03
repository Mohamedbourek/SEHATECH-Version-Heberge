<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-4xl mx-auto">
      <!-- En-tête -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Mon profil
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      <!-- Profil principal -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-start space-x-6">
          <!-- Avatar -->
          

          <!-- Informations principales -->
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ userStore.technicien?.utilisateur?.prenom }} {{ userStore.technicien?.utilisateur?.nom }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ userStore.technicien?.utilisateur?.email }}
                </p>
                <p class="mt-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                  {{ userStore.technicien?.domaine }}
                </p>
              </div>
              <button 
                class="btn btn-outline"
                @click="isEditing = true"
              >
                <Edit class="w-4 h-4 mr-2" />
                Modifier
              </button>
            </div>

            <dl class="mt-6 grid grid-cols-2 gap-4">
              <div class="col-span-1">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Téléphone</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ userStore.technicien?.utilisateur?.telephone || 'Non renseigné' }}
                </dd>
              </div>
              <div class="col-span-1">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Compétence</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ userStore.technicien?.competence }}
                </dd>
              </div>
              <div class="col-span-1">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Date de naissance</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatDate(userStore.technicien?.utilisateur?.dateNaissance, 'dd MMM yyyy') }}
                </dd>
              </div>
              <div class="col-span-1">
                <dt class="text-sm text-gray-500 dark:text-gray-400">Adresse</dt>
                <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {{ userStore.technicien?.utilisateur?.adresse || 'Non renseigné' }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <Modal v-if="isEditing" title="Modifier le profil" @close="isEditing = false">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Prénom</label>
              <input 
                v-model="editForm.prenom"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div>
              <label class="form-label">Nom</label>
              <input 
                v-model="editForm.nom"
                type="text"
                class="form-input"
                required
              />
            </div>
          </div>
          <div>
            <label class="form-label">Email</label>
            <input 
              v-model="editForm.email"
              type="email"
              class="form-input"
              required
            />
          </div>
          <div>
            <label class="form-label">Téléphone</label>
            <input 
              v-model="editForm.phone"
              type="tel"
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label">Adresse</label>
            <input 
              v-model="editForm.address"
              type="text"
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label">Date de naissance</label>
            <input 
              v-model="editForm.dateNaissance"
              type="date"
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label">Genre</label>
            <select v-model="editForm.genre" class="form-select">
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>
          </div>
          <div>
            <label class="form-label">Compétence</label>
            <input 
              v-model="editForm.competence"
              type="text"
              class="form-input"
            />
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button 
              type="button"
              class="btn btn-outline"
              @click="isEditing = false"
            >
              Annuler
            </button>
            <button 
              type="submit"
              class="btn btn-primary"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <!-- Statistics and Activity sections remain unchanged -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import {
  Upload,
  Edit,
  WrenchIcon,
  AlertCircle,
  CheckCircle,
  Settings,
  Bell,
  History
} from 'lucide-vue-next'
import Modal from '@/components/common/Modal.vue'

const userStore = useUserStore()
const isEditing = ref(false)
const isLoading = ref(true) // Add loading state
const isSubmitting = ref(false)

// Add watcher for debugging
const technicienData = computed(() => {
  console.log('Current technicien data:', userStore.technicien)
  return userStore.technicien
})

// Initialize data on component mount
onMounted(async () => {
  try {
    isLoading.value = true
    const token = localStorage.getItem('Token_TECHNICIEN')
    const technicienId = localStorage.getItem('role_id')
    
    console.log('Token:', token)
    console.log('Technicien ID:', technicienId)
    
    if (!technicienId || !token) {
      throw new Error('Authentication data missing')
    }

    await userStore.fetchTechnicienDetails()
    
    // Initialize form with current values
    const technicien = userStore.technicien
    if (technicien?.utilisateur) {
      editForm.value = {
        prenom: technicien.utilisateur.prenom || '',
        nom: technicien.utilisateur.nom || '',
        email: technicien.utilisateur.email || '',
        phone: technicien.utilisateur.telephone || '',
        competence: technicien.competence || '',
        address: technicien.utilisateur.adresse || '',
        dateNaissance: technicien.utilisateur.dateNaissance || '',
        genre: technicien.utilisateur.genre || ''
      }
    } else {
      console.error('No technician data received')
    }
  } catch (error) {
    console.error('Error fetching user details:', error)
  } finally {
    isLoading.value = false
  }
})

// Données simulées
const user = computed(() => {
  const technicien = userStore.technicien
  return {
    name: technicien?.utilisateur ? `${technicien.utilisateur.prenom} ${technicien.utilisateur.nom}` : 'Chargement...',
    email: technicien?.utilisateur?.email || 'Chargement...',
    role: technicien?.domaine || 'Biomedical Engineering',
    phone: technicien?.utilisateur?.telephone || 'Non renseigné',
    department: technicien?.competence || 'Equipment Maintenance',
    joinedAt: technicien?.created_at || null,
    lastLogin: technicien?.utilisateur?.updated_at || null,
    avatar: technicien?.utilisateur?.photo || null,
    address: technicien?.utilisateur?.adresse || 'Non renseigné',
    dateNaissance: technicien?.utilisateur?.dateNaissance || 'Non renseigné',
    genre: technicien?.utilisateur?.genre || 'Non renseigné'
  }
})

const stats = {
  interventions: 24,
  resolvedAlerts: 18,
  resolutionRate: 95
}

const recentActivity = [
  {
    type: 'maintenance',
    description: 'Maintenance préventive effectuée sur Scanner IRM',
    date: '2024-02-15T10:30:00'
  },
  {
    type: 'alert',
    description: 'Alerte résolue sur Échographe cardiaque',
    date: '2024-02-15T09:15:00'
  },
  {
    type: 'settings',
    description: 'Mise à jour des paramètres de notification',
    date: '2024-02-14T16:45:00'
  }
]

const editForm = ref({
  name: '',
  email: '',
  phone: '',
  department: '',
  address: '',
  dateNaissance: '',
  genre: ''
})


function formatDate(date, formatStr = 'dd MMM yyyy HH:mm') {
  if (!date) return 'Non disponible'
  try {
    return format(new Date(date), formatStr, { locale: fr })
  } catch (error) {
    return 'Date invalide'
  }
}

function getActivityTypeClass(type) {
  const classes = {
    maintenance: 'bg-blue-500',
    alert: 'bg-red-500',
    settings: 'bg-purple-500'
  }
  return classes[type] || 'bg-gray-500'
}

function getActivityIcon(type) {
  const icons = {
    maintenance: WrenchIcon,
    alert: AlertCircle,
    settings: Settings
  }
  return icons[type] || History
}

function handleAvatarUpload() {
  // Implémenter la logique d'upload
  console.log('Upload avatar...')
}

async function handleSubmit() {
  try {
    isSubmitting.value = true
    const updateData = {
      competence: editForm.value.competence,
      utilisateur: {
        nom: editForm.value.nom,
        prenom: editForm.value.prenom,
        email: editForm.value.email,
        telephone: editForm.value.phone,
        adresse: editForm.value.address,
        dateNaissance: editForm.value.dateNaissance,
        genre: editForm.value.genre
      }
    }

    await userStore.updateTechnicienProfile(updateData)
    isEditing.value = false
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>