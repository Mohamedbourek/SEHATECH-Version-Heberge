<template>
  <Modal 
    title="Modifier le dossier médical"
    @close="$emit('close')"
    :maxWidth="1200"
  >
    <div class="p-0 dark:bg-gray-800">
      <!-- Onglets de navigation -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <ul class="flex overflow-x-auto whitespace-nowrap py-2 px-4 mb-0 gap-4">
          <li 
            v-for="(tab, index) in tabs" 
            :key="index"
            class="transition-all duration-300"
          >
            <button 
              @click="activeTab = index" 
              :class="[
                'px-5 py-3 rounded-lg font-medium text-sm transition-all duration-300',
                activeTab === index 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              ]"
            >
              <span class="flex items-center gap-2">
                <component :is="tab.icon" class="w-5 h-5" />
                {{ tab.name }}
              </span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Contenu du formulaire -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Barre de progression -->
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
          <div 
            class="bg-primary-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
            :style="{ width: `${(activeTab + 1) * (100 / tabs.length)}%` }"
          ></div>
        </div>
        
        <!-- Onglet 1: Informations générales -->
        <div v-if="activeTab === 0" class="space-y-6 animate-fadeIn">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Informations générales</h3>
          </div>
          
      <!-- Dates -->
      <div class="dossier-section">
            <h4 class="dossier-header">Dates d'hospitalisation</h4>
        <div class="dossier-grid">
          <div class="form-group">
            <label class="form-label">Date d'entrée</label>
            <input
              type="date"
              v-model="form.dateEntree"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Date de sortie</label>
            <input
              type="date"
              v-model="form.dateSortie"
              class="form-input"
            />
          </div>
        </div>
      </div>

      <!-- Antécédents -->
      <div class="dossier-section">
        <h4 class="dossier-header">Antécédents</h4>
        <div class="space-y-4">
          <div v-for="(antecedent, index) in form.antecedents" :key="index" class="flex items-center space-x-2">
            <input
              type="text"
              v-model="form.antecedents[index]"
              class="form-input flex-1"
              placeholder="Antécédent"
            />
            <button
              type="button"
              @click="removeAntecedent(index)"
              class="text-red-500 hover:text-red-700"
            >
                  <Trash2 class="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            @click="addAntecedent"
                class="btn btn-secondary flex items-center gap-2"
          >
                <Plus class="w-4 h-4" /> Ajouter un antécédent
          </button>
        </div>
      </div>

      <!-- Traitement -->
      <div class="dossier-section">
        <h4 class="dossier-header">Traitement</h4>
        <textarea
          v-model="form.traitement"
          class="form-textarea"
          rows="4"
          placeholder="Détails du traitement"
        ></textarea>
      </div>

      <!-- Surveillance -->
      <div class="dossier-section">
        <h4 class="dossier-header">Surveillance</h4>
        <textarea
          v-model="form.surveillance"
          class="form-textarea"
          rows="4"
          placeholder="Notes de surveillance"
        ></textarea>
          </div>
      </div>

        <!-- Onglet 2: Évolutions -->
        <div v-if="activeTab === 1" class="space-y-6 animate-fadeIn">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Évolutions du patient</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Suivez l'évolution des indicateurs de santé du patient</p>
          </div>
          
        <div class="space-y-4">
            <div v-for="(evolution, index) in evolutions" :key="evolution._id" class="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-100 dark:border-gray-600 hover:shadow-lg transition-shadow duration-300">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">Nom de la mesure</label>
                <input
                  type="text"
                  v-model="evolution.nomMesure"
                  class="form-input"
                  @input="evolution.isModified = true"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Date de mesure</label>
                <input
                  type="datetime-local"
                  v-model="evolution.dateDeMesure"
                  class="form-input"
                  disabled
                />
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">Valeur de mesure</label>
                <input
                  type="number"
                  v-model="evolution.valeurDeMesure"
                  class="form-input"
                  step="0.01"
                  @input="evolution.isModified = true"
                />
              </div>
              <div class="form-group">
                <label class="form-label">État</label>
                <select v-model="evolution.etat" class="form-select" @change="evolution.isModified = true">
                  <option value="normal">Normal</option>
                  <option value="attention">Attention</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Commentaire</label>
              <textarea
                v-model="evolution.commentaire"
                class="form-textarea"
                rows="3"
                @input="evolution.isModified = true"
              ></textarea>
            </div>
            
            <div class="flex justify-end">
              <button
                type="button"
                @click="deleteEvolution(evolution._id)"
                  class="btn btn-danger flex items-center gap-2"
              >
                  <Trash2 class="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
          
          <button
            type="button"
            @click="showNewEvolutionForm = !showNewEvolutionForm"
              class="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
              <component :is="showNewEvolutionForm ? 'X' : 'Plus'" class="w-4 h-4" />
            {{ showNewEvolutionForm ? 'Annuler' : 'Ajouter une évolution' }}
          </button>
          
            <div v-if="showNewEvolutionForm" class="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-primary-100 dark:border-primary-900">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">Nom de la mesure</label>
                <input
                  type="text"
                  v-model="newEvolution.nomMesure"
                  class="form-input"
                  placeholder="Ex: Tension artérielle"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Valeur de mesure</label>
                <input
                  type="number"
                  v-model="newEvolution.valeurDeMesure"
                  class="form-input"
                  step="0.01"
                  placeholder="Ex: 120"
                />
              </div>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">État</label>
              <select v-model="newEvolution.etat" class="form-select">
                <option value="normal">Normal</option>
                <option value="attention">Attention</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Commentaire</label>
              <textarea
                v-model="newEvolution.commentaire"
                class="form-textarea"
                rows="3"
                placeholder="Commentaire sur cette mesure"
              ></textarea>
            </div>
            
            <div class="flex justify-end">
              <button
                type="button"
                @click="addEvolution"
                  class="btn btn-primary flex items-center gap-2"
              >
                  <Plus class="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

        <!-- Onglet 3: Consultations -->
        <div v-if="activeTab === 2" class="space-y-6 animate-fadeIn">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Consultations médicales</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Historique des consultations du patient</p>
      </div>

        <div class="space-y-4">
            <div v-for="(consultation, index) in consultations" :key="consultation._id" class="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-100 dark:border-gray-600 hover:shadow-lg transition-shadow duration-300">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">Motif de consultation</label>
                <input
                  type="text"
                  v-model="consultation.motifConsultation"
                  class="form-input"
                  @input="consultation.isModified = true"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Date de consultation</label>
                <input
                  type="datetime-local"
                  v-model="consultation.dateConsultation"
                  class="form-input"
                  disabled
                />
              </div>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Observations</label>
              <textarea
                v-model="consultation.observations"
                class="form-textarea"
                rows="3"
                @input="consultation.isModified = true"
              ></textarea>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Diagnostic</label>
              <textarea
                v-model="consultation.diagnostic"
                class="form-textarea"
                rows="3"
                @input="consultation.isModified = true"
              ></textarea>
            </div>
          </div>
            
            <div v-if="!consultations || consultations.length === 0" class="p-8 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <FileText class="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p class="text-gray-500 dark:text-gray-400">Aucune consultation enregistrée</p>
            </div>
        </div>
      </div>

        <!-- Onglet 4: Examens -->
        <div v-if="activeTab === 3" class="space-y-6 animate-fadeIn">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Examens médicaux</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Résultats d'examens et analyses médicales</p>
          </div>
          
        <div class="space-y-4">
            <div v-for="(examen, index) in examens" :key="examen._id" class="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-100 dark:border-gray-600 hover:shadow-lg transition-shadow duration-300">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">Type d'examen</label>
                <select v-model="examen.type" class="form-select" @change="examen.isModified = true">
                  <option value="biologie">Analyse biologique</option>
                  <option value="imagerie">Imagerie médicale</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" v-model="examen.date" class="form-input" @change="examen.isModified = true" />
              </div>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Résultat</label>
              <textarea v-model="examen.resultat" class="form-textarea" rows="3" @input="examen.isModified = true"></textarea>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Interprétation</label>
              <textarea v-model="examen.interpretation" class="form-textarea" rows="3" @input="examen.isModified = true"></textarea>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Statut</label>
              <select v-model="examen.statut" class="form-select" @change="examen.isModified = true">
                <option value="en_attente">En attente</option>
                <option value="effectue">Effectué</option>
                <option value="analyse">En cours d'analyse</option>
                <option value="valide">Validé</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Fichiers</label>
                <div class="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <input
                type="file"
                multiple
                @change="(e) => {
                  examen.newFichiers = Array.from(e.target.files)
                  examen.isModified = true
                }"
                class="form-input"
                accept=".pdf,.jpg,.png,.doc,.docx"
              />
            </div>
              </div>
            </div>
            
            <div v-if="!examens || examens.length === 0" class="p-8 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <FileSearch class="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p class="text-gray-500 dark:text-gray-400">Aucun examen enregistré</p>
          </div>
        </div>
      </div>

        <!-- Onglet 5: Rapports -->
        <div v-if="activeTab === 4" class="space-y-6 animate-fadeIn">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Rapports médicaux</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Rapports détaillés sur l'état du patient</p>
          </div>
          
        <div class="space-y-4">
            <div v-for="(rapport, index) in rapports" :key="rapport._id" class="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-100 dark:border-gray-600 hover:shadow-lg transition-shadow duration-300">
            <div class="form-group mb-4">
              <label class="form-label">Titre du rapport</label>
              <input type="text" v-model="rapport.titre" class="form-input" @input="rapport.isModified = true" placeholder="Titre du rapport (généré automatiquement si vide)" />
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">Type de rapport</label>
                <select v-model="rapport.type" class="form-select" @change="rapport.isModified = true">
                  <option value="consultation">Consultation</option>
                  <option value="hospitalisation">Hospitalisation</option>
                  <option value="chirurgie">Chirurgie</option>
                  <option value="suivi">Suivi</option>
                  <option value="evolution">Évolution</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" v-model="rapport.date" class="form-input" @change="rapport.isModified = true" />
              </div>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Contenu du rapport</label>
              <textarea v-model="rapport.contenu" class="form-textarea" rows="5" @input="rapport.isModified = true"></textarea>
            </div>
            
            <div class="flex justify-end space-x-2">
              <button
                type="button"
                @click="deleteRapport(rapport._id)"
                  class="btn btn-danger flex items-center gap-2"
              >
                  <Trash2 class="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
          
          <button
            type="button"
            @click="showNewRapportForm = !showNewRapportForm"
              class="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
              <component :is="showNewRapportForm ? 'X' : 'Plus'" class="w-4 h-4" />
            {{ showNewRapportForm ? 'Annuler' : 'Ajouter un rapport' }}
          </button>
          
            <div v-if="showNewRapportForm" class="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-primary-100 dark:border-primary-900">
            <div class="form-group mb-4">
              <label class="form-label">Titre du rapport</label>
              <input type="text" v-model="newRapport.titre" class="form-input" placeholder="Titre du rapport" />
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">Type de rapport</label>
                <select v-model="newRapport.type" class="form-select">
                  <option value="consultation">Consultation</option>
                  <option value="hospitalisation">Hospitalisation</option>
                  <option value="chirurgie">Chirurgie</option>
                  <option value="suivi">Suivi</option>
                  <option value="evolution">Évolution</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" v-model="newRapport.date" class="form-input" />
              </div>
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Contenu du rapport</label>
              <textarea v-model="newRapport.contenu" class="form-textarea" rows="5" placeholder="Contenu détaillé du rapport"></textarea>
            </div>
            
            <div class="flex justify-end">
              <button
                type="button"
                @click="addRapport"
                  class="btn btn-primary flex items-center gap-2"
              >
                  <Plus class="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

        <!-- Onglet 6: Documents -->
        <div v-if="activeTab === 5" class="space-y-6 animate-fadeIn">
          <div class="section-header">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Documents associés</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Joindre des documents au dossier médical</p>
          </div>
          
          <div class="space-y-6">
            <div class="p-6 bg-white dark:bg-gray-700 rounded-lg shadow border border-gray-100 dark:border-gray-600">
              <div class="flex items-center justify-between mb-6">
                <label class="form-label text-lg">Documents</label>
                <input
                  type="file"
                  multiple
                  @change="handleFileUpload"
                  class="hidden"
                  ref="fileInput"
                  accept=".pdf,.jpg,.png,.doc,.docx"
                />
        <button 
          type="button"
                  class="btn btn-primary flex items-center gap-2"
                  @click="$refs.fileInput.click()"
                >
                  <Upload class="w-4 h-4" /> Ajouter des documents
                </button>
              </div>
              
              <div v-if="form.documents.length > 0" class="space-y-2">
                <div
                  v-for="(file, index) in form.documents"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
                >
                  <div class="flex items-center gap-3">
                    <File class="w-6 h-6 text-primary-500" />
                    <span class="text-sm font-medium">{{ file.name }}</span>
                  </div>
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    @click="removeFile(index)"
                  >
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div v-else class="p-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                <FilePlus2 class="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p class="text-gray-500 dark:text-gray-400 mb-2">Aucun document ajouté</p>
                <p class="text-gray-400 dark:text-gray-500 text-sm">Cliquez sur "Ajouter des documents" pour joindre des fichiers</p>
              </div>
            </div>
            
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-3">
              <Info class="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-blue-800 dark:text-blue-300 text-sm">Les formats acceptés sont: PDF, JPG, PNG, DOC, DOCX</p>
                <p class="text-blue-600 dark:text-blue-400 text-xs mt-1">Taille maximale: 10 Mo par fichier</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Boutons de navigation et sauvegarde -->
        <div class="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button 
            v-if="activeTab > 0"
            type="button" 
            @click="activeTab--" 
            class="btn btn-outline flex items-center gap-2"
          >
            <ArrowLeft class="w-4 h-4" /> Précédent
          </button>
          <div v-else class="w-24"></div>
          
          <div class="flex gap-2">
            <button 
              type="button"
              class="btn btn-secondary"
              @click="$emit('close')"
            >
              Annuler
            </button>
            
            <!-- Bouton de sauvegarde partielle -->
            <button 
              type="button"
              @click="handlePartialSave"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <Save class="w-4 h-4 mr-1" />
              Enregistrer cette page
            </button>
            
            <button 
              v-if="activeTab < tabs.length - 1"
              type="button" 
              @click="activeTab++" 
              class="btn btn-outline-primary"
            >
              Suivant <ArrowRight class="w-4 h-4 ml-1" />
            </button>
            <button 
              v-else
              type="submit"
              class="btn btn-success"
              :disabled="isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
              Enregistrer tout
            </button>
          </div>
      </div>
    </form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Loader2, Trash2, Plus, FileText, File, Upload, Info, ArrowLeft, ArrowRight, FileSearch, FilePlus2, X, Save } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import { useDossierMedicalStore } from '@/stores/dossierMedical'
