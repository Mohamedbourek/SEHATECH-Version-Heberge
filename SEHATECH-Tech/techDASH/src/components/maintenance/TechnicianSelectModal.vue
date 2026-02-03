<template>
  <BaseModal
    title="Sélectionner un technicien"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Barre de recherche -->
      <div class="relative">
        <input
          v-model="search"
          type="text"
          class="form-input pl-10"
          placeholder="Rechercher un technicien..."
        />
        <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      <!-- Liste des techniciens -->
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div 
          v-for="tech in filteredTechnicians" 
          :key="tech.id"
          class="technician-item"
          :class="{ 'selected': isSelected(tech.id) }"
          @click="selectTechnician(tech)"
        >
          <div class="flex items-center space-x-3">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <img 
                :src="tech.avatar || '/default-avatar.svg'" 
                :alt="tech.name"
                class="w-10 h-10 rounded-full"
              />
            </div>

            <!-- Informations -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ tech.name }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ tech.specialization }}
              </p>
            </div>

            <!-- Statut de disponibilité -->
            <div class="flex-shrink-0">
              <span 
                class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                :class="availabilityClasses[tech.availability]"
              >
                {{ availabilityLabels[tech.availability] }}
              </span>
            </div>
          </div>

          <!-- Compétences -->
          <div class="mt-2 flex flex-wrap gap-2">
            <span 
              v-for="skill in tech.skills" 
              :key="skill"
              class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                     bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </div>

      <!-- Message si aucun résultat -->
      <div 
        v-if="filteredTechnicians.length === 0"
        class="text-center py-4 text-gray-500 dark:text-gray-400"
      >
        Aucun technicien trouvé
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  selectedIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'select'])

const search = ref('')

// Simuler des données de techniciens (à remplacer par des vraies données)
const technicians = ref([
  {
    id: 1,
    name: 'Jean Dupont',
    specialization: 'Équipements de radiologie',
    availability: 'available',
    skills: ['Radiologie', 'Maintenance préventive', 'Calibration'],
    avatar: null
  },
  {
    id: 2,
    name: 'Marie Martin',
    specialization: 'Équipements de laboratoire',
    availability: 'busy',
    skills: ['Analyses médicales', 'Maintenance corrective', 'Formation'],
    avatar: null
  }
  // Ajouter d'autres techniciens...
])

const availabilityLabels = {
  available: 'Disponible',
  busy: 'Occupé',
  unavailable: 'Indisponible'
}

const availabilityClasses = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  busy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  unavailable: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

const filteredTechnicians = computed(() => {
  if (!search.value) return technicians.value

  const searchLower = search.value.toLowerCase()
  return technicians.value.filter(tech => 
    tech.name.toLowerCase().includes(searchLower) ||
    tech.specialization.toLowerCase().includes(searchLower) ||
    tech.skills.some(skill => skill.toLowerCase().includes(searchLower))
  )
})

const isSelected = (techId) => {
  return props.selectedIds.includes(techId)
}

const selectTechnician = (technician) => {
  if (!isSelected(technician.id)) {
    emit('select', technician)
  }
}
</script>

<style scoped>
.technician-item {
  @apply p-4 rounded-lg border border-gray-200 dark:border-gray-700
         hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer
         transition-colors duration-200;
}

.technician-item.selected {
  @apply bg-primary-50 border-primary-500
         dark:bg-primary-900/50 dark:border-primary-500;
}
</style> 