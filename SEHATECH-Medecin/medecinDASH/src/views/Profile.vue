<template>
  <div class="space-y-6">
    <!-- En-tête du profil -->
    <!-- Update the header section -->
    <header class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex items-center space-x-6">
        <div class="relative">
          <img 
            :src="profilePicture" 
            alt="Photo de profil"
            class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
          />
          <button 
            @click="triggerFileInput"
            class="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700"
          >
            <Camera class="w-4 h-4" />
          </button>
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            accept="image/*"
            @change="handleImageUpload"
          />
        </div>
        
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ userProfile?.nom || 'Chargement...' }} {{ userProfile?.prenom || '' }}
              </h1>
              <div class="mt-1 flex items-center space-x-3">
                <span class="text-gray-500 dark:text-gray-400">
                  {{ userProfile?.email || 'Chargement...' }}
                </span>
                <span v-if="userProfile?.specialite" class="speciality-badge" :class="specialityClass">
                  {{ getSpecialityLabel }}
                  <Stethoscope v-if="isChirurgien" class="w-4 h-4 ml-1" />
                </span>
              </div>
            </div>
            <button
              @click="editMode = !editMode"
              class="btn btn-secondary flex items-center"
            >
              <Edit3 class="w-4 h-4 mr-2" />
              {{ editMode ? 'Annuler' : 'Modifier' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Informations du profil -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
      <!-- Informations personnelles -->
      <div class="p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Informations personnelles
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nom
            </label>
            <div v-if="!editMode" class="text-gray-900 dark:text-white">
              {{ userProfile?.nom }}
            </div>
            <input
              v-else
              type="text"
              v-model="editedProfile.nom"
              class="form-input"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Prénom
            </label>
            <div v-if="!editMode" class="text-gray-900 dark:text-white">
              {{ userProfile?.prenom }}
            </div>
            <input
              v-else
              type="text"
              v-model="editedProfile.prenom"
              class="form-input"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Numéro d'ordre
            </label>
            <div v-if="!editMode" class="text-gray-900 dark:text-white">
              {{ userProfile?.numeroOrdre }}
            </div>
            <input
              v-else
              type="text"
              v-model="editedProfile.numeroOrdre"
              class="form-input"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Années d'expérience
            </label>
            <div v-if="!editMode" class="text-gray-900 dark:text-white">
              {{ userProfile?.experienceAnnee }} ans
            </div>
            <input
              v-else
              type="number"
              v-model="editedProfile.experienceAnnee"
              class="form-input"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div v-if="!editMode" class="text-gray-900 dark:text-white">
              {{ userProfile?.email }}
            </div>
            <input
              v-else
              type="email"
              v-model="editedProfile.email"
              class="form-input"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Téléphone
            </label>
            <div v-if="!editMode" class="text-gray-900 dark:text-white">
              {{ userProfile?.telephone || 'Non renseigné' }}
            </div>
            <input
              v-else
              type="tel"
              v-model="editedProfile.telephone"
              class="form-input"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Spécialité
            </label>
            <div v-if="!editMode" class="text-gray-900 dark:text-white">
              {{ userProfile?.specialite }}
            </div>
            <select
              v-else
              v-model="editedProfile.specialite"
              class="form-select"
            >
              <option value="Cardiologie">Cardiologie</option>
              <option value="Chirurgie">Chirurgie</option>
              <option value="Généraliste">Généraliste</option>
              <option value="Pédiatrie">Pédiatrie</option>
              <option value="Dermatologie">Dermatologie</option>
            </select>
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Adresse
            </label>
            <div v-if="!editMode" class="text-gray-900 dark:text-white">
              {{ userProfile?.adresse || 'Non renseignée' }}
            </div>
            <input
              v-else
              type="text"
              v-model="editedProfile.adresse"
              class="form-input"
            />
          </div>
        </div>
      </div>

      <!-- Statistiques professionnelles -->
      <div class="p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Statistiques professionnelles
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="stat-card">
            <div class="stat-icon" :class="isChirurgien ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'">
              <UserCheck class="w-6 h-6" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats?.totalPatients }}</div>
              <div class="stat-label">Patients suivis</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" :class="isChirurgien ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'">
              <Calendar class="w-6 h-6" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats?.consultationsMois }}</div>
              <div class="stat-label">
                {{ isChirurgien ? 'Opérations ce mois' : 'Consultations ce mois' }}
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" :class="isChirurgien ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'">
              <Clock class="w-6 h-6" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats?.averageConsultationTime }}min</div>
              <div class="stat-label">Durée moyenne</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="editMode" class="p-6 flex justify-end space-x-3">
        <button
          @click="cancelEdit"
          class="btn btn-secondary"
        >
          Annuler
        </button>
        <button
          @click="saveProfile"
          class="btn btn-primary"
        >
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Camera, Edit3, UserCheck, Calendar, Clock, Stethoscope 
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const authStore = useAuthStore()
const { showNotification } = useNotification()

// Add userStore initialization
const userStore = useUserStore()

// Move these refs before computed properties
const fileInput = ref(null)
const editMode = ref(false)
const profilePicture = ref('/default-avatar.svg')

// Add editedProfile initialization here, before using it
const editedProfile = ref({
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  specialite: '',
  numeroOrdre: '',
  experienceAnnee: 0,
  adresse: ''
})

