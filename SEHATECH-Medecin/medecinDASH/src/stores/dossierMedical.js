import { defineStore } from 'pinia'
import { ref } from 'vue'
import axiosInstance from '@/services/axios'
import { useEvolutionStore } from '@/stores/evolutionStore'

// Fonction utilitaire pour formater les dates au format yyyy-MM-dd
const formatDateToHTML5 = (dateString) => {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.warn('Date invalide pour le format HTML5:', dateString)
    return null
  }
}

// Fonction utilitaire pour valider et formater les dates
const formatDateSafely = (dateValue) => {
  if (!dateValue) return null
  try {
    const date = new Date(dateValue)
    // Vérifier si la date est valide
    return date instanceof Date && !isNaN(date) ? date.toISOString() : null
  } catch (error) {
    console.warn('Date invalide:', dateValue)
    return null
  }
}

export const useDossierMedicalStore = defineStore('dossierMedical', () => {
  const dossiers = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Récupérer tous les dossiers médicaux avec les relations
  const fetchDossiersMedicaux = async () => {
    loading.value = true
    try {
      const response = await axiosInstance.get('/dossiers-medicaux/patients')
      
      // Log pour le débogage
      console.log('Données des dossiers reçues:', response.data)
      console.log('Structure du premier dossier:', response.data[0] ? {
        medecin: response.data[0].medecin,
        medecin_id: response.data[0].medecin_id,
        medecin_utilisateur: response.data[0].medecin?.utilisateur
      } : 'Aucun dossier')
      
      // Transformation des données pour inclure les informations complètes
      const dossiersComplets = response.data.map(dossier => ({
        ...dossier,
        medecin_traitant: dossier.medecin?.utilisateur ? {
          id: dossier.medecin._id,
          nom: dossier.medecin.utilisateur.nom,
          prenom: dossier.medecin.utilisateur.prenom,
          service: dossier.medecin.service || 'Non spécifié',
          specialite: dossier.medecin.specialite || 'Non spécifié'
        } : null,
        patient_info: dossier.patient?.utilisateur ? {
          id: dossier.patient._id,
          nom: dossier.patient.utilisateur.nom,
          prenom: dossier.patient.utilisateur.prenom,
          dateNaissance: dossier.patient.utilisateur.dateNaissance,
          sexe: dossier.patient.utilisateur.sexe
        } : null,
        documents: dossier.documents?.map(doc => ({
          ...doc,
          url: doc.path ? `${process.env.VUE_APP_API_URL}/storage/${doc.path}` : null,
          type: doc.type || 'document',
          dateAjout: doc.created_at || new Date().toISOString()
        })) || []
      }))
      
      dossiers.value = dossiersComplets
      return dossiersComplets
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Récupérer un dossier médical spécifique avec toutes les relations
  const fetchDossierMedical = async (id) => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/dossiers-medicaux/${id}`)
      const dossier = response.data
      
      console.log('Données brutes du dossier médical:', dossier)
      
      // Transformation des données pour le dossier spécifique
      const dossierComplet = {
        ...dossier,
        medecin_traitant: dossier.medecin?.utilisateur ? {
          id: dossier.medecin._id,
          nom: dossier.medecin.utilisateur.nom,
          prenom: dossier.medecin.utilisateur.prenom,
          service: dossier.medecin.service || 'Non spécifié',
          specialite: dossier.medecin.specialite || 'Non spécifié'
        } : null,
        patient_info: dossier.patient?.utilisateur ? {
          id: dossier.patient._id,
          nom: dossier.patient.utilisateur.nom,
          prenom: dossier.patient.utilisateur.prenom,
          dateNaissance: formatDateSafely(dossier.patient.utilisateur.dateNaissance),
          sexe: dossier.patient.utilisateur.sexe
        } : null,
        examens: dossier.examens?.map(examen => ({
          _id: examen._id,
          type: examen.type || 'Non spécifié',
          date: formatDateSafely(examen.date),
          resultat: examen.resultat || null,
          interpretation: examen.interpretation || '',
          statut: examen.statut || 'en_attente',
          dossier_id: examen.dossier_id || dossier._id,
          medecin: examen.medecin?.utilisateur ? {
            id: examen.medecin._id,
            nom: examen.medecin.utilisateur.nom,
            prenom: examen.medecin.utilisateur.prenom,
            specialite: examen.medecin.specialite || 'Non spécifiée'
          } : null,
          fichiers: examen.fichiers?.map(fichier => ({
            path: fichier,
            url: `${process.env.VUE_APP_API_URL}/storage/${fichier}`,
            name: fichier.split('/').pop()
          })) || [],
          created_at: formatDateSafely(examen.created_at),
          updated_at: formatDateSafely(examen.updated_at),
          commentaires: examen.commentaires || [],
          priorite: examen.priorite || 'normale',
          categorie: examen.categorie || 'general',
          valeurs_reference: examen.valeurs_reference || null,
          laboratoire: examen.laboratoire || null
        })) || [],
        documents: dossier.documents?.map(doc => ({
          ...doc,
          url: doc.path ? `${process.env.VUE_APP_API_URL}/storage/${doc.path}` : null,
          type: doc.type || 'document',
          dateAjout: formatDateSafely(doc.created_at) || formatDateSafely(new Date())
        })) || [],
        consultations: dossier.consultations?.map(consultation => ({
          _id: consultation._id,
          date: formatDateSafely(consultation.dateConsultation),
          motif: consultation.motifConsultation,
          observations: consultation.observations || '',
          diagnostic: consultation.diagnostic || '',
          dossier_id: consultation.dossier_id || dossier._id,
          medecin: consultation.medecin?.utilisateur ? {
            id: consultation.medecin._id,
            nom: consultation.medecin.utilisateur.nom,
            prenom: consultation.medecin.utilisateur.prenom,
            specialite: consultation.medecin.specialite || 'Non spécifiée'
          } : null,
          created_at: formatDateSafely(consultation.created_at),
          updated_at: formatDateSafely(consultation.updated_at)
        })) || [],
        evolution: [],
        evolutions: dossier.evolutions?.map(evolution => ({
          _id: evolution._id,
          nomMesure: evolution.nomMesure || 'Non spécifié',
          dateDeMesure: formatDateSafely(evolution.dateDeMesure),
          valeurDeMesure: evolution.valeurDeMesure || 0,
          etat: evolution.etat || 'normal',
          commentaire: evolution.commentaire || '',
          medecin_id: evolution.medecin_id,
          medecin: evolution.medecin?.utilisateur ? {
            id: evolution.medecin._id,
            nom: evolution.medecin.utilisateur.nom,
            prenom: evolution.medecin.utilisateur.prenom,
            specialite: evolution.medecin.specialite || 'Non spécifiée'
          } : null,
          created_at: formatDateSafely(evolution.created_at),
          updated_at: formatDateSafely(evolution.updated_at)
        })) || [],
        rapports: dossier.rapports?.map(rapport => ({
          _id: rapport._id,
          titre: rapport.titre || 'Rapport sans titre',
          contenu: rapport.contenu || '',
          date: formatDateSafely(rapport.date),
          type: rapport.type || 'general',
          medecin: rapport.medecin?.utilisateur ? {
            id: rapport.medecin._id,
            nom: rapport.medecin.utilisateur.nom,
            prenom: rapport.medecin.utilisateur.prenom,
            specialite: rapport.medecin.specialite || 'Non spécifiée'
          } : null,
          created_at: formatDateSafely(rapport.created_at),
          updated_at: formatDateSafely(rapport.updated_at)
        })) || [],
        antecedents: dossier.antecedents || [],
        allergies: dossier.allergies || [],
        signesVitaux: dossier.signesVitaux?.map(sv => ({
          ...sv,
          date: formatDateSafely(sv.date)
        })) || [],
        dateEntree: formatDateSafely(dossier.dateEntree),
        dateSortie: formatDateSafely(dossier.dateSortie),
        derniereMiseAJour: formatDateSafely(dossier.derniereMiseAJour),
        is_urgent: Boolean(dossier.is_urgent),
        is_archived: Boolean(dossier.is_archived),
        diagnostic_principal: dossier.diagnostic_principal || '',
        traitement: dossier.traitement || '',
        surveillance: dossier.surveillance || ''
      }
      
      console.log('Dossier complet avec examens:', dossierComplet)
      return dossierComplet
    } catch (err) {
      error.value = err.message
      console.error('Erreur lors de la récupération du dossier:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Rechercher des dossiers médicaux
  const searchDossiersMedicaux = async (params) => {
    loading.value = true
    try {
      const response = await axiosInstance.get('/dossiers-medicaux/search/filter', { params })
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Créer un nouveau dossier médical
  const createDossierMedical = async (patientId, dossierData) => {
    loading.value = true
    try {
      const formData = new FormData()
      
      // Ajout des champs au formData
      Object.keys(dossierData).forEach(key => {
        if (key === 'documents' && Array.isArray(dossierData.documents)) {
          dossierData.documents.forEach(file => {
            formData.append('documents[]', file)
          })
        } else if (Array.isArray(dossierData[key])) {
          formData.append(key, JSON.stringify(dossierData[key]))
        } else {
          formData.append(key, dossierData[key])
        }
      })

      const response = await axiosInstance.post(`/dossiers-medicaux/patients/${patientId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mettre à jour un dossier médical
  const updateDossierMedical = async (id, dossierData) => {
    loading.value = true
    try {
      // Validation des données requises
      if (!id) {
        throw new Error('ID du dossier médical requis')
      }

      let response;
      
      // Gestion du cas où dossierData est déjà un FormData
      if (dossierData instanceof FormData) {
        response = await axiosInstance.put(`/dossiers-medicaux/${id}`, dossierData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } 
      // Gestion des objets JSON simples (sans fichiers)
      else if (typeof dossierData === 'object' && !Array.isArray(dossierData) && !(dossierData instanceof FormData)) {
        // Vérifier si l'objet contient des fichiers (File)
        const containsFiles = Object.values(dossierData).some(value => 
          value instanceof File || 
          (Array.isArray(value) && value.some(item => item instanceof File))
        );
        
        if (containsFiles) {
          // Créer un FormData pour gérer les fichiers
          const formData = new FormData();
          
          // Traitement des champs
          Object.entries(dossierData).forEach(([key, value]) => {
            if (value instanceof File) {
              formData.append(key, value);
            } else if (Array.isArray(value) && value.some(item => item instanceof File)) {
              // Si le tableau contient des fichiers
              value.forEach(item => {
                if (item instanceof File) {
                  formData.append(`${key}[]`, item);
                }
              });
              
              // Si le tableau contient aussi des objets non-fichiers
              const nonFileItems = value.filter(item => !(item instanceof File));
              if (nonFileItems.length > 0) {
                formData.append(`${key}_data`, JSON.stringify(nonFileItems));
              }
            } else if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'boolean') {
              formData.append(key, value ? '1' : '0');
            } else if (value !== null && value !== undefined) {
              formData.append(key, value);
            }
          });
          
          response = await axiosInstance.put(`/dossiers-medicaux/${id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          // Pas de fichiers, on peut utiliser directement JSON
          response = await axiosInstance.put(`/dossiers-medicaux/${id}`, dossierData);
        }
      }
      // Si c'est déjà un FormData correctement construit
      else {
        throw new Error('Format de données non pris en charge');
      }

      // Mise à jour du dossier dans le state avec toutes les relations
      const updatedDossier = response.data.dossier
      const index = dossiers.value.findIndex(d => d._id === id)
      
      if (index !== -1) {
        // Transformation complète des données pour le dossier mis à jour
        dossiers.value[index] = {
          ...updatedDossier,
          medecin_traitant: updatedDossier.medecin?.utilisateur ? {
            id: updatedDossier.medecin._id,
            nom: updatedDossier.medecin.utilisateur.nom,
            prenom: updatedDossier.medecin.utilisateur.prenom,
            service: updatedDossier.medecin.service || 'Non spécifié',
            specialite: updatedDossier.medecin.specialite || 'Non spécifié'
          } : null,
          patient_info: updatedDossier.patient?.utilisateur ? {
            id: updatedDossier.patient._id,
            nom: updatedDossier.patient.utilisateur.nom,
            prenom: updatedDossier.patient.utilisateur.prenom,
            dateNaissance: formatDateToHTML5(updatedDossier.patient.utilisateur.dateNaissance),
            sexe: updatedDossier.patient.utilisateur.sexe
          } : null,
          documents: updatedDossier.documents?.map(doc => ({
            ...doc,
            url: doc.path ? `${process.env.VUE_APP_API_URL}/storage/${doc.path}` : null,
            type: doc.type || 'document',
            dateAjout: formatDateToHTML5(doc.created_at) || formatDateToHTML5(new Date())
          })) || [],
          examens: updatedDossier.examens?.map(examen => ({
            ...examen,
            date: formatDateToHTML5(examen.date),
            medecin: examen.medecin?.utilisateur ? {
              id: examen.medecin._id,
              nom: examen.medecin.utilisateur.nom,
              prenom: examen.medecin.utilisateur.prenom,
              specialite: examen.medecin.specialite || 'Non spécifiée'
            } : null,
            fichiers: examen.fichiers?.map(fichier => ({
              path: fichier,
              url: `${process.env.VUE_APP_API_URL}/storage/${fichier}`,
              name: fichier.split('/').pop()
            })) || []
          })) || [],
          consultations: updatedDossier.consultations?.map(consultation => ({
            ...consultation,
            date: formatDateToHTML5(consultation.dateConsultation),
            motif: consultation.motifConsultation,
            medecin: consultation.medecin?.utilisateur ? {
              id: consultation.medecin._id,
              nom: consultation.medecin.utilisateur.nom,
              prenom: consultation.medecin.utilisateur.prenom,
              specialite: consultation.medecin.specialite || 'Non spécifiée'
            } : null
          })) || [],
          evolution: updatedDossier.evolution || [],
          antecedents: updatedDossier.antecedents || [],
          allergies: updatedDossier.allergies || [],
          signesVitaux: updatedDossier.signesVitaux?.map(sv => ({
            ...sv,
            date: formatDateToHTML5(sv.date)
          })) || [],
          dateEntree: formatDateToHTML5(updatedDossier.dateEntree),
          dateSortie: formatDateToHTML5(updatedDossier.dateSortie),
          derniereMiseAJour: formatDateToHTML5(updatedDossier.derniereMiseAJour),
          is_urgent: Boolean(updatedDossier.is_urgent),
          is_archived: Boolean(updatedDossier.is_archived),
          diagnostic_principal: updatedDossier.diagnostic_principal || '',
          traitement: updatedDossier.traitement || '',
          surveillance: updatedDossier.surveillance || ''
        }
      }

      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Erreur lors de la mise à jour du dossier médical:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Supprimer un dossier médical
  const deleteDossierMedical = async (id) => {
    loading.value = true
    try {
      await axiosInstance.delete(`/dossiers-medicaux/${id}`)
      dossiers.value = dossiers.value.filter(d => d._id !== id)
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Ajouter un rapport au dossier
  const ajouterRapport = async (id, rapportData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/dossiers-medicaux/${id}/rapports`, rapportData)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Ajouter un examen au dossier
  const ajouterExamen = async (id, examenData) => {
    loading.value = true
    try {
      // Vérifier si l'ID du dossier est fourni
      if (!id) {
        throw new Error('ID du dossier médical requis')
      }

      // Préparer les données pour l'API
      const formData = new FormData()
      
      // Ajouter les champs de base
      const baseFields = [
        'type', 'date', 'interpretation', 'statut', 
        'priorite', 'categorie', 'commentaires'
      ]
      
      baseFields.forEach(field => {
        if (examenData[field] !== undefined && examenData[field] !== null) {
          if (typeof examenData[field] === 'object') {
            formData.append(field, JSON.stringify(examenData[field]))
          } else {
            formData.append(field, examenData[field])
          }
        }
      })

      // Ajouter les résultats
      if (examenData.resultat) {
        formData.append('resultat', JSON.stringify(examenData.resultat))
      }

      // Ajouter les fichiers
      if (examenData.fichiers) {
        examenData.fichiers.forEach(file => {
          formData.append('fichiers[]', file)
        })
      }

      // Appel API
      const response = await axiosInstance.post(`/dossiers-medicaux/${id}/examens`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Vérifier le format de la réponse
      let examen = {}
      if (response.data && response.data.examen) {
        examen = response.data.examen
      } else {
        examen = response.data
      }

      return {
        ...examen,
        dossier_id: id,
        date: formatDateSafely(examen.date),
        fichiers: examen.fichiers?.map(fichier => ({
          path: fichier,
          url: `${process.env.VUE_APP_API_URL}/storage/${fichier}`,
          name: fichier.split('/').pop()
        })) || []
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur lors de l\'ajout de l\'examen:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Archiver un dossier médical
  const archiverDossier = async (id) => {
    loading.value = true
    try {
      const response = await axiosInstance.patch(`/dossiers-medicaux/${id}/archive`)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Générer un PDF du dossier
  const generatePDF = async (id) => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/dossiers-medicaux/${id}/pdf`, {
        responseType: 'blob'
      })
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Obtenir l'historique d'un dossier
  const getHistorique = async (id) => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/dossiers-medicaux/${id}/historique`)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Synchroniser les évolutions avec le store d'évolutions
  const syncEvolutionsWithStore = async (dossier) => {
    if (!dossier || !dossier.evolutions) {
      console.warn('Aucune évolution à synchroniser')
      return
    }

    try {
      loading.value = true
      const evolutionStore = useEvolutionStore()
      
      // Transformer les évolutions au format attendu par le store d'évolutions
      const transformedEvolutions = dossier.evolutions.map(evolution => ({
        _id: evolution._id,
        dossier_id: dossier._id,
        nomMesure: evolution.nomMesure || 'Non spécifié',
        dateDeMesure: formatDateSafely(evolution.dateDeMesure) || formatDateSafely(new Date()),
        valeurDeMesure: evolution.valeurDeMesure || 0,
        etat: evolution.etat || 'normal',
        commentaire: evolution.commentaire || '',
        medecin_id: evolution.medecin_id,
        medecin: evolution.medecin ? {
          id: evolution.medecin._id,
          nom: evolution.medecin.utilisateur?.nom || 'Non spécifié',
          prenom: evolution.medecin.utilisateur?.prenom || '',
          specialite: evolution.medecin.specialite || 'Non spécifiée'
        } : null,
        created_at: formatDateSafely(evolution.created_at) || formatDateSafely(new Date()),
        updated_at: formatDateSafely(evolution.updated_at) || formatDateSafely(new Date())
      }))
      
      // Mettre à jour le store d'évolutions
      await evolutionStore.$patch({ evolutions: transformedEvolutions })
      console.log('Évolutions synchronisées avec succès:', transformedEvolutions.length)
      
      return transformedEvolutions
    } catch (err) {
      console.error('Erreur lors de la synchronisation des évolutions:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Ajouter un document au dossier
  const addDocument = async (dossierId, file) => {
    loading.value = true
    try {
      const formData = new FormData()
      formData.append('document', file)
      
      const response = await axiosInstance.post(`/dossiers-medicaux/${dossierId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Mise à jour du dossier local si nécessaire
      const index = dossiers.value.findIndex(d => d._id === dossierId)
      if (index !== -1 && response.data.document) {
        const newDoc = {
          ...response.data.document,
          url: response.data.document.path ? `${process.env.VUE_APP_API_URL}/storage/${response.data.document.path}` : null,
          type: file.type || 'document',
          dateAjout: new Date().toISOString()
        }
        
        if (!dossiers.value[index].documents) {
          dossiers.value[index].documents = []
        }
        
        dossiers.value[index].documents.push(newDoc)
      }
      
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Supprimer un document du dossier
  const deleteDocument = async (dossierId, documentId) => {
    loading.value = true
    try {
      const response = await axiosInstance.delete(`/dossiers-medicaux/${dossierId}/documents/${documentId}`)
      
      // Mise à jour du dossier local
      const index = dossiers.value.findIndex(d => d._id === dossierId)
      if (index !== -1) {
        dossiers.value[index].documents = dossiers.value[index].documents.filter(
          doc => doc.id !== documentId && doc._id !== documentId
        )
      }
      
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    dossiers,
    loading,
    error,
    formatDateToHTML5,
    fetchDossiersMedicaux,
    fetchDossierMedical,
    searchDossiersMedicaux,
    createDossierMedical,
    updateDossierMedical,
    deleteDossierMedical,
    ajouterRapport,
    ajouterExamen,
    archiverDossier,
    generatePDF,
    getHistorique,
    syncEvolutionsWithStore,
    // Fonction pour synchroniser les examens avec le store d'examens
    syncExamensWithStore: async (dossier) => {
      if (!dossier || !dossier._id || !dossier.examens) {
        console.warn('Dossier invalide ou sans examens pour la synchronisation')
        return []
      }
      
      try {
        // Importer le store des examens dynamiquement pour éviter les dépendances circulaires
        const { useExamenStore } = await import('./examenStore')
        const examenStore = useExamenStore()
        
        // Synchroniser les examens avec le store dédié
        return await examenStore.fetchExamensFromDossierMedical(dossier)
      } catch (err) {
        console.error('Erreur lors de la synchronisation des examens:', err)
        error.value = err.message
        return []
      }
    },
    // Fonction pour synchroniser les consultations avec le store de consultations
    syncConsultationsWithStore: async (dossier) => {
      if (!dossier || !dossier._id || !dossier.consultations) {
        console.warn('Dossier invalide ou sans consultations pour la synchronisation')
        return []
      }
      
      try {
        // Importer le store des consultations dynamiquement pour éviter les dépendances circulaires
        const { useConsultationStore } = await import('./consultationStore')
        const consultationStore = useConsultationStore()
        
        // Synchroniser les consultations avec le store dédié
        return await consultationStore.fetchConsultationsFromDossierMedical(dossier)
      } catch (err) {
        console.error('Erreur lors de la synchronisation des consultations:', err)
        error.value = err.message
        return []
      }
    },
    // Fonction pour synchroniser les rapports avec le store de rapports
    syncRapportsWithStore: async (dossier) => {
      if (!dossier || !dossier._id || !dossier.rapports) {
        console.warn('Dossier invalide ou sans rapports pour la synchronisation')
        return []
      }
      
      try {
        // Importer le store des rapports dynamiquement pour éviter les dépendances circulaires
        const { useRapportStore } = await import('./rapportStore')
        const rapportStore = useRapportStore()
        
        // Synchroniser les rapports avec le store dédié
        return await rapportStore.fetchRapportsFromDossierMedical(dossier)
      } catch (err) {
        console.error('Erreur lors de la synchronisation des rapports:', err)
        error.value = err.message
        return []
      }
    },
    // Ajouter un document au dossier
    addDocument,
    // Supprimer un document du dossier
    deleteDocument
  }
})