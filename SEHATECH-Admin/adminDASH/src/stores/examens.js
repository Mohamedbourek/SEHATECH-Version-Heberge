import { defineStore } from 'pinia';
import axiosInstance from '@/services/axios';
import { useToast } from '@/composables/useToast';

export const useExamensStore = defineStore('examens', {
  state: () => ({
    examens: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchExamens(dossierId) {
      this.loading = true;
      try {
        const response = await axiosInstance.get(`/examens/dossier/${dossierId}`);
        this.examens = response.data;
        return this.examens;
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error('Erreur lors du chargement des examens');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async addExamen(dossierId, examenData) {
      this.loading = true;
      try {
        const toast = useToast();
        const formData = new FormData();
    
        // Traitement spécifique pour le champ "fichiers"
        if (examenData.fichiers && Array.isArray(examenData.fichiers)) {
          examenData.fichiers.forEach(file => {
            formData.append('fichiers[]', file);
          });
        }
    
        // Pour tous les autres champs, on les traite normalement
        for (const key in examenData) {
          if (key === 'fichiers') continue; // déjà traité
          if (Array.isArray(examenData[key])) {
            examenData[key].forEach(item => {
              formData.append(`${key}[]`, item);
            });
          } else {
            formData.append(key, examenData[key]);
          }
        }
    
        // Log pour vérifier le contenu du FormData (attention, on ne voit pas directement les File)
        console.log('FormData entries for examen:');
        for (const pair of formData.entries()) {
          console.log(pair[0]+ ': ', pair[1]);
        }
    
        const response = await axiosInstance.post(
          `/examens/dossier/${dossierId}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        this.examens.push(response.data.examen);
        toast.success('Examen ajouté avec succès');
        return response.data.examen;
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error("Erreur lors de l'ajout de l'examen");
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async updateExamen(id, examenData) {
      this.loading = true;
      try {
        const toast = useToast();
        const response = await axiosInstance.put(`/examens/${id}`, examenData);
        const index = this.examens.findIndex(e => e._id === id);
        if (index !== -1) {
          this.examens[index] = response.data.examen;
        }
        toast.success("Examen mis à jour avec succès");
        return response.data.examen;
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error("Erreur lors de la mise à jour de l'examen");
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async deleteExamen(id) {
      this.loading = true;
      try {
        const toast = useToast();
        await axiosInstance.delete(`/examens/${id}`);
        this.examens = this.examens.filter(e => e._id !== id);
        toast.success("Examen supprimé avec succès");
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error("Erreur lors de la suppression de l'examen");
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async deleteExamensByDossier(dossierId) {
      this.loading = true;
      try {
        const toast = useToast();
        await axiosInstance.delete(`/examens/dossier/${dossierId}`);
        this.examens = this.examens.filter(e => e.dossier_medical_id !== dossierId);
        toast.success("Examens associés supprimés avec succès");
      } catch (error) {
        this.error = error.message;
        const toast = useToast();
        toast.error("Erreur lors de la suppression des examens associés");
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
