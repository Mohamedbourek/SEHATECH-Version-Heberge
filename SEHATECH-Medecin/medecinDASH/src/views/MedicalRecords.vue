<template>
  <div class="medical-records p-6">
    <header class="mb-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dossiers Médicaux
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Gestion des dossiers patients
          </p>
        </div>
        <button
          @click="showBilletSalleModal = true"
          class="create-billet-btn"
        >
          <div class="btn-content">
            <div class="btn-icon">
              <FileText class="w-5 h-5" />
            </div>
            <div class="btn-text">
              <span class="text-sm font-semibold">Créer un billet de salle</span>
              <span class="text-xs opacity-75">Nouveau document</span>
            </div>
          </div>
        </button>
      </div>

      <!-- Barre de recherche et filtres -->
      <div class="search-bar">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechercher un dossier..."
                class="search-input"
              />
            </div>
          </div>
          <div class="flex gap-4 items-center">
            <select 
              v-model="filterCategory" 
              class="filter-select"
            >
              <option value="">Tous les services</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
            <select 
              v-model="sortBy" 
              class="filter-select"
            >
              <option value="date">Date</option>
              <option value="name">Nom</option>
              <option value="service">Service</option>
            </select>
          </div>
        </div>
        
        <!-- Statistiques rapides -->
        <div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="stat-card">
            <div class="stat-icon bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <Files class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ records.length }}</span>
              <span class="stat-label">Total dossiers</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
              <Activity class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ records.filter(r => !r.is_archived).length }}</span>
              <span class="stat-label">Actifs</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400">
              <Archive class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ records.filter(r => r.is_archived).length }}</span>
              <span class="stat-label">Archivés</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <Stethoscope class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ [...new Set(records.map(r => r.medecin_id))].length }}</span>
              <span class="stat-label">Médecins</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Message d'erreur -->
    <div v-if="loadingError" class="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-red-600 dark:text-red-400">{{ loadingError }}</p>
    </div>

    <!-- Grille des dossiers -->
    <div v-if="!loadingError" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <TransitionGroup name="list">
        <div 
          v-for="record in sortedRecords" 
          :key="record._id"
          class="medical-record-card"
          :class="[
            getRecordClass(record),
            record.is_archived ? 'record-archived' : ''
          ]"
          @click="viewDossier(record)"
        >
          <!-- En-tête du dossier -->
          <div class="record-header">
            <div class="flex items-center space-x-3">
              <div class="relative">
              <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-inner">
                <UserCircle class="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ record.patient?.utilisateur?.prenom }} {{ record.patient?.utilisateur?.nom }}
                </h3>
                <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar class="w-4 h-4" />
                  <span>{{ formatDate(record.dateEntree) }}</span>
              </div>
            </div>
            </div>
            <div class="flex flex-col items-end space-y-2">
              <div class="flex items-center space-x-2">
                <span v-if="record.is_archived" class="status-badge status-badge-archived">
                  Archivé
                </span>
              </div>
            </div>
          </div>

          <div class="record-content">
            <!-- Informations principales -->
            <div class="record-info-grid">
              <div class="info-item">
                <span class="info-label">Médecin traitant</span>
                <span v-if="record.medecin_traitant" class="info-value flex items-center">
                  <UserCircle class="w-4 h-4 mr-1 text-primary-500" />
                  Dr. {{ record.medecin_traitant?.prenom }} {{ record.medecin_traitant?.nom }}
                </span>
                <span v-else-if="record.medecin?.utilisateur" class="info-value flex items-center">
                  <UserCircle class="w-4 h-4 mr-1 text-primary-500" />
                  Dr. {{ record.medecin.utilisateur.prenom }} {{ record.medecin.utilisateur.nom }}
                </span>
                <span v-else class="info-value text-gray-500">
                  <span v-if="record.medecin_id">ID Médecin: {{ record.medecin_id }}</span>
                  <span v-else>Non assigné</span>
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ record.medecin_traitant?.specialite || record.medecin?.specialite || 'Spécialité non spécifiée' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Patient</span>
                <span class="info-value">
                  {{ calculateAge(record.patient?.utilisateur?.dateNaissance) }} ans
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatGender(record.patient?.utilisateur?.genre) }}
                </span>
              </div>
            </div>

            <!-- Antécédents -->
            <div class="record-antecedents">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Activity class="w-4 h-4 mr-1" />
                Antécédents médicaux
                </h4>
              <div v-if="record.antecedents?.length" class="antecedents-summary">
                <div class="space-y-2">
                  <div v-for="(antecedent, index) in record.antecedents.slice(0, 2)" :key="index" 
                       class="flex items-start space-x-2">
                    <Circle class="w-3 h-3 mt-1 text-primary-500" />
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ antecedent }}</span>
              </div>
                  <span v-if="record.antecedents.length > 2" class="text-xs text-gray-500">
                    +{{ record.antecedents.length - 2 }} autres antécédents
                  </span>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">
                Aucun antécédent enregistré
              </p>
            </div>

            <!-- Documents -->
            <div class="record-documents" v-if="record.documents?.length">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Files class="w-4 h-4 mr-1" />
                Documents ({{ record.documents.length }})
              </h4>
              <div class="flex flex-wrap gap-2">
                <div 
                  v-for="doc in record.documents.slice(0, 3)" 
                  :key="doc._id || doc.id"
                  class="document-chip"
                  :class="getDocumentTypeClass(getDocumentName(doc))"
                >
                  <FileText class="w-4 h-4 mr-1" />
                  {{ getDocumentName(doc) }}
                </div>
                <span v-if="record.documents.length > 3" class="text-xs text-gray-500">
                  +{{ record.documents.length - 3 }} autres
                </span>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="record-actions">
            <button 
              @click.stop="viewDossier(record)"
              class="action-button text-blue-600 dark:text-blue-400"
              title="Voir les détails"
            >
              <Eye class="w-5 h-5" />
            </button>
            <button 
              @click.stop="editDossier(record)"
              class="action-button text-green-600 dark:text-green-400"
              title="Modifier"
            >
              <Edit class="w-5 h-5" />
            </button>
            <button 
              @click.stop="downloadDossier(record)"
              class="action-button text-gray-600 dark:text-gray-400"
              title="Télécharger"
            >
              <Download class="w-5 h-5" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Modal de détails -->
    <DossierDetailsModal
      v-if="showDetailsModal"
      :dossier="selectedDossier"
      :show-modal="showDetailsModal"
      :is-loading="isLoadingDossier"
      :error-message="loadingDossierError"
      @close="closeDetailsModal"
      @edit="openEditModal"
      @retry="retryLoadDossier"
    />

    <!-- Modal de modification -->
    <DossierEditForm
      v-if="showEditModal"
      :dossier="selectedDossier"
      @close="closeEditModal"
      @update="handleDossierUpdate"
    />

    <!-- Modal de téléchargement -->
    <Modal 
      v-if="showUploadModal"
      title="Ajouter un document"
      @close="closeUploadModal"
    >
      <div class="p-6">
        <div 
          class="upload-zone"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
          @click="triggerFileInput"
        >
          <input 
            ref="fileInput"
            type="file"
            class="hidden"
            @change="handleFileSelect"
            multiple
          />
          <Upload class="w-12 h-12 text-gray-400" />
          <p class="text-gray-600 dark:text-gray-400">
            Glissez vos fichiers ici ou cliquez pour sélectionner
          </p>
          <p class="text-sm text-gray-500">
            PDF, Images, Documents (max 10MB)
          </p>
        </div>

        <!-- Liste des fichiers sélectionnés -->
        <div v-if="selectedFiles.length" class="mt-4 space-y-2">
          <div 
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="selected-file"
          >
            <div class="flex items-center space-x-2">
              <FileText class="w-4 h-4 text-gray-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ file.name }}
              </span>
              <span class="text-xs text-gray-500">
                ({{ formatFileSize(file.size) }})
              </span>
            </div>
            <button 
              @click="removeFile(index)"
              class="text-red-500 hover:text-red-600"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex justify-end space-x-4 mt-6">
          <button 
            type="button"
            @click="closeUploadModal"
            class="btn-secondary"
          >
            Annuler
          </button>
          <button 
            @click="uploadFiles"
            class="btn-primary"
            :disabled="!selectedFiles.length"
          >
            Téléverser
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal de prévisualisation -->
    <Modal 
      v-if="showPreviewModal"
      :title="previewDocument?.name"
      @close="closePreviewModal"
      size="lg"
    >
      <div class="p-6">
        <div class="document-preview">
          <!-- Prévisualisation selon le type de document -->
          <iframe 
            v-if="isPreviewable"
            :src="getDocumentPreviewUrl(previewDocument)"
            class="w-full h-[600px] rounded-lg"
          ></iframe>
          <div 
            v-else
            class="preview-fallback"
          >
            <FileText class="w-16 h-16 text-gray-400" />
            <p>Aperçu non disponible</p>
            <button 
              @click="downloadDocument(previewDocument)"
              class="btn-secondary mt-4"
            >
              Télécharger le fichier
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <BilletSalleModal
      v-if="showBilletSalleModal"
      @close="showBilletSalleModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Search, UserCircle, Eye, Edit, Download,
  FileText, Upload, Trash2, X, Calendar, Building2, ClipboardList, Files, Activity, Edit2, Circle, AlertCircle, Archive, Stethoscope
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import DossierDetailsModal from '@/components/medical/DossierDetailsModal.vue'
import DossierEditForm from '@/components/medical/DossierEditForm.vue'
import { useDossierMedicalStore } from '@/stores/dossierMedical'
import { useConsultationStore } from '@/stores/consultationStore'
import { useExamenStore } from '@/stores/examenStore'
import { useAuthStore } from '@/stores/auth'
import { useRapportStore } from '@/stores/rapportStore'
import { useEvolutionStore } from '@/stores/evolutionStore'
import BilletSalleModal from '@/components/medical/BilletSalleModal.vue'
import DocumentCard from '@/components/cards/DocumentCard.vue'

