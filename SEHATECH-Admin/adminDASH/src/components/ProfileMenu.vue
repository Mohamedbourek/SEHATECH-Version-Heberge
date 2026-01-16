<template>
  <Menu as="div" class="relative ml-3">
    <MenuButton class="flex items-center">
      <div class="flex items-center">
        <!-- Avatar -->
        <div class="relative w-8 h-8">
          <img
            v-if="user?.avatar"
            :src="user.avatar"
            class="rounded-full"
            alt="Avatar"
          />
          <div 
            v-else 
            class="w-full h-full rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center"
          >
            <span class="text-primary-600 dark:text-primary-400 text-sm font-medium">
              {{ userInitials }}
            </span>
          </div>
        </div>
        <!-- Nom et rôle -->
        <div class="hidden md:flex flex-col ml-3 text-left">
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ user?.nom }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ user?.role }}
          </span>
        </div>
        <!-- Icône menu -->
        <ChevronDown class="w-4 h-4 ml-2 text-gray-400" />
      </div>
    </MenuButton>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems 
        class="absolute right-0 mt-2 w-72 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <!-- En-tête avec infos utilisateur -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-900 dark:text-white">
            {{ user?.nom }} {{ user?.prenom }}
          </p>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {{ user?.email }}
          </p>
        </div>

        <!-- Menu items -->
        <div class="py-1">
          <!-- Profil -->
          <MenuItem v-slot="{ active }">
            <button
              @click="openProfileSettings"
              class="w-full text-left px-4 py-2 text-sm"
              :class="[
                active ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white' : 
                'text-gray-700 dark:text-gray-300'
              ]"
            >
              <div class="flex items-center">
                <User class="w-4 h-4 mr-3" />
                Mon profil
              </div>
            </button>
          </MenuItem>

          <!-- Paramètres -->
          <MenuItem v-slot="{ active }">
            <button
              @click="openSettings"
              class="w-full text-left px-4 py-2 text-sm"
              :class="[
                active ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white' : 
                'text-gray-700 dark:text-gray-300'
              ]"
            >
              <div class="flex items-center">
                <Settings class="w-4 h-4 mr-3" />
                Paramètres
              </div>
            </button>
          </MenuItem>

          <!-- Thème -->
          <MenuItem v-slot="{ active }">
            <button
              @click="toggleTheme"
              class="w-full text-left px-4 py-2 text-sm"
              :class="[
                active ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white' : 
                'text-gray-700 dark:text-gray-300'
              ]"
            >
              <div class="flex items-center">
                <component :is="isDarkMode ? Sun : Moon" class="w-4 h-4 mr-3" />
                {{ isDarkMode ? 'Mode clair' : 'Mode sombre' }}
              </div>
            </button>
          </MenuItem>

          <div class="border-t border-gray-200 dark:border-gray-700" />

          <!-- Déconnexion -->
          <MenuItem v-slot="{ active }">
            <button
              @click="handleLogout"
              class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400"
              :class="[
                active ? 'bg-gray-100 dark:bg-gray-700/50' : ''
              ]"
            >
              <div class="flex items-center">
                <LogOut class="w-4 h-4 mr-3" />
                Déconnexion
              </div>
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>

    <!-- Modal Profil -->
    <BaseModal
      v-if="showProfileModal"
      title="Mon profil"
      @close="showProfileModal = false"
    >
      <form @submit.prevent="updateProfile" class="space-y-6">
        <!-- Photo de profil -->
        <div class="flex items-center space-x-6">
          <div class="relative w-20 h-20">
            <img
              v-if="profileForm.avatar"
              :src="profileForm.avatar"
              class="rounded-full"
              alt="Avatar"
            />
            <div 
              v-else 
              class="w-full h-full rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center"
            >
              <span class="text-primary-600 dark:text-primary-400 text-xl font-medium">
                {{ userInitials }}
              </span>
            </div>
            <button
              type="button"
              class="absolute bottom-0 right-0 p-1 rounded-full bg-white dark:bg-gray-800 shadow-lg"
              @click="triggerFileInput"
            >
              <Camera class="w-4 h-4 text-gray-500" />
            </button>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleFileChange"
            />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              Photo de profil
            </h3>
            <p class="text-sm text-gray-500">
              JPG, PNG ou GIF. 2 Mo maximum.
            </p>
          </div>
        </div>

        <!-- Informations personnelles -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label class="form-label" for="nom">Nom</label>
            <input
              id="nom"
              v-model="profileForm.nom"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label" for="prenom">Prénom</label>
            <input
              id="prenom"
              v-model="profileForm.prenom"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              required
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label" for="telephone">Téléphone</label>
            <input
              id="telephone"
              v-model="profileForm.telephone"
              type="tel"
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label" for="role">Rôle</label>
            <input
              id="role"
              v-model="profileForm.role"
              type="text"
              disabled
              class="form-input bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showProfileModal = false"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isUpdating"
          >
            <Loader2 
              v-if="isUpdating"
              class="w-4 h-4 mr-2 animate-spin"
            />
            Enregistrer
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Modal Paramètres -->
    <BaseModal
      v-if="showSettingsModal"
      title="Paramètres"
      @close="showSettingsModal = false"
    >
      <div class="space-y-6">
        <!-- Préférences de notification -->
        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Notifications
          </h3>
          <div class="space-y-4">
            <label class="flex items-center">
              <input
                v-model="settings.notifications.email"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="ml-3">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notifications par email
                </span>
                <p class="text-sm text-gray-500">
                  Recevoir les notifications importantes par email
                </p>
              </span>
            </label>
            <label class="flex items-center">
              <input
                v-model="settings.notifications.push"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="ml-3">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notifications push
                </span>
                <p class="text-sm text-gray-500">
                  Recevoir les notifications push dans le navigateur
                </p>
              </span>
            </label>
          </div>
        </div>

        <!-- Préférences d'affichage -->
        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Affichage
          </h3>
          <div class="space-y-4">
            <label class="flex items-center">
              <input
                v-model="settings.display.compactMode"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="ml-3">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mode compact
                </span>
                <p class="text-sm text-gray-500">
                  Réduire l'espacement entre les éléments
                </p>
              </span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showSettingsModal = false"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="saveSettings"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </BaseModal>
  </Menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { 
  ChevronDown, 
  User, 
  Settings, 
  Sun, 
  Moon, 
  LogOut,
  Camera,
  Loader2
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'

const authStore = useAuthStore()
const { isDarkMode, toggleTheme } = useTheme()
const toast = useToast()

const user = computed(() => authStore.user)
const userInitials = computed(() => {
  if (!user.value?.nom) return ''
  return `${user.value.nom.charAt(0)}${user.value.prenom?.charAt(0) || ''}`
})

// États des modals
const showProfileModal = ref(false)
const showSettingsModal = ref(false)

// État du formulaire de profil
const profileForm = ref({
  nom: user.value?.nom || '',
  prenom: user.value?.prenom || '',
  email: user.value?.email || '',
  telephone: user.value?.telephone || '',
  role: user.value?.role || '',
  avatar: user.value?.avatar || ''
})

// État des paramètres
const settings = ref({
  notifications: {
    email: true,
    push: true
  },
  display: {
    compactMode: false
  }
})

const isUpdating = ref(false)
const fileInput = ref(null)

// Handlers
const openProfileSettings = () => {
  console.log('User data:', user.value)
  console.log('telephone',localStorage.getItem('telephone') )
  profileForm.value = {
    nom: user.value?.nom || '',
    prenom: user.value?.prenom || '',
    email: user.value?.email || '',
    telephone: localStorage.getItem('telephone')  || '',
    role: user.value?.role || '',
    avatar: user.value?.avatar || ''
  }
  showProfileModal.value = true
}

const openSettings = () => {
  showSettingsModal.value = true
}

const handleLogout = async () => {
  try {
    await authStore.logout()
  } catch (error) {
    toast.error("Erreur lors de la déconnexion")
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Le fichier est trop volumineux (2 Mo maximum)')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.value.avatar = e.target.result
  }
  reader.readAsDataURL(file)
}

const updateProfile = async () => {
  isUpdating.value = true
  try {
    await authStore.updateProfile(profileForm.value)
    toast.success('Profil mis à jour avec succès')
    showProfileModal.value = false
  } catch (error) {
    toast.error("Erreur lors de la mise à jour du profil")
  } finally {
    isUpdating.value = false
  }
}

const saveSettings = async () => {
  try {
    // Sauvegarder les paramètres
    toast.success('Paramètres enregistrés')
    showSettingsModal.value = false
  } catch (error) {
    toast.error("Erreur lors de l'enregistrement des paramètres")
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}

.form-checkbox {
  @apply rounded border-gray-300 text-primary-600 shadow-sm 
         focus:border-primary-500 focus:ring-primary-500
         dark:border-gray-600 dark:bg-gray-700;
}
</style> 