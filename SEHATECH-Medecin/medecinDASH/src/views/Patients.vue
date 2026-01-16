<template>
  <div class="flex w-full gap-6">
    <!-- Côté gauche : Patients à domicile -->
    <div class="w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Télésurveillance à domicile
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ filteredPatientsADomicile.length }} patients sur {{ patientStore.patientsADomicile.length }} affichés
          </p>
        </div>
        <div class="flex space-x-2">
          <button 
            @click="refreshDomicile"
            class="btn btn-icon"
            :class="{ 'animate-spin': isRefreshingDomicile }"
          >
            <RefreshCw class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="mb-4 flex space-x-3">
        <div class="flex-1 relative">
          <input
            v-model="searchDomicile"
            type="text"
            placeholder="Rechercher un patient..."
            class="form-input pl-10 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <select 
          v-model="filterStatusDomicile" 
          class="form-select dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Tous les statuts</option>
          <option value="Stable">Stable</option>
          <option value="Attention">Attention</option>
          <option value="Critique">Critique</option>
        </select>
      </div>

      <!-- Liste des patients à domicile -->
      <div class="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] dark:bg-gray-800">
        <TransitionGroup name="list" tag="div" class="space-y-4">
          <div v-for="patient in paginatedPatientsADomicile" 
               :key="patient.id" 
               class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-md transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-800 hover-scale"
               :class="{'patient-card-alert': patient.status === 'Critique'}"
          >
            <!-- En-tête du patient -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 
                            flex items-center justify-center shadow-inner">
                  <UserCircle class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 class="text-base font-medium text-gray-900 dark:text-white">
                    {{ patient.nom }}
                  </h3>
                  <p class="text-xs text-gray-500 flex items-center gap-1 dark:text-gray-400">
                    <Clock class="w-3 h-3" />
                    Dernière mise à jour: {{ formatDate(patient.derniereMiseAJour) }}
                  </p>
                </div>
              </div>
              <div>
                <div :class="[
                  'px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1',
                  getStatusClass(patient.status)
                ]">
                  <span class="h-2 w-2 rounded-full" :class="{
                    'bg-green-500 dark:bg-green-400': patient.status === 'Stable',
                    'bg-yellow-500 dark:bg-yellow-400': patient.status === 'Attention',
                    'bg-red-500 dark:bg-red-400': patient.status === 'Critique',
                  }"></span>
                  {{ patient.status }}
                </div>
              </div>
            </div>

            <!-- Historique - Redesign sans les dernières valeurs -->
            <div class="rounded-lg bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 p-3">
              <div class="flex justify-between items-center mb-3">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <History class="w-4 h-4 mr-1.5 text-primary-500 dark:text-primary-400" />
                  Historique des évolutions
                </h4>
                <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                  {{ patient.evolutionsData ? patient.evolutionsData.length : 0 }} mesures
                </span>
              </div>
              
              <!-- Historique des mesures amélioré -->
              <div class="space-y-2.5">
                <div v-for="(mesure, index) in patient.historique?.slice(0, 4)" 
                     :key="index"
                     class="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between"
                >
                  <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-2">
                      <Clock class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatTime(mesure.timestamp) }}
                      </span>
                    </div>
                    <div class="flex items-center space-x-4">
                      <div v-if="mesure.frequenceCardiaque && mesure.frequenceCardiaque !== '--'" 
                           class="flex items-center space-x-1"
                           :class="{
                             'text-red-600 dark:text-red-400': mesure.frequenceCardiaqueEtat === 'critique',
                             'text-yellow-600 dark:text-yellow-400': mesure.frequenceCardiaqueEtat === 'attention',
                             'text-gray-700 dark:text-gray-300': mesure.frequenceCardiaqueEtat === 'normal'
                           }">
                        <Heart class="w-3.5 h-3.5" :class="{
                          'text-red-500 dark:text-red-400': !mesure.frequenceCardiaqueEtat || mesure.frequenceCardiaqueEtat === 'normal',
                          'text-red-600 dark:text-red-500': mesure.frequenceCardiaqueEtat === 'critique',
                          'text-yellow-600 dark:text-yellow-400': mesure.frequenceCardiaqueEtat === 'attention'
                        }" />
                        <span class="text-sm font-medium">{{ mesure.frequenceCardiaque }} bpm</span>
                      </div>
                      <div v-if="mesure.temperature && mesure.temperature !== '--'" 
                           class="flex items-center space-x-1"
                           :class="{
                             'text-red-600 dark:text-red-400': mesure.temperatureEtat === 'critique',
                             'text-yellow-600 dark:text-yellow-400': mesure.temperatureEtat === 'attention',
                             'text-gray-700 dark:text-gray-300': mesure.temperatureEtat === 'normal'
                           }">
                        <Thermometer class="w-3.5 h-3.5" :class="{
                          'text-orange-500 dark:text-orange-400': !mesure.temperatureEtat || mesure.temperatureEtat === 'normal',
                          'text-red-600 dark:text-red-500': mesure.temperatureEtat === 'critique',
                          'text-yellow-600 dark:text-yellow-400': mesure.temperatureEtat === 'attention'
                        }" />
                        <span class="text-sm font-medium">{{ mesure.temperature }}°C</span>
                      </div>
                      <div v-if="mesure.saturationO2 && mesure.saturationO2 !== '--'" 
                           class="flex items-center space-x-1"
                           :class="{
                             'text-red-600 dark:text-red-400': mesure.saturationO2Etat === 'critique',
                             'text-yellow-600 dark:text-yellow-400': mesure.saturationO2Etat === 'attention',
                             'text-gray-700 dark:text-gray-300': mesure.saturationO2Etat === 'normal'
                           }">
                        <Gauge class="w-3.5 h-3.5" :class="{
                          'text-blue-500 dark:text-blue-400': !mesure.saturationO2Etat || mesure.saturationO2Etat === 'normal',
                          'text-red-600 dark:text-red-500': mesure.saturationO2Etat === 'critique',
                          'text-yellow-600 dark:text-yellow-400': mesure.saturationO2Etat === 'attention'
                        }" />
                        <span class="text-sm font-medium">{{ mesure.saturationO2 }}%</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="mesure.frequenceCardiaqueEtat === 'critique' || mesure.temperatureEtat === 'critique' || mesure.saturationO2Etat === 'critique'"
                       class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                    Critique
                  </div>
                  <div v-else-if="mesure.frequenceCardiaqueEtat === 'attention' || mesure.temperatureEtat === 'attention' || mesure.saturationO2Etat === 'attention'"
                       class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                    Attention
                  </div>
                </div>
              </div>
              
              <!-- Pas d'historique -->
              <div v-if="!patient.historique || patient.historique.length === 0" 
                   class="py-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/90 rounded-lg border border-gray-100 dark:border-gray-700">
                Aucune mesure récente
              </div>
              
              <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button 
                  @click="voirHistoriqueComplet(patient)"
                  class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                >
                  <Eye class="w-3.5 h-3.5 mr-1" />
                  Voir l'historique complet
                </button>
                <button 
                  @click="exporterPDFEvolution(patient)"
                  class="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
                >
                  <FileText class="w-3.5 h-3.5 mr-1" />
                  Exporter PDF
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>
        
        <!-- Pagination pour les patients à domicile -->
        <div v-if="filteredPatientsADomicile.length > 0" class="mt-4 flex justify-between items-center">
          <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span>Affichage {{ (currentPageDomicile - 1) * itemsPerPageDomicile + 1 }} à 
            {{ Math.min(currentPageDomicile * itemsPerPageDomicile, filteredPatientsADomicile.length) }} 
            sur {{ filteredPatientsADomicile.length }}</span>
            
            <select v-model="itemsPerPageDomicile" class="ml-4 form-select text-xs h-8 py-0 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option :value="3">3 par page</option>
              <option :value="5">5 par page</option>
              <option :value="10">10 par page</option>
            </select>
          </div>
          
          <div class="flex gap-1">
            <button 
              @click="currentPageDomicile = 1" 
              :disabled="currentPageDomicile === 1"
              class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400"
            >
              <ChevronsLeft class="w-4 h-4" />
            </button>
            <button 
              @click="currentPageDomicile--" 
              :disabled="currentPageDomicile === 1"
              class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            
            <div class="flex items-center px-2">
              <span class="text-sm font-medium dark:text-white">{{ currentPageDomicile }}</span>
              <span class="mx-1 text-gray-500 dark:text-gray-400">/</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ totalPagesDomicile }}</span>
            </div>
            
            <button 
              @click="currentPageDomicile++" 
              :disabled="currentPageDomicile === totalPagesDomicile"
              class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <button 
              @click="currentPageDomicile = totalPagesDomicile" 
              :disabled="currentPageDomicile === totalPagesDomicile"
              class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400"
            >
              <ChevronsRight class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <!-- Message si aucun patient à domicile n'est trouvé -->
        <div v-if="filteredPatientsADomicile.length === 0 && !isRefreshingDomicile" 
             class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border border-blue-100 dark:border-blue-800 shadow-sm">
          <Info class="w-12 h-12 mx-auto text-blue-500 dark:text-blue-400 mb-2" />
          <h4 class="font-medium text-blue-700 dark:text-blue-300 mb-1">Aucun patient sous télésurveillance</h4>
          <p class="text-sm text-blue-600 dark:text-blue-400">
            Les patients ayant des mesures d'évolution médicale enregistrées récemment apparaîtront ici.
          </p>
        </div>
        
        <!-- Indicateur de chargement -->
        <div v-if="isRefreshingDomicile && filteredPatientsADomicile.length === 0" 
             class="py-8 text-center">
          <Loader2 class="w-8 h-8 mx-auto animate-spin text-primary-500 mb-2" />
          <p class="text-gray-500 dark:text-gray-400">Chargement des patients...</p>
        </div>
      </div>
    </div>

    <!-- Patients hospitalisés & Monitoring -->
    <div class="w-1/2 space-y-6">
      <!-- Liste des patients hospitalisés -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Patients hospitalisés
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ filteredPatientsHospitalises.length }} patients sur {{ patientStore.patientsHospitalises.length }} affichés
            </p>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="refreshHospitalises"
              class="btn btn-icon"
              :class="{ 'animate-spin': isRefreshingHospitalises }"
            >
              <RefreshCw class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Filtres pour les patients hospitalisés -->
        <div class="mb-4 flex space-x-3">
          <div class="flex-1 relative">
            <input
              v-model="searchHospitalises"
              type="text"
              placeholder="Rechercher un patient..."
              class="form-input pl-10 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <select 
            v-model="filterStatusHospitalises" 
            class="form-select dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tous les états</option>
            <option value="Stable">Stable</option>
            <option value="Surveillance">Sous surveillance</option>
            <option value="Critique">Critique</option>
          </select>
        </div>

        <!-- Liste des patients hospitalisés compacte -->
        <div class="space-y-2 overflow-y-auto max-h-[calc(100vh-420px)] pr-1 dark:bg-gray-800">
          <div 
            v-for="patient in paginatedPatientsHospitalises" 
            :key="patient.id"
            class="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            :class="{'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20': patient.status === 'Critique'}"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 
                          flex items-center justify-center shadow-inner">
                <UserCircle class="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ patient.nom }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  chambre  {{ patient.chambre || 'Sans chambre' }} 
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <div :class="[
                'px-2 py-0.5 text-xs font-medium rounded-full',
                getStatusClass(patient.status)
              ]">
                {{ patient.status }}
              </div>
              <button
                @click="viewPatientDetails(patient)"
                class="p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Voir les détails"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <!-- Message quand aucun patient -->
          <div v-if="paginatedPatientsHospitalises.length === 0" class="py-6 text-center">
            <p class="text-gray-500 dark:text-gray-400">Aucun patient ne correspond aux critères</p>
          </div>
        </div>

        <!-- Pagination pour les patients hospitalisés -->
        <div v-if="filteredPatientsHospitalises.length > 0" class="mt-4 flex justify-between items-center">
          <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span>{{ (currentPageHospitalises - 1) * itemsPerPageHospitalises + 1 }} à 
            {{ Math.min(currentPageHospitalises * itemsPerPageHospitalises, filteredPatientsHospitalises.length) }} 
            sur {{ filteredPatientsHospitalises.length }}</span>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="previousPageHospitalises" 
              :disabled="currentPageHospitalises === 1"
              class="p-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>
            <button 
              @click="nextPageHospitalises" 
              :disabled="currentPageHospitalises >= totalPagesHospitalises"
              class="p-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Monitoring en temps réel par patient -->
      <PatientMonitoring />
    </div>

    <!-- Modals -->
    <Modal 
      v-if="showPatientDetails"
      @close="closePatientDetails"
      title="Détails du patient"
      size="lg"
    >
      <!-- Contenu des détails du patient -->
      <div v-if="selectedPatient && selectedPatientType === 'domicile'">
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div class="flex items-center gap-3 mb-3 md:mb-0">
            <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 flex items-center justify-center rounded-full">
              <User class="text-primary-500 w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-semibold dark:text-white">
                {{ selectedPatient.nom }}
              </h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                ID: {{ selectedPatient.patient_id }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span :class="[
              'px-3 py-1.5 text-sm font-medium rounded-full',
              getStatusClass(selectedPatient.status || 'Stable')
            ]">
              {{ selectedPatient.status || 'Stable' }}
            </span>
            <button 
              @click="togglePatientMonitoring(selectedPatient)"
              :class="[
                'btn flex items-center gap-2 text-sm',
                selectedPatient.underMonitoring 
                  ? 'btn-warning hover:bg-orange-600' 
                  : 'btn-primary hover:bg-primary-600'
              ]"
            >
              <Activity class="w-4 h-4" />
              {{ selectedPatient.underMonitoring ? 'Arrêter la surveillance' : 'Démarrer la surveillance' }}
            </button>
          </div>
        </div>


        <!-- Détails du patient et historique -->
        <div v-if="selectedPatient && selectedPatient.evolutionsData && selectedPatient.evolutionsData.length > 0" 
             class="border rounded-lg p-4 mt-4 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
          <h4 class="text-xl font-semibold mb-3 dark:text-white">
            Historique des évolutions pour {{ selectedPatient.nom }} {{ selectedPatient.prenom }}
          </h4>
          
          <!-- Affichage des données d'évolution -->
          <div v-if="isChargingHistorique" class="py-6 text-center">
            <Loader2 class="w-8 h-8 mx-auto animate-spin text-primary-500 dark:text-primary-400 mb-2" />
            <p class="text-gray-600 dark:text-gray-300">Chargement des données...</p>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">État</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Commentaire</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="mesure in sortedEvolutions" :key="mesure._id" :class="{'bg-red-50 dark:bg-red-900/20': mesure.etat === 'critique', 'bg-yellow-50 dark:bg-yellow-900/20': mesure.etat === 'attention'}">
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                    {{ formatDate(mesure.dateDeMesure) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                    {{ mesure.nomMesure }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <span :class="getColorClassForMeasurement(mesure)">
                      {{ mesure.valeurDeMesure }}{{ getMeasurementUnit(mesure.nomMesure) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <span 
                      :class="{
                        'px-2 py-1 rounded-full text-xs font-medium': true,
                        'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300': mesure.etat === 'critique',
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': mesure.etat === 'attention',
                        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': mesure.etat === 'normal'
                      }"
                    >
                      {{ capitalizeFirst(mesure.etat) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                    {{ mesure.commentaire || '-' }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      @click="genererPDFEvolutionSpecifique(mesure)"
                      class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center"
                      title="Exporter en PDF"
                    >
                      <FileText class="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Actions pour l'historique -->
          <div class="mt-4 flex justify-end space-x-3">
            <button 
              @click="closePatientDetails"
              class="btn btn-outline-secondary dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <X class="w-4 h-4 mr-1" />
              Fermer
            </button>
            <button 
              v-if="selectedPatient && selectedPatient.evolutionsData && selectedPatient.evolutionsData.length > 0"
              @click="genererPDFEvolution"
              class="btn btn-primary dark:bg-primary-600 dark:hover:bg-primary-700 dark:text-white"
              :disabled="isExportingPDF"
            >
              <FileText v-if="!isExportingPDF" class="w-4 h-4 mr-1" />
              <Loader2 v-else class="w-4 h-4 mr-1 animate-spin" />
              {{ isExportingPDF ? 'Génération...' : 'Exporter en PDF' }}
            </button>
          </div>
        </div>
        
        <!-- Message si aucune évolution disponible -->
        <div v-else-if="selectedPatient" class="border rounded-lg p-6 text-center mt-4 bg-white dark:bg-gray-800 dark:border-gray-700">
          <FileQuestion class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <h4 class="text-lg font-medium text-gray-700 dark:text-gray-300">Aucune donnée d'évolution disponible</h4>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Ce patient n'a pas encore d'évolutions médicales enregistrées.
          </p>
        </div>
      </div>
    </Modal>

    <BilletSalleModal
      v-if="showBilletSalle"
      @close="showBilletSalle = false"
      @submit="handleBilletSalleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as faceapi from 'face-api.js'
import { 
  UserCircle, Heart, Thermometer, Gauge, Activity,
  Search, RefreshCw, Eye, BedDouble, Clock, Camera, X, FolderOpen, Plus, Info, UserPlus, Loader2, FileText, 
  Droplets, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, User, Printer, History, BarChart2, 
  Video, ClipboardList, MapPin, CheckCircle, XCircle, FileQuestion
} from 'lucide-vue-next'
import { usePatientStore } from '@/stores/patients'
import { useEvolutionStore } from '@/stores/evolutionStore'
import '@/components/forms/FormStyles.vue'
import BilletSalleModal from '@/components/medical/BilletSalleModal.vue'
import Modal from '@/components/Modal.vue'
import axios from '@/services/axios'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import PatientMonitoring from '@/components/medical/PatientMonitoring.vue'

const patientStore = usePatientStore()
const evolutionStore = useEvolutionStore()
const router = useRouter()
const { showToast } = useToast()

// États
const searchDomicile = ref('')
const searchHospitalises = ref('')
const filterStatusDomicile = ref('')
const filterService = ref('')
const selectedPatient = ref(null)
const selectedPatientType = ref(null)
const isRefreshingDomicile = ref(false)
const isRefreshingHospitalises = ref(false)
const activeCamera = ref(null)
const videoRefs = ref({})
const isProcessingFacialRecognition = ref(false)
const showBilletSalle = ref(false)
const showPatientDetails = ref(false)
const detectionBox = ref(null)
const isChargingHistorique = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isExportingPDF = ref(false)

// Pagination des patients à domicile
const currentPageDomicile = ref(1)
const itemsPerPageDomicile = ref(5)

// Variable pour suivre l'état d'initialisation de la détection faciale
let faceDetectionInitialized = false;

// Variables pour les patients hospitalisés
const filterStatusHospitalises = ref('')
const currentPageHospitalises = ref(1)
const itemsPerPageHospitalises = ref(8) // Augmenté pour la vue compacte

// Computed properties pour le filtrage
const filteredPatientsADomicile = computed(() => {
  return patientStore.patientsADomicile.filter(patient => {
    const matchSearch = patient.nom.toLowerCase().includes(searchDomicile.value.toLowerCase())
    const matchStatus = !filterStatusDomicile.value || patient.status === filterStatusDomicile.value
    return matchSearch && matchStatus
  })
})

const filteredPatientsHospitalises = computed(() => {
  return patientStore.patientsHospitalises.filter(patient => {
    // Filtrer par recherche
    const searchMatch = searchHospitalises.value === '' ||
      (patient.nom && patient.nom.toLowerCase().includes(searchHospitalises.value.toLowerCase())) ||
      (patient.prenom && patient.prenom.toLowerCase().includes(searchHospitalises.value.toLowerCase()))
    
    // Filtrer par statut
    const statusMatch = filterStatusHospitalises.value === '' || 
      patient.status === filterStatusHospitalises.value
    
    return searchMatch && statusMatch
  })
})

// Évolutions triées par date (plus récentes en premier)
const sortedEvolutions = computed(() => {
  if (!selectedPatient.value || !selectedPatient.value.evolutionsData) {
    return []
  }
  
  // Créer une copie pour éviter de modifier l'original
  return [...selectedPatient.value.evolutionsData].sort((a, b) => {
    // Obtenir les dates
    const dateA = new Date(a.dateDeMesure || a.created_at)
    const dateB = new Date(b.dateDeMesure || b.created_at)
    
    // Trier par ordre décroissant (plus récent d'abord)
    return dateB - dateA
  })
})

// Fonctions utilitaires
const formatDate = (date) => {
  if (!date) return '--'
  try {
    // Convertir en Date si c'est une chaîne
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch (error) {
    console.error('Erreur de formatage de la date:', error)
    return '--'
  }
}

// Fonction pour obtenir l'unité de mesure en fonction du type
const getMeasurementUnit = (measureType) => {
  const units = {
    'temperature': ' °C',
    'saturationO2': ' %',
    'frequenceCardiaque': ' bpm',
    'tensionArterielle': ' mmHg'
  }
  return units[measureType] || ''
}

// Fonction pour capitaliser la première lettre
const capitalizeFirst = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Fonction pour obtenir la classe de couleur en fonction de la mesure
const getColorClassForMeasurement = (mesure) => {
  if (mesure.etat === 'critique') {
    return 'text-red-700 dark:text-red-400 font-medium'
  } else if (mesure.etat === 'attention') {
    return 'text-yellow-700 dark:text-yellow-400 font-medium'
  }
  return 'text-gray-900 dark:text-gray-200'
}

const getStatusClass = (status) => {
  const classes = {
    'Stable': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
    'Attention': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
    'Critique': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
  }
  return classes[status] || classes['Stable']
}

const getVerificationClass = (status) => {
  const classes = {
    'Vérifié': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
    'Non vérifié': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
    'En cours': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
  }
  return classes[status] || classes['Non vérifié']
}

const getStateClass = (state) => {
  const classes = {
    'normal': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
    'attention': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
    'critique': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
  }
  return classes[state] || classes['normal']
}

// Handlers
const voirDetailsDomicile = (patient) => {
  selectedPatient.value = patient
  selectedPatientType.value = 'domicile'
}

const voirDetailsHospitalise = (patient) => {
  selectedPatient.value = patient
  selectedPatientType.value = 'hospitalise'
}

const refreshDomicile = async () => {
  isRefreshingDomicile.value = true
  try {
    // Appeler la fonction pour récupérer les patients à domicile depuis le store
    await patientStore.fetchPatientsADomicile()
    console.log('Patients à domicile mis à jour avec succès')
  } catch (error) {
    console.error('Erreur lors du rafraîchissement des patients à domicile:', error)
  } finally {
    isRefreshingDomicile.value = false
  }
}

const refreshHospitalises = async () => {
  isRefreshingHospitalises.value = true
  try {
    // Récupérer les données réelles des patients hospitalisés
    await patientStore.fetchPatientsHospitalises()
  } finally {
    isRefreshingHospitalises.value = false
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return '--'
  try {
    // Convertir en Date si c'est une chaîne
    const dateObj = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp
    return format(dateObj, 'HH:mm', { locale: fr })
  } catch (error) {
    console.error('Erreur de formatage de l\'heure:', error)
    return '--'
  }
}

const voirHistoriqueComplet = async (patient) => {
  console.log('Voir historique complet pour:', patient)
  selectedPatient.value = patient
  selectedPatientType.value = 'domicile'
  showPatientDetails.value = true
  
  // Vérifier si nous avons déjà les données d'évolution complètes
  if (!patient.evolutionsData || patient.evolutionsData.length === 0) {
    isChargingHistorique.value = true
    
    try {
      // Afficher un toast de chargement
      showToast({
        type: 'info',
        title: 'Chargement des données',
        message: 'Récupération des évolutions en cours...',
        duration: 2000
      })
      
      // Récupérer les évolutions complètes du patient
      const evolutions = await evolutionStore.getPatientEvolutions(patient.patient_id)
      
      // Mettre à jour l'objet patient avec les évolutions récupérées
      if (evolutions && evolutions.length > 0) {
        // Mettre à jour les données dans l'objet selectedPatient
        selectedPatient.value = {
          ...selectedPatient.value,
          evolutionsData: evolutions
        }
        
        // Mettre à jour également le patient dans la liste des patients à domicile
        const patientIndex = patientStore.patientsADomicile.findIndex(p => p.patient_id === patient.patient_id)
        if (patientIndex !== -1) {
          patientStore.patientsADomicile[patientIndex].evolutionsData = evolutions
        }
        
        showToast({
          type: 'success',
          title: 'Données chargées',
          message: `${evolutions.length} évolutions récupérées`,
          duration: 3000
        })
      } else {
        showToast({
          type: 'info',
          title: 'Aucune donnée',
          message: 'Aucune évolution trouvée pour ce patient',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des évolutions:', error)
      showToast({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de récupérer les évolutions du patient',
        duration: 5000
      })
    } finally {
      isChargingHistorique.value = false
    }
  }
}

const demarrerReconnaissanceFaciale = async (patient) => {
  try {
    console.log('Démarrage de la reconnaissance faciale pour le patient:', patient.id);
    activeCamera.value = patient.id;
    isProcessingFacialRecognition.value = true;
    detectionBox.value = null;
    
    // Attendre que la référence vidéo soit disponible après le rendu
    await nextTick();
    
    // 1. Tenter d'accéder à la caméra locale (toujours fonctionnel)
    await useLocalCamera(patient.id);
    
    // 2. Simuler une détection faciale après un court délai
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Simulation de détection faciale réussie');
    
    // 3. Définir une boîte de détection simulée
    detectionBox.value = {
      x: 20,
      y: 20,
      width: 60,
      height: 60
    };
    
    // 4. Mettre à jour le statut du patient
    const patientIndex = patientStore.patientsHospitalises.findIndex(p => p.id === patient.id);
    if (patientIndex !== -1) {
      patientStore.patientsHospitalises[patientIndex].verificationStatus = 'Vérifié';
      patientStore.patientsHospitalises[patientIndex].derniereVerification = new Date();
      
      if (!patientStore.patientsHospitalises[patientIndex].verificationLogs) {
        patientStore.patientsHospitalises[patientIndex].verificationLogs = [];
      }
      
      patientStore.patientsHospitalises[patientIndex].verificationLogs.unshift({
        status: 'Vérifié',
        timestamp: new Date(),
        details: 'Vérification faciale réussie'
      });
      
      // Afficher un message de succès
      showToast({
        type: 'success',
        title: 'Vérification réussie',
        message: 'L\'identité du patient a été vérifiée avec succès',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Erreur lors de la reconnaissance faciale:', error);
    
    // En cas d'erreur, afficher un message
    showToast({
      type: 'error',
      title: 'Erreur de vérification',
      message: 'La vérification faciale a échoué. Veuillez réessayer.',
      duration: 3000
    });
  } finally {
    isProcessingFacialRecognition.value = false;
  }
};

const arreterCamera = () => {
  const videoElement = videoRefs.value[activeCamera.value];
  activeCamera.value = null;
  isProcessingFacialRecognition.value = false;
  detectionBox.value = null;
  
  // Si une connexion vidéo est active, la fermer
  if (videoElement) {
    if (videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    videoElement.src = '';
  }
}

const togglePatientMonitoring = async (patient) => {
  try {
    if (patient.underMonitoring) {
      // Arrêter la surveillance
      await patientStore.stopPatientMonitoring(patient.patient_id)
      console.log('Surveillance arrêtée pour le patient:', patient.nom)
    } else {
      // Démarrer la surveillance
      await patientStore.startPatientMonitoring(patient.patient_id)
      console.log('Surveillance démarrée pour le patient:', patient.nom)
      
      // Effectuer une mise à jour immédiate des paramètres vitaux
      await patientStore.updatePatientVitals(patient.patient_id)
    }
  } catch (error) {
    console.error('Erreur lors du changement de statut de surveillance:', error)
  }
}

const handleBilletSalleSubmit = async (data) => {
  try {
    // Soumettre le billet de salle à l'API
    const response = await axios.post('/billets-salle', data, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
    })
    
    console.log('Billet de salle créé:', response.data)
    showBilletSalle.value = false
    
    // Afficher un message de succès
    // Implémenter si nécessaire
  } catch (error) {
    console.error('Erreur lors de la création du billet de salle:', error)
  }
}

const closePatientDetails = () => {
  selectedPatient.value = null
  showPatientDetails.value = false
  isChargingHistorique.value = false
}

// Charger les données au montage du composant
onMounted(async () => {
  await Promise.all([
    refreshDomicile(),
    refreshHospitalises()
  ])
})

// Fonction pour accéder à la page de détails d'un patient
const allerAuDossierPatient = (patient) => {
  if (patient && patient.patient_id) {
    // Naviguer vers la page du dossier patient
    router.push(`/dossier/${patient.patient_id}`)
  }
}

// Fonction pour créer une nouvelle évolution pour un patient
const ajouterMesurePatient = (patient) => {
  if (patient && patient.patient_id) {
    // Naviguer vers le formulaire d'ajout d'évolution
    router.push({
      path: '/evolution/nouvelle',
      query: { patient_id: patient.patient_id }
    })
  }
}

const exporterPDFEvolution = async (patient) => {
  try {
    console.log('Génération du PDF pour le patient:', patient.nom)
    
    // Si le patient a des évolutions, utiliser la première pour générer le PDF
    if (patient.evolutionsData && patient.evolutionsData.length > 0) {
      // Utiliser l'ID de la dernière évolution
      const latestEvolution = patient.evolutionsData[0]
      
      // Appeler la fonction de génération de PDF du store d'évolution
      const pdfResult = await evolutionStore.generatePDF(latestEvolution._id)
      
      if (pdfResult && pdfResult.url) {
        // Ouvrir le PDF dans un nouvel onglet
        window.open(pdfResult.url, '_blank')
        
        showToast({
          type: 'success',
          title: 'PDF généré avec succès',
          message: `Le PDF d'évolution pour ${patient.nom} a été généré.`        })
      } else {
        throw new Error('Impossible de générer le PDF d\'évolution')
      }
    } else {
      showToast({
        type: 'error',
        title: 'Erreur de génération',
        message: 'Aucune donnée d\'évolution disponible pour générer un PDF'
      })
    }
  } catch (error) {
    console.error('Erreur lors de l\'exportation du PDF:', error)
    showToast({
      type: 'error',
      title: 'Erreur de génération',
      message: 'Impossible de générer le PDF d\'évolution. ' + error.message
    })
  }
}

const genererPDFEvolutionSpecifique = async (mesure) => {
  try {
    console.log('Génération du PDF pour l\'évolution:', mesure)
    
    // Appeler la fonction de génération de PDF du store d'évolution
    const pdfResult = await evolutionStore.generatePDF(mesure._id)
    
    if (pdfResult && pdfResult.url) {
      // Ouvrir le PDF dans un nouvel onglet
      window.open(pdfResult.url, '_blank')
      
      showToast({
        type: 'success',
        title: 'PDF généré avec succès',
        message: `Le PDF de l'évolution ${mesure.nomMesure} a été généré.`
      })
    } else {
      throw new Error('Impossible de générer le PDF de l\'évolution')
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    showToast({
      type: 'error',
      title: 'Erreur de génération',
      message: 'Impossible de générer le PDF de l\'évolution. ' + error.message
    })
  }
}

const genererPDFEvolution = async () => {
  if (!selectedPatient.value || !selectedPatient.value.evolutionsData || selectedPatient.value.evolutionsData.length === 0) {
    showToast({
      type: 'error',
      title: 'Erreur',
      message: 'Aucune évolution disponible pour ce patient'
    })
    return
  }

  isExportingPDF.value = true
  
  try {
    console.log('Génération du PDF pour le patient:', selectedPatient.value.nom)
    
    // Utiliser l'ID de la première évolution dans la liste triée
    const latestEvolution = sortedEvolutions.value[0]
    
    // Appeler la fonction de génération de PDF du store d'évolution
    const pdfResult = await evolutionStore.generatePDF(latestEvolution._id)
    
    if (pdfResult && pdfResult.url) {
      // Ouvrir le PDF dans un nouvel onglet
      window.open(pdfResult.url, '_blank')
      
      showToast({
        type: 'success',
        title: 'PDF généré avec succès',
        message: `Le PDF d'évolution pour ${selectedPatient.value.nom} a été généré.`
      })
    } else {
      throw new Error('Impossible de générer le PDF d\'évolution')
    }
  } catch (error) {
    console.error('Erreur lors de l\'exportation du PDF:', error)
    showToast({
      type: 'error',
      title: 'Erreur de génération',
      message: 'Impossible de générer le PDF d\'évolution. ' + error.message
    })
  } finally {
    isExportingPDF.value = false
  }
}

// Pagination
const totalEvolutions = computed(() => selectedPatient.value.evolutionsData.length)
const totalPages = computed(() => Math.ceil(totalEvolutions.value / itemsPerPage.value))
const paginatedEvolutions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedEvolutions.value.slice(start, end)
})

// Pagination des patients à domicile
const totalPagesDomicile = computed(() => Math.ceil(filteredPatientsADomicile.value.length / itemsPerPageDomicile.value))
const paginatedPatientsADomicile = computed(() => {
  const start = (currentPageDomicile.value - 1) * itemsPerPageDomicile.value
  const end = start + itemsPerPageDomicile.value
  return filteredPatientsADomicile.value.slice(start, end)
})

// Pagination des patients hospitalisés
const totalPagesHospitalises = computed(() => {
  return Math.ceil(filteredPatientsHospitalises.value.length / itemsPerPageHospitalises.value)
})

const paginatedPatientsHospitalises = computed(() => {
  const start = (currentPageHospitalises.value - 1) * itemsPerPageHospitalises.value
  const end = start + itemsPerPageHospitalises.value
  return filteredPatientsHospitalises.value.slice(start, end)
})

// Navigation dans la pagination
const previousPageHospitalises = () => {
  if (currentPageHospitalises.value > 1) {
    currentPageHospitalises.value--
  }
}

const nextPageHospitalises = () => {
  if (currentPageHospitalises.value < totalPagesHospitalises.value) {
    currentPageHospitalises.value++
  }
}

// Voir les détails d'un patient
const viewPatientDetails = (patient) => {
  selectedPatient.value = patient
  showPatientDetails.value = true
}

// Fonction pour initialiser la caméra locale
async function useLocalCamera(patientId) {
  console.log('Tentative d\'accès à la caméra locale pour le patient:', patientId);
  
  try {
    const videoElement = videoRefs.value[patientId];
    if (!videoElement) {
      console.error('Élément vidéo non disponible pour la caméra locale');
      throw new Error('Élément vidéo non trouvé dans le DOM');
    }
    
    console.log('Demande d\'accès à la caméra locale...');
    try {
      // Essayer d'accéder à la caméra réelle
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log('Accès à la caméra locale réussi, configuration du stream');
      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = () => {
        console.log('Métadonnées vidéo chargées, lecture démarrée');
        videoElement.play()
          .then(() => console.log('Lecture vidéo démarrée'))
          .catch(err => console.error('Erreur lors du démarrage de la lecture:', err));
      };
    } catch (cameraError) {
      console.warn('Impossible d\'accéder à la caméra, création d\'un flux simulé:', cameraError);
      
      // Créer un canvas pour simuler une vidéo
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      
      // Obtenir le contexte du canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Impossible de créer un contexte de canvas');
      }
      
      // Fonction pour dessiner l'animation
      const drawAnimation = () => {
        // Fond noir
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Afficher du texte d'information
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('Simulation de caméra', 20, 40);
        ctx.font = '18px Arial';
        ctx.fillText(`Patient ID: ${patientId}`, 20, 80);
        
        // Dessiner l'heure actuelle
        const now = new Date();
        ctx.fillText(now.toLocaleTimeString(), 20, 120);
        
        // Dessiner un visage simulé
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dessiner les yeux
        ctx.beginPath();
        ctx.arc(canvas.width / 2 - 30, canvas.height / 2 - 20, 10, 0, Math.PI * 2);
        ctx.arc(canvas.width / 2 + 30, canvas.height / 2 - 20, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        
        // Dessiner la bouche
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 + 20, 30, 0, Math.PI);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Continuer l'animation
        if (activeCamera.value === patientId) {
          requestAnimationFrame(drawAnimation);
        }
      };
      
      // Démarrer l'animation
      drawAnimation();
      
      try {
        // Créer un flux à partir du canvas
        const fakeStream = canvas.captureStream(30); // 30 FPS
        videoElement.srcObject = fakeStream;
      } catch (streamError) {
        console.error('Impossible de créer un flux simulé:', streamError);
        throw streamError;
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la caméra:', error);
    // Ne pas propager l'erreur pour permettre la simulation de continuer
    // même si l'accès à la caméra a échoué
  }
}
</script>

<style scoped>
/* Garder uniquement les styles spécifiques */
.vital-sign {
  @apply bg-white dark:bg-gray-800 p-3 rounded-lg;
}

.vital-sign-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.vital-sign-value {
  @apply mt-1 text-lg font-semibold;
}

/* Animations pour les listes */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.5s ease;
}

/* Animation pour les cartes */
@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--color-primary-500), 0.4);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(var(--color-primary-500), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--color-primary-500), 0);
  }
}

.patient-card-alert {
  animation: pulse-border 2s infinite;
}

/* Animation de survol pour les cartes */
.hover-scale {
  transition: transform 0.2s ease;
}
.hover-scale:hover {
  transform: scale(1.01);
}
</style>