<template>
  <div class="fixed bottom-4 right-4 z-50">
    <TransitionGroup 
      name="notifications" 
      tag="div"
      class="space-y-2"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification',
          `notification-${notification.type}`
        ]"
      >
        <div class="flex items-center">
          <CheckCircle v-if="notification.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-if="notification.type === 'error'" class="w-5 h-5 mr-2" />
          <span>{{ notification.message }}</span>
        </div>
        <button 
          @click="removeNotification(notification.id)"
          class="ml-4 text-gray-500 hover:text-gray-700"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { CheckCircle, AlertCircle, X } from 'lucide-vue-next'
import { useNotification } from '@/composables/useNotification'

const { notifications, removeNotification } = useNotification()
</script>

<style scoped>
.notification {
  @apply flex items-center justify-between px-4 py-3 rounded-lg shadow-lg;
}

.notification-success {
  @apply bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100;
}

.notification-error {
  @apply bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100;
}

.notifications-enter-active,
.notifications-leave-active {
  @apply transition-all duration-300;
}

.notifications-enter-from,
.notifications-leave-to {
  @apply opacity-0 transform translate-x-4;
}
</style> 