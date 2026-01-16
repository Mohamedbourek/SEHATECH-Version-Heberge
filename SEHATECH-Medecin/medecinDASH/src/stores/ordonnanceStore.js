import { defineStore } from 'pinia'
import { ref } from 'vue'  // Add this import
import axios from '@/services/axios'
import { useUserStore } from './user'

export const useOrdonnanceStore = defineStore('ordonnance', () => {
  const ordonnances = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fonction pour mapper l'ordonnance reçue par l'API dans le format attendu côté client
  function mapApiOrdonnance(apiOrdonnance) {
    return {
      _id: apiOrdonnance._id,
      dateEmission: apiOrdonnance.dateEmission,
      renouvelable: apiOrdonnance.renouvelable,
      statut: apiOrdonnance.statut,
      dossier_medical_id: apiOrdonnance.dossier_medical_id,
      medecin_id: apiOrdonnance.medecin_id,
      medecin: apiOrdonnance.medecin ? {
        _id: apiOrdonnance.medecin._id,
        nom: apiOrdonnance.medecin.nom,
        prenom: apiOrdonnance.medecin.prenom,
        specialite: apiOrdonnance.medecin.specialite
      } : null,
      medicaments: apiOrdonnance.medicaments || [] // Pour simplifier, on garde la liste telle quelle
    }
  }

  // Récupération des ordonnances pour un dossier médical donné
  async function fetchOrdonnances(dossierId, medecin) {
    loading.value = true;
    error.value = null;
  
    try {
      const userStore = useUserStore();
      const medecinId = medecin?._id
        || userStore.user?.medecin?._id
        || localStorage.getItem('role_id');
  
      console.log('Début de la récupération des ordonnances');
      const url = dossierId
        ? `/ordonnances?dossier_id=${dossierId}&medecin_id=${medecinId}`
        : `/ordonnances?medecin_id=${medecinId}`;
      console.log('URL de la requête:', url);
  
      const response = await axios.get(url);
      console.log('Réponse du serveur pour les ordonnances:', response.status);
  
      // 1) Récupérer rawData
      const raw = response.data;
  
      // 2) Normaliser en tableau, quel que soit le format reçu
      let ordonnancesData = [];
      if (Array.isArray(raw)) {
        ordonnancesData = raw;
      } else if (Array.isArray(raw.data)) {
        ordonnancesData = raw.data;
      } else if (Array.isArray(raw.ordonnances)) {
        ordonnancesData = raw.ordonnances;
      } else if (raw && typeof raw === 'object') {
        // On a reçu un objet unique => on le wrappe dans un tableau
        ordonnancesData = [raw];
      } else {
        console.warn('Format de réponse inattendu pour les ordonnances:', raw);
      }
  
      console.log(`${ordonnancesData.length} ordonnance(s) récupérée(s)`);
  
      // 3) Transformer et filtrer
      const toutes = ordonnancesData.map(ord => mapApiOrdonnance(ord));
      const filtrées = toutes.filter(ord => ord.medecin_id === medecinId);
  
      ordonnances.value = filtrées;
      return ordonnances.value;
  
    } catch (err) {
      console.error('Erreur lors du chargement des ordonnances:', err);
      error.value = err.response?.data?.message || 'Erreur lors du chargement des ordonnances';
      ordonnances.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  }
  
  async function createOrdonnance(data) {
    loading.value = true
    error.value = null
    try {
      // Fetch patient data to get dossier_medical._id
      const patientResponse = await axios.get(`/patients/${data.patient_id}`)
      const dossierMedicalId = patientResponse.data.dossier_medical?._id || null
      const patient_id = patientResponse.data._id
      console.log(patientResponse)
      const payload = {
        dossier_id: dossierMedicalId,
        patient_id: patient_id,
        renouvelable: data.renouvelable,
        urgent: data.urgent,
        non_substituable: data.non_substituable,
        notes_pharmacien: data.notes_pharmacien,
        medicaments: data.medicaments
      }
      const response = await axios.post(`/ordonnances`, payload)
      const created = mapApiOrdonnance(response.data.ordonnance)
      ordonnances.value.push(created)
      return created
    } catch (err) {
      console.error('Error creating ordonnance:', err)
      error.value = err.response?.data?.message || 'Erreur lors de la création de l\'ordonnance'
      throw err
    } finally {
      loading.value = false
    }
  }
  // Affichage d'une ordonnance (détail)
  async function showOrdonnance(id) {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`/ordonnances/${id}`)
      return mapApiOrdonnance(response.data)
    } catch (err) {
      console.error('Error fetching ordonnance detail:', err)
      error.value = err.response?.data?.message || 'Erreur lors de la récupération de l\'ordonnance'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mise à jour d'une ordonnance
  async function updateOrdonnance(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await axios.put(`/ordonnances/${id}`, data)
      // Mise à jour dans la liste locale
      const index = ordonnances.value.findIndex(o => o._id === id)
      if (index !== -1) {
        ordonnances.value[index] = mapApiOrdonnance(response.data.ordonnance)
      }
      return ordonnances.value[index]
    } catch (err) {
      console.error('Error updating ordonnance:', err)
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de l\'ordonnance'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Suppression d'une ordonnance
  async function deleteOrdonnance(id) {
    loading.value = true
    error.value = null
    try {
      await axios.delete(`/ordonnances/${id}`)
      ordonnances.value = ordonnances.value.filter(o => o._id !== id)
      return { success: true, message: 'Ordonnance supprimée avec succès' }
    } catch (err) {
      console.error('Error deleting ordonnance:', err)
      
      // Gérer spécifiquement l'erreur 403 (Forbidden)
      if (err.response && err.response.status === 403) {
        error.value = "Vous n'êtes pas autorisé à supprimer cette ordonnance. Seul l'auteur de l'ordonnance peut la supprimer."
        throw new Error("Vous n'êtes pas autorisé à supprimer cette ordonnance. Seul l'auteur de l'ordonnance peut la supprimer.")
      } else {
        // Extraire un message d'erreur plus lisible
        let errorMessage = 'Erreur lors de la suppression de l\'ordonnance'
        
        if (err.response && err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }
        
        error.value = errorMessage
        throw err
      }
    } finally {
      loading.value = false
    }
  }

  // Ajout d'un médicament à une ordonnance
  async function ajouterMedicament(id, medData) {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post(`/ordonnances/${id}/medicaments`, medData)
      // Optionnel : actualiser l'ordonnance dans la liste locale ou renvoyer la réponse
      return response.data.ordonnanceMedicament
    } catch (err) {
      console.error('Error adding medicament:', err)
      error.value = err.response?.data?.message || 'Erreur lors de l\'ajout du médicament'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Génération du PDF pour une ordonnance
  async function generatePDF(id) {
    loading.value = true;
    error.value = null;
  
    try {
      if (!id) {
        throw new Error("ID de l'ordonnance requis");
      }
      console.log(`Génération du PDF pour l'ordonnance: ${id}`);
  
      let pdfBlob;
  
      // 1) Tentative API
      try {
        const response = await axiosInstance.get(`/ordonnances/${id}/pdf`, {
          responseType: 'blob'
        });
  
        if (!response.data || !(response.data instanceof Blob)) {
          throw new Error("Données PDF invalides reçues de l'API");
        }
        pdfBlob = response.data;
        console.log("PDF récupéré via l'API");
      } catch (apiErr) {
        console.warn("Échec de l'API, utilisation du fallback local :", apiErr);
  
        // 2) Fallback local
        const ordonnance = ordonnances.value.find(o => o._id === id);
        if (!ordonnance) {
          throw new Error("Ordonnance non trouvée dans le store");
        }
  
        const { generateOrdonnacePDF  } = await import('@/utils/pdfGenerator');
        pdfBlob = await generateOrdonnacePDF ({
          dateEmission: ordonnance.dateEmission,
          medicaments:  ordonnance.medicaments,
          renouvelable: ordonnance.renouvelable,
          statut:       ordonnance.statut
        }, false);
  
        if (!(pdfBlob instanceof Blob)) {
          throw new Error("Le fallback local n'a pas renvoyé un Blob");
        }
        console.log("PDF généré localement");
      }
  
      // 3) Conversion du Blob en DataURL (base64)
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror   = () => reject(new Error("Échec de la conversion du Blob en DataURL"));
        reader.readAsDataURL(pdfBlob);
      });
  
      console.log("DataURL du PDF générée avec succès");
      return {
        success: true,
        url,        // DataURL à utiliser en src d'un <embed> ou <iframe>
        blob: pdfBlob
      };
  
    } catch (err) {
      console.error("Erreur lors de la génération du PDF :", err);
      error.value = err.message || "Erreur lors de la génération du PDF";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  

  return {
    ordonnances,
    loading,
    error,
    fetchOrdonnances,
    createOrdonnance,
    showOrdonnance,
    updateOrdonnance,
    deleteOrdonnance,
    ajouterMedicament,
    generatePDF
  }
})