import { useExamenStore } from '@/stores/examenStore'
import { useConsultationStore } from '@/stores/consultationStore'
import { useRapportStore } from '@/stores/rapportStore'
import { useEvolutionStore } from '@/stores/evolutionStore'
import { useToast } from '@/composables/useToast'
import '@/components/forms/FormStyles.vue'

const props = defineProps({
  dossier: {
    type: Object,
    required: true
  }
})

// Debug - Afficher les props pour voir la structure du dossier
console.log('Props du composant DossierEditForm:', props)
console.log('Structure du dossier:', props.dossier)
console.log('ID du dossier?', props.dossier?._id, props.dossier?.id)

const emit = defineEmits(['close', 'update'])
const toast = useToast()

// Système d'onglets
const activeTab = ref(0)
const tabs = [
  { name: 'Informations générales', icon: 'File' },
  { name: 'Évolutions', icon: 'Activity' },
  { name: 'Consultations', icon: 'ClipboardList' },
  { name: 'Examens', icon: 'FileSearch' },
  { name: 'Rapports', icon: 'FileText' },
  { name: 'Documents', icon: 'FolderPlus' }
]

// Stores
const dossierMedicalStore = useDossierMedicalStore()
const examenStore = useExamenStore()
const rapportStore = useRapportStore()
const evolutionStore = useEvolutionStore()
const consultationStore = useConsultationStore()

