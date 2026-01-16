<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg font-medium leading-6 text-gray-900">Ajouter un nouveau patient</h3>
      <form @submit.prevent="handleSubmit" class="mt-5 space-y-6">
        <!-- Informations utilisateur -->
        <div class="border-b border-gray-200 pb-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Informations personnelles</h4>
          <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                id="firstName"
                v-model="formData.user.firstName"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                id="lastName"
                v-model="formData.user.lastName"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                v-model="formData.user.email"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                id="phone"
                v-model="formData.user.phone"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="gender" class="block text-sm font-medium text-gray-700">Genre</label>
              <select
                id="gender"
                v-model="formData.user.gender"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="O">Autre</option>
              </select>
            </div>

            <div>
              <label for="birthDate" class="block text-sm font-medium text-gray-700">Date de naissance</label>
              <input
                type="date"
                id="birthDate"
                v-model="formData.user.birthDate"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="address" class="block text-sm font-medium text-gray-700">Adresse</label>
              <textarea
                id="address"
                v-model="formData.user.address"
                rows="3"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Informations médicales -->
        <div class="border-b border-gray-200 pb-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Informations médicales</h4>
          <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label for="height" class="block text-sm font-medium text-gray-700">Taille (cm)</label>
              <input
                type="number"
                id="height"
                v-model="formData.patient.height"
                required
                min="0"
                max="300"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="weight" class="block text-sm font-medium text-gray-700">Poids (kg)</label>
              <input
                type="number"
                id="weight"
                v-model="formData.patient.weight"
                required
                min="0"
                max="500"
                step="0.1"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="bloodType" class="block text-sm font-medium text-gray-700">Groupe sanguin</label>
              <select
                id="bloodType"
                v-model="formData.patient.bloodType"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Sélectionner</option>
                <option v-for="type in bloodTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </div>

            <div>
              <label for="status" class="block text-sm font-medium text-gray-700">Statut</label>
              <select
                id="status"
                v-model="formData.patient.status"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label for="allergies" class="block text-sm font-medium text-gray-700">Allergies connues</label>
              <textarea
                id="allergies"
                v-model="formData.patient.knownAllergies"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Saisir les allergies (une par ligne)"
              ></textarea>
            </div>

            <div class="sm:col-span-2">
              <label for="chronicDiseases" class="block text-sm font-medium text-gray-700">Maladies chroniques</label>
              <textarea
                id="chronicDiseases"
                v-model="formData.patient.chronicDiseases"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Saisir les maladies chroniques (une par ligne)"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 border rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import '@/components/forms/FormStyles.vue'
import { ref } from 'vue'
import { usePatientStore } from '../stores/patients'

const patientStore = usePatientStore()
const isSubmitting = ref(false)

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const formData = ref({
  user: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    birthDate: '',
    address: '',
    role: 'patient',
    accountStatus: 'active',
  },
  patient: {
    height: '',
    weight: '',
    bloodType: '',
    knownAllergies: '',
    chronicDiseases: '',
    status: 'active',
  }
})

async function handleSubmit() {
  try {
    isSubmitting.value = true
    await patientStore.addPatient(formData.value)
    formData.value = {
      user: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        birthDate: '',
        address: '',
        role: 'patient',
        accountStatus: 'active',
      },
      patient: {
        height: '',
        weight: '',
        bloodType: '',
        knownAllergies: '',
        chronicDiseases: '',
        status: 'active',
      }
    }
    $emit('success')
  } catch (error) {
    console.error('Error adding patient:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Tous les styles de formulaire peuvent être supprimés car ils sont dans FormStyles.vue */
/* Garder uniquement les styles spécifiques s'il y en a */
</style>
