<template>
  <DocumentPreview 
    title="Certificat Médical"
    @print="handlePrint"
    @close="$emit('close')"
  >
    <div class="certificat-preview">
      <!-- En-tête -->
      <div class="header">
        <div class="doctor-info">
          <h3 class="text-lg font-semibold">Dr. {{ doctorName }}</h3>
          <p class="text-sm text-gray-600">{{ speciality }}</p>
          <p class="text-sm text-gray-600">{{ address }}</p>
        </div>
        <div class="date">
          <p>Date: {{ formatDate(certificat.date) }}</p>
        </div>
      </div>

      <!-- Information patient -->
      <div class="patient-info">
        <p><span class="font-medium">Je soussigné(e), Dr. {{ doctorName }}, certifie avoir examiné :</span></p>
        <p class="mt-2">{{ certificat.patientName }}</p>
        <p class="text-sm text-gray-600">Né(e) le {{ formatDate(certificat.dateNaissance) }}</p>
      </div>

      <!-- Contenu du certificat -->
      <div class="content">
        <div class="type-certificat">
          <h4 class="text-lg font-semibold mb-2">{{ getTitreCertificat(certificat.type) }}</h4>
        </div>

        <div class="motif mt-4">
          <p>{{ certificat.contenu }}</p>
        </div>

        <div v-if="certificat.periode" class="periode mt-4">
          <p class="text-sm text-gray-600">
            Période : du {{ formatDate(certificat.dateDebut) }} au {{ formatDate(certificat.dateFin) }}
          </p>
        </div>
      </div>

      <!-- Notes supplémentaires -->
      <div v-if="certificat.notes" class="notes">
        <p class="text-sm">{{ certificat.notes }}</p>
      </div>

      <!-- Signature -->
      <div class="signature">
        <p>Fait à {{ city }}, le {{ formatDate(new Date()) }}</p>
        <div class="mt-4">
          <p class="font-medium">Dr. {{ doctorName }}</p>
          <p class="text-sm text-gray-600">{{ speciality }}</p>
        </div>
      </div>
    </div>
  </DocumentPreview>
</template>

<script setup>
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import DocumentPreview from './DocumentPreview.vue'

const props = defineProps({
  certificat: {
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
  },
  city: {
    type: String,
    required: true
  }
})

defineEmits(['close'])

function formatDate(date) {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
}

function getTitreCertificat(type) {
  const types = {
    'aptitude': 'Certificat d\'aptitude',
    'inaptitude': 'Certificat d\'inaptitude',
    'presence': 'Certificat de présence',
    'medical': 'Certificat médical'
  }
  return types[type] || 'Certificat médical'
}

function handlePrint() {
  window.print()
}
</script>

<style scoped>
.certificat-preview {
  @apply space-y-8 text-gray-900;
}

.header {
  @apply flex justify-between items-start border-b pb-4;
}

.patient-info {
  @apply bg-gray-50 p-6 rounded-lg;
}

.content {
  @apply mt-6 space-y-4;
}

.type-certificat {
  @apply text-center border-b border-gray-200 pb-4;
}

.notes {
  @apply bg-gray-50 p-4 rounded-lg mt-6 italic;
}

.signature {
  @apply mt-12 text-right space-y-2;
}

@media print {
  .certificat-preview {
    @apply p-8;
  }
}
</style> 