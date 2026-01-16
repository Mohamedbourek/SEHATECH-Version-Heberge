<template>
  <tr class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150" 
      :class="{ 'bg-blue-50 dark:bg-blue-900/20': request.isNew }">
    <!-- Status -->
    <td class="w-4 px-4 py-2">
      <div 
        :class="[
          'w-3 h-3 rounded-full',
          { 
            'bg-red-500': request.niveauUrgence === 'haute', 
            'bg-yellow-500': request.niveauUrgence === 'moyenne', 
            'bg-blue-500': request.niveauUrgence === 'basse',
            'bg-gray-500': !request.niveauUrgence
          }
        ]"
        :title="urgenceLevelText"
      ></div>
    </td>
    
    <!-- Date de création -->
    <td class="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
      {{ formatDate(request.created_at) }}
      <span v-if="request.isNew" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        Nouveau
      </span>
    </td>
    
    <!-- Patient -->
    <td class="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
      {{ patientName }}
    </td>
    
    <!-- Médecin demandeur -->
    <td class="px-4 py-2 text-gray-700 dark:text-gray-300">
      Dr. {{ medecinName }}
      <span v-if="medecinSpecialite" class="block text-xs text-gray-500 dark:text-gray-400">
        {{ medecinSpecialite }}
      </span>
    </td>
    
    <!-- Motif -->
    <td class="px-4 py-2 text-gray-700 dark:text-gray-300 max-w-xs truncate">
      {{ request.motif }}
    </td>
    
    <!-- Date souhaitée -->
    <td class="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
      {{ formatDate(request.dateDebut) }}
    </td>
    
    <!-- Actions -->
    <td class="px-4 py-2 text-right">
      <div class="flex justify-end space-x-2">
        <button
          @click="$emit('reject', request)"
          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
          title="Rejeter"
        >
          <XCircle class="w-5 h-5" />
        </button>
        <button
          @click="$emit('approve', request)"
          class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
          title="Approuver"
        >
          <CheckCircle class="w-5 h-5" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'

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
      return 'Urgence: Haute'
    case 'moyenne':
      return 'Urgence: Moyenne'
    case 'basse':
      return 'Urgence: Basse'
    default:
      return 'Urgence: Normale'
  }
})

defineEmits(['approve', 'reject'])
</script> 