// États
const searchQuery = ref('')
const filterCategory = ref('')
const sortBy = ref('date')
const showDetailsModal = ref(false)
const showEditModal = ref(false)
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const selectedRecord = ref(null)
const editingRecord = ref(null)
const previewDocument = ref(null)
const selectedFiles = ref([])
const showBilletSalleModal = ref(false)
const showBilletSalleForm = ref(false)
const isEditingSummary = ref({})
const editingSummary = ref({})
const records = ref([])
const loadingError = ref(null)
const isLoadingDossier = ref(false)
const loadingDossierError = ref(null)

// Stores
const dossierMedicalStore = useDossierMedicalStore()
const consultationStore = useConsultationStore()
const examenStore = useExamenStore()
const authStore = useAuthStore()
const rapportStore = useRapportStore()
const evolutionStore = useEvolutionStore()
const selectedDossier = ref(null)

// Liste des services (à adapter selon vos besoins)
const services = [
  'Cardiologie',
  'Neurologie',
  'Pédiatrie',
  'Chirurgie',
  'Urgences',
  'Radiologie',
  'Psychiatrie',
  'Gynécologie'
]

// Charger les dossiers au montage du composant
onMounted(async () => {
  try {
    records.value = await dossierMedicalStore.fetchDossiersMedicaux()
  } catch (error) {
    console.error('Erreur lors du chargement des dossiers:', error)
    loadingError.value = "Impossible de charger les dossiers médicaux. Veuillez réessayer plus tard."
  }
})

