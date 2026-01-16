<template>
  <DocumentPreview 
    title="Schéma de Traitement"
    @print="handlePrint"
    @close="$emit('close')"
  >
    <div class="traitement-preview">
      <!-- En-tête -->
      <div class="header">
        <div class="doctor-info">
          <h3 class="text-lg font-semibold">Dr. {{ doctorName }}</h3>
          <p class="text-sm text-gray-600">{{ speciality }}</p>
        </div>
        <div class="date">
          <p>Date: {{ formatDate(new Date()) }}</p>
        </div>
      </div>

      <!-- Information patient -->
      <div class="patient-info">
        <p><span class="font-medium">Patient:</span> {{ traitement.patientName }}</p>
        <p class="text-sm text-gray-600">Dossier N° {{ traitement.patient?.ID_dossier_medical }}</p>
      </div>

      <!-- Titre du schéma -->
      <div class="schema-title">
        <h3 class="text-xl font-bold text-center text-primary-700">{{ traitement.titre || "Schéma de traitement" }}</h3>
      </div>

      <!-- Détails du traitement -->
      <div class="treatment-details">
        <h4 class="section-title">Détails du schéma</h4>
        
        <div class="duration-info">
          <p><span class="font-medium">Période:</span> {{ getDureeJours() }} jours</p>
          <p><span class="font-medium">Du:</span> {{ formatDate(traitement.dateDebut) }}</p>
          <p><span class="font-medium">Au:</span> {{ formatDate(traitement.dateFin) }}</p>
          <p v-if="traitement.statut"><span class="font-medium">Statut:</span> {{ traitement.statut }}</p>
        </div>

        <!-- Description -->
        <div v-if="traitement.description" class="description">
          <h5 class="subsection-title">Description</h5>
          <p>{{ traitement.description }}</p>
        </div>

        <!-- Liste des médicaments -->
        <div class="medications-list">
          <h5 class="subsection-title">Médicaments prescrits</h5>
          <div v-for="(med, index) in traitement.medications" 
               :key="index"
               class="medication-item"
          >
            <div class="med-header">
              <span class="med-name">{{ med.medicationName }}</span>
            </div>
            <div class="med-schedule">
              <div v-for="(dose, idx) in med.doses" 
                   :key="idx"
                   class="schedule-item"
              >
                <span class="time">{{ formatTiming(dose.timing) }}</span>
                <span class="quantity">{{ dose.quantity }} {{ dose.unit }}</span>
              </div>
            </div>
            <div v-if="med.instructions" class="med-instructions">
              {{ med.instructions }}
            </div>
          </div>
        </div>

        <!-- Instructions générales -->
        <div v-if="traitement.instructions" class="recommendations">
          <h5 class="subsection-title">Instructions générales</h5>
          <p>{{ traitement.instructions }}</p>
        </div>
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
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import DocumentPreview from './DocumentPreview.vue'

const props = defineProps({
  traitement: {
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
  if (!date) return 'Non définie'
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
  } catch (error) {
    console.warn('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

function getDureeJours() {
  if (!props.traitement.dateDebut || !props.traitement.dateFin) return 'Non définie'
  try {
    const debut = new Date(props.traitement.dateDebut)
    const fin = new Date(props.traitement.dateFin)
    return differenceInDays(fin, debut) + 1 // +1 pour inclure le jour de début
  } catch (error) {
    console.warn('Erreur de calcul de durée:', error)
    return 'Non définie'
  }
}

function formatTiming(timing) {
  const timingMap = {
    'matin': 'Matin',
    'midi': 'Midi',
    'soir': 'Soir',
    'coucher': 'Au coucher',
    'repas': 'Aux repas',
    '8h': '8h00',
    '12h': '12h00',
    '16h': '16h00',
    '20h': '20h00'
  }
  return timingMap[timing] || timing
}

function handlePrint() {
  window.print()
}
</script>

<style scoped>
.traitement-preview {
  @apply space-y-6;
}

.header {
  @apply flex justify-between items-start border-b pb-4;
}

.patient-info {
  @apply bg-gray-50 p-4 rounded-lg;
}

.schema-title {
  @apply my-4;
}

.treatment-details {
  @apply space-y-6 mt-6;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 mb-4;
}

.subsection-title {
  @apply text-base font-medium text-gray-800 mb-3;
}

.duration-info {
  @apply bg-blue-50 p-4 rounded-lg space-y-1;
}

.description {
  @apply mt-4 p-4 bg-gray-50 rounded-lg;
}

.medications-list {
  @apply mt-6 space-y-4;
}

.medication-item {
  @apply border border-gray-200 rounded-lg p-4 space-y-3;
}

.med-header {
  @apply flex justify-between items-center;
}

.med-name {
  @apply font-medium text-lg;
}

.med-schedule {
  @apply grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg;
}

.schedule-item {
  @apply flex flex-col text-sm;
}

.time {
  @apply font-medium;
}

.quantity {
  @apply text-gray-600;
}

.med-instructions {
  @apply text-sm text-gray-600 italic;
}

.recommendations {
  @apply bg-yellow-50 p-4 rounded-lg mt-6;
}

.signature {
  @apply mt-8 text-right;
}

@media print {
  .traitement-preview {
    @apply p-8;
  }
  
  .medication-item {
    @apply break-inside-avoid;
  }
}
</style> 