<template>
  <DocumentPreview 
    title="Demande d'examens"
    @print="handlePrint"
    @close="$emit('close')"
  >
    <div class="examen-preview">
      <!-- En-tête -->
      <div class="header">
        <div class="doctor-info">
          <h3 class="text-lg font-semibold">Dr. {{ doctorName }}</h3>
          <p class="text-sm text-gray-600">{{ speciality }}</p>
        </div>
        <div class="date">
          <p>Date: {{ formatDate(examen.date) }}</p>
        </div>
      </div>

      <!-- Information patient -->
      <div class="patient-info">
        <p><span class="font-medium">Patient:</span> {{ examen.patientName }}</p>
        <p class="text-sm text-gray-600">Dossier N° {{ examen.patientId }}</p>
      </div>

      <!-- Liste des examens -->
      <div class="examens-list">
        <h4 class="section-title">Examens demandés</h4>
        <div v-for="(exam, index) in examen.examens" 
             :key="index"
             class="examen-item"
        >
          <div class="exam-type">{{ exam.type }}</div>
          <div class="exam-description">{{ exam.description }}</div>
          <div v-if="exam.instructions" class="exam-instructions">
            {{ exam.instructions }}
          </div>
        </div>
      </div>

      <!-- Notes cliniques -->
      <div v-if="examen.notes" class="notes">
        <h4 class="section-title">Notes cliniques</h4>
        <p>{{ examen.notes }}</p>
      </div>

      <!-- Signature -->
      <div class="signature">
        <p class="font-medium">Dr. {{ doctorName }}</p>
        <p class="text-sm text-gray-600">{{ speciality }}</p>
      </div>
    </div>
  </DocumentPreview>
</template>

<script setup>
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import DocumentPreview from './DocumentPreview.vue'

const props = defineProps({
  examen: {
    type: Object,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  speciality: {
    type: String,
    default: 'Médecin généraliste'
  },
  hospitalName: {
    type: String,
    required: true
  }
})

defineEmits(['close'])

function formatDate(date) {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
}

function handlePrint() {
  window.print()
}
</script>

<style scoped>
.examen-preview {
  @apply space-y-6;
}

.header {
  @apply flex justify-between items-start border-b pb-4;
}

.patient-info {
  @apply bg-gray-50 p-4 rounded-lg;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 mb-4;
}

.examens-list {
  @apply space-y-4 mt-6;
}

.examen-item {
  @apply border border-gray-200 rounded-lg p-4 space-y-2;
}

.exam-type {
  @apply font-medium text-lg;
}

.exam-description {
  @apply text-gray-700;
}

.exam-instructions {
  @apply text-sm text-gray-600 italic mt-2;
}

.notes {
  @apply bg-gray-50 p-4 rounded-lg mt-6;
}

.signature {
  @apply mt-8 text-right;
}

@media print {
  .examen-preview {
    @apply p-8;
  }
  
  .examen-item {
    @apply break-inside-avoid;
  }
}
</style> 