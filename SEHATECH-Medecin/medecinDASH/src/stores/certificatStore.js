import { defineStore } from 'pinia'
import axiosInstance from '@/services/axios'
import { useUserStore } from './user'
// Fonction utilitaire pour formater les dates de manière sécurisée
function formatDateSafely(dateValue) {
  if (!dateValue) return null
  try {
    const date = new Date(dateValue)
    // Vérifier si la date est valide
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString()
    } else {
      console.warn('Date invalide:', dateValue)
      return null
    }
  } catch (error) {
    console.warn('Erreur lors du formatage de la date:', dateValue, error)
    return null
  }
}

export const useCertificatStore = defineStore('certificat', {
  state: () => ({
    certificats: [],
    loading: false,
    error: null
  }),

  getters: {
    getCertificatsByPatient: (state) => (patientId) => {
      console.log('Getter getCertificatsByPatient appelé avec patientId:', patientId)
      const filteredCertificats = state.certificats.filter(c => c.patient_id === patientId)
      console.log('Certificats filtrés:', filteredCertificats)
      return filteredCertificats
    },
    
    getActiveCertificats: (state) => {
      const now = new Date()
      return state.certificats.filter(certificat => {
        // Si pas de dates, considéré comme actif
        if (!certificat.dateDebut || !certificat.dateFin) {
          return certificat.statut === 'actif'
        }
        
        const dateDebut = new Date(certificat.dateDebut)
        const dateFin = new Date(certificat.dateFin)
        return dateDebut <= now && dateFin >= now && certificat.statut === 'actif'
      })
    }
  },

  actions: {
    async fetchCertificats(params = {}) {
      console.log('Début de la récupération des certificats', params)
      this.loading = true
      this.error = null
      
      try {
        const userStore = useUserStore()
        await userStore.fetchUserInfo()
        const medecinId = userStore.user?.medecin?._id
        
        if (medecinId) {
          params.medecin_id = medecinId
        }
        // Construire l'URL et les paramètres
        const url = '/certificats'
        console.log('URL de la requête pour les certificats:', url, 'avec params:', params)
        
        const response = await axiosInstance.get(url, { params })
        console.log('Réponse du serveur pour les certificats:', response.status)
        
        // Vérifier le format de la réponse et extraire les données
        let certificatsData = []
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Format direct [...]
            certificatsData = response.data
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Format {success: true, data: [...]}
            certificatsData = response.data.data
          } else if (response.data.certificats && Array.isArray(response.data.certificats)) {
            // Format {certificats: [...]}
            certificatsData = response.data.certificats
          } else {
            console.warn('Format de réponse inattendu pour les certificats:', response.data)
          }
        } else {
          console.warn('Réponse vide pour les certificats')
        }
        
        console.log(`${certificatsData.length} certificats récupérés`)
        
        // Transformer les données et mettre à jour le state
        this.certificats = certificatsData.map(certificat => this.formatCertificat(certificat))
        
        return this.certificats
      } catch (error) {
        console.error('Erreur lors de la récupération des certificats:', error)
        this.error = error.message
        this.certificats = []
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCertificatsByPatient(patientId) {
      console.log('Fetching certificats pour le patient:', patientId)
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.get(`/certificats/patient/${patientId}`)
        console.log('Réponse brute du serveur:', response.data)
        
        // Vérifier si la réponse est au format attendu
        let certificatsData = []
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // Format {success: true, data: [...]}
          certificatsData = response.data.data
        } else if (Array.isArray(response.data)) {
          // Format direct [...]
          certificatsData = response.data
        } else {
          console.warn('Format de réponse inattendu:', response.data)
          return []
        }

        const patientCertificats = certificatsData.map(certificat => this.formatCertificat(certificat))
        
        // Mettre à jour le state avec ces certificats
        // Remplacer les certificats existants avec le même ID
        patientCertificats.forEach(certificat => {
          const index = this.certificats.findIndex(c => c._id === certificat._id)
      if (index !== -1) {
            this.certificats[index] = certificat
          } else {
            this.certificats.push(certificat)
          }
        })
        
        return patientCertificats
      } catch (error) {
        console.error('Erreur lors de la récupération des certificats du patient:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchActiveCertificatsByPatient(patientId) {
      console.log('Fetching certificats actifs pour le patient:', patientId)
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.get(`/certificats/patient/${patientId}/actifs`)
        console.log('Réponse brute du serveur:', response.data)
        
        // Vérifier si la réponse est au format attendu
        let certificatsData = []
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // Format {success: true, data: [...]}
          certificatsData = response.data.data
        } else if (Array.isArray(response.data)) {
          // Format direct [...]
          certificatsData = response.data
        } else {
          console.warn('Format de réponse inattendu:', response.data)
          return []
        }

        const activeCertificats = certificatsData.map(certificat => this.formatCertificat(certificat))
        
        // Mettre à jour le state avec ces certificats actifs
        // Remplacer les certificats existants avec le même ID
        activeCertificats.forEach(certificat => {
          const index = this.certificats.findIndex(c => c._id === certificat._id)
          if (index !== -1) {
            this.certificats[index] = certificat
          } else {
            this.certificats.push(certificat)
          }
        })
        
        return activeCertificats
      } catch (error) {
        console.error('Erreur lors de la récupération des certificats actifs:', error)
        this.error = error.message
        throw error
    } finally {
        this.loading = false
      }
    },

    formatCertificat(certificat) {
      if (!certificat) {
        console.warn('Tentative de formatage d\'un certificat null ou undefined')
        return {
          _id: null,
          type: 'Non spécifié',
          motif: '',
          contenu: '',
          dateDebut: null,
          dateFin: null,
          patient_id: null,
          medecin_id: null,
          statut: 'actif',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          patient: null,
          medecin: null
        }
      }

      return {
        _id: certificat._id || certificat.id,
        type: certificat.type || 'Non spécifié',
        motif: certificat.motif || '',
        contenu: certificat.contenu || '',
        dateDebut: formatDateSafely(certificat.dateDebut),
        dateFin: formatDateSafely(certificat.dateFin),
        patient_id: certificat.patient_id,
        medecin_id: certificat.medecin_id,
        statut: certificat.statut || 'actif',
        created_at: formatDateSafely(certificat.created_at),
        updated_at: formatDateSafely(certificat.updated_at),
        patient: certificat.patient ? {
          id: certificat.patient._id || certificat.patient.id,
          nom: certificat.patient.nom || certificat.patient.utilisateur?.nom || 'Non spécifié',
          prenom: certificat.patient.prenom || certificat.patient.utilisateur?.prenom || ''
        } : null,
        medecin: certificat.medecin ? {
          id: certificat.medecin._id || certificat.medecin.id,
          nom: certificat.medecin.nom || certificat.medecin.utilisateur?.nom || 'Non spécifié',
          prenom: certificat.medecin.prenom || certificat.medecin.utilisateur?.prenom || '',
          specialite: certificat.medecin.specialite || 'Non spécifiée'
        } : null
      }
    },

    async createCertificat(data) {
      this.loading = true
      this.error = null
      
      try {
        console.log('Création d\'un nouveau certificat avec les données:', data)
        console.log('Vérification des données requises:', {
          patient_id: !!data.patient_id,
          type: !!data.type,
          motif: !!data.motif,
          contenu: !!data.contenu
        })
        
        if (!data.patient_id) {
          throw new Error('ID du patient manquant')
        }
        
        if (!data.type) {
          throw new Error('Type du certificat manquant')
        }
        
        if (!data.motif) {
          throw new Error('Motif du certificat manquant')
        }
        
        if (!data.contenu) {
          throw new Error('Contenu du certificat manquant')
        }
        
        // Vérifier si un certificat similaire existe déjà
        const existingCertificat = this.certificats.find(cert => 
          cert.patient_id === data.patient_id && 
          cert.type === data.type && 
          cert.motif === data.motif &&
          cert.contenu === data.contenu
        );
        
        if (existingCertificat) {
          console.warn('Un certificat similaire existe déjà:', existingCertificat);
          return existingCertificat;
        }
        
        // Préparer les données pour l'API
        const certificatData = {
          patient_id: data.patient_id,
          type: data.type,
          motif: data.motif,
          contenu: data.contenu,
          dateDebut: data.dateDebut || null,
          dateFin: data.dateFin || null,
          statut: data.statut || 'actif'
        }
        
        console.log('Données à envoyer à l\'API:', certificatData)
        
        try {
          // Utiliser la route appropriée du backend
          const response = await axiosInstance.post('/certificats', certificatData)
          console.log('Réponse de l\'API:', response.data)
          
          // Vérifier le format de la réponse
          let newCertificatData = {}
          if (response.data && response.data.success && response.data.data) {
            // Format {success: true, data: {...}}
            newCertificatData = response.data.data
          } else if (response.data && response.data.certificat) {
            // Format {certificat: {...}}
            newCertificatData = response.data.certificat
          } else {
            // Format direct {...}
            newCertificatData = response.data
          }
          
          const newCertificat = this.formatCertificat(newCertificatData)
          
          this.certificats.unshift(newCertificat)
          return newCertificat
        } catch (apiError) {
          console.error('Erreur API lors de la création du certificat:', apiError)
          
          // Extraire les détails de l'erreur de validation si disponibles
          if (apiError.response && apiError.response.data) {
            console.error('Détails de l\'erreur API:', apiError.response.data)
            
            if (apiError.response.data.errors) {
              const errorMessages = Object.values(apiError.response.data.errors)
                .flat()
                .join(', ')
              throw new Error(errorMessages || apiError.response.data.message || 'Erreur de validation')
            } else if (apiError.response.data.message) {
              throw new Error(apiError.response.data.message)
            }
          }
          
          throw apiError
        }
      } catch (error) {
        console.error('Erreur lors de la création du certificat:', error)
        console.error('Détails de l\'erreur:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateCertificat(certificatId, data) {
      this.loading = true
      this.error = null
      
      try {
        console.log(`Mise à jour du certificat ${certificatId} avec les données:`, data)
        
        if (!certificatId) {
          throw new Error('ID du certificat manquant')
        }
        
        // Préparer les données pour l'API
        const certificatData = {}
        if (data.type) certificatData.type = data.type
        if (data.motif) certificatData.motif = data.motif
        if (data.contenu) certificatData.contenu = data.contenu
        if (data.dateDebut !== undefined) certificatData.dateDebut = data.dateDebut
        if (data.dateFin !== undefined) certificatData.dateFin = data.dateFin
        if (data.statut) certificatData.statut = data.statut
        
        console.log('Données à envoyer à l\'API:', certificatData)
        
        // Utiliser la route appropriée du backend
        const response = await axiosInstance.put(`/certificats/${certificatId}`, certificatData)
        console.log('Réponse de l\'API:', response.data)
        
        // Vérifier le format de la réponse
        let updatedCertificatData = {}
        if (response.data && response.data.success && response.data.data) {
          // Format {success: true, data: {...}}
          updatedCertificatData = response.data.data
        } else if (response.data && response.data.certificat) {
          // Format {certificat: {...}}
          updatedCertificatData = response.data.certificat
        } else {
          // Format direct {...}
          updatedCertificatData = response.data
        }
        
        const updatedCertificat = this.formatCertificat(updatedCertificatData)
        
        // Mettre à jour le certificat dans le state
        const index = this.certificats.findIndex(c => c._id === certificatId)
        if (index !== -1) {
          this.certificats[index] = updatedCertificat
        }
        
        return updatedCertificat
      } catch (error) {
        console.error('Erreur lors de la mise à jour du certificat:', error)
        console.error('Détails de l\'erreur:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteCertificat(certificatId) {
      this.loading = true
      this.error = null
      
      try {
        console.log(`Suppression du certificat ${certificatId}`)
        
        if (!certificatId) {
          throw new Error('ID du certificat manquant')
        }
        
        // Utiliser la route appropriée du backend
        await axiosInstance.delete(`/certificats/${certificatId}`)
        
        // Supprimer le certificat du state
        this.certificats = this.certificats.filter(c => c._id !== certificatId)
        
        return { success: true, message: 'Certificat supprimé avec succès' }
      } catch (error) {
        console.error('Erreur lors de la suppression du certificat:', error)
        console.error('Détails de l\'erreur:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Générer un PDF pour un certificat médical
     */
    async generatePDF(certificatId) {
      this.loading = true
      this.error = null
      try {
        if (!certificatId) {
          throw new Error("ID du certificat requis");
        }
        
        console.log(`Tentative de génération du PDF pour le certificat: ${certificatId}`);
        
        // Trouver le certificat dans notre store (pour le fallback)
        let certificat = this.certificats.find(c => c._id === certificatId);
        if (!certificat) {
          // Essayer de charger le certificat depuis le serveur
          try {
            // URL selon l'ID du patient ou directement sur le certificat
            const url = certificat?.patient_id 
              ? `/certificats/patient/${certificat.patient_id}`
              : `/certificats/${certificatId}`;
              
            const response = await axiosInstance.get(url);
            
            // Traiter selon le format de la réponse
            if (response.data && response.data.success && response.data.data) {
              // Format {success: true, data: [...]} ou {success: true, data: {...}}
              if (Array.isArray(response.data.data)) {
                // Trouver le bon certificat dans la liste
                certificat = response.data.data.find(c => c._id === certificatId);
              } else {
                certificat = response.data.data;
              }
            } else if (Array.isArray(response.data)) {
              // Format direct [...]
              certificat = response.data.find(c => c._id === certificatId);
            } else if (response.data && !response.data.success === undefined) {
              // Format direct {...}
              certificat = response.data;
            }
            
            // Formatter le certificat si trouvé
            if (certificat) {
              certificat = this.formatCertificat(certificat);
            }
          } catch (fetchError) {
            console.error("Erreur lors de la récupération du certificat:", fetchError);
          }
          
          if (!certificat) {
            throw new Error("Certificat non trouvé dans le cache local");
          }
        }

        try {
          // Tenter la génération via l'API
          console.log(`Appel API: /certificats/${certificatId}/pdf`);
          const response = await axiosInstance.get(`/certificats/${certificatId}/pdf`);
          
          // Dans la partie qui gère la réponse de l'API (vers la ligne 507)
          if (response.data && response.data.success && response.data.url) {
          console.log("PDF généré avec succès via l'API:", response.data.url);
          
          // Récupérer le contenu du PDF à partir de l'URL
          try {
          const pdfResponse = await fetch(response.data.url);
          if (!pdfResponse.ok) throw new Error(`Erreur lors de la récupération du PDF: ${pdfResponse.status}`);
          
          // Convertir la réponse en blob
          const pdfBlob = await pdfResponse.blob();
          const url = URL.createObjectURL(pdfBlob);
          
          return {
          success: true,
          url: url,  // URL du blob local
          blob: pdfBlob,  // Le blob lui-même
          source: 'server-converted',
          message: 'PDF généré avec succès et converti en blob'
          };
          } catch (fetchError) {
          console.error("Erreur lors de la conversion de l'URL en blob:", fetchError);
          throw fetchError;
          }
          } else {
          console.warn("Réponse API inattendue:", response.data);
          throw new Error('Format de réponse inattendu pour la génération du PDF');
          }
        } catch (apiError) {
          console.error("Erreur lors de la génération du PDF via l'API:", apiError);
          console.log("Statut de l'erreur API:", apiError.response?.status);
          console.log("Message d'erreur API:", apiError.response?.data?.message || apiError.message);
          
          // Si erreur 500 ou autre, utiliser le fallback local
          console.log("→ Utilisation de la génération locale comme fallback");
          
          // Utiliser la fonction de génération de PDF locale
          const { generateCertificatPDF } = await import('@/utils/pdfGenerator');
          
          // Préparer les données pour la génération locale
          const pdfData = {
            ID_dossier_medical: certificat.patient_id,
            type: certificat.type || 'medical',
            motif: certificat.motif || 'Non spécifié',
            contenu: certificat.contenu || 'Aucun contenu',
            dateDebut: certificat.dateDebut,
            dateFin: certificat.dateFin,
            patientName: certificat.patient 
              ? `${certificat.patient.nom} ${certificat.patient.prenom}`.trim()
              : 'Patient'
          };
          
          console.log("Données utilisées pour la génération locale:", pdfData);
          
          try {
            const pdfBlob = await generateCertificatPDF(pdfData, false); // Changé de true à false pour obtenir un blob
            const url = URL.createObjectURL(pdfBlob);
            
            console.log("PDF généré localement avec succès");
            return {
              success: true,
              url,
              blob: pdfBlob,
              source: 'local',
              message: 'PDF généré localement avec succès'
            };
          } catch (localError) {
            console.error("Erreur lors de la génération locale du PDF:", localError);
            throw localError;
          }
        }
      } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        this.error = error.message || "Erreur lors de la génération du PDF";
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
})