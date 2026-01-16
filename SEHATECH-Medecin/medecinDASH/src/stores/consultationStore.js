import { defineStore } from 'pinia'
import axiosInstance from '@/services/axios'

// Fonction utilitaire pour valider et formater les dates
const formatDateSafely = (dateValue) => {
  if (!dateValue) return null
  try {
    const date = new Date(dateValue)
    // Vérifier si la date est valide
    return date instanceof Date && !isNaN(date.getTime()) ? date.toISOString() : null
  } catch (error) {
    console.warn('Date invalide:', dateValue)
    return null
  }
}

export const useConsultationStore = defineStore('consultations', {
  state: () => ({
    consultations: [],
    loading: false,
    error: null
  }),

  getters: {
    getConsultationsByDossier: (state) => (dossierId) => {
      console.log('Getter getConsultationsByDossier appelé avec dossierId:', dossierId)
      const filteredConsultations = state.consultations.filter(c => c.dossier_id === dossierId)
      console.log('Consultations filtrées:', filteredConsultations)
      return filteredConsultations
    }
  },

  actions: {
    async fetchConsultations(dossierId) {
      console.log('Début de la récupération des consultations')
      this.loading = true
      this.error = null
      
      try {
        let consultationsData = [];
        
        // Essayer directement l'endpoint principal des consultations
        try {
          console.log('Tentative de récupération des consultations via l\'endpoint principal');
          const response = await axiosInstance.get(`/consultations/dossier/${dossierId}`);
          
            if (response.data && Array.isArray(response.data)) {
              consultationsData = response.data;
            console.log(`${consultationsData.length} consultations récupérées depuis l'endpoint principal`);
            } else if (response.data && response.data.consultations && Array.isArray(response.data.consultations)) {
              consultationsData = response.data.consultations;
            console.log(`${consultationsData.length} consultations récupérées depuis l'endpoint principal (format .consultations)`);
          }
        } catch (error) {
          console.warn("L'endpoint principal des consultations n'est pas disponible:", error.message);
          
          // Récupérer les consultations à partir des dossiers médicaux
          try {
            console.log('Tentative de récupération des consultations via les dossiers médicaux');
            const dossiersResponse = await axiosInstance.get('/dossiers-medicaux/patients');
              
              if (dossiersResponse.data && Array.isArray(dossiersResponse.data) && dossiersResponse.data.length > 0) {
                console.log(`${dossiersResponse.data.length} dossiers médicaux trouvés`);
                
              // Pour chaque dossier, récupérer ses consultations
              const consultationsPromises = dossiersResponse.data.map(async (dossier) => {
                try {
                  const url = `/consultations/dossier/${dossier._id}`;
                  console.log(`Récupération des consultations pour le dossier ${dossier._id}`);
                  
                  const response = await axiosInstance.get(url);
                  
                  if (response.data && Array.isArray(response.data)) {
                    return response.data;
                  } else if (response.data && response.data.consultations && Array.isArray(response.data.consultations)) {
                    return response.data.consultations;
                  } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    return response.data.data;
                    }
                    return [];
                  } catch (err) {
                    console.warn(`Erreur lors de la récupération des consultations du dossier ${dossier._id}:`, err.message);
                    return [];
                  }
                });
                
              const consultationsResults = await Promise.all(consultationsPromises);
              consultationsData = consultationsResults.flat();
              console.log(`Total de ${consultationsData.length} consultations récupérées via les dossiers`);
              } else {
              console.warn('Aucun dossier médical trouvé');
            }
          } catch (secondaryError) {
            console.warn('Erreur lors de la récupération des dossiers médicaux:', secondaryError.message);
            
            // Tentative désespérée: Essayer directement avec un ID de dossier fictif pour voir si l'API renvoie toutes les consultations
            try {
              console.log('Dernier essai: tentative avec un ID de dossier générique');
              const response = await axiosInstance.get('/consultations/dossier/all');
              
              if (response.data && Array.isArray(response.data)) {
                consultationsData = response.data;
                console.log(`${consultationsData.length} consultations récupérées via l'endpoint générique`);
              }
            } catch (lastError) {
              console.warn('Toutes les tentatives ont échoué');
            }
          }
        }
        
        // Transformer les données et mettre à jour le state
       // console.log(`${consultationsData.length} consultations récupérées au total`);
        console.log('Données brutes des consultations:', consultationsData);
        
        this.consultations = consultationsData.map(consultation => ({
          _id: consultation._id,
        
          // on garde les deux champs
          dossier_id:           consultation.dossier_id ?? null,
          dossier_medical_id:   consultation.dossier_medical_id ?? consultation.dossier_id ?? null,
        
          patient_id:           consultation.patient_id,
          motifConsultation:    consultation.motifConsultation,
          observations:         consultation.observations,
          diagnostic:           consultation.diagnostic,
        
          dateConsultation:     formatDateSafely(consultation.dateConsultation),
        
          medecin_id:           consultation.medecin_id,
          medecin: consultation.medecin_id
            ? {
                id:          consultation.medecin_id,
                nom:         consultation.medecin?.utilisateur?.nom || consultation.medecin?.nom || 'Non spécifié',
                prenom:      consultation.medecin?.utilisateur?.prenom || consultation.medecin?.prenom || '',
                specialite:  consultation.medecin?.specialite || 'Non spécifiée'
              }
            : null,
        
          created_at:           formatDateSafely(consultation.created_at),
          updated_at:           formatDateSafely(consultation.updated_at)
        }));
        
        console.log('Consultations transformées et stockées:', this.consultations.length);
        return this.consultations;
      } catch (error) {
        console.error('Erreur lors de la récupération des consultations:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        this.error = error.message;
        return [];
      } finally {
        this.loading = false;
      }
    },

    // Alias pour maintenir la compatibilité
    async fetchConsultationsByDossier(dossierId) {
      return this.fetchConsultations(dossierId)
    },

    // Nouvelle méthode pour récupérer les consultations directement depuis le dossier médical
    async fetchConsultationsFromDossierMedical(dossierMedical) {
      if (!dossierMedical || !dossierMedical.consultations) {
        console.warn('Dossier médical invalide ou sans consultations')
        return []
      }

      console.log('Récupération des consultations depuis le dossier médical:', dossierMedical._id)
      console.log('Consultations brutes du dossier:', dossierMedical.consultations)
      // Transformer les consultations du dossier médical au format attendu
      const consultationsTransformees = dossierMedical.consultations.map(consultation => {
        // Vérifier et formater la date de consultation
        let dateConsultation = null;
        try {
          const date = new Date(consultation.dateConsultation);
          if (!isNaN(date.getTime())) {
            dateConsultation = date.toISOString();
          }
        } catch (error) {
          console.warn('Date de consultation invalide:', consultation.dateConsultation);
        }

        // Vérifier et formater les dates created_at et updated_at
        let createdAt = null;
        try {
          if (consultation.created_at) {
            const date = new Date(consultation.created_at);
            if (!isNaN(date.getTime())) {
              createdAt = date.toISOString();
            }
          }
        } catch (error) {
          console.warn('Date created_at invalide:', consultation.created_at);
        }

        let updatedAt = null;
        try {
          if (consultation.updated_at) {
            const date = new Date(consultation.updated_at);
            if (!isNaN(date.getTime())) {
              updatedAt = date.toISOString();
            }
          }
        } catch (error) {
          console.warn('Date updated_at invalide:', consultation.updated_at);
        }

        return {
          _id: consultation._id,
          dossier_id: dossierMedical._id,
          dossier_medical_id: dossierMedical._id,
          date: consultation.date || new Date().toISOString(),
          motif: consultation.motif,
          observations: consultation.observations || '',
          diagnostic: consultation.diagnostic || '',
          medecin: consultation.medecin_id ? {
            id: consultation.medecin_id,
            nom: consultation.medecin?.utilisateur?.nom || 'Non spécifié',
            prenom: consultation.medecin?.utilisateur?.prenom || '',
            specialite: consultation.medecin?.specialite || 'Non spécifiée'
          } : null,
          created_at: createdAt || new Date().toISOString(),
          updated_at: updatedAt || new Date().toISOString()
        };
      });

      // Mettre à jour le state avec ces consultations
      this.consultations = consultationsTransformees
      return consultationsTransformees
    },

    async createConsultation(data) {
      this.loading = true;
      this.error = null;

      try {
        console.log('Création d\'une consultation avec les données:', data);

        // Vérifier la présence des informations requises
        if (!data.dossier_id && !data.patient_id) {
          throw new Error('La consultation doit être associée soit à un dossier médical, soit à un patient');
        }

        // Normaliser les données
        const consultationData = {
          dossier_id:           data.dossier_id,
          dossier_medical_id:   data.dossier_id,
          patient_id: data.patient_id,
          motifConsultation: data.motifConsultation,
          observations: data.observations || '',
          diagnostic: data.diagnostic || '',
          medecin_id: data.medecin_id || localStorage.getItem('USER_ID'),
          date: data.date || new Date().toISOString()
        };

        console.log('Données normalisées pour la création:', consultationData);

        // Vérifier quelle route utiliser en fonction des données disponibles
        let url;
        if (data.dossier_id) {
          url = `/consultations/dossier/${data.dossier_id}`;
          console.log(`Utilisation de l'endpoint avec dossier: ${url}`);
        } else {
          // Si pas de dossier_id, essayer l'endpoint patient ou générique
          url = data.patient_id ? `/consultations/patient/${data.patient_id}` : '/consultations';
          console.log(`Utilisation de l'endpoint sans dossier: ${url}`);
        }

        const response = await axiosInstance.post(url, consultationData);
        console.log('Réponse de la création:', response.status, response.data);

        // Créer un nouvel objet consultation formaté
        const newConsultation = {
          _id: response.data._id || response.data.id,
          dossier_id: data.dossier_id,
          patient_id: data.patient_id,
          motifConsultation: data.motifConsultation || data.motif || 'Non spécifié',
          observations: data.observations || '',
          diagnostic: data.diagnostic || '',
          date: formatDateSafely(data.date || new Date().toISOString()),
          medecin: data.medecin_id ? {
            id: data.medecin_id,
            nom: data.medecin?.nom || 'Non spécifié',
            prenom: data.medecin?.prenom || '',
            specialite: data.medecin?.specialite || 'Non spécifiée'
          } : null,
          created_at: formatDateSafely(new Date().toISOString()),
          updated_at: formatDateSafely(new Date().toISOString())
        };

        // Ajouter la nouvelle consultation au state
        this.consultations.push(newConsultation);
        console.log('Nouvelle consultation ajoutée au store:', newConsultation);

        return newConsultation;
      } catch (error) {
        console.error('Erreur lors de la création de la consultation:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateConsultation(consultationId, data) {
      this.loading = true
      this.error = null
      try {
        // Préparer les données pour l'API
        const updateData = {}
        
        // Ajouter uniquement les champs fournis
        if (data.motifConsultation !== undefined) updateData.motifConsultation = data.motifConsultation;
        if (data.observations !== undefined) updateData.observations = data.observations
        if (data.diagnostic !== undefined) updateData.diagnostic = data.diagnostic
        if (data.dossier_id       !== undefined) updateData.dossier_id       = data.dossier_id;
if (data.dossier_medical_id !== undefined) updateData.dossier_medical_id = data.dossier_medical_id;
        const response = await axiosInstance.put(`/consultations/${consultationId}`, updateData)
        
        // Vérifier le format de la réponse
        let updatedConsultationData = {}
        if (response.data && response.data.consultation) {
          // Format {consultation: {...}}
          updatedConsultationData = response.data.consultation
        } else {
          // Format direct {...}
          updatedConsultationData = response.data
        }

        const updatedConsultation = {
          ...updatedConsultationData,
          _id: updatedConsultationData._id,
          dossier_id:         updatedConsultationData.dossier_id,
          dossier_medical_id: updatedConsultationData.dossier_medical_id ?? updatedConsultationData.dossier_id,
          dateConsultation: new Date(updatedConsultationData.dateConsultation).toISOString(),
          motifConsultation: updatedConsultationData.motifConsultation,
          observations: updatedConsultationData.observations || '',
          diagnostic: updatedConsultationData.diagnostic || '',
          medecin: updatedConsultationData.medecin_id ? {
            id: updatedConsultationData.medecin_id,
            nom: updatedConsultationData.medecin?.utilisateur?.nom || 'Non spécifié',
            prenom: updatedConsultationData.medecin?.utilisateur?.prenom || '',
            specialite: updatedConsultationData.medecin?.specialite || 'Non spécifiée'
          } : null,
          updated_at: new Date().toISOString()
        }

        const index = this.consultations.findIndex(c => c._id === consultationId)
        if (index !== -1) {
          this.consultations[index] = updatedConsultation
        }

        return updatedConsultation
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la consultation:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteConsultation(consultationId) {
      this.loading = true
      this.error = null
      try {
        await axiosInstance.delete(`/consultations/${consultationId}`)
        this.consultations = this.consultations.filter(c => c._id !== consultationId)
        return { success: true, message: 'Consultation supprimée avec succès' }
      } catch (error) {
        console.error('Erreur lors de la suppression de la consultation:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateMultipleConsultations(consultations) {
      this.loading = true
      this.error = null
      try {
        const updatePromises = consultations.map(consultation => {
          if (consultation.isModified) {
            return this.updateConsultation(consultation._id, {
              motifConsultation: consultation.motifConsultation,
              observations: consultation.observations,
              diagnostic: consultation.diagnostic
            })
          }
          return Promise.resolve()
        })
        
        const results = await Promise.all(updatePromises)
        return results.filter(Boolean) // Filtrer les résultats null/undefined
      } catch (error) {
        console.error('Erreur lors de la mise à jour multiple des consultations:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})