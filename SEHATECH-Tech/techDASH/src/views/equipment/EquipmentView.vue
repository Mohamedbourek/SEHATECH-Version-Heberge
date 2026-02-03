<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Gestion des équipements
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Gérez et surveillez tous vos équipements biomédicaux
      </p>
    </div>

    <EquipmentDashboard />
  </div>
</template>

<script setup>
import EquipmentDashboard from '@/components/equipment/EquipmentDashboard.vue'
</script> 