// Initialize userProfile first
const userProfile = computed(() => {
  const userData = userStore.user
  if (!userData) return {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    specialite: '',
    photo: '/default-avatar.svg',
    numeroOrdre: '',
    experienceAnnee: 0
  }
  
  return {
    nom: userData.nom || '',
    prenom: userData.prenom || '',
    email: userData.email || '',
    telephone: userData.telephone || '',
    specialite: userData.medecin?.specialite || '',
    photo: userData.medecin?.photo || '/default-avatar.svg',
    numeroOrdre: userData.medecin?.numeroOrdre || '',
    experienceAnnee: userData.medecin?.experienceAnnee || 0,
    genre: userData.genre || '',
    dateNaissance: userData.dateNaissance || '',
    adresse: userData.adresse || ''
  }
})

// Update isChirurgien computed property
const isChirurgien = computed(() => userProfile.value?.specialite === 'Chirurgie')

// Update onMounted to ensure data is loaded
onMounted(async () => {
  try {
    console.log('Fetching user info...') // Add this debug line
    await userStore.fetchUserInfo()
    console.log('User info fetched:', userStore.user) // Add this debug line
    
    if (userStore.user) {
      const user = userStore.user
      editedProfile.value = {
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        specialite: user.medecin?.specialite || '',
        numeroOrdre: user.medecin?.numeroOrdre || '',
        experienceAnnee: user.medecin?.experienceAnnee || 0,
        adresse: user.adresse || ''
      }
      profilePicture.value = user.medecin?.photo || '/default-avatar.svg'
    }
  } catch (error) {
    console.error('Error fetching user info:', error) // Add this debug line
    showNotification({
      type: 'error',
      message: 'Erreur lors du chargement du profil'
    })
  }
})

const specialityClass = computed(() => ({
  'bg-purple-100 text-purple-600': isChirurgien.value,
  'bg-blue-100 text-blue-600': !isChirurgien.value
}))

// Statistiques simulées
// Replace the simulated stats with real data
// Update the stats ref
const stats = ref({
  totalPatients: 0,
  consultationsMois: 0,
  averageConsultationTime: isChirurgien.value ? 120 : 20
})

// Update the fetchStats function
async function fetchStats() {
  try {
    const response = await userStore.getStats()
    console.log('Stats received:', response)
    
    if (response?.stats && Array.isArray(response.stats)) {
      // Find the specific stats in the array
      const patientsStats = response.stats.find(stat => stat.label === "Total patients")
      const consultationsStats = response.stats.find(stat => stat.label === "Consultations ce mois-ci")
      
      stats.value = {
        totalPatients: patientsStats?.value ?? 0,
        consultationsMois: consultationsStats?.value ?? 0,
        averageConsultationTime: isChirurgien.value ? 120 : 20
      }
      console.log('Updated stats:', stats.value)
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    showNotification({
      type: 'error',
      message: 'Erreur lors du chargement des statistiques'
    })
  }
}

// Remove duplicate onMounted hook and combine them
onMounted(async () => {
  try {
    await userStore.fetchUserInfo()
    await fetchStats()
    console.log('Final stats state:', stats.value) // Debug log
  } catch (error) {
    console.error('Mount error:', error)
    showNotification({
      type: 'error',
      message: 'Erreur lors du chargement des données'
    })
  }
})





// Méthodes
function triggerFileInput() {
  fileInput.value.click()
}

async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (file) {
    try {
      // Convert image to base64
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
      
      // Update profile with new image
      await userStore.updateUserInfo({
        ...editedProfile.value,
        photo: base64Image
      })
      
      // Update local state
      profilePicture.value = base64Image
      
      showNotification({
        type: 'success',
        message: 'Photo de profil mise à jour'
      })
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Erreur lors du chargement de l\'image'
      })
    }
  }
}

// Update cancelEdit function
function cancelEdit() {
  editMode.value = false
  editedProfile.value = {
    nom: userProfile.value?.nom || '',
    prenom: userProfile.value?.prenom || '',
    email: userProfile.value?.email || '',
    telephone: userProfile.value?.telephone || '',
    specialite: userProfile.value?.specialite || 'generaliste'
  }
}

// Update saveProfile function
async function saveProfile() {
  try {
    await userStore.updateUserInfo({
      nom: editedProfile.value.nom,
      prenom: editedProfile.value.prenom,
      email: editedProfile.value.email,
      telephone: editedProfile.value.telephone,
      specialite: editedProfile.value.specialite,
      photo: profilePicture.value
    })
    
    // Fetch updated user info after successful update
    await userStore.fetchUserInfo()
    
    showNotification({
      type: 'success',
      message: 'Profil mis à jour avec succès'
    })
    editMode.value = false
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Erreur lors de la mise à jour du profil'
    })
  }
}

// Add this to initialize the profile data
onMounted(async () => {
  try {
    await userStore.fetchUserInfo()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Erreur lors du chargement du profil'
    })
  }
})
</script>

<style scoped>
.speciality-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium;
}

.stat-card {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex items-center space-x-4;
}

.stat-icon {
  @apply p-3 rounded-full;
}

.stat-content {
  @apply flex-1;
}

.stat-value {
  @apply text-2xl font-semibold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.form-input,
.form-select {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm 
         focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}

.btn {
  @apply px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 
         focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200 
         dark:border-gray-600 dark:hover:bg-gray-700;
}
</style>