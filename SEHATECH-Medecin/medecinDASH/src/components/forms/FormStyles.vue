<template>
  <!-- Composant vide car il ne sert qu'à définir des styles -->
  <div></div>
</template>

<script setup>
// Pas de logique nécessaire
</script>

<style>
/* Form Section */
.form-section {
  @apply bg-white dark:bg-gray-800 rounded-xl border border-gray-200 
         dark:border-gray-700 overflow-hidden transition-shadow
         hover:shadow-md mb-6 max-w-full;
}

.form-header {
  @apply bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b 
         border-gray-200 dark:border-gray-700;
}

.form-title {
  @apply text-lg font-medium text-gray-900 dark:text-white;
}

.form-subtitle {
  @apply mt-1 text-sm text-gray-500 dark:text-gray-400;
}

.form-content {
  @apply p-6 space-y-4;
}

/* Form Controls */
.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-label.required:after {
  content: " *";
  @apply text-red-500;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm;
}

.form-checkbox {
  @apply rounded border-gray-300 text-primary-600 
         focus:ring-primary-500 dark:border-gray-600 
         dark:bg-gray-700 dark:checked:bg-primary-600;
}

.checkbox-label {
  @apply flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300;
}

/* Form Actions */
.form-actions {
  @apply flex justify-end space-x-3 mt-6 sticky bottom-0 bg-white dark:bg-gray-800 
         py-4 px-6 border-t border-gray-200 dark:border-gray-700
         shadow-lg;
}

.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
         focus:outline-none focus:ring-2 focus:ring-offset-2 
         disabled:opacity-50 dark:focus:ring-offset-gray-900
         relative z-10 cursor-pointer;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 
         focus:ring-primary-500 dark:focus:ring-primary-400
         active:bg-primary-800 transform transition-transform
         hover:scale-105;
}

.btn-secondary {
  @apply bg-white text-gray-700 hover:bg-gray-50 
         focus:ring-primary-500 border border-gray-300;
}

/* Document styles */
.document-card {
  @apply flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 
         rounded-lg border border-gray-200 dark:border-gray-700
         hover:shadow-md transition-all;
}

.document-icon {
  @apply p-2 rounded-lg;
}

.document-info {
  @apply flex-1 min-w-0;
}

.document-name {
  @apply block text-sm font-medium text-gray-900 dark:text-white truncate;
}

.document-meta {
  @apply block text-sm text-gray-500 dark:text-gray-400;
}

.document-actions {
  @apply flex items-center space-x-2;
}

.action-button {
  @apply p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
         transition-colors duration-200;
}

/* Animations */
.list-enter-active,
.list-leave-active {
  @apply transition-all duration-300 ease-in-out;
}

.list-enter-from,
.list-leave-to {
  @apply opacity-0 transform translate-y-4;
}

/* Styles communs pour les vues */
.page-title {
  @apply text-2xl font-semibold text-gray-900 dark:text-white mb-6;
}

.page-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400 mb-4;
}

.page-section {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;
}

.page-header {
  @apply flex justify-between items-center mb-6;
}

/* Styles communs pour les cartes */
.card {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
         dark:border-gray-700 overflow-hidden hover:shadow-md 
         transition-shadow duration-200;
}

.card-header {
  @apply flex items-center justify-between p-4 
         border-b border-gray-200 dark:border-gray-700;
}

.card-content {
  @apply p-4;
}

/* Styles communs pour les statuts */
.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-success {
  @apply bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400;
}

.status-warning {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400;
}

.status-error {
  @apply bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400;
}

.status-info {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400;
}

/* Styles communs pour les grilles */
.grid-layout {
  @apply grid gap-6;
}

.grid-2-cols {
  @apply grid-cols-1 md:grid-cols-2;
}

.grid-3-cols {
  @apply grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
}

/* Styles communs pour les statistiques */
.stat-card {
  @apply bg-white dark:bg-gray-800 p-4 rounded-lg 
         border border-gray-200 dark:border-gray-700;
}

.stat-value {
  @apply text-2xl font-semibold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

/* Styles communs pour les indicateurs */
.indicator {
  @apply inline-flex items-center;
}

.indicator-up {
  @apply text-green-600 dark:text-green-400;
}

.indicator-down {
  @apply text-red-600 dark:text-red-400;
}

/* Modal Styles */
:deep(.modal-container) {
  @apply w-full max-w-4xl mx-auto;
}

:deep(.modal-content) {
  @apply max-h-[85vh] overflow-y-auto;
}

/* Responsive Adjustments */
@screen md {
  .form-content {
    @apply p-8;
  }
}
</style> 