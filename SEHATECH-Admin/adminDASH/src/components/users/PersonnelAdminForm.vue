<template>
  <form @submit.prevent="handleSubmit" class="space-y-8">
    <!-- Informations personnelles -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Informations personnelles
      </h3>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <!-- Nom -->
        <div>
          <label class="form-label">Nom</label>
          <input v-model="form.nom" type="text" class="form-input" required />
        </div>
        <!-- Prénom -->
        <div>
          <label class="form-label">Prénom</label>
          <input v-model="form.prenom" type="text" class="form-input" required />
        </div>
        <!-- Email -->
        <div>
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-input" required />
        </div>
        <!-- Mot de passe -->
        <div>
          <label class="form-label">Mot de passe</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            :required="!isEditing"
          />
        </div>
        <!-- Téléphone -->
        <div>
          <label class="form-label">Téléphone</label>
          <input
            v-model="form.telephone"
            type="tel"
            class="form-input"
            placeholder="0X XX XX XX XX"
            required
          />
        </div>
        <!-- Date de naissance -->
        <div>
          <label class="form-label">Date de naissance</label>
          <input v-model="form.dateNaissance" type="date" class="form-input" required />
        </div>
        <!-- Genre -->
        <div>
          <label class="form-label">Genre</label>
          <select v-model="form.genre" class="form-select" required>
            <option value="">Sélectionner un genre</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <!-- Adresse -->
        <div class="sm:col-span-2">
          <label class="form-label">Adresse</label>
          <input v-model="form.adresse" type="text" class="form-input" required />
        </div>
      </div>
    </div>

    <!-- Informations professionnelles -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Informations professionnelles
      </h3>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <!-- Poste -->
        <div>
          <label class="form-label">Poste</label>
          <select v-model="form.poste" class="form-select" required>
            <option value="">Sélectionner un poste</option>
            <option value="secretaire">Secrétaire médical(e)</option>
            <option value="comptable">Comptable</option>
            <option value="rh">Responsable RH</option>
            <option value="admin">Administrateur système</option>
            <option value="direction">Direction</option>
            <option value="accueil">Agent d'accueil</option>
          </select>
        </div>
        <!-- Service -->
        <div>
          <label class="form-label">Service</label>
          <select v-model="form.service" class="form-select" required>
            <option value="">Sélectionner un service</option>
            <option value="administration">Administration</option>
            <option value="comptabilite">Comptabilité & Finance</option>
            <option value="rh">Ressources Humaines</option>
            <option value="accueil">Accueil & Relations patients</option>
            <option value="informatique">Service Informatique</option>
            <option value="direction">Direction</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Boutons d'action -->
    <div class="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
        Annuler
      </button>
      <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  },
  submitLabel: {
    type: String,
    default: 'Enregistrer'
  }
})

const emit = defineEmits(['submit', 'cancel'])
const toast = useToast()
const isSubmitting = ref(false)
const isEditing = computed(() => !!props.initialData?.id)

const form = ref({
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  dateNaissance: '',
  password: '',
  genre: '',
  adresse: '',
  poste: '',
  service: '',
  // Fields to be used by the store and backend:
  userType: 'admin',
  role: 'admin'
})

const initializeForm = () => {
  if (props.initialData?.id) {
    console.log('Données initiales reçues:', props.initialData)
    
    // Récupération des données de l'utilisateur de base
    const baseData = {
      id: props.initialData.id || props.initialData._id,
      _id: props.initialData._id,
      nom: props.initialData.nom,
      prenom: props.initialData.prenom,
      email: props.initialData.email,
      telephone: props.initialData.telephone,
      dateNaissance: props.initialData.dateNaissance,
      genre: props.initialData.genre,
      adresse: props.initialData.adresse,
      password: '', // On ne récupère jamais le mot de passe
      userType: 'admin',
      role: 'admin'
    }

    // Récupération explicite des données spécifiques admin
    const adminData = {
      poste: props.initialData.poste || props.initialData.utilisateur?.poste,
      service: props.initialData.service || props.initialData.utilisateur?.service
    }

    console.log('Données admin récupérées:', adminData)

    // Combinaison des données
    form.value = {
      ...baseData,
      ...adminData
    }

    console.log('Formulaire initialisé avec:', form.value)
  } else {
    // Réinitialisation du formulaire pour un nouvel admin
    form.value = {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      dateNaissance: '',
      password: '',
      genre: '',
      adresse: '',
      poste: '',
      service: '',
      userType: 'admin',
      role: 'admin'
    }
  }
}

watch(() => props.initialData, (newData) => {
  if (newData) {
    console.log('Nouvelles données reçues pour initialisation:', newData)
    initializeForm()
  }
}, { immediate: true, deep: true })

const handleSubmit = async () => {
  // Validate that all required fields are provided
  if (
    !form.value.nom ||
    !form.value.prenom ||
    !form.value.email ||
    (!isEditing.value && !form.value.password) ||
    !form.value.dateNaissance ||
    !form.value.genre ||
    !form.value.adresse ||
    !form.value.telephone ||
    !form.value.poste ||
    !form.value.service
  ) {
    toast.error("Champs obligatoires manquants")
    return
  }
  
  isSubmitting.value = true
  try {
    // Emit the form data to the parent component.
    // The parent (Users.vue) will use the store's createUser method,
    // which sends the payload to the correct endpoint (/admins/register).
    emit('submit', { ...form.value })
  } catch (error) {
    toast.error(`Erreur: ${error.message}`)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}
.form-input,
.form-select {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm
    focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white sm:text-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700;
}
.btn-secondary {
  @apply bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500;
}
</style>