// Computed properties adaptées
const sortedRecords = computed(() => {
  let filtered = records.value.filter(record => {
    const patientNom = record.patient?.utilisateur?.nom || ''
    const patientPrenom = record.patient?.utilisateur?.prenom || ''
    const matchesSearch = patientNom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         patientPrenom.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesService = !filterCategory.value || record.medecin?.service === filterCategory.value
    return matchesSearch && matchesService
  })

  return filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'date':
        return new Date(b.dateEntree || 0) - new Date(a.dateEntree || 0)
      case 'name':
        const aName = a.patient?.utilisateur?.nom || ''
        const bName = b.patient?.utilisateur?.nom || ''
        return aName.localeCompare(bName)
      case 'service':
        const aService = a.medecin?.service || ''
        const bService = b.medecin?.service || ''
        return aService.localeCompare(bService)
      default:
        return 0
    }
  }).map(record => {
    // Log pour le débogage
    if (!record.medecin) {
      console.log(`Dossier ${record._id} sans médecin traitant:`, { record_medecin_id: record.medecin_id })
    } else if (!record.medecin.utilisateur) {
      console.log(`Dossier ${record._id} avec médecin sans utilisateur:`, { medecin: record.medecin })
    }
    
    return {
      ...record,
      medecin_traitant: record.medecin?.utilisateur ? {
        id: record.medecin._id,
        nom: record.medecin.utilisateur.nom,
        prenom: record.medecin.utilisateur.prenom,
        service: record.medecin.service || 'Non spécifié',
        specialite: record.medecin.specialite || 'Non spécifiée'
      } : null
    }
  })
})

