<template>
  <DocumentPreview 
    title="Consultation Médicale"
    @print="handlePrint"
    @close="$emit('close')"
  >
    <div class="consultation-preview">
      <!-- En-tête -->
      <div class="header">
        <div class="patient-info">
          <h3 class="text-lg font-semibold">Patient</h3>
          <p>{{ consultation.patientName }}</p>
          <p class="text-sm text-gray-600">Dossier N° {{ consultation.ID_dossier_medical }}</p>
        </div>
        <div class="consultation-date">
          <p>Date: {{ formatDate(consultation.date) }}</p>
        </div>
      </div>

      <!-- Motif et Symptômes -->
      <div class="section">
        <h4 class="section-title">Motif de consultation</h4>
        <p>{{ consultation.motifConsultation }}</p>
        
        <h5 class="subsection-title">Symptômes</h5>
        <ul class="list-disc pl-4">
          <li v-for="(symptome, index) in consultation.symptomes" 
              :key="index"
          >
            {{ symptome }}
          </li>
        </ul>
      </div>

      <!-- Constantes vitales -->
      <div class="section">
        <h4 class="section-title">Constantes vitales</h4>
        <div class="grid grid-cols-2 gap-4">
          <div v-if="consultation.constantes.tension">
            <span class="font-medium">Tension:</span> 
            {{ consultation.constantes.tension }}
          </div>
          <div v-if="consultation.constantes.frequenceCardiaque">
            <span class="font-medium">Fréquence cardiaque:</span>
            {{ consultation.constantes.frequenceCardiaque }} bpm
          </div>
          <div v-if="consultation.constantes.temperature">
            <span class="font-medium">Température:</span>
            {{ consultation.constantes.temperature }}°C
          </div>
          <div v-if="consultation.constantes.saturation">
            <span class="font-medium">Saturation O2:</span>
            {{ consultation.constantes.saturation }}%
          </div>
        </div>
      </div>

      <!-- Diagnostic -->
      <div class="section">
        <h4 class="section-title">Diagnostic</h4>
        <p>{{ consultation.diagnostic }}</p>
      </div>

      <!-- Observations -->
      <div class="section" v-if="consultation.observations">
        <h4 class="section-title">Observations</h4>
        <p>{{ consultation.observations }}</p>
      </div>

      <!-- Conduite à tenir -->
      <div class="section" v-if="consultation.conduiteTenir">
        <h4 class="section-title">Conduite à tenir</h4>
        <p>{{ consultation.conduiteTenir }}</p>
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
  consultation: {
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
.consultation-preview {
  @apply space-y-6;
}

.header {
  @apply flex justify-between items-start border-b pb-4;
}

.section {
  @apply py-4 border-b border-gray-200;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.subsection-title {
  @apply text-base font-medium text-gray-800 mt-4 mb-2;
}

.signature {
  @apply mt-8 text-right;
}

@media print {
  .consultation-preview {
    @apply p-8;
  }
}
</style> 