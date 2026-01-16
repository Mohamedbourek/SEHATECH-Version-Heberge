<template>
  <div class="surgery-calendar">

    <Modal v-if="selectedSurgery" @close="selectedSurgery = null">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Détails de l'intervention
        </h3>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Patient</h4>
            <p class="mt-1 text-gray-900 dark:text-white">
              {{ selectedSurgery.dossier?.patient?.utilisateur?.nom }} 
              {{ selectedSurgery.dossier?.patient?.utilisateur?.prenom }}
            </p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Type d'intervention</h4>
            <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSurgery.type }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Salle</h4>
            <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSurgery.numerosalle }}</p>
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</h4>
            <p class="mt-1 text-gray-900 dark:text-white">{{ selectedSurgery.statut }}</p>
          </div>
        </div>

        <div v-if="selectedSurgery.notes">
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h4>
          <p class="mt-1 text-gray-900 dark:text-white whitespace-pre-line">{{ selectedSurgery.notes }}</p>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="btn btn-primary"
          @click="selectedSurgery = null"
        >
          Fermer
        </button>
      </template>
    </Modal>

    <div v-if="isLoading" class="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>
    <FullCalendar
      :options="calendarOptions"
      class="surgery-calendar-content"
    />
  </div>
</template>

<script setup>
// Add isLoading to the imports
import { computed, onMounted, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import { useSurgeryStore } from '@/stores/surgery'
// Update the import to use only date-fns
import { addMinutes, parseISO } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'

const emit = defineEmits(['event-click', 'date-select'])

const surgeryStore = useSurgeryStore()
const surgeries = ref([])
const selectedSurgery = ref(null)
const isLoading = ref(false)

// Update the onMounted function
onMounted(async () => {
  isLoading.value = true
  try {
    await surgeryStore.fetchSurgeries()
    surgeries.value = surgeryStore.surgeries
  } finally {
    isLoading.value = false
  }
})

// Add watcher for surgery store changes
watch(() => surgeryStore.surgeries, async () => {
  isLoading.value = true
  try {
    surgeries.value = surgeryStore.surgeries
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 500) // Add small delay for better UX
  }
}, { deep: true })

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  locale: frLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: surgeries.value.map(surgery => {
    const startDate = parseISO(surgery.date)
    const localStartDate = new Date(startDate.getTime() + (startDate.getTimezoneOffset() * 60000)) // Changed minus to plus
    const endDate = addMinutes(localStartDate, surgery.duration || 30)
    
    return {
      id: surgery._id,
      title: `${surgery.type} - ${surgery.dossier?.patient?.utilisateur?.nom} ${surgery.dossier?.patient?.utilisateur?.prenom}`,
      start: localStartDate.toISOString(),
      end: endDate.toISOString(),
      extendedProps: {
        ...surgery,
        patientName: `${surgery.dossier?.patient?.utilisateur?.nom} ${surgery.dossier?.patient?.utilisateur?.prenom}`,
        salle: surgery.numerosalle
      }
    }
  }),
  eventClick: (info) => {
    selectedSurgery.value = info.event.extendedProps
  },
  selectable: true,
  select: (info) => {
    emit('date-select', info.start)
  },
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  allDaySlot: false,
  slotDuration: '00:15:00',
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '18:00',
  },
  timeZone: 'local', // Add this to ensure proper timezone handling
}))
</script>

<style scoped>
.surgery-calendar {
  @apply h-[600px] relative; /* Add relative positioning */
}

.surgery-calendar-content {
  @apply h-full;
}

:deep(.fc) {
  @apply h-full font-sans;
}

:deep(.fc-event) {
  @apply cursor-pointer;
}

:deep(.fc-toolbar-title) {
  @apply text-lg font-medium;
}

:deep(.fc-button) {
  @apply bg-primary-600 border-primary-600 hover:bg-primary-700 
         hover:border-primary-700 focus:ring-primary-500;
}
</style>