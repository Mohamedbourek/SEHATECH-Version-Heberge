<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Configuration de l'équipement
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          {{ equipment.name }} - {{ equipment.serialNumber }}
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          class="btn btn-outline"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <button 
          class="btn btn-primary"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <Loader2 
            v-if="isSubmitting"
            class="w-4 h-4 mr-2 animate-spin"
          />
          Enregistrer
        </button>
      </div>
    </div>

    <!-- Formulaire -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Informations générales -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Informations générales</h3>
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label required">Nom de l'équipement</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label required">Modèle</label>
            <input
              v-model="form.model"
              type="text"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label required">Numéro de série</label>
            <input
              v-model="form.serialNumber"
              type="text"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label required">Service</label>
            <select v-model="form.department" class="form-select" required>
              <option value="cardiology">Cardiologie</option>
              <option value="radiology">Radiologie</option>
              <option value="laboratory">Laboratoire</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Localisation</label>
            <input
              v-model="form.location"
              type="text"
              class="form-input"
              required
            />
          </div>
        </div>
      </div>

      <!-- Maintenance préventive -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Maintenance préventive</h3>
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label required">Fréquence de maintenance</label>
            <div class="flex items-center space-x-3">
              <input
                v-model.number="form.maintenanceInterval"
                type="number"
                class="form-input w-24"
                min="1"
                required
              />
              <select v-model="form.maintenanceUnit" class="form-select w-40">
                <option value="days">Jours</option>
                <option value="weeks">Semaines</option>
                <option value="months">Mois</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Checklist de maintenance</label>
            <div class="space-y-2">
              <div 
                v-for="(item, index) in form.maintenanceChecklist"
                :key="index"
                class="flex items-center space-x-2"
              >
                <input
                  v-model="item.task"
                  type="text"
                  class="form-input flex-1"
                  placeholder="Tâche de maintenance"
                />
                <button 
                  class="btn btn-icon btn-ghost"
                  @click="removeChecklistItem(index)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <button 
                class="btn btn-outline btn-sm w-full"
                @click="addChecklistItem"
              >
                <Plus class="w-4 h-4 mr-2" />
                Ajouter une tâche
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Pièces de rechange recommandées</label>
            <div class="space-y-2">
              <div 
                v-for="(part, index) in form.recommendedParts"
                :key="index"
                class="grid grid-cols-5 gap-2"
              >
                <input
                  v-model="part.reference"
                  type="text"
                  class="form-input col-span-2"
                  placeholder="Référence"
                />
                <input
                  v-model="part.name"
                  type="text"
                  class="form-input col-span-2"
                  placeholder="Désignation"
                />
                <button 
                  class="btn btn-icon btn-ghost"
                  @click="removePart(index)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <button 
                class="btn btn-outline btn-sm w-full"
                @click="addPart"
              >
                <Plus class="w-4 h-4 mr-2" />
                Ajouter une pièce
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paramètres de surveillance -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Paramètres de surveillance</h3>
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">Seuils d'alerte</label>
            <div class="space-y-3">
              <div 
                v-for="(threshold, index) in form.thresholds"
                :key="index"
                class="grid grid-cols-6 gap-2"
              >
                <input
                  v-model="threshold.parameter"
                  type="text"
                  class="form-input col-span-2"
                  placeholder="Paramètre"
                />
                <input
                  v-model.number="threshold.min"
                  type="number"
                  class="form-input"
                  placeholder="Min"
                />
                <input
                  v-model.number="threshold.max"
                  type="number"
                  class="form-input"
                  placeholder="Max"
                />
                <input
                  v-model="threshold.unit"
                  type="text"
                  class="form-input"
                  placeholder="Unité"
                />
                <button 
                  class="btn btn-icon btn-ghost"
                  @click="removeThreshold(index)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <button 
                class="btn btn-outline btn-sm w-full"
                @click="addThreshold"
              >
                <Plus class="w-4 h-4 mr-2" />
                Ajouter un seuil
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Documents</h3>
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">Manuel d'utilisation</label>
            <div class="flex items-center space-x-3">
              <input
                type="file"
                class="hidden"
                ref="manualInput"
                @change="handleManualUpload"
              />
              <button 
                class="btn btn-outline flex-1"
                @click="$refs.manualInput.click()"
              >
                <Upload class="w-4 h-4 mr-2" />
                Télécharger le manuel
              </button>
              <button 
                v-if="form.manual"
                class="btn btn-icon btn-ghost"
                @click="removeManual"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <p 
              v-if="form.manual"
              class="mt-2 text-sm text-gray-500"
            >
              {{ form.manual.name }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  Loader2, Plus, Trash2, Upload
} from 'lucide-vue-next'

const props = defineProps({
  equipment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['cancel', 'save'])

const isSubmitting = ref(false)
const manualInput = ref(null)

// Formulaire avec valeurs par défaut
const form = ref({
  name: props.equipment.name,
  model: props.equipment.model,
  serialNumber: props.equipment.serialNumber,
  department: props.equipment.department,
  location: props.equipment.location,
  maintenanceInterval: props.equipment.maintenanceInterval || 30,
  maintenanceUnit: props.equipment.maintenanceUnit || 'days',
  maintenanceChecklist: props.equipment.maintenanceChecklist || [],
  recommendedParts: props.equipment.recommendedParts || [],
  thresholds: props.equipment.thresholds || [],
  manual: props.equipment.manual || null
})

// Gestion de la checklist
function addChecklistItem() {
  form.value.maintenanceChecklist.push({ task: '' })
}

function removeChecklistItem(index) {
  form.value.maintenanceChecklist.splice(index, 1)
}

// Gestion des pièces
function addPart() {
  form.value.recommendedParts.push({ reference: '', name: '' })
}

function removePart(index) {
  form.value.recommendedParts.splice(index, 1)
}

// Gestion des seuils
function addThreshold() {
  form.value.thresholds.push({
    parameter: '',
    min: null,
    max: null,
    unit: ''
  })
}

function removeThreshold(index) {
  form.value.thresholds.splice(index, 1)
}

// Gestion du manuel
function handleManualUpload(event) {
  const file = event.target.files[0]
  if (file) {
    form.value.manual = file
  }
}

function removeManual() {
  form.value.manual = null
  if (manualInput.value) {
    manualInput.value.value = ''
  }
}

// Soumission du formulaire
async function handleSubmit() {
  isSubmitting.value = true
  try {
    await emit('save', {
      id: props.equipment.id,
      ...form.value
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-label.required:after {
  content: " *";
  @apply text-red-500;
}

.form-input {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600
         shadow-sm focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:text-white;
}

.form-select {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600
         shadow-sm focus:border-primary-500 focus:ring-primary-500
         dark:bg-gray-700 dark:text-white;
}
</style> 