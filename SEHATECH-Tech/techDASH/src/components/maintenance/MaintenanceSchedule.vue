<template>
  <div class="space-y-4">
    <!-- Filtres -->
    <div class="flex items-center space-x-4">
      <div class="flex-1">
        <input
          v-model="search"
          type="text"
          class="form-input"
          placeholder="Rechercher un équipement..."
        />
      </div>
      <select v-model="filterStatus" class="form-select w-40">
        <option value="all">Tous</option>
        <option value="Planifiée">À venir</option>
        <option value="En_cours">En cours</option>
        <option value="Terminée">Terminé</option>
      </select>
    </div>

    <!-- Liste des maintenances -->
    <div class="space-y-3">
      <div 
        v-for="task in filteredTasks" 
        :key="task.id"
        class="maintenance-task"
      >
        <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div class="flex items-start space-x-4">
            <!-- Icône du type de maintenance -->
            <div 
              class="p-2 rounded-lg"
              :class="typeClasses[task.type]"
            >
              <component 
                :is="typeIcons[task.type]"
                class="w-5 h-5"
                :class="typeIconClasses[task.type]"
              />
            </div>

            <!-- Informations -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ task.equipment }}
              </h4>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ task.description }}
              </p>
              <div class="mt-2 flex items-center text-xs text-gray-500">
                <Calendar class="w-4 h-4 mr-1" />
                {{ formatDate(task.scheduledDate) }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2">
            <span 
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="statusClasses[task.status]"
            >
              {{ task.status }}
            </span>
            <button 
              v-if="task.status === 'pending'"
              class="btn btn-primary btn-sm"
              @click="$emit('start', task.id)"
            >
              Démarrer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Tool, Wrench, Calendar, RotateCw } from 'lucide-vue-next'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

const search = ref('')
const filterStatus = ref('all')

// Classes et icônes pour les types de maintenance
const typeClasses = {
  preventive: 'bg-blue-100 dark:bg-blue-900/50',
  corrective: 'bg-yellow-100 dark:bg-yellow-900/50',
  calibration: 'bg-purple-100 dark:bg-purple-900/50'
}

const typeIcons = {
  preventive: Tool,
  corrective: Wrench,
  calibration: RotateCw
}

const typeIconClasses = {
  preventive: 'text-blue-600 dark:text-blue-400',
  corrective: 'text-yellow-600 dark:text-yellow-400',
  calibration: 'text-purple-600 dark:text-purple-400'
}

// Classes pour les statuts
const statusClasses = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
}

// Filtrage des tâches
const filteredTasks = computed(() => {
  return props.tasks.filter(task => {
    const matchesSearch = task.equipment.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = filterStatus.value === 'all' || task.status === filterStatus.value
    return matchesSearch && matchesStatus
  })
})

const formatDate = (date) => {
  return format(new Date(date), 'PPp', { locale: fr })
}

defineEmits(['start'])
</script>

<style scoped>
.maintenance-task {
  @apply transition-all duration-200 hover:shadow-md;
}

.btn-sm {
  @apply px-3 py-1 text-xs;
}
</style> 