// États
const isSubmitting = ref(false)
const showNewEvolutionForm = ref(false)
const showNewRapportForm = ref(false)
const form = ref({
  dateEntree: '',
  dateSortie: '',
  antecedents: [],
  traitement: '',
  surveillance: '',
  documents: [],
  is_archived: false
})

// Suivi des champs modifiés
const modifiedFields = ref({
  basic: false,
  evolutions: {},
  examens: {},
  rapports: {},
  consultations: {}
})

// État pour les entités associées
const evolutions = ref([])
const rapports = ref([])
const examens = ref([])
const consultations = ref([])

// Nouveaux éléments
const newEvolution = ref({
  nomMesure: '',
  valeurDeMesure: 0,
  etat: 'normal',
  commentaire: ''
})

const newRapport = ref({
  titre: '',
  type: 'consultation',
  date: '',
  contenu: ''
})

// Initialiser le formulaire avec les données du dossier
onMounted(async () => {
  if (props.dossier) {
    console.log('Initialisation du formulaire avec le dossier:', props.dossier)
    
    // Déterminer l'ID du dossier
    let dossierId = null
    if (props.dossier._id) {
      dossierId = props.dossier._id
      console.log("ID trouvé dans _id:", dossierId)
    } else if (props.dossier.id) {
      dossierId = props.dossier.id
      console.log("ID trouvé dans id:", dossierId)
    } else {
      // Parcourir toutes les propriétés à la recherche d'un ID
      for (const [key, value] of Object.entries(props.dossier)) {
        if ((key.includes('id') || key.includes('_id')) && value) {
          dossierId = value
          console.log(`ID trouvé dans ${key}:`, dossierId)
          break
        }
      }
    }
    
    if (!dossierId) {
      console.error("ERREUR: Impossible de déterminer l'ID du dossier médical")
      toast.error("Erreur: ID du dossier médical non trouvé")
      return
    }
    
    form.value = {
      dateEntree: props.dossier.dateEntree ? new Date(props.dossier.dateEntree).toISOString().split('T')[0] : '',
      dateSortie: props.dossier.dateSortie ? new Date(props.dossier.dateSortie).toISOString().split('T')[0] : '',
      antecedents: Array.isArray(props.dossier.antecedents) ? [...props.dossier.antecedents] : [],
      traitement: props.dossier.traitement || '',
      surveillance: props.dossier.surveillance || '',
      documents: Array.isArray(props.dossier.documents) ? [...props.dossier.documents] : [],
      is_archived: Boolean(props.dossier.is_archived) || false,
      // Stocker l'ID pour une utilisation ultérieure
      dossier_id: dossierId
    }
    
    // Charger toutes les évolutions directement depuis le store
    console.log('Chargement des évolutions pour le dossier:', dossierId)
    try {
      const fetchedEvolutions = await evolutionStore.fetchEvolutions(dossierId)
      console.log('Évolutions récupérées:', fetchedEvolutions?.length || 0, fetchedEvolutions)
      evolutions.value = fetchedEvolutions.map(ev => ({
        ...ev,
        isModified: false
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des évolutions:', error)
      toast.error("Erreur lors du chargement des évolutions")
    }
    
    // Charger tous les rapports directement depuis le store
    console.log('Chargement des rapports pour le dossier:', dossierId)
    try {
      const fetchedRapports = await rapportStore.fetchRapports(dossierId)
      console.log('Rapports récupérés:', fetchedRapports?.length || 0, fetchedRapports)
      rapports.value = fetchedRapports.map(rapport => ({
        ...rapport,
        isModified: false
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error)
      toast.error("Erreur lors du chargement des rapports")
    }
    
    // Charger tous les examens directement depuis le store
    console.log('Chargement des examens pour le dossier:', dossierId)
    try {
      const fetchedExamens = await examenStore.fetchExamensByDossier(dossierId)
      console.log('Examens récupérés:', fetchedExamens?.length || 0, fetchedExamens)
      examens.value = fetchedExamens.map(examen => ({
        ...examen,
        isModified: false
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des examens:', error)
      toast.error("Erreur lors du chargement des examens")
    }
    
    // Charger toutes les consultations directement depuis le store
    console.log('Chargement des consultations pour le dossier:', dossierId)
    try {
      const fetchedConsultations = await consultationStore.fetchConsultations(dossierId)
      console.log('Consultations récupérées:', fetchedConsultations?.length || 0, fetchedConsultations)
      consultations.value = fetchedConsultations.map(consultation => ({
        ...consultation,
        isModified: false
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error)
      toast.error("Erreur lors du chargement des consultations")
    }
  }
})

// Surveiller les modifications des données de base
watch(form, () => {
  modifiedFields.value.basic = true
}, { deep: true })

// Formater une date pour l'API
const formatDate = (dateValue) => {
  console.log('formatDate - entrée:', dateValue, 'type:', typeof dateValue);
  
  if (!dateValue) {
    console.log('formatDate - valeur vide, retourne chaîne vide');
    return '';
  }
  
  try {
    // Si c'est déjà une date ISO, extraire la partie date
    if (typeof dateValue === 'string') {
      if (dateValue.includes('T')) {
        const formattedDate = dateValue.split('T')[0];
        console.log('formatDate - date ISO -> format YYYY-MM-DD:', formattedDate);
        return formattedDate;
      }
      
      // Vérifier si le format est déjà YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        console.log('formatDate - déjà au format YYYY-MM-DD:', dateValue);
        return dateValue;
      }
    }
    
    // Si c'est un objet Date
    if (dateValue instanceof Date) {
      const formattedDate = dateValue.toISOString().split('T')[0];
      console.log('formatDate - objet Date -> format YYYY-MM-DD:', formattedDate);
      return formattedDate;
    }
    
    // Tentative de conversion en Date puis format YYYY-MM-DD
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('formatDate - date invalide après conversion:', dateValue);
      return '';
    }
    
    const formattedDate = date.toISOString().split('T')[0];
    console.log('formatDate - converti en format YYYY-MM-DD:', formattedDate);
    return formattedDate;
  } catch (error) {
    console.error('Erreur de formatage de date:', error, 'valeur:', dateValue);
    return '';
  }
}

// Validation du formulaire
const validateForm = () => {
  const errors = []
  
  try {
    // Validation des dates
    const dateEntree = form.value.dateEntree ? new Date(form.value.dateEntree) : null
    const dateSortie = form.value.dateSortie ? new Date(form.value.dateSortie) : null
    
    if (dateEntree && isNaN(dateEntree.getTime())) {
      errors.push('La date d\'entrée est invalide')
    }
    
    if (dateSortie && isNaN(dateSortie.getTime())) {
      errors.push('La date de sortie est invalide')
    }
    
    if (dateEntree && dateSortie && dateEntree > dateSortie) {
      errors.push('La date de sortie doit être postérieure à la date d\'entrée')
    }
    
    // Validation des antécédents (pas de chaînes vides)
    form.value.antecedents = form.value.antecedents.filter(ant => 
      typeof ant === 'string' && ant.trim() !== ''
    )
    
    // Validation des documents (taille max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = form.value.documents.filter(doc => 
      doc instanceof File && doc.size > MAX_FILE_SIZE
    )
    
    if (oversizedFiles.length > 0) {
      errors.push(`Les fichiers suivants dépassent la taille maximale de 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`)
    }
  } catch (error) {
    console.error('Erreur lors de la validation du formulaire:', error)
    errors.push('Une erreur est survenue lors de la validation du formulaire')
  }
  
  return errors
}

// Soumission du formulaire
const handleSubmit = async () => {
  console.log('Soumission du formulaire...')
  
  try {
    // Vérifier l'ID du dossier - utilisez la même logique que handlePartialSave
    let dossierId = null
    
    if (props.dossier?._id) {
      dossierId = props.dossier._id
    } else if (props.dossier?.id) {
      dossierId = props.dossier.id
    } else if (form.value.dossier_id) {
      dossierId = form.value.dossier_id
    }
    
    if (!dossierId) {
      console.error('ID du dossier médical manquant', props.dossier)
      toast.error('ID du dossier médical manquant. Veuillez rafraîchir la page et réessayer.')
      return
    }
    
    isSubmitting.value = true
    
    // Valider le formulaire
    const errors = validateForm()
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err))
      isSubmitting.value = false
      return
    }
    
    // Gestion des mises à jour sélectives
    let hasErrors = false
    
    // 1. Préparation des données pour la mise à jour des informations de base du dossier
    // On inclut seulement les champs qui ont été modifiés ou qui sont essentiels
    const updates = {
      _id: dossierId,
      dateEntree: formatDate(form.value.dateEntree),
      dateSortie: formatDate(form.value.dateSortie),
      is_archived: form.value.is_archived ? 1 : 0
    }
    
    // N'ajouter les antécédents que s'ils sont non vides après nettoyage
    const cleanedAntecedents = form.value.antecedents.filter(ant => 
      typeof ant === 'string' && ant.trim() !== ''
    )
    if (cleanedAntecedents.length > 0 || form.value.antecedents.length !== (props.dossier?.antecedents?.length || 0)) {
      updates.antecedents = cleanedAntecedents
    }
    
    // Ajouter les champs texte seulement s'ils sont différents de l'original
    if (form.value.traitement !== (props.dossier?.traitement || '')) {
      updates.traitement = form.value.traitement || ''
    }
    
    if (form.value.surveillance !== (props.dossier?.surveillance || '')) {
      updates.surveillance = form.value.surveillance || ''
    }
    
    // 2. Gestion des documents (si présents)
    const formData = new FormData()
    let hasFiles = false
    let newDocuments = []
    
    // Identifier les nouveaux documents (instances de File)
    if (form.value.documents && form.value.documents.length > 0) {
      form.value.documents.forEach(doc => {
        if (doc instanceof File) {
          formData.append('documents[]', doc)
          hasFiles = true
          newDocuments.push(doc)
        }
      })
    }
    
    console.log('Mise à jour du dossier avec:', { 
      updates: JSON.stringify(updates, null, 2),
      nouveauxDocuments: newDocuments.length,
      fichiersDéjàExistants: form.value.documents.length - newDocuments.length
    })
    
    // Si des fichiers sont présents, on utilise FormData pour la mise à jour
    if (hasFiles) {
      // Ajouter tous les champs au FormData
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value))
          } else if (typeof value === 'boolean') {
            formData.append(key, value ? '1' : '0')
          } else if (value !== null) {
            formData.append(key, value)
          }
        }
      })
      
      try {
        console.log('Mise à jour du dossier avec FormData')
        // Log pour déboggage
        for (let [key, value] of formData.entries()) {
          console.log(`FormData: ${key} => ${value instanceof File ? value.name : value}`)
        }
        
        const response = await dossierMedicalStore.updateDossierMedical(dossierId, formData)
        console.log('Réponse de mise à jour:', response)
      } catch (error) {
        console.error('Erreur lors de la mise à jour du dossier avec documents:', error)
        console.error('Détails de l\'erreur:', error.response?.data || error.message)
        toast.error(`Erreur: ${error.response?.data?.message || "Erreur lors de la mise à jour du dossier"}`)
        hasErrors = true
      }
    } 
    // Sinon, on utilise un objet JSON standard
    else if (Object.keys(updates).length > 1) { // > 1 car _id est toujours présent
      try {
        console.log('Mise à jour des informations de base du dossier:', JSON.stringify(updates, null, 2))
        const response = await dossierMedicalStore.updateDossierMedical(dossierId, updates)
        console.log('Réponse de mise à jour:', response)
      } catch (error) {
        console.error('Erreur lors de la mise à jour des informations de base:', error)
        console.error('Détails de l\'erreur:', error.response?.data || error.message)
        toast.error(`Erreur: ${error.response?.data?.message || "Erreur lors de la mise à jour des informations générales"}`)
        hasErrors = true
      }
    }
    
    // 3. Mise à jour des examens modifiés
    const modifiedExamens = examens.value.filter(examen => examen.isModified)
    console.log(`${modifiedExamens.length} examens modifiés à mettre à jour`)
    
    if (modifiedExamens.length > 0) {
      for (const examen of modifiedExamens) {
        try {
          console.log('Mise à jour de l\'examen:', examen._id)
          const examenData = {
            type: examen.type,
            date: formatDate(examen.date),
            resultat: examen.resultat,
            interpretation: examen.interpretation,
            statut: examen.statut
          }
          
          // Gestion des fichiers d'examen si présents
          if (examen.newFichiers && examen.newFichiers.length > 0) {
            const examenFormData = new FormData()
            
            // Ajouter les champs de base
            Object.entries(examenData).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                examenFormData.append(key, value)
              }
            })
            
            // Ajouter les fichiers
            examen.newFichiers.forEach(file => {
              examenFormData.append('fichiers[]', file)
            })
            
            await examenStore.updateExamenWithFiles(examen._id, examenFormData)
          } else {
            await examenStore.updateExamen(examen._id, examenData)
          }
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de l'examen ${examen._id}:`, error)
          toast.error(`Erreur lors de la mise à jour d'un examen`)
          hasErrors = true
        }
      }
    }
    
    // 4. Mise à jour des rapports modifiés
    const modifiedRapports = rapports.value.filter(rapport => rapport.isModified)
    console.log(`${modifiedRapports.length} rapports modifiés à mettre à jour`)
    
    if (modifiedRapports.length > 0) {
      for (const rapport of modifiedRapports) {
        try {
          console.log('Mise à jour du rapport:', rapport._id)
          const rapportData = {
            titre: rapport.titre || `Rapport du ${new Date(rapport.date || new Date()).toLocaleDateString()}`,
            contenu: rapport.contenu,
            type: rapport.type,
            date: formatDate(rapport.date)
          }
          
          await rapportStore.updateRapport(rapport._id, rapportData)
        } catch (error) {
          console.error(`Erreur lors de la mise à jour du rapport ${rapport._id}:`, error)
          toast.error(`Erreur lors de la mise à jour d'un rapport`)
          hasErrors = true
        }
      }
    }
    
    // 5. Mise à jour des évolutions modifiées
    const modifiedEvolutions = evolutions.value.filter(evolution => evolution.isModified)
    console.log(`${modifiedEvolutions.length} évolutions modifiées à mettre à jour`)
    
    if (modifiedEvolutions.length > 0) {
      for (const evolution of modifiedEvolutions) {
        try {
          console.log('Mise à jour de l\'évolution:', evolution._id)
          const evolutionData = {
            nomMesure: evolution.nomMesure,
            valeurDeMesure: evolution.valeurDeMesure,
            etat: evolution.etat,
            commentaire: evolution.commentaire
          }
          
          await evolutionStore.updateEvolution(evolution._id, evolutionData)
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de l'évolution ${evolution._id}:`, error)
          toast.error(`Erreur lors de la mise à jour d'une évolution`)
          hasErrors = true
        }
      }
    }
    
    // 6. Mise à jour des consultations modifiées
    const modifiedConsultations = consultations.value.filter(consultation => consultation.isModified)
    console.log(`${modifiedConsultations.length} consultations modifiées à mettre à jour`)
    
    if (modifiedConsultations.length > 0) {
      for (const consultation of modifiedConsultations) {
        try {
          console.log('Mise à jour de la consultation:', consultation._id)
          const consultationData = {
            motifConsultation: consultation.motifConsultation,
            observations: consultation.observations,
            diagnostic: consultation.diagnostic
          }
          
          await consultationStore.updateConsultation(consultation._id, consultationData)
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de la consultation ${consultation._id}:`, error)
          toast.error(`Erreur lors de la mise à jour d'une consultation`)
          hasErrors = true
        }
      }
    }
    
    // 7. Récupérer les données mises à jour du dossier complet
    try {
      if (!hasErrors) {
        const updatedDossier = await dossierMedicalStore.fetchDossierMedical(dossierId)
        console.log('Dossier mis à jour récupéré avec succès:', updatedDossier)
        
        // Afficher le message de succès et émettre l'événement avec le dossier mis à jour
        toast.success('Dossier médical mis à jour avec succès')
        emit('update', updatedDossier)
        emit('close')
      } else {
        // Certaines mises à jour ont échoué, mais nous continuons quand même
        toast.warning('Certaines informations n\'ont pas pu être mises à jour')
        
        // Récupérer quand même les données mises à jour
        const partiallyUpdatedDossier = await dossierMedicalStore.fetchDossierMedical(dossierId)
        emit('update', partiallyUpdatedDossier)
        emit('close')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier mis à jour:', error)
      toast.error('Erreur lors de la finalisation de la mise à jour')
      emit('close')
    }
  } catch (error) {
    console.error('Erreur globale lors de la mise à jour:', error)
    toast.error('Une erreur est survenue lors de la mise à jour du dossier')
  } finally {
    isSubmitting.value = false
  }
}

