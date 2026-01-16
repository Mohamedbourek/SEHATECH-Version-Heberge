<template>
  <div class="card-base">
    <div class="card-header">
      <slot name="icon">
        <div class="icon-placeholder"></div>
      </slot>
      <div class="card-content">
        <slot name="title"></slot>
        <slot name="subtitle"></slot>
      </div>
      <slot name="actions"></slot>
    </div>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  hover: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.card-base {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
         dark:border-gray-700 overflow-hidden transition-all duration-200;
}

.card-base:hover {
  @apply shadow-md dark:shadow-gray-900/50;
}

.card-header {
  @apply flex items-center justify-between p-4;
}

.card-content {
  @apply flex-1 min-w-0;
}

.icon-placeholder {
  @apply w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700;
}
</style>