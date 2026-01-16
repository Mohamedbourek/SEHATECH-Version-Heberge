import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'

export const useBillingStore = defineStore('billing', () => {
  const toast = useToast()
  const invoices = ref([])
  const prices = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const payments = ref([])
  const initialDataLoaded = ref(false)

  // Constantes pour les statuts de facture
  const STATUT_EN_ATTENTE = 'EN_ATTENTE'
  const STATUT_PAIEMENT_PARTIEL = 'PAIEMENT_PARTIEL'
  const STATUT_PAYEE = 'PAYEE'
  const STATUT_ANNULEE = 'ANNULEE'

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear()
    // Par exemple, en se basant sur le nombre d'invoices déjà enregistrées
    const count = invoices.value.length + 1
    return `FACT-${year}-${String(count).padStart(3, '0')}`
  }

  // Gestion centralisée des erreurs
  const handleError = (err, defaultMessage = 'Une erreur est survenue') => {
    let errorMessage = defaultMessage;
    
    if (err.response?.data?.errors) {
      errorMessage = Object.values(err.response.data.errors)
        .flat()
        .join(', ');
    } else {
      errorMessage = err.response?.data?.message || err.message || defaultMessage;
    }
    
    error.value = errorMessage;
    toast.error(errorMessage);
    console.error('Erreur:', errorMessage, err);
    throw errorMessage;
  }

  // Récupérer le token et créer la configuration pour Axios
  const getAuthConfig = () => {
    const authStore = useAuthStore()
    const token = authStore.token
    if (!token) throw new Error('Non autorisé : token manquant')
    return { headers: { 'Authorization': `Bearer ${token}` } }
  }

  const fetchInvoices = async () => {
    isLoading.value = true
    try {
      const config = getAuthConfig()
      const response = await axiosInstance.get('/facturations/factures', config)
      invoices.value = response.data.factures.map(facture => ({
        id: facture._id,
        numero: facture.numero,
        patientId: facture.patient ? facture.patient._id : null,
        patientNom: facture.patient
          ? `${facture.patient.utilisateur.nom} ${facture.patient.utilisateur.prenom}`
          : '',
        montant: facture.montant,
        montantPaye: facture.montant_paye,
        statut: facture.statut,
        dateEmission: facture.dateEmission,
        dateEcheance: facture.dateEcheance,
        datePaiement: facture.datePaiement,
        dateAnnulation: facture.dateAnnulation || null,
        details: facture.details
      }))
      initialDataLoaded.value = true
      return invoices.value
    } catch (err) {
      handleError(err, 'Erreur lors du chargement des factures')
    } finally {
      isLoading.value = false
    }
  }

  const markAsPaid = async (invoiceId) => {
    try {
      const config = getAuthConfig()
      const response = await axiosInstance.put(`/facturations/factures/${invoiceId}/paid`, null, config)
      const updatedInvoice = response.data.facture
      const index = invoices.value.findIndex(inv => inv.id === invoiceId)
      if (index !== -1) {
        invoices.value[index] = {
          ...invoices.value[index],
          statut: updatedInvoice.statut,
          datePaiement: updatedInvoice.datePaiement,
          montantPaye: updatedInvoice.montant_paye
        }
      }
      return updatedInvoice
    } catch (err) {
      handleError(err, 'Erreur lors du marquage comme payée')
    }
  }

  const deleteInvoice = async (invoiceId) => {
    try {
      const config = getAuthConfig()
      await axiosInstance.delete(`/facturations/factures/${invoiceId}`, config)
      invoices.value = invoices.value.filter(inv => inv.id !== invoiceId)
      toast.success('Facture supprimée avec succès')
    } catch (err) {
      handleError(err, 'Erreur lors de la suppression de la facture')
    }
  }

  const cancelInvoice = async (invoiceId) => {
    try {
      const config = getAuthConfig()
      const response = await axiosInstance.put(`/facturations/factures/${invoiceId}/cancel`, null, config)
      const updatedInvoice = response.data.facture
      const index = invoices.value.findIndex(inv => inv.id === invoiceId)
      if (index !== -1) {
        invoices.value[index] = {
          ...invoices.value[index],
          statut: updatedInvoice.statut,
          dateAnnulation: updatedInvoice.dateAnnulation
        }
      }
      return updatedInvoice
    } catch (err) {
      handleError(err, 'Erreur lors de l\'annulation de la facture')
    }
  }

  const fetchPrices = async () => {
    isLoading.value = true
    try {
      const config = getAuthConfig()
      const response = await axiosInstance.get('/facturations/prices', config)
      if (!response.data) {
        throw new Error('Aucune donnée reçue du serveur')
      }
      // Ici, response.data est directement un tableau d'objets
      const pricesData = response.data
      prices.value = pricesData.map(price => ({
        id: price._id,
        name: price.name,              
        category: price.category,      
        basePrice: price.basePrice,    
        insurancePrice: price.insurancePrice, 
        description: price.description
      }))
      return prices.value
    } catch (err) {
      handleError(err, 'Erreur lors du chargement des prix')
    } finally {
      isLoading.value = false
    }
  }
  

  const createInvoice = async (invoiceData) => {
    try {
      const errors = validateInvoice(invoiceData)
      if (errors.length) throw new Error(errors.join(', '))

      const config = getAuthConfig()
      // Ajout du Content-Type si nécessaire
      config.headers['Content-Type'] = 'application/json'

      const payload = {
        patient_id: invoiceData.patientId,
        montant: invoiceData.montant,
        dateEcheance: invoiceData.dateEcheance,
        details: invoiceData.details.map(item => ({
          description: item.description,
          montant: Number(item.montant)
        }))
      }

      const response = await axiosInstance.post('/facturations/factures', payload, config)
      const facture = response.data.facture

      const newInvoice = {
        id: facture._id,
        numero: facture.numero,
        patientId: facture.patient ? facture.patient._id : null,
        patientNom: facture.patient
          ? `${facture.patient.utilisateur.nom} ${facture.patient.utilisateur.prenom}`
          : '',
        montant: facture.montant,
        montantPaye: facture.montant_paye || 0,
        statut: facture.statut,
        dateEmission: facture.dateEmission,
        dateEcheance: facture.dateEcheance,
        datePaiement: facture.datePaiement || null,
        details: facture.details
      }

      invoices.value = [...invoices.value, newInvoice]
      return newInvoice
    } catch (err) {
      handleError(err, 'Erreur lors de la création de la facture')
    }
  }

  const getInvoicePayments = async (invoiceId) => {
    try {
      const config = getAuthConfig()
      const response = await axiosInstance.get(`/facturations/factures/${invoiceId}/paiements`, config)
      payments.value = response.data.map(payment => ({
        id: payment._id,
        invoiceId: payment.facture_id,
        amount: payment.montant,
        method: payment.method,
        reference: payment.reference,
        date: payment.date,
        notes: payment.notes,
        administrateur: payment.administrateur?.utilisateur
      }))
      return payments.value
    } catch (err) {
      handleError(err, 'Erreur lors du chargement des paiements')
    }
  }

  const recordPayment = async (invoiceId, paymentData) => {
    try {
      const invoice = invoices.value.find(inv => inv.id === invoiceId)
      if (!invoice) throw new Error('Facture non trouvée')
  
      const config = getAuthConfig()
      // Convertir paymentData.date en chaîne ISO s'il s'agit d'une valeur de type Date ou réactive
      const dateValue = paymentData.date ? new Date(paymentData.date).toISOString() : new Date().toISOString()
  
      const payload = {
        montant: paymentData.amount,
        method: paymentData.method,
        reference: paymentData.reference,
        date: dateValue,
        notes: paymentData.notes
      }
  
      const response = await axiosInstance.post(`/facturations/factures/${invoiceId}/paiements`, payload, config)
      await getInvoicePayments(invoiceId)
      const updatedInvoice = response.data.facture
      const index = invoices.value.findIndex(inv => inv.id === invoiceId)
      if (index !== -1) {
        invoices.value[index] = {
          ...invoices.value[index],
          statut: updatedInvoice.statut,
          datePaiement: updatedInvoice.datePaiement,
          montantPaye: updatedInvoice.montant_paye
        }
      }
      return response.data.paiement
    } catch (err) {
      handleError(err, 'Erreur lors de l\'enregistrement du paiement')
    }
  }

  // Fonction de validation des données de facture avant envoi à l'API
  const validateInvoice = (invoiceData) => {
    const errors = []
    if (!invoiceData.patientId) errors.push('Patient manquant')
    if (!invoiceData.montant || isNaN(invoiceData.montant)) errors.push('Montant invalide')
    if (!invoiceData.dateEcheance) errors.push('Date d\'échéance manquante')
    if (!invoiceData.details || !Array.isArray(invoiceData.details) || invoiceData.details.length === 0) {
      errors.push('Détails de la facture requis')
    } else {
      invoiceData.details.forEach((item, index) => {
        if (!item.description) errors.push(`Description manquante pour le détail ${index + 1}`)
        if (!item.montant || isNaN(item.montant)) errors.push(`Montant invalide pour le détail ${index + 1}`)
      })
    }
    return errors
  }

  const updatePrice = async (priceId, priceData) => {
    try {
      const config = getAuthConfig()
      const response = await axiosInstance.put(`/facturations/prices/${priceId}`, priceData, config)
      const index = prices.value.findIndex(p => p.id === priceId)
      if (index !== -1) {
        prices.value[index] = {
          ...prices.value[index],
          ...priceData
        }
      }
      return response.data
    } catch (err) {
      handleError(err, 'Erreur lors de la mise à jour du tarif')
    }
  }

  const deletePrice = async (priceId) => {
    try {
      const config = getAuthConfig()
      await axiosInstance.delete(`/facturations/prices/${priceId}`, config)
      prices.value = prices.value.filter(p => p.id !== priceId)
      return true
    } catch (err) {
      handleError(err, 'Erreur lors de la suppression du tarif')
    }
  }

  const createPrice = async (priceData) => {
    try {
      const config = getAuthConfig()
      const payload = {
        nom: priceData.nom,
        categorie: priceData.categorie,
        prixBase: Number(priceData.prixBase),
        prixAssurance: Number(priceData.prixAssurance),
        description: priceData.description
      };
      const response = await axiosInstance.post('/facturations/prices', payload, config)
      const newPrice = {
        id: response.data._id,
        name: response.data.nom,
        category: response.data.categorie,
        basePrice: response.data.prixBase,
        insurancePrice: response.data.prixAssurance,
        description: response.data.description
      }
      prices.value = [...prices.value, newPrice]
      return newPrice
    } catch (err) {
      handleError(err, 'Erreur lors de la création du tarif')
    }
  }

  const generatePDF = async (invoiceId) => {
    try {
      const config = getAuthConfig()
      const response = await axiosInstance.get(`/facturations/factures/${invoiceId}/pdf`, {
        ...config,
        responseType: 'blob'
      })

      if (!response.data || response.status !== 200) {
        throw new Error('Invalid PDF response from server')
      }
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' })
      console.log('PDF blob received:', blob)
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Open the PDF in a new window
      console.log('PDF URL created:', url)
      window.open(url)
      
      // Clean up the URL object after opening
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 100)
      
      return url
    } catch (err) {
      handleError(err, 'Erreur lors de l\'impression de la facture')
    }
  }

  return {
    invoices,
    prices,
    isLoading,
    error,
    payments,
    initialDataLoaded,
    generateInvoiceNumber,
    fetchInvoices,
    fetchPrices,
    createInvoice,
    getInvoicePayments,
    recordPayment,
    markAsPaid,
    cancelInvoice,
    updatePrice,
    deletePrice,
    createPrice,
    deleteInvoice,
    generatePDF
  }
}, {
  persist: {
    key: 'billing-store',
    storage: localStorage,
    paths: ['invoices', 'payments', 'prices', 'initialDataLoaded']
  }
})
