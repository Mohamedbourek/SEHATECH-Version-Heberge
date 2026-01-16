<template>
  <BaseModal
    title="Enregistrer un paiement"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Informations de la facture -->
      <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Numéro de facture</p>
            <p class="mt-1 text-sm font-medium">{{ invoice.numero }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Montant total</p>
            <p class="mt-1 text-sm font-medium">{{ formatCurrency(invoice.montant) }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Déjà payé</p>
            <p class="mt-1 text-sm">{{ formatCurrency(invoice.montantPaye) }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Reste à payer</p>
            <p class="mt-1 text-sm font-medium text-primary-600">
              {{ formatCurrency(remainingAmount) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Formulaire de paiement -->
      <div class="space-y-4">
        <!-- Montant -->
        <div>
          <label class="form-label" for="payment-amount">Montant du paiement</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              DA
            </span>
            <input
              id="payment-amount"
              v-model.number="form.montant"
              type="number"
              min="0"
              :max="remainingAmount"
              step="0.01"
              class="form-input pl-12"
              required
              @input="validateAmount"
            />
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Le montant ne peut pas dépasser {{ formatCurrency(remainingAmount) }}
          </p>
        </div>

        <!-- Mode de paiement -->
        <div>
          <label class="form-label" for="payment-method">Mode de paiement</label>
          <select
            id="payment-method"
            v-model="form.method"
            class="form-select"
            required
          >
            <option value="">Sélectionner un mode de paiement</option>
            <option value="cib">Carte CIB</option>
            <option value="cash">Espèces</option>
            <option value="cheque">Chèque</option>
            <option value="virement">Virement bancaire</option>
          </select>
        </div>

        <!-- Référence -->
        <div>
          <label class="form-label" for="payment-reference">Référence</label>
          <input
            id="payment-reference"
            v-model="form.reference"
            type="text"
            class="form-input"
            :placeholder="getReferencePlaceholder(form.method)"
            required
          />
        </div>

        <!-- Date -->
        <div>
          <label class="form-label" for="payment-date">Date du paiement</label>
          <input
            id="payment-date"
            v-model="form.date"
            type="date"
            class="form-input"
            :max="today"
            required
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="form-label" for="payment-notes">Notes (optionnel)</label>
          <textarea
            id="payment-notes"
            v-model="form.notes"
            class="form-textarea"
            rows="3"
            placeholder="Informations complémentaires..."
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          class="btn btn-outline"
          @click="$emit('close')"
        >
          Annuler
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isValid || isSubmitting"
        >
          <Loader2
            v-if="isSubmitting"
            class="w-4 h-4 mr-2 animate-spin"
          />
          Enregistrer le paiement
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatCurrency } from '@/utils/currency'
import { useBillingStore } from '@/stores/billing'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  invoice: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'payment-recorded'])
const billingStore = useBillingStore()
const toast = useToast()
const isSubmitting = ref(false)

const form = ref({
  montant: 0,
  method: '',
  reference: '',
  date: new Date().toISOString().split('T')[0],
  notes: ''
})

const today = new Date().toISOString().split('T')[0]

const remainingAmount = computed(() => {
  return props.invoice.montant - props.invoice.montantPaye
})

const isValid = computed(() => {
  return form.value.montant > 0 &&
    form.value.montant <= remainingAmount.value &&
    form.value.method &&
    form.value.reference &&
    form.value.date
})

const getReferencePlaceholder = (method) => {
  const placeholders = {
    cib: 'Numéro de transaction CIB',
    cash: 'Numéro de reçu',
    cheque: 'Numéro du chèque',
    virement: 'Référence du virement'
  }
  return placeholders[method] || 'Référence du paiement'
}

const validateAmount = () => {
  if (form.value.montant > remainingAmount.value) {
    form.value.montant = remainingAmount.value
  }
  if (form.value.montant < 0) {
    form.value.montant = 0
  }
}

const handleSubmit = async () => {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const paymentData = {
      amount: Number(form.value.montant),
      method: form.value.method,
      reference: form.value.reference,
      date: form.value.date,
      notes: form.value.notes
    }

    await billingStore.recordPayment(props.invoice.id, paymentData)
    emit('payment-recorded')
    emit('close')
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error)
    toast.error(error.message || 'Erreur lors de l\'enregistrement du paiement')
  } finally {
    isSubmitting.value = false
  }
}
</script>
