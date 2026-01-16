<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Photo and Consent -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">
        Photo du patient
      </h3>
      <div class="flex items-start space-x-4">
        <!-- Photo Preview / Upload -->
        <div class="flex-shrink-0">
          <div class="relative w-32 h-32">
            <img v-if="photoPreview" :src="photoPreview" alt="Photo du patient"
              class="w-full h-full object-cover rounded-lg" />
            <div v-else
              class="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <Camera class="w-8 h-8 text-gray-400" />
            </div>
            <input type="file" ref="photoInput" class="hidden" accept="image/*" @change="handlePhotoChange" />
            <button type="button" class="absolute bottom-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg"
              @click="$refs.photoInput.click()">
              <Upload class="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        <!-- Consentement -->
        <div class="flex-grow">
          <label class="flex items-start space-x-2">
            <input type="checkbox" v-model="form.consentementPhoto" class="mt-1 form-checkbox" />
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Je consens à l'utilisation de ma photo dans le cadre de mon dossier médical.
              Cette photo sera utilisée uniquement à des fins d'identification et ne sera pas partagée sans mon
              autorisation.
            </span>
          </label>
          <p v-if="form.photo && !form.consentementPhoto" class="mt-1 text-sm text-red-500">
            Le consentement est requis pour utiliser une photo
          </p>
        </div>
      </div>
    </div>

    <!-- Basic Information -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label class="form-label" for="nom">Nom</label>
        <input id="nom" v-model="form.nom" type="text" class="form-input" required />
      </div>
      <div>
        <label class="form-label" for="prenom">Prénom</label>
        <input id="prenom" v-model="form.prenom" type="text" class="form-input" required />
      </div>
      <div>
        <label class="form-label" for="email">Email</label>
        <input id="email" v-model="form.email" type="email" class="form-input" required />
      </div>
      <div>
        <label class="form-label" for="password">Mot de passe</label>
        <input id="password" v-model="form.password" type="password" class="form-input" required />
      </div>
      <div>
        <label class="form-label" for="telephone">Téléphone</label>
        <input id="telephone" v-model="form.telephone" type="tel" class="form-input" required />
      </div>
      <div>
        <label class="form-label" for="genre">Genre</label>
        <select id="genre" v-model="form.genre" class="form-select" required>
          <option value="">Sélectionner</option>
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
          <option value="autre">Autre</option>
        </select>
      </div>
      <div>
        <label class="form-label" for="dateNaissance">Date de naissance</label>
        <input id="dateNaissance" v-model="form.dateNaissance" type="date" class="form-input" required />
      </div>
      <div>
        <label class="form-label" for="dateInscription">Date d'inscription</label>
        <input id="dateInscription" v-model="form.dateInscription" type="date" class="form-input" required />
      </div>
      <div class="sm:col-span-2">
        <label class="form-label" for="adresse">Adresse</label>
        <textarea id="adresse" v-model="form.adresse" class="form-textarea" rows="2" required></textarea>
      </div>
    </div>

    <!-- Section Contacts d'urgence -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">
        Contacts d'urgence
      </h3>
      <div v-for="(contact, index) in form.contactsUrgence" :key="index" class="border p-4 rounded">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Nom</label>
            <input type="text" v-model="contact.nom" class="form-input" required />
          </div>
          <div>
            <label class="form-label">Prénom</label>
            <input type="text" v-model="contact.prenom" class="form-input" required />
          </div>
          <div>
            <label class="form-label">Téléphone</label>
            <input type="text" v-model="contact.telephone" class="form-input" required />
          </div>
          <div>
            <label class="form-label">Téléphone secondaire</label>
            <input type="text" v-model="contact.telephone_secondaire" class="form-input" />
          </div>
          <div>
            <label class="form-label">Relation</label>
            <input type="text" v-model="contact.relation" class="form-input" required />
          </div>
          <div>
            <label class="form-label">Adresse</label>
            <input type="text" v-model="contact.adresse" class="form-input" />
          </div>
        </div>
        <button type="button" class="btn btn-secondary mt-2" @click="removeContact(index)">
          Supprimer ce contact
        </button>
      </div>
      <button type="button" class="btn btn-primary" @click="addContact">
        Ajouter un contact d'urgence
      </button>
    </div>

    <!-- Medical Information -->
    <div class="space-y-6">
      <h4 class="text-md font-medium text-gray-700 dark:text-gray-300">
        Informations médicales
      </h4>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label class="form-label" for="taille">Taille (cm)</label>
          <input id="taille" v-model="form.taille" type="number" min="0" max="300" class="form-input" required />
        </div>
        <div>
          <label class="form-label" for="poids">Poids (kg)</label>
          <input id="poids" v-model="form.poids" type="number" min="0" max="500" step="0.1" class="form-input"
            required />
        </div>
        <div>
          <label class="form-label" for="groupeSanguin">Groupe sanguin</label>
          <select id="groupeSanguin" v-model="form.groupeSanguin" class="form-select" required>
            <option value="">Sélectionner</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="form-label" for="allergies">
            Allergies connues <span class="text-sm text-gray-500 ml-1">(séparez par des virgules)</span>
          </label>
          <textarea id="allergies" v-model="form.allergiesConnues" class="form-textarea" rows="2"
            placeholder="Ex: Pollen, Arachides"></textarea>
        </div>
        <div class="sm:col-span-2">
          <label class="form-label" for="maladiesChroniques">
            Maladies chroniques <span class="text-sm text-gray-500 ml-1">(séparez par des virgules)</span>
          </label>
          <textarea id="maladiesChroniques" v-model="form.maladiesChroniques" class="form-textarea" rows="2"
            placeholder="Ex: Diabète, Hypertension"></textarea>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end space-x-3">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
        Annuler
      </button>
      <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
        {{ isEditing ? 'Mettre à jour' : 'Créer' }}
      </button>
    </div>

    <!-- Modal de la carte patient -->
    <BaseModal v-if="showCardModal" title="Nouvelle Carte Patient" @close="showCardModal = false">
      <div class="space-y-4">
        <PatientCard :patient-data="cardData" :photo="photoPreview" ref="patientCard" />
        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" @click="showCardModal = false">
            Fermer
          </button>
          <button type="button" class="btn btn-primary" @click="saveCard">
            <Save class="w-4 h-4 mr-2" />
            Sauvegarder
          </button>
          <button type="button" class="btn btn-primary" @click="printPatientCard">
            <Printer class="w-4 h-4 mr-2" />
            Imprimer
          </button>
        </div>
      </div>
    </BaseModal>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Loader2, Camera, Upload, Printer, Save } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { useUserStore } from '@/stores/user'
