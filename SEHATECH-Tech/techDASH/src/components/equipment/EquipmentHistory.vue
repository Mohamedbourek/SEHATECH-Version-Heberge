<template>
  <div class="space-y-6">
    <!-- En-tête avec filtres -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex flex-wrap gap-4">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            class="form-input pl-10"
            placeholder="Rechercher..."
          />
          <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select v-model="eventType" class="form-select w-48">
          <option value="all">Tous les événements</option>
          <option value="maintenance">Maintenance</option>
          <option value="incident">Incident</option>
          <option value="calibration">Calibration</option>
          <option value="configuration">Configuration</option>
        </select>
        <DateRangePicker 
          v-model="dateRange"
          class="w-72"
        />
      </div>
      <button 
        class="btn btn-outline"
        @click="exportHistory"
      >
        <FileDown class="w-4 h-4 mr-2" />
        Exporter l'historique
      </button>
    </div>

    <!-- Timeline des événements -->
    <div class="relative">
      <!-- Ligne verticale -->
      <div class="absolute left-16 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>

      <!-- Liste des événements -->
      <div class="space-y-6">
        <div 
          v-for="event in filteredEvents" 
          :key="event.id"
          class="relative pl-32"
        >
          <!-- Marqueur et date -->
          <div class="absolute left-0 top-0 flex items-center">
            <div class="text-sm text-gray-500 w-24 text-right">
              {{ formatDate(event.date) }}
            </div>
            <div 
              class="ml-4 w-8 h-8 rounded-full flex items-center justify-center"
              :class="eventTypeClasses[event.type].bg"
            >
              <component 
                :is="eventTypeClasses[event.type].icon"
                class="w-4 h-4"
                :class="eventTypeClasses[event.type].iconColor"
              />
            </div>
          </div>

          <!-- Contenu de l'événement -->
          <div 
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            :class="{ 'border-l-4': event.priority }"
            :style="event.priority ? `border-color: ${getPriorityColor(event.priority)}` : ''"
          >
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ event.title }}
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  {{ event.description }}
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <span 
                  v-if="event.duration"
                  class="text-sm text-gray-500"
                >
                  {{ formatDuration(event.duration) }}
                </span>
                <span 
                  v-if="event.priority"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getPriorityClasses(event.priority)"
                >
                  {{ priorityLabels[event.priority] }}
                </span>
              </div>
            </div>

            <!-- Détails supplémentaires -->
            <div class="mt-4 space-y-4">
              <!-- Techniciens -->
              <div v-if="event.technicians?.length" class="flex items-center space-x-2">
                <Users class="w-4 h-4 text-gray-400" />
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="tech in event.technicians" 
                    :key="tech.id"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs
                           bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {{ tech.name }}
                  </span>
                </div>
              </div>

              <!-- Pièces utilisées -->
              <div v-if="event.parts?.length" class="space-y-2">
                <div class="flex items-center text-sm text-gray-500">
                  <Tool class="w-4 h-4 mr-2" />
                  Pièces utilisées
                </div>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="part in event.parts" 
                    :key="part.reference"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs
                           bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {{ part.name }} ({{ part.quantity }})
                  </span>
                </div>
              </div>

              <!-- Documents -->
              <div v-if="event.documents?.length" class="space-y-2">
                <div class="flex items-center text-sm text-gray-500">
                  <File class="w-4 h-4 mr-2" />
                  Documents
                </div>
                <div class="flex flex-wrap gap-2">
                  <a 
                    v-for="doc in event.documents" 
                    :key="doc.id"
                    :href="doc.url"
                    target="_blank"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs
                           text-primary-600 hover:text-primary-700
                           dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <FileText class="w-4 h-4 mr-1" />
                    {{ doc.name }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex justify-end space-x-3">
              <button 
                v-if="event.type === 'maintenance'"
                class="btn btn-outline btn-sm"
                @click="viewReport(event.id)"
              >
                <FileText class="w-4 h-4 mr-2" />
                Voir le rapport
              </button>
              <button 
                class="btn btn-ghost btn-sm"
                @click="viewDetails(event.id)"
              >
                Plus de détails
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucun événement -->
    <div 
      v-if="filteredEvents.length === 0"
      class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg"
    >
      <div class="flex justify-center">
        <History class="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        Aucun événement trouvé
      </h3>
      <p class="mt-2 text-gray-500">
        Essayez de modifier vos critères de recherche
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Search, FileDown, Tool, Users, File, FileText,
  History, Wrench, AlertTriangle, Settings, Gauge
} from 'lucide-vue-next'
import DateRangePicker from '@/components/common/DateRangePicker.vue'

const props = defineProps({
  events: {
    type: Array,
    required: true
  }
})

// États
const search = ref('')
const eventType = ref('all')
const dateRange = ref({
  start: null,
  end: null
})

// Classes et labels pour les types d'événements
const eventTypeClasses = {
  maintenance: {
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    icon: Wrench,
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  incident: {
    bg: 'bg-red-100 dark:bg-red-900/50',
    icon: AlertTriangle,
    iconColor: 'text-red-600 dark:text-red-400'
  },
  calibration: {
    bg: 'bg-purple-100 dark:bg-purple-900/50',
    icon: Gauge,
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  configuration: {
    bg: 'bg-gray-100 dark:bg-gray-900/50',
    icon: Settings,
    iconColor: 'text-gray-600 dark:text-gray-400'
  }
}

const priorityLabels = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse'
}

// Filtrage des événements
const filteredEvents = computed(() => {
  return props.events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(search.value.toLowerCase()) ||
                         event.description.toLowerCase().includes(search.value.toLowerCase())
    const matchesType = eventType.value === 'all' || event.type === eventType.value
    const matchesDate = isWithinDateRange(event.date)
    return matchesSearch && matchesType && matchesDate
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Fonctions utilitaires
function formatDate(date) {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h${mins.toString().padStart(2, '0')}`
}

function getPriorityColor(priority) {
  return {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981'
  }[priority]
}

function getPriorityClasses(priority) {
  return {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }[priority]
}

function isWithinDateRange(date) {
  if (!dateRange.value.start || !dateRange.value.end) return true
  const eventDate = new Date(date)
  return eventDate >= dateRange.value.start && eventDate <= dateRange.value.end
}

// Actions
function exportHistory() {
  // Implémenter l'export
  console.log('Exporting history...')
}

function viewReport(eventId) {
  // Implémenter l'affichage du rapport
  console.log('Viewing report:', eventId)
}

function viewDetails(eventId) {
  // Implémenter l'affichage des détails
  console.log('Viewing details:', eventId)
}
</script>

<style scoped>
.form-input {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600
         shadow-sm focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:text-white;
}

.form-select {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600
         shadow-sm focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:text-white;
}
</style> 