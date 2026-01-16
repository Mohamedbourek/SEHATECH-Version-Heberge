<template>
  <div class="space-y-4">
    <!-- Filtres et recherche -->
    <div class="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <!-- Champ de recherche -->
      <div class="flex-1 min-w-0">
        <div class="relative">
          <input
            type="text"
            v-model="filters.search"
            placeholder="Rechercher une facture..."
            class="form-input pl-10 w-full"
          />
          <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      <!-- Menus déroulants -->
      <div class="flex gap-2">
        <select v-model="filters.status" class="form-select w-48">
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="PAIEMENT_PARTIEL">Paiement partiel</option>
          <option value="PAYEE">Payée</option>
          <option value="ANNULEE">Annulée</option>
        </select>
        <select v-model="filters.dateRange" class="form-select w-48">
          <option value="">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette année</option>
        </select>
      </div>
      <!-- Bouton d'export avec menu déroulant -->
      <div class="relative" v-click-outside="closeExportMenu">
        <button class="btn btn-secondary flex items-center gap-2" @click="toggleExportMenu">
          <Download class="w-4 h-4 mr-2" />
          Exporter
          <ChevronDown class="w-4 h-4" :class="{ 'rotate-180': showExportMenu }" />
        </button>
        <!-- Menu d'export -->
        <div
          v-if="showExportMenu"
          class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
        >
          <div class="py-1">
            <button
              class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              @click="exportInvoices('csv')"
            >
              <FileText class="w-4 h-4 mr-2" />
              Exporter en CSV
            </button>
            <button
              class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              @click="exportInvoices('json')"
            >
              <Code class="w-4 h-4 mr-2" />
              Exporter en JSON
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des factures -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="table-header">N° Facture</th>
            <th class="table-header">Patient</th>
            <th class="table-header">Date</th>
            <th class="table-header">Montant</th>
            <th class="table-header">Statut</th>
            <th class="table-header">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="invoice in filteredInvoices"
            :key="invoice.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="table-cell font-medium">{{ invoice.numero }}</td>
            <td class="table-cell">{{ invoice.patientNom }}</td>
            <td class="table-cell">{{ formatDate(invoice.dateEmission) }}</td>
            <td class="table-cell">{{ formatCurrency(invoice.montant) }}</td>
            <td class="table-cell">
              <span :class="getStatusClass(invoice.statut)">
                {{ getStatusLabel(invoice.statut) }}
              </span>
            </td>
            <td class="table-cell">
              <div class="flex space-x-2">
                <button
                  v-if="invoice.statut !== 'PAYEE' && invoice.statut !== 'ANNULEE'"
                  @click="$emit('showPaymentModal', invoice)"
                  class="btn-icon text-primary-500"
                  title="Enregistrer un paiement"
                >
                  <CreditCard class="w-4 h-4" />
                </button>
                <button
                  @click="$emit('showDetailsModal', invoice)"
                  class="btn-icon text-blue-500"
                  title="Voir les détails"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <!-- Nouveau bouton pour annuler la facture -->
                <button
                  v-if="invoice.statut !== 'ANNULEE'"
                  @click="handleCancel(invoice)"
                  class="btn-icon text-orange-500"
                  title="Annuler la facture"
                >
                  <XCircle class="w-4 h-4" />
                </button>
                <button
                  @click="$emit('deleteInvoice', invoice)"
                  class="btn-icon text-red-500"
                  title="Supprimer la facture"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
                <button
                  @click="handlePrint(invoice)"
                  class="btn-icon text-gray-500"
                  title="Imprimer"
                >
                  <Printer class="w-4 h-4" />
                </button>
                <button
                  @click="handleDownload(invoice)"
                  class="btn-icon text-gray-500"
                  title="Télécharger"
                >
                  <Download class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CreditCard, Eye, Printer, Search, FileText, Download, Trash2, ChevronDown, Code, XCircle } from 'lucide-vue-next'
import { formatDate } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { useBillingStore } from '@/stores/billing'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  invoices: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['showPaymentModal', 'showDetailsModal', 'refresh', 'deleteInvoice'])
const billingStore = useBillingStore()
const toast = useToast()

// Filtres
const filters = ref({
  status: '',
  search: '',
  dateRange: ''
})

