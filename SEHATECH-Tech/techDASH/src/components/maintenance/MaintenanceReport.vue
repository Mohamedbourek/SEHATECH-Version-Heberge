<template>
  <div class="space-y-6">
    <!-- En-tête du rapport -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Rapport d'intervention
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          {{ formatDate(report.date) }}
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          class="btn btn-outline"
          @click="printReport"
        >
          <Printer class="w-4 h-4 mr-2" />
          Imprimer
        </button>
        <button 
          class="btn btn-primary"
          @click="exportPDF"
        >
          <FileDown class="w-4 h-4 mr-2" />
          Exporter PDF
        </button>
      </div>
    </div>

    <!-- Informations de l'intervention -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Équipement -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Équipement</h3>
        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <component 
              :is="report.equipment.icon || 'Monitor'"
              class="w-5 h-5 text-gray-400 mt-1"
            />
            <div>
              <p class="font-medium">{{ report.equipment.name }}</p>
              <p class="text-sm text-gray-500">
                Modèle: {{ report.equipment.model }}
              </p>
              <p class="text-sm text-gray-500">
                N° Série: {{ report.equipment.serialNumber }}
              </p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <MapPin class="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p class="font-medium">{{ report.equipment.location }}</p>
              <p class="text-sm text-gray-500">
                Service: {{ report.equipment.department }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Intervention -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Intervention</h3>
        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <Tool class="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p class="font-medium">{{ report.type }}</p>
              <p class="text-sm text-gray-500">
                Durée: {{ formatDuration(report.duration) }}
              </p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <Users class="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p class="font-medium">Techniciens</p>
              <div class="mt-1 flex flex-wrap gap-2">
                <span 
                  v-for="tech in report.technicians" 
                  :key="tech.id"
                  class="inline-flex items-center px-2 py-1 rounded-md text-xs
                         bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  {{ tech.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Détails de l'intervention -->
    <div class="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <!-- Description -->
      <div>
        <h3 class="text-lg font-medium mb-4">Description de l'intervention</h3>
        <p class="text-gray-600 dark:text-gray-400 whitespace-pre-line">
          {{ report.description }}
        </p>
      </div>

      <!-- Actions réalisées -->
      <div>
        <h3 class="text-lg font-medium mb-4">Actions réalisées</h3>
        <ul class="space-y-3">
          <li 
            v-for="(action, index) in report.actions" 
            :key="index"
            class="flex items-start"
          >
            <CheckCircle2 class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <span class="text-gray-600 dark:text-gray-400">
              {{ action }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Pièces utilisées -->
      <div v-if="report.parts?.length">
        <h3 class="text-lg font-medium mb-4">Pièces utilisées</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th class="table-header">Référence</th>
                <th class="table-header">Désignation</th>
                <th class="table-header">Quantité</th>
                <th class="table-header">Lot</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr 
                v-for="part in report.parts" 
                :key="part.reference"
                class="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="table-cell font-medium">{{ part.reference }}</td>
                <td class="table-cell">{{ part.name }}</td>
                <td class="table-cell">{{ part.quantity }}</td>
                <td class="table-cell">{{ part.batch || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mesures et tests -->
      <div v-if="report.measurements?.length">
        <h3 class="text-lg font-medium mb-4">Mesures et tests</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="measure in report.measurements" 
            :key="measure.name"
            class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4"
          >
            <p class="text-sm text-gray-500 mb-1">{{ measure.name }}</p>
            <div class="flex items-baseline space-x-2">
              <span class="text-xl font-semibold">
                {{ measure.value }}
              </span>
              <span class="text-sm text-gray-500">
                {{ measure.unit }}
              </span>
            </div>
            <p 
              class="mt-1 text-sm"
              :class="getMeasureStatusColor(measure.status)"
            >
              {{ measure.status }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Signature -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Technicien</h3>
        <div class="space-y-2">
          <p class="text-sm text-gray-500">
            Nom: {{ report.signature.technician.name }}
          </p>
          <p class="text-sm text-gray-500">
            Date: {{ formatDate(report.signature.technician.date) }}
          </p>
          <img 
            :src="report.signature.technician.signature" 
            alt="Signature technicien"
            class="mt-2 h-16"
          />
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Client</h3>
        <div class="space-y-2">
          <p class="text-sm text-gray-500">
            Nom: {{ report.signature.client.name }}
          </p>
          <p class="text-sm text-gray-500">
            Date: {{ formatDate(report.signature.client.date) }}
          </p>
          <img 
            :src="report.signature.client.signature" 
            alt="Signature client"
            class="mt-2 h-16"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Printer, FileDown, Monitor, MapPin, Tool, Users,
  CheckCircle2
} from 'lucide-vue-next'

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
})

function formatDate(date) {
  return format(new Date(date), 'PPP', { locale: fr })
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h${mins.toString().padStart(2, '0')}`
}

function getMeasureStatusColor(status) {
  return {
    'normal': 'text-green-600 dark:text-green-400',
    'warning': 'text-yellow-600 dark:text-yellow-400',
    'error': 'text-red-600 dark:text-red-400'
  }[status] || 'text-gray-600 dark:text-gray-400'
}

function printReport() {
  window.print()
}

async function exportPDF() {
  // Implémenter l'export PDF
  console.log('Exporting PDF...')
}
</script>

<style scoped>
.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 
         uppercase tracking-wider;
}

.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 
         dark:text-gray-100;
}

@media print {
  .btn {
    display: none;
  }
}
</style> 