// Gestion des antécédents
const addAntecedent = () => {
  form.value.antecedents.push('')
  modifiedFields.value.basic = true
}

const removeAntecedent = (index) => {
  form.value.antecedents.splice(index, 1)
  modifiedFields.value.basic = true
}

// Gestion des documents
const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  form.value.documents = [...form.value.documents, ...files]
  modifiedFields.value.basic = true
}

const removeFile = (index) => {
  form.value.documents.splice(index, 1)
  modifiedFields.value.basic = true
}

// Gestion des évolutions
const addEvolution = async () => {
  const dossierId = props.dossier?._id
  if (!dossierId) {
    console.error('ID du dossier médical manquant', props.dossier)
    toast.error('ID du dossier médical manquant')
    return
  }
  
  if (!newEvolution.value.nomMesure || !newEvolution.value.valeurDeMesure) {
    toast.error('Veuillez remplir les champs obligatoires')
    return
  }
  
  try {
    const createdEvolution = await evolutionStore.createEvolution({
      dossier_id: dossierId,
      ...newEvolution.value
    })
    
    evolutions.value.unshift({
      ...createdEvolution,
      isModified: false
    })
    
    // Réinitialiser le formulaire
    newEvolution.value = {
      nomMesure: '',
      valeurDeMesure: 0,
      etat: 'normal',
      commentaire: ''
    }
    
    showNewEvolutionForm.value = false
    toast.success('Évolution ajoutée avec succès')
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'évolution:', error)
    toast.error('Une erreur est survenue lors de l\'ajout de l\'évolution')
  }
}

