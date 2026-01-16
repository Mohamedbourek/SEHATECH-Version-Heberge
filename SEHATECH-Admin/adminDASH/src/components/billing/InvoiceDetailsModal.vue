<template>
  <BaseModal
    title="Détails de la facture"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- En-tête de la facture -->
      <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Numéro</p>
            <p class="mt-1 text-sm font-medium">{{ invoice.numero }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Date d'émission</p>
            <p class="mt-1 text-sm">{{ formatDate(invoice.dateEmission) }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Patient</p>
            <!-- Le store crée la propriété patientNom lors du mapping -->
            <p class="mt-1 text-sm">{{ invoice.patientNom }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Statut</p>
            <span :class="getStatusClass(invoice.statut)">
              {{ getStatusLabel(invoice.statut) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Détails des prestations -->
      <div>
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Détails des prestations
        </h3>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="text-left text-xs font-medium text-gray-500 py-2">Description</th>
              <th class="text-right text-xs font-medium text-gray-500 py-2">Montant</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(detail, index) in invoice.details" :key="index">
              <td class="py-2 text-sm">{{ detail.description }}</td>
              <td class="py-2 text-sm text-right">{{ formatCurrency(detail.montant) }}</td>
            </tr>
            <tr class="font-medium">
              <td class="py-2 text-sm">Total</td>
              <td class="py-2 text-sm text-right">{{ formatCurrency(invoice.montant) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Historique des paiements -->
      <div v-if="payments.length">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Historique des paiements
        </h3>
        <div class="space-y-2">
          <div 
            v-for="payment in payments" 
            :key="payment.id"
            class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center"
          >
            <div>
              <p class="text-sm font-medium">{{ formatCurrency(payment.amount) }}</p>
              <p class="text-xs text-gray-500">
                {{ formatDate(payment.date) }} - {{ getPaymentMethodLabel(payment.method) }}
              </p>
            </div>
            <p class="text-sm text-gray-500">{{ payment.reference || 'Pas de référence' }}</p>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { useBillingStore } from '@/stores/billing'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  invoice: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['close'])

const billingStore = useBillingStore()
const toast = useToast()
const payments = ref([])

// Adaptez les libellés de méthodes de paiement selon votre back-end
const getPaymentMethodLabel = (method) => {
  const labels = {
    cib: 'Carte CIB',
    edahabia: 'Carte Edahabia',
    cash: 'Espèces',
    cheque: 'Chèque',
    virement: 'Virement bancaire',
    insurance: 'CNAS/CASNOS'
  }
  return labels[method] || method
}

const getStatusClass = (status) => {
  const classes = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    PAIEMENT_PARTIEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    PAYEE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    ANNULEE: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  }
  return `px-2 py-1 text-xs font-medium rounded-full ${classes[status] || ''}`
}

const getStatusLabel = (status) => {
  const labels = {
    EN_ATTENTE: 'En attente',
    PAIEMENT_PARTIEL: 'Paiement partiel',
    PAYEE: 'Payée',
    ANNULEE: 'Annulée'
  }
  return labels[status] || status
}

onMounted(async () => {
  try {
    // Récupération des paiements liés à la facture à partir du store
    payments.value = await billingStore.getInvoicePayments(props.invoice.id)
  } catch (error) {
    toast.error('Erreur lors du chargement des paiements')
    console.error('Erreur lors du chargement des paiements:', error)
  }
})
</script>
