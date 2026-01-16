<template>
  <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
    <div class="relative">
      <!-- Bandeau d'urgence en fonction du niveau -->
      <div 
        :class="[
          'absolute top-0 left-0 right-0 h-2',
          { 
            'bg-red-500': request.niveauUrgence === 'haute', 
            'bg-yellow-500': request.niveauUrgence === 'moyenne', 
            'bg-blue-500': request.niveauUrgence === 'basse',
            'bg-gray-500': !request.niveauUrgence
          }
        ]"
      ></div>
      
      <!-- Badge nouveau -->
      <div v-if="request.isNew" class="absolute top-3 right-3">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Nouveau
        </span>
      </div>
      
      <div class="p-5 mt-2">
        <!-- En-tête avec nom du patient -->
        <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <User class="h-5 w-5 text-gray-400 mr-2" />
          {{ patientName }}
        </h3>
        
        <!-- Date de la demande -->
        <div class="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Calendar class="h-4 w-4 mr-1" />
          <span>Demande du {{ formatDate(request.created_at) }}</span>
        </div>
        
        <!-- Médecin demandeur -->
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Stethoscope class="h-4 w-4 text-gray-400 mr-2" />
            Médecin demandeur
          </h4>
          <p class="mt-1 text-gray-600 dark:text-gray-400">Dr. {{ medecinName }}</p>
          <p v-if="medecinSpecialite" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ medecinSpecialite }}
          </p>
        </div>
        
        <!-- Motif d'hospitalisation -->
        <div class="mt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Motif</h4>
          <p class="mt-1 text-gray-600 dark:text-gray-400">{{ request.motif }}</p>
        </div>
        
        <!-- Date souhaitée et niveau d'urgence -->
        <div class="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Date souhaitée</h4>
            <p class="mt-1 text-gray-600 dark:text-gray-400">{{ formatDate(request.dateDebut) }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Niveau d'urgence</h4>
            <p class="mt-1 flex items-center">
              <span 
                :class="[
                  'inline-block w-2 h-2 rounded-full mr-2',
                  { 
                    'bg-red-500': request.niveauUrgence === 'haute', 
                    'bg-yellow-500': request.niveauUrgence === 'moyenne', 
                    'bg-blue-500': request.niveauUrgence === 'basse',
                    'bg-gray-500': !request.niveauUrgence
                  }
                ]"
              ></span>
              <span class="text-gray-600 dark:text-gray-400">
                {{ urgenceLevelText }}
              </span>
            </p>
          </div>
        </div>
        
        <!-- Informations patient -->
        <div class="mt-4 border-t border-gray-100 dark:border-gray-600 pt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Informations patient</h4>
          <div class="mt-2 space-y-1 text-sm">
            <p v-if="patientAge" class="text-gray-600 dark:text-gray-400">
              <span class="font-medium">Âge:</span> {{ patientAge }} ans
            </p>
            <p v-if="patientContact" class="text-gray-600 dark:text-gray-400">
              <span class="font-medium">Contact:</span> {{ patientContact }}
            </p>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="mt-6 flex justify-end space-x-3">
          
          <button 
            @click="$emit('approve', request)"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 rounded-md dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/40 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <CheckCircle class="w-4 h-4 mr-1" />
            Approuver
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { User, Calendar, CheckCircle, XCircle, Stethoscope } from 'lucide-vue-next'

// Props avec des valeurs par défaut pour gérer les états de chargement
const props = defineProps({
  request: {
    type: Object,
    required: true
  },
  patientName: {
    type: String,
    default: 'Chargement...'
  },
  patientAge: {
    type: [String, Number],
    default: '...'
  },
  patientContact: {
    type: String,
    default: 'Chargement...'
  },
  medecinName: {
    type: String,
    default: 'Chargement...'
  },
  medecinSpecialite: {
    type: String,
    default: ''
  }
})

// Format de la date en français
const formatDate = (dateString) => {
  if (!dateString) return 'Non spécifiée'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Texte du niveau d'urgence
const urgenceLevelText = computed(() => {
  switch (props.request.niveauUrgence) {
    case 'haute':
      return 'Haute'
    case 'moyenne':
      return 'Moyenne'
    case 'basse':
      return 'Basse'
    default:
      return 'Normal'
  }
})

defineEmits(['approve', 'reject'])
</script> 