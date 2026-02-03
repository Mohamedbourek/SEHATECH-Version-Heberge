<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <NavBar v-if="showNavBar" />
    <main :class="{ 'ml-64': showNavBar }" class="transition-all duration-200">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()

const showNavBar = computed(() => {
  const noNavBarRoutes = ['/login', '/register', '/forgot-password']
  return !noNavBarRoutes.includes(route.path)
})
</script> 