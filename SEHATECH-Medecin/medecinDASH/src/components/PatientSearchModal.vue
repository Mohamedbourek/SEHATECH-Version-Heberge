<template>
  <Modal title="Rechercher un patient" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Barre de recherche -->
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          class="form-input pl-10"
          placeholder="Rechercher par nom, prénom..."
          @input="performSearch"
          autofocus
        />
        <Search class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
      </div>

      <!-- Résultats -->
      <div class="max-h-96 overflow-y-auto">
        <div v-if="loading" class="flex justify-center py-4">
          <Loader2 class="w-6 h-6 animate-spin text-primary-500" />
        </div>
        <div v-else-if="patients.length === 0" class="text-center py-4 text-gray-500">
          Aucun patient trouvé
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="patient in patients"
            :key="patient._id"
            @click="selectPatient(patient)"
            class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <div class="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <span>
                {{ getUserFullName(patient) }}
              </span>
              <span v-if="!patient.utilisateur" class="text-xs text-yellow-500 bg-yellow-100 px-2 py-0.5 rounded">
                Données utilisateur manquantes
              </span>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <div class="grid grid-cols-2 gap-2">
                <div>ID Patient: {{ patient._id }}</div>
                <div v-if="patient.utilisateur_id">ID Utilisateur: {{ patient.utilisateur_id }}</div>
              </div>
              <div v-if="patient.utilisateur?.dateNaissance">
                Date de naissance: {{ formatDate(patient.utilisateur.dateNaissance) }}
              </div>
              <div v-if="patient.utilisateur?.telephone">
                Tél: {{ patient.utilisateur.telephone }}
              </div>
              <div v-if="patient.utilisateur?.email" class="truncate">
                Email: {{ patient.utilisateur.email }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import { Search, Loader2 } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import { usePatientStore } from '@/stores/patientStore'

const patientStore = usePatientStore()
const searchQuery = ref('')
const patients = ref([])
const loading = ref(false)

const emit = defineEmits(['close', 'select'])

function getUserFullName(patient) {
  if (!patient) return 'Patient inconnu';
  
  // Convertir le Proxy en objet simple si nécessaire
  const patientData = JSON.parse(JSON.stringify(patient));
  console.log('Patient data dans getUserFullName:', patientData);
  
  if (patientData.utilisateur) {
    const nom = patientData.utilisateur.nom || '';
    const prenom = patientData.utilisateur.prenom || '';
    if (nom || prenom) {
      return `${nom} ${prenom}`.trim();
    }
  }
  
  return 'Patient sans nom';
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

async function performSearch() {
  if (searchQuery.value.length < 2) {
    patients.value = []
    return
  }
  
  loading.value = true
  try {
    const results = await patientStore.searchPatients(searchQuery.value)
    console.log('Résultats de recherche dans le modal:', results)
    
    // Vérifier que chaque patient a des données utilisateur
    results.forEach(patient => {
      const patientData = JSON.parse(JSON.stringify(patient));
      console.log('Données complètes du patient:', patientData);
    });
    
    patients.value = results;
  } catch (error) {
    console.error('Erreur lors de la recherche:', error)
    patients.value = []
  } finally {
    loading.value = false
  }
}

function selectPatient(patient) {
  // Convertir le Proxy en objet simple
  const patientData = JSON.parse(JSON.stringify(patient));
  console.log('Patient complet sélectionné:', patientData);
  
  const formattedData = {
    _id: patientData._id,
    utilisateur_id: patientData.utilisateur_id,
    nom: patientData.utilisateur?.nom || '',
    prenom: patientData.utilisateur?.prenom || '',
    dateNaissance: patientData.utilisateur?.dateNaissance,
    telephone: patientData.utilisateur?.telephone,
    email: patientData.utilisateur?.email,
    // Données médicales
    taille: patientData.taille,
    poids: patientData.poids,
    groupeSanguin: patientData.groupeSanguin,
    // Ajouter les informations du dossier médical
    dossier_medical: patientData.dossier_medical || null
  }
  
  console.log('Données du patient formatées:', formattedData);
  emit('select', formattedData);
  emit('close');
}
</script>
