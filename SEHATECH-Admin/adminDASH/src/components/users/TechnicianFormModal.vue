<template>
  <BaseModal
    :title="technician ? 'Modifier le technicien biomédical' : 'Nouveau technicien biomédical'"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Informations personnelles -->
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Informations personnelles
        </h3>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <!-- Nom -->
          <div>
            <label class="form-label" for="tech-lastname">Nom</label>
            <input
              id="tech-lastname"
              v-model="form.nom"
              type="text"
              required
              class="form-input"
              placeholder="Nom du technicien"
            />
          </div>
          <!-- Prénom -->
          <div>
            <label class="form-label" for="tech-firstname">Prénom</label>
            <input
              id="tech-firstname"
              v-model="form.prenom"
              type="text"
              required
              class="form-input"
              placeholder="Prénom du technicien"
            />
          </div>
          <!-- Email -->
          <div>
            <label class="form-label" for="tech-email">Email</label>
            <input
              id="tech-email"
              v-model="form.email"
              type="email"
              required
              class="form-input"
              placeholder="email@exemple.com"
            />
          </div>
          <!-- Téléphone -->
          <div>
            <label class="form-label" for="tech-phone">Téléphone</label>
            <input
              id="tech-phone"
              v-model="form.telephone"
              type="tel"
              required
              class="form-input"
              placeholder="0XX XX XX XX"
            />
          </div>
          <!-- Adresse -->
          <div>
            <label class="form-label" for="tech-address">Adresse</label>
            <input
              id="tech-address"
              v-model="form.adresse"
              type="text"
              required
              class="form-input"
              placeholder="Adresse du technicien"
            />
          </div>
          <!-- Genre -->
          <div>
            <label class="form-label" for="tech-gender">Genre</label>
            <select id="tech-gender" v-model="form.genre" required class="form-select">
              <option value="">Sélectionner</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <!-- Date de naissance -->
          <div>
            <label class="form-label" for="tech-birthdate">Date de naissance</label>
            <input
              id="tech-birthdate"
              v-model="form.dateNaissance"
              type="date"
              required
              class="form-input"
            />
          </div>
          <!-- Mot de passe -->
          <div>
            <label class="form-label" for="tech-password">Mot de passe</label>
            <input
              id="tech-password"
              v-model="form.password"
              type="password"
              :required="!technician"
              class="form-input"
            />
            <p class="form-help" v-if="technician">
              Laisser vide pour ne pas modifier le mot de passe
            </p>
          </div>
        </div>
      </div>

      <!-- Informations professionnelles -->
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Informations professionnelles
        </h3>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <!-- Domaine -->
          <div>
            <label class="form-label" for="tech-domain">Domaine</label>
            <input
              id="tech-domain"
              v-model="form.domaine"
              type="text"
              required
              class="form-input"
              placeholder="Domaine d'expertise"
            />
          </div>
          <!-- Compétence -->
          <div>
            <label class="form-label" for="tech-competence">Compétence</label>
            <input
              id="tech-competence"
              v-model="form.competence"
              type="text"
              required
              class="form-input"
              placeholder="Compétence principale"
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!isValid || isSubmitting">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          {{ technician ? 'Modifier' : 'Créer' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  technician: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])
const toast = useToast()

// Ajout des propriétés "userType" et "role" dans l'objet par défaut
const defaultForm = {
  userType: 'technicien',
  role: 'technicien',
  nom: '',
  prenom: '',
  email: '',
  genre: '',
  dateNaissance: '',
  adresse: '',
  telephone: '',
  domaine: '',
  competence: '',
  password: ''
}

const form = ref(props.technician ? { ...props.technician } : { ...defaultForm })
const isSubmitting = ref(false)

const isValid = computed(() => {
  const requiredFields = [
    'nom',
    'prenom',
    'email',
    'genre',
    'dateNaissance',
    'adresse',
    'telephone',
    'domaine',
    'competence'
  ]

  const hasAllRequiredFields = requiredFields.every(field => form.value[field])
  const hasValidPassword = props.technician ? true : form.value.password

  return hasAllRequiredFields && hasValidPassword
})

const handleSubmit = async () => {
  if (!isValid.value) {
    toast.error('Veuillez remplir tous les champs obligatoires')
    return
  }

  isSubmitting.value = true
  try {
    const payload = { ...form.value }
    if (props.technician && !payload.password) {
      delete payload.password
    }
    await emit('save', payload)
    toast.success(
      props.technician
        ? 'Technicien biomédical modifié avec succès'
        : 'Technicien biomédical ajouté avec succès'
    )
    emit('close')
  } catch (error) {
    console.error(error)
    toast.error('Une erreur est survenue lors de la modification')
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
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-gray-300 sm:text-sm;
}
.btn {
  @apply inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2;
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

