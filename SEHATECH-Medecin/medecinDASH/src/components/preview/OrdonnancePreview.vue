<template>
  <DocumentPreview 
    title="Ordonnance"
    @print="handlePrint"
    @close="$emit('close')"
  >
    <div class="ordonnance-preview">
      <!-- En-tête -->
      <div class="header">
        <div class="doctor-info">
          <h3 class="text-lg font-semibold">Dr. {{ doctorName }}</h3>
          <p class="text-sm text-gray-600">{{ speciality }}</p>
          <p class="text-sm text-gray-600">{{ address }}</p>
        </div>
        <div class="date">
          <p>Date: {{ formatDate(ordonnance.date) }}</p>
        </div>
      </div>

      <!-- Information patient -->
      <div class="patient-info">
        <p><span class="font-medium">Patient:</span> {{ ordonnance.patientName }}</p>
        <p><span class="font-medium">Âge:</span> {{ ordonnance.patientAge }} ans</p>
      </div>

      <!-- Médicaments -->
      <div class="medications">
        <h4 class="text-lg font-semibold mb-4">Prescription</h4>
        <div v-for="(med, index) in ordonnance.medications" 
             :key="index"
             class="medication-item"
        >
          <div class="med-name">{{ med.name }}</div>
          <div class="med-dosage">{{ med.dosage }}</div>
          <div class="med-duration">{{ med.duration }}</div>
          <div class="med-instructions">{{ med.instructions }}</div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="ordonnance.notes" class="notes">
        <h4 class="text-base font-medium mb-2">Notes</h4>
        <p>{{ ordonnance.notes }}</p>
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
  ordonnance: {
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
  address: {
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
.ordonnance-preview {
  @apply space-y-6;
}

.header {
  @apply flex justify-between items-start border-b pb-4;
}

.patient-info {
  @apply bg-gray-50 p-4 rounded-lg;
}

.medications {
  @apply mt-6;
}

.medication-item {
  @apply border-b border-gray-200 py-4 space-y-2;
}

.med-name {
  @apply font-medium text-lg;
}

.med-dosage {
  @apply text-gray-700;
}

.med-instructions {
  @apply text-gray-600 text-sm;
}

.notes {
  @apply bg-gray-50 p-4 rounded-lg mt-6;
}

.signature {
  @apply mt-8 text-right;
}

@media print {
  .ordonnance-preview {
    @apply p-8;
  }
}
</style> 