<template>
  <div class="print-container p-8" ref="printArea">
    <!-- En-tête -->
    <div class="flex justify-between items-start mb-8">
      <div>
        <img src="@/assets/logo.svg" alt="Logo" class="h-16 w-auto" />
        <h1 class="text-2xl font-bold mt-2">Smart Hospital</h1>
        <p class="text-gray-600">123 Rue de l'Hôpital</p>
        <p class="text-gray-600">Alger, Algérie</p>
        <p class="text-gray-600">Tél: 021 00 00 00</p>
      </div>
      <div class="text-right">
        <h2 class="text-xl font-semibold">FACTURE</h2>
        <p class="text-gray-600">N° {{ invoice.number }}</p>
        <p class="text-gray-600">Date: {{ formatDate(invoice.date) }}</p>
      </div>
    </div>

    <!-- Informations du patient -->
    <div class="mb-8 p-4 bg-gray-50 rounded-lg">
      <h3 class="font-semibold mb-2">Patient</h3>
      <p>{{ invoice.patient.nom }}</p>
      <p v-if="invoice.patient.numeroSecu">N° Sécurité Sociale: {{ invoice.patient.numeroSecu }}</p>
      <p v-if="invoice.patient.telephone">Tél: {{ invoice.patient.telephone }}</p>
    </div>

    <!-- Détails des prestations -->
    <table class="w-full mb-8">
      <thead>
        <tr class="border-b-2 border-gray-200">
          <th class="text-left py-2">Description</th>
          <th class="text-left py-2">Code</th>
          <th class="text-right py-2">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in invoice.items" :key="index" class="border-b border-gray-200">
          <td class="py-2">{{ item.description }}</td>
          <td class="py-2">{{ item.code }}</td>
          <td class="text-right py-2">{{ formatCurrency(item.amount) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totaux -->
    <div class="w-1/2 ml-auto">
      <div class="flex justify-between py-2">
        <span>Total HT</span>
        <span>{{ formatCurrency(totalHT) }}</span>
      </div>
      <div class="flex justify-between py-2 border-b border-gray-200">
        <span>TVA ({{ tvaRate }}%)</span>
        <span>{{ formatCurrency(totalTVA) }}</span>
      </div>
      <div class="flex justify-between py-2 font-bold">
        <span>Total TTC</span>
        <span>{{ formatCurrency(totalTTC) }}</span>
      </div>
    </div>

    <!-- Mode de paiement -->
    <div class="mt-8">
      <p class="font-semibold">Mode de paiement: {{ paymentMethodLabel }}</p>
    </div>

    <!-- Notes -->
    <div class="mt-8" v-if="invoice.notes">
      <h3 class="font-semibold mb-2">Notes</h3>
      <p class="text-gray-600">{{ invoice.notes }}</p>
    </div>

    <!-- Pied de page -->
    <div class="mt-16 text-center text-gray-500 text-sm">
      <p>Merci de votre confiance</p>
      <p>Smart Hospital - RC: 123456 - NIF: 987654321</p>
    </div>

    <div class="mt-4 flex justify-end">
      <button
        class="btn btn-primary"
        @click="downloadPDF"
      >
        <Download class="w-4 h-4 mr-2" />
        Télécharger PDF
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCurrency } from '@/composables/useCurrency'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const props = defineProps({
  invoice: {
    type: Object,
    required: true
  }
})

const { formatCurrency } = useCurrency()

const tvaRate = 20

const totalHT = computed(() => 
  props.invoice.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
)

const totalTVA = computed(() => totalHT.value * (tvaRate / 100))
const totalTTC = computed(() => totalHT.value + totalTVA.value)

const paymentMethodLabels = {
  cib: 'Carte CIB',
  edahabia: 'Carte Edahabia',
  cash: 'Espèces',
  insurance: 'CNAS/CASNOS'
}

const paymentMethodLabel = computed(() => 
  paymentMethodLabels[props.invoice.paymentMethod] || props.invoice.paymentMethod
)

const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
}

const downloadPDF = async () => {
  const element = printArea.value
  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  const imgProps = pdf.getImageProperties(imgData)
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(`facture-${props.invoice.number}.pdf`)
}

defineExpose({ downloadPDF })
</script>

<style scoped>
@media print {
  .print-container {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    margin: 0;
    background: white;
  }
}
</style> 