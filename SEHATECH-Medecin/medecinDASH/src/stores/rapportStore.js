import { defineStore } from 'pinia'
import axiosInstance from '@/services/axios'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from './user'

// Fonction utilitaire pour valider et formater les dates
const formatDateSafely = (dateValue) => {
  if (!dateValue) return null
  try {
    const date = new Date(dateValue)
    // Vérifier si la date est valide
    return date instanceof Date && !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString()
  } catch (error) {
    console.warn('Date invalide:', dateValue)
    return new Date().toISOString()
  }
}

export const useRapportStore = defineStore('rapports', {
  state: () => ({
    rapports: [],
    loading: false,
    error: null
  }),

  getters: {
    getRapportsByDossier: (state) => (dossierId) => {
      console.log('Getter getRapportsByDossier appelé avec dossierId:', dossierId)
      const filteredRapports = state.rapports.filter(r => r.dossier_id === dossierId)
      console.log('Rapports filtrés:', filteredRapports)
      return filteredRapports
    }
  },

  actions: {
    async fetchRapports(dossierId, medecin) {
      console.log('Début de la récupération des rapports')
      this.loading = true
      this.error = null
    
      try {
        // 1) Récupération du medecinId
        const userStore = useUserStore()
        const medecinId = medecin?._id
          || userStore.user?.medecin?._id
          || localStorage.getItem('role_id')
    
        // 2) Construction de l'URL et des params
        const url = '/rapports'
        const params = {
          ...(dossierId ? { dossier_id: dossierId } : {}),
          medecin_id: medecinId
        }
        console.log('URL de la requête pour les rapports:', url, 'avec params:', params)
    
        // 3) Appel API
        const response = await axiosInstance.get(url, { params })
        console.log('Réponse du serveur pour les rapports:', response.status)
    
        // 4) Normaliser en tableau quel que soit le format
        const raw = response.data
        let rapportsData = []
    
        if (Array.isArray(raw)) {
          rapportsData = raw
        } else if (Array.isArray(raw.data)) {
          rapportsData = raw.data
        } else if (Array.isArray(raw.rapports)) {
          rapportsData = raw.rapports
        } else if (raw && typeof raw === 'object') {
          rapportsData = [raw]
        } else {
          console.warn('Format de réponse inattendu pour les rapports:', raw)
        }
    
        console.log(`${rapportsData.length} rapport(s) récupéré(s)`)
    
        // 5) Transformation en objets uniformes
        const tous = rapportsData.map(rapport => ({
          _id:               rapport._id,
          dossier_id:        rapport.dossier_id,
          medecin_id:        rapport.medecin_id,
          titre:             rapport.titre || 'Rapport sans titre',
          contenu:           rapport.contenu || '',
          type:              rapport.type || 'Général',
          date:              formatDateSafely(rapport.date || rapport.created_at),
          medecin: rapport.medecin_id
            ? {
                id:          rapport.medecin_id,
                nom:         rapport.medecin?.utilisateur?.nom   || 'Non spécifié',
                prenom:      rapport.medecin?.utilisateur?.prenom|| '',
                specialite:  rapport.medecin?.specialite        || 'Non spécifiée'
              }
            : null,
          created_at:        formatDateSafely(rapport.created_at),
          updated_at:        formatDateSafely(rapport.updated_at)
        }))
    
        // 6) Filtrer pour garder uniquement ceux du medecin courant
        const filtres = tous.filter(r => r.medecin_id === medecinId)
        console.log(`${filtres.length} rapport(s) après filtrage par medecin_id (${medecinId})`)
    
        this.rapports = filtres
        return this.rapports
    
      } catch (err) {
        console.error('Erreur détaillée lors de la récupération des rapports:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        })
        this.error = err.message
        this.rapports = []
        return []
      } finally {
        this.loading = false
      }
    },
    
    // Nouvelle méthode pour récupérer les rapports directement depuis le dossier médical
    async fetchRapportsFromDossierMedical(dossierMedical) {
      if (!dossierMedical || !dossierMedical.rapports) {
        console.warn('Dossier médical invalide ou sans rapports')
        return []
      }

      console.log('Récupération des rapports depuis le dossier médical:', dossierMedical._id)
      
      // Transformer les rapports du dossier médical au format attendu
      const rapportsTransformes = dossierMedical.rapports.map(rapport => {
        // Vérifier et formater la date du rapport
        const dateRapport = formatDateSafely(rapport.date);
        
        // Formater la date pour l'affichage
        let formattedDate = 'Date non spécifiée';
        try {
          const dateObj = new Date(dateRapport);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString('fr-FR');
          }
        } catch (error) {
          console.warn('Erreur lors du formatage de la date pour affichage:', error);
        }
        
        // Créer un titre à partir du type et de la date si non fourni
        const titreGenere = rapport.titre || 
                           `Rapport ${rapport.type ? `de ${rapport.type}` : ''} du ${formattedDate}`
                           
        return {
          _id: rapport._id,
          dossier_id: dossierMedical._id,
          date: dateRapport,
          contenu: rapport.contenu || '',
          type: rapport.type || 'consultation',
          titre: titreGenere,
          medecin: rapport.medecin_id ? {
            id: rapport.medecin_id,
            nom: rapport.medecin?.utilisateur?.nom || 'Non spécifié',
            prenom: rapport.medecin?.utilisateur?.prenom || '',
            specialite: rapport.medecin?.specialite || 'Non spécifiée'
          } : null,
          created_at: formatDateSafely(rapport.created_at),
          updated_at: formatDateSafely(rapport.updated_at)
        }
      })

      // Mettre à jour le state avec ces rapports
      this.rapports = rapportsTransformes
      return rapportsTransformes
    },

    async createRapport(data) {
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
        const validTypes = ['consultation', 'hospitalisation', 'intervention', 'suivi']
        const type = validTypes.includes(data.type) ? data.type : 'consultation'

        const rapportData = {
          dossier_id: data.dossier_id,
          medecin_id: data.medecin_id,
          contenu: data.contenu || '',
          type: type,
          date: data.date || new Date().toISOString()
        }

        console.log('Données envoyées à l\'API:', rapportData)
        
        // Définir la variable en dehors du bloc try/catch
        let newRapportData = {}
        
        try {
          // Utiliser la route appropriée du backend
          const response = await axiosInstance.post('/rapports', rapportData)
          console.log('Réponse de l\'API:', response.data)
          
          // Vérifier le format de la réponse
          if (response.data && response.data.success && response.data.data) {
            // Format {success: true, data: {...}}
            newRapportData = response.data.data
          } else if (response.data && response.data.rapport) {
            // Format {rapport: {...}}
            newRapportData = response.data.rapport
          } else {
            // Format direct {...}
            newRapportData = response.data
          }
        } catch (apiError) {
          console.error('Erreur lors de la création via l\'API principale:', apiError)
          
          // Si la première tentative échoue, essayons avec la route alternative
          console.log('Tentative avec la route alternative...')
          
          try {
            // Utiliser la route du dossier médical comme alternative
            const altResponse = await axiosInstance.post(`/dossiers-medicaux/${data.dossier_id}/rapports`, {
              contenu: data.contenu || '',
              type: type,
              medecin_id: data.medecin_id
            })
            
            console.log('Réponse de l\'API alternative:', altResponse.data)
            
            // Utiliser la réponse alternative
            if (altResponse.data && altResponse.data.rapport) {
              newRapportData = altResponse.data.rapport
            } else if (altResponse.data && altResponse.data.data) {
              newRapportData = altResponse.data.data
            } else {
              newRapportData = altResponse.data
            }
          } catch (altError) {
            console.error('Erreur avec la route alternative:', altError)
            // Si les deux méthodes échouent, relancer l'erreur d'origine
            throw apiError
          }
        }

        const dateObj = new Date(newRapportData.date || data.date || new Date())
        const formattedDate = dateObj.toLocaleDateString('fr-FR')
        
        // Créer un titre à partir du type et de la date
        const titreGenere = newRapportData.titre || data.titre || 
                           `Rapport ${newRapportData.type ? `de ${newRapportData.type}` : ''} du ${formattedDate}`

        const newRapport = {
          _id: newRapportData._id,
          dossier_id: data.dossier_id,
          date: new Date(newRapportData.date || data.date || new Date()).toISOString(),
          contenu: newRapportData.contenu || data.contenu || '',
          type: newRapportData.type || data.type || 'consultation',
          titre: titreGenere,
          medecin: newRapportData.medecin_id ? {
            id: newRapportData.medecin_id,
            nom: newRapportData.medecin?.utilisateur?.nom || 'Non spécifié',
            prenom: newRapportData.medecin?.utilisateur?.prenom || '',
            specialite: newRapportData.medecin?.specialite || 'Non spécifiée'
          } : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        this.rapports.unshift(newRapport)
        return newRapport
      } catch (error) {
        console.error('Erreur lors de la création du rapport:', error)
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

    // Méthode alternative pour ajouter un rapport directement au dossier médical
    async ajouterRapportAuDossier(dossierId, data) {
      this.loading = true
      this.error = null
      try {
        if (!dossierId) {
          throw new Error('ID du dossier médical requis')
        }

        // Préparer les données pour l'API
        const rapportData = {
          contenu: data.contenu || '',
          type: data.type || 'consultation'
        }

        // Utiliser la route du dossier médical pour ajouter un rapport
        const response = await axiosInstance.post(`/dossiers-medicaux/${dossierId}/rapports`, rapportData)

        // Vérifier le format de la réponse
        let newRapportData = {}
        if (response.data && response.data.rapport) {
          newRapportData = response.data.rapport
        } else {
          newRapportData = response.data
        }

        const newRapport = {
          _id: newRapportData._id,
          dossier_id: dossierId,
          date: new Date(newRapportData.date).toISOString(),
          contenu: newRapportData.contenu || '',
          type: newRapportData.type || 'consultation',
          medecin: newRapportData.medecin_id ? {
            id: newRapportData.medecin_id,
            nom: newRapportData.medecin?.utilisateur?.nom || 'Non spécifié',
            prenom: newRapportData.medecin?.utilisateur?.prenom || '',
            specialite: newRapportData.medecin?.specialite || 'Non spécifiée'
          } : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        this.rapports.unshift(newRapport)
        return newRapport
      } catch (error) {
        console.error('Erreur lors de l\'ajout du rapport au dossier:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateRapport(rapportId, data) {
      this.loading = true
      this.error = null
      try {
        // Préparer les données pour l'API
        const updateData = {}
        
        // Ajouter uniquement les champs fournis
        if (data.contenu !== undefined) updateData.contenu = data.contenu
        if (data.type !== undefined) updateData.type = data.type
        if (data.date !== undefined) updateData.date = data.date
        
        const response = await axiosInstance.put(`/rapports/${rapportId}`, updateData)
        
        // Vérifier le format de la réponse
        let updatedRapportData = {}
        if (response.data && response.data.success && response.data.data) {
          // Format {success: true, data: {...}}
          updatedRapportData = response.data.data
        } else if (response.data && response.data.rapport) {
          // Format {rapport: {...}}
          updatedRapportData = response.data.rapport
        } else {
          // Format direct {...}
          updatedRapportData = response.data
        }

        const dateObj = new Date(updatedRapportData.date || data.date || new Date())
        const formattedDate = dateObj.toLocaleDateString('fr-FR')
        
        // Mettre à jour le titre si nécessaire
        const titreGenere = updatedRapportData.titre || data.titre || 
                           `Rapport ${updatedRapportData.type ? `de ${updatedRapportData.type}` : ''} du ${formattedDate}`

        const updatedRapport = {
          _id: updatedRapportData._id,
          dossier_id: updatedRapportData.dossier_id,
          date: new Date(updatedRapportData.date || data.date || new Date()).toISOString(),
          contenu: updatedRapportData.contenu || data.contenu || '',
          type: updatedRapportData.type || data.type || 'consultation',
          titre: titreGenere,
          medecin: updatedRapportData.medecin_id ? {
            id: updatedRapportData.medecin_id,
            nom: updatedRapportData.medecin?.utilisateur?.nom || 'Non spécifié',
            prenom: updatedRapportData.medecin?.utilisateur?.prenom || '',
            specialite: updatedRapportData.medecin?.specialite || 'Non spécifiée'
          } : null,
          updated_at: new Date().toISOString()
        }

        const index = this.rapports.findIndex(r => r._id === rapportId)
        if (index !== -1) {
          this.rapports[index] = updatedRapport
        }

        return updatedRapport
      } catch (error) {
        console.error('Erreur lors de la mise à jour du rapport:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteRapport(rapportId) {
      this.loading = true
      this.error = null
      try {
        await axiosInstance.delete(`/rapports/${rapportId}`)
        this.rapports = this.rapports.filter(r => r._id !== rapportId)
        return { success: true, message: 'Rapport supprimé avec succès' }
      } catch (error) {
        console.error('Erreur lors de la suppression du rapport:', error)
        
        // Gérer spécifiquement l'erreur 403 (Forbidden)
        if (error.response && error.response.status === 403) {
          this.error = "Vous n'êtes pas autorisé à supprimer ce rapport. Seul l'auteur du rapport peut le supprimer."
          throw new Error("Vous n'êtes pas autorisé à supprimer ce rapport. Seul l'auteur du rapport peut le supprimer.")
        } else {
          this.error = error.message || 'Erreur lors de la suppression du rapport'
          throw error
        }
      } finally {
        this.loading = false
      }
    },

    async generatePDF(rapportId) {
      this.loading = true
      this.error = null
      try {
        if (!rapportId) {
          throw new Error("ID du rapport requis");
        }
        
        console.log(`Tentative de génération du PDF pour le rapport: ${rapportId}`);
        
        // Trouver le rapport dans notre store (pour le fallback)
        let rapport = this.rapports.find(r => r._id === rapportId);
        if (!rapport) {
          // Essayer de charger le rapport si pas en cache
          try {
            const fetchResult = await this.fetchRapport(rapportId);
            rapport = fetchResult || null;
          } catch (fetchError) {
            console.error("Erreur lors de la récupération du rapport:", fetchError);
          }
          
          if (!rapport) {
            throw new Error("Rapport non trouvé dans le cache local");
          }
        }
        
        console.log("Données du rapport pour le PDF:", JSON.stringify(rapport, null, 2));
        
        try {
          // Tenter la génération via l'API
          console.log(`Appel API: /rapports/${rapportId}/export-pdf`);
          const response = await axiosInstance.get(`/rapports/${rapportId}/export-pdf`);
          
          if (response.data && response.data.success && response.data.url) {
            console.log("PDF généré avec succès via l'API:", response.data.url);
            return {
              success: true,
              url: response.data.url,
              message: 'PDF généré avec succès'
            };
          } else {
            console.warn("Réponse API inattendue:", response.data);
            throw new Error('Format de réponse inattendu pour la génération du PDF');
          }
        } catch (apiError) {
          console.error("Erreur lors de la génération du PDF via l'API:", apiError);
          console.log("Statut de l'erreur API:", apiError.response?.status);
          console.log("Message d'erreur API:", apiError.response?.data?.message || apiError.message);
          
          // Si l'erreur est 400 (Bad Request) ou toute autre erreur, utiliser le fallback local
          console.log("→ Utilisation de la génération locale comme fallback");
          
          // Utiliser la fonction de génération de PDF locale
          const { generateRapportPDF } = await import('@/utils/pdfGenerator');
          
          // Préparer les données pour la génération locale
          const pdfData = {
            type: rapport.type || 'consultation',
            date: rapport.date,
            contenu: rapport.contenu || 'Aucun contenu',
            titre: rapport.titre || `Rapport médical - ${new Date(rapport.date).toLocaleDateString('fr-FR')}`,
          };
          
          console.log("Données utilisées pour la génération locale:", pdfData);
          
          try {
            const pdfBlob = await generateRapportPDF(pdfData, false);
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
    },
    
    // Méthode pour récupérer un rapport spécifique
    async fetchRapport(rapportId) {
      try {
        console.log(`Récupération du rapport: ${rapportId}`);
        const response = await axiosInstance.get(`/rapports/${rapportId}`);
        
        if (response.data && response.data.success) {
          console.log("Rapport récupéré avec succès");
          // Ajouter au cache si pas déjà présent
          const existingIndex = this.rapports.findIndex(r => r._id === response.data.data._id);
          if (existingIndex >= 0) {
            this.rapports[existingIndex] = response.data.data;
          } else {
            this.rapports.push(response.data.data);
          }
          return response.data.data;
        } else {
          console.warn("Format de réponse inattendu lors de la récupération du rapport");
          return null;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du rapport:', error);
        return null;
      }
    }
  }
}) 