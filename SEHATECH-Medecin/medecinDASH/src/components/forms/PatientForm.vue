<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Nom complet</label>
        <input
          type="text"
          id="name"
          v-model="form.name"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
      </div>

      <div>
        <label for="age" class="block text-sm font-medium text-gray-700">Âge</label>
        <input
          type="number"
          id="age"
          v-model="form.age"
          required
          min="0"
          max="150"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
      </div>

      <div>
        <label for="room" class="block text-sm font-medium text-gray-700">Numéro de chambre</label>
        <input
          type="text"
          id="room"
          v-model="form.room"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
      </div>

      <div>
        <label for="condition" class="block text-sm font-medium text-gray-700">État</label>
        <select
          id="condition"
          v-model="form.condition"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="Stable">Stable</option>
          <option value="Unstable">Instable</option>
          <option value="Critical">Critique</option>
        </select>
      </div>
    </div>

    <div>
      <label for="diagnosis" class="block text-sm font-medium text-gray-700">Diagnostic</label>
      <textarea
        id="diagnosis"
        v-model="form.diagnosis"
        rows="3"
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      ></textarea>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <div>
        <label for="heartRate" class="block text-sm font-medium text-gray-700">Fréquence cardiaque (BPM)</label>
        <input
          type="number"
          id="heartRate"
          v-model="form.vitals.heartRate"
          required
          min="0"
          max="300"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
      </div>

      <div>
        <label for="temperature" class="block text-sm font-medium text-gray-700">Température (°C)</label>
        <input
          type="number"
          id="temperature"
          v-model="form.vitals.temperature"
          required
          min="30"
          max="45"
          step="0.1"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
      </div>

      <div>
        <label for="oxygen" class="block text-sm font-medium text-gray-700">Saturation O2 (%)</label>
        <input
          type="number"
          id="oxygen"
          v-model="form.vitals.oxygen"
          required
          min="0"
          max="100"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
      </div>
    </div>

    <div class="flex justify-end space-x-3">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Annuler
      </button>
      <button
        type="submit"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {{ patient ? 'Mettre à jour' : 'Ajouter' }}
      </button>
    </div>
  </form>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'PatientForm',
  props: {
    patient: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const form = ref({
      name: '',
      age: null,
      room: '',
      condition: 'Stable',
      diagnosis: '',
      admissionDate: new Date().toISOString(),
      vitals: {
        heartRate: null,
        temperature: null,
        oxygen: null
      }
    })

    onMounted(() => {
      if (props.patient) {
        form.value = { ...props.patient }
      }
    })

    const handleSubmit = () => {
      emit('submit', { ...form.value })
    }

    return {
      form,
      handleSubmit
    }
  }
}
</script>
