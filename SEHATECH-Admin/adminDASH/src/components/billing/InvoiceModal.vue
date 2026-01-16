<template>
  <BaseModal :title="'Nouvelle facture'" @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-6 relative">
      <!-- En-tête de la facture -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Date d'émission (affichée en lecture seule, générée côté serveur) -->
        <div>
          <label class="form-label">Date d'émission</label>
          <p class="form-static">{{ currentDate }}</p>
        </div>
        <!-- Numéro de facture (affiché, généré côté serveur) -->
        <div>
          <label class="form-label">Numéro de facture</label>
          <p class="form-static">{{ nextInvoiceNumber }}</p>
        </div>
      </div>

      <!-- Informations patient -->
      <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4 relative">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          Information patient
        </h3>
        <!-- Recherche patient (affichée si aucun patient n'est sélectionné) -->
        <div class="space-y-4" v-if="!form.patient_id">
          <label class="form-label" for="patient-name">Nom du patient</label>
          <div class="relative">
            <input
              id="patient-name"
              v-model="searchQuery"
              type="text"
              class="form-input pl-10"
              placeholder="Rechercher un patient..."
              @focus="showResults = true"
              @blur="handleSearchBlur"
              @input="searchPatients"
              required
            />
            <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 class="w-4 h-4 animate-spin text-primary-500" />
            </div>
            <!-- Liste déroulante des patients recherchés -->
            <div
              v-if="showResults && filteredPatients.length"
              class="absolute z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mt-1 max-h-48 overflow-y-auto w-full"
            >
              <ul>
                <li
                  v-for="patient in filteredPatients"
                  :key="patient.id"
                  @mousedown.prevent="selectPatient(patient)"
                  class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {{ patient.nom }} {{ patient.prenom }} - NSS: {{ patient.numeroSecu }}
                </li>
              </ul>
            </div>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Commencez à taper le nom du patient pour le rechercher
          </p>
        </div>

        <!-- Affichage du patient sélectionné -->
        <div v-if="form.patient_id" class="bg-white dark:bg-gray-900 p-3 rounded-lg">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-medium">
                {{ form.patientInfo.nom }} {{ form.patientInfo.prenom }}
              </h4>
              <p class="text-sm text-gray-500">
                NSS: {{ form.patientInfo.numeroSecu }}
              </p>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-500" @click="clearPatient">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Liste des prestations -->
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">
            Prestations
          </h3>
          <div class="flex space-x-2">
            <button type="button" class="btn btn-secondary btn-sm" @click="openPricingModal">
              <Plus class="w-4 h-4 mr-2" />
              Sélectionner prestation
            </button>
            <button type="button" class="btn btn-outline btn-sm" @click="addEmptyItem">
              <Plus class="w-4 h-4 mr-2" />
              Saisie libre
            </button>
          </div>
        </div>

        <!-- Tableau des prestations ajoutées -->
        <div v-if="showPrestations" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Montant</th>
                <th class="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(item, index) in form.prestations" :key="index">
                <td class="px-4 py-2">
                  <input
                    v-model="item.description"
                    type="text"
                    class="form-input"
                    placeholder="Description de la prestation"
                    required
                  />
                </td>
                <td class="px-4 py-2">
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">DA</span>
                    <input
                      v-model.number="item.amount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-input pl-12 text-right"
                      placeholder="0.00"
                      required
                      @input="validateAmount($event, index)"
                    />
                  </div>
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    type="button"
                    class="btn-icon text-red-500"
                    @click="removeItem(index)"
                    :disabled="form.prestations.length === 1"
                    title="Supprimer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totaux -->
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Total HT</span>
            <span class="font-medium">{{ formatCurrency(totalHT) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">TVA ({{ tvaRate }}%)</span>
            <span class="font-medium">{{ formatCurrency(totalTVA) }}</span>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div class="flex justify-between font-medium text-lg">
              <span>Total TTC</span>
              <span class="text-primary-600">{{ formatCurrency(totalTTC) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode de paiement et Notes (optionnel) -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">Mode de paiement</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            v-for="method in paymentMethods"
            :key="method.value"
            class="relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors duration-200"
            :class="form.paymentMethod === method.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 hover:border-gray-400'"
          >
            <input type="radio" :value="method.value" v-model="form.paymentMethod" class="sr-only" />
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center">
                <div class="text-sm">
                  <p class="font-medium text-gray-900 dark:text-white">{{ method.label }}</p>
                  <p class="text-gray-500">{{ method.description }}</p>
                </div>
              </div>
              <component :is="method.icon" class="h-5 w-5"
                :class="form.paymentMethod === method.value ? 'text-primary-600' : 'text-gray-400'" />
            </div>
          </label>
        </div>
      </div>

      <div>
        <label class="form-label" for="invoice-notes">Notes</label>
        <textarea id="invoice-notes" v-model="form.notes" rows="3" class="form-textarea"
          placeholder="Notes additionnelles..."></textarea>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuler</button>
        <button type="submit" class="btn btn-primary" :disabled="!isValid || isSubmitting">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          Créer la facture
        </button>
      </div>
    </form>

    <!-- Modal de sélection des prestations -->
    <PricingSelectionModal
      v-if="showPricingModal"
      :prices="availablePrices"
      @close="showPricingModal = false"
      @select="handleSelectPrice"
    />
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Trash2, Search, Loader2, X, Wallet, CreditCard } from 'lucide-vue-next'
import { useDebounce } from '@vueuse/core'
import BaseModal from '@/components/BaseModal.vue'
import PricingSelectionModal from './PricingSelectionModal.vue'
import { useBillingStore } from '@/stores/billing'
import { useToast } from '@/composables/useToast'
import axiosInstance from '@/services/axios'

const props = defineProps({
  invoice: {
    type: Object,
    default: null
  }
})
const emit = defineEmits(['close', 'save', 'refresh'])
const billingStore = useBillingStore()
const toast = useToast()

// Date actuelle (affichée en lecture seule)
const currentDate = new Date().toLocaleDateString('fr-CA')

// Génération du numéro de facture (affiché)
const nextInvoiceNumber = computed(() => billingStore.generateInvoiceNumber())

// Recherche patient
const searchQuery = ref('')
const showResults = ref(false)
const isSearching = ref(false)
const filteredPatients = ref([])

const searchPatients = useDebounce(async () => {
  isSearching.value = true;
  try {
    let url = '/patients';
    if (searchQuery.value.trim() !== '') {
      url += `?search=${encodeURIComponent(searchQuery.value.trim())}`;
    }
    const response = await axiosInstance.get(url);
    const patients = Array.isArray(response.data)
      ? response.data
      : response.data.patients || [];
    console.log("Patients récupérés :", patients);
    filteredPatients.value = patients.map(patient => ({
      id: patient._id,
      nom: patient.utilisateur?.nom || '',
      prenom: patient.utilisateur?.prenom || '',
      numeroSecu: patient.numeroSecu || 'N/A'
    }));
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    filteredPatients.value = [];
  } finally {
    isSearching.value = false;
  }
}, 300);

const handleSearchBlur = () => {
  setTimeout(() => { showResults.value = false }, 200)
}
const selectPatient = (patient) => {
  form.value.patient_id = patient.id;
  form.value.patientInfo = {
    nom: patient.nom,
    prenom: patient.prenom,
    numeroSecu: patient.numeroSecu
  };
  searchQuery.value = `${patient.nom} ${patient.prenom}`;
  showResults.value = false;
}
const clearPatient = () => {
  form.value.patient_id = null;
  form.value.patientInfo = { nom: '', prenom: '', numeroSecu: '' };
  searchQuery.value = '';
}

// Formulaire par défaut
const defaultForm = {
  patient_id: null,
  patientInfo: { nom: '', prenom: '', numeroSecu: '' },
  prestations: [],  // Aucun élément initial pour ne pas afficher le tableau
  paymentMethod: 'cash',
  notes: '',
  dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

const form = ref({ ...defaultForm })

// Variable pour afficher ou non le tableau des prestations
const showPrestations = ref(false);

// Totaux
const totalHT = computed(() => form.value.prestations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))
const tvaRate = 20;
const totalTVA = computed(() => (totalHT.value * tvaRate) / 100);
const totalTTC = computed(() => totalHT.value + totalTVA.value);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Gestion des prestations
const selectedTarif = ref(null);
const availablePrices = computed(() => billingStore.prices);

const openPricingModal = () => {
  console.log("Ouverture de la modale de sélection des prestations");
  showPrestations.value = true; // Affiche le tableau si non déjà affiché
  showPricingModal.value = true;
}

const showPricingModal = ref(false);

const handleSelectPrice = (price) => {
  form.value.prestations.push({
    description: price.name,
    amount: price.basePrice,
    tva: 19
  });
  showPrestations.value = true; // S'assurer que le tableau est visible
  showPricingModal.value = false;
}

const addEmptyItem = () => {
  showPrestations.value = true;
  form.value.prestations.push({ description: '', amount: 0, tva: 19 });
}

const removeItem = (index) => {
  form.value.prestations.splice(index, 1);
  if (form.value.prestations.length === 0) showPrestations.value = false;
}

const validateAmount = (event, index) => {
  const value = event.target.value;
  if (value < 0) {
    form.value.prestations[index].amount = 0;
  }
}

// Modes de paiement (optionnels)
const paymentMethods = [
  { value: 'cash', label: 'Espèces', description: 'Paiement en espèces', icon: Wallet },
  { value: 'cheque', label: 'Chèque', description: 'Paiement par chèque', icon: CreditCard }
]

// Validation globale
const isValid = computed(() => {
  return form.value.patient_id &&
    form.value.prestations.length > 0 &&
    form.value.prestations.every(item => item.description && item.amount > 0) &&
    form.value.dateEcheance;
});

// Soumission
const isSubmitting = ref(false);
const resetForm = () => {
  form.value = JSON.parse(JSON.stringify(defaultForm));
  searchQuery.value = '';
  showResults.value = false;
  showPrestations.value = false;
}
const handleSubmit = async () => {
  if (!form.value.patient_id) {
    toast.error('Veuillez sélectionner un patient');
    return;
  }
  if (!form.value.prestations.length || form.value.prestations.some(item => !item.description || !item.amount)) {
    toast.error('Veuillez remplir tous les champs des prestations');
    return;
  }
  isSubmitting.value = true;
  try {
    const invoiceData = {
      patientId: form.value.patient_id,
      dateEcheance: form.value.dateEcheance,
      details: form.value.prestations.map(item => ({
        description: item.description,
        montant: Number(item.amount)
      })),
      montant: totalTTC.value
    }
    await billingStore.createInvoice(invoiceData);
    toast.success('Facture créée avec succès');
    resetForm();
    emit('close');
    emit('refresh');
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    toast.error(error.message || 'Erreur lors de la création de la facture');
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  if (props.invoice) {
    form.value = { ...props.invoice };
  } else {
    resetForm();
  }
});
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}
.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm 
         focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white sm:text-sm;
}
.form-static {
  @apply block w-full py-2 text-sm font-medium text-gray-900 dark:text-white;
}
</style>
