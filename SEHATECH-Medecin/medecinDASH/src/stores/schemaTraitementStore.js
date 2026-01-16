import { defineStore } from 'pinia'
import { useUserStore } from './user'
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

export const useSchemaTraitementStore = defineStore('schemaTraitement', {
  state: () => ({
    schemas: [],
    loading: false,
    error: null
  }),

  getters: {
    getSchemasByDossier: (state) => (dossierId) => {
      console.log('Getter getSchemasByDossier appelé avec dossierId:', dossierId)
      const filteredSchemas = state.schemas.filter(s => s.dossier_id === dossierId)
      console.log('Schémas filtrés:', filteredSchemas)
      return filteredSchemas
    },
    
    getActiveSchemas: (state) => {
      const now = new Date()
      return state.schemas.filter(schema => {
        const dateDebut = new Date(schema.date_debut)
        const dateFin = new Date(schema.date_fin)
        return dateDebut <= now && dateFin >= now && schema.statut === 'actif'
      })
    }
  },

  actions: {
    async fetchSchemas(params = {}) {
      console.log('Début de la récupération des schémas de traitement', params)
      this.loading = true
      this.error = null
      
      try {
        // Récupérer l'ID du médecin authentifié depuis le store user
        const userStore = useUserStore()
        await userStore.fetchUserInfo()
        const medecinId = userStore.user?.medecin?._id
        
        if (medecinId) {
          params.medecin_id = medecinId
        }

        // Construire l'URL et les paramètres
        const url = '/schemas-traitement'
        console.log('URL de la requête pour les schémas de traitement:', url, 'avec params:', params)
        
        const response = await axiosInstance.get(url, { params })
        console.log('Réponse du serveur pour les schémas de traitement:', response.status)
        
        // Vérifier le format de la réponse et extraire les données
        let schemasData = []
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Format direct [...]
            schemasData = response.data
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Format {success: true, data: [...]}
            schemasData = response.data.data
          } else if (response.data.schemas && Array.isArray(response.data.schemas)) {
            // Format {schemas: [...]}
            schemasData = response.data.schemas
          } else {
            console.warn('Format de réponse inattendu pour les schémas de traitement:', response.data)
          }
        } else {
          console.warn('Réponse vide pour les schémas de traitement')
        }
        
        console.log(`${schemasData.length} schémas de traitement récupérés`)
        
        // Transformer les données et mettre à jour le state
        this.schemas = schemasData.map(schema => this.formatSchema(schema))
        
        return this.schemas
      } catch (error) {
        console.error('Erreur détaillée lors de la récupération des schémas de traitement:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        this.error = error.message
        this.schemas = []
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchSchemasByDossier(dossierId) {
      return this.fetchSchemas({ dossier_id: dossierId })
    },

    async fetchActiveSchemasByPatient(patientId) {
      console.log('Fetching schémas actifs pour le patient:', patientId)
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.get(`/schemas-traitement/patient/${patientId}/actifs`)
        console.log('Réponse brute du serveur:', response.data)
        
        // Vérifier si la réponse est au format attendu
        let schemasData = []
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // Format {success: true, data: [...]}
          schemasData = response.data.data
        } else if (Array.isArray(response.data)) {
          // Format direct [...]
          schemasData = response.data
        } else {
          console.warn('Format de réponse inattendu:', response.data)
          return []
        }

        const activeSchemas = schemasData.map(schema => this.formatSchema(schema))
        
        // Mettre à jour le state avec ces schémas actifs
        // Remplacer les schémas existants avec le même ID
        activeSchemas.forEach(schema => {
          const index = this.schemas.findIndex(s => s._id === schema._id)
      if (index !== -1) {
            this.schemas[index] = schema
          } else {
            this.schemas.push(schema)
          }
        })
        
        return activeSchemas
      } catch (error) {
        console.error('Erreur lors de la récupération des schémas actifs:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    formatSchema(schema) {
      return {
        _id: schema._id,
        titre: schema.titre || 'Sans titre',
        description: schema.description || '',
        date_debut: formatDateSafely(schema.date_debut),
        date_fin: formatDateSafely(schema.date_fin),
        dossier_id: schema.dossier_id,
        medecin_id: schema.medecin_id,
        medications: schema.medications || [],
        statut: schema.statut || 'actif',
        instructions: schema.instructions || '',
        commentaires: schema.commentaires || [],
        created_at: formatDateSafely(schema.created_at),
        updated_at: formatDateSafely(schema.updated_at),
        patient: schema.dossierMedical?.patient ? {
          id: schema.dossierMedical.patient._id,
          nom: schema.dossierMedical.patient.utilisateur?.nom || 'Non spécifié',
          prenom: schema.dossierMedical.patient.utilisateur?.prenom || ''
        } : null,
        medecin: schema.medecin ? {
          id: schema.medecin._id,
          nom: schema.medecin.utilisateur?.nom || 'Non spécifié',
          prenom: schema.medecin.utilisateur?.prenom || '',
          specialite: schema.medecin.specialite || 'Non spécifiée'
        } : null
      }
    },

    async createSchema(data) {
      this.loading = true
      this.error = null
      
      try {
        console.log('Tentative de création d\'un schéma de traitement avec les données:', data);
        
        // S'assurer que nous avons un ID de médecin
        await this.getMedecinId(data);
        
        // Vérifier si nous avons un dossier_id ou un patient_id
        const hasDossierId = data.dossier_id && data.dossier_id !== 'temp_id' && !data.dossier_id.startsWith('temp_');
        const hasPatientId = !!data.patient_id;
        
        console.log('État des identifiants:', { hasDossierId, hasPatientId });
        
        // Sélectionner la route appropriée en fonction des données disponibles
        let endpoint = '/schemas-traitement';
        let schemaData = {
          titre: data.titre || 'Nouveau schéma de traitement',
          description: data.description || '',
          date_debut: data.date_debut || new Date().toISOString(),
          date_fin: data.date_fin || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
          medications: data.medications || [],
          instructions: data.instructions || '',
          statut: data.statut || 'actif',
          medecin_id: data.medecin_id
        };
        
        if (hasDossierId) {
          // Utiliser la route standard avec dossier_id
          schemaData.dossier_id = data.dossier_id;
          console.log('Utilisation de la route standard avec dossier_id:', schemaData.dossier_id);
        } else if (hasPatientId) {
          // Utiliser la route /direct avec patient_id
          endpoint = '/schemas-traitement/direct';
          schemaData.patient_id = data.patient_id;
          console.log('Utilisation de la route /direct avec patient_id:', schemaData.patient_id);
        } else {
          console.error('Aucun identifiant valide (dossier_id ou patient_id) fourni');
          throw new Error('Un identifiant de dossier médical ou de patient est requis');
        }

        console.log(`Envoi de la requête à l'endpoint ${endpoint}:`, schemaData);
        const response = await axiosInstance.post(endpoint, schemaData);
        console.log('Réponse de l\'API pour la création du schéma:', response.data);

        // Traitement de la réponse
        let newSchemaData = {};
        if (response.data && response.data.success && response.data.schema) {
          newSchemaData = response.data.schema;
        } else if (response.data && response.data.data) {
          newSchemaData = response.data.data;
        } else {
          newSchemaData = response.data;
        }

        const newSchema = this.formatSchema(newSchemaData);
        this.schemas.unshift(newSchema);
        return newSchema;
      } catch (error) {
        console.error('Erreur lors de la création du schéma de traitement:', error);
        console.error('Détails de l\'erreur:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
        
        this.error = error.response?.data?.message || error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Méthode utilitaire pour récupérer l'ID du médecin
    async getMedecinId(data) {
      if (!data.medecin_id) {
        // Essayer de récupérer l'ID du médecin depuis l'API
        try {
          const roleId = localStorage.getItem('role_id');
          if (!roleId) {
            throw new Error('ID de rôle non trouvé dans localStorage');
          }
          
          const response = await axiosInstance.get(`/medecins/${roleId}`);
          if (response.data && response.data._id) {
            console.log('ID du médecin récupéré dans le store:', response.data._id);
            data.medecin_id = response.data._id;
          } else {
            throw new Error('ID du médecin non trouvé dans la réponse');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'ID du médecin:', error);
          // Utiliser un ID temporaire au lieu de lancer une erreur
          data.medecin_id = 'temp_medecin_id';
          console.warn('Utilisation d\'un ID de médecin temporaire:', data.medecin_id);
        }
      }
      return data.medecin_id;
    },

    async updateSchema(schemaId, data) {
      this.loading = true
      this.error = null
      try {
        if (!schemaId) {
          throw new Error('ID du schéma requis pour la mise à jour')
        }

        console.log('Données à envoyer pour la mise à jour:', data)

        // Utiliser la route appropriée du backend
        const response = await axiosInstance.put(`/schemas-traitement/${schemaId}`, data)
        console.log('Réponse de l\'API pour la mise à jour:', response.data)

        // Vérifier le format de la réponse
        let updatedSchemaData = {}
        if (response.data && response.data.success && response.data.schema) {
          // Format {success: true, schema: {...}}
          updatedSchemaData = response.data.schema
        } else if (response.data && response.data.data) {
          // Format {data: {...}}
          updatedSchemaData = response.data.data
        } else {
          // Format direct {...}
          updatedSchemaData = response.data
        }

        const updatedSchema = this.formatSchema(updatedSchemaData)

        // Mettre à jour le schéma dans le state
        const index = this.schemas.findIndex(s => s._id === schemaId)
        if (index !== -1) {
          this.schemas[index] = { ...this.schemas[index], ...updatedSchema }
        }

        return updatedSchema
      } catch (error) {
        console.error('Erreur lors de la mise à jour du schéma de traitement:', error)
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

    async deleteSchema(schemaId) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.delete(`/schemas-traitement/${schemaId}`)
        // Mettre à jour l'état local
        this.schemas = this.schemas.filter(s => s._id !== schemaId && s.id !== schemaId)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Erreur lors de la suppression du schéma de traitement'
        console.error('Error deleting schema:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Générer un PDF pour un schéma de traitement
    async generatePDF(schemaId) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.get(`/schemas-traitement/${schemaId}/pdf`)
        
        if (response.data && response.data.success && response.data.url) {
          return {
            success: true,
            url: response.data.url,
            source: 'server',
            message: 'PDF généré avec succès'
          }
        } else if (response.data && response.data.url) {
          // Format simplifié qui renvoie directement l'URL
          return {
            success: true,
            url: response.data.url,
            source: 'server',
            message: 'PDF généré avec succès'
          }
        } else {
          throw new Error('Format de réponse inattendu pour la génération du PDF')
        }
      } catch (err) {
        console.error('Erreur lors de la génération du PDF du schéma de traitement:', err)
        this.error = err.response?.data?.message || 'Erreur lors de la génération du PDF'
        
        // En cas d'erreur API, vérifier si c'est une erreur 404 (endpoint non disponible)
        if (err.response && err.response.status === 404) {
          throw new Error('L\'API de génération de PDF n\'est pas disponible pour les schémas de traitement')
        }
        
        throw err
      } finally {
        this.loading = false
      }
    },

    async addComment(schemaId, commentaire) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.post(`/schemas-traitement/${schemaId}/commentaire`, { commentaire })
        
        // Vérifier le format de la réponse
        let updatedSchemaData = {}
        if (response.data && response.data.success && response.data.schema) {
          // Format {success: true, schema: {...}}
          updatedSchemaData = response.data.schema
        } else if (response.data && response.data.data) {
          // Format {data: {...}}
          updatedSchemaData = response.data.data
        } else {
          // Format direct {...}
          updatedSchemaData = response.data
        }

        const updatedSchema = this.formatSchema(updatedSchemaData)

        // Mettre à jour le schéma dans le state
        const index = this.schemas.findIndex(s => s._id === schemaId)
        if (index !== -1) {
          this.schemas[index] = { ...this.schemas[index], ...updatedSchema }
        }

        return updatedSchema
      } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async changeStatus(schemaId, statut, raison = null) {
      this.loading = true
      this.error = null
      try {
        const data = { statut }
        if (raison) data.raison = raison

        const response = await axiosInstance.patch(`/schemas-traitement/${schemaId}/statut`, data)
        
        // Vérifier le format de la réponse
        let updatedSchemaData = {}
        if (response.data && response.data.success && response.data.schema) {
          // Format {success: true, schema: {...}}
          updatedSchemaData = response.data.schema
        } else if (response.data && response.data.data) {
          // Format {data: {...}}
          updatedSchemaData = response.data.data
        } else {
          // Format direct {...}
          updatedSchemaData = response.data
        }

        const updatedSchema = this.formatSchema(updatedSchemaData)

        // Mettre à jour le schéma dans le state
        const index = this.schemas.findIndex(s => s._id === schemaId)
        if (index !== -1) {
          this.schemas[index] = { ...this.schemas[index], ...updatedSchema }
        }

        return updatedSchema
      } catch (error) {
        console.error('Erreur lors du changement de statut:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
}) 