<template>
  <div class="p-6 h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
    <div class="max-w-7xl mx-auto">
      <!-- En-tête avec animation subtile -->
      <div class="mb-8 flex justify-between items-center animate-fadeIn">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Documents Médicaux</h1>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">Gestion complète des ordonnances, consultations et autres documents médicaux</p>
        </div>
      
        <!-- Filtres et recherche améliorés -->
        <div class="flex space-x-4">
          <div class="relative group">
            <input 
              type="text" 
              v-model="searchQuery" 
              class="form-input pl-10 pr-4 py-2.5 w-72 rounded-xl border-gray-200 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all duration-300 ease-in-out"
              placeholder="Rechercher un document..."
            />
            <Search class="absolute left-3 top-3 w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" />
          </div>
        </div>
      </div>
      
      <!-- Navigation des types de documents améliorée -->
      <div class="mb-8">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-full">
          <button 
            v-for="type in documentTypes"
            :key="type.value"
            @click="currentType = type.value"
            class="relative group overflow-hidden rounded-xl transition-all duration-300 ease-in-out flex flex-col items-center justify-center py-4 px-2"
            :class="[
              currentType === type.value 
                ? 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 dark:from-primary-900/40 dark:to-primary-800/20 dark:text-primary-300 shadow-lg scale-105 shadow-primary-300/10 dark:shadow-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800/50' 
                : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750 hover:shadow-md'
            ]"
          >
            <!-- Effet d'arrière-plan animé -->
            <div 
              class="absolute inset-0 w-full h-full transition-opacity duration-500 opacity-0 group-hover:opacity-100"
              :class="{ 
                'bg-gradient-to-br from-primary-50/50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10': currentType !== type.value
              }"
            ></div>
            
            <!-- Indicateur de sélection -->
            <div 
              v-if="currentType === type.value" 
              class="absolute -top-px left-0 w-full h-1 bg-primary-500 dark:bg-primary-400 animate-pulse"
            ></div>
            
            <!-- Contenu du bouton -->
            <div class="relative flex flex-col items-center space-y-3">
              <div 
                class="w-14 h-14 rounded-full flex items-center justify-center p-2 transition-all duration-300"
                :class="{
                  'bg-primary-100 text-primary-600 dark:bg-primary-800/40 dark:text-primary-300 shadow-inner': currentType === type.value,
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500 dark:group-hover:bg-gray-750 dark:group-hover:text-primary-400': currentType !== type.value
                }"
          >
            <component 
              :is="type.icon" 
                  class="w-8 h-8 transition-all duration-500 ease-in-out" 
              :class="{
                    'transform scale-110': currentType === type.value,
                    'group-hover:scale-110 group-hover:text-primary-500 dark:group-hover:text-primary-400': currentType !== type.value
              }"
            />
              </div>
              
              <div class="flex flex-col items-center">
                <span class="font-medium text-center whitespace-nowrap">
            {{ type.label }}
                </span>
            <span 
                  class="mt-1 px-2.5 py-1 rounded-full text-xs font-semibold text-center transition-all duration-300"
              :class="{
                    'bg-primary-200 text-primary-800 dark:bg-primary-700/50 dark:text-primary-200': currentType === type.value,
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 group-hover:bg-primary-50 group-hover:text-primary-600 dark:group-hover:bg-primary-900/30 dark:group-hover:text-primary-300': currentType !== type.value
              }"
            >
              {{ getDocumentCount(type.value) }}
            </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Contenu principal -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <component :is="documentTypes.find(t => t.value === currentType)?.icon" class="w-5 h-5 mr-2 text-primary-500" />
            {{ documentTypes.find(t => t.value === currentType)?.label }}
            </h2>
            <button 
            @click="showForm(currentType)"
              class="btn btn-primary btn-sm"
            >
              <Plus class="w-4 h-4 mr-1" />
            Nouveau
            </button>
          </div>

        <!-- Liste des documents améliorée avec animations et design moderne -->
        <div class="space-y-6">
          <div v-if="hasResults">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="document in paginatedDocuments" 
                 :key="document._id || document.id"
                 class="group p-5 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-300 ease-in-out border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transform hover:translate-y-[-2px] overflow-hidden relative"
            >
              <!-- Indicateur visuel du type de document -->
              <div class="absolute top-0 left-0 w-1.5 h-full bg-primary-500 opacity-75"></div>
              
              <div class="flex justify-between items-start pl-3">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-3">
                    <p class="font-semibold text-gray-900 dark:text-white flex items-center">
                      <component 
                        :is="documentTypes.find(t => t.value === currentType)?.icon" 
                        class="w-5 h-5 mr-2 text-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300" 
                      />
                      {{ formatDate(document.dateEmission || document.date || document.date_debut || document.dateConsultation || document.dateDeMesure || document.dateDebut  ) }}
                    </p>
                    
                    <!-- Badge de statut amélioré -->
                    <div v-if="document.statut" class="ml-2">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm" 
                            :class="{
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800': 
                                document.statut === 'actif' || document.statut === 'terminé' || document.statut === 'normal',
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800': 
                                document.statut === 'en_attente' || document.statut === 'en_cours' || document.statut === 'attention',
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800': 
                                document.statut === 'annulé' || document.statut === 'critique'
                            }">
                        {{ document.statut.replace('_', ' ') }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Contenu spécifique selon le type -->
                  <div v-if="currentType === 'ordonnance'" class="mt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                      </svg>
                      {{ document.medicaments?.length || 0 }} médicaments
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                      Renouvelable: {{ document.renouvelable ? 'Oui' : 'Non' }}
                    </p>
                  </div>
                  
                  <div v-else-if="currentType === 'consultation'" class="mt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {{ document.motifConsultation || 'Aucun motif spécifié' }}
                    </p>
                    <p v-if="document.diagnostic" class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      <span class="font-medium">Diagnostic:</span> {{ document.diagnostic }}
                    </p>
                  </div>
                  
                  <div v-else-if="currentType === 'examen'" class="mt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {{ document.type || 'Type non spécifié' }}
                    </p>
                    <p v-if="document.resultat?.texte" class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {{ document.resultat.texte }}
                    </p>
                </div>
                  
                  <div v-else-if="currentType === 'rapport'" class="mt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {{ document.type || 'Non spécifié' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {{ document.contenu || 'Aucun contenu' }}
                    </p>
              </div>
                  
                  <div v-else-if="currentType === 'billet'" class="mt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 font-medium">
                      {{ document.motif || 'Aucun motif spécifié' }}
                    </p>
                    <div class="flex items-center mt-1">
                      <p v-if="document.dateFin" class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                          <line x1="16" x2="16" y1="2" y2="6"></line>
                          <line x1="8" x2="8" y1="2" y2="6"></line>
                          <line x1="3" x2="21" y1="10" y2="10"></line>
                        </svg>
                        Jusqu'au: {{ formatDate(document.dateFin) }}
                      </p>
            </div>
          </div>
                  
                  <div v-else-if="currentType === 'certificat'" class="mt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {{ document.type || 'Type non spécifié' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {{ document.contenu || 'Aucun contenu' }}
                    </p>
        </div>

                  <div v-else-if="currentType === 'traitement'" class="mt-2">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {{ document.titre || 'Sans titre' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"></path>
                        <circle cx="17" cy="7" r="5"></circle>
                      </svg>
                      {{ document.medications?.length || 0 }} médicaments
                    </p>
          </div>

                    <div v-else class="mt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {{ document.nomMesure || 'Mesure non spécifiée' }}
                    </p>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">
                      {{ document.valeurDeMesure || 'N/A' }}
                    </p>
          </div>
        </div>

                <!-- Actions -->
                <div class="flex flex-col space-y-2 ml-2">
                  <button 
                    class="text-gray-400 hover:text-primary-500 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" 
                    @click="generatePDF(document._id || document.id)"
                    title="Imprimer"
                  >
                    <Printer class="w-4 h-4" />
                  </button>
                  <button 
                    class="text-gray-400 hover:text-primary-500 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" 
                    @click="downloadPDF(document._id || document.id)"
                    title="Télécharger"
                  >
                    <Download class="w-4 h-4" />
                  </button>
                  <button 
                    class="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" 
                    @click="deleteDocument(currentType, document._id || document.id)"
                    title="Supprimer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message si aucun résultat -->
          <div v-else class="py-12 flex flex-col items-center justify-center text-center">
            <component :is="documentTypes.find(t => t.value === currentType)?.icon" class="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun document trouvé</h3>
            <p class="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Vous n'avez pas encore créé de {{ documentTypes.find(t => t.value === currentType)?.label.toLowerCase() || 'document' }}.
            </p>
            <button 
              @click="showForm(currentType)"
              class="btn btn-primary"
            >
              <Plus class="w-4 h-4 mr-2" />
              Créer un {{ documentTypes.find(t => t.value === currentType)?.label.slice(0, -1).toLowerCase() || 'document' }}
            </button>
                </div>
              </div>
            </div>
          
          <!-- Pagination -->
          <div class="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
              Affichage de {{ paginationStart + 1 }}-{{ Math.min(paginationStart + itemsPerPage, totalItems) }} sur {{ totalItems }} documents
          </div>
            
            <!-- Sélecteur d'éléments par page -->
            <div class="flex items-center space-x-2 mb-4 md:mb-0">
              <span class="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
              <select 
                v-model="itemsPerPage" 
                class="form-select w-16 py-1 text-sm"
                @change="currentPage = 1"
              >
                <option :value="6">6</option>
                <option :value="9">9</option>
                <option :value="12">12</option>
                <option :value="24">24</option>
              </select>
              <span class="text-sm text-gray-500 dark:text-gray-400">par page</span>
        </div>

            <!-- Contrôles de pagination -->
            <div class="flex items-center space-x-1">
    <button 
                @click="currentPage = 1" 
                :disabled="currentPage === 1"
                class="btn btn-icon"
                :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
                title="Première page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="11 17 6 12 11 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </svg>
    </button>
              
              <button 
                @click="currentPage--" 
                :disabled="currentPage === 1"
                class="btn btn-icon"
                :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
                title="Page précédente"
              >
                <ChevronLeft class="w-4 h-4" />
            </button>
              
              <div class="flex items-center space-x-1">
                <button 
                  v-for="page in displayedPages" 
                  :key="page"
                  @click="page !== '...' ? currentPage = page : null"
                  class="w-8 h-8 flex items-center justify-center rounded-md text-sm"
                  :class="[
                    page === '...' ? 'cursor-default text-gray-500 dark:text-gray-400' : 
                    currentPage === page 
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium' 
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ page }}
            </button>
</div>

            <button 
                @click="currentPage++" 
                :disabled="currentPage === totalPages"
                class="btn btn-icon"
                :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages }"
                title="Page suivante"
              >
                <ChevronRight class="w-4 h-4" />
            </button>
              
              <button 
                @click="currentPage = totalPages" 
                :disabled="currentPage === totalPages"
                class="btn btn-icon"
                :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages }"
                title="Dernière page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="13 17 18 12 13 7"></polyline>
                  <polyline points="6 17 11 12 6 7"></polyline>
                </svg>
                    </button>
              
              <!-- Saisie directe de page -->
              <div class="ml-2 flex items-center space-x-1">
                <span class="text-sm text-gray-500 dark:text-gray-400">Aller à</span>
                <input 
                  type="number" 
                  v-model.number="goToPage" 
                  min="1" 
                  :max="totalPages"
                  class="form-input w-12 py-1 text-sm text-center"
                  @keyup.enter="handleGoToPage"
                />
                <button 
                  @click="handleGoToPage"
                  class="btn btn-secondary btn-sm py-1"
                >
                  OK
                    </button>
              </div>
          </div>
      </div>
    </div>

    <!-- Modal pour les formulaires -->
    <Teleport to="body">
      <Modal 
        v-if="activeForm"
        :title="getFormTitle"
        size="xl"
        @close="closeForm"
      >
        <div class="p-6">
          <div class="flex items-center mb-6">
            <component :is="getFormIcon" class="w-6 h-6 text-primary-500 mr-3" />
          <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ getFormTitle }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ getFormSubtitle }}</p>
          </div>
        </div>

      <component 
        :is="getFormComponent"
        :initial-data="editingDocument"
        @submit="handleSubmit"
        @cancel="closeForm"
        @close="closeForm"
      />
        </div>
    </Modal>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { 
  FileText, Stethoscope, FileSpreadsheet, ClipboardList, BedDouble, 
  FileCheck, Activity, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  Printer, Download
} from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRoute } from 'vue-router'
const route = useRoute()
import { usePrescriptionStore } from '@/stores/prescriptionStore'
import { useConsultationStore } from '@/stores/consultationStore'
import { useDocumentsStore } from '@/stores/documentsStore'
import { useNotification } from '@/composables/useNotification'
import { useUserStore } from '@/stores/user'
import Modal from '@/components/Modal.vue'
import PrescriptionForm from '@/components/forms/PrescriptionForm.vue'
import ConsultationForm from '@/components/forms/ConsultationForm.vue'
import ExamenForm from '@/components/forms/ExamenForm.vue'
import RapportForm from '@/components/forms/RapportForm.vue'
import BilletSalleModal from '@/components/medical/BilletSalleModal.vue'
import CertificatModal from '@/components/medical/CertificatModal.vue'
import TraitementSchemaForm from '@/components/forms/TraitementSchemaForm.vue'
import { useOrdonnanceStore } from '@/stores/ordonnanceStore'
import { useCertificatStore } from '@/stores/certificatStore'
import { useBilletSalleStore } from '@/stores/billetSalleStore'
import { useSchemaTraitementStore } from '@/stores/schemaTraitementStore'
import { useRapportStore } from '@/stores/rapportStore'
import EvolutionForm from '@/components/forms/EvolutionForm.vue'
import { useEvolutionStore } from '@/stores/evolutionStore'
import { useExamenStore } from '@/stores/examenStore'
import axiosInstance from '@/services/axios'