const deleteEvolution = async (evolutionId) => {
  if (!evolutionId) {
    toast.error('ID d\'évolution manquant')
    return
  }
  
  if (confirm('Êtes-vous sûr de vouloir supprimer cette évolution ?')) {
    try {
      await evolutionStore.deleteEvolution(evolutionId)
      evolutions.value = evolutions.value.filter(e => e._id !== evolutionId)
      toast.success('Évolution supprimée avec succès')
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'évolution ${evolutionId}:`, error?.message || error)
      toast.error('Une erreur est survenue lors de la suppression de l\'évolution')
    }
  }
}

// Gestion des rapports
const addRapport = async () => {
  const dossierId = props.dossier?._id
  if (!dossierId) {
    console.error('ID du dossier médical manquant', props.dossier)
    toast.error('ID du dossier médical manquant')
    return
  }
  
  if (!newRapport.value.contenu) {
    toast.error('Veuillez remplir le contenu du rapport')
    return
  }
  
  try {
    const createdRapport = await rapportStore.createRapport({
      dossier_id: dossierId,
      titre: newRapport.value.titre || `Rapport du ${new Date().toLocaleDateString()}`,
      contenu: newRapport.value.contenu,
      type: newRapport.value.type,
      date: newRapport.value.date || new Date().toISOString().split('T')[0]
    })
    
    rapports.value.unshift({
      ...createdRapport,
      isModified: false
    })
    
    // Réinitialiser le formulaire
    newRapport.value = {
      titre: '',
      type: 'consultation',
      date: '',
      contenu: ''
    }
    
    showNewRapportForm.value = false
    toast.success('Rapport ajouté avec succès')
  } catch (error) {
    console.error('Erreur lors de l\'ajout du rapport:', error)
    toast.error('Une erreur est survenue lors de l\'ajout du rapport')
  }
}