// Factures filtrées
const filteredInvoices = computed(() => {
  return props.invoices.filter(invoice => {
    const matchesStatus = !filters.value.status || invoice.statut === filters.value.status;
    const searchLower = filters.value.search.toLowerCase();
    const matchesSearch =
      !filters.value.search ||
      invoice.numero.toLowerCase().includes(searchLower) ||
      invoice.patientNom.toLowerCase().includes(searchLower) ||
      formatCurrency(invoice.montant).toLowerCase().includes(searchLower);
    
    let matchesDateRange = true;
    if (filters.value.dateRange) {
      const invoiceDate = new Date(invoice.dateEmission);
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      
      switch (filters.value.dateRange) {
        case 'today':
          matchesDateRange = isSameDay(invoiceDate, today);
          break;
        case 'week':
          const startOfWeek = new Date(startOfDay);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          matchesDateRange = isWithinInterval(invoiceDate, { start: startOfWeek, end: endOfWeek });
          break;
        case 'month':
          matchesDateRange = invoiceDate.getMonth() === today.getMonth() && invoiceDate.getFullYear() === today.getFullYear();
          break;
        case 'quarter':
          const currentQuarter = Math.floor(today.getMonth() / 3);
          const invoiceQuarter = Math.floor(invoiceDate.getMonth() / 3);
          matchesDateRange = invoiceQuarter === currentQuarter && invoiceDate.getFullYear() === today.getFullYear();
          break;
        case 'year':
          matchesDateRange = invoiceDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDateRange;
  });
});

// Utilitaires pour dates
const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

const isWithinInterval = (date, { start, end }) => {
  return date >= start && date <= end;
};

// Exportation des factures (CSV/JSON)
const exportInvoices = async (format) => {
  try {
    if (filteredInvoices.value.length === 0) {
      toast.error('Aucune facture à exporter');
      return;
    }
    if (format === 'csv') {
      const headers = ['Numéro', 'Patient', 'Date', 'Montant', 'Statut'];
      const data = filteredInvoices.value.map(invoice => [
        invoice.numero,
        invoice.patientNom,
        formatDate(invoice.dateEmission),
        invoice.montant,
        getStatusLabel(invoice.statut)
      ]);
      const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `factures_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredInvoices.value));
      const link = document.createElement("a");
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `factures_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    toast.error(`Erreur lors de l'exportation: ${error.message || 'Erreur inconnue'}`);
    console.error('Erreur d\'exportation:', error);
  }
};

// Gestion du menu d'export
const showExportMenu = ref(false);
const toggleExportMenu = () => {
  showExportMenu.value = !showExportMenu.value;
};
const closeExportMenu = () => {
  showExportMenu.value = false;
};

// Formatage du statut
const getStatusClass = (status) => {
  const classes = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    PAIEMENT_PARTIEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    PAYEE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    ANNULEE: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  };
  return `px-2 py-1 text-xs font-medium rounded-full ${classes[status] || ''}`;
};

const getStatusLabel = (status) => {
  const labels = {
    EN_ATTENTE: 'En attente',
    PAIEMENT_PARTIEL: 'Paiement partiel',
    PAYEE: 'Payée',
    ANNULEE: 'Annulée'
  };
  return labels[status] || status;
};

// Fonction pour annuler une facture
const handleCancel = async (invoice) => {
  try {
    // Appel de la méthode cancel du store (route PUT /factures/{id}/cancel)
    const response = await billingStore.cancelInvoice(invoice.id);
    toast.success('Facture annulée avec succès');
    await refreshInvoices();
  } catch (error) {
    toast.error('Erreur lors de l\'annulation de la facture');
    console.error(error);
  }
};

const handlePrint = async (invoice) => {
  try {
    const pdfUrl = await billingStore.generatePDF(invoice.id);
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast.error('Erreur lors de la génération du PDF');
    }
  } catch (error) {
    toast.error('Erreur lors de l\'impression de la facture');
    console.error('Erreur lors de l\'impression de la facture:', error);
  }
};

const handleDownload = async (invoice) => {
  try {
    const pdfUrl = await billingStore.generatePDF(invoice.id);
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', `facture_${invoice.numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error('Erreur lors de la génération du PDF');
    }
  } catch (error) {
    toast.error('Erreur lors du téléchargement de la facture');
    console.error('Erreur lors du téléchargement:', error);
  }
};

const refreshInvoices = async () => {
  try {
    await billingStore.fetchInvoices();
  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error);
    toast.error('Erreur lors du rafraîchissement des données');
  }
};

watch(() => billingStore.invoices, () => {
  console.log('Liste des factures mise à jour');
}, { deep: true });
</script>

<style scoped>
.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100;
}

.btn-icon {
  @apply p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
}

.form-select {
  @apply rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:border-primary-500 focus:ring-primary-500;
}

.form-input {
  @apply rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:border-primary-500 focus:ring-primary-500;
}
</style>
