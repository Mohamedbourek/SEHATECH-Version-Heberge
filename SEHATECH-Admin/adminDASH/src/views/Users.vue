<template>
  <div class="space-y-6">
    <!-- En-tête avec boutons d'action -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Utilisateurs</h1>
    </div>

    <!-- En-tête avec statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Utilisateurs</h3>
        <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{{ userStats?.total ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-blue-900 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-blue-500 dark:text-blue-400">Médecins</h3>
        <p class="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">{{ userStats?.medecins ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-green-900 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-green-500 dark:text-green-400">Équipe de Soins</h3>
        <p class="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">{{ userStats?.equipesSoins ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Administrateurs</h3>
        <p class="mt-2 text-3xl font-semibold text-gray-600 dark:text-gray-400">{{ userStats?.admins ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-purple-900 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-purple-500 dark:text-purple-400">Patients</h3>
        <p class="mt-2 text-3xl font-semibold text-purple-600 dark:text-purple-400">{{ userStats?.patients ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-amber-900 rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-amber-600 dark:text-amber-400">Techniciens</h3>
        <p class="mt-2 text-3xl font-semibold text-amber-600 dark:text-amber-400">{{ userStats?.techniciens ?? 0 }}</p>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-0">
        <div class="relative">
          <input type="text" v-model="searchQuery" placeholder="Rechercher par nom, email, téléphone..."
            class="form-input pl-10 w-full" />
          <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      <div class="flex gap-2">
        <select v-model="typeFilter" class="form-select">
          <option value="">Tous les types</option>
          <option value="medecin">Médecins</option>
          <option value="equipeSoins">Équipe de Soins</option>
          <option value="patient">Patients</option>
          <option value="admin">Administrateurs</option>
          <option value="technicien">Techniciens</option>
        </select>
        <select v-model="statusFilter" class="form-select">
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
          <option value="SUSPENDU">Suspendu</option>
        </select>
        <div class="relative" v-click-outside="closeExportMenu">
          <button class="btn btn-secondary flex items-center gap-2" @click="showExportMenu = !showExportMenu">
            <Download class="w-4 h-4" />
            Exporter
            <ChevronDown class="w-4 h-4" :class="{ 'rotate-180': showExportMenu }" />
          </button>
          <!-- Menu d'export -->
          <div v-if="showExportMenu"
            class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
            <div class="py-1">
              <button
                class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                @click="exportUsers('csv')">
                <FileText class="w-4 h-4 mr-2" />
                Exporter en CSV
              </button>
              <button
                class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                @click="exportUsers('json')">
                <Code class="w-4 h-4 mr-2" />
                Exporter en JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Boutons d'ajout -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <button
        class="btn flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300"
        @click="openAddModal('medecin')">
        <div class="text-center">
          <UserPlus class="w-6 h-6 mx-auto mb-2" />
          <span class="block font-medium">Nouveau Médecin</span>
        </div>
      </button>
      <button
        class="btn flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300"
        @click="openAddModal('equipeSoins')">
        <div class="text-center">
          <UserPlus class="w-6 h-6 mx-auto mb-2" />
          <span class="block font-medium">Nouveau membre soins</span>
        </div>
      </button>
      <button
        class="btn flex items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300"
        @click="openAddModal('technicien')">
        <div class="text-center">
          <Wrench class="w-6 h-6 mx-auto mb-2" />
          <span class="block font-medium">Nouveau Technicien</span>
        </div>
      </button>
      <button
        class="btn flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300"
        @click="openAddModal('patient')">
        <div class="text-center">
          <UserPlus class="w-6 h-6 mx-auto mb-2" />
          <span class="block font-medium">Nouveau Patient</span>
        </div>
      </button>
      <button
        class="btn flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        @click="openAddModal('admin')">
        <div class="text-center">
          <UserPlus class="w-6 h-6 mx-auto mb-2" />
          <span class="block font-medium">Nouvel Administrateur</span>
        </div>
      </button>
    </div>

    <!-- Modal d'ajout/édition d'utilisateur -->
    <BaseModal v-if="showAddModal" :title="modalTitle" @close="handleCloseModal">
      <MedecinForm v-if="selectedUserType === 'medecin'" :initial-data="editingUser" @submit="handleSubmitUser"
        @cancel="handleCloseModal" />
      <EquipeSoinsForm v-else-if="selectedUserType === 'equipeSoins'" :initial-data="editingUser"
        @submit="handleSubmitUser" @cancel="handleCloseModal" />
      <PatientForm v-else-if="selectedUserType === 'patient'" :initial-data="editingUser" @submit="handleSubmitUser"
        @cancel="handleCloseModal" />
      <PersonnelAdminForm v-else-if="selectedUserType === 'admin'" :initial-data="editingUser"
        @submit="handleSubmitUser" @cancel="handleCloseModal" />
      <TechnicianFormModal v-else-if="selectedUserType === 'technicien'" :technician="editingUser"
        @close="handleCloseModal" @save="handleSubmitUser" />
    </BaseModal>

    <!-- Modal de la carte patient -->
    <BaseModal v-if="showCardModal" title="Carte Patient" @close="showCardModal = false">
      <div class="space-y-4">
        <PatientCard :patient-data="cardData" :photo="selectedPatientPhoto" ref="patientCard" />
        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" @click="showCardModal = false">Fermer</button>
          <button type="button" class="btn btn-primary" @click="cardExists ? updatePatientCard() : savePatientCard()">
            <Save class="w-4 h-4 mr-2" />
            {{ cardExists ? 'Mettre à jour la carte' : 'Créer la carte' }}
          </button>
          <button type="button" class="btn btn-primary" :disabled="!cardExists" @click="showCreatedCard">
            <EyeIcon class="w-4 h-4 mr-2" />
            Afficher
          </button>
          <button type="button" class="btn btn-primary" :disabled="!cardExists" @click="printPatientCard">
            <Printer class="w-4 h-4 mr-2" />
            Imprimer
          </button>
        </div>
      </div>
    </BaseModal>

    <!-- Indicateur de chargement -->
    <div v-if="userStore.isLoading" class="flex justify-center py-8">
      <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="userStore.error" class="p-4 bg-red-50 text-red-700 rounded-lg">{{ userStore.error }}</div>

    <!-- Liste des utilisateurs -->
    <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
      <div class="p-4 grid gap-4">
        <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-4">
          <div class="w-1/3">Utilisateur</div>
          <div class="w-1/6">Type</div>
          <div class="w-1/4">Contact</div>
          <div class="w-1/6">Statut</div>
          <div class="w-20">Actions</div>
        </div>
        <div class="space-y-2">
          <div v-for="user in paginatedUsers" :key="getUserId(user)"
            class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150">
            <div class="w-1/3">
              <div class="flex items-center">
                <img v-if="getBaseUser(user).photo" :src="getBaseUser(user).photo" :alt="getUserFullName(user)"
                  class="w-10 h-10 rounded-full mr-3 object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                  :class="typeImageBorders[getBaseUser(user).role] || ''" />
                <div v-else
                  class="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white text-lg font-semibold"
                  :class="typeBackgrounds[getBaseUser(user).role] || 'bg-gray-500'">
                  {{ userInitials(user) }}
                </div>

                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ getUserFullName(user) }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">ID: {{ getUserId(user) }}</div>
                </div>
              </div>
            </div>
            <div class="w-1/6">
              <span class="type-badge" :class="typeClasses[getBaseUser(user).role] || 'bg-gray-50 text-gray-700'">
                {{ typeLabels[getBaseUser(user).role] || 'Inconnu' }}
              </span>
            </div>
            <div class="w-1/4 space-y-1">
              <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Mail class="w-4 h-4 mr-2" /> {{ getBaseUser(user).email || 'N/A' }}
              </div>
              <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Phone class="w-4 h-4 mr-2" /> {{ getBaseUser(user).telephone || 'N/A' }}
              </div>
            </div>
            <div class="w-1/6">
              <span class="status-badge"
                :class="statusClasses[getBaseUser(user).actif ? 'ACTIF' : 'INACTIF'] || 'bg-gray-100 text-gray-800'">
                {{ getBaseUser(user).actif ? 'ACTIF' : 'INACTIF' }}
              </span>
            </div>
            <div class="w-20 flex items-center space-x-2">
              <!-- Bouton d'ouverture du modal de carte patient -->
              <button v-if="getBaseUser(user).role === 'patient'"
                class="p-1 rounded-full text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                @click="viewPatientCard(user)">
                <Contact class="w-4 h-4" />
              </button>
              <button
                class="p-1 rounded-full text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                @click="editUser(user)">
                <Edit2 class="w-4 h-4" />
              </button>
              <button class="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                @click="confirmDeleteUser(user)">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div class="flex-1 flex justify-between sm:hidden">
          <button @click="currentPage--" :disabled="currentPage === 1" class="btn btn-secondary">Précédent</button>
          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="btn btn-secondary">Suivant</button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Affichage de <span class="font-medium">{{ paginationStart }}</span> à <span class="font-medium">{{
          paginationEnd }}</span> sur <span class="font-medium">{{ totalItems }}</span> résultats
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button v-for="page in displayedPages" :key="page" @click="currentPage = page"
                :class="['btn', currentPage === page ? 'btn-primary' : 'btn-secondary', 'px-4 py-2']">
                {{ page }}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <ConfirmationModal v-if="showDeleteModal" title="Supprimer l'utilisateur"
      :message="`Êtes-vous sûr de vouloir supprimer l'utilisateur ${getUserFullName(userToDelete)} ?`" type="danger"
      @confirm="deleteUser" @cancel="showDeleteModal = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  UserPlus, Edit2, Trash2, Loader2, Search, Download, ChevronDown,
  FileText, Code, Wrench, Mail, Phone, Printer, Contact, EyeIcon, Save
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'
import MedecinForm from '@/components/users/MedecinForm.vue'
import EquipeSoinsForm from '@/components/users/EquipeSoinsForm.vue'
import PatientForm from '@/components/users/PatientForm.vue'
import PersonnelAdminForm from '@/components/users/PersonnelAdminForm.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import TechnicianFormModal from '@/components/users/TechnicianFormModal.vue'
import PatientCard from '@/components/users/PatientCard.vue'
import Papa from 'papaparse'
import { useCardIdStore } from '@/stores/cardID'

const showCardModal = ref(false)
const selectedPatient = ref(null)
const cardIdStore = useCardIdStore()

const userStore = useUserStore()
const toast = useToast()

// États locaux
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref(null)
const userToDelete = ref(null)
const selectedUserType = ref('')
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showExportMenu = ref(false)

const isLoading = ref(false)

// Récupération des données de base de l'utilisateur
const getBaseUser = (user) => {
  if (user.utilisateur) {
    return {
      ...user.utilisateur,
      photo: user.utilisateur.photo || user.utilisateur.base64_photo || null
    }
  }
  if (user.user) {
    return {
      ...user.user,
      photo: user.user.photo || user.user.base64_photo || null
    }
  }
  return {
    ...user,
    photo: user.photo || user.base64_photo || null
  }
}



// Récupération de l'ID à utiliser pour le patient : si la propriété "patient" existe, on prend son _id
const getPatientId = (user) => {
  if (user.patient && user.patient._id) return user.patient._id
  return getUserId(user)
}

const getUserFullName = (user) => {
  const base = getBaseUser(user)
  return `${base.nom || ''} ${base.prenom || ''}`.trim()
}

const getUserId = (user) => {
  if (user._id) return user._id
  if (user.utilisateur_id) return user.utilisateur_id
  const base = getBaseUser(user)
  return base._id
}

const userInitials = (user) => {
  const base = getBaseUser(user)
  const nomInitial = base.nom ? base.nom[0] : ''
  const prenomInitial = base.prenom ? base.prenom[0] : ''
  return `${nomInitial}${prenomInitial}`
}

const selectedPatientPhoto = ref(null)
const cardData = ref(null)
const patientCard = ref(null)

const modalTitle = computed(() => {
  if (editingUser.value) return "Modifier l'utilisateur"
  switch (selectedUserType.value) {
    case 'medecin': return "Ajouter un Médecin"
    case 'equipeSoins': return "Ajouter un Membre de Soins"
    case 'patient': return "Ajouter un Patient"
    case 'admin': return "Ajouter un Administrateur"
    case 'technicien': return "Ajouter un Technicien"
    default: return "Ajouter un Utilisateur"
  }
})

const typeLabels = {
  medecin: 'Médecin',
  equipeSoins: 'Équipe de Soins',
  patient: 'Patient',
  admin: 'Administrateur',
  technicien: 'Technicien'
}

const typeBackgrounds = {
  medecin: 'bg-blue-500',
  equipeSoins: 'bg-green-500',
  patient: 'bg-purple-500',
  admin: 'bg-gray-500',
  technicien: 'bg-amber-500'
}

const typeImageBorders = {
  medecin: 'border-blue-200',
  equipeSoins: 'border-green-200',
  patient: 'border-purple-200',
  admin: 'border-gray-200',
  technicien: 'border-amber-200'
}

const typeClasses = {
  medecin: 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-300',
  equipeSoins: 'bg-green-50 text-green-700 ring-1 ring-green-700/10 dark:bg-green-900/20 dark:text-green-300',
  patient: 'bg-purple-50 text-purple-700 ring-1 ring-purple-700/10 dark:bg-purple-900/20 dark:text-purple-300',
  admin: 'bg-gray-50 text-gray-700 ring-1 ring-gray-700/10 dark:bg-gray-900/20 dark:text-gray-300',
  technicien: 'bg-amber-50 text-amber-700 ring-1 ring-amber-700/10 dark:bg-amber-900/20 dark:text-amber-300'
}

const statusClasses = {
  ACTIF: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  INACTIF: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  SUSPENDU: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
}

const userStats = computed(() => ({
  total: userStore.users?.length || 0,
  medecins: userStore.users?.filter(u => u.userType === 'medecin' || getBaseUser(u).role === 'medecin').length || 0,
  equipesSoins: userStore.users?.filter(u => u.userType === 'equipeSoins' || getBaseUser(u).role === 'equipeSoins').length || 0,
  patients: userStore.users?.filter(u => u.userType === 'patient' || getBaseUser(u).role === 'patient').length || 0,
  admins: userStore.users?.filter(u => u.userType === 'admin' || getBaseUser(u).role === 'admin').length || 0,
  techniciens: userStore.users?.filter(u => u.userType === 'technicien' || getBaseUser(u).role === 'technicien').length || 0
}))

const filteredUsers = computed(() => {
  let users = userStore.users
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    users = users.filter(user => {
      const base = getBaseUser(user)
      return (
        (base.nom?.toLowerCase().includes(query)) ||
        (base.prenom?.toLowerCase().includes(query)) ||
        (base.email?.toLowerCase().includes(query)) ||
        (base.telephone?.includes(query))
      )
    })
  }
  if (typeFilter.value) {
    users = users.filter(user => {
      if (user.userType && user.userType.toLowerCase() === typeFilter.value.toLowerCase()) return true
      const base = getBaseUser(user)
      return base.role && base.role.toLowerCase() === typeFilter.value.toLowerCase()
    })
  }
  if (statusFilter.value) {
    users = users.filter(user => {
      const base = getBaseUser(user)
      if (statusFilter.value === 'ACTIF') return base.actif === true
      if (statusFilter.value === 'INACTIF') return base.actif === false
      if (statusFilter.value === 'SUSPENDU') return base.statutCompte === 'SUSPENDU'
      return true
    })
  }
  return users
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsers.value.slice(start, end)
})
const totalItems = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
const paginationStart = computed(() => ((currentPage.value - 1) * itemsPerPage.value) + 1)
const paginationEnd = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))
const displayedPages = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || (i >= currentPage.value - 2 && i <= currentPage.value + 2)) {
      pages.push(i)
    }
  }
  return pages
})

onMounted(async () => {
  try {
    isLoading.value = true
    await userStore.fetchUsers('medecin')
    await userStore.fetchUsers('equipeSoins')
    await userStore.fetchUsers('patient')
    await userStore.fetchUsers('admin')
    await userStore.fetchUsers('technicien')
    isLoading.value = false

    if (userStore.users.length === 0) {
      toast.error("Aucun utilisateur trouvé. Vérifiez la connexion à la base de données.")
      console.error("Aucun utilisateur n'a été chargé depuis la base de données.")
    }
  } catch (error) {
    isLoading.value = false
    toast.error("Erreur lors du chargement des utilisateurs")
    console.error("Erreur lors du chargement des utilisateurs:", error)
  }
})

watch(() => userStore.users, (newUsers) => {
  console.log('Users updated:', newUsers)
  console.log('Total users:', newUsers.length)
  console.log('User types:', newUsers.map(u => getBaseUser(u).role).filter((v, i, a) => a.indexOf(v) === i))
}, { deep: true })

watch(typeFilter, async (newType) => {
  try {
    isLoading.value = true
    if (newType) {
      await userStore.fetchUsers(newType)
    } else {
      await userStore.fetchUsers('medecin')
      await userStore.fetchUsers('equipeSoins')
      await userStore.fetchUsers('patient')
      await userStore.fetchUsers('admin')
      await userStore.fetchUsers('technicien')
    }
    isLoading.value = false
  } catch (error) {
    isLoading.value = false
    toast.error("Erreur lors du chargement des utilisateurs")
    console.error("Erreur lors du chargement des utilisateurs:", error)
  }
})

const handleCloseModal = () => {
  showAddModal.value = false
  editingUser.value = null
  selectedUserType.value = ''
}

const handleSubmitUser = async (userData) => {
  try {
    if (editingUser.value) {
      await userStore.updateUser(getUserId(editingUser.value), userData)
      toast.success('Utilisateur mis à jour avec succès')
    } else {
      await userStore.createUser(userData)
      toast.success('Utilisateur créé avec succès')
    }
    handleCloseModal()
    await userStore.fetchUsers(typeFilter.value || '')
  } catch (error) {
    toast.error(error.message || 'Une erreur est survenue')
    console.error("Erreur lors de la soumission du formulaire:", error)
  }
}

const editUser = async (user) => {
  try {
    const baseUser = getBaseUser(user)
    const userId = getUserId(user)
    const userType = baseUser.role || user.userType

    selectedUserType.value = userType

    const formattedUser = {
      id: userId,
      _id: userId,
      ...baseUser,
      ...user,
      userType: userType,
      role: userType
    }

    editingUser.value = formattedUser
    showAddModal.value = true

    console.log('Editing user:', formattedUser)
  } catch (error) {
    toast.error(`Erreur lors du chargement des données: ${error.message}`)
    console.error("Erreur lors du chargement des données de l'utilisateur:", error)
  }
}

const confirmDeleteUser = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const deleteUser = async () => {
  try {
    await userStore.deleteUser(getUserId(userToDelete.value), getBaseUser(userToDelete.value).role)
    toast.success('Utilisateur supprimé avec succès')
    showDeleteModal.value = false
    userToDelete.value = null
  } catch (error) {
    toast.error(`Erreur lors de la suppression: ${error.message}`)
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
  }
}

const openAddModal = (userType) => {
  selectedUserType.value = userType
  editingUser.value = null
  showAddModal.value = true
}

const exportUsers = async (format) => {
  try {
    const data = filteredUsers.value.map(user => {
      const base = getBaseUser(user)
      return {
        ID: base._id,
        Type: typeLabels[base.role] || 'Inconnu',
        Nom: base.nom || 'N/A',
        Prénom: base.prenom || 'N/A',
        Email: base.email || 'N/A',
        Téléphone: base.telephone || 'N/A',
        Statut: base.actif ? 'ACTIF' : 'INACTIF'
      }
    })

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.${format}`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    toast.error("Erreur lors de l'export des utilisateurs")
    console.error("Erreur lors de l'export des utilisateurs:", error)
  }
}

const viewPatientCard = async (user) => {
  try {
    const patientId = getPatientId(user);
    const baseUser = getBaseUser(user);
    cardData.value = {
      ...user,
      ...baseUser,
      id: patientId,
      groupeSanguin: user.groupeSanguin || baseUser.groupeSanguin || (user.patient ? user.patient.groupeSanguin : 'N/A'),
      telephone: user.telephone || baseUser.telephone || (user.patient ? user.patient.telephone : 'N/A'),
      cardCreated: false
    };
    selectedPatientPhoto.value = user.base64_photo || baseUser.base64_photo || (user.patient ? user.patient.base64_photo : null);
    console.log("Données de carte préparées :", cardData.value);
    showCardModal.value = true;
  } catch (error) {
    console.error('Erreur:', error);
    toast.error(error.message || 'Erreur de chargement de la carte');
  }
}

// Création de la carte (bouton "Créer la carte")
const savePatientCard = async () => {
  try {
    if (!cardData.value?.id) {
      throw new Error('ID patient manquant')
    }
    // Si aucune photo n'est fournie, on envoie une chaîne vide
    const photo = selectedPatientPhoto.value ? selectedPatientPhoto.value : "";

    // Préparez un objet QRData contenant uniquement les informations désirées
    const qrDataToEncode = {
      id: cardData.value.id,
      nom: cardData.value.nom,
      prenom: cardData.value.prenom,
      dateNaissance: cardData.value.dateNaissance,
      groupeSanguin: cardData.value.groupeSanguin,
      telephone: cardData.value.telephone
    };

    const cardPayload = {
      base64_photo: photo,
      reference: `CARD-${cardData.value.id}-${Date.now()}`,
      codeQR: JSON.stringify(qrDataToEncode),
      patient_id: cardData.value.id
    };
    
    await cardIdStore.createCard(cardData.value.id, cardPayload);
    cardExists.value = true;
    toast.success('Carte sauvegardée avec succès');
  } catch (error) {
    console.error('Erreur sauvegarde:', error.response ? error.response.data : error);
    toast.error(error.response?.data?.message || error.message || 'Erreur lors de la création de la carte');
  }
}

// Alias pour savePatientCard pour maintenir la compatibilité
const createPatientCard = savePatientCard;

// Mise à jour de la carte (bouton "Mettre à jour la carte")
const updatePatientCard = async () => {
  try {
    if (!cardData.value?.id) {
      throw new Error('ID patient manquant')
    }
    
    // Récupérer d'abord la carte existante par l'ID du patient
    const existingCard = await cardIdStore.getCardByPatientId(cardData.value.id)
    
    // Vérifier si la carte existe
    if (!existingCard || !existingCard._id) {
      // Si la carte n'existe pas, créer une nouvelle carte au lieu de mettre à jour
      return await createPatientCard()
    }
    
    const qrDataToEncode = {
      id: cardData.value.id,
      nom: cardData.value.nom,
      prenom: cardData.value.prenom,
      dateNaissance: cardData.value.dateNaissance,
      groupeSanguin: cardData.value.groupeSanguin,
      telephone: cardData.value.telephone
    };

    const cardPayload = {
      base64_photo: selectedPatientPhoto.value,
      reference: `CARD-${cardData.value.id}-${Date.now()}`,
      codeQR: JSON.stringify(qrDataToEncode),
      patient_id: cardData.value.id
    }
    
    // Utiliser l'ID de la carte pour la mise à jour, pas l'ID du patient
    await cardIdStore.updateCard(existingCard._id, cardPayload)
    cardExists.value = true;
    toast.success('Carte mise à jour avec succès')
  } catch (error) {
    console.error('Erreur mise à jour:', error)
    toast.error(error.message || 'Erreur lors de la mise à jour')
  }
}

// Vérification de l'existence de la carte
const cardExists = ref(false)

// Mettre à jour cardExists après la création ou la mise à jour de la carte
watch(cardData, async (newCardData) => {
  if (newCardData?.id) {
    try {
      await cardIdStore.getCardByPatientId(newCardData.id)
      cardExists.value = true
    } catch (error) {
      if (error.response?.status === 404) {
        cardExists.value = false
      } else {
        console.error('Erreur lors de la vérification de la carte:', error)
        cardExists.value = false
        toast.error(error.message || 'Erreur lors de la vérification de la carte')
      }
    }
  } else {
    cardExists.value = false
  }
}, { immediate: true })


// Fonction utilitaire pour récupérer la carte via l'ID patient puis télécharger le PDF
const fetchCardAndDownload = async (patientId) => {
  // Récupère la carte associée au patient
  const card = await cardIdStore.getCardByPatientId(patientId)
  if (!card || !card._id) {
    throw new Error("Carte non trouvée pour ce patient")
  }
  // Utilise l'ID de la carte pour télécharger le PDF
  const cardBlob = await cardIdStore.downloadCard(card._id)
  return cardBlob
}


const showCreatedCard = async () => {
  try {
    if (!cardData.value || !cardData.value.id) {
      toast.error("Données de carte non disponibles")
      return
    }
    // Utilise l'ID patient contenu dans cardData.value.id pour récupérer la carte depuis la BDD
    const cardBlob = await fetchCardAndDownload(cardData.value.id)
    if (cardBlob) {
      const blob = new Blob([cardBlob], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      toast.success('Carte affichée avec succès')
    } else {
      toast.error('Aucune carte trouvée en BDD')
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la carte:', error)
    toast.error(error.response?.data?.message || error.message || 'Erreur lors de la récupération de la carte')
  }
}

const printPatientCard = async () => {
  try {
    if (!cardData.value || !cardData.value.id) {
      toast.error("Données de carte non disponibles")
      return
    }
    // Récupère le blob PDF en passant l'ID patient
    const cardBlob = await fetchCardAndDownload(cardData.value.id)
    if (!cardBlob) {
      toast.error("Aucune carte disponible pour impression")
      return
    }
    const blob = new Blob([cardBlob], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression")
      return
    }
    // Une fois la fenêtre chargée, déclenche l'impression
    printWindow.addEventListener('load', function () {
      printWindow.print()
      URL.revokeObjectURL(url)
    })
  } catch (error) {
    console.error('Erreur lors de l\'impression de la carte:', error)
    toast.error(error.message || 'Erreur lors de l\'impression de la carte')
  }
}

const closeExportMenu = () => {
  showExportMenu.value = false
}
</script>

<style scoped>
.type-badge {
  @apply px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center;
}

.status-badge {
  @apply px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center;
}

.btn {
  @apply rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500;
}
</style>