const deleteRapport = async (rapportId) => {
  if (!rapportId) {
    toast.error('ID de rapport manquant')
    return
  }
  
  if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
    try {
      await rapportStore.deleteRapport(rapportId)
      rapports.value = rapports.value.filter(r => r._id !== rapportId)
      toast.success('Rapport supprimé avec succès')
    } catch (error) {
      console.error(`Erreur lors de la suppression du rapport ${rapportId}:`, error)
      toast.error('Une erreur est survenue lors de la suppression du rapport')
    }
  }
}

// Fonction pour gérer la sauvegarde partielle
const handlePartialSave = async () => {
  console.log("Début de handlePartialSave, props:", props)
  console.log("Props.dossier:", props.dossier)
  
  // Rechercher l'ID du dossier à divers endroits possibles
  let dossierId = null
  
  if (props.dossier?._id) {
    dossierId = props.dossier._id
    console.log("ID trouvé dans props.dossier._id:", dossierId)
  } else if (props.dossier?.id) {
    dossierId = props.dossier.id
    console.log("ID trouvé dans props.dossier.id:", dossierId)
  } else if (form.value.dossier_id) {
    dossierId = form.value.dossier_id
    console.log("ID trouvé dans form.value.dossier_id:", dossierId)
  } else {
    // Parcourir toutes les propriétés à la recherche d'un ID
    for (const [key, value] of Object.entries(props.dossier || {})) {
      console.log(`Vérification de la propriété ${key}:`, value)
      if ((key.includes('id') || key.includes('_id')) && value) {
        dossierId = value
        console.log(`ID potentiel trouvé dans props.dossier.${key}:`, dossierId)
        break
      }
    }
  }
  
  if (!dossierId) {
    console.error('ID du dossier médical manquant', props.dossier)
    toast.error('ID du dossier médical manquant. Veuillez rafraîchir la page et réessayer.')
    return
  }

  isSubmitting.value = true
  let hasErrors = false
  let hasChanges = false
  
  try {
    // Selon l'onglet actif, sauvegarder différentes parties du dossier
    switch (activeTab.value) {
      case 0: // Informations générales
        console.log('Sauvegarde des informations générales')
        
        // Préparation des données à mettre à jour
        const generalUpdates = {
          _id: dossierId,
          dateEntree: formatDate(form.value.dateEntree),
          dateSortie: formatDate(form.value.dateSortie),
          is_archived: form.value.is_archived ? 1 : 0
        }
        
        // N'ajouter les antécédents que s'ils sont non vides après nettoyage
        const cleanedAntecedents = form.value.antecedents.filter(ant => 
          typeof ant === 'string' && ant.trim() !== ''
        )
        
        if (cleanedAntecedents.length > 0 || form.value.antecedents.length !== (props.dossier?.antecedents?.length || 0)) {
          generalUpdates.antecedents = cleanedAntecedents
          hasChanges = true
        }
        
        // Ajouter les champs texte seulement s'ils sont différents de l'original
        if (form.value.traitement !== (props.dossier?.traitement || '')) {
          generalUpdates.traitement = form.value.traitement || ''
          hasChanges = true
        }
        
        if (form.value.surveillance !== (props.dossier?.surveillance || '')) {
          generalUpdates.surveillance = form.value.surveillance || ''
          hasChanges = true
        }
        
        // Si aucun changement n'a été détecté et qu'il n'y a pas de documents à ajouter
        if (!hasChanges) {
          toast.info('Aucune modification détectée dans les informations générales')
          isSubmitting.value = false
          return
        }
        
        // Envoyer les mises à jour
        console.log('Mise à jour des informations générales - données envoyées:', JSON.stringify(generalUpdates, null, 2))
        
        try {
          await dossierMedicalStore.updateDossierMedical(dossierId, generalUpdates)
          toast.success('Informations générales mises à jour avec succès')
        } catch (error) {
          console.error('Détails de l\'erreur de mise à jour:', error.response?.data || error.message)
          toast.error(`Erreur: ${error.response?.data?.message || error.message || 'Erreur de mise à jour'}`)
          hasErrors = true
        }
        break
        
      case 1: // Évolutions
        // Trouver les évolutions modifiées
        const modifiedEvolutions = evolutions.value.filter(ev => ev.isModified)
        console.log(`${modifiedEvolutions.length} évolutions modifiées à sauvegarder`)
        
        if (modifiedEvolutions.length === 0) {
          toast.info('Aucune évolution modifiée à sauvegarder')
          isSubmitting.value = false
          return
        }
        
        // Mettre à jour chaque évolution modifiée
        for (const evolution of modifiedEvolutions) {
          try {
            console.log('Mise à jour de l\'évolution:', evolution._id)
            const evolutionData = {
              nomMesure: evolution.nomMesure,
              valeurDeMesure: evolution.valeurDeMesure,
              etat: evolution.etat,
              commentaire: evolution.commentaire
            }
            
            await evolutionStore.updateEvolution(evolution._id, evolutionData)
            evolution.isModified = false // Réinitialiser le flag de modification
            hasChanges = true
          } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'évolution ${evolution._id}:`, error)
            toast.error(`Erreur lors de la mise à jour d'une évolution`)
            hasErrors = true
          }
        }
        
        if (hasChanges && !hasErrors) {
          toast.success(`${modifiedEvolutions.length} évolution(s) mise(s) à jour avec succès`)
        } else if (hasChanges && hasErrors) {
          toast.warning('Certaines évolutions n\'ont pas pu être mises à jour')
        }
        break
        
      case 2: // Consultations
        const modifiedConsultations = consultations.value.filter(c => c.isModified)
        console.log(`${modifiedConsultations.length} consultations modifiées à sauvegarder`)
        
        if (modifiedConsultations.length === 0) {
          toast.info('Aucune consultation modifiée à sauvegarder')
          isSubmitting.value = false
          return
        }
        
        // Mettre à jour chaque consultation modifiée
        for (const consultation of modifiedConsultations) {
          try {
            console.log('Mise à jour de la consultation:', consultation._id)
            const consultationData = {
              motifConsultation: consultation.motifConsultation,
              observations: consultation.observations,
              diagnostic: consultation.diagnostic
            }
            
            await consultationStore.updateConsultation(consultation._id, consultationData)
            consultation.isModified = false // Réinitialiser le flag de modification
            hasChanges = true
          } catch (error) {
            console.error(`Erreur lors de la mise à jour de la consultation ${consultation._id}:`, error)
            toast.error(`Erreur lors de la mise à jour d'une consultation`)
            hasErrors = true
          }
        }
        
        if (hasChanges && !hasErrors) {
          toast.success(`${modifiedConsultations.length} consultation(s) mise(s) à jour avec succès`)
        } else if (hasChanges && hasErrors) {
          toast.warning('Certaines consultations n\'ont pas pu être mises à jour')
        }
        break
        
      case 3: // Examens
        const modifiedExamens = examens.value.filter(e => e.isModified)
        console.log(`${modifiedExamens.length} examens modifiés à sauvegarder`)
        
        if (modifiedExamens.length === 0) {
          toast.info('Aucun examen modifié à sauvegarder')
          isSubmitting.value = false
          return
        }
        
        // Mettre à jour chaque examen modifié
        for (const examen of modifiedExamens) {
          try {
            console.log('Mise à jour de l\'examen:', examen._id)
            const examenData = {
              type: examen.type,
              date: formatDate(examen.date),
              resultat: examen.resultat,
              interpretation: examen.interpretation,
              statut: examen.statut
            }
            
            // Gestion des fichiers d'examen si présents
            if (examen.newFichiers && examen.newFichiers.length > 0) {
              const examenFormData = new FormData()
              
              // Ajouter les champs de base
              Object.entries(examenData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                  examenFormData.append(key, value)
                }
              })
              
              // Ajouter les fichiers
              examen.newFichiers.forEach(file => {
                examenFormData.append('fichiers[]', file)
              })
              
              await examenStore.updateExamenWithFiles(examen._id, examenFormData)
            } else {
              await examenStore.updateExamen(examen._id, examenData)
            }
            
            examen.isModified = false // Réinitialiser le flag de modification
            hasChanges = true
          } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'examen ${examen._id}:`, error)
            toast.error(`Erreur lors de la mise à jour d'un examen`)
            hasErrors = true
          }
        }
        
        if (hasChanges && !hasErrors) {
          toast.success(`${modifiedExamens.length} examen(s) mis à jour avec succès`)
        } else if (hasChanges && hasErrors) {
          toast.warning('Certains examens n\'ont pas pu être mis à jour')
        }
        break
        
      case 4: // Rapports
        const modifiedRapports = rapports.value.filter(r => r.isModified)
        console.log(`${modifiedRapports.length} rapports modifiés à sauvegarder`)
        
        if (modifiedRapports.length === 0) {
          toast.info('Aucun rapport modifié à sauvegarder')
          isSubmitting.value = false
          return
        }
        
        // Mettre à jour chaque rapport modifié
        for (const rapport of modifiedRapports) {
          try {
            console.log('Mise à jour du rapport:', rapport._id)
            const rapportData = {
              titre: rapport.titre || `Rapport du ${new Date(rapport.date || new Date()).toLocaleDateString()}`,
              contenu: rapport.contenu,
              type: rapport.type,
              date: formatDate(rapport.date)
            }
            
            await rapportStore.updateRapport(rapport._id, rapportData)
            rapport.isModified = false // Réinitialiser le flag de modification
            hasChanges = true
          } catch (error) {
            console.error(`Erreur lors de la mise à jour du rapport ${rapport._id}:`, error)
            toast.error(`Erreur lors de la mise à jour d'un rapport`)
            hasErrors = true
          }
        }
        
        if (hasChanges && !hasErrors) {
          toast.success(`${modifiedRapports.length} rapport(s) mis à jour avec succès`)
        } else if (hasChanges && hasErrors) {
          toast.warning('Certains rapports n\'ont pas pu être mis à jour')
        }
        break
        
      case 5: // Documents
        // Vérifier s'il y a de nouveaux documents à téléverser
        const newDocuments = form.value.documents.filter(doc => doc instanceof File)
        
        if (newDocuments.length === 0) {
          toast.info('Aucun nouveau document à téléverser')
          isSubmitting.value = false
          return
        }
        
        // Créer un FormData pour l'envoi des documents
        const documentsFormData = new FormData()
        documentsFormData.append('_id', dossierId)
        
        // Ajouter les documents
        newDocuments.forEach(doc => {
          documentsFormData.append('documents[]', doc)
        })
        
        console.log(`Téléversement de ${newDocuments.length} nouveau(x) document(s)`)
        await dossierMedicalStore.updateDossierMedical(dossierId, documentsFormData)
        
        // Réinitialiser la liste des documents après téléversement
        const nonFileDocuments = form.value.documents.filter(doc => !(doc instanceof File))
        form.value.documents = nonFileDocuments
        
        toast.success(`${newDocuments.length} document(s) téléversé(s) avec succès`)
        break
    }
    
    // Récupérer les données mises à jour
    if (hasChanges) {
      const updatedDossier = await dossierMedicalStore.fetchDossierMedical(dossierId)
      emit('update', updatedDossier)
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde partielle:', error)
    toast.error(`Erreur lors de la sauvegarde des données de l'onglet ${tabs[activeTab.value].name}`)
    hasErrors = true
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.dossier-section {
  @apply mb-6 p-5 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700 shadow-sm;
}

.dossier-header {
  @apply text-lg font-medium text-gray-800 dark:text-white mb-4;
}

.dossier-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input, .form-select, .form-textarea {
  @apply w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
         dark:bg-gray-800 dark:text-white text-sm;
}

.form-textarea {
  @apply resize-none;
}

.btn {
  @apply px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
}

.btn-primary {
  @apply bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600;
}

.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700;
}

.btn-success {
  @apply bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700;
}

.btn-outline {
  @apply border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 
         dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700;
}

/* Nouvelles animations et styles */
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  @apply border-b border-gray-200 dark:border-gray-700 pb-2 mb-4;
}
</style>