<template>
  <div class="hospitalization-form bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <form @submit.prevent="handleSubmit" ref="form" class="space-y-6 p-6">
      <!-- Patient Selection -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Patient
        </label>
        <select
          v-model="formData.patient_id"
          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200"
          required
        >
          <option value="">Sélectionnez un patient</option>
          <option v-for="patient in patients" :key="patient._id" :value="patient._id">
            {{ patient.utilisateur?.nom }} {{ patient.utilisateur?.prenom }}
          </option>
        </select>
      </div>

      <!-- Médecin Selection -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Médecin
        </label>
        <select
          v-model="formData.medecin_id"
          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200"
          required
        >
          <option value="">Sélectionnez un médecin</option>
          <option v-for="medecin in medecins" :key="medecin._id" :value="medecin._id">
            Dr. {{ medecin.utilisateur?.nom }} {{ medecin.utilisateur?.prenom }}
          </option>
        </select>
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Date de début
          </label>
          <input
            type="datetime-local"
            v-model="formData.dateDebut"
            class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200"
            required
          >
        </div>
        <div class="form-group">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Date de fin prévue
          </label>
          <input
            type="datetime-local"
            v-model="formData.dateFin"
            class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200"
          >
        </div>
      </div>

      <!-- Motif -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Motif d'hospitalisation
        </label>
        <textarea
          v-model="formData.motif"
          rows="3"
          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200 resize-none"
          required
        ></textarea>
      </div>

      <!-- Status -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Statut
        </label>
        <select
          v-model="formData.status"
          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200"
          required
        >
          <option value="">Sélectionnez un statut</option>
          <option value="en_attente">En attente</option>
          <option value="confirmée">Confirmée</option>
          <option value="en_cours">En cours</option>
          <option value="terminée">Terminée</option>
        </select>
      </div>

      <!-- Chambre Selection -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Chambre
        </label>
        <select
          v-model="formData.chambre_id"
          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200"
          required
        >
          <option value="">Sélectionnez une chambre</option>
          <option v-for="chambre in availableRooms" :key="chambre._id" :value="chambre._id">
            Chambre {{ chambre.numero }} - {{ chambre.type }} (Étage {{ chambre.etage }})
          </option>
        </select>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end mt-6">
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="hospitalizationStore.loading"
        >
          <span v-if="hospitalizationStore.loading" class="flex items-center">
            <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Chargement...
          </span>
          <span v-else>
            Créer l'hospitalisation
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHospitalizationStore } from '@/stores/hospitalization'
import { useRoomStore } from '@/stores/room'
import { useToast } from '@/composables/useToast'

const hospitalizationStore = useHospitalizationStore()
const roomStore = useRoomStore()
const toast = useToast()
const form = ref(null)

const formData = ref({
  patient_id: '',
  medecin_id: '',
  motif: '',
  chambre_id: '',
  dateDebut: new Date().toISOString().slice(0, 16),
  dateFin: '',
  status: 'en_attente'
})

const patients = computed(() => hospitalizationStore.patients)
const medecins = computed(() => hospitalizationStore.medecins)
const availableRooms = computed(() => roomStore.availableRooms)

onMounted(async () => {
  try {
    await roomStore.fetchRooms()
    console.log('Chambres disponibles:', availableRooms.value)
  } catch (error) {
    toast.error('Erreur lors du chargement des chambres')
  }
})

const handleSubmit = async () => {
  try {
    // Vérifier que tous les champs requis sont remplis
    if (!formData.value.patient_id || !formData.value.medecin_id || !formData.value.motif || !formData.value.chambre_id) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    // S'assurer que les dates sont valides
    if (!formData.value.dateDebut) {
      formData.value.dateDebut = new Date().toISOString().slice(0, 16)
    }

    // S'assurer que le statut est défini
    if (!formData.value.status) {
      formData.value.status = 'confirmée'
    }

    console.log('Envoi des données:', formData.value)
    const result = await hospitalizationStore.createHospitalization(formData.value)
    
    if (result) {
      // Réinitialiser le formulaire
      formData.value = {
        patient_id: '',
        medecin_id: '',
        motif: '',
        chambre_id: '',
        dateDebut: new Date().toISOString().slice(0, 16),
        dateFin: '',
        status: 'confirmée'
      }
      toast.success('Hospitalisation créée avec succès')
    }
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    toast.error(error.message || 'Erreur lors de la création de l\'hospitalisation')
  }
}
</script>

<style scoped>
.form-group {
  @apply mb-4;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2;
}

.form-group select,
.form-group input[type="text"],
.form-group input[type="datetime-local"],
.form-group textarea {
  @apply w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200;
}

.form-group select:disabled,
.form-group input[type="text"]:disabled,
.form-group input[type="datetime-local"]:disabled,
.form-group textarea:disabled {
  @apply bg-gray-100 dark:bg-gray-600 cursor-not-allowed;
}
</style> 