import { defineStore } from 'pinia';
import axiosInstance from '@/services/axios'; // Utilise l'instance configurée
import { useToast } from '@/composables/useToast';

export const useConsultationsStore = defineStore('consultations', {
  state: () => ({
    consultations: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchConsultations() {
      this.loading = true;
      try {
        const response = await axiosInstance.get('/consultations');
        this.consultations = response.data;
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error('Erreur lors du chargement des consultations');
      } finally {
        this.loading = false;
      }
    },

    async addConsultation(dossierId, consultationData) {
      this.loading = true;
      try {
        const toast = useToast();
        // Utilise la route définie pour l'ajout d'une consultation
        const response = await axiosInstance.post(`/consultations/dossier/${dossierId}`, consultationData);
        // Supposons que le backend renvoie { consultation: { ... } }
        this.consultations.push(response.data.consultation);
        toast.success('Consultation ajoutée avec succès');
        return response.data.consultation;
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error("Erreur lors de l'ajout de la consultation");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateConsultation(id, consultationData) {
      this.loading = true;
      try {
        const toast = useToast();
        const response = await axiosInstance.put(`/consultations/${id}`, consultationData);
        const index = this.consultations.findIndex(c => c._id === id);
        if (index !== -1) {
          this.consultations[index] = response.data.consultation;
        }
        toast.success('Consultation mise à jour avec succès');
        return response.data.consultation;
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error("Erreur lors de la mise à jour de la consultation");
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteConsultation(id) {
      this.loading = true;
      try {
        const toast = useToast();
        await axiosInstance.delete(`/consultations/${id}`);
        this.consultations = this.consultations.filter(c => c._id !== id);
        toast.success('Consultation supprimée avec succès');
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error("Erreur lors de la suppression de la consultation");
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
