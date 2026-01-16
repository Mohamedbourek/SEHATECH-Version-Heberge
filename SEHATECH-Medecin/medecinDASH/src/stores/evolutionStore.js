import { defineStore } from 'pinia'
import axiosInstance from '@/services/axios'

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

export const useEvolutionStore = defineStore('evolutions', {
  state: () => ({
    evolutions: [],
    loading: false,
    error: null,
    realTimeData: {},
    monitoringStatus: {}
  }),

  getters: {
    getEvolutionsByDossier: (state) => (dossierId) => {
      console.log('Getter getEvolutionsByDossier appelé avec dossierId:', dossierId)
      const filteredEvolutions = state.evolutions.filter(e => e.dossier_id === dossierId)
      console.log('Évolutions filtrées:', filteredEvolutions)
      return filteredEvolutions
    },

    getPatientRealTimeData: (state) => (patientId) => {
      return state.realTimeData[patientId] || {
        frequenceCardiaque: '--',
        temperature: '--',
        saturationO2: '--',
        tension: '--',
        lastUpdate: null
      }
    },

    getPatientMonitoringStatus: (state) => (patientId) => {
      return state.monitoringStatus[patientId] || {
        isMonitored: false,
        alerts: [],
        lastCheck: null
      }
    }
  },

  actions: {
    async fetchEvolutions(dossierId) {
      console.log('Début de la récupération des évolutions')
      this.loading = true
      this.error = null
      
      // Vérifier si dossierId est défini
      if (!dossierId) {
        console.warn('ID du dossier non défini, impossible de récupérer les évolutions')
        this.loading = false
        this.evolutions = []
        return []
      }
      
      try {
        // Construire l'URL
        const url = `/evolutions/dossier/${dossierId}`
        console.log('URL de la requête pour les évolutions:', url)
        
        const response = await axiosInstance.get(url)
        console.log('Réponse du serveur pour les évolutions:', response.status)
        
        // Vérifier le format de la réponse et extraire les données
        let evolutionsData = []
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Format direct [...]
            evolutionsData = response.data
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Format {success: true, data: [...]}
            evolutionsData = response.data.data
          } else if (response.data.evolutions && Array.isArray(response.data.evolutions)) {
            // Format {evolutions: [...]}
            evolutionsData = response.data.evolutions
          } else {
            console.warn('Format de réponse inattendu pour les évolutions:', response.data)
          }
        } else {
          console.warn('Réponse vide pour les évolutions')
        }
        
        console.log(`${evolutionsData.length} évolutions récupérées`)
        
        // Transformer les données et mettre à jour le state
        this.evolutions = evolutionsData.map(evolution => ({
          _id: evolution._id,
          dossier_id: evolution.dossier_id,
          nomMesure: evolution.nomMesure || 'Non spécifié',
          dateDeMesure: formatDateSafely(evolution.dateDeMesure || evolution.created_at),
          valeurDeMesure: evolution.valeurDeMesure,
          etat: evolution.etat || 'normal',
          commentaire: evolution.commentaire || '',
          medecin: evolution.medecin_id ? {
            id: evolution.medecin_id,
            nom: evolution.medecin?.utilisateur?.nom || 'Non spécifié',
            prenom: evolution.medecin?.utilisateur?.prenom || '',
            specialite: evolution.medecin?.specialite || 'Non spécifiée'
          } : null,
          created_at: formatDateSafely(evolution.created_at),
          updated_at: formatDateSafely(evolution.updated_at)
        }))
        
        return this.evolutions
      } catch (error) {
        console.error('Erreur détaillée lors de la récupération des évolutions:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        this.error = error.message
        this.evolutions = []
        return []
      } finally {
        this.loading = false
      }
    },

    // Méthode pour récupérer les évolutions directement depuis le dossier médical
    async fetchEvolutionsFromDossierMedical(dossierMedical) {
      if (!dossierMedical || !dossierMedical.evolutions) {
        console.warn('Dossier médical invalide ou sans évolutions')
        return []
      }

      console.log('Récupération des évolutions depuis le dossier médical:', dossierMedical._id)
      
      // Transformer les évolutions du dossier médical au format attendu
      const evolutionsTransformees = dossierMedical.evolutions.map(evolution => ({
        _id: evolution._id,
        dossier_id: dossierMedical._id,
        nomMesure: evolution.nomMesure || 'Non spécifié',
        dateDeMesure: formatDateSafely(evolution.dateDeMesure),
        valeurDeMesure: evolution.valeurDeMesure,
        etat: evolution.etat || 'normal',
        commentaire: evolution.commentaire || '',
        medecin: evolution.medecin_id ? {
          id: evolution.medecin_id,
          nom: evolution.medecin?.utilisateur?.nom || 'Non spécifié',
          prenom: evolution.medecin?.utilisateur?.prenom || '',
          specialite: evolution.medecin?.specialite || 'Non spécifiée'
        } : null,
        created_at: formatDateSafely(evolution.created_at),
        updated_at: formatDateSafely(evolution.updated_at)
      }))

      // Mettre à jour le state avec ces évolutions
      this.evolutions = evolutionsTransformees
      return evolutionsTransformees
    },

    async createEvolution(data) {
      this.loading = true;
      this.error = null;
      try {
        // Vérifier si l'ID du dossier est temporaire ou invalide
        if (!data.dossier_id || data.dossier_id === 'temp_id' || data.dossier_id.startsWith('temp_')) {
          console.warn('ID du dossier médical temporaire ou invalide:', data.dossier_id);
          
          // Si nous avons un patient_id, essayons de récupérer son dossier médical
          if (data.patient_id) {
            try {
              console.log('Tentative de récupération du dossier médical pour le patient:', data.patient_id);
              const patientResponse = await axiosInstance.get(`/patients/${data.patient_id}`);
              
              if (patientResponse.data && patientResponse.data.dossier_medical && patientResponse.data.dossier_medical._id) {
                data.dossier_id = patientResponse.data.dossier_medical._id;
                console.log('Dossier médical récupéré avec succès:', data.dossier_id);
              }
            } catch (patientError) {
              console.error('Erreur lors de la récupération du dossier médical du patient:', patientError);
            }
          }
          
          // Si nous n'avons toujours pas de dossier_id valide, créons l'évolution directement
          if (!data.dossier_id || data.dossier_id === 'temp_id' || data.dossier_id.startsWith('temp_')) {
            console.warn('Impossible de trouver un dossier médical valide, tentative de création directe');
            
            // Préparer les données pour l'API
            const evolutionData = {
              nomMesure: data.nomMesure || 'Mesure',
              valeurDeMesure: data.valeurDeMesure || '0',
              etat: data.etat || 'normal',
              commentaire: data.commentaire || '',
              patient_id: data.patient_id,
              medecin_id: data.medecin_id || localStorage.getItem('role_id')
            };
            
            console.log('Données d\'évolution à envoyer à l\'API (création directe):', evolutionData);
            
            try {
              const response = await axiosInstance.post('/evolutions/direct', evolutionData);
              console.log('Réponse de l\'API (création directe):', response.data);
              
              const newEvolution = response.data.evolution || response.data.data || response.data;
              this.evolutions.unshift(newEvolution);
              return newEvolution;
            } catch (directError) {
              console.error('Erreur lors de la création directe de l\'évolution:', directError);
              // Continuer avec la création normale, peut-être que le backend acceptera un ID temporaire
            }
          }
        }

        // Vérifier si le dossier existe
        if (data.dossier_id) {
          try {
            await axiosInstance.get(`/dossiers-medicaux/${data.dossier_id}`);
            console.log('Dossier médical trouvé:', data.dossier_id);
          } catch (error) {
            console.error('Erreur lors de la vérification du dossier médical:', error);
            if (error.response?.status === 404) {
              console.warn('Dossier médical non trouvé, tentative de création sans dossier');
              // Continuer quand même, peut-être que le backend acceptera un ID invalide
            }
          }
        }

        // Préparer les données pour l'API
        const evolutionData = {
          dossier_id: data.dossier_id,
          nomMesure: data.nomMesure || 'Mesure',
          valeurDeMesure: data.valeurDeMesure || '0',
          etat: data.etat || 'normal',
          commentaire: data.commentaire || ''
        };

        console.log('Données d\'évolution à envoyer à l\'API:', evolutionData);

        const response = await axiosInstance.post(`/evolutions/dossier/${data.dossier_id}`, evolutionData);
        console.log('Réponse de l\'API:', response.data);

        const newEvolution = response.data.evolution || response.data.data || response.data;
        this.evolutions.unshift(newEvolution);
        return newEvolution;
      } catch (error) {
        console.error('Erreur lors de la création de l\'évolution:', error);
        console.error('Détails de l\'erreur:', {
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

    async updateEvolution(evolutionId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.put(`/evolutions/${evolutionId}`, data)

        // Vérifier le format de la réponse
        let updatedEvolutionData = {}
        if (response.data && response.data.evolution) {
          updatedEvolutionData = response.data.evolution
        } else {
          updatedEvolutionData = response.data
        }

        // Mettre à jour l'évolution dans le state
        const index = this.evolutions.findIndex(e => e._id === evolutionId)
        if (index !== -1) {
          this.evolutions[index] = {
            ...this.evolutions[index],
            nomMesure: data.nomMesure || this.evolutions[index].nomMesure,
            valeurDeMesure: data.valeurDeMesure || this.evolutions[index].valeurDeMesure,
            etat: data.etat || this.evolutions[index].etat,
            commentaire: data.commentaire || this.evolutions[index].commentaire,
            updated_at: new Date().toISOString()
          }
        }

        return updatedEvolutionData
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'évolution:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteEvolution(evolutionId) {
      this.loading = true
      this.error = null
      try {
        await axiosInstance.delete(`/evolutions/${evolutionId}`)
        this.evolutions = this.evolutions.filter(e => e._id !== evolutionId && e.id !== evolutionId)
        return { success: true }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'évolution:', error)
        this.error = error.message || 'Erreur lors de la suppression'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Générer un PDF pour une évolution médicale
    async generatePDF(evolutionId) {
      this.loading = true
      this.error = null
      try {
        // 1. Essayer d'utiliser l'API du serveur pour générer le PDF
        try {
          const response = await axiosInstance.get(`/evolutions/${evolutionId}/pdf`, {
            timeout: 8000 // Timeout plus court pour éviter d'attendre trop longtemps
          })
          
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
        } catch (apiError) {
          console.warn('Erreur API lors de la génération du PDF, utilisation de la génération locale:', apiError)
          throw apiError // Forcer l'utilisation de la méthode locale
        }
      } catch (err) {
        console.log('Génération de PDF locale pour l\'évolution médicale')
        
        // 2. Si l'API échoue, utiliser la génération locale
        try {
          // Rechercher l'évolution par son ID
          const evolution = this.evolutions.find(e => e._id === evolutionId)
          
          if (!evolution) {
            console.log('Évolution non trouvée dans le store, tentative de récupération via API')
            // Si l'évolution n'est pas dans le store, la récupérer
            try {
              const evolutionResponse = await axiosInstance.get(`/evolutions/${evolutionId}`)
              const evolutionData = evolutionResponse.data.evolution || evolutionResponse.data
              
              // Importer dynamiquement la fonction de génération de PDF locale
              const { generateEvolutionPDF } = await import('@/utils/pdfGenerator')
              const pdfBlob = await generateEvolutionPDF(evolutionData)
              
              // Créer une URL temporaire pour le blob
              const blobUrl = URL.createObjectURL(pdfBlob)
              
              return {
                success: true,
                url: blobUrl,
                source: 'local',
                blob: pdfBlob,
                message: 'PDF généré localement avec succès'
              }
            } catch (fetchError) {
              console.error('Erreur lors de la récupération de l\'évolution:', fetchError)
              throw new Error('Impossible de récupérer les données de l\'évolution')
            }
          } else {
            // Évolution trouvée dans le store
            console.log('Utilisation des données locales pour la génération de PDF')
            
            // Importer dynamiquement la fonction de génération de PDF locale
            const { generateEvolutionPDF } = await import('@/utils/pdfGenerator')
            const pdfBlob = await generateEvolutionPDF(evolution)
            
            // Créer une URL temporaire pour le blob
            const blobUrl = URL.createObjectURL(pdfBlob)
            
            return {
              success: true,
              url: blobUrl,
              source: 'local',
              blob: pdfBlob,
              message: 'PDF généré localement avec succès'
            }
          }
        } catch (localGenError) {
          console.error('Erreur lors de la génération locale du PDF:', localGenError)
          this.error = 'Impossible de générer le PDF localement'
          throw new Error('Échec de la génération du PDF (API et locale)')
        }
      } finally {
        this.loading = false
      }
    },

    async getPatientEvolutions(patientId) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.get(`/evolutions/patient/${patientId}`)
        
        let evolutionsData = []
        if (response.data && Array.isArray(response.data)) {
          evolutionsData = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          evolutionsData = response.data.data
        } else {
          console.warn('Format de réponse inattendu:', response.data)
          return []
        }

        // Transformer les données
        const transformedEvolutions = evolutionsData.map(evolution => ({
          _id: evolution._id,
          dossier_id: evolution.dossier_id,
          nomMesure: evolution.nomMesure,
          dateDeMesure: new Date(evolution.dateDeMesure).toISOString(),
          valeurDeMesure: evolution.valeurDeMesure,
          etat: evolution.etat,
          commentaire: evolution.commentaire || '',
          medecin: evolution.medecin_id ? {
            id: evolution.medecin_id,
            nom: evolution.medecin?.utilisateur?.nom || 'Non spécifié',
            prenom: evolution.medecin?.utilisateur?.prenom || '',
            specialite: evolution.medecin?.specialite || 'Non spécifiée'
          } : null,
          created_at: new Date(evolution.created_at || Date.now()).toISOString(),
          updated_at: new Date(evolution.updated_at || Date.now()).toISOString()
        }))

        return transformedEvolutions
      } catch (error) {
        console.error('Erreur lors de la récupération des évolutions du patient:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async analyserEvolutions(patientId) {
      this.loading = true
      this.error = null
      try {
        const response = await axiosInstance.get(`/evolutions/patient/${patientId}/analyse`)
        return response.data
      } catch (error) {
        console.error('Erreur lors de l\'analyse des évolutions:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async startPatientMonitoring(patientId) {
      if (!patientId) return
      
      this.monitoringStatus[patientId] = {
        isMonitored: true,
        alerts: [],
        lastCheck: new Date().toISOString()
      }

      try {
        const response = await axiosInstance.post(`/patients/${patientId}/monitoring/start`)
        console.log('Surveillance à domicile activée pour le patient:', patientId)
        return response.data
      } catch (error) {
        console.error('Erreur lors du démarrage de la surveillance:', error)
        throw error
      }
    },

    async stopPatientMonitoring(patientId) {
      if (!patientId) return
      
      try {
        await axiosInstance.post(`/patients/${patientId}/monitoring/stop`)
        this.monitoringStatus[patientId] = {
          isMonitored: false,
          alerts: [],
          lastCheck: new Date().toISOString()
        }
        console.log('Surveillance à domicile désactivée pour le patient:', patientId)
      } catch (error) {
        console.error('Erreur lors de l\'arrêt de la surveillance:', error)
        throw error
      }
    },

    async updateRealTimeData(patientId) {
      if (!patientId || !this.monitoringStatus[patientId]?.isMonitored) return

      try {
        const response = await axiosInstance.get(`/patients/${patientId}/vitals/current`)
        const vitals = response.data

        this.realTimeData[patientId] = {
          frequenceCardiaque: vitals.frequenceCardiaque || '--',
          temperature: vitals.temperature || '--',
          saturationO2: vitals.saturationO2 || '--',
          tension: vitals.tension || '--',
          lastUpdate: new Date().toISOString()
        }

        // Vérifier les alertes
        const alerts = []
        if (vitals.frequenceCardiaque && (vitals.frequenceCardiaque < 50 || vitals.frequenceCardiaque > 100)) {
          alerts.push({ type: 'frequenceCardiaque', message: 'Fréquence cardiaque anormale', value: vitals.frequenceCardiaque })
        }
        if (vitals.temperature && (vitals.temperature < 36 || vitals.temperature > 38)) {
          alerts.push({ type: 'temperature', message: 'Température anormale', value: vitals.temperature })
        }
        if (vitals.saturationO2 && vitals.saturationO2 < 95) {
          alerts.push({ type: 'saturationO2', message: 'Saturation en oxygène basse', value: vitals.saturationO2 })
        }

        if (alerts.length > 0) {
          this.monitoringStatus[patientId].alerts = alerts
          // Créer une évolution automatique pour chaque alerte
          alerts.forEach(async (alert) => {
            await this.createEvolution({
              patient_id: patientId,
              nomMesure: alert.type,
              valeurDeMesure: alert.value,
              etat: 'attention',
              commentaire: `Alerte automatique: ${alert.message}`
            })
          })
        }

        return this.realTimeData[patientId]
      } catch (error) {
        console.error('Erreur lors de la mise à jour des données en temps réel:', error)
        throw error
      }
    }

  }
})