<template>
  <Modal 
    v-if="showModal"
    title="Détails du dossier médical"
    @close="closeModal"
    size="lg"
  >
    <div class="p-6 space-y-6 dark:bg-gray-800">
      <!-- Indicateur de chargement -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
        <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 dark:text-gray-300 text-lg font-medium">Chargement des données...</p>
        <p class="text-gray-500 dark:text-gray-400 text-sm">Veuillez patienter pendant que nous récupérons les informations</p>
      </div>

      <!-- Message d'erreur -->
      <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <div class="flex items-start">
          <AlertCircle class="w-5 h-5 text-red-500 mt-0.5 mr-2" />
          <div>
            <h3 class="text-sm font-medium text-red-800 dark:text-red-400">Erreur de chargement</h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ errorMessage }}</p>
            <button 
              @click="$emit('retry')" 
              class="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-md hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>

      <!-- En-tête du dossier avec statut et actions -->
      <div v-if="!isLoading || dossier" class="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div class="flex items-center space-x-4">
          <div class="relative">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center shadow-inner">
              <UserCircle class="w-10 h-10 text-primary-500 dark:text-primary-400" />
            </div>
            <div v-if="dossier?.is_urgent" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
          </div>
          <div>
            <h3 class="text-xl font-medium text-gray-900 dark:text-white">
              {{ getPatientFullName }}
            </h3>
            <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div class="flex items-center space-x-2">
                <Calendar class="w-4 h-4 text-primary-500 dark:text-primary-400" />
                <span>Dossier créé le {{ formatDate(dossier?.dateEntree) }}</span>
              </div>
              <div class="flex items-center space-x-2 mt-1 sm:mt-0">
                <Clock class="w-4 h-4 text-primary-500 dark:text-primary-400" />
                <span>Dernière mise à jour: {{ formatDate(dossier?.derniereMiseAJour) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-end space-y-2 mt-4 md:mt-0">
          <span :class="['status-badge', getStatusClass(getDossierStatus(dossier))]">
            {{ getStatusLabel(getDossierStatus(dossier)) }}
          </span>
          <div class="flex space-x-2">
            <button 
              @click="$emit('edit')"
              class="btn-primary-sm flex items-center"
            >
              <Edit class="w-4 h-4 mr-1" />
              Modifier
            </button>

          </div>
        </div>
      </div>

      <!-- Navigation par onglets -->
      <div class="tab-navigation">
        <div class="tab-container">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-item', { 'active': activeTab === tab.id }]"
          >
            <component :is="tab.icon" class="tab-icon" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Contenu des onglets -->
      <div class="tab-content-container">
        <transition name="fade" mode="out-in">
          <!-- Conteneur unique pour la transition -->
          <div :key="activeTab" class="tab-content-wrapper">
            <!-- Onglet: Informations patient -->
            <div v-if="activeTab === 'patient'" class="tab-content">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Informations du patient -->
        <div class="info-section">
          <h4 class="info-section-title flex items-center">
            <User class="w-5 h-5 mr-2 text-primary-500" />
            Informations du patient
          </h4>
          <div class="grid grid-cols-1 gap-4">
            <div class="patient-info-card">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <UserCircle class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h5 class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ getPatientFullName }}
                  </h5>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Patient ID: {{ dossier?._id || dossier?.id }}
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
            <div class="info-item">
                  <span class="info-label">Date de naissance</span>
                  <span class="info-value">{{ formatDate(dossier?.patient?.utilisateur?.dateNaissance) }}</span>
            </div>
            <div class="info-item">
                  <span class="info-label">Âge</span>
                  <span class="info-value">{{ calculateAge(dossier?.patient?.utilisateur?.dateNaissance) }} ans</span>
            </div>
            <div class="info-item">
                  <span class="info-label">Genre</span>
                  <span class="info-value">{{ formatGender(dossier?.patient?.utilisateur?.genre) }}</span>
            </div>
            <div class="info-item">
                  <span class="info-label">Groupe sanguin</span>
                  <span class="info-value">{{ dossier?.patient?.groupeSanguin || 'Non spécifié' }}</span>
                </div>
                <div class="info-item col-span-2">
                  <span class="info-label">Adresse</span>
                  <span class="info-value">{{ dossier?.patient?.utilisateur?.adresse || 'Non spécifiée' }}</span>
                </div>
                <div class="info-item col-span-2">
                  <span class="info-label">Contact</span>
                  <span class="info-value">{{ dossier?.patient?.utilisateur?.telephone || 'Non spécifié' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Informations médicales -->
        <div class="info-section">
          <h4 class="info-section-title flex items-center">
            <Stethoscope class="w-5 h-5 mr-2 text-primary-500" />
            Médecin traitant
          </h4>
          <div class="grid grid-cols-1 gap-4">
            <div class="doctor-info-card">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <UserCircle class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h5 class="text-lg font-medium text-gray-900 dark:text-white">
                    Dr. {{ getMedecinFullName }}
                  </h5>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ dossier?.medecin_traitant?.specialite || 'Spécialité non spécifiée' }}
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="info-item col-span-2">
                  <span class="info-label">Contact professionnel</span>
                  <span class="info-value">{{ dossier?.medecin?.utilisateur?.telephone || 'Non spécifié' }}</span>
                </div>
                <div class="info-item col-span-2">
                  <span class="info-label">Email</span>
                  <span class="info-value">{{ dossier?.medecin?.utilisateur?.email || 'Non spécifié' }}</span>
                        </div>
                      </div>
                </div>
              </div>
            </div>
          </div>
        </div>

            <!-- Onglet: Résumé médical -->
            <div v-else-if="activeTab === 'resume'" class="tab-content">
        <div class="info-section col-span-1 lg:col-span-2">
          <h4 class="info-section-title flex items-center">
            <ClipboardList class="w-5 h-5 mr-2 text-primary-500" />
            Résumé médical
          </h4>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Traitement en cours</h5>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ dossier?.traitement || 'Aucun traitement spécifié' }}
                </p>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Surveillance</h5>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ dossier?.surveillance || 'Aucune surveillance spécifiée' }}
                </p>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Antécédents</h5>
              <div class="space-y-2">
                <template v-if="dossier?.antecedents?.length">
                  <div v-for="(antecedent, index) in dossier.antecedents" :key="index" 
                       class="flex items-start space-x-2">
                    <Circle class="w-4 h-4 mt-0.5 text-primary-500" />
                    <span class="text-gray-600 dark:text-gray-400">{{ antecedent }}</span>
                  </div>
                </template>
                <p v-else class="text-gray-600 dark:text-gray-400">
                  Aucun antécédent enregistré
                </p>
                    </div>
              </div>
            </div>
          </div>
        </div>

            <!-- Onglet: Évolutions -->
            <div v-else-if="activeTab === 'evolutions'" class="tab-content">
        <div class="info-section col-span-1 lg:col-span-2">
          <h4 class="info-section-title flex items-center">
            <Activity class="w-5 h-5 mr-2 text-primary-500" />
            Évolutions
          </h4>
          
          <!-- Utiliser le nouveau composant EvolutionsList -->
          <EvolutionsList 
            :dossierId="dossier?._id" 
            :canEdit="canEdit"
          />
              </div>
        </div>

            <!-- Onglet: Examens -->
            <div v-else-if="activeTab === 'examens'" class="tab-content">
        <div class="info-section col-span-1 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h4 class="info-section-title flex items-center">
              <Microscope class="w-5 h-5 mr-2 text-primary-500" />
              Examens
            </h4>
          </div>
          <div class="space-y-4">
            <template v-if="sortedExamens.length">
              <div v-for="(examen, index) in sortedExamens" :key="index"
                   class="examen-card">
                <div class="flex justify-between items-start">
                  <div class="flex items-center space-x-2">
                    <div class="examen-icon" :class="getExamenStatusClass(examen.statut)">
                      <TestTube class="w-5 h-5" />
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ examen.type }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 block">
                        {{ formatDate(examen.date) }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 block">
                        Dr. {{ getMedecinNameFromExamen(examen) }}
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-medium px-2 py-1 rounded-full" 
                          :class="getExamenStatusBadgeClass(examen.statut)">
                      {{ formatExamenStatus(examen.statut) }}
                    </span>
                  </div>
                </div>
                <div class="mt-3 text-sm text-gray-600 dark:text-gray-400" v-if="examen.resultat">
                  <p class="font-medium mb-1">Résultat:</p>
                  <div v-if="typeof examen.resultat === 'object'">
                    <div v-if="Array.isArray(examen.resultat)">
                      <div v-for="(item, idx) in examen.resultat" :key="idx" class="mb-2">
                        <div v-if="typeof item === 'object'" class="ml-2">
                          <div v-for="(val, key) in item" :key="key" class="flex">
                            <span class="font-medium mr-2">{{ key }}:</span>
                            <span>{{ val }}</span>
                          </div>
                        </div>
                        <div v-else>{{ item }}</div>
                      </div>
                    </div>
                    <div v-else class="ml-2">
                      <div v-for="(val, key) in examen.resultat" :key="key" class="flex">
                        <span class="font-medium mr-2">{{ key }}:</span>
                        <span>{{ val }}</span>
                      </div>
                    </div>
                  </div>
                  <p v-else>{{ examen.resultat }}</p>
                </div>
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400" v-if="examen.interpretation">
                  <p class="font-medium mb-1">Interprétation:</p>
                  <p>{{ examen.interpretation }}</p>
                </div>
              </div>
            </template>
            <p v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
              Aucun examen enregistré
            </p>
                </div>
          </div>
        </div>

            <!-- Onglet: Consultations -->
            <div v-else-if="activeTab === 'consultations'" class="tab-content">
        <div class="info-section col-span-1 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h4 class="info-section-title flex items-center">
              <Stethoscope class="w-5 h-5 mr-2 text-primary-500" />
              Consultations
            </h4>
          </div>
          <div class="space-y-4">
            <template v-if="sortedConsultations.length">
              <div v-for="(consultation, index) in sortedConsultations" :key="index"
                   class="consultation-card">
                <div class="flex justify-between items-start">
                  <div class="flex items-center space-x-2">
                    <div class="consultation-icon">
                      <UserCheck class="w-5 h-5" />
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        Consultation du {{ formatDate(consultation.date) }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 block">
                        Dr. {{ getMedecinNameFromConsultation(consultation) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="mt-3 space-y-2">
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    <p class="font-medium mb-1">Motif:</p>
                    <p>{{ consultation.motif || 'Non spécifié' }}</p>
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    <p class="font-medium mb-1">Observations:</p>
                    <p>{{ consultation.observations || 'Aucune observation' }}</p>
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    <p class="font-medium mb-1">Diagnostic:</p>
                    <p>{{ consultation.diagnostic || 'Aucun diagnostic' }}</p>
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
              Aucune consultation enregistrée
          </p>
                </div>
        </div>
      </div>

            <!-- Onglet: Rapports -->
            <div v-else-if="activeTab === 'rapports'" class="tab-content">
      <div class="info-section col-span-1 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h4 class="info-section-title flex items-center">
            <ClipboardList class="w-5 h-5 mr-2 text-primary-500" />
            Rapports
          </h4>
          <button 
            @click="showRapportModal = true"
            class="btn btn-secondary btn-sm flex items-center"
          >
            <Plus class="w-4 h-4 mr-1" />
            Ajouter un rapport
          </button>
        </div>
        <div class="space-y-4">
          <template v-if="sortedRapports.length">
            <div v-for="(rapport, index) in sortedRapports" :key="index"
                 class="rapport-card">
                      <!-- Contenu des rapports -->
              <div class="flex justify-between items-start">
                <div class="flex items-center space-x-2">
                  <div class="rapport-icon" :class="getRapportTypeClass(rapport.type)">
                    <ClipboardList class="w-5 h-5" />
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ rapport.titre || `Rapport du ${formatDate(rapport.date)}` }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">
                      {{ formatDate(rapport.date) }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">
                      {{ rapport.medecin ? `Dr. ${rapport.medecin.prenom} ${rapport.medecin.nom}` : 'Non assigné' }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button 
                    @click="downloadRapport(rapport)"
                    class="action-button text-gray-600 dark:text-gray-400"
                    title="Télécharger"
                  >
                    <Download class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteRapport(rapport)"
                    class="action-button text-red-600 dark:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="mt-3 text-sm text-gray-600 dark:text-gray-400" v-if="rapport.contenu">
                <p class="font-medium mb-1">Contenu:</p>
                <p>{{ rapport.contenu }}</p>
              </div>
            </div>
          </template>
          <p v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
            Aucun rapport enregistré
          </p>
                </div>
        </div>
      </div>

            <!-- Onglet: Documents -->
            <div v-else-if="activeTab === 'documents'" class="tab-content">
        <div class="info-section col-span-1 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
            <h4 class="info-section-title flex items-center">
              <Files class="w-5 h-5 mr-2 text-primary-500" />
              Documents associés
            </h4>
          <button 
            @click="showUploadModal = true"
              class="btn btn-secondary btn-sm flex items-center"
          >
            <Upload class="w-4 h-4 mr-1" />
            Ajouter un document
          </button>
        </div>
        
        <div class="document-grid">
                  <div v-if="!dossier?.documents || dossier.documents.length === 0" 
                      class="col-span-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Files class="w-12 h-12 text-gray-400 mb-2" />
                    <p class="text-gray-600 dark:text-gray-400 text-center">
                      Aucun document disponible pour ce dossier médical
                    </p>
                    <p class="text-gray-500 dark:text-gray-500 text-sm text-center mt-1">
                      Utilisez le bouton "Ajouter un document" pour téléverser des documents
                    </p>
                  </div>
                  
          <div 
            v-for="(doc, index) in dossier?.documents || []"
            :key="doc.id || index"
              class="document-card"
          >
            <div class="document-icon" :class="getDocumentTypeClass(getDocumentData(doc, index).name)">
              <FileText class="w-6 h-6" />
            </div>
            <div class="document-info">
              <span class="document-name">{{ getDocumentData(doc, index).name }}</span>
              <span class="document-meta">
                  {{ formatFileSize(getDocumentData(doc, index).size) }} • 
                  {{ formatDate(getDocumentData(doc, index).uploadDate) }}
              </span>
            </div>
            <div class="document-actions">
              <button 
                        v-if="isPreviewable(getDocumentData(doc, index).name)"
                @click="previewDocument(getDocumentData(doc, index))"
                class="action-button text-blue-600 dark:text-blue-400"
                title="Aperçu"
              >
                <Eye class="w-4 h-4" />
              </button>
              <button 
                @click="downloadDocument(getDocumentData(doc, index))"
                class="action-button text-gray-600 dark:text-gray-400"
                title="Télécharger"
              >
                <Download class="w-4 h-4" />
              </button>
              <button 
                @click="deleteDocument(getDocumentData(doc, index))"
                class="action-button text-red-600 dark:text-red-400"
                title="Supprimer"
              >
                <Trash2 class="w-4 h-4" />
              </button>
              </div>
            </div>
          </div>
        </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Modals -->
    <UploadModal
      v-if="showUploadModal"
      :dossier-id="dossier?._id || dossier?.id"
      @close="showUploadModal = false"
      @upload-complete="handleUploadComplete"
    />

    <PreviewModal
      v-if="showPreviewModal"
      :document="previewDocumentData"
      @close="closePreviewModal"
    />

    <RapportModal
      v-if="showRapportModal"
      :dossier-id="dossier?._id || dossier?.id"
      @close="showRapportModal = false"
      @created="handleRapportCreated"
    />
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  UserCircle, Upload, FileText, Eye, Download, Edit, Trash2,
  Calendar, Clock, User, Stethoscope, Building2, Activity,
  ClipboardList, Files, Archive, Circle, Plus, Microscope, TestTube, UserCheck, AlertCircle
} from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import UploadModal from './UploadModal.vue'
import PreviewModal from './PreviewModal.vue'
import RapportModal from './RapportModal.vue'
import { useDossierMedicalStore } from '@/stores/dossierMedical'
import { useConsultationStore } from '@/stores/consultationStore'
import { useExamenStore } from '@/stores/examenStore'
import { useRapportStore } from '@/stores/rapportStore'
import { useEvolutionStore } from '@/stores/evolutionStore'
import EvolutionsList from './EvolutionsList.vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'

const props = defineProps({
  dossier: {
    type: Object,
    required: true
  },
  showModal: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'edit', 'update'])

// États locaux
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const showEvolutionModal = ref(false)
const showRapportModal = ref(false)
const previewDocumentData = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)

const dossierMedicalStore = useDossierMedicalStore()
const consultationStore = useConsultationStore()
const examenStore = useExamenStore()
const rapportStore = useRapportStore()
const evolutionStore = useEvolutionStore()
const { isLoading: dossierMedicalIsLoading } = storeToRefs(dossierMedicalStore)
const toast = useToast()

// Système d'onglets
const activeTab = ref('patient')  // L'onglet actif par défaut est 'patient'
const tabs = [
  { id: 'patient', label: 'Patient', icon: User },
  { id: 'resume', label: 'Résumé médical', icon: ClipboardList },
  { id: 'evolutions', label: 'Évolutions', icon: Activity },
  { id: 'examens', label: 'Examens', icon: Microscope },
  { id: 'consultations', label: 'Consultations', icon: UserCheck },
  { id: 'rapports', label: 'Rapports', icon: ClipboardList },
  { id: 'documents', label: 'Documents', icon: Files },
]

// Chargement des données
const loadDossierData = async () => {
  if (props.dossier?._id) {
    console.log('Loading dossier data for dossier:', props.dossier)
    try {
      isLoading.value = true
      errorMessage.value = null

      // Récupérer les consultations, examens et rapports directement depuis le dossier et les API
      await Promise.all([
        consultationStore.fetchConsultations(props.dossier._id),
        examenStore.fetchExamensByDossier(props.dossier._id),
        rapportStore.fetchRapports(props.dossier._id)
      ])

      // Synchroniser les données avec leurs stores respectifs
      if (props.dossier.examens && props.dossier.examens.length > 0) {
        await dossierMedicalStore.syncExamensWithStore(props.dossier)
      }
      
      if (props.dossier.consultations && props.dossier.consultations.length > 0) {
        await dossierMedicalStore.syncConsultationsWithStore(props.dossier)
      }

      if (props.dossier.rapports && props.dossier.rapports.length > 0) {
        await dossierMedicalStore.syncRapportsWithStore(props.dossier)
      }

      console.log('Données synchronisées avec succès')
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      errorMessage.value = 'Erreur lors du chargement des données. Veuillez réessayer plus tard.'
    } finally {
      isLoading.value = false
    }
  }
}

// Watch pour charger les données quand le modal s'ouvre
watch(() => props.showModal, async (newVal) => {
  if (newVal && props.dossier?._id) {
    console.log('Modal ouvert - Chargement des données pour le dossier:', props.dossier._id)
    try {
      await loadDossierData()
      console.log('Données chargées avec succès')
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }
})

// Computed properties
const getPatientFullName = computed(() => {
  const patient = props.dossier?.patient?.utilisateur
  return patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'
})

const getMedecinFullName = computed(() => {
  const medecin = props.dossier?.medecin_traitant
  return medecin ? `${medecin.prenom} ${medecin.nom}` : 'Non assigné'
})

const sortedExamens = computed(() => {
  if (!props.dossier?.examens) return []
  return [...props.dossier.examens].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const sortedConsultations = computed(() => {
  // Get consultations from the store instead of directly from the dossier
  const consultations = consultationStore.consultations || [];
  
  // If no consultations in the store, fallback to dossier consultations
  if (consultations.length === 0 && props.dossier?.consultations) {
    return [...props.dossier.consultations].sort((a, b) => new Date(b.dateConsultation || b.date) - new Date(a.dateConsultation || a.date));
  }
  
  // Return sorted consultations from the store
  return [...consultations].sort((a, b) => new Date(b.dateConsultation || b.date) - new Date(a.dateConsultation || a.date));
})

const sortedRapports = computed(() => {
  if (!props.dossier?.rapports) return []
  return [...props.dossier.rapports].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Méthodes
const closeModal = () => {
  emit('close')
}

const formatDate = (date) => {
  if (!date) return 'Non spécifié'
  try {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const getStatusClass = (status) => {
  const classes = {
    'actif': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
    'archive': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
  }
  return classes[status] || classes['actif']
}

const getStatusLabel = (status) => {
  const labels = {
    'actif': 'Actif',
    'archive': 'Archivé'
  }
  return labels[status] || 'Inconnu'
}

const getDossierStatus = (dossier) => {
  return dossier && dossier.is_archived ? 'archive' : 'actif'
}

const getDocumentTypeClass = (filename) => {
  if (!filename) return 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400'
  
  const extension = filename.split('.').pop().toLowerCase()
  const classes = {
    'pdf': 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
    'doc': 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    'docx': 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    'jpg': 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    'jpeg': 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    'png': 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'
  }
  return classes[extension] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400'
}

const getDocumentData = (doc, index) => {
  // Log pour débogage
  console.log('Traitement du document:', doc, typeof doc)
  
  // Cas où le document est null ou undefined
  if (!doc) {
    return {
      id: `unknown-${index}`,
      name: 'Document inconnu',
      size: 0,
      uploadDate: new Date().toISOString(),
      url: null,
      path: null
    }
  }
  
  // Si le document est déjà formaté correctement (par un appel précédent à getDocumentData)
  if (doc.id && doc.name && doc.url) {
    return doc
  }
  
  // Si le document est une simple chaîne (chemin de fichier)
  if (typeof doc === 'string') {
    const fileName = doc.split('/').pop() || 'Document sans nom'
    return {
      id: `doc-${index}`,
      name: fileName,
      size: 0,
      uploadDate: props.dossier?.dateEntree || new Date().toISOString(),
      url: `${process.env.VUE_APP_API_URL}/storage/${doc}`,
      path: doc
    }
  }

  // Si le document est un objet MongoDB avec _id
  if (doc._id) {
  return {
      id: doc._id,
      name: doc.nom || doc.name || (doc.path ? doc.path.split('/').pop() : 'Document sans nom'),
      size: doc.taille || doc.size || 0,
      uploadDate: doc.dateAjout || doc.date_ajout || doc.created_at || props.dossier?.dateEntree || new Date().toISOString(),
      url: doc.url || (doc.path ? `${process.env.VUE_APP_API_URL}/storage/${doc.path}` : null),
      path: doc.path || doc.chemin
    }
  }
  
  // Pour tous les autres types de documents (objets standards)
  return {
    id: doc.id || `doc-${index}`,
    name: doc.nom || doc.name || (doc.path ? doc.path.split('/').pop() : (doc.chemin ? doc.chemin.split('/').pop() : 'Document sans nom')),
    size: doc.taille || doc.size || 0,
    uploadDate: doc.dateAjout || doc.date_ajout || doc.created_at || props.dossier?.dateEntree || new Date().toISOString(),
    url: doc.url || (doc.path ? `${process.env.VUE_APP_API_URL}/storage/${doc.path}` : (doc.chemin ? `${process.env.VUE_APP_API_URL}/storage/${doc.chemin}` : null)),
    path: doc.path || doc.chemin
  }
}

const previewDocument = (doc) => {
  // S'assurer que le document est correctement formaté
  const documentFormatted = getDocumentData(doc, 0);
  console.log('Document à prévisualiser:', documentFormatted);
  
  // Mettre à jour les données et ouvrir la modal
  previewDocumentData.value = documentFormatted;
  showPreviewModal.value = true;
}

const closePreviewModal = () => {
  showPreviewModal.value = false;
  previewDocumentData.value = null;
}

const downloadDocument = (doc) => {
  // S'assurer que le document est correctement formaté
  const documentFormatted = getDocumentData(doc, 0);
  console.log('Document à télécharger:', documentFormatted);
  
  if (!documentFormatted.url) {
    console.error('URL du document non disponible');
    alert('Le document n\'est pas disponible pour téléchargement.');
    return;
  }
  
  // Ouvrir l'URL dans un nouvel onglet
  window.open(documentFormatted.url, '_blank');
}

const deleteDocument = async (doc) => {
  if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return
  
  try {
    const dossierId = props.dossier._id || props.dossier.id
    await dossierMedicalStore.deleteDocument(dossierId, doc.id)
    const updatedDossier = await dossierMedicalStore.fetchDossierMedical(dossierId)
    emit('update', updatedDossier)
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
  }
}

const archiveDossier = async () => {
  if (!confirm('Voulez-vous vraiment archiver ce dossier ?')) return
  
  try {
    const dossierId = props.dossier._id || props.dossier.id
    await dossierMedicalStore.archiverDossier(dossierId)
    const updatedDossier = await dossierMedicalStore.fetchDossierMedical(dossierId)
    emit('update', updatedDossier)
  } catch (error) {
    console.error('Erreur lors de l\'archivage du dossier:', error)
  }
}

const handleUploadComplete = async () => {
  showUploadModal.value = false
  const dossierId = props.dossier._id || props.dossier.id
  const updatedDossier = await dossierMedicalStore.fetchDossierMedical(dossierId)
  emit('update', updatedDossier)
}

const getExamenStatusClass = (statut) => {
  const classes = {
    'en_attente': 'bg-yellow-100 text-yellow-600',
    'en_cours': 'bg-blue-100 text-blue-600',
    'termine': 'bg-green-100 text-green-600',
    'annule': 'bg-red-100 text-red-600'
  }
  return classes[statut?.toLowerCase()] || 'bg-gray-100 text-gray-600'
}

const getExamenStatusBadgeClass = (statut) => {
  const classes = {
    'en_attente': 'bg-yellow-100 text-yellow-800',
    'en_cours': 'bg-blue-100 text-blue-800',
    'termine': 'bg-green-100 text-green-800',
    'annule': 'bg-red-100 text-red-800'
  }
  return classes[statut?.toLowerCase()] || 'bg-gray-100 text-gray-800'
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

const formatExamenStatus = (statut) => {
  const statusMap = {
    'en_attente': 'En attente',
    'en_cours': 'En cours',
    'termine': 'Terminé',
    'annule': 'Annulé'
  }
  return statusMap[statut?.toLowerCase()] || statut
}

const getMedecinNameFromExamen = (examen) => {
  // Log the examen object to debug
  console.log('Examen object:', examen);
  
  // Check if medecin object is directly available
  if (examen.medecin && examen.medecin.prenom && examen.medecin.nom) {
    return `${examen.medecin.prenom} ${examen.medecin.nom}`;
  }
  
  // Check for nested medecin in dossier_medical
  if (examen.dossier_medical?.medecin?.utilisateur) {
    return `${examen.dossier_medical.medecin.utilisateur.prenom} ${examen.dossier_medical.medecin.utilisateur.nom}`;
  }
  
  // Check for medecin_id with lookup in the dossier
  if (examen.medecin_id && props.dossier?.medecin?.utilisateur) {
    return `${props.dossier.medecin.utilisateur.prenom} ${props.dossier.medecin.utilisateur.nom}`;
  }
  
  // Additional check for medecin_id in a different format
  if (examen.medecin_id) {
    console.log('Found medecin_id:', examen.medecin_id);
    // Try to find the medecin in the dossier's medecins array if it exists
    if (props.dossier?.medecins && Array.isArray(props.dossier.medecins)) {
      const medecin = props.dossier.medecins.find(m => m._id === examen.medecin_id);
      if (medecin?.utilisateur) {
        return `${medecin.utilisateur.prenom} ${medecin.utilisateur.nom}`;
      }
    }
  }
  
  // If we have a dossier_id, try to get the medecin from there
  if (examen.dossier_id && props.dossier?._id === examen.dossier_id && props.dossier?.medecin?.utilisateur) {
    return `${props.dossier.medecin.utilisateur.prenom} ${props.dossier.medecin.utilisateur.nom}`;
  }
  
  console.warn('Could not find medecin information for examen:', examen);
  return 'Non assigné';
}

const getMedecinNameFromConsultation = (consultation) => {
  // Log the consultation object to debug
  console.log('Consultation object:', consultation);
  
  // Check if medecin object is directly available
  if (consultation.medecin && consultation.medecin.prenom && consultation.medecin.nom) {
    return `${consultation.medecin.prenom} ${consultation.medecin.nom}`;
  }
  
  // Check for nested medecin in dossier_medical
  if (consultation.dossier_medical?.medecin?.utilisateur) {
    return `${consultation.dossier_medical.medecin.utilisateur.prenom} ${consultation.dossier_medical.medecin.utilisateur.nom}`;
  }
  
  // Check for medecin_id with lookup in the dossier
  if (consultation.medecin_id && props.dossier?.medecin?.utilisateur) {
    return `${props.dossier.medecin.utilisateur.prenom} ${props.dossier.medecin.utilisateur.nom}`;
  }
  
  // Additional check for medecin_id in a different format
  if (consultation.medecin_id) {
    console.log('Found medecin_id:', consultation.medecin_id);
    // Try to find the medecin in the dossier's medecins array if it exists
    if (props.dossier?.medecins && Array.isArray(props.dossier.medecins)) {
      const medecin = props.dossier.medecins.find(m => m._id === consultation.medecin_id);
      if (medecin?.utilisateur) {
        return `${medecin.utilisateur.prenom} ${medecin.utilisateur.nom}`;
      }
    }
  }
  
  // If we have a dossier_id, try to get the medecin from there
  if (consultation.dossier_id && props.dossier?._id === consultation.dossier_id && props.dossier?.medecin?.utilisateur) {
    return `${props.dossier.medecin.utilisateur.prenom} ${props.dossier.medecin.utilisateur.nom}`;
  }
  
  console.warn('Could not find medecin information for consultation:', consultation);
  return 'Non assigné';
}

// Méthodes pour les rapports
const getRapportTypeLabel = (type) => {
  const types = {
    'consultation': 'Consultation',
    'hospitalisation': 'Hospitalisation',
    'chirurgie': 'Chirurgie',
    'suivi': 'Suivi'
  }
  return types[type] || type || 'Non spécifié'
}

const getRapportTypeClass = (type) => {
  const classes = {
    'consultation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'hospitalisation': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    'chirurgie': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    'suivi': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
  return classes[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
}

// Méthode pour gérer la création d'un rapport
const handleRapportCreated = async (newRapport) => {
  try {
    // Recharger les rapports
    await rapportStore.fetchRapports(props.dossier._id)
    
    // Mettre à jour le dossier
    const updatedDossier = await dossierMedicalStore.fetchDossierMedical(props.dossier._id)
    emit('update', updatedDossier)
  } catch (error) {
    console.error('Erreur lors de la mise à jour après création du rapport:', error)
  }
}

const downloadRapport = async (rapport) => {
  try {
    const response = await rapportStore.generatePDF(rapport._id)
    if (response && response.url) {
      window.open(response.url, '_blank')
    } else {
      // Fallback si l'API ne retourne pas d'URL
      const blob = new Blob([rapport.contenu], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-${rapport._id}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement du rapport:', error)
  }
}

const deleteRapport = async (rapport) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
    try {
      await rapportStore.deleteRapport(rapport._id)
      
      // Recharger les rapports
      await rapportStore.fetchRapports(props.dossier._id)
      
      // Mettre à jour le dossier
      const updatedDossier = await dossierMedicalStore.fetchDossierMedical(props.dossier._id)
      emit('update', updatedDossier)
    } catch (error) {
      console.error('Erreur lors de la suppression du rapport:', error)
    }
  }
}

// Vérifier si un document est prévisualisable dans le navigateur
const isPreviewable = (documentName) => {
  if (!documentName) return false;
  
  const extension = documentName.split('.').pop().toLowerCase();
  // Liste des types de fichiers qui peuvent être prévisualisés directement dans le navigateur
  const previewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
  
  return previewableExtensions.includes(extension);
}
</script>

<style scoped>
/* Styles existants */

/* Navigation par onglets */
.tab-navigation {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(156, 163, 175, 0.2);
  position: relative;
  overflow: hidden;
}

.tab-container {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  gap: 0.5rem;
  padding: 0.5rem 0;
  position: relative;
  z-index: 1;
}

.tab-container::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-gray-600, #4B5563);
  border-radius: 0.5rem;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.dark .tab-item {
  background-color: rgba(31, 41, 55, 0.6);
  border-color: rgba(75, 85, 99, 0.5);
  color: var(--text-gray-300, #D1D5DB);
}

.tab-item:hover {
  color: var(--text-primary-600, #4F46E5);
  background-color: rgba(79, 70, 229, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.tab-item.active {
  color: white;
  background-color: var(--color-primary-600, #4F46E5);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3), 0 4px 6px -2px rgba(79, 70, 229, 0.2);
}

.dark .tab-item.active {
  background-color: var(--color-primary-500, #6366F1);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3), 0 4px 6px -2px rgba(99, 102, 241, 0.2);
}

.tab-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
  transition: transform 0.2s ease;
}

.tab-item:hover .tab-icon {
  transform: scale(1.1);
}

.tab-item.active .tab-icon {
  transform: scale(1.2);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}

/* Contenu des onglets avec animation améliorée */
.tab-content-container {
  position: relative;
  min-height: 400px;
  overflow: hidden;
  perspective: 1000px;
  will-change: transform;
}

.tab-content-wrapper {
  animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.3s ease;
}

.dark .tab-content-wrapper {
  background-color: rgba(31, 41, 55, 0.7);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
}

.tab-content {
  padding: 0.5rem;
}

/* Améliorations des sections d'information */
.info-section {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 1.5rem;
  overflow: hidden;
  position: relative;
}

.dark .info-section {
  background-color: rgba(31, 41, 55, 0.6);
  border-color: rgba(55, 65, 81, 0.5);
}

.info-section:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-4px);
}

.info-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary-400, #818CF8), var(--color-primary-600, #4F46E5));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.info-section:hover::before {
  opacity: 1;
}

.info-section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-gray-800, #1F2937);
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  display: flex;
  align-items: center;
}

.dark .info-section-title {
  color: var(--text-gray-200, #E5E7EB);
  border-color: rgba(75, 85, 99, 0.4);
}

.info-section-title svg {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}

/* Cartes d'information avec effets améliorés */
.patient-info-card, .doctor-info-card {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.dark .patient-info-card, .dark .doctor-info-card {
  background-color: rgba(31, 41, 55, 0.4);
  border-color: rgba(55, 65, 81, 0.3);
}

.patient-info-card:hover, .doctor-info-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-3px);
}

.patient-info-card::after, .doctor-info-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent 65%, rgba(79, 70, 229, 0.05) 100%);
  z-index: -1;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.patient-info-card:hover::after, .doctor-info-card:hover::after {
  opacity: 1;
}

.info-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
  position: relative;
  padding-left: 0.5rem;
}

.info-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.25rem;
  height: calc(100% - 0.5rem);
  width: 2px;
  background-color: var(--color-primary-200, #C7D2FE);
  border-radius: 1px;
  opacity: 0.6;
}

.dark .info-item::before {
  background-color: var(--color-primary-800, #3730A3);
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-gray-500, #6B7280);
  margin-bottom: 0.3rem;
  letter-spacing: 0.025em;
}

.dark .info-label {
  color: var(--text-gray-400, #9CA3AF);
}

.info-value {
  font-size: 0.925rem;
  color: var(--text-gray-700, #374151);
  font-weight: 500;
}

.dark .info-value {
  color: var(--text-gray-300, #D1D5DB);
}

/* Cartes pour les examens, consultations et rapports avec animations */
.examen-card, .consultation-card, .rapport-card {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
}

.dark .examen-card, .dark .consultation-card, .dark .rapport-card {
  background-color: rgba(31, 41, 55, 0.4);
  border-color: rgba(55, 65, 81, 0.3);
}

.examen-card:hover, .consultation-card:hover, .rapport-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-4px) scale(1.01);
}

.examen-icon, .consultation-icon, .rapport-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  background-color: var(--color-blue-100, #DBEAFE);
  color: var(--color-blue-600, #2563EB);
  box-shadow: 0 0 0 4px rgba(219, 234, 254, 0.3);
  transition: all 0.3s ease;
}

.examen-card:hover .examen-icon,
.consultation-card:hover .consultation-icon,
.rapport-card:hover .rapport-icon {
  transform: scale(1.05);
  box-shadow: 0 0 0 6px rgba(219, 234, 254, 0.4);
}

.dark .examen-icon, .dark .consultation-icon, .dark .rapport-icon {
  background-color: rgba(59, 130, 246, 0.2);
  color: var(--color-blue-400, #60A5FA);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

/* Document grid avec mise en page améliorée */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.25rem;
}

.document-card {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  height: 100%;
}

.dark .document-card {
  background-color: rgba(31, 41, 55, 0.4);
  border-color: rgba(55, 65, 81, 0.3);
}

.document-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-4px);
}

.document-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, transparent 75%, rgba(79, 70, 229, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.document-card:hover::before {
  opacity: 1;
}

.document-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1rem;
  border-radius: 0.75rem;
  background-color: var(--color-blue-100, #DBEAFE);
  color: var(--color-blue-600, #2563EB);
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.dark .document-icon {
  background-color: rgba(59, 130, 246, 0.2);
  color: var(--color-blue-400, #60A5FA);
}

.document-card:hover .document-icon {
  transform: scale(1.1) rotate(-5deg);
}

.document-info {
  text-align: center;
  margin-bottom: 1rem;
  flex-grow: 1;
}

.document-name {
  display: block;
  font-size: 0.925rem;
  font-weight: 600;
  color: var(--text-gray-700, #374151);
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .document-name {
  color: var(--text-gray-300, #D1D5DB);
}

.document-meta {
  display: block;
  font-size: 0.75rem;
  color: var(--text-gray-500, #6B7280);
}

.dark .document-meta {
  color: var(--text-gray-400, #9CA3AF);
}

.document-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
}

.dark .document-actions {
  border-color: rgba(75, 85, 99, 0.2);
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  transition: all 0.2s ease;
  background-color: rgba(243, 244, 246, 0.7);
  color: inherit;
}

.dark .action-button {
  background-color: rgba(55, 65, 81, 0.3);
}

.action-button:hover {
  background-color: var(--color-primary-50, #EEF2FF);
  color: var(--color-primary-600, #4F46E5);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.dark .action-button:hover {
  background-color: rgba(79, 70, 229, 0.2);
}

/* Animations améliorées */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-enter-active {
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-leave-active {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse;
}

/* Responsive */
@media (max-width: 640px) {
  .tab-item {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }
  
  .document-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  
  .info-section-title {
    font-size: 1.125rem;
  }
}
</style>