// Fonctions adaptées
const viewDossier = async (record) => {
  try {
    // Réinitialiser les états d'erreur et activer l'état de chargement
    loadingDossierError.value = null
    isLoadingDossier.value = true
    
    // Afficher immédiatement le modal avec les données de base
    selectedDossier.value = { 
      ...record,
      examens: [],
      consultations: [],
      rapports: [],
      evolutions: []
    }
    showDetailsModal.value = true
    
    // Charger les détails complets du dossier
    console.log('Chargement des détails du dossier:', record._id)
    const dossierDetails = await dossierMedicalStore.fetchDossierMedical(record._id)
    
    // Récupérer toutes les données associées en parallèle avec gestion d'erreur
    try {
      const [consultations, examens, rapports, evolutions] = await Promise.all([
        consultationStore.fetchConsultations(record._id).catch(err => {
          console.error('Erreur lors de la récupération des consultations:', err)
          return []
        }),
        examenStore.fetchExamensByDossier(record._id).catch(err => {
          console.error('Erreur lors de la récupération des examens:', err)
          return []
        }),
        rapportStore.fetchRapports(record._id).catch(err => {
          console.error('Erreur lors de la récupération des rapports:', err)
          return []
        }),
        evolutionStore.fetchEvolutions(record._id).catch(err => {
          console.error('Erreur lors de la récupération des évolutions:', err)
          return []
        })
      ])
      
      console.log('Données récupérées avec succès:', {
        consultations: consultations.length,
        examens: examens.length,
        rapports: rapports.length,
        evolutions: evolutions.length
      })
      
      // Synchroniser avec les stores appropriés
      if (dossierDetails.examens && dossierDetails.examens.length > 0) {
        await dossierMedicalStore.syncExamensWithStore(dossierDetails)
      }
      
      if (dossierDetails.consultations && dossierDetails.consultations.length > 0) {
        await dossierMedicalStore.syncConsultationsWithStore(dossierDetails)
      }
      
      if (dossierDetails.rapports && dossierDetails.rapports.length > 0) {
        await dossierMedicalStore.syncRapportsWithStore(dossierDetails)
      }
      
      if (dossierDetails.evolutions && dossierDetails.evolutions.length > 0) {
        await dossierMedicalStore.syncEvolutionsWithStore(dossierDetails)
      }
      
      // Mettre à jour le dossier sélectionné avec les données complètes
      selectedDossier.value = {
        ...dossierDetails,
        examens: examens || [],
        consultations: consultations || [],
        rapports: rapports || [],
        evolutions: evolutions || [],
        // S'assurer que le médecin traitant est correctement formaté
        medecin_traitant: dossierDetails.medecin?.utilisateur ? {
          id: dossierDetails.medecin._id,
          nom: dossierDetails.medecin.utilisateur.nom,
          prenom: dossierDetails.medecin.utilisateur.prenom,
          service: dossierDetails.medecin.service || 'Non spécifié',
          specialite: dossierDetails.medecin.specialite || 'Non spécifiée'
        } : null
      }
      
      console.log('Dossier et données associées chargés avec succès')
    } catch (error) {
      console.error('Erreur lors de la récupération des données associées:', error)
      loadingDossierError.value = "Certaines données n'ont pas pu être récupérées. Veuillez réessayer."
      
      // Mettre à jour avec les données disponibles malgré l'erreur
      selectedDossier.value = {
        ...dossierDetails,
        examens: dossierDetails.examens || [],
        consultations: dossierDetails.consultations || [],
        rapports: dossierDetails.rapports || [],
        evolutions: []
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement du dossier:', error)
    loadingDossierError.value = "Impossible de charger le dossier médical. Veuillez réessayer."
    selectedDossier.value = record // Garder les données de base en cas d'erreur
  } finally {
    isLoadingDossier.value = false
  }
}

const editDossier = async (record) => {
  selectedDossier.value = record
  showEditModal.value = true
}

const downloadDossier = async (record) => {
  try {
    const pdfBlob = await dossierMedicalStore.generatePDF(record._id)
    const url = window.URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dossier-medical-${record._id}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
  }
}

const handleDossierUpdate = async (updatedDossier) => {
  try {
    const response = await dossierMedicalStore.updateDossierMedical(updatedDossier._id, updatedDossier)
    const index = records.value.findIndex(r => r._id === updatedDossier._id)
    if (index !== -1) {
      records.value[index] = response.dossier
    }
    selectedDossier.value = response.dossier
    showEditModal.value = false
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
  }
}

const saveSummary = async (record) => {
  try {
    // Créer une nouvelle évolution via le store d'évolutions
    await evolutionStore.createEvolution({
      dossier_id: record._id,
      nomMesure: 'Résumé',
      valeurDeMesure: 0, // Valeur par défaut
      etat: 'normal',
      commentaire: editingSummary.value[record._id]
    })
    
    // Mettre à jour le dossier sans utiliser l'ancien champ evolution
    const response = await dossierMedicalStore.updateDossierMedical(record._id, {
      ...record
    })
    
    const index = records.value.findIndex(r => r._id === record._id)
    if (index !== -1) {
      records.value[index] = response.dossier
    }
    
    isEditingSummary.value[record._id] = false
  } catch (error) {
    console.error('Erreur lors de la mise à jour du résumé:', error)
  }
}

// Template adaptations
const getPatientName = (record) => {
  const patient = record.patient_info
  return patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'
}

const getMedecinName = (record) => {
  const medecin = record.medecin_traitant
  return medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Médecin inconnu'
}

const getDepartement = (record) => {
  return record.medecin_traitant?.service || 'Service non spécifié'
}

const getRecordClass = (record) => {
  if (record.is_archived) return 'record-archived'
  return 'record-normal'
}

const getCategoryLabel = (record) => {
  const types = {
    consultation: 'Consultation',
    surgery: 'Chirurgie',
    treatment: 'Traitement',
    analysis: 'Analyse'
  }
  return types[record.type] || record.type || 'Non spécifié'
}

// Fonctions utilitaires
const formatDate = (date) => {
  if (!date) return 'Date non spécifiée'
  try {
    return format(new Date(date), 'PPP', { locale: fr })
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

const viewDocument = (doc) => {
  // Implémenter la logique d'affichage du document
}

const viewRecord = (record) => {
  selectedRecord.value = record
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedDossier.value = null
}

const openEditModal = () => {
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const getPriorityValue = (status) => {
  const priorities = {
    'in-progress': 4,
    scheduled: 3,
    pending: 2,
    completed: 1
  }
  return priorities[status] || 0
}

const getDocumentName = (doc) => {
  if (!doc) return 'Document inconnu'
  if (doc.name) return doc.name
  if (doc.path) return doc.path.split('/').pop()
  return 'Document sans nom'
}

const getDocumentTypeClass = (filename) => {
  if (!filename) return 'document-unknown'
  
  const extension = filename.split('.').pop().toLowerCase()
  const types = {
    'pdf': 'document-pdf',
    'jpg': 'document-image',
    'jpeg': 'document-image',
    'png': 'document-image',
    'doc': 'document-word',
    'docx': 'document-word',
    'txt': 'document-text'
  }
  return types[extension] || 'document-unknown'
}

const openPreview = (doc) => {
  previewDocument.value = doc
  showPreviewModal.value = true
}

const closePreviewModal = () => {
  showPreviewModal.value = false
  previewDocument.value = null
}

const getDocumentPreviewUrl = (doc) => {
  return doc.url || `#preview-${doc.name}` // URL simulée
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  selectedFiles.value.push(...files.filter(file => file.size <= 10 * 1024 * 1024)) // Max 10MB
}

const handleFileDrop = (event) => {
  const files = Array.from(event.dataTransfer.files)
  selectedFiles.value.push(...files.filter(file => file.size <= 10 * 1024 * 1024))
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const uploadFiles = async () => {
  try {
    // Simuler l'upload
    const newDocs = selectedFiles.value.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      uploadDate: new Date().toISOString(),
      type: file.type,
      url: URL.createObjectURL(file)
    }))
    
    if (selectedRecord.value) {
      selectedRecord.value.documents.push(...newDocs)
    }
    closeUploadModal()
  } catch (error) {
    console.error('Erreur lors du téléversement:', error)
  }
}

const downloadDocument = (doc) => {
  // Simuler le téléchargement
  const link = document.createElement('a')
  link.href = doc.url || `#${doc.name}` // URL simulée
  link.download = doc.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const deleteDocument = (doc) => {
  if (confirm('Voulez-vous vraiment supprimer ce document ?')) {
    const index = selectedRecord.value.documents.findIndex(d => d.id === doc.id)
    if (index !== -1) {
      selectedRecord.value.documents.splice(index, 1)
    }
  }
}

const isPreviewable = computed(() => {
  if (!previewDocument.value) return false
  const ext = previewDocument.value.name.split('.').pop().toLowerCase()
  return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext)
})

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const closeUploadModal = () => {
  showUploadModal.value = false
  selectedFiles.value = []
}

const startEditingSummary = (record) => {
  isEditingSummary.value[record._id] = true
  editingSummary.value[record._id] = record.evolutions?.slice(-1)[0]?.contenu || record.summary
}

const cancelEditingSummary = (record) => {
  isEditingSummary.value[record._id] = false
  editingSummary.value[record._id] = ''
}

const handleBilletSalleSubmit = (data) => {
  // Handle form submission
  console.log('Billet de salle soumis:', data)
  showBilletSalleForm.value = false
}

// Fonctions utilitaires
const getLatestEvolution = (record) => {
  if (!record.evolutions?.length) return null
  return record.evolutions[0] // Maintenant triés par date dans le store
}

const getEtatClass = (etat) => {
  const classes = {
    'normal': 'text-green-600 dark:text-green-400',
    'attention': 'text-yellow-600 dark:text-yellow-400',
    'critique': 'text-red-600 dark:text-red-400'
  }
  return classes[etat?.toLowerCase()] || 'text-gray-600 dark:text-gray-400'
}

const getEtatBadgeClass = (etat) => {
  const classes = {
    'normal': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'attention': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    'critique': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[etat?.toLowerCase()] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
}

const calculateAge = (dateNaissance) => {
  if (!dateNaissance) return 'Non spécifié'
  const today = new Date()
  const birthDate = new Date(dateNaissance)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const formatGender = (genre) => {
  if (!genre) return 'Non spécifié'
  const genders = {
    'homme': 'Homme',
    'femme': 'Femme',
    'other': 'Autre'
  }
  return genders[genre.toLowerCase()] || 'Inconnu'
}

// Ajouter la fonction retryLoadDossier
const retryLoadDossier = async () => {
  if (selectedDossier.value && selectedDossier.value._id) {
    await viewDossier(selectedDossier.value)
  }
}
</script>

<style scoped>
.medical-record-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden
         border border-gray-200 dark:border-gray-700
         transition-all duration-300 hover:shadow-xl hover:-translate-y-1
         relative;
}

.medical-record-card::before {
  content: '';
  @apply absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600
         opacity-0 transition-opacity duration-300;
}

.medical-record-card:hover::before {
  @apply opacity-100;
}

.record-normal {
  @apply border-l-4 border-l-blue-500;
}

.record-normal:hover {
  @apply border-l-blue-600;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
}

.record-archived {
  @apply border-l-4 border-l-gray-400 opacity-75 bg-gray-50 dark:bg-gray-800/50;
}

.record-archived:hover {
  @apply border-l-gray-500 opacity-90;
}

.record-header {
  @apply p-4 border-b border-gray-200 dark:border-gray-700
         flex justify-between items-start
         bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80;
}

.record-content {
  @apply p-6 space-y-6;
}

.record-info-grid {
  @apply grid grid-cols-2 gap-4 mb-4;
}

.info-item {
  @apply bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex flex-col
         transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50
         border border-transparent hover:border-gray-200 dark:hover:border-gray-700;
}

.info-label {
  @apply text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium;
}

.info-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.record-antecedents {
  @apply mt-4 border-t border-gray-200 dark:border-gray-700 pt-4;
}

.antecedents-summary {
  @apply bg-white dark:bg-gray-800/30 rounded-lg p-3 border border-gray-100 
         dark:border-gray-700 shadow-sm hover:shadow transition-shadow duration-200;
}

.record-documents {
  @apply border-t border-gray-200 dark:border-gray-700 pt-4;
}

.document-chip {
  @apply flex items-center px-3 py-1.5 rounded-full text-xs font-medium
        bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
        hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200
        transform hover:-translate-y-0.5 hover:shadow-sm;
}

.record-actions {
  @apply flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700
         bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/80 dark:to-gray-800;
}

.action-button {
  @apply p-2 rounded-full transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-700
        transform hover:-translate-y-0.5 hover:shadow-md;
}

/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.create-billet-btn {
  @apply px-4 py-3 bg-primary-600 text-white rounded-xl
         transition-all duration-300 
         hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20
         active:transform active:scale-95
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
         dark:focus:ring-offset-gray-900
         relative overflow-hidden;
}

.create-billet-btn::after {
  content: '';
  @apply absolute inset-0 bg-white opacity-0 transition-opacity duration-300;
}

.create-billet-btn:hover::after {
  @apply opacity-10;
}

.create-billet-btn:active::after {
  @apply opacity-20;
}

.btn-content {
  @apply flex items-center space-x-3 relative z-10;
}

.btn-icon {
  @apply w-10 h-10 rounded-lg bg-primary-500/20 
         flex items-center justify-center
         transition-transform duration-300 group-hover:rotate-3;
}

.btn-text {
  @apply flex flex-col items-start;
}

/* Badges d'état */
.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full
         transition-all duration-200 hover:shadow-sm;
}

.status-badge-archived {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400;
}

/* Indicateurs visuels */
.archived-indicator {
  @apply absolute top-2 right-2 w-2 h-2 bg-gray-400 rounded-full;
}

/* Styles pour les documents */
.document-pdf {
  @apply bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400;
}

.document-image {
  @apply bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400;
}

.document-word {
  @apply bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400;
}

.document-text {
  @apply bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400;
}

.document-unknown {
  @apply bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400;
}

/* Styles pour les boutons */
.btn-primary-sm {
  @apply px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium
         transition-all duration-200 hover:bg-primary-700 hover:shadow-md
         hover:shadow-primary-600/20 focus:outline-none focus:ring-2
         focus:ring-primary-500 focus:ring-offset-1;
}

.btn-secondary-sm {
  @apply px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300
         rounded-lg text-sm font-medium transition-all duration-200
         hover:bg-gray-300 dark:hover:bg-gray-600 hover:shadow-md
         focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1;
}

.evolution-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm
         border border-gray-200 dark:border-gray-700
         transition-all duration-200 hover:shadow-md;
}

.evolution-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center
         bg-opacity-20 dark:bg-opacity-20;
}

.evolution-icon.text-green-600 {
  @apply bg-green-100 dark:bg-green-900;
}

.evolution-icon.text-yellow-600 {
  @apply bg-yellow-100 dark:bg-yellow-900;
}

.evolution-icon.text-red-600 {
  @apply bg-red-100 dark:bg-red-900;
}

.evolution-icon.text-gray-600 {
  @apply bg-gray-100 dark:bg-gray-900;
}

/* Styles pour la barre de recherche et les filtres */
.search-bar {
  @apply bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md
         border border-gray-200 dark:border-gray-700
         transition-all duration-300 hover:shadow-lg;
}

.search-input {
  @apply pl-10 w-full h-11 rounded-lg border-gray-300 dark:border-gray-600 
         focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white
         transition-all duration-200;
}

.filter-select {
  @apply h-11 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
         focus:ring-2 focus:ring-primary-500 dark:text-white px-4
         transition-all duration-200;
}

/* Styles pour les cartes de statistiques */
.stat-card {
  @apply flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg p-3
         border border-gray-200 dark:border-gray-700 shadow-sm
         transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
         flex-1 min-w-[150px];
}

.stat-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center;
}

.stat-content {
  @apply flex flex-col;
}

.stat-value {
  @apply text-xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-xs text-gray-500 dark:text-gray-400;
}
</style>