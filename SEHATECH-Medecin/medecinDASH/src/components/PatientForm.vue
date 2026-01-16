<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Nom -->
      <div>
        <label for="nom" class="form-label">Nom</label>
        <input
          id="nom"
          v-model="formData.nom"
          type="text"
          class="form-input"
          required
        />
      </div>

      <!-- Prénom -->
      <div>
        <label for="prenom" class="form-label">Prénom</label>
        <input
          id="prenom"
          v-model="formData.prenom"
          type="text"
          class="form-input"
          required
        />
      </div>

      <!-- Date de naissance -->
      <div>
        <label for="dateNaissance" class="form-label">Date de naissance</label>
        <input
          id="dateNaissance"
          v-model="formData.dateNaissance"
          type="date"
          class="form-input"
          required
        />
      </div>

      <!-- Chambre -->
      <div>
        <label for="chambre" class="form-label">Chambre</label>
        <input
          id="chambre"
          v-model="formData.chambre"
          type="text"
          class="form-input"
          required
        />
      </div>

      <!-- État -->
      <div>
        <label for="etat" class="form-label">État</label>
        <select
          id="etat"
          v-model="formData.etat"
          class="form-select"
          required
        >
          <option value="Stable">Stable</option>
          <option value="En observation">En observation</option>
          <option value="Critique">Critique</option>
        </select>
      </div>

      <!-- Médecin traitant -->
      <div>
        <label for="medecinTraitant" class="form-label">Médecin traitant</label>
        <input
          id="medecinTraitant"
          v-model="formData.medecinTraitant"
          type="text"
          class="form-input"
          required
        />
      </div>

      <!-- Signes vitaux si état critique ou en observation -->
      <template v-if="formData.etat !== 'Stable'">
        <div>
          <label for="frequenceCardiaque" class="form-label">Fréquence cardiaque (bpm)</label>
          <input
            id="frequenceCardiaque"
            v-model.number="formData.signesVitaux.frequenceCardiaque"
            type="number"
            class="form-input"
            required
          />
        </div>

        <div>
          <label for="temperature" class="form-label">Température (°C)</label>
          <input
            id="temperature"
            v-model.number="formData.signesVitaux.temperature"
            type="number"
            step="0.1"
            class="form-input"
            required
          />
        </div>

        <div>
          <label for="respiration" class="form-label">Respiration (rpm)</label>
          <input
            id="respiration"
            v-model.number="formData.signesVitaux.respiration"
            type="number"
            class="form-input"
            required
          />
        </div>
      </template>
    </div>

    <!-- Boutons -->
    <div class="flex justify-end space-x-4">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn-secondary"
      >
        Annuler
      </button>
      <button
        type="submit"
        class="btn-primary"
      >
        {{ patient ? 'Modifier' : 'Ajouter' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PatientSearchModal from '@/components/PatientSearchModal.vue'

const props = defineProps({
  patient: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel'])

const defaultFormData = {
  nom: '',
  prenom: '',
  dateNaissance: '',
  chambre: '',
  etat: 'Stable',
  medecinTraitant: '',
  signesVitaux: {
    frequenceCardiaque: 75,
    temperature: 36.8,
    respiration: 16
  }
}

const formData = ref({ ...defaultFormData })

onMounted(() => {
  if (props.patient) {
    formData.value = { ...props.patient }
  }
})

const handleSubmit = () => {
  emit('submit', { ...formData.value })
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

.form-select {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}

.btn-primary {
  @apply px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
         dark:focus:ring-offset-gray-800;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 
         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
         dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
         dark:focus:ring-offset-gray-800;
}
</style> 