import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axiosInstance from '@/services/axios'
import { useAuthStore } from './auth'
import { useDoctorStore } from './doctors'
import { usePatientStore } from './patients'
import { useToast } from '@/composables/useToast'

export const useMedicalRecordStore = defineStore('medicalRecord', () => {
  const toast = useToast()
  const doctorStore = useDoctorStore()
  const patientStore = usePatientStore()
  const records = ref([])
  const currentRecord = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const historique = ref([])
  const currentPatient = ref(null)
  
  const filters = ref({
    status: '',
    date: null,
    search: ''
  })

  const pagination = ref({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    perPage: 10
  })

  const handleError = (err, defaultMessage = 'Une erreur est survenue') => {
    const errorMessage = err.response?.data?.message || err.message || defaultMessage
    error.value = errorMessage
    toast.error(errorMessage)
    console.error('Error:', errorMessage, err)
    throw errorMessage
  }

  const filteredRecords = computed(() => {
    let filtered = [...records.value]
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      filtered = filtered.filter(record => {
        const nom = record.patient?.utilisateur?.nom || ''
        const prenom = record.patient?.utilisateur?.prenom || ''
        return `${nom} ${prenom}`.toLowerCase().includes(searchLower)
      })
    }
    if (filters.value.status) {
      filtered = filtered.filter(record => (record.is_archived ? 'archived' : 'active') === filters.value.status)
    }
    if (filters.value.date) {
      const filterDate = new Date(filters.value.date)
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.dateEntree)
        return recordDate.toDateString() === filterDate.toDateString()
      })
    }
    return filtered
  })

  // Actions
  async function fetchRecords(params = {}) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.get('/dossiers-medicaux/patients', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      
      records.value = response.data
      pagination.value = {
        currentPage: params.page || 1,
        totalPages: Math.ceil(response.data.length / 10),
        totalRecords: response.data.length,
        perPage: 10
      }
      return records.value
    } catch (err) {
      handleError(err, 'Erreur lors du chargement des dossiers')
    } finally {
      loading.value = false
    }
  }

  async function fetchRecord(id) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.get(`/dossiers-medicaux/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      currentRecord.value = response.data
      
      // Fetch patient details if available
      if (currentRecord.value && currentRecord.value.patient_id) {
        try {
          await patientStore.fetchPatientById(currentRecord.value.patient_id)
          currentPatient.value = patientStore.getPatientById(currentRecord.value.patient_id)
          if (!currentPatient.value) {
            console.warn(`Patient with ID ${currentRecord.value.patient_id} not found`)
            currentRecord.value.patient = {
              utilisateur: {
                nom: 'Non trouvé',
                prenom: 'Patient',
                dateNaissance: null,
                genre: '-',
                telephone: '-',
                adresse: 'Information non disponible'
              }
            }
          }
        } catch (patientErr) {
          console.error('Error fetching patient details:', patientErr)
          // Set default patient information when fetch fails
          currentRecord.value.patient = {
            utilisateur: {
              nom: 'Non trouvé',
              prenom: 'Patient',
              dateNaissance: null,
              genre: '-',
              telephone: '-',
              adresse: 'Information non disponible'
            }
          }
        }
      }
      
      return currentRecord.value
    } catch (err) {
      handleError(err, 'Erreur lors de la récupération du dossier')
    } finally {
      loading.value = false
    }
  }

  async function createRecord(patientId, recordData) {
    loading.value = true;
    try {
      const authStore = useAuthStore();
      const token = authStore.token;
      if (!token) throw new Error('Non autorisé : token manquant');
  
      // Créer une instance de FormData
      const formData = new FormData();
  
      for (const key in recordData) {
        // Si c'est un fichier unique
        if (recordData[key] instanceof File) {
          formData.append(key, recordData[key]);
        }
        // Si c'est un tableau
        else if (Array.isArray(recordData[key])) {
          // Si c'est un tableau de fichiers
          if (recordData[key].length > 0 && recordData[key][0] instanceof File) {
            recordData[key].forEach(file => {
              formData.append(`${key}[]`, file);
            });
          } else {
            // Pour un tableau de valeurs non fichier (ex: antecedents, evolution)
            recordData[key].forEach(item => {
              formData.append(`${key}[]`, item);
            });
          }
        } else {
          formData.append(key, recordData[key]);
        }
      }
  
      const response = await axiosInstance.post(
        `/dossiers-medicaux/patients/${patientId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      records.value.push(response.data.dossier);
      toast.success('Dossier créé avec succès');
      return response.data.dossier;
    } catch (err) {
      handleError(err, 'Erreur lors de la création du dossier');
    } finally {
      loading.value = false;
    }
  }
  
  async function updateRecord(id, data) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.put(
        `/dossiers-medicaux/${id}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const index = records.value.findIndex(r => r._id === id)
      if (index !== -1) records.value[index] = response.data.dossier
      if (currentRecord.value?._id === id) currentRecord.value = response.data.dossier
      
      toast.success('Dossier mis à jour avec succès')
      return response.data.dossier
    } catch (err) {
      handleError(err, 'Erreur lors de la mise à jour du dossier')
    } finally {
      loading.value = false
    }
  }

  async function deleteRecord(id) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      await axiosInstance.delete(`/dossiers-medicaux/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      records.value = records.value.filter(r => r._id !== id)
      if (currentRecord.value?._id === id) currentRecord.value = null
      toast.success('Dossier supprimé avec succès')
    } catch (err) {
      handleError(err, 'Erreur lors de la suppression du dossier')
    } finally {
      loading.value = false
    }
  }

  async function archiveRecord(id) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.patch(
        `/dossiers-medicaux/${id}/archive`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const index = records.value.findIndex(r => r._id === id)
      if (index !== -1) records.value[index] = response.data.dossier
      if (currentRecord.value?._id === id) currentRecord.value = response.data.dossier
      
      toast.success('Dossier archivé avec succès')
      return response.data.dossier
    } catch (err) {
      handleError(err, 'Erreur lors de l\'archivage du dossier')
    } finally {
      loading.value = false
    }
  }

  async function searchRecords(searchParams) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.get('/dossiers-medicaux/search/filter', {
        params: searchParams,
        headers: { Authorization: `Bearer ${token}` }
      })

      records.value = response.data
      return response.data
    } catch (err) {
      handleError(err, 'Erreur lors de la recherche')
    } finally {
      loading.value = false
    }
  }

  async function addReport(dossierId, content) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.post(
        `/dossiers-medicaux/${dossierId}/rapports`,
        { contenu: content },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (currentRecord.value?._id === dossierId) {
        currentRecord.value.rapports.push(response.data.rapport)
      }
      toast.success('Rapport ajouté avec succès')
      return response.data.rapport
    } catch (err) {
      handleError(err, 'Erreur lors de l\'ajout du rapport')
    } finally {
      loading.value = false
    }
  }

  async function addExamen(dossierId, examenData) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.post(
        `/dossiers-medicaux/${dossierId}/examens`,
        examenData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (currentRecord.value?._id === dossierId) {
        currentRecord.value.examens.push(response.data.examen)
      }
      toast.success('Examen ajouté avec succès')
      return response.data.examen
    } catch (err) {
      handleError(err, 'Erreur lors de l\'ajout de l\'examen')
    } finally {
      loading.value = false
    }
  }

  async function fetchHistorique(dossierId) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) throw new Error('Non autorisé : token manquant')

      const response = await axiosInstance.get(
        `/dossiers-medicaux/${dossierId}/historique`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      historique.value = response.data
      return response.data
    } catch (err) {
      handleError(err, 'Erreur lors de la récupération de l\'historique')
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  

  function resetFilters() {
    filters.value = {
      status: '',
      date: null,
      search: ''
    }
  }

  // Calculate patient age based on birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }
  async function generatePDF(id) {
    loading.value = true;
    try {
        const authStore = useAuthStore();
        const token = authStore.token;
        if (!token) throw new Error('Non autorisé : token manquant');
        if (!id) throw new Error('ID du dossier non fourni');

        const response = await axiosInstance.get(
            `/dossiers-medicaux/${id}/pdf`,
            {
                responseType: 'blob',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/pdf'
                },
                timeout: 60000 // 60 secondes de timeout
            }
        );

        // Vérifier le type de contenu
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('application/pdf')) {
            // Si ce n'est pas un PDF, c'est probablement une erreur JSON
            const textContent = await response.data.text();
            try {
                const errorData = JSON.parse(textContent);
                throw new Error(errorData.message || 'Erreur lors de la génération du PDF');
            } catch (e) {
                throw new Error('Le serveur n\'a pas retourné un PDF valide');
            }
        }

        // Vérifier la taille de la réponse
        if (response.data.size === 0) {
            throw new Error('Le PDF généré est vide');
        }

        // Créer le blob et l'URL
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = window.URL.createObjectURL(blob);

        // Ouvrir le PDF dans un nouvel onglet
        window.open(fileURL, '_blank');

        // Nettoyer l'URL après un délai
        setTimeout(() => {
            window.URL.revokeObjectURL(fileURL);
        }, 1000);

        toast.success('PDF généré avec succès');
        return true;

    } catch (error) {
        console.error('Erreur de génération PDF:', error);
        
        let errorMessage = 'Erreur lors de la génération du PDF';
        
        if (error.response) {
            if (error.response.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erreur serveur: ${error.response.status}`;
                }
            } else {
                errorMessage = error.response.data?.message || errorMessage;
            }
        } else if (error.request) {
            errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion internet.';
        } else {
            errorMessage = error.message || errorMessage;
        }

        handleError(new Error(errorMessage));
        return false;
    } finally {
        loading.value = false;
    }
}
  // Computed property for patient age
  const patientAge = computed(() => {
    if (currentPatient.value && currentPatient.value.dateNaissance) {
      return calculateAge(currentPatient.value.dateNaissance)
    }
    return null
  })

  return {
    // State
    records,
    currentRecord,
    currentPatient,
    historique,
    loading,
    error,
    filters,
    pagination,
    
    // Getters
    filteredRecords,
    patientAge,

    // Actions
    fetchRecords,
    fetchRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    archiveRecord,
    searchRecords,
    addReport,
    addExamen,
    fetchHistorique,
    setFilters,
    resetFilters,
    generatePDF,
    calculateAge
  }
})

