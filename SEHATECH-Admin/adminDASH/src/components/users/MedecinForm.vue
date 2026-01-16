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
          </select>
        </div>
        <!-- Adresse -->
        <div class="sm:col-span-2">
          <label class="form-label">Adresse</label>
          <textarea
            v-model="form.adresse"
            class="form-textarea"
            rows="2"
            required
          ></textarea>
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
          <p class="form-help" v-if="isEditing">
            Laisser vide pour ne pas modifier le mot de passe
          </p>
        </div>
        <!-- Ajout de la photo -->
        <div class="sm:col-span-2">
          <label class="form-label">Photo du médecin</label>
          <div class="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
            <img
              v-if="photoPreview"
              :src="photoPreview"
              alt="Photo du médecin"
              class="w-full h-full object-cover rounded-lg"
            />
            <div v-else class="flex items-center justify-center w-full h-full">
              <span class="text-gray-500">Aucune image</span>
            </div>
            <input
              type="file"
              accept="image/*"
              class="absolute inset-0 opacity-0 cursor-pointer"
              @change="handlePhotoChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Informations professionnelles -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Informations professionnelles
      </h3>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <!-- Spécialité -->
        <div>
          <label class="form-label">Spécialité</label>
          <select v-model="form.specialite" class="form-select" required>
            <option value="">Sélectionner une spécialité</option>
            <option value="Cardiologie">Cardiologie</option>
            <option value="DERMATOLOGIE">Dermatologie</option>
            <option value="PEDIATRIE">Pédiatrie</option>
            <option value="Neurochirurgie">Neurochirurgie</option>
            <!-- Autres options -->
          </select>
        </div>
        <!-- Numéro d'ordre -->
        <div>
          <label class="form-label">Numéro d'ordre</label>
          <input
            v-model="form.numeroOrdre"
            type="text"
            class="form-input"
            placeholder="Ex: MED-12345"
            required
          />
        </div>
        <!-- Expérience -->
        <div>
          <label class="form-label">Années d'expérience</label>
          <input
            v-model="form.experienceAnnee"
            type="number"
            min="0"
            max="50"
            class="form-input"
            required
          />
        </div>
        <!-- Disponibilité -->
        <div>
          <label class="form-label">Disponibilité</label>
          <select v-model="form.disponibilite" class="form-select" required>
            <option value="true">Disponible</option>
            <option value="false">Indisponible</option>
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
const isEditing = computed(() => !!props.initialData)

const defaultForm = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  dateNaissance: '',
  genre: '',
  adresse: '',
  password: '',
  specialite: '',
  numeroOrdre: '',
  experienceAnnee: '',
  disponibilite: true,
  userType: 'medecin',
  role: 'medecin',
  photo: '' // ajout du champ photo
}

const form = ref({ ...defaultForm })

const photoPreview = ref(null)

const initializeForm = () => {
  if (props.initialData) {
    console.log('Initializing form with data:', props.initialData)
    form.value = { 
      ...defaultForm,
      ...props.initialData,
      password: '', // toujours réinitialiser le mot de passe en mode édition
      userType: 'medecin',
      role: 'medecin'
    }
    if (form.value.dateNaissance && !form.value.dateNaissance.includes('-')) {
      try {
        const date = new Date(form.value.dateNaissance)
        form.value.dateNaissance = date.toISOString().split('T')[0]
      } catch (e) {
        console.error('Error formatting date:', e)
      }
    }
    if (typeof form.value.disponibilite === 'string') {
      form.value.disponibilite = form.value.disponibilite === 'true'
    }
    // Si une photo existe déjà dans l'initialData, on la prévisualise
    if (form.value.photo) {
      photoPreview.value = form.value.photo
    }
    console.log('Form initialized:', form.value)
  }
}

watch(() => props.initialData, initializeForm, { immediate: true })

const handlePhotoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Le fichier doit être une image (JPEG, PNG, JPG, GIF)')
      return
    }
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast.error('La taille du fichier ne doit pas dépasser 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target.result
      form.value.photo = e.target.result  // sauvegarde l'image en Base64 dans le formulaire
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmit = async () => {
  if (
    !form.value.nom ||
    !form.value.prenom ||
    !form.value.email ||
    (!isEditing.value && !form.value.password) ||
    !form.value.telephone ||
    !form.value.dateNaissance ||
    !form.value.genre ||
    !form.value.adresse ||
    !form.value.specialite ||
    !form.value.numeroOrdre ||
    !form.value.experienceAnnee
  ) {
    toast.error("Champs obligatoires manquants")
    return
  }

  isSubmitting.value = true
  try {
    const payload = { ...form.value }
    if (isEditing.value && !payload.password) {
      delete payload.password
    }
    emit('submit', payload)
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
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm
    focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white sm:text-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700;
}
.btn-secondary {
  @apply bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500;
}
.form-help {
  @apply mt-1 text-sm text-gray-500 dark:text-gray-400 italic;
}
</style>
