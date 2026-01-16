import { defineStore } from 'pinia'
import axiosInstance from '@/services/axios'

// Fonction utilitaire pour valider et formater les dates
const formatDateSafely = (dateValue) => {
  if (!dateValue) return null
  try {
    const date = new Date(dateValue)
    // Vérifier si la date est valide
    if (date instanceof Date && !isNaN(date)) {
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

// Fonction utilitaire pour normaliser les IDs MongoDB
const normalizeMongoId = (id) => {
  if (!id) return '';
  // Convertir en string pour assurer la comparaison textuelle
  const strId = String(id);
  // Nettoyer l'ID en cas de préfixe ObjectId ou autres caractères
  return strId.replace(/^ObjectId\(['"]?|['"]?\)$|"/g, '').trim();
}

// Fonction pour comparer deux IDs MongoDB, qui peuvent être dans différents formats
const areIdsEqual = (id1, id2) => {
  if (!id1 || !id2) return false;
  const normalized1 = normalizeMongoId(id1);
  const normalized2 = normalizeMongoId(id2);
  return normalized1 === normalized2;
}

export const useExamenStore = defineStore('examens', {
  state: () => ({
    examens: [],
    loading: false,
    error: null
  }),

  getters: {
    getExamensByDossier: (state) => (dossierId) => {
      console.log('Getter getExamensByDossier appelé avec dossierId:', dossierId)
      const filteredExamens = state.examens.filter(e => e.dossier_id === dossierId)
      console.log('Examens filtrés:', filteredExamens)
      return filteredExamens
    }
  },

  actions: {
    async fetchExamensByDossier(dossierId) {
      console.log('Fetching examens pour le dossier:', dossierId)
      this.loading = true
      this.error = null
      try {
        console.log('URL de la requête:', `/examens/dossier/${dossierId}`)
        const response = await axiosInstance.get(`/examens/dossier/${dossierId}`)
        console.log('Réponse brute du serveur:', response.data)
        
        // Vérifier si la réponse est au format attendu
        let examensData = []
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // Format {success: true, data: [...]}
          examensData = response.data.data
        } else if (Array.isArray(response.data)) {
          // Format direct [...]
          examensData = response.data
        } else if (response.data && Array.isArray(response.data.examens)) {
          // Format {examens: [...]}
          examensData = response.data.examens
        } else {
          console.warn('Format de réponse inattendu:', response.data)
          this.examens = []
          return []
        }
        
        console.log('Données des examens avant transformation:', examensData)
        
        this.examens = examensData.map(examen => {
          console.log('Transformation de l\'examen:', examen)
          return this.formatExamen(examen)
        })
        
        console.log('Examens après transformation:', this.examens)
        return this.examens
      } catch (error) {
        console.error('Erreur détaillée lors de la récupération des examens:', {
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

    // Méthode pour récupérer tous les examens sans nécessiter un ID de dossier
    async fetchExamens() {
      console.log('Récupération de tous les examens')
      this.loading = true
      this.error = null
      
      try {
        // Nous n'avons pas d'endpoint /examens, donc nous allons utiliser une approche différente
        
        // Option 1: Récupérer les examens pour tous les dossiers disponibles
        // Nous pouvons simuler cela en récupérant les examens pour un dossier spécifique
        // ou en utilisant une autre approche
        
        // Essayer de récupérer les examens pour le dossier actif s'il existe
        const activeDossierId = localStorage.getItem('activeDossierId')
        if (activeDossierId) {
          console.log(`Utilisation du dossier actif: ${activeDossierId}`)
          return await this.fetchExamensByDossier(activeDossierId)
        }
        
        // Si nous n'avons pas de dossier actif, nous pouvons essayer de récupérer
        // les examens pour le premier dossier disponible
        try {
          console.log('Tentative de récupération des dossiers médicaux')
          const response = await axiosInstance.get('/dossiers-medicaux/patients')
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const firstDossierId = response.data[0]._id
            console.log(`Utilisation du premier dossier disponible: ${firstDossierId}`)
            return await this.fetchExamensByDossier(firstDossierId)
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des dossiers médicaux:', error)
        }
        
        // Si tout échoue, retourner une liste vide
        console.log('Aucun dossier disponible, retour d\'une liste vide')
        this.examens = []
        return []
      } catch (error) {
        console.error('Erreur détaillée lors de la récupération des examens:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        this.error = error.message
        this.examens = []
        return []
      } finally {
        this.loading = false
      }
    },

    // Nouvelle méthode pour récupérer les examens directement depuis le dossier médical
    async fetchExamensFromDossierMedical(dossierMedical) {
      if (!dossierMedical || !dossierMedical.examens) {
        console.warn('Dossier médical invalide ou sans examens')
        return []
      }

      console.log('Récupération des examens depuis le dossier médical:', dossierMedical._id)
      
      // Transformer les examens du dossier médical au format attendu
      const examensTransformes = dossierMedical.examens.map(examen => ({
        _id: examen._id,
        dossier_id: dossierMedical._id,
        type: examen.type || 'Non spécifié',
        date: formatDateSafely(examen.date),
        resultat: this.formatResultat(examen.resultat),
        interpretation: examen.interpretation || '',
        statut: examen.statut || 'en_attente',
        medecin: examen.medecin_id ? {
          id: examen.medecin_id,
          nom: examen.medecin?.utilisateur?.nom || 'Non spécifié',
          prenom: examen.medecin?.utilisateur?.prenom || '',
          specialite: examen.medecin?.specialite || 'Non spécifiée'
        } : null,
        fichiers: this.formatFichiers(examen.fichiers),
        created_at: formatDateSafely(examen.created_at),
        updated_at: formatDateSafely(examen.updated_at),
        commentaires: examen.commentaires || [],
        priorite: examen.priorite || 'normale',
        categorie: examen.categorie || 'general',
        valeurs_reference: examen.valeurs_reference || null,
        laboratoire: examen.laboratoire || null
      }))

      // Mettre à jour le state avec ces examens
      this.examens = examensTransformes
      return examensTransformes
    },

    formatResultat(resultat) {
      if (!resultat) return null
      
      try {
        // Si c'est déjà un objet, le retourner tel quel
        if (typeof resultat === 'object' && !Array.isArray(resultat)) {
          return resultat
        }
        
        // Si c'est une chaîne JSON, la parser
        if (typeof resultat === 'string') {
          try {
            return JSON.parse(resultat)
          } catch (e) {
            // Si ce n'est pas du JSON valide, le retourner comme texte simple
            return { texte: resultat }
          }
        }
        
        // Cas par défaut
        return { texte: String(resultat) }
      } catch (error) {
        console.error('Erreur lors du formatage du résultat:', error)
        return { texte: String(resultat) || 'Résultat non disponible' }
      }
    },

    formatFichiers(fichiers) {
      if (!fichiers) return []
      
      try {
        // Si c'est déjà un tableau d'objets avec les propriétés attendues, le retourner
        if (Array.isArray(fichiers) && fichiers.length > 0 && typeof fichiers[0] === 'object' && fichiers[0].path) {
          return fichiers
        }
        
        // Si c'est un tableau de chemins de fichiers
        if (Array.isArray(fichiers)) {
          return fichiers.map(fichier => {
            if (typeof fichier === 'string') {
              return {
                path: fichier,
                url: `${process.env.VUE_APP_API_URL || ''}/storage/${fichier}`,
                name: fichier.split('/').pop()
              }
            } else if (typeof fichier === 'object' && fichier && fichier.path) {
              return {
                ...fichier,
                url: fichier.url || `${process.env.VUE_APP_API_URL || ''}/storage/${fichier.path}`,
                name: fichier.name || fichier.path.split('/').pop()
              }
            }
            return null
          }).filter(Boolean)
        }
        
        // Si c'est une chaîne JSON
        if (typeof fichiers === 'string') {
          try {
            const parsedFichiers = JSON.parse(fichiers)
            return this.formatFichiers(parsedFichiers)
          } catch (e) {
            // Si ce n'est pas du JSON valide, considérer comme un seul chemin de fichier
            return [{
              path: fichiers,
              url: `${process.env.VUE_APP_API_URL || ''}/storage/${fichiers}`,
              name: fichiers.split('/').pop()
            }]
          }
        }
        
        return []
      } catch (error) {
        console.error('Erreur lors du formatage des fichiers:', error)
        return []
      }
    },

    async createExamen(data) {
      this.loading = true
      this.error = null
      try {
        if (!data.dossier_id) {
          throw new Error('ID du dossier médical requis')
        }

        // Vérifier si le dossier existe
        try {
          const dossierResponse = await axiosInstance.get(`/dossiers-medicaux/${data.dossier_id}`)
          console.log('Dossier médical trouvé:', dossierResponse.data)
        } catch (error) {
          console.error('Erreur lors de la vérification du dossier médical:', error)
          if (error.response?.status === 404) {
            throw new Error('Dossier médical non trouvé')
          }
        }

        // Vérifier si nous avons un ID de médecin
        if (!data.medecin_id) {
          // Essayer de récupérer l'ID du médecin depuis l'API
          try {
            const roleId = localStorage.getItem('role_id')
            if (!roleId) {
              throw new Error('ID de rôle non trouvé dans localStorage')
            }
            
            const response = await axiosInstance.get(`/medecins/${roleId}`)
            if (response.data && response.data._id) {
              console.log('ID du médecin récupéré dans le store:', response.data._id)
              data.medecin_id = response.data._id
            } else {
              throw new Error('ID du médecin non trouvé dans la réponse')
            }
          } catch (error) {
            console.error('Erreur lors de la récupération de l\'ID du médecin:', error)
            throw new Error('Impossible de déterminer l\'ID du médecin')
          }
        }

        console.log('ID du médecin utilisé dans le store:', data.medecin_id)

        // Préparer les données pour l'API
        const examenData = {
          dossier_id: data.dossier_id,
          medecin_id: data.medecin_id,
          type: data.type || 'biologie',
          date: data.date || new Date().toISOString(),
          resultat: data.resultat || { description: 'Examen demandé' },
          interpretation: data.interpretation || '',
          statut: data.statut || 'en_attente'
        }

        console.log('Données à envoyer à l\'API:', examenData)

        // Utiliser la route appropriée du backend
        const response = await axiosInstance.post(`/examens/dossier/${data.dossier_id}`, examenData)
        console.log('Réponse de l\'API:', response.data)

        // Vérifier le format de la réponse
        let newExamenData = {}
        if (response.data && response.data.success && response.data.examen) {
          // Format {success: true, examen: {...}}
          newExamenData = response.data.examen
        } else if (response.data && response.data.data) {
          // Format {data: {...}}
          newExamenData = response.data.data
        } else {
          // Format direct {...}
          newExamenData = response.data
        }

        const newExamen = {
          _id: newExamenData._id,
          dossier_id: data.dossier_id,
          medecin_id: data.medecin_id,
          type: newExamenData.type || data.type,
          date: formatDateSafely(newExamenData.date || data.date),
          resultat: this.formatResultat(newExamenData.resultat || data.resultat),
          interpretation: newExamenData.interpretation || data.interpretation || '',
          statut: newExamenData.statut || data.statut || 'en_attente',
          fichiers: this.formatFichiers(newExamenData.fichiers || []),
          created_at: formatDateSafely(newExamenData.created_at || new Date()),
          updated_at: formatDateSafely(newExamenData.updated_at || new Date())
        }
        
        this.examens.unshift(newExamen)
        return newExamen
      } catch (error) {
        console.error('Erreur lors de la création de l\'examen:', error)
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

    async updateExamen(examenId, data) {
      this.loading = true
      this.error = null
      try {
        if (!examenId) {
          throw new Error('ID de l\'examen requis pour la mise à jour')
        }

        // Préparer les données pour l'API
        const examenData = {
          interpretation: data.interpretation || '',
          resultat: data.resultat
        }

        console.log('Données à envoyer pour la mise à jour:', examenData)

        // Utiliser la route appropriée du backend
        const response = await axiosInstance.put(`/examens/${examenId}/interpretation`, examenData)
        console.log('Réponse de l\'API pour la mise à jour:', response.data)

        // Vérifier le format de la réponse
        let updatedExamenData = {}
        if (response.data && response.data.success && response.data.data) {
          // Format {success: true, data: {...}}
          updatedExamenData = response.data.data
        } else if (response.data && response.data.examen) {
          // Format {examen: {...}}
          updatedExamenData = response.data.examen
        } else {
          // Format direct {...}
          updatedExamenData = response.data
        }

        const updatedExamen = {
          _id: updatedExamenData._id || examenId,
          dossier_id: updatedExamenData.dossier_id || data.dossier_id,
          medecin_id: updatedExamenData.medecin_id || data.medecin_id,
          type: updatedExamenData.type || data.type,
          date: formatDateSafely(updatedExamenData.date || data.date),
          resultat: this.formatResultat(updatedExamenData.resultat || data.resultat),
          interpretation: updatedExamenData.interpretation || data.interpretation || '',
          statut: updatedExamenData.statut || data.statut || 'en_attente',
          fichiers: this.formatFichiers(updatedExamenData.fichiers || data.fichiers || []),
          updated_at: formatDateSafely(updatedExamenData.updated_at || new Date())
        }

        // Mettre à jour l'examen dans le state
        const index = this.examens.findIndex(e => e._id === examenId)
        if (index !== -1) {
          this.examens[index] = { ...this.examens[index], ...updatedExamen }
        }

        return updatedExamen
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'examen:', error)
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

    async deleteExamen(examenId) {
      if (!examenId) {
        throw new Error('ID de l\'examen requis')
      }
      
      try {
        this.loading = true
        this.error = null
        
        console.log(`Tentative de suppression de l'examen avec ID: ${examenId}`)
        
        const response = await axiosInstance.delete(`/examens/${examenId}`)
        
        // Supprimer l'examen de la liste locale
        this.examens = this.examens.filter(e => e._id !== examenId)
        
        console.log('Examen supprimé avec succès')
        return { success: true, message: 'Examen supprimé avec succès' }
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'examen:', err)
        
        // Extraire un message d'erreur plus lisible
        let errorMessage = 'Erreur lors de la suppression de l\'examen'
        
        // Pour les erreurs HTTP
        if (err.response && err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }
        
        this.error = errorMessage
        throw new Error(errorMessage)
      } finally {
        this.loading = false
      }
    },

    // Méthode pour formater un examen de manière cohérente
    formatExamen(examen) {
      if (!examen) {
        console.warn('Tentative de formater un examen undefined ou null');
        return {
          _id: null,
          dossier_id: null,
          type: 'Non spécifié',
          date: null,
          resultat: null,
          interpretation: '',
          statut: 'en_attente',
          medecin: null,
          fichiers: [],
          created_at: null,
          updated_at: null,
          commentaires: [],
          priorite: 'normale',
          categorie: 'general',
          valeurs_reference: null,
          laboratoire: null,
          cout: null,
          assurance: null,
          suivi_requis: false,
          date_suivi: null
        };
      }
      
      return {
        _id: examen._id,
        dossier_id: examen.dossier_id || examen.dossier_medical_id,
        type: examen.type || 'Non spécifié',
        date: formatDateSafely(examen.date || examen.created_at),
        resultat: this.formatResultat(examen.resultat),
        interpretation: examen.interpretation || '',
        statut: examen.statut || 'en_attente',
        medecin: examen.medecin_id ? {
          id: examen.medecin_id,
          nom: examen.medecin?.utilisateur?.nom || 'Non spécifié',
          prenom: examen.medecin?.utilisateur?.prenom || '',
          specialite: examen.medecin?.specialite || 'Non spécifiée'
        } : null,
        fichiers: this.formatFichiers(examen.fichiers),
        created_at: formatDateSafely(examen.created_at),
        updated_at: formatDateSafely(examen.updated_at),
        commentaires: examen.commentaires || [],
        priorite: examen.priorite || 'normale',
        categorie: examen.categorie || 'general',
        valeurs_reference: examen.valeurs_reference || null,
        laboratoire: examen.laboratoire || null,
        cout: examen.cout || null,
        assurance: examen.assurance || null,
        suivi_requis: examen.suivi_requis || false,
        date_suivi: examen.date_suivi ? formatDateSafely(examen.date_suivi) : null
      }
    },

    // Méthode pour générer un PDF d'examen
    async generatePDF(examenId) {
      this.loading = true;
      this.error = null;
      
      try {
        if (!examenId) {
          throw new Error("ID de l'examen requis");
        }
        
        console.log(`Génération du PDF pour l'examen: ${examenId}`);
        
        try {
          // Faire la requête à l'API pour générer le PDF
          const response = await axiosInstance.get(`/examens/${examenId}/pdf`, {
            responseType: 'blob' // Important pour recevoir les données binaires
          });
          
          // Créer une URL pour le blob reçu
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          console.log("PDF généré avec succès via l'API");
          
          return {
            success: true,
            url,
            blob
          };
        } catch (apiError) {
          console.error("Erreur lors de la génération du PDF via l'API:", apiError);
          
          // Dans tous les cas d'erreur, utiliser la génération locale comme fallback
          console.log("Utilisation de la génération locale comme fallback");
          
          // Trouver l'examen dans notre store
          const examen = this.examens.find(e => e._id === examenId);
          if (!examen) {
            throw new Error("Examen non trouvé");
          }
          
          // Utiliser la fonction de génération de PDF locale
          const { generateExamenPDF } = await import('@/utils/pdfGenerator');
          const pdfBlob = await generateExamenPDF({
            typeExamen: examen.type,
            datePrevue: examen.date,
            description: examen.resultat?.description || examen.resultat?.texte || JSON.stringify(examen.resultat),
            instructions: examen.interpretation,
            urgent: examen.priorite === 'urgente'
          }, false);
          
          const url = URL.createObjectURL(pdfBlob);
          
          return {
            success: true,
            url,
            blob: pdfBlob,
            source: 'local'
          };
        }
      } catch (error) {
        console.error("Erreur lors de la génération du PDF:", error);
        this.error = error.message || "Erreur lors de la génération du PDF";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Mise à jour d'un examen avec fichiers
    async updateExamenWithFiles(examenId, formData) {
      console.log('Mise à jour de l\'examen avec fichiers:', examenId)
      this.loading = true
      this.error = null
      
      try {
        if (!examenId) {
          throw new Error('ID d\'examen requis pour la mise à jour')
        }
        
        // Log du formData pour déboggage
        if (formData instanceof FormData) {
          console.log('FormData content:')
          for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : value}`)
          }
        } else {
          console.warn('updateExamenWithFiles appelé sans FormData')
          return await this.updateExamen(examenId, formData)
        }
        
        // S'assurer que le FormData a l'en-tête Content-Type approprié
        const response = await axiosInstance.put(`/examens/${examenId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        console.log('Réponse de la mise à jour avec fichiers:', response.data)
        
        // Vérifier si la réponse est au format attendu
        let updatedExamen = null
        if (response.data && response.data.success && response.data.data) {
          updatedExamen = response.data.data
        } else if (response.data && response.data._id) {
          updatedExamen = response.data
        } else if (response.data && response.data.examen) {
          updatedExamen = response.data.examen
        } else {
          console.warn('Format de réponse inattendu:', response.data)
          throw new Error('Format de réponse inattendu')
        }
        
        // Mettre à jour l'examen dans le state
        const formattedExamen = this.formatExamen(updatedExamen)
        const index = this.examens.findIndex(e => e._id === examenId)
        
        if (index !== -1) {
          this.examens[index] = formattedExamen
        } else {
          // L'examen n'est pas dans le state, l'ajouter
          this.examens.push(formattedExamen)
        }
        
        return formattedExamen
      } catch (error) {
        console.error('Erreur détaillée lors de la mise à jour de l\'examen avec fichiers:', {
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
  }
})