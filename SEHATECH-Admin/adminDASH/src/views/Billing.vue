<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
        Facturation
      </h1>
      <div class="flex space-x-3">
        <button 
          class="btn btn-secondary"
          @click="showPricingTable = true"
        >
          <Settings class="w-4 h-4 mr-2" />
          Grille tarifaire
        </button>
        <button 
          class="btn btn-primary"
          @click="handleNewInvoice"
        >
          <Plus class="w-4 h-4 mr-2" />
          Nouvelle facture
        </button>
      </div>
    </div>

    <!-- Liste des factures -->
    <InvoiceList 
      :invoices="billingStore.invoices"
      @showPaymentModal="handleShowPaymentModal"
      @showDetailsModal="handleShowDetailsModal"
      @refresh="refreshInvoices"
      @deleteInvoice="handleDeleteInvoice"
    />

    <!-- Modales -->
    <PaymentModal
      v-if="showPaymentModal"
      :invoice="selectedInvoice"
      @close="closePaymentModal"
      @payment-recorded="handlePaymentRecorded"
    />

    <PricingTable
      v-if="showPricingTable"
      :prices="billingStore.prices"
      @close="showPricingTable = false"
      @add="handleAddPrice"
      @edit="handleEditPrice"
      @delete="handleDeletePrice"
    />

    <InvoiceModal
      v-if="showInvoiceModal"
      @close="closeInvoiceModal"
      @save="handleSaveInvoice"
    />

    <!-- Modal de détails -->
    <InvoiceDetailsModal
      v-if="showDetailsModal"
      :invoice="selectedInvoice"
      @close="closeDetailsModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus, Settings } from 'lucide-vue-next'
import { useBillingStore } from '@/stores/billing'
import { useToast } from '@/composables/useToast'
import InvoiceList from '@/components/billing/InvoiceList.vue'
import PaymentModal from '@/components/billing/PaymentModal.vue'
import PricingTable from '@/components/billing/PricingTable.vue'
import InvoiceDetailsModal from '@/components/billing/InvoiceDetailsModal.vue'
import InvoiceModal from '@/components/billing/InvoiceModal.vue'

const billingStore = useBillingStore()
const toast = useToast()

// État local
const showInvoiceModal = ref(false)
const showPaymentModal = ref(false)
const showPricingTable = ref(false)
const showDetailsModal = ref(false)
const selectedInvoice = ref(null)

// Gestion des tarifs
const handleAddPrice = async (priceData) => {
  try {
    await billingStore.createPrice(priceData)
    await billingStore.fetchPrices()
    toast.success('Tarif ajouté avec succès')
  } catch (error) {
    toast.error('Erreur lors de l\'ajout du tarif')
    console.error(error)
  }
}

const handleEditPrice = async (priceData) => {
  try {
    await billingStore.updatePrice(priceData.id, priceData)
    await billingStore.fetchPrices()
    toast.success('Tarif mis à jour avec succès')
  } catch (error) {
    toast.error('Erreur lors de la mise à jour du tarif')
    console.error(error)
  }
}

const handleDeletePrice = async (priceId) => {
  try {
    await billingStore.deletePrice(priceId)
    await billingStore.fetchPrices()
    toast.success('Tarif supprimé avec succès')
  } catch (error) {
    toast.error('Erreur lors de la suppression du tarif')
    console.error(error)
  }
}

// Chargement initial des factures et tarifs
onMounted(async () => {
  try {
    await Promise.all([
      billingStore.fetchInvoices(),
      billingStore.fetchPrices()
    ])
  } catch (error) {
    toast.error('Erreur lors du chargement des données')
    console.error(error)
  }
})

// Gestionnaires d'événements
const handleShowPaymentModal = (invoice) => {
  selectedInvoice.value = invoice
  showPaymentModal.value = true
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  selectedInvoice.value = null
}

const handlePaymentRecorded = async () => {
  await billingStore.fetchInvoices()
  toast.success('Paiement enregistré avec succès')
  closePaymentModal()
}

const handleShowDetailsModal = (invoice) => {
  selectedInvoice.value = invoice
  showDetailsModal.value = true
}

const refreshInvoices = async () => {
  try {
    await billingStore.fetchInvoices()
  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error)
    toast.error('Erreur lors du rafraîchissement des données')
  }
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedInvoice.value = null
}

// Gestion de la création d'une nouvelle facture
const handleNewInvoice = () => {
  showInvoiceModal.value = true
}

const closeInvoiceModal = () => {
  showInvoiceModal.value = false
}

const handleSaveInvoice = async (invoiceData) => {
  try {
    await billingStore.createInvoice(invoiceData)
    toast.success('Facture créée avec succès')
    closeInvoiceModal()
    refreshInvoices()
  } catch (error) {
    toast.error(error.message || 'Erreur lors de la création de la facture')
    console.error(error)
  }
}

// Gestion de la suppression d'une facture
const handleDeleteInvoice = async (invoice) => {
  try {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.numero} ?`)) {
      await billingStore.deleteInvoice(invoice.id)
      toast.success('Facture supprimée avec succès')
      await refreshInvoices()
    }
  } catch (error) {
    toast.error('Erreur lors de la suppression de la facture')
    console.error(error)
  }
}

// Watcher pour observer les mises à jour des factures
watch(() => billingStore.invoices, () => {
  console.log('Liste des factures mise à jour')
}, { deep: true })
</script>
