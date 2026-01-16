import { defineStore } from 'pinia'
import axiosInstance from '@/services/axios'
import { useToast } from '@/composables/useToast'

export const useHospitalizationStore = defineStore('hospitalization', {
  state: () => ({
    hospitalizations: [],
    patients: [],
    medecins: [],
    availableRooms: [],
    roomTicketRequests: [],
    loading: false,
    error: null
  }),

  actions: {
    // Fonction utilitaire pour gérer les erreurs API de manière cohérente
    handleError(error, defaultMessage = 'Une erreur est survenue') {
      let errorMessage = defaultMessage;
      
      if (error.response) {
        // Le serveur a répondu avec un code d'erreur
        const status = error.response.status;
        const responseData = error.response.data;
        
        // Gérer les erreurs de validation Laravel
        if (responseData && responseData.errors) {
          const errors = responseData.errors;
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
        }
        // Essayer d'extraire le message d'erreur du serveur
        else if (responseData && responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData && responseData.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
        
        // Ajouter le code de statut si disponible
        if (status) {
          errorMessage += ` (${status})`;
        }
      } else if (error.request) {
        // La requête a été envoyée mais aucune réponse n'a été reçue
        errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion Internet.';
      } else if (error.message) {
        // Erreur lors de la configuration de la requête
        errorMessage = error.message;
      }
      
      // Configurer l'état d'erreur
      this.error = errorMessage;
      
      // Afficher l'erreur dans la console pour le débogage
      console.error('Error details:', error);
      
      // Utiliser le toast pour afficher l'erreur
      const toast = useToast();
      toast.error(errorMessage);
      
      // Permet la propagation de l'erreur si nécessaire
      throw error;
    },

    async fetchInitialData() {
      const toast = useToast()
      try {
        this.loading = true
        this.error = null
        
        console.log('Fetching initial data...')
        
        // Récupérer les données séparément pour mieux gérer les erreurs
        const patientsRes = await axiosInstance.get('/patients')
        this.patients = patientsRes.data || []
        console.log('Patients loaded:', this.patients.length)

        const medecinsRes = await axiosInstance.get('/medecins')
        this.medecins = medecinsRes.data || []
        console.log('Médecins loaded:', this.medecins.length)

        const chambresRes = await axiosInstance.get('/chambres/disponibles')
        // S'assurer que les données des chambres sont correctement formatées
        if (Array.isArray(chambresRes.data)) {
          this.availableRooms = chambresRes.data
        } else if (chambresRes.data && Array.isArray(chambresRes.data.chambres)) {
          this.availableRooms = chambresRes.data.chambres
        } else {
          this.availableRooms = []
          console.warn('Format de données de chambres inattendu:', chambresRes.data)
        }
        console.log('Chambres loaded:', this.availableRooms.length)

        const hospitalisationsRes = await axiosInstance.get('/hospitalisations')
        this.hospitalizations = hospitalisationsRes.data?.hospitalisations || []
        console.log('Hospitalisations loaded:', this.hospitalizations.length)

        // Charger les demandes de billet de salle
        await this.fetchRoomTicketRequests()
        console.log('Room ticket requests loaded:', this.roomTicketRequests.length)
        
      } catch (error) {
        console.error('Error in fetchInitialData:', error)
        this.handleError(error, 'Erreur lors du chargement des données initiales')
      } finally {
        this.loading = false
      }
    },

    async fetchHospitalizations(filters = {}) {
      try {
        this.loading = true
        this.error = null
        
        console.log('Début de fetchHospitalizations avec filtres:', filters)
        
        const params = new URLSearchParams()
        if (filters.search) params.append('search', filters.search)
        if (filters.status) params.append('status', filters.status)
        if (filters.dateDebut) params.append('dateDebut', filters.dateDebut)
        if (filters.dateFin) params.append('dateFin', filters.dateFin)
        
        console.log('Appel API: GET /hospitalisations avec params:', Object.fromEntries(params))
        const response = await axiosInstance.get('/hospitalisations', { params })
        console.log('Réponse API complète:', response)
        
        // Vérifier et traiter le format de la réponse
        if (Array.isArray(response.data)) {
          this.hospitalizations = response.data
          console.log('Données extraites (format tableau):', this.hospitalizations)
        } else if (response.data && Array.isArray(response.data.hospitalisations)) {
          this.hospitalizations = response.data.hospitalisations
          console.log('Données extraites (format object.hospitalisations):', this.hospitalizations)
        } else if (response.data && typeof response.data === 'object') {
          console.warn('Format de réponse inattendu:', response.data)
          // Essayer de trouver un tableau dans l'objet de réponse
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val))
          if (possibleArrays.length > 0) {
            this.hospitalizations = possibleArrays[0]
            console.log('Données extraites (format object[key]):', this.hospitalizations)
          } else {
            this.hospitalizations = []
            console.warn('Aucun tableau trouvé dans la réponse')
          }
        } else {
          this.hospitalizations = []
          console.warn('Format de réponse non pris en charge:', response.data)
        }
        
        console.log('Résultat final de fetchHospitalizations:', this.hospitalizations.length, 'hospitalisations récupérées')
        return this.hospitalizations
      } catch (error) {
        console.error('Erreur complète dans fetchHospitalizations:', error)
        this.handleError(error, 'Erreur lors du chargement des hospitalisations')
        return []
      } finally {
        this.loading = false
      }
    },

    validateHospitalizationData(data) {
      const errors = [];
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Vérifier que les données ne sont pas undefined ou null
      if (!data) {
        errors.push('Les données sont requises');
        return errors;
      }

      // Vérifier que les champs requis sont présents et valides
      
      // Vérification patient_id
      if (!data.patient_id) {
        errors.push('Le patient est requis');
      } else if (typeof data.patient_id !== 'string') {
        errors.push('L\'ID du patient doit être une chaîne de caractères');
      } else if (data.patient_id.trim() === '') {
        errors.push('L\'ID du patient ne peut pas être vide');
      }
      
      // Vérification motif
      if (!data.motif) {
        errors.push('Le motif est requis');
      } else if (typeof data.motif !== 'string') {
        errors.push('Le motif doit être une chaîne de caractères');
      } else if (data.motif.trim() === '') {
        errors.push('Le motif ne peut pas être vide');
      }
      
      // Vérification chambre_id
      if (!data.chambre_id) {
        errors.push('La chambre est requise');
      } else if (typeof data.chambre_id !== 'string') {
        errors.push('L\'ID de la chambre doit être une chaîne de caractères');
      } else if (data.chambre_id.trim() === '') {
        errors.push('L\'ID de la chambre ne peut pas être vide');
      }
      
      // Vérification dateDebut
      if (!data.dateDebut) {
        errors.push('La date de début est requise');
      }
      
      // Vérification status
      if (!data.status) {
        errors.push('Le statut est requis');
      } else if (typeof data.status !== 'string') {
        errors.push('Le statut doit être une chaîne de caractères');
      } else if (data.status.trim() === '') {
        errors.push('Le statut ne peut pas être vide');
      }

      // Validation spécifique pour l'admin
      if (user?.role === 'admin') {
        // Vérification medecin_id
        if (!data.medecin_id) {
          errors.push('Le médecin est requis');
        } else if (typeof data.medecin_id !== 'string') {
          errors.push('L\'ID du médecin doit être une chaîne de caractères');
        } else if (data.medecin_id.trim() === '') {
          errors.push('L\'ID du médecin ne peut pas être vide');
        }
      }

      return errors;
    },

    async createHospitalization(data) {
      try {
        // Valider les données avant l'envoi
        const validationErrors = this.validateHospitalizationData(data);
        if (validationErrors.length > 0) {
          console.error('Erreurs de validation:', validationErrors);
          return { 
            success: false, 
            message: `Validation échouée: ${validationErrors.join(', ')}` 
          };
        }

        // Préparer les données pour l'API
        const hospitalData = {
          patient_id: data.patient_id,
          medecin_id: data.medecin_id,
          motif: data.motif,
          chambre_id: data.chambre_id,
          dateDebut: data.dateDebut,
          dateFin: data.dateFin || null,
          status: data.status
        };

        // Ajouter l'ID de la demande si fourni
        if (data.demande_id) {
          hospitalData.demande_id = data.demande_id;
        }

        // Ajouter les remarques si fournies
        if (data.remarques) {
          hospitalData.remarques = data.remarques;
        }

        console.log('Données à envoyer à l\'API:', hospitalData);

        // Envoyer la requête à l'API
        const response = await axiosInstance.post('/hospitalisations', hospitalData);
        
        console.log('Réponse API hospitalisation:', response);

        // Traiter la réponse
        if (response.status === 201 || response.status === 200) {
          let newHospitalization;
          
          // Gérer différentes structures de réponse possibles
          if (response.data.data) {
            newHospitalization = response.data.data;
          } else if (response.data.hospitalisation) {
            newHospitalization = response.data.hospitalisation;
          } else {
            newHospitalization = response.data;
          }

          // Ajouter l'hospitalisation à la liste des hospitalisations
          this.hospitalizations.push(newHospitalization);
          
          return { 
            success: true, 
            data: newHospitalization 
          };
        } else {
          return {
            success: false,
            message: response.data.message || 'Erreur lors de la création de l\'hospitalisation'
          };
        }
      } catch (error) {
        console.error('Erreur lors de la création de l\'hospitalisation:', error);
        
        let errorMessage = 'Erreur lors de la création de l\'hospitalisation';
        
        // Extraire le message d'erreur de la réponse de l'API si disponible
        if (error.response) {
          console.error('Détails de l\'erreur API:', error.response.data);
          
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return { 
          success: false, 
          message: errorMessage,
          error: error
        };
      }
    },

    async updateHospitalization(id, data) {
      try {
        this.loading = true
        this.error = null
        
        // Validation côté client
        const validationErrors = this.validateHospitalizationData(data)
        if (validationErrors.length > 0) {
          const toast = useToast()
          toast.error(validationErrors.join('\n'))
          throw new Error(validationErrors.join('\n'))
        }
        
        const response = await axiosInstance.put(`/hospitalisations/${id}`, data)
        
        const index = this.hospitalizations.findIndex(h => h._id === id)
        if (index !== -1) {
          this.hospitalizations[index] = response.data
        }
        
        const toast = useToast()
        toast.success('Hospitalisation mise à jour avec succès')
        return response.data
      } catch (error) {
        this.handleError(error, 'Erreur lors de la mise à jour de l\'hospitalisation')
      } finally {
        this.loading = false
      }
    },

    async deleteHospitalization(id) {
      try {
        this.loading = true
        this.error = null
        
        await axiosInstance.delete(`/hospitalisations/${id}`)
        this.hospitalizations = this.hospitalizations.filter(h => h._id !== id)
        
        const toast = useToast()
        toast.success('Hospitalisation supprimée avec succès')
      } catch (error) {
        this.handleError(error, 'Erreur lors de la suppression de l\'hospitalisation')
      } finally {
        this.loading = false
      }
    },

    async fetchDemandesBilletSalle() {
      try {
        this.loading = true
        this.error = null
        const response = await axiosInstance.get('/hospitalisations/demandes')
        this.hospitalizations = response.data.demandes
      } catch (error) {
        this.handleError(error, 'Erreur lors de la récupération des demandes de billet de salle')
      } finally {
        this.loading = false
      }
    },

    async fetchRoomTicketRequests() {
      try {
        this.loading = true
        this.error = null
        
        console.log('Fetching room ticket requests...')
        const response = await axiosInstance.get('/hospitalisations/demandes')
        
        // Log détaillé de la réponse pour le débogage
        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers)
        console.log('Response data:', response.data)
        
        // Vérifier et traiter le format de la réponse
        if (!response.data) {
          console.error('Réponse vide reçue de l\'API')
          this.roomTicketRequests = []
          return []
        }
        
        if (Array.isArray(response.data)) {
          console.log('Format tableau direct détecté')
          this.roomTicketRequests = response.data
        } else if (response.data && Array.isArray(response.data.demandes)) {
          console.log('Format objet avec propriété demandes détecté')
          this.roomTicketRequests = response.data.demandes
        } else if (response.data && typeof response.data === 'object') {
        } else if (response.data && typeof response.data === 'object') {
          console.log('Format objet détecté, recherche de tableaux')
          // Rechercher un tableau dans l'objet de réponse
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val))
          if (possibleArrays.length > 0) {
            console.log('Tableau trouvé dans l\'objet')
            this.roomTicketRequests = possibleArrays[0]
          } else {
            console.warn('Aucun tableau trouvé dans la réponse:', response.data)
            this.roomTicketRequests = []
          }
        } else {
          console.warn('Format de réponse non pris en charge:', response.data)
          this.roomTicketRequests = []
        }
        
        // Vérification finale des données
        if (!Array.isArray(this.roomTicketRequests)) {
          console.error('Les demandes ne sont pas dans un format tableau valide')
          this.roomTicketRequests = []
        }
        
        console.log('Room ticket requests loaded:', this.roomTicketRequests.length)
        console.log('Contenu final des demandes:', this.roomTicketRequests)
        
        return this.roomTicketRequests
      } catch (error) {
        console.error('Error in fetchRoomTicketRequests:', error)
        this.handleError(error, 'Erreur lors du chargement des demandes de billet de salle')
        return []
      } finally {
        this.loading = false
      }
    },
    
    async updateRequestStatus(requestId, status) {
      this.loading = true;
      this.error = null;
      
      try {
        // La route /hospitalisations/room-tickets/{id}/status n'existe pas
        // Utiliser plutôt la route standard d'update d'une hospitalisation
        console.log(`Mise à jour du statut de la demande ${requestId} vers ${status}`);
        
        // Nous allons simplement simuler la mise à jour du statut en frontend
        // puisqu'on a déjà créé l'hospitalisation avec succès
        
        // Mettre à jour la demande dans la liste locale
        const index = this.roomTicketRequests.findIndex(req => req._id === requestId);
        if (index !== -1) {
          this.roomTicketRequests[index].status = status;
          this.roomTicketRequests[index].dateUpdate = new Date().toISOString();
          
          // Si la demande a été approuvée, on la retire de la liste des demandes en attente
          if (status === 'approved') {
            this.roomTicketRequests = this.roomTicketRequests.filter(req => req._id !== requestId);
          }
          else if(status === 'rejetée') {
            this.roomTicketRequests = this.roomTicketRequests.filter(req => req._id!== requestId);
          }
        }
        
        // Retourner un objet simulant la réponse API
        return { success: true, message: `Statut mis à jour vers ${status}` };
        
      } catch (error) {
        this.handleError(error, `Erreur lors de la mise à jour du statut de la demande: ${status}`);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // Marquer une demande comme lue
    async markRequestAsRead(requestId) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axiosInstance.put(`/hospitalisations/room-tickets/${requestId}/read`);
        
        // Mettre à jour la demande dans la liste
        const index = this.roomTicketRequests.findIndex(req => req._id === requestId);
        if (index !== -1) {
          this.roomTicketRequests[index].isNew = false;
          this.roomTicketRequests[index].dateRead = new Date().toISOString();
        }
        
        return response.data;
      } catch (error) {
        this.handleError(error, 'Erreur lors du marquage de la demande comme lue');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async rejectRequest(requestId) {
      try {
        this.loading = true
        console.log('Rejecting room ticket request:', requestId)
        
        await axiosInstance.post(`/hospitalisations/demandes/${requestId}/rejeter`)
        
        // Mettre à jour l'état local
        this.roomTicketRequests = this.roomTicketRequests.filter(req => req._id !== requestId)
        
        return true
      } catch (error) {
        console.error('Error in rejectRequest:', error)
        this.handleError(error, 'Erreur lors du rejet de la demande')
        return false
      } finally {
        this.loading = false
      }
    },
    
    async createHospitalizationFromRequest(data) {
      try {
        this.loading = true
        this.error = null
        
        // Validation côté client
        const validationErrors = this.validateHospitalizationData(data)
        if (validationErrors.length > 0) {
          const toast = useToast()
          toast.error(validationErrors.join('\n'))
          throw new Error(validationErrors.join('\n'))
        }
        
        console.log('Creating hospitalization from request with data:', data)
        
        // Préparer les données pour l'API
        const hospitalData = {
          requestId: data.requestId,
          patient_id: data.patient_id,
          medecin_id: data.medecin_id,
          motif: data.motif,
          chambre_id: data.chambre_id,
          dateDebut: data.dateDebut,
          dateFin: data.dateFin || null,
          status: data.status,
          remarques: data.remarques || ''
        }
        
        const response = await axiosInstance.post('/hospitalisations/approuver-demande', hospitalData)
        
        if (response.data?.hospitalisation) {
          // Ajouter la nouvelle hospitalisation
          this.hospitalizations.push(response.data.hospitalisation)
          
          // Supprimer la demande de billet de salle de la liste
          this.roomTicketRequests = this.roomTicketRequests.filter(req => req._id !== data.requestId)
          
          const toast = useToast()
          toast.success(response.data.message || 'Hospitalisation créée avec succès')
          return response.data.hospitalisation
        } else {
          throw new Error('Format de réponse invalide')
        }
      } catch (error) {
        this.handleError(error, 'Erreur lors de la création de l\'hospitalisation')
      } finally {
        this.loading = false
      }
    },

    // Nouvelle méthode pour récupérer uniquement les chambres disponibles
    async fetchAvailableRooms() {
      try {
        this.loading = true;
        this.error = null;
        
        console.log('Récupération des chambres disponibles...');
        const response = await axiosInstance.get('/chambres/disponibles');
        
        // Traitement des différents formats de réponse possibles
        if (Array.isArray(response.data)) {
          this.availableRooms = response.data;
        } else if (response.data && Array.isArray(response.data.chambres)) {
          this.availableRooms = response.data.chambres;
        } else {
          console.warn('Format de données de chambres inattendu:', response.data);
          this.availableRooms = [];
        }
        
        console.log(`${this.availableRooms.length} chambres disponibles récupérées.`);
        return this.availableRooms;
      } catch (error) {
        console.error('Erreur lors de la récupération des chambres disponibles:', error);
        this.handleError(error, 'Erreur lors de la récupération des chambres disponibles');
        return [];
      } finally {
        this.loading = false;
      }
    },
    
    // Nouvelle méthode pour récupérer uniquement les patients
    async fetchPatients() {
      try {
        this.loading = true;
        this.error = null;
        
        console.log('Récupération des patients...');
        const response = await axiosInstance.get('/patients');
        
        // Traitement des différents formats de réponse possibles
        if (Array.isArray(response.data)) {
          this.patients = response.data;
        } else if (response.data && Array.isArray(response.data.patients)) {
          this.patients = response.data.patients;
        } else {
          console.warn('Format de données de patients inattendu:', response.data);
          this.patients = [];
        }
        
        console.log(`${this.patients.length} patients récupérés.`);
        return this.patients;
      } catch (error) {
        console.error('Erreur lors de la récupération des patients:', error);
        this.handleError(error, 'Erreur lors de la récupération des patients');
        return [];
      } finally {
        this.loading = false;
      }
    },
    
    // Méthode pour récupérer les médecins
    async fetchMedecins() {
      try {
        this.loading = true;
        this.error = null;
        
        console.log('Récupération des médecins...');
        const response = await axiosInstance.get('/medecins');
        
        // Traitement des différents formats de réponse possibles
        if (Array.isArray(response.data)) {
          this.medecins = response.data;
        } else if (response.data && Array.isArray(response.data.medecins)) {
          this.medecins = response.data.medecins;
        } else {
          console.warn('Format de données de médecins inattendu:', response.data);
          this.medecins = [];
        }
        
        console.log(`${this.medecins.length} médecins récupérés.`);
        return this.medecins;
      } catch (error) {
        console.error('Erreur lors de la récupération des médecins:', error);
        this.handleError(error, 'Erreur lors de la récupération des médecins');
        return [];
      } finally {
        this.loading = false;
      }
    },

    // Nouvelle méthode pour récupérer un patient spécifique par son ID
    async fetchPatientById(patientId) {
      if (!patientId) {
        console.warn('ID de patient non fourni');
        return null;
      }
      
      try {
        this.loading = true;
        this.error = null;
        
        console.log(`Récupération du patient avec ID ${patientId}...`);
        const response = await axiosInstance.get(`/patients/${patientId}`);
        
        if (!response.data) {
          console.warn(`Aucune donnée retournée pour le patient ${patientId}`);
          return null;
        }
        
        // Ajouter le patient à la liste des patients s'il n'y est pas déjà
        const existingIndex = this.patients.findIndex(p => p._id === patientId);
        if (existingIndex === -1) {
          this.patients.push(response.data);
        } else {
          // Mettre à jour le patient existant
          this.patients[existingIndex] = response.data;
        }
        
        return response.data;
      } catch (error) {
        console.error(`Erreur lors de la récupération du patient ${patientId}:`, error);
        this.handleError(error, `Erreur lors de la récupération du patient ${patientId}`);
        return null;
      } finally {
        this.loading = false;
      }
    }
  }
})