import { useCardIdStore } from '@/stores/cardId'
import PatientCard from './PatientCard.vue'
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits(['submit', 'cancel'])
const toast = useToast()
const userStore = useUserStore()
const isSubmitting = ref(false)
const isEditing = computed(() => !!props.initialData?.id)

const photoInput = ref(null)
const photoPreview = ref(null)
const showCardModal = ref(false)
const cardData = ref(null)
const patientCard = ref(null)

const cardIdStore = useCardIdStore()

// Initialisation du formulaire
const form = ref({
  userType: 'patient',
  nom: '',
  prenom: '',
  email: '',
  password: '',
  telephone: '',
  genre: '',
  dateNaissance: '',
  dateInscription: '',
  adresse: '',
  taille: '',
  poids: '',
  groupeSanguin: '',
  allergiesConnues: '',
  maladiesChroniques: '',
  statutCompte: 'ACTIF',
  consentementPhoto: false,
  contactsUrgence: []
})

const initializeForm = () => {
  if (props.initialData?.id) {
    form.value = {
      userType: 'patient',
      nom: props.initialData.nom || '',
      prenom: props.initialData.prenom || '',
      email: props.initialData.email || '',
      password: props.initialData.password || '',
      telephone: props.initialData.telephone || '',
      genre: props.initialData.genre || '',
      dateNaissance: props.initialData.dateNaissance || '',
      dateInscription: props.initialData.dateInscription || '',
      adresse: props.initialData.adresse || '',
      taille: props.initialData.taille || '',
      poids: props.initialData.poids || '',
      groupeSanguin: props.initialData.groupeSanguin || '',
      allergiesConnues: Array.isArray(props.initialData.allergiesConnues)
        ? props.initialData.allergiesConnues.join(', ')
        : '',
      maladiesChroniques: Array.isArray(props.initialData.maladiesChroniques)
        ? props.initialData.maladiesChroniques.join(', ')
        : '',
      statutCompte: props.initialData.statutCompte || 'ACTIF',
      consentementPhoto: props.initialData.consentementPhoto || false
    }
  }
}

const addContact = () => {
  form.value.contactsUrgence.push({
    nom: '',
    prenom: '',
    telephone: '',
    telephone_secondaire: '',
    relation: '',
    adresse: ''
  })
}

const removeContact = (index) => {
  form.value.contactsUrgence.splice(index, 1)
}

watch(() => props.initialData, initializeForm, { immediate: true })

const handlePhotoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (!allowedTypes.includes(file.type)) {
      toast.error('Le fichier doit être une image (JPEG, PNG, JPG, GIF)')
      event.target.value = ''
      return
    }
    if (file.size > maxSize) {
      toast.error('La taille du fichier ne doit pas dépasser 2MB')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
    form.value.photo = file
  }
}

const printPatientCard = () => {
  if (showCardModal.value && cardData.value) {
    if (patientCard.value && typeof patientCard.value.print === 'function') {
      patientCard.value.print()
    }
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    // Validation des données
    if (form.value.photo && !form.value.consentementPhoto) {
      toast.error('Le consentement est requis pour utiliser une photo');
      return;
    }

    const requiredFields = [
      'nom', 'prenom', 'email', 'password', 'telephone',
      'genre', 'dateNaissance', 'adresse', 'taille', 'poids', 'groupeSanguin'
    ];

    if (requiredFields.some(field => !form.value[field])) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (form.value.contactsUrgence.length === 0) {
      toast.error('Au moins un contact d\'urgence est requis');
      return;
    }

    for (const contact of form.value.contactsUrgence) {
      if (!contact.nom || !contact.prenom || !contact.telephone || !contact.relation) {
        toast.error('Tous les champs obligatoires des contacts d\'urgence doivent être remplis');
        return;
      }
    }

    // Préparation des données
    const allergiesArray = form.value.allergiesConnues
      ? form.value.allergiesConnues.split(',').map(s => s.trim()).filter(s => s)
      : [];

    const maladiesArray = form.value.maladiesChroniques
      ? form.value.maladiesChroniques.split(',').map(s => s.trim()).filter(s => s)
      : [];

    const formData = new FormData();
    if (photoPreview.value) {
      formData.append('base64_photo', photoPreview.value);
    }

    Object.keys(form.value).forEach(key => {
      if (key === 'allergiesConnues') {
        formData.append(key, JSON.stringify(allergiesArray));
      } else if (key === 'maladiesChroniques') {
        formData.append(key, JSON.stringify(maladiesArray));
      } else if (key === 'contactsUrgence') {
        formData.append(key, JSON.stringify(form.value.contactsUrgence));
      } else if (key !== 'photo') {
        formData.append(key, form.value[key]);
      }
    });

    // Soumission du formulaire
    let patientResponse;
    try {
      patientResponse = await new Promise((resolve, reject) => {
        emit('submit', formData, (response) => {
          if (response?.error) {
            reject(response.error);
          } else {
            resolve(response);
          }
        });
      });

      if (!patientResponse?._id) {
        throw new Error('La création du patient a échoué - ID non reçu');
      }
    } catch (error) {
      console.error('Erreur création patient:', error);
      toast.error(`Échec de la création : ${error.message}`);
      return;
    }

    // Préparation des données de la carte
    cardData.value = {
      id: patientResponse._id,
      nom: form.value.nom,
      prenom: form.value.prenom,
      dateNaissance: form.value.dateNaissance,
      groupeSanguin: form.value.groupeSanguin,
      photo: photoPreview.value
    };

    // Affichage du modal de carte
    showCardModal.value = true;

  } catch (error) {
    console.error('Erreur globale:', error);
    toast.error(`Une erreur est survenue : ${error.message}`);
  } finally {
    isSubmitting.value = false;
  }
};

const saveCard = async () => {
  try {
    if (!cardData.value?.id) {
      throw new Error('ID patient manquant pour la carte');
    }

    const cardPayload = {
      base64_photo: cardData.value.photo,
      reference: `CARD-${cardData.value.id}-${Date.now()}`,
      codeQR: JSON.stringify({
        id: cardData.value.id,
        nom: cardData.value.nom,
        prenom: cardData.value.prenom,
        dateNaissance: cardData.value.dateNaissance,
        groupeSanguin: cardData.value.groupeSanguin
      }),
      patient_id: cardData.value.id
    };

    const response = await cardIdStore.createCard(cardData.value.id, cardPayload);

    if (response?.error) {
      throw new Error(response.error);
    }

    toast.success('Carte enregistrée avec succès');
    showCardModal.value = false;
  } catch (error) {
    console.error('Erreur sauvegarde carte:', error);
    toast.error(`Erreur d'enregistrement : ${error.message}`);
  }
};
</script>

<style>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select,
.form-textarea {
  @apply mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200;
}

.form-checkbox {
  @apply rounded border-gray-300 dark:border-gray-700 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500;
}

.btn {
  @apply inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500;
}

.btn-success {
  @apply border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500;
}
</style>
