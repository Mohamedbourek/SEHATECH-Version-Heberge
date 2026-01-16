<template>
  <div class="p-4 dark:bg-gray-800">
    <div class="mb-6">
      <h2 class="text-2xl font-bold dark:text-white">Gestion des Demandes d'Hospitalisation</h2>
      <p class="text-gray-600 dark:text-gray-400">Gérez les demandes de billet de salle envoyées par les médecins</p>
    </div>

    <!-- Filtres et recherche -->
    <div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="form-label" for="search">Recherche</label>
          <div class="relative">
            <input
              id="search"
              v-model="searchTerm"
              type="text"
              class="form-input pl-10"
              placeholder="Rechercher un patient ou médecin..."
            >
            <Search class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label class="form-label" for="urgence">Niveau d'urgence</label>
          <select v-model="urgenceFilter" id="urgence" class="form-select">
            <option value="">Tous les niveaux</option>
            <option value="haute">Haute</option>
            <option value="moyenne">Moyenne</option>
            <option value="basse">Basse</option>
          </select>
        </div>

        <div>
          <label class="form-label" for="dateDebut">Date souhaitée</label>
          <input
            id="dateDebut"
            v-model="dateFilter"
            type="date"
            class="form-input"
          >
        </div>
      </div>

      <div class="flex justify-end space-x-2 mt-4">
        <button
          type="button"
          @click="resetFilters"
          class="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          <RotateCcw class="inline-block w-4 h-4 mr-1" />
          Réinitialiser
        </button>
        <button
          type="button"
          @click="applyFilters"
          class="px-4 py-2 text-sm font-medium border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowUpDown class="inline-block w-4 h-4 mr-1" />
          Appliquer
        </button>
      </div>
    </div>

    <!-- Titre et contrôles -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Demandes d'hospitalisation en attente
        <span 
          v-if="unreadRequestsCount > 0"
          class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
        >
          {{ unreadRequestsCount }} nouvelle{{ unreadRequestsCount > 1 ? 's' : '' }}
        </span>
      </h2>

      <div class="flex rounded-md shadow-sm">
        <button
          type="button" 
          @click="viewMode = 'list'" 
          :class="[
            'relative inline-flex items-center px-3 py-2 rounded-l-md border',
            viewMode === 'list' 
              ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
          ]"
        >
          <List class="h-5 w-5" />
          <span class="sr-only">Vue liste</span>
        </button>
        <button
          type="button" 
          @click="viewMode = 'grid'" 
          :class="[
            'relative inline-flex items-center px-3 py-2 rounded-r-md border',
            viewMode === 'grid' 
              ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
          ]"
        >
          <Grid class="h-5 w-5" />
          <span class="sr-only">Vue grille</span>
        </button>
      </div>
      </div>

    <!-- Navigation entre les sections -->
    <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
      <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
        <li class="mr-2">
          <button 
            @click="activeTab = 'requests'"
            :class="[
              'inline-block px-4 py-2 rounded-t-lg',
              activeTab === 'requests' 
                ? 'text-primary-600 border-b-2 border-primary-600 active dark:border-primary-500 dark:text-primary-500' 
                : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
            ]"
          >
            Demandes d'hospitalisation
            <span 
              v-if="unreadRequestsCount > 0"
              class="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            >
              {{ unreadRequestsCount }}
            </span>
      </button>
        </li>
        <li class="mr-2">
          <button 
            @click="activeTab = 'hospitalizations'"
            :class="[
              'inline-block px-4 py-2 rounded-t-lg',
              activeTab === 'hospitalizations' 
                ? 'text-primary-600 border-b-2 border-primary-600 active dark:border-primary-500 dark:text-primary-500' 
                : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
            ]"
          >
            Hospitalisations en cours
          </button>
        </li>
      </ul>
    </div>

    <!-- Content area -->
    <div class="py-4">
      <!-- Chargement -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <span class="ml-2 text-gray-600 dark:text-gray-400">Chargement des données...</span>
    </div>

      <!-- Section des demandes d'hospitalisation -->
      <div v-else-if="activeTab === 'requests'">
        <!-- Vue en liste pour les demandes -->
        <div v-if="viewMode === 'list'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" class="px-4 py-3 w-4"></th>
                  <th scope="col" class="px-4 py-3">Date</th>
                  <th scope="col" class="px-4 py-3">Patient</th>
                  <th scope="col" class="px-4 py-3">Médecin demandeur</th>
                  <th scope="col" class="px-4 py-3">Motif</th>
                  <th scope="col" class="px-4 py-3">Date souhaitée</th>
                  <th scope="col" class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="filteredRequests.length">
                  <HospitalizationRequestRow
                    v-for="request in filteredRequests"
                    :key="request._id"
                    :request="request"
                    :patientName="getPatientName(request.patient_id)"
                    :medecinName="getMedecinName(request.medecin_id)"
                    :medecinSpecialite="getMedecinSpecialite(request.medecin_id)"
                    @approve="approveRequest"
                    @reject="rejectRequest"
                  />
                </template>
                <tr v-else class="bg-white dark:bg-gray-800">
                  <td colspan="7" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    Aucune demande d'hospitalisation en attente
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>

        <!-- Vue en grille améliorée pour les demandes -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-if="filteredRequests.length === 0" class="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12 text-center">
            <div class="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
              <CheckCircle class="h-10 w-10 text-gray-400" />
            </div>
            <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aucune demande en attente</h3>
            <p class="mt-1 text-gray-500 dark:text-gray-400 max-w-md">
              Toutes les demandes d'hospitalisation ont été traitées.
            </p>
          </div>

          <HospitalizationRequestCard
            v-for="request in filteredRequests"
            :key="request._id"
            :request="request"
            :patientName="getPatientName(request.patient_id)"
            :patientAge="getPatientAge(request.patient_id)"
            :patientContact="getPatientContact(request.patient_id)"
            :medecinName="getMedecinName(request.medecin_id)"
            :medecinSpecialite="getMedecinSpecialite(request.medecin_id)"
            @approve="approveRequest"
          />
          </div>
      </div>

      <!-- Section des hospitalisations -->
      <div v-else-if="activeTab === 'hospitalizations'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Liste des hospitalisations</h3>
          <div class="flex gap-2">
            <div class="relative">
              <input
                type="text"
                v-model="hospitalizationSearchTerm"
                placeholder="Rechercher un patient..."
                class="form-input pl-10 py-2 text-sm"
              >
              <Search class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <select v-model="hospitalizationStatusFilter" class="form-select py-2 text-sm">
              <option value="">Tous les statuts</option>
              <option value="confirmée">Confirmée</option>
              <option value="en_cours">En cours</option>
              <option value="terminée">Terminée</option>
              <option value="annulée">Annulée</option>
            </select>
        </div>
      </div>

        <div v-if="loading" class="flex justify-center items-center py-8">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <span class="ml-2 text-gray-600 dark:text-gray-400">Chargement des hospitalisations...</span>
                </div>

        <div v-else-if="filteredHospitalizations.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <Database class="h-10 w-10 text-gray-400" />
          </div>
          <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aucune hospitalisation trouvée</h3>
          <p class="mt-1 text-gray-500 dark:text-gray-400 max-w-md">
            Aucune hospitalisation ne correspond à vos critères de recherche.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" class="px-4 py-3">Patient</th>
                <th scope="col" class="px-4 py-3">Médecin</th>
                <th scope="col" class="px-4 py-3">Chambre</th>
                <th scope="col" class="px-4 py-3">Date début</th>
                <th scope="col" class="px-4 py-3">Date fin prévue</th>
                <th scope="col" class="px-4 py-3">Statut</th>
                <th scope="col" class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
              <tr v-for="hospitalization in filteredHospitalizations" :key="hospitalization._id" class="bg-white dark:bg-gray-800 border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {{ getPatientName(hospitalization.patient_id) }}
                </td>
                <td class="px-4 py-3">
                  Dr. {{ getMedecinName(hospitalization.medecin_id) }}
                </td>
                <td class="px-4 py-3">
                  {{ getRoomNumber(hospitalization.chambre_id) }}
                </td>
                <td class="px-4 py-3">
                  {{ formatDate(hospitalization.dateDebut) }}
                </td>
                <td class="px-4 py-3">
                  {{ formatDate(hospitalization.dateFin) || 'Non définie' }}
                </td>
                <td class="px-4 py-3">
                  <span 
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      {
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': hospitalization.status === 'confirmée',
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300': hospitalization.status === 'en_cours',
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300': hospitalization.status === 'terminée',
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': hospitalization.status === 'annulée'
                      }
                    ]"
                  >
                    {{ hospitalization.status }}
                </span>
              </td>
                <td class="px-4 py-3 text-right">
                <div class="flex justify-end space-x-2">
                    <button
                      v-if="hospitalization.status !== 'terminée' && hospitalization.status !== 'annulée'"
                      @click="editHospitalization(hospitalization)"
                      class="text-gray-500 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-500"
                      title="Modifier"
                    >
                      <Edit2 class="w-5 h-5" />
                  </button>
                    <button
                      v-if="hospitalization.status !== 'terminée' && hospitalization.status !== 'annulée'"
                      @click="terminateHospitalization(hospitalization)"
                      class="text-gray-500 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-500"
                      title="Terminer"
                    >
                      <CheckSquare class="w-5 h-5" />
                    </button>
                    <button
                      v-if="hospitalization.status !== 'terminée' && hospitalization.status !== 'annulée'"
                      @click="cancelHospitalization(hospitalization)"
                      class="text-gray-500 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-500"
                      title="Annuler"
                    >
                      <X class="w-5 h-5" />
                    </button>
                   
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>

    <!-- Formulaire d'approbation de demande -->
    <BaseModal 
      :show="showApprovalForm"
      title="Approuver la demande d'hospitalisation"
      @close="closeForm"
      size="lg"
    >
      <div v-if="loading" class="flex justify-center items-center py-8">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <span class="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
      </div>
      <div v-else class="space-y-6">
        <!-- Informations sur la demande -->
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <AlertCircle class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Informations sur la demande
          </h3>
          
          <div v-if="selectedRequestForApproval">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Patient</div>
                <div v-if="loading || !patientsLoaded" class="flex items-center">
                  <Loader2 class="h-4 w-4 animate-spin text-primary mr-2" />
                  <span>Chargement...</span>
                </div>
                <div v-else class="flex items-center space-x-2">
                  <UserCircle class="h-5 w-5 text-blue-500" />
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ getPatientName(selectedRequestForApproval.patient_id) }} 
                    
                  </span>
                 
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {{ getPatientContact(selectedRequestForApproval.patient_id) }}
                </div>
              </div>

              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Médecin demandeur</div>
                <div class="flex items-center space-x-2">
                  <Stethoscope class="h-5 w-5 text-green-500" />
                  <span class="font-medium text-gray-900 dark:text-white">
                    Dr. {{ getMedecinName(selectedRequestForApproval.medecin_id) }}
                  </span>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {{ getMedecinSpecialite(selectedRequestForApproval.medecin_id) }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date souhaitée</div>
                <div class="text-gray-900 dark:text-white">
                  {{ formatDate(selectedRequestForApproval.dateDebut) }}
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Motif</div>
                <div class="text-gray-900 dark:text-white truncate">
                  {{ selectedRequestForApproval.motif }}
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Niveau d'urgence</div>
                <span 
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium',
                    {
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': selectedRequestForApproval.niveauUrgence === 'urgent',
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300': selectedRequestForApproval.niveauUrgence === 'modéré',
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': selectedRequestForApproval.niveauUrgence === 'normal'
                    }
                  ]"
                >
                  {{ selectedRequestForApproval.niveauUrgence || 'normal' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sélection de la chambre -->
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <Building class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Sélection de la chambre
          </h3>
          
          <div v-if="loading || !roomsLoaded" class="flex justify-center items-center py-4">
            <Loader2 class="h-6 w-6 animate-spin text-primary" />
            <span class="ml-2 text-gray-600 dark:text-gray-400">Chargement des chambres...</span>
          </div>
          <div v-else-if="availableRooms.length === 0" class="text-center py-4">
            <AlertCircle class="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p class="text-gray-600 dark:text-gray-400">Aucune chambre disponible pour le moment.</p>
          </div>
          <div v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="col-span-full">
                <label for="chambre" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Sélectionner une chambre
                </label>
                <div class="relative">
                  <select 
                    id="chambre" 
                    v-model="approvalFormData.chambre_id"
                    class="form-select block w-full"
                    required
                  >
                    <option value="" disabled selected>Sélectionner une chambre</option>
                    <option 
                      v-for="room in availableRooms" 
                      :key="room._id" 
                      :value="room._id"
                    >
                      Chambre {{ room.numero }} - {{ room.type }} (Étage {{ room.etage }})
                    </option>
                  </select>
                </div>
              </div>
            </div>
            
            <div v-if="approvalFormData.chambre_id" class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Détails de la chambre</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Type:</span>
                  <span class="ml-1 text-gray-900 dark:text-white">
                    {{ availableRooms.find(r => r._id === approvalFormData.chambre_id)?.type || '-' }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Étage:</span>
                  <span class="ml-1 text-gray-900 dark:text-white">
                    {{ availableRooms.find(r => r._id === approvalFormData.chambre_id)?.etage || '-' }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Équipement:</span>
                  <span class="ml-1 text-gray-900 dark:text-white">
                    {{ availableRooms.find(r => r._id === approvalFormData.chambre_id)?.equipement || 'Standard' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Finalisation -->
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <FileText class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Détails de l'hospitalisation
          </h3>
          
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="medecin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Médecin responsable
                </label>
                <div class="relative">
                  <select 
                    id="medecin" 
                    v-model="approvalFormData.medecin_id"
                    class="form-select block w-full"
                    required
                  >
                    <option value="" disabled>Sélectionner un médecin</option>
                    <option 
                      v-for="medecin in medecins" 
                      :key="medecin._id" 
                      :value="medecin._id"
                    >
                      Dr. {{ medecin?.utilisateur?.nom }} {{ medecin?.utilisateur?.prenom }} - {{ medecin.specialite }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div>
                <label for="status" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Statut initial
                </label>
                <div class="relative">
                  <select 
                    id="status" 
                    v-model="approvalFormData.status"
                    class="form-select block w-full"
                    required
                  >
                    <option value="confirmée">Confirmée</option>
                    <option value="en_cours">En cours</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="dateDebut" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Date de début
                </label>
                <input 
                  type="date" 
                  id="dateDebut" 
                  v-model="approvalFormData.dateDebut"
                  class="form-input block w-full"
                  required
                >
              </div>
              
              <div>
                <label for="dateFin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Date de fin prévue
                </label>
                <input 
                type="date" 
                id="dateFin" 
                v-model="approvalFormData.dateFin"
                class="form-input block w-full"
                :min="approvalFormData.dateFin"
              >
              </div>
            </div>
            
            <div>
              <label for="remarques" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Remarques supplémentaires
              </label>
              <textarea 
                id="remarques" 
                v-model="approvalFormData.remarques"
                rows="3"
                class="form-textarea block w-full"
                placeholder="Ajoutez des remarques ou instructions spéciales..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button
            @click="closeForm"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            @click="completeApproval"
            :disabled="loading"
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center">
              <Loader2 class="h-4 w-4 animate-spin mr-2" />
              Traitement...
            </span>
            <span v-else class="flex items-center">
              <Check class="h-4 w-4 mr-2" />
              Confirmer l'hospitalisation
            </span>
          </button>
        </div>
      </div>
    </BaseModal>

    <!-- Modal détails d'hospitalisation -->
    <BaseModal
      :show="showHospitalizationDetails"
      title="Détails de l'hospitalisation"
      @close="showHospitalizationDetails = false"
      size="lg"
    >
      <div v-if="loading" class="flex justify-center items-center py-8">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <span class="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
      </div>
      <div v-else-if="!selectedHospitalization" class="py-6 text-center">
        <AlertCircle class="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <p class="text-lg font-medium text-gray-900 dark:text-white">Aucune hospitalisation sélectionnée</p>
      </div>
      <div v-else class="space-y-6">
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <UserCircle class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Informations du patient
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Patient</span>
              <span class="text-gray-900 dark:text-white font-medium">
                {{ getPatientName(selectedHospitalization.patient_id) }}
              </span>
              <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {{ getPatientContact(selectedHospitalization.patient_id) }}
              </div>
            </div>
            
            <div>
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Médecin responsable</span>
              <span class="text-gray-900 dark:text-white font-medium">
                Dr. {{ getMedecinName(selectedHospitalization.medecin_id) }}
              </span>
              <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {{ getMedecinSpecialite(selectedHospitalization.medecin_id) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <Building class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Chambre
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Numéro de chambre</span>
              <span class="text-gray-900 dark:text-white">
                {{ roomStore.getRoomById(selectedHospitalization.chambre_id)?.numero || 'Non spécifié' }}
              </span>
            </div>
            
            <div>
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Type</span>
              <span class="text-gray-900 dark:text-white">
                {{ roomStore.getRoomById(selectedHospitalization.chambre_id)?.type || 'Non spécifié' }}
              </span>
            </div>
          </div>
          
          <div class="mt-3">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Étage</span>
            <span class="text-gray-900 dark:text-white">
              {{ roomStore.getRoomById(selectedHospitalization.chambre_id)?.etage || 'Non spécifié' }}
            </span>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <Calendar class="inline-block h-5 w-5 mr-2 text-gray-500" />
            État de l'hospitalisation
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Statut actuel</span>
              <span 
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  {
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': selectedHospitalization.status === 'confirmée',
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300': selectedHospitalization.status === 'en_cours',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300': selectedHospitalization.status === 'terminée',
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': selectedHospitalization.status === 'annulée'
                  }
                ]"
              >
                {{ selectedHospitalization.status }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <Calendar class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Période d'hospitalisation
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Date de début</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(selectedHospitalization.dateDebut) }}</span>
            </div>
            
            <div>
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Date de fin prévue</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(selectedHospitalization.dateFin) || 'Non définie' }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <FileText class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Informations supplémentaires
          </h3>
          
          <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Motif d'hospitalisation</span>
            <span class="text-gray-900 dark:text-white">{{ selectedHospitalization.motif }}</span>
          </div>
          
          <div class="mt-3" v-if="selectedHospitalization.remarques">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Remarques</span>
            <div class="bg-gray-50 dark:bg-gray-600 p-3 rounded-md text-gray-900 dark:text-white">
              {{ selectedHospitalization.remarques }}
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6 space-x-3" v-if="selectedHospitalization.status !== 'terminée' && selectedHospitalization.status !== 'annulée'">
          <button
            @click="editHospitalization(selectedHospitalization)"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit2 class="inline-block w-4 h-4 mr-2" />
            Modifier
          </button>
          <button
            @click="terminateHospitalization(selectedHospitalization)"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <CheckSquare class="inline-block w-4 h-4 mr-2" />
            Terminer
          </button>
          <button
            @click="cancelHospitalization(selectedHospitalization)"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <X class="inline-block w-4 h-4 mr-2" />
            Annuler
          </button>
        </div>
      </div>
    </BaseModal>
    
    <!-- Modal pour modifier une hospitalisation -->
    <BaseModal
      :show="showEditHospitalizationForm"
      title="Modifier l'hospitalisation"
      @close="showEditHospitalizationForm = false"
      size="lg"
    >
      <div v-if="loading" class="flex justify-center items-center py-8">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <span class="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
      </div>
      <div v-else-if="!selectedHospitalization" class="py-6 text-center">
        <AlertCircle class="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <p class="text-lg font-medium text-gray-900 dark:text-white">Aucune hospitalisation sélectionnée</p>
      </div>
      <div v-else class="space-y-6">
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <UserCircle class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Informations du patient
          </h3>
          
          <div class="py-2 px-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
            <span class="font-medium text-gray-900 dark:text-white">
              {{ getPatientName(selectedHospitalization.patient_id) }}
            </span>
            <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {{ getPatientContact(selectedHospitalization.patient_id) }}
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <Stethoscope class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Médecin responsable
          </h3>
          
          <div>
            <label for="medecin_edit" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sélectionner un médecin
            </label>
            <select
              id="medecin_edit"
              v-model="editHospitalizationForm.medecin_id"
              class="form-select block w-full"
              required
            >
              <option v-for="medecin in medecins" :key="medecin._id" :value="medecin._id">
                Dr. {{ medecin.nom }} {{ medecin.prenom }} - {{ medecin.specialite }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <Building class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Chambre
          </h3>
          
          <div>
            <label for="chambre_edit" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sélectionner une chambre
            </label>
            <select
              id="chambre_edit"
              v-model="editHospitalizationForm.chambre_id"
              class="form-select block w-full"
              required
            >
              <option
                v-for="room in availableRoomsForEdit"
                :key="room._id"
                :value="room._id"
                :selected="room._id === selectedHospitalization.chambre_id"
              >
                Chambre {{ room.numero }} - {{ room.type }} (Étage {{ room.etage }})
                <span v-if="room._id === selectedHospitalization.chambre_id"> - Chambre actuelle</span>
              </option>
            </select>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <Calendar class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Période d'hospitalisation
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="dateDebut_edit" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Date de début
              </label>
              <input
                id="dateDebut_edit"
                type="date"
                :value="formatDate(editHospitalizationForm.dateDebut)" @input="editHospitalizationForm.dateDebut = $event.target.value"
                class="form-input block w-full"
                required
              >
            </div>
            
            <div>
              <label for="dateFin_edit" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Date de fin prévue
              </label>
              <input
                id="dateFin_edit"
                type="date"
              :value="formatDate(editHospitalizationForm.dateFin)" 
                @input="editHospitalizationForm.dateFin = $event.target.value"
                class="form-input block w-full"
              >
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
            <FileText class="inline-block h-5 w-5 mr-2 text-gray-500" />
            Informations supplémentaires
          </h3>
          
          <div class="space-y-4">
            <div>
              <label for="status_edit" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Statut
              </label>
              <select
                id="status_edit"
                v-model="editHospitalizationForm.status"
                class="form-select block w-full"
                required
              >
                <option value="confirmée">Confirmée</option>
                <option value="en_cours">En cours</option>
              </select>
            </div>
            
            <div>
              <label for="remarques_edit" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Remarques
              </label>
              <textarea
                id="remarques_edit"
                v-model="editHospitalizationForm.remarques"
                rows="3"
                class="form-textarea block w-full"
                placeholder="Remarques supplémentaires..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button
            @click="showEditHospitalizationForm = false"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            @click="saveHospitalizationEdit"
            :disabled="loading"
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center">
              <Loader2 class="h-4 w-4 animate-spin mr-2" />
              Sauvegarde...
            </span>
            <span v-else class="flex items-center">
              <Check class="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </span>
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHospitalizationStore } from '@/stores/hospitalization'
import { usePatientStore } from '@/stores/patients'
import { useRoomStore } from '@/stores/room'
import { useDoctorStore } from '@/stores/doctors'
import { useToast } from '@/composables/useToast'
import {
  Search, Filter, Edit2, Trash2, LayoutGrid, List,
  Calendar, CalendarOff, ArrowUpDown,
  Loader2, RotateCcw,
  UserCircle, Building, AlertCircle, FileText, MessageSquare, Check, X, CheckCircle, Grid, PlusCircle, User, Edit, Trash, Stethoscope,
  Database, Eye, CheckSquare, Bed
} from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import HospitalizationRequestRow from '@/components/hospitalization/HospitalizationRequestRow.vue'
import HospitalizationRequestCard from '@/components/hospitalization/HospitalizationRequestCard.vue'

// Stores et composables
const hospitalizationStore = useHospitalizationStore()
const patientStore = usePatientStore()
const roomStore = useRoomStore()
const doctorStore = useDoctorStore()
const toast = useToast()

// État local
const viewMode = ref('grid')
const activeTab = ref('requests')
const showApprovalForm = ref(false)
const selectedRequestForApproval = ref(null)
const loading = ref(false)
const patientsLoaded = ref(false)
const roomsLoaded = ref(false)
const searchTerm = ref('')
const urgenceFilter = ref('')
const dateFilter = ref('')
const approvalFormData = ref({
  patient_id: '',
  medecin_id: '',
  chambre_id: '',
  dateDebut: new Date().toISOString().substr(0, 10),
  dateFin: '',
  motif: '',
  status: '',
  remarques: ''
})

// État pour la gestion des hospitalisations
const hospitalizationSearchTerm = ref('')
const hospitalizationStatusFilter = ref('')
const showEditHospitalizationForm = ref(false)
const showHospitalizationDetails = ref(false)
const selectedHospitalization = ref(null)
const editHospitalizationForm = ref({
  medecin_id: '',
  chambre_id: '',
  dateDebut: '',
  dateFin: '',
  status: '',
  remarques: ''
})

// Computed properties
const pendingRequests = computed(() => {
  return hospitalizationStore.roomTicketRequests || [];
})

const filteredRequests = computed(() => {
  let result = [...pendingRequests.value]

  if (searchTerm.value) {
    const searchTermLower = searchTerm.value.toLowerCase()
    result = result.filter(r => {
      const patientName = getPatientName(r.patient_id).toLowerCase()
      const medecinName = getMedecinName(r.medecin_id).toLowerCase()
      return patientName.includes(searchTermLower) || medecinName.includes(searchTermLower)
    })
  }

  if (urgenceFilter.value) {
    result = result.filter(r => r.niveauUrgence === urgenceFilter.value)
  }

  if (dateFilter.value) {
    const filterDate = new Date(dateFilter.value)
    result = result.filter(r => {
      const requestDate = new Date(r.dateDebut)
      return requestDate.toDateString() === filterDate.toDateString()
    })
  }

  return result
})

const hasUnreadRequests = computed(() => {
  return pendingRequests.value.some(req => req.isNew);
})

const unreadRequestsCount = computed(() => {
  return pendingRequests.value.filter(req => req.isNew).length;
})

const medecins = computed(() => hospitalizationStore.medecins || [])
const availableRooms = computed(() => roomStore.availableRooms || [])
const patients = computed(() => hospitalizationStore.patients || [])

// Computed properties pour les hospitalisations
const hospitalizations = computed(() => {
  return hospitalizationStore.hospitalizations || [];
})

const filteredHospitalizations = computed(() => {
  let result = [...hospitalizations.value]

  if (hospitalizationSearchTerm.value) {
    const searchTermLower = hospitalizationSearchTerm.value.toLowerCase()
    result = result.filter(h => {
      const patientName = getPatientName(h.patient_id).toLowerCase()
      const medecinName = getMedecinName(h.medecin_id).toLowerCase()
      return patientName.includes(searchTermLower) || medecinName.includes(searchTermLower)
    })
  }

  if (hospitalizationStatusFilter.value) {
    result = result.filter(h => h.status === hospitalizationStatusFilter.value)
  }

  return result
})

const availableRoomsForEdit = computed(() => {
  // Filtrer les chambres disponibles, mais inclure également la chambre actuellement attribuée
  return roomStore.rooms.filter(room => 
    room.etat === 'disponible' || 
    (selectedHospitalization.value && room._id !== selectedHospitalization.value.chambre_id)
  )
})

// Méthodes
const resetFilters = () => {
  searchTerm.value = ''
  urgenceFilter.value = ''
  dateFilter.value = ''
}

const applyFilters = () => {
  // Comme les filtres sont appliqués localement, il n'y a pas besoin
  // de refaire une requête au serveur
  toast.info('Filtres appliqués')
}

const approveRequest = async (request) => {
  if (!request) return;
  
  selectedRequestForApproval.value = request;

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };
  
  // Précharger les chambres disponibles si nécessaire
  if (availableRooms.value.length === 0) {
    try {
      loading.value = true;
      toast.info('Chargement des chambres disponibles...');
      await roomStore.fetchRooms();
    } catch (error) {
      console.error('Erreur lors du chargement des chambres:', error);
      toast.error('Erreur lors du chargement des chambres disponibles.');
    } finally {
      loading.value = false;
    }
  }
  
  // Préparer les données du formulaire avec les informations de la demande
  approvalFormData.value = {
    patient_id: request.patient_id || '',
    medecin_id: request.medecin_id || '', // Garder le médecin qui a fait la demande
    chambre_id: '',
    dateDebut: formatDateForInput(request.dateDebut),
    dateFin: formatDateForInput(request.dateFin), // À compléter par l'admin
    motif: request.motif || '',
    status: 'confirmée', // Statut par défaut pour les hospitalisations approuvées
    remarques: `Demande approuvée le ${new Date().toLocaleDateString()}. Niveau d'urgence: ${request.niveauUrgence || 'Normal'}.`
  };
  
  showApprovalForm.value = true;
  
  // Marquer la demande comme lue si elle est nouvelle
  if (request.isNew) {
    hospitalizationStore.markRequestAsRead(request._id)
      .catch(error => {
        console.error('Erreur lors du marquage de la demande comme lue:', error);
      });
  }
}

const rejectRequest = async (request) => {
  if (!request) return;
  

  // Demander confirmation avant de rejeter
  if (!confirm('Êtes-vous sûr de vouloir rejeter cette demande d\'hospitalisation ?')) {
    return;
  }
  
  loading.value = true;
  
  try {
    // Mettre à jour le statut de la demande
    await hospitalizationStore.updateRequestStatus(request._id, 'reject');
    
    // Afficher une notification
    toast.success('Demande rejetée avec succès.');
    
    // Recharger les demandes en attente
    await hospitalizationStore.fetchRoomTicketRequests();
    } catch (error) {
    toast.error(`Erreur lors du rejet: ${error.message || 'Une erreur est survenue'}`);
  } finally {
    loading.value = false;
  }
}

const completeApproval = async () => {
  try {
    loading.value = true;
    
    // Vérification des données requises
    if (!approvalFormData.value.patient_id) {
      throw new Error('ID du patient manquant');
    }
    
    if (!approvalFormData.value.medecin_id) {
      throw new Error('ID du médecin manquant');
    }
    
    if (!approvalFormData.value.chambre_id) {
      throw new Error('Veuillez sélectionner une chambre');
    }
    
    if (!selectedRequestForApproval.value) {
      throw new Error('Demande d\'hospitalisation invalide');
    }
    
    // Récupérer l'ID correct de la demande (peut être _id ou id selon l'API)
    const requestId = selectedRequestForApproval.value._id || selectedRequestForApproval.value.id;
    
    if (!requestId) {
      throw new Error('ID de la demande non disponible');
    }
    
    // Assurer que les données sont des chaînes de caractères
    const requestData = {
      patient_id: String(approvalFormData.value.patient_id),
      medecin_id: String(approvalFormData.value.medecin_id),
      chambre_id: String(approvalFormData.value.chambre_id),
      motif: approvalFormData.value.motif || selectedRequestForApproval.value.motif,
      dateDebut: approvalFormData.value.dateDebut || new Date().toISOString().split('T')[0],
      dateFin: approvalFormData.value.dateFin || null,
      status: approvalFormData.value.status || 'active',
      demande_id: requestId,
      remarques: approvalFormData.value.remarques || ''
    };
    
    console.log('Données d\'hospitalisation à envoyer:', requestData);
    
    // Création de l'hospitalisation
    const result = await hospitalizationStore.createHospitalization(requestData);
    
    if (result.success) {
      console.log('Hospitalisation créée avec succès:', result.data);
      
      try {
        // Mise à jour du statut de la demande
        await hospitalizationStore.updateRequestStatus(requestId, 'approved');
        console.log('Statut de la demande mis à jour avec succès');
      } catch (statusError) {
        console.warn('Erreur lors de la mise à jour du statut de la demande, mais l\'hospitalisation a été créée:', statusError);
        // Ne pas interrompre le flux si cette étape échoue, car l'hospitalisation a été créée
      }
      
      try {
        // Mise à jour du statut de la chambre
        await roomStore.updateRoomStatus(approvalFormData.value.chambre_id, 'occupied');
        console.log('Statut de la chambre mis à jour avec succès');
      } catch (roomError) {
        console.warn('Erreur lors de la mise à jour du statut de la chambre:', roomError);
        // Ne pas interrompre le flux si cette étape échoue
      }
      
      toast.success('Hospitalisation approuvée avec succès');
      showApprovalForm.value = false;
      resetApprovalForm();
      
      // Rafraîchir les données
      await loadRequests();
    } else {
      throw new Error(result.message || 'Échec de la création de l\'hospitalisation');
    }
  } catch (error) {
    console.error('Erreur lors de l\'approbation:', error);
    toast.error(`Erreur lors de l'approbation: ${error.message || error}`);
  } finally {
    loading.value = false;
  }
};

const closeForm = () => {
  showApprovalForm.value = false;
  selectedRequestForApproval.value = null;
}

// Fonction pour réinitialiser le formulaire d'approbation
const resetApprovalForm = () => {
  approvalFormData.value = {
    patient_id: '',
    medecin_id: '',
    chambre_id: '',
    dateDebut: new Date().toISOString().substr(0, 10),
    dateFin: '',
    motif: '',
    status: 'confirmée',
    remarques: ''
  };
  selectedRequestForApproval.value = null;
}

const formatDate = (date) => {
  if (!date) return 'Date non spécifiée';
  return new Date(date).toLocaleDateString('fr-FR');
}

// Fonction pour ouvrir les détails du patient dans un nouvel onglet ou rediriger vers la page du patient
const openPatientDetails = () => {
  if (!selectedRequestForApproval.value?.patient_id) {
    toast.error('ID du patient non disponible');
    return;
  }
  
  const patientId = selectedRequestForApproval.value.patient_id;
  // Ouvrir la page du patient dans un nouvel onglet
  // Note: Adapter l'URL à la structure de votre application
  window.open(`/patients/${patientId}`, '_blank');
}

// Fonctions pour gérer les hospitalisations
const getRoomNumber = (roomId) => {
  if (!roomId) return 'Non spécifiée';
  
  // Check if rooms are loaded
  if (roomStore.rooms.length === 0) {
    // Try to load rooms if not already loaded
    roomStore.fetchRooms().catch(error => {
      console.error('Error loading rooms:', error);
    });
    return 'Chargement...';
  }
  
  const room = roomStore.rooms.find(r => r._id === roomId);
  
  if (!room) {
    console.warn(`Room not found for ID: ${roomId}`);
    return 'Chambre non trouvée';
  }
  
  return `Chambre ${room.numero}`;
}

const loadHospitalizations = async () => {
  try {
    loading.value = true;
    await hospitalizationStore.fetchHospitalizations();
  } catch (error) {
    console.error('Erreur lors du chargement des hospitalisations:', error);
    toast.error('Erreur lors du chargement des hospitalisations');
  } finally {
    loading.value = false;
  }
}

const viewHospitalizationDetails = (hospitalization) => {
  selectedHospitalization.value = hospitalization;
  showHospitalizationDetails.value = true;
}

const editHospitalization = (hospitalization) => {
  selectedHospitalization.value = hospitalization;
  
  // Préremplir le formulaire avec les valeurs actuelles
  editHospitalizationForm.value = {
    medecin_id: hospitalization.medecin_id,
    chambre_id: hospitalization.chambre_id,
    dateDebut: hospitalization.dateDebut,
    dateFin: hospitalization.dateFin || '',
    status: hospitalization.status,
    remarques: hospitalization.remarques || ''
  };
  
  showHospitalizationDetails.value = false;
  showEditHospitalizationForm.value = true;
}

const saveHospitalizationEdit = async () => {
  try {
    loading.value = true;
    
    if (!selectedHospitalization.value) {
      throw new Error('Aucune hospitalisation sélectionnée');
    }
    
    const result = await hospitalizationStore.updateHospitalization(
      selectedHospitalization.value._id,
      editHospitalizationForm.value
    );
    
    if (result) {
      toast.success('Hospitalisation mise à jour avec succès');
      showEditHospitalizationForm.value = false;
      
      // Si la chambre a changé, mettre à jour les statuts des chambres
      if (selectedHospitalization.value.chambre_id !== editHospitalizationForm.value.chambre_id) {
        try {
          // Libérer l'ancienne chambre
          await roomStore.updateRoomStatus(selectedHospitalization.value.chambre_id, 'disponible');
          
          // Occuper la nouvelle chambre
          await roomStore.updateRoomStatus(editHospitalizationForm.value.chambre_id, 'occupied');
        } catch (roomError) {
          console.warn('Erreur lors de la mise à jour du statut des chambres:', roomError);
        }
      }
      
      // Rafraîchir les données
      await loadHospitalizations();
    }
  } catch (error) {
    console.error('Erreur lors de la modification de l\'hospitalisation:', error);
    toast.error(`Erreur lors de la modification: ${error.message || error}`);
  } finally {
    loading.value = false;
  }
}

const terminateHospitalization = async (hospitalization) => {
  if (!hospitalization) return;
  
  if (!confirm('Êtes-vous sûr de vouloir terminer cette hospitalisation ?')) {
    return;
  }
  
  try {
    loading.value = true;
    
    const updateData = {
      ...hospitalization,
      status: 'terminée',
      dateFin: hospitalization.dateFin || new Date().toISOString().split('T')[0]
    };
    
    const result = await hospitalizationStore.updateHospitalization(hospitalization._id, updateData);
    
    if (result) {
      toast.success('Hospitalisation terminée avec succès');
      
      // Libérer la chambre
      await roomStore.updateRoomStatus(hospitalization.chambre_id, 'disponible');
      
      // Fermer le modal si ouvert
      showHospitalizationDetails.value = false;
      
      // Rafraîchir les données
      await loadHospitalizations();
    }
  } catch (error) {
    console.error('Erreur lors de la terminaison de l\'hospitalisation:', error);
    toast.error(`Erreur lors de la terminaison: ${error.message || error}`);
  } finally {
    loading.value = false;
  }
}

const cancelHospitalization = async (hospitalization) => {
  if (!hospitalization) return;
  
  if (!confirm('Êtes-vous sûr de vouloir annuler cette hospitalisation ?')) {
    return;
  }
  
  try {
    loading.value = true;
    
    const updateData = {
      ...hospitalization,
      status: 'annulée'
    };
    
    const result = await hospitalizationStore.updateHospitalization(hospitalization._id, updateData);
    
    if (result) {
      toast.success('Hospitalisation annulée avec succès');
      
      // Libérer la chambre
      await roomStore.updateRoomStatus(hospitalization.chambre_id, 'disponible');
      
      // Fermer le modal si ouvert
      showHospitalizationDetails.value = false;
      
      // Rafraîchir les données
      await loadHospitalizations();
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'hospitalisation:', error);
    toast.error(`Erreur lors de l'annulation: ${error.message || error}`);
  } finally {
    loading.value = false;
  }
}

const loadPatients = async () => {
  try {
    loading.value = true;
    await patientStore.fetchPatients();
    patientsLoaded.value = true;
    console.log('Patients chargés:', patients.value.length);
  } catch (error) {
    console.error('Erreur lors du chargement des patients:', error);
    toast.error('Erreur lors du chargement des patients');
  } finally {
    loading.value = false;
  }
}

const loadRequests = async () => {
  try {
    loading.value = true;
    await hospitalizationStore.fetchRoomTicketRequests();
    console.log('Demandes chargées:', pendingRequests.value.length);
  } catch (error) {
    console.error('Erreur lors du chargement des demandes:', error);
    toast.error('Erreur lors du chargement des demandes');
  } finally {
    loading.value = false;
  }
}

// Fonctions pour récupérer les informations des patients et médecins
const getPatientName = (patientId) => {
  if (!patientId) return 'Patient inconnu';
  
  // First check in patientStore
  const patient = patientStore.getPatientById(patientId);
  if (patient) {
    return `${patient?.utilisateur?.nom} ${patient?.utilisateur?.prenom}`;
  }
  
  // If not found in patientStore, check in hospitalizations
  const hospitalizationWithPatient = hospitalizations.value.find(h => 
    h.patient_id === patientId && h.patient?.utilisateur
  );
  
  if (hospitalizationWithPatient?.patient?.utilisateur) {
    return `${hospitalizationWithPatient.patient.utilisateur.nom} ${hospitalizationWithPatient.patient.utilisateur.prenom}`;
  }
  
  return 'Patient inconnu';
}

const getPatientAge = (patientId) => {
  if (!patientId) return '';
  const patient = patientStore.getPatientById(patientId);
  if (!patient || !patient.dateNaissance) return '';
  
  const birthDate = new Date(patient.dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  
  // Ajustement de l'âge si l'anniversaire n'est pas encore passé cette année
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

const getPatientContact = (patientId) => {
  if (!patientId) return '';
  const patient = patientStore.getPatientById(patientId);
  return patient ? patient.telephone || patient.email || '' : '';
}

const getMedecinName = (medecinId) => {
  if (!medecinId) return 'Médecin inconnu';
  
  // First check if we have the medecin in the medecins array
  const medecinFromArray = medecins.value.find(m => m._id === medecinId);
  if (medecinFromArray) {
    if (medecinFromArray.utilisateur) {
      return `${medecinFromArray.utilisateur.nom || ''} ${medecinFromArray.utilisateur.prenom || ''}`.trim();
    } else if (medecinFromArray.nom && medecinFromArray.prenom) {
      return `${medecinFromArray.nom} ${medecinFromArray.prenom}`.trim();
    }
  }
  
  // Check in doctorStore as fallback
  const medecinFromDoctorStore = doctorStore.doctors.find(m => m._id === medecinId);
  if (medecinFromDoctorStore?.utilisateur) {
    return `${medecinFromDoctorStore.utilisateur.nom || ''} ${medecinFromDoctorStore.utilisateur.prenom || ''}`.trim();
  }
  
  // If we still don't have a name, check if any hospitalization has this medecin
  const hospitalizationWithMedecin = hospitalizations.value.find(h => 
    h.medecin_id === medecinId && h.medecin?.utilisateur
  );
  
  if (hospitalizationWithMedecin?.medecin?.utilisateur) {
    return `${hospitalizationWithMedecin.medecin.utilisateur.nom || ''} ${hospitalizationWithMedecin.medecin.utilisateur.prenom || ''}`.trim();
  }
  
  return 'Médecin inconnu';
}

const getMedecinSpecialite = (medecinId) => {
  if (!medecinId) return '';
  const medecin = medecins.value.find(m => m._id === medecinId);
  console.log(medecin)
  return medecin ? medecin.specialite || '' : '';
}

const loadMedecins = async () => {
  try {
    loading.value = true;
    await hospitalizationStore.fetchMedecins();
  } catch (error) {
    console.error('Erreur lors du chargement des médecins:', error);
    toast.error('Erreur lors du chargement des médecins');
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    console.log('Initialisation...');
    await roomStore.fetchRooms();
    console.log('Rooms loaded:', roomStore.rooms.length);
    // Charger les demandes, patients, chambres et hospitalisations
    await hospitalizationStore.fetchInitialData();
    
    // Chargement explicite des hospitalisations
    await loadHospitalizations();
    
    // Chargement des médecins
    await loadMedecins();
    
    console.log('Demandes chargées:', pendingRequests.value.length);
    console.log('Hospitalisations chargées:', hospitalizations.value.length);
    
    // Charger les patients via le store patient si nécessaire
    if (!patientsLoaded.value) {
      await loadPatients();
    }
    
    // S'assurer que roomsLoaded est mis à true
    roomsLoaded.value = true;
    
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    toast.error('Erreur lors du chargement des données');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input, .form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}
</style>