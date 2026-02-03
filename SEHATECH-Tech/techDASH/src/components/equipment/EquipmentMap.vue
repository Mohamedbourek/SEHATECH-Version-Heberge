<template>
  <div class="relative bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden">
 
    <!-- Carte schématique -->
    <div class="p-6">
      <div 
        v-if="currentFloor === 'all'"
        class="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div 
          v-for="floor in floors" 
          :key="floor"
          class="bg-white dark:bg-gray-800 rounded-lg p-4"
        >
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {{ floor }}e étage
          </h3>
          <div class="grid grid-cols-4 gap-2">
            <div 
              v-for="equipment in getEquipmentsByFloor(floor)"
              :key="equipment.id"
              class="relative group cursor-pointer"
              @click="$emit('equipment-click', equipment.id)"
            >
              <div 
                class="w-4 h-4 rounded-full"
                :class="getStatusColor(equipment.status)"
              ></div>
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32
                          bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0
                          group-hover:opacity-100 transition-opacity duration-200 text-center">
                {{ equipment.type }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div class="grid grid-cols-6 gap-4">
          <div 
            v-for="(room, index) in getRoomsByFloor(currentFloor)"
            :key="index"
            class="aspect-square border border-gray-200 dark:border-gray-700 rounded-lg p-2
                   relative flex items-center justify-center"
          >
            <span class="absolute top-1 left-1 text-xs text-gray-500">
              {{ room.name }}
            </span>
            <div class="grid grid-cols-2 gap-1">
              <div 
                v-for="equipment in room.equipments"
                :key="equipment.id"
                class="relative group cursor-pointer"
                @click="$emit('equipment-click', equipment.id)"
              >
                <div 
                  class="w-3 h-3 rounded-full"
                  :class="getStatusColor(equipment.status)"
                ></div>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32
                            bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0
                            group-hover:opacity-100 transition-opacity duration-200 text-center
                            z-10">
                  {{ equipment.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Légende -->
    <div class="absolute bottom-4 left-4 flex items-center space-x-4">
      <div 
        v-for="status in equipmentStatuses" 
        :key="status.value"
        class="flex items-center space-x-2"
      >
        <div 
          class="w-3 h-3 rounded-full"
          :class="getStatusColor(status.value)"
        ></div>
        <span class="text-xs text-gray-600 dark:text-gray-400">
          {{ status.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  floor: {
    type: [String, Number],
    default: 'all'
  },
  equipments: {
    type: Array,
    required: true
  }
})

const currentFloor = ref(props.floor)

// Watch for changes in the floor prop
watch(() => props.floor, (newFloor) => {
  currentFloor.value = newFloor
})

// Configuration
const floors = computed(() => {
  const floorSet = new Set()
  
  props.equipments.forEach(equipment => {
    // Extract floor information from various possible properties
    const floor = equipment.floor || 
                 (equipment.chambre && typeof equipment.chambre === 'object' ? 
                   equipment.chambre.etage : equipment.etage) || 
                 (equipment.room_number ? parseInt(equipment.room_number.substring(0, 1)) : null)
    
    if (floor && !isNaN(parseInt(floor))) {
      floorSet.add(parseInt(floor))
    }
  })
  
  // Convert Set to Array and sort numerically
  return Array.from(floorSet).sort((a, b) => a - b)
})
const equipmentStatuses = [
  { value: 'operational', label: 'Opérationnel' },
  { value: 'maintenance', label: 'En maintenance' },
  { value: 'error', label: 'En panne' }
]

// Computed property to get unique rooms from equipment data
const roomsData = computed(() => {
  const roomsMap = new Map()
  console.log('Processing equipment data for rooms:', props.equipments);
  
  props.equipments.forEach(equipment => {
    // Extract room information from equipment
    const roomNumber = equipment.room_number || 
                       (equipment.chambre && (typeof equipment.chambre === 'object' ? 
                         equipment.chambre.numero : equipment.chambre))
    
    const floor = equipment.floor || 
                  (equipment.chambre && (typeof equipment.chambre === 'object' ? 
                    equipment.chambre.etage : equipment.etage)) || 
                  (roomNumber && roomNumber.toString().length > 0 ? 
                    parseInt(roomNumber.toString().substring(0, 1)) : null)
    
    const roomType = equipment.room_type || 
                     (equipment.chambre && typeof equipment.chambre === 'object' ? 
                       equipment.chambre.type : 'standard')
    
    console.log(`Equipment ${equipment.name || equipment.id}: Room=${roomNumber}, Floor=${floor}`);
    
    if (floor && roomNumber) {
      const key = `${floor}-${roomNumber}`
      
      if (!roomsMap.has(key)) {
        roomsMap.set(key, {
          name: roomNumber,
          floor: parseInt(floor),
          type: roomType,
          equipments: []
        })
      }
      
      roomsMap.get(key).equipments.push({
        ...equipment,
        id: equipment._id || equipment.id || equipment.resource_id,
        name: equipment.name || equipment.type || equipment.resource_type || 'Équipement',
        status: equipment.status || equipment.etat || equipment.resource_state || 'unknown'
      })
    }
  })
  
  const result = Array.from(roomsMap.values());
  console.log('Generated room data:', result);
  return result;
})

// Méthodes
function getStatusColor(status) {
  return {
    operational: 'bg-green-500',
    Fonctionnel: 'bg-green-500',
    'En maintenance': 'bg-yellow-500',
    maintenance: 'bg-yellow-500',
    'Hors service': 'bg-red-500',
    'En panne': 'bg-red-500',
    unknown: 'bg-gray-500'
  }[status] || 'bg-gray-500'
}

function getEquipmentsByFloor(floor) {
  return props.equipments.filter(e => {
    // Check different possible floor properties
    const equipmentFloor = e.floor || 
                          (e.chambre && typeof e.chambre === 'object' ? 
                            e.chambre.etage : e.etage) || 
                          (e.room_number ? parseInt(e.room_number.substring(0, 1)) : null)
    
    // Convert both values to numbers for comparison
    const floorNum = parseInt(floor);
    const equipmentFloorNum = parseInt(equipmentFloor);
    
    // Debug to console
    console.log(`Equipment: ${e.name || e.id}, Floor: ${equipmentFloorNum}, Selected: ${floorNum}, Match: ${equipmentFloorNum === floorNum}`);
    
    return equipmentFloorNum === floorNum;
  })
}

function getRoomsByFloor(floor) {
  // Convert floor to number for consistent comparison
  const floorNum = parseInt(floor);
  
  // Debug rooms data
  console.log('All rooms:', roomsData.value);
  
  // Filter rooms by floor
  const filteredRooms = roomsData.value.filter(room => {
    const roomFloor = parseInt(room.floor); // Changed from room.etage to room.floor
    console.log(`Room: ${room.name}, Floor: ${roomFloor}, Selected: ${floorNum}, Match: ${roomFloor === floorNum}`);
    return roomFloor === floorNum;
  });
  
  console.log(`Found ${filteredRooms.length} rooms for floor ${floorNum}`);
  return filteredRooms;
}

defineEmits(['equipment-click'])
</script>