const prescriptionStore = usePrescriptionStore()
const consultationStore = useConsultationStore()
const documentsStore = useDocumentsStore()
const { showNotification } = useNotification()
const ordonnanceStore = useOrdonnanceStore()
const certificatStore = useCertificatStore()
const billetSalleStore = useBilletSalleStore()
const schemaTraitementStore = useSchemaTraitementStore()
const rapportStore = useRapportStore()
const evolutionStore = useEvolutionStore()
const examenStore = useExamenStore()

const activeForm = ref(null)
const editingDocument = ref(null)

const currentType = ref('ordonnance')
const searchQuery = ref('')

const documentTypes = [
  { value: 'ordonnance', label: 'Ordonnances', icon: FileText, form: PrescriptionForm },
  { value: 'consultation', label: 'Consultations', icon: Stethoscope, form: ConsultationForm },
  { value: 'examen', label: 'Examens', icon: FileSpreadsheet, form: ExamenForm },
  { value: 'rapport', label: 'Rapports', icon: ClipboardList, form: RapportForm },
  { value: 'billet', label: 'Billets de salle', icon: BedDouble, form: BilletSalleModal },
  { value: 'certificat', label: 'Certificats', icon: FileCheck, form: CertificatModal },
  { value: 'traitement', label: 'Schémas de traitement', icon: ClipboardList, form: TraitementSchemaForm },
  { value: 'evolution', label: 'Évolutions médicales', icon: Activity, form: EvolutionForm }
]

// Données avec filtrage
const ordonnances = computed(() => {
  console.log('Current ordonnances in store:', ordonnanceStore.ordonnances)
  return ordonnanceStore.ordonnances
})
const consultations = computed(() => consultationStore.consultations)
const examens = computed(() => examenStore.examens)
const rapports = computed(() => rapportStore.rapports)
const certificats = computed(() => certificatStore.certificats)
const billetsSalle = computed(() => billetSalleStore.billets)
const schemesTraitement = computed(() => schemaTraitementStore.schemas)
const evolutions = computed(() => evolutionStore.evolutions)
const isLoading = ref(false)

// Formulaire actif
const currentForm = computed(() => {
  return documentTypes.find(t => t.value === currentType.value)?.form || null
})

// Titre du modal
const modalTitle = computed(() => {
  const action = editingDocument.value ? 'Modifier' : 'Nouveau'
  const type = documentTypes.find(t => t.value === currentType.value)?.label.toLowerCase() || ''
  return `${action} ${type.slice(0, -1)}`
})

const showForm = (type) => {
  currentType.value = type
  activeForm.value = type
  editingDocument.value = null
}

function editDocument(type, document) {
  currentType.value = type
  editingDocument.value = document
}

async function generatePDF(documentId) {
  try {
    let pdfUrl;
    let source = 'server';
    let message = 'PDF généré avec succès';
    
    console.log(`Demande de génération PDF pour document de type ${currentType.value}, ID: ${documentId}`);
    
    // Utiliser le store approprié en fonction du type de document
    switch (currentType.value) {
      case 'ordonnance':
        const ordonnanceResult = await ordonnanceStore.generatePDF(documentId);
        pdfUrl = ordonnanceResult?.url;
        source = ordonnanceResult?.source || 'server';
        message = ordonnanceResult?.message || message;
        break;
      case 'certificat':
        const certificatResult = await certificatStore.generatePDF(documentId);
        pdfUrl = certificatResult?.url;
        source = certificatResult?.source || 'server';
        message = certificatResult?.message || message;
        break;
      case 'rapport':
        console.log(`→ Appel à rapportStore.generatePDF avec ID: ${documentId}`);
        const rapportResult = await rapportStore.generatePDF(documentId);
        console.log(`→ Résultat: `, rapportResult);
        pdfUrl = rapportResult?.url;
        source = rapportResult?.source || 'server';
        message = rapportResult?.message || message;
        break;
      case 'billet':
        const billetResult = await billetSalleStore.generatePDF(documentId);
        pdfUrl = billetResult?.url;
        source = billetResult?.source || 'server';
        message = billetResult?.message || message;
        break;
      case 'examen':
        const examenResult = await examenStore.generatePDF(documentId);
        pdfUrl = examenResult?.url;
        source = examenResult?.source || 'server';
        message = examenResult?.message || message;
        break;
      case 'traitement':
        // Pour les schémas de traitement, on récupère d'abord les données complètes
        const schema = schemaTraitementStore.schemas.find(s => (s._id === documentId || s.id === documentId));
        if (!schema) {
          throw new Error('Schéma de traitement non trouvé');
        }
        
        try {
          // Essayer d'abord d'utiliser la fonction du store si elle existe
          const schemaResult = await schemaTraitementStore.generatePDF(documentId);
          pdfUrl = schemaResult?.url;
          source = schemaResult?.source || 'server';
          message = schemaResult?.message || message;
        } catch (storeError) {
          console.log('Génération via le store non disponible, utilisation de la génération locale', storeError);
          
          // Utiliser la fonction de génération de PDF locale
          const { generateSchemaPDF } = await import('@/utils/pdfGenerator');
          const pdfBlob = await generateSchemaPDF(schema, false);
          
          // Créer une URL temporaire pour ouvrir le PDF
          pdfUrl = URL.createObjectURL(pdfBlob);
          source = 'local';
          message = 'PDF généré localement';
        }
        break;
      case 'evolution':
        // Pour les évolutions médicales, on récupère d'abord les données complètes
        const evolution = evolutionStore.evolutions.find(e => (e._id === documentId || e.id === documentId));
        if (!evolution) {
          throw new Error('Évolution médicale non trouvée');
        }
        
        let evolutionPdfUrl = null;
        let evolutionSource = 'server';
        let evolutionMessage = 'PDF généré avec succès';
        
        try {
          // Essayer d'abord d'utiliser la fonction du store si elle existe
          const evolutionResult = await evolutionStore.generatePDF(documentId);
          evolutionPdfUrl = evolutionResult?.url;
          evolutionSource = evolutionResult?.source || 'server';
          evolutionMessage = evolutionResult?.message || message;
        } catch (storeError) {
          console.log('Génération via le store non disponible, utilisation de la génération locale', storeError);
          
          try {
            // Vérifier si la fonction existe dans pdfGenerator
            const { generateEvolutionPDF } = await import('@/utils/pdfGenerator');
            const pdfBlob = await generateEvolutionPDF(evolution, false);
            
            // Créer une URL temporaire pour ouvrir le PDF
            evolutionPdfUrl = URL.createObjectURL(pdfBlob);
            evolutionSource = 'local';
            evolutionMessage = 'PDF généré localement';
          } catch (importError) {
            console.error('La fonction de génération locale de PDF pour les évolutions n\'existe pas:', importError);
            throw new Error('La génération de PDF pour les évolutions médicales n\'est pas encore implémentée');
          }
        }
        
        // Assigner les valeurs à nos variables principales
        pdfUrl = evolutionPdfUrl;
        source = evolutionSource;
        message = evolutionMessage;
        break;
      case 'consultation':
        // Pour les consultations, on doit d'abord récupérer les données complètes
        const consultation = consultationStore.consultations.find(c => (c._id === documentId || c.id === documentId));
        if (!consultation) {
          throw new Error('Consultation non trouvée');
        }
        
        // Utiliser la fonction de génération de PDF pour les consultations
        const { generateConsultationPDF } = await import('@/utils/pdfGenerator');
        const pdfBlob = await generateConsultationPDF(consultation, false);
        
        // Créer une URL temporaire pour ouvrir le PDF
        pdfUrl = URL.createObjectURL(pdfBlob);
        source = 'local';
        message = 'PDF généré localement';
        break;
      default:
        throw new Error(`La génération de PDF n'est pas disponible pour ce type de document: ${currentType.value}`);
    }
    
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      
      // Notification de succès avec indication de la source
      showNotification({
        type: 'success',
        message: `${message} ${source === 'local' ? '(version locale)' : ''}`
      });
    } else {
      throw new Error('URL du PDF non disponible');
    }
  } catch (error) {
    console.error("Erreur complète lors de la génération du PDF:", error);
    showNotification({
      type: 'error',
      message: `Erreur lors de la génération du PDF: ${error.message || 'Erreur inconnue'}`
    });
  }
}

async function downloadPDF(documentId) {
  try {
    let pdfUrl;
    let fileName;
    
    // Utiliser le store approprié en fonction du type de document
    switch (currentType.value) {
      case 'ordonnance':
        const ordonnanceResult = await ordonnanceStore.generatePDF(documentId);
        pdfUrl = ordonnanceResult?.url;
        fileName = `ordonnance-${documentId}.pdf`;
        break;
      case 'certificat':
        const certificatResult = await certificatStore.generatePDF(documentId);
        pdfUrl = certificatResult?.url;
        fileName = `certificat-${documentId}.pdf`;
        break;
      case 'rapport':
        const rapportResult = await rapportStore.generatePDF(documentId);
        pdfUrl = rapportResult?.url;
        fileName = `rapport-${documentId}.pdf`;
        break;
      case 'billet':
        const billetResult = await billetSalleStore.generatePDF(documentId);
        pdfUrl = billetResult?.url;
        fileName = `billet-salle-${documentId}.pdf`;
        break;
      case 'examen':
        const examenResult = await examenStore.generatePDF(documentId);
        pdfUrl = examenResult?.url;
        fileName = `examen-${documentId}.pdf`;
        break;
      case 'traitement':
        // Pour les schémas de traitement, on récupère d'abord les données complètes
        const schema = schemaTraitementStore.schemas.find(s => (s._id === documentId || s.id === documentId));
        if (!schema) {
          throw new Error('Schéma de traitement non trouvé');
        }
        
        try {
          // Essayer d'abord d'utiliser la fonction du store si elle existe
          const schemaResult = await schemaTraitementStore.generatePDF(documentId);
          pdfUrl = schemaResult?.url;
          fileName = `schema-traitement-${documentId}.pdf`;
        } catch (storeError) {
          console.log('Téléchargement via le store non disponible, utilisation de la génération locale', storeError);
          
          // Utiliser la fonction de génération de PDF locale
          const { generateSchemaPDF } = await import('@/utils/pdfGenerator');
          const pdfBlob = await generateSchemaPDF(schema, false);
          
          // Créer une URL temporaire pour le téléchargement
          pdfUrl = URL.createObjectURL(pdfBlob);
          fileName = `schema-traitement-${documentId}.pdf`;
        }
        break;
      case 'evolution':
        // Pour les évolutions médicales, on récupère d'abord les données complètes
        const evolution = evolutionStore.evolutions.find(e => (e._id === documentId || e.id === documentId));
        if (!evolution) {
          throw new Error('Évolution médicale non trouvée');
        }
        
        let evolutionPdfUrl = null;
        let evolutionFileName = `evolution-medicale-${documentId}.pdf`;
        
        try {
          // Essayer d'abord d'utiliser la fonction du store si elle existe
          const evolutionResult = await evolutionStore.generatePDF(documentId);
          evolutionPdfUrl = evolutionResult?.url;
        } catch (storeError) {
          console.log('Téléchargement via le store non disponible, utilisation de la génération locale', storeError);
          
          try {
            // Vérifier si la fonction existe dans pdfGenerator
            const { generateEvolutionPDF } = await import('@/utils/pdfGenerator');
            const pdfBlob = await generateEvolutionPDF(evolution, false);
            
            // Créer une URL temporaire pour le téléchargement
            evolutionPdfUrl = URL.createObjectURL(pdfBlob);
          } catch (importError) {
            console.error('La fonction de génération locale de PDF pour les évolutions n\'existe pas:', importError);
            throw new Error('La génération de PDF pour les évolutions médicales n\'est pas encore implémentée');
          }
        }
        
        // Assigner les valeurs à nos variables principales
        pdfUrl = evolutionPdfUrl;
        fileName = evolutionFileName;
        break;
      case 'consultation':
        // Pour les consultations, on doit d'abord récupérer les données complètes
        const consultation = consultationStore.consultations.find(c => (c._id === documentId || c.id === documentId));
        if (!consultation) {
          throw new Error('Consultation non trouvée');
        }
        
        // Utiliser la fonction de génération de PDF pour les consultations
        const { generateConsultationPDF } = await import('@/utils/pdfGenerator');
        const pdfBlob = await generateConsultationPDF(consultation, false);
        
        // Créer une URL temporaire pour le téléchargement
        pdfUrl = URL.createObjectURL(pdfBlob);
        fileName = `consultation-${documentId}.pdf`;
        break;
      default:
        throw new Error(`Le téléchargement de PDF n'est pas disponible pour ce type de document: ${currentType.value}`);
    }
    
    if (pdfUrl) {
      // Créer un lien temporaire pour télécharger le PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Notification de succès
      showNotification({
        type: 'success',
        message: `Téléchargement du fichier ${fileName} réussi`
      });
    } else {
      throw new Error('URL du PDF non disponible');
    }
  } catch (error) {
    showNotification({
      type: 'error',
      message: `Erreur lors du téléchargement du PDF: ${error.message || 'Erreur inconnue'}`
    });
    console.error('PDF download error:', error);
  }
}

// Fonction utilitaire pour formater les dates de manière sécurisée
function formatDateSafely(dateValue) {
  if (!dateValue) return null
  try {
    const date = new Date(dateValue)
    // Vérifier si la date est valide
    if (date instanceof Date && !isNaN(date.getTime())) {
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

// Fonction pour récupérer les examens sans ID de dossier
async function fetchExamensWithoutDossierId() {
  try {
    // Créer une fonction personnalisée pour récupérer tous les examens
    // Puisque examenStore.fetchExamensByDossier nécessite un ID de dossier
    
    // Essayer de récupérer les dossiers médicaux
    console.log('Tentative de récupération des dossiers médicaux');
    const dossiersResponse = await axiosInstance.get('/dossiers-medicaux/patients');
    
    let examensData = [];
    
    // Si nous avons des dossiers, récupérer les examens pour chaque dossier
    if (dossiersResponse.data && Array.isArray(dossiersResponse.data) && dossiersResponse.data.length > 0) {
      console.log(`${dossiersResponse.data.length} dossiers médicaux trouvés`);
      
      // Récupérer les examens pour le premier dossier
      const firstDossierId = dossiersResponse.data[0]._id;
      console.log(`Utilisation du premier dossier: ${firstDossierId}`);
      
      try {
        const response = await axiosInstance.get(`/examens/dossier/${firstDossierId}`);
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            examensData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            examensData = response.data.data;
          } else if (response.data.examens && Array.isArray(response.data.examens)) {
            examensData = response.data.examens;
          }
        }
        
        console.log(`${examensData.length} examens récupérés pour le dossier ${firstDossierId}`);
      } catch (error) {
        console.error(`Erreur lors de la récupération des examens pour le dossier ${firstDossierId}:`, error);
      }
    } else {
      console.log('Aucun dossier médical trouvé');
    }
    
    // Transformer et stocker les données
    const formattedExamens = examensData.map(examen => examenStore.formatExamen(examen));
    
    // Mettre à jour le store
    examenStore.$patch({ examens: formattedExamens });
    
    return formattedExamens;
  } catch (error) {
    console.error('Erreur lors de la récupération des examens:', error);
    return [];
  }
}

// Update the onMounted function to fetch all documents
onMounted(async () => {
  try {
    console.log('Initialisation de la page Prescriptions...');
    
    // Initialiser les valeurs par défaut pour éviter les erreurs undefined
    ordonnanceStore.$patch({ ordonnances: [] });
    certificatStore.$patch({ certificats: [] });
    billetSalleStore.$patch({ billets: [] });
    schemaTraitementStore.$patch({ schemas: [] });
    consultationStore.$patch({ consultations: [] });
    examenStore.$patch({ examens: [] });
    rapportStore.$patch({ rapports: [] });
    evolutionStore.$patch({ evolutions: [] });
    
    console.log('Valeurs par défaut initialisées, chargement des données...');
    
    // Fonction utilitaire pour charger les données de manière sécurisée
    const loadSafely = async (loadFn, name) => {
      try {
        console.log(`Tentative de chargement des ${name}...`);
        const result = await loadFn();
        console.log(`✅ ${name} chargés avec succès (${Array.isArray(result) ? result.length : 0} éléments)`);
        return result;
      } catch (err) {
        console.error(`❌ Erreur lors du chargement des ${name}:`, err);
        // Afficher plus de détails sur l'erreur
        if (err.response) {
          console.error(`⚠️ Détails de l'erreur pour ${name}:`, {
            status: err.response.status,
            statusText: err.response.statusText,
            url: err.response.config?.url,
            method: err.response.config?.method,
            baseURL: err.response.config?.baseURL,
            data: err.response.data
          });
          
          if (err.response.status === 404) {
            console.warn(`L'endpoint pour les ${name} n'est pas disponible (404) : ${err.response.config?.url}`);
            
            // Afficher une notification discrète pour informer l'utilisateur
            showNotification({
              type: 'warning',
              message: `Les ${name} n'ont pas pu être chargés. L'endpoint n'est pas disponible.`,
              duration: 5000 // 5 secondes
            });
          } else if (err.response.status === 403) {
            showNotification({
              type: 'warning',
              message: `Vous n'avez pas les permissions pour accéder aux ${name}.`,
              duration: 5000
            });
          } else {
            showNotification({
              type: 'error',
              message: `Erreur lors du chargement des ${name}: ${err.response.status} ${err.response.statusText}`,
              duration: 3000
            });
          }
        } else {
          // Erreur sans réponse du serveur (problème réseau, etc.)
          showNotification({
            type: 'error',
            message: `Erreur lors du chargement des ${name}: ${err.message}`,
            duration: 3000
          });
        }
        
        return []; // Retourner un tableau vide en cas d'erreur
      }
    };
    
    // Charger les données en parallèle avec gestion d'erreur
    await Promise.all([
      loadSafely(() => ordonnanceStore.fetchOrdonnances(), 'ordonnances'),
      loadSafely(() => certificatStore.fetchCertificats(), 'certificats'),
      loadSafely(() => billetSalleStore.fetchBillets(), 'billets de salle'),
      loadSafely(() => schemaTraitementStore.fetchSchemas(), 'schémas de traitement'),
      loadSafely(async () => {
        console.log('Début du chargement des consultations...');
        try {
          const dossiersResponse = await axiosInstance.get('/dossiers-medicaux/patients');
          const userStore = useUserStore();
          const medecinId = userStore.user?.medecin?._id || localStorage.getItem('role_id');

          if (dossiersResponse.data && Array.isArray(dossiersResponse.data) && dossiersResponse.data.length > 0) {
            const firstDossierId = dossiersResponse.data[0]._id;
            console.log(`Utilisation du premier dossier: ${firstDossierId} pour les consultations`);
            
            const result = await consultationStore.fetchConsultations(firstDossierId, medecinId);
            console.log(`Consultations chargées avec succès, ${result.length} consultations trouvées`);
            return result;
          }
          console.warn('Aucun dossier médical trouvé, tentative de récupération sans ID de dossier');
          const result = await consultationStore.fetchConsultations(null, medecinId);
        } catch (err) {
          console.error('Erreur lors du chargement des consultations:', err);
          try {
            console.log('Tentative alternative de chargement des consultations...');
            
            const dossiersResponse = await axiosInstance.get('/dossiers-medicaux/patients');
            if (dossiersResponse.data && Array.isArray(dossiersResponse.data) && dossiersResponse.data.length > 0) {
              const firstDossierId = dossiersResponse.data[0]._id;
              console.log(`Utilisation du premier dossier: ${firstDossierId} pour les consultations`);
              
              const result = await consultationStore.fetchConsultations(firstDossierId, medecinId);
              console.log(`Consultations alternatives chargées avec succès, ${result.length} consultations trouvées`);
              return result;
            }
            return [];
          } catch (secondError) {
            console.error('Toutes les tentatives de chargement des consultations ont échoué:', secondError);
            throw err;
          }
        }
      }, 'consultations'),
      loadSafely(() => fetchExamensWithoutDossierId(), 'examens'),
      loadSafely(() => rapportStore.fetchRapports(), 'rapports'),
      loadSafely(async () => {
  console.log('Début du chargement des évolutions médicales…');

  // Récupérer le medecinId
  const userStore = useUserStore();
  const medecinId = userStore.user?.medecin?._id
    || localStorage.getItem('role_id');

  try {
    // Récupérer d'abord les dossiers médicaux pour avoir un ID
    const dossiersResponse = await axiosInstance.get('/dossiers-medicaux/patients');

    if (Array.isArray(dossiersResponse.data) && dossiersResponse.data.length > 0) {
      const firstDossierId = dossiersResponse.data[0]._id;
      console.log(`Utilisation du premier dossier: ${firstDossierId} pour les évolutions`);

      // Charger toutes les évolutions pour ce dossier
      const result = await evolutionStore.fetchEvolutions(firstDossierId);
      console.log(`Évolutions médicales chargées: ${result.length} total`);

      // Filtrer pour ne garder que celles du médecin courant
      const filtrées = result.filter(evo => evo.medecin?.id === medecinId);
      console.log(`${filtrées.length} évolution(s) après filtrage par medecin_id (${medecinId})`);

      return filtrées;
    }

    console.warn('Aucun dossier médical trouvé, impossible de récupérer les évolutions');
    return [];
  } catch (err) {
    console.error('Erreur lors du chargement des évolutions médicales:', err);
    throw err;
  }
}, 'évolutions médicales')
    ]);
    
    // Vérifier que les données ont été correctement chargées
    console.log('État des stores après chargement:');
    console.log('- Ordonnances:', ordonnances.value?.length || 0);
    console.log('- Certificats:', certificats.value?.length || 0);
    console.log('- Billets de salle:', billetsSalle.value?.length || 0);
    console.log('- Schémas de traitement:', schemesTraitement.value?.length || 0);
    console.log('- Consultations:', consultations.value?.length || 0);
    console.log('- Examens:', examens.value?.length || 0);
    console.log('- Rapports:', rapports.value?.length || 0);
    console.log('- Évolutions:', evolutions.value?.length || 0);
    
    console.log('Données initiales chargées avec succès');
  } catch (error) {
    console.error('Erreur lors du chargement des données initiales:', error);
    showNotification({
      type: 'error',
      message: 'Erreur lors du chargement des documents'
    });
  } finally {
    // S'assurer que la page n'est plus en état de chargement
    isLoading.value = false;
  }
})

// Update the handleSubmit function to handle schema traitement creation/update
async function handleSubmit(data) {
  try {
    console.log(`Soumission du formulaire ${activeForm.value}:`, data);
    
    // Vérification générale des données
    if (!data) {
      throw new Error('Aucune donnée fournie');
    }
    
    // Vérifier si nous avons un dossier_id pour les types qui en ont besoin
    if (['evolution', 'examen', 'rapport'].includes(activeForm.value) && !data.dossier_id) {
      console.error(`Erreur: dossier_id manquant pour ${activeForm.value}`);
      showNotification({
        type: 'error',
        message: `Impossible de créer ${activeForm.value}: ID du dossier médical manquant`
      });
      return;
    }
    
    // Cas spécial pour les schémas de traitement: nécessite soit dossier_id, soit patient_id
    if (activeForm.value === 'traitement' && !data.dossier_id && !data.patient_id) {
      console.error(`Erreur: ni dossier_id ni patient_id fourni pour ${activeForm.value}`);
      showNotification({
        type: 'error',
        message: `Impossible de créer le schéma de traitement: ID du dossier médical ou du patient manquant`
      });
      return;
    }
    
    // Vérifier si nous avons un patient_id pour les types qui en ont besoin
    if (['ordonnance', 'consultation', 'billet', 'certificat'].includes(activeForm.value) && !data.patient_id) {
      console.error(`Erreur: patient_id manquant pour ${activeForm.value}`);
      showNotification({
        type: 'error',
        message: `Impossible de créer ${activeForm.value}: ID du patient manquant`
      });
      return;
    }
    
    let response;
    
    // Vérifier si c'est une édition basée sur l'ID dans les données (pour les consultations)
    // ou sur editingDocument (pour les autres types)
    const isEditing = activeForm.value === 'consultation' 
      ? !!data._id 
      : !!editingDocument.value;
      
    const documentId = activeForm.value === 'consultation' 
      ? data._id 
      : (editingDocument.value?._id || editingDocument.value?.id || editingDocument.value?.ID_examen);
    
    if (isEditing) {
      // Vérifier que nous avons un ID valide pour la mise à jour
      if (!documentId) {
        throw new Error('ID du document manquant pour la mise à jour');
      }
      
      // Logique de mise à jour
      switch (activeForm.value) {
        case 'ordonnance':
          response = await ordonnanceStore.updateOrdonnance(documentId, data);
          break;
        case 'consultation':
          console.log('Mise à jour de la consultation avec ID:', documentId);
          response = await consultationStore.updateConsultation(documentId, {
            motifConsultation: data.motifConsultation,
            observations: data.observations,
            diagnostic: data.diagnostic
          });
          break;
        case 'examen':
          response = await consultationStore.updateExamen(documentId, data);
          break;
        case 'rapport':
          response = await rapportStore.updateRapport(documentId, data);
          break;
        case 'billet':
          response = await billetSalleStore.updateBillet(documentId, data);
          break;
        case 'certificat':
          response = await certificatStore.updateCertificat(documentId, data);
          break;
        case 'traitement':
          response = await schemaTraitementStore.updateSchema(documentId, data);
          break;
        case 'evolution':
          console.log("Mise à jour de l'évolution avec ID:", documentId);
          response = await evolutionStore.updateEvolution(documentId, data);
          break;
        default:
          throw new Error(`Type de document non pris en charge: ${activeForm.value}`);
      }
      
      showNotification({
        type: 'success',
        message: `${getFormTitle.value} mis à jour avec succès`
      });
    } else {
      // Logique de création
      switch (activeForm.value) {
        case 'ordonnance':
          response = await ordonnanceStore.createOrdonnance(data);
          break;
        case 'consultation':
          console.log("Création d'une nouvelle consultation avec les données:", data);
          response = await consultationStore.createConsultation(data);
          break;
        case 'examen':
          response = await consultationStore.createExamen(data);
          break;
        case 'rapport':
          response = await rapportStore.createRapport(data);
          break;
        case 'billet':
          response = await billetSalleStore.createBillet({
            patient_id: data.patient_id,
            motif: data.motif,
            details: data.details || [],
            dateFin: data.dateFin,
            typeDemande: data.typeDemande,
            niveauUrgence: data.niveauUrgence,
            instructions: data.instructions
          });
          break;
        case 'certificat':
          response = await certificatStore.createCertificat(data);
          break;
        case 'traitement':
          console.log('Création d\'un nouveau schéma de traitement avec les données:', data);
          console.log('Vérification des données requises:', {
            dossier_id: !!data.dossier_id,
            patient_id: !!data.patient_id,
            titre: !!data.titre,
            date_debut: !!data.date_debut,
            date_fin: !!data.date_fin,
            medications: data.medications?.length > 0
          });
          
          // Vérifier qu'au moins un identifiant est présent (dossier_id ou patient_id)
          if (!data.dossier_id && !data.patient_id) {
            throw new Error('Aucun identifiant fourni (dossier_id ou patient_id)');
          }
          
          if (!data.titre) {
            throw new Error('Titre du schéma de traitement manquant');
          }
          
          if (!data.medications || data.medications.length === 0) {
            throw new Error('Aucun médicament spécifié dans le schéma de traitement');
          }
          
          try {
            response = await schemaTraitementStore.createSchema(data);
            console.log('Réponse de la création du schéma:', response);
          } catch (schemaError) {
            console.error('Erreur détaillée lors de la création du schéma:', schemaError);
            throw schemaError;
          }
          break;
        case 'evolution':
          console.log('Création d\'une nouvelle évolution avec dossier_id:', data.dossier_id);
          
          if (!data.nomMesure) {
            throw new Error('Nom de la mesure manquant');
          }
          
          if (data.valeurDeMesure === undefined || data.valeurDeMesure === null) {
            throw new Error('Valeur de la mesure manquante');
          }
          
          response = await evolutionStore.createEvolution(data);
          break;
        default:
          throw new Error(`Type de document non pris en charge: ${activeForm.value}`);
      }
      
      showNotification({
        type: 'success',
        message: `${getFormTitle.value} créé avec succès`
      });
    }
    
    closeForm();
  } catch (error) {
    console.error('Erreur lors de la soumission du formulaire:', error);
    showNotification({
      type: 'error',
      message: error.toString()
    });
  }
}

// Update the deleteDocument function to handle rapport deletion
async function deleteDocument(type, id) {
  try {
    // Confirmation standard pour tous les types de documents
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    console.log(`Tentative de suppression du document de type ${type} avec ID: ${id}`);
    
    let response;
    
    try {
      switch (type) {
        case 'ordonnance':
          response = await ordonnanceStore.deleteOrdonnance(id)
          break
        case 'consultation':
          response = await consultationStore.deleteConsultation(id)
          break
        case 'examen':
          response = await examenStore.deleteExamen(id)
          break
        case 'rapport':
          response = await rapportStore.deleteRapport(id)
          break
        case 'billet':
          response = await billetSalleStore.deleteBillet(id)
          break
        case 'certificat':
          response = await certificatStore.deleteCertificat(id)
          break
        case 'traitement':
          response = await schemaTraitementStore.deleteSchema(id)
          break
        case 'evolution':
          response = await evolutionStore.deleteEvolution(id)
          break
      }
      
      console.log("Réponse du serveur après suppression:", response);
      
      showNotification({
        type: 'success',
        message: 'Document supprimé avec succès'
      })
    } catch (error) {
      console.error(`Erreur lors de la suppression du document de type ${type}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
    
    // Extraire un message d'erreur plus lisible
    let errorMessage = error.toString();
    
    // Si l'erreur contient un message spécifique, l'utiliser
    if (error.message) {
      errorMessage = error.message;
    }
    
    // Si l'erreur vient d'une réponse API
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    
    showNotification({
      type: 'error',
      message: errorMessage,
      duration: 7000
    });
  }
}

function closeForm() {
  console.log("Fermeture du formulaire et réinitialisation des données");
  activeForm.value = null;
  editingDocument.value = null;
  
  // Force le rafraîchissement des données après la fermeture du formulaire
  if (currentType.value === 'consultation') {
    console.log("Rechargement des consultations après fermeture du formulaire");
    consultationStore.fetchConsultations().catch(err => {
      console.error("Erreur lors du rechargement des consultations:", err);
    });
  }
}

function formatDate(dateString) {
  // Si la date est undefined, null ou vide
  if (!dateString) {
    return "Non définie"
  }
  
  try {
    // Essayer de créer un objet Date
    const date = new Date(dateString)
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Date invalide:', dateString)
      return 'Date invalide'
    }
    
    // Formater la date
    return format(date, 'dd MMM yyyy', { locale: fr })
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error, 'Date:', dateString)
    return 'Date invalide'
  }
}

// Fonction pour obtenir le nombre de documents par type
function getDocumentCount(type) {
  switch (type) {
    case 'ordonnance': return ordonnances.value?.length || 0
    case 'consultation': return consultations.value?.length || 0
    case 'examen': return examens.value?.length || 0
    case 'rapport': return rapports.value?.length || 0
    case 'billet': return billetsSalle.value?.length || 0
    case 'certificat': return certificats.value?.length || 0
    case 'traitement': return schemesTraitement.value?.length || 0
    case 'evolution': return evolutions.value?.length || 0
    default: return 0
  }
}

// Vérifier s'il y a des résultats à afficher
const hasResults = computed(() => {
  return filteredDocuments.value.length > 0
})

// Ajout des nouvelles fonctions pour gérer les formulaires
const getFormComponent = computed(() => {
  switch (activeForm.value) {
    case 'ordonnance': return PrescriptionForm
    case 'consultation': return ConsultationForm
    case 'examen': return ExamenForm
    case 'rapport': return RapportForm
    case 'billet': return BilletSalleModal
    case 'certificat': return CertificatModal
    case 'traitement': return TraitementSchemaForm
    case 'evolution': return EvolutionForm
    default: return null
  }
})

const getFormIcon = computed(() => {
  switch (activeForm.value) {
    case 'ordonnance': return FileText
    case 'consultation': return Stethoscope
    case 'examen': return FileSpreadsheet
    case 'rapport': return ClipboardList
    case 'billet': return BedDouble
    case 'certificat': return FileCheck
    case 'traitement': return ClipboardList
    case 'evolution': return Activity
    default: return null
  }
})

const getFormTitle = computed(() => {
  const titles = {
    ordonnance: 'Nouvelle Ordonnance',
    consultation: 'Nouvelle Consultation',
    examen: 'Nouvel Examen',
    rapport: 'Nouveau Rapport',
    billet: 'Nouveau Billet de salle',
    certificat: 'Nouveau Certificat médical',
    traitement: 'Nouveau Schéma de traitement',
    evolution: 'Nouvelle Évolution médicale'
  }
  return titles[activeForm.value] || ''
})

const getFormSubtitle = computed(() => {
  const subtitles = {
    ordonnance: 'Prescrire des médicaments et traitements',
    consultation: 'Enregistrer une consultation médicale',
    examen: 'Prescrire un examen médical',
    rapport: 'Rédiger un rapport médical',
    billet: 'Créer un billet de salle',
    certificat: 'Rédiger un certificat médical',
    traitement: 'Établir un schéma de traitement personnalisé',
    evolution: 'Enregistrer une mesure ou évolution médicale'
  }
  return subtitles[activeForm.value] || ''
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(9)
const goToPage = ref(1)

// Fonction pour gérer la navigation directe vers une page
function handleGoToPage() {
  // Vérifier que la page est valide
  if (goToPage.value < 1) {
    goToPage.value = 1
  } else if (goToPage.value > totalPages.value) {
    goToPage.value = totalPages.value
  }
  
  // Naviguer vers la page
  currentPage.value = goToPage.value
}

// Computed pour la pagination
const filteredDocuments = computed(() => {
  let documents = []
  
  // S'assurer que le type est valide
  if (!currentType.value) {
    console.warn('Type de document non défini, utilisation du type par défaut: ordonnance')
    currentType.value = 'ordonnance'
  }
  
  // Récupérer les documents en fonction du type
  switch (currentType.value) {
    case 'ordonnance': documents = ordonnances.value || []; break
    case 'consultation': documents = consultations.value || []; break
    case 'examen': documents = examens.value || []; break
    case 'rapport': documents = rapports.value || []; break
    case 'billet': documents = billetsSalle.value || []; break
    case 'certificat': documents = certificats.value || []; break
    case 'traitement': documents = schemesTraitement.value || []; break
    case 'evolution': documents = evolutions.value || []; break
    default:
      console.warn(`Type de document inconnu: ${currentType.value}, utilisation d'un tableau vide`)
      documents = []
  }
  
  // Vérifier que documents est bien un tableau
  if (!Array.isArray(documents)) {
    console.error(`Les documents pour le type ${currentType.value} ne sont pas un tableau:`, documents)
    documents = []
  }
  
  // Filtrer par recherche si nécessaire
  if (searchQuery.value) {
    try {
      const query = searchQuery.value.toLowerCase().trim()
      
      if (query.length > 0) {
        return documents.filter(doc => {
          // Vérifier que doc est un objet valide
          if (!doc || typeof doc !== 'object') {
            console.warn('Document invalide ignoré dans la recherche:', doc)
            return false
          }
          
          // Recherche générique dans les propriétés communes
          return (
            (doc.titre && typeof doc.titre === 'string' && doc.titre.toLowerCase().includes(query)) ||
            (doc.motif && typeof doc.motif === 'string' && doc.motif.toLowerCase().includes(query)) ||
            (doc.contenu && typeof doc.contenu === 'string' && doc.contenu.toLowerCase().includes(query)) ||
            (doc.nomMesure && typeof doc.nomMesure === 'string' && doc.nomMesure.toLowerCase().includes(query)) ||
            (doc.type && typeof doc.type === 'string' && doc.type.toLowerCase().includes(query)) ||
            (doc.motifConsultation && typeof doc.motifConsultation === 'string' && doc.motifConsultation.toLowerCase().includes(query)) ||
            (doc.diagnostic && typeof doc.diagnostic === 'string' && doc.diagnostic.toLowerCase().includes(query))
          )
        })
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de documents:', error)
    }
  }
  
  return documents
})

const totalItems = computed(() => filteredDocuments.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)))

// Réinitialiser la page courante quand on change de type de document
watch(currentType, () => {
  currentPage.value = 1
})

// Réinitialiser la page courante quand on change la recherche
watch(searchQuery, () => {
  currentPage.value = 1
})

const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage.value)

const paginatedDocuments = computed(() => {
  try {
    // Vérifier que filteredDocuments.value est un tableau
    if (!Array.isArray(filteredDocuments.value)) {
      console.error('filteredDocuments n\'est pas un tableau:', filteredDocuments.value)
      return []
    }
    
    // Vérifier que les indices sont valides
    const start = paginationStart.value
    const end = start + itemsPerPage.value
    
    if (start < 0 || end < start) {
      console.error('Indices de pagination invalides:', { start, end })
      return []
    }
    
    // Vérifier que nous n'essayons pas d'accéder à des éléments en dehors du tableau
    if (start >= filteredDocuments.value.length) {
      console.warn('Début de pagination hors limites, retour à la première page')
      currentPage.value = 1
      return filteredDocuments.value.slice(0, itemsPerPage.value)
    }
    
    return filteredDocuments.value.slice(start, end)
  } catch (error) {
    console.error('Erreur lors de la pagination des documents:', error)
    return []
  }
})

// Afficher un nombre limité de pages dans la pagination
const displayedPages = computed(() => {
  const maxPagesToShow = 5
  const pages = []
  
  if (totalPages.value <= maxPagesToShow) {
    // Afficher toutes les pages si leur nombre est inférieur à maxPagesToShow
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // Toujours afficher la première page
    pages.push(1)
    
    // Calculer les pages du milieu
    let startPage = Math.max(2, currentPage.value - 1)
    let endPage = Math.min(totalPages.value - 1, currentPage.value + 1)
    
    // Ajuster si on est proche du début ou de la fin
    if (currentPage.value <= 2) {
      endPage = 4
    } else if (currentPage.value >= totalPages.value - 1) {
      startPage = totalPages.value - 3
    }
    
    // Ajouter un ellipsis si nécessaire
    if (startPage > 2) {
      pages.push('...')
    }
    
    // Ajouter les pages du milieu
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    // Ajouter un ellipsis si nécessaire
    if (endPage < totalPages.value - 1) {
      pages.push('...')
    }
    
    // Toujours afficher la dernière page
    pages.push(totalPages.value)
  }
  
  return pages
})

// Fonction d'aide pour activer/désactiver temporairement la vérification d'auteur
// Cette fonction ne serait utilisée QUE pendant le débogage
function toggleAuthorCheck() {
  const currentValue = localStorage.getItem('bypass_author_check') === 'true';
  localStorage.setItem('bypass_author_check', (!currentValue).toString());
  showNotification({
    type: 'info',
    message: `Vérification d'auteur ${!currentValue ? 'désactivée' : 'activée'} (mode développement)`,
    duration: 3000
  });
}

// Pour désactiver temporairement depuis la console: 
// localStorage.setItem('bypass_author_check', 'true')
// Pour réactiver:
// localStorage.setItem('bypass_author_check', 'false')
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.btn {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg 
         focus:outline-none focus:ring-2 focus:ring-offset-2 
         disabled:opacity-50 dark:focus:ring-offset-gray-900;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 
         focus:ring-primary-500 dark:focus:ring-primary-400;
}

.btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 
         hover:bg-gray-50 focus:ring-primary-500
         dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
         dark:hover:bg-gray-600 dark:hover:text-white;
}

.form-section {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
         dark:border-gray-700 p-6 space-y-6;
}

.form-section-title {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-4;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-lg border-gray-300 dark:border-gray-700 
         shadow-sm focus:border-primary-500 focus:ring-primary-500 
         dark:bg-gray-800 dark:text-white sm:text-sm transition-colors
         dark:placeholder-gray-400;
}

.form-helper {
  @apply mt-1 text-sm text-gray-500 dark:text-gray-400;
}

.form-error {
  @apply mt-1 text-sm text-red-600 dark:text-red-400;
}

.step-transition-enter-active,
.step-transition-leave-active {
  transition: all 0.3s ease;
}

.step-transition-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.step-transition-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.btn-sm {
  @apply px-3 py-1.5 text-sm;
}

/* Styles pour la pagination */
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.btn-icon {
  @apply p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 
         transition-colors duration-200 text-gray-500 dark:text-gray-400
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
         dark:focus:ring-offset-gray-900;
}
</style>