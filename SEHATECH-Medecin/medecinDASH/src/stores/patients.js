import { defineStore } from 'pinia'
import { ref } from 'vue'
import { parseISO } from 'date-fns'
import axios from '@/services/axios'

export const usePatientStore = defineStore('patients', () => {
  // État
  const patientsADomicile = ref([])
  const patientsHospitalises = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const monitoringIntervals = ref({})

  // Actions
  async function fetchPatientsHospitalises() {
    try {
      isLoading.value = true
      error.value = null
      
      const token = localStorage.getItem('Token_MEDECIN')
      const response = await axios.get('/hospitalisations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.data && response.data.hospitalisations) {
        // Récupérer les données de base des hospitalisations
        const hospitalisationsData = response.data.hospitalisations
        
        // Récupérer les paramètres vitaux pour chaque patient
        const patientsWithVitals = await Promise.all(hospitalisationsData.map(async (hospitalisation) => {
          try {
            // Vérifier si le patient existe
            if (!hospitalisation.patient || !hospitalisation.patient._id) {
              console.error('Données patient manquantes pour l\'hospitalisation:', hospitalisation._id)
              return {
                id: hospitalisation._id,
                patient_id: hospitalisation.patient?._id,
                nom: `${hospitalisation.patient?.utilisateur?.nom || 'Patient'} ${hospitalisation.patient?.utilisateur?.prenom || 'inconnu'}`,
                chambre_id: hospitalisation.chambre_id,
                chambre_numero: hospitalisation.chambre?.numero,
                service: hospitalisation.chambre?.service,
                motif: hospitalisation.motif,
                dateEntree: hospitalisation.dateDebut,
                dateSortie: hospitalisation.dateFin,
                status: hospitalisation.status || 'confirmée',
                parametres: {
                  frequenceCardiaque: '--',
                  temperature: '--',
                  saturationO2: '--',
                  tension: '--'
                },
                verificationStatus: 'Non vérifié',
                derniereVerification: new Date(),
                verificationLogs: []
              }
            }
            
            // Récupérer les paramètres vitaux du patient
            const vitalsResponse = await axios.get(`/capteurs/patient/${hospitalisation.patient._id}/latest`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            
            // Extraire les valeurs des paramètres vitaux
            const frequenceCardiaque = vitalsResponse.data.frequence_cardiaque?.[0]?.valeur || '--'
            const saturationO2 = vitalsResponse.data.saturation_oxygene?.[0]?.valeur || '--'
            const temperature = vitalsResponse.data.temperature?.[0]?.valeur || '--'
            const tension = vitalsResponse.data.tension_arterielle?.[0]?.valeur || '--'
            
            // Déterminer le statut du patient en fonction des paramètres vitaux
            let status = 'Stable'
            if (
              (frequenceCardiaque !== '--' && (frequenceCardiaque > 100 || frequenceCardiaque < 50)) ||
              (temperature !== '--' && (temperature > 38.5 || temperature < 36)) ||
              (saturationO2 !== '--' && saturationO2 < 95)
            ) {
              status = 'Attention'
            }
            if (
              (frequenceCardiaque !== '--' && (frequenceCardiaque > 120 || frequenceCardiaque < 40)) ||
              (temperature !== '--' && (temperature > 39.5 || temperature < 35)) ||
              (saturationO2 !== '--' && saturationO2 < 90)
            ) {
              status = 'Critique'
            }
            
            // Créer un objet patient avec toutes les informations
            return {
              id: hospitalisation._id,
              patient_id: hospitalisation.patient._id,
              nom: `${hospitalisation.patient?.utilisateur?.nom || 'Patient'} ${hospitalisation.patient?.utilisateur?.prenom || 'inconnu'}`,
              chambre_id: hospitalisation.chambre_id,
              chambre_numero: hospitalisation.chambre?.numero,
              chambre: hospitalisation.chambre?.numero, // Pour la compatibilité avec l'affichage
              service: hospitalisation.chambre?.service,
              motif: hospitalisation.motif,
              dateEntree: hospitalisation.dateDebut,
              dateSortie: hospitalisation.dateFin,
              status: status,
              parametres: {
                frequenceCardiaque: frequenceCardiaque,
                temperature: temperature,
                saturationO2: saturationO2,
                tension: tension
              },
              verificationStatus: 'Non vérifié',
              derniereVerification: new Date(),
              verificationLogs: []
            }
          } catch (err) {
            console.error('Erreur lors de la récupération des paramètres vitaux:', err)
            // Retourner un objet patient avec des valeurs par défaut en cas d'erreur
            return {
              id: hospitalisation._id,
              patient_id: hospitalisation.patient?._id,
              nom: `${hospitalisation.patient?.utilisateur?.nom || 'Patient'} ${hospitalisation.patient?.utilisateur?.prenom || 'inconnu'}`,
              chambre_id: hospitalisation.chambre_id,
              chambre_numero: hospitalisation.chambre?.numero,
              chambre: hospitalisation.chambre?.numero, // Pour la compatibilité avec l'affichage
              service: hospitalisation.chambre?.service,
              motif: hospitalisation.motif,
              dateEntree: hospitalisation.dateDebut,
              dateSortie: hospitalisation.dateFin,
              status: hospitalisation.status || 'confirmée',
              parametres: {
                frequenceCardiaque: '--',
                temperature: '--',
                saturationO2: '--',
                tension: '--'
              },
              verificationStatus: 'Non vérifié',
              derniereVerification: new Date(),
              verificationLogs: []
            }
          }
        }))
        
        patientsHospitalises.value = patientsWithVitals
      } else {
        throw new Error('Échec de la récupération des patients hospitalisés')
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des patients hospitalisés:', err)
      error.value = "Erreur lors de la récupération des patients hospitalisés"
    } finally {
      isLoading.value = false
    }
  }

  // Récupérer les patients hospitalisés dans une chambre spécifique
  function getPatientsParChambre(chambre_id) {
    return patientsHospitalises.value.filter(
      patient => patient.chambre_id === chambre_id 
    )
  }

  // Récupérer les patients hospitalisés par service
  function getPatientsParService(service) {
    return patientsHospitalises.value.filter(
      patient => patient.service === service && !patient.dateSortie
    )
  }

  // Fonction pour rafraîchir les paramètres vitaux d'un patient spécifique
  async function refreshPatientVitals(patientId) {
    try {
      if (!patientId) return null
      
      const token = localStorage.getItem('Token_MEDECIN')
      const vitalsResponse = await axios.get(`/capteurs/patient/${patientId}/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // Extraire les valeurs des paramètres vitaux
      const frequenceCardiaque = vitalsResponse.data.frequence_cardiaque?.[0]?.valeur || '--'
      const saturationO2 = vitalsResponse.data.saturation_oxygene?.[0]?.valeur || '--'
      const temperature = vitalsResponse.data.temperature?.[0]?.valeur || '--'
      const tension = vitalsResponse.data.tension_arterielle?.[0]?.valeur || '--'
      
      // Déterminer le statut du patient en fonction des paramètres vitaux
      let status = 'Stable'
      if (
        (frequenceCardiaque !== '--' && (frequenceCardiaque > 100 || frequenceCardiaque < 50)) ||
        (temperature !== '--' && (temperature > 38.5 || temperature < 36)) ||
        (saturationO2 !== '--' && saturationO2 < 95)
      ) {
        status = 'Attention'
      }
      if (
        (frequenceCardiaque !== '--' && (frequenceCardiaque > 120 || frequenceCardiaque < 40)) ||
        (temperature !== '--' && (temperature > 39.5 || temperature < 35)) ||
        (saturationO2 !== '--' && saturationO2 < 90)
      ) {
        status = 'Critique'
      }
      
      // Mettre à jour le patient dans la liste
      const patientIndex = patientsHospitalises.value.findIndex(p => p.patient_id === patientId)
      if (patientIndex !== -1) {
        patientsHospitalises.value[patientIndex].parametres = {
          frequenceCardiaque,
          temperature,
          saturationO2,
          tension
        }
        patientsHospitalises.value[patientIndex].status = status
      }
      
      return {
        frequenceCardiaque,
        temperature,
        saturationO2,
        tension,
        status
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des paramètres vitaux:', err)
      return null
    }
  }

  // Récupérer les patients suivis à domicile
  async function fetchPatientsADomicile() {
    try {
      isLoading.value = true
      error.value = null
      
      const token = localStorage.getItem('Token_MEDECIN')
      
      // Récupérer la liste des patients avec des données d'évolution médicale
      // au lieu d'utiliser la route /patients/domicile qui n'existe pas
      
      // 1. D'abord, récupérer tous les patients sous surveillance
      const patientsResponse = await axios.get('/patients', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 50 } // Limiter à 50 patients pour des raisons de performance
      })
      
      // Extraire les données des patients
      let patientsData = []
      if (patientsResponse.data && Array.isArray(patientsResponse.data)) {
        patientsData = patientsResponse.data
      } else if (patientsResponse.data && Array.isArray(patientsResponse.data.data)) {
        patientsData = patientsResponse.data.data
      } else if (patientsResponse.data && Array.isArray(patientsResponse.data.patients)) {
        patientsData = patientsResponse.data.patients
      } else {
        console.warn('Format de réponse inattendu pour /patients:', patientsResponse.data)
        patientsData = []
      }
      
      console.log(`${patientsData.length} patients récupérés au total`)
      
      // 2. Ensuite, récupérer les évolutions récentes pour filtrer 
      // uniquement les patients sous télésurveillance
      const evolutions = {}
      const monitoredPatients = []
      
      // Pour chaque patient, vérifier s'il a des évolutions récentes
      // (c'est-à-dire qu'il est sous télésurveillance)
      for (const patient of patientsData) {
        try {
          // Récupérer les évolutions du patient
          const evolutionsResponse = await axios.get(`/evolutions/patient/${patient._id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { limit: 20 } // Limiter aux 20 dernières évolutions
          });
          
          let patientEvolutions = []
          
          if (evolutionsResponse.data && Array.isArray(evolutionsResponse.data)) {
            patientEvolutions = evolutionsResponse.data
          } else if (evolutionsResponse.data && Array.isArray(evolutionsResponse.data.data)) {
            patientEvolutions = evolutionsResponse.data.data
          } else {
            console.warn('Format de réponse inattendu pour les évolutions:', evolutionsResponse.data)
            patientEvolutions = []
          }
          
          // Si le patient a des évolutions récentes (moins de 7 jours), 
          // on le considère comme étant sous télésurveillance
          if (patientEvolutions.length > 0) {
            // Vérifier si au moins une évolution date de moins de 7 jours
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            
            const hasRecentEvolution = patientEvolutions.some(e => {
              const evolutionDate = e.dateDeMesure || e.created_at
              // Convertir en objet Date si c'est une chaîne
              const parsedDate = typeof evolutionDate === 'string' ? parseISO(evolutionDate) : evolutionDate
              return parsedDate > sevenDaysAgo
            })
            
            if (hasRecentEvolution) {
              evolutions[patient._id] = patientEvolutions
              monitoredPatients.push(patient)
            }
          }
        } catch (err) {
          console.warn(`Pas d'évolutions pour le patient ${patient._id}:`, err.message)
        }
      }
      
      console.log(`${monitoredPatients.length} patients sous télésurveillance identifiés`)
      
      // 3. Transformer les données pour l'affichage
      const patientsWithData = await Promise.all(monitoredPatients.map(async (patient) => {
        try {
          const patientEvolutions = evolutions[patient._id] || []
          
          // Regrouper les évolutions par type de mesure
          const evolutionsGrouped = {};
          patientEvolutions.forEach(evolution => {
            if (!evolutionsGrouped[evolution.nomMesure]) {
              evolutionsGrouped[evolution.nomMesure] = [];
            }
            evolutionsGrouped[evolution.nomMesure].push({
              valeur: evolution.valeurDeMesure,
              date: evolution.dateDeMesure || evolution.created_at,
              etat: evolution.etat
            });
          });
          
          // Trier chaque groupe par date (plus récente en premier)
          Object.keys(evolutionsGrouped).forEach(key => {
            evolutionsGrouped[key].sort((a, b) => {
              const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date
              const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date
              return dateB - dateA
            });
          });
          
          // Extraire les dernières valeurs pour chaque type de mesure
          const latestFrequenceCardiaque = evolutionsGrouped['frequenceCardiaque']?.[0]?.valeur || '--';
          const latestTemperature = evolutionsGrouped['temperature']?.[0]?.valeur || '--';
          const latestSaturationO2 = evolutionsGrouped['saturationO2']?.[0]?.valeur || '--';
          const latestTension = evolutionsGrouped['tension']?.[0]?.valeur || '--';
          
          // Ajouter les états et dates pour chaque type de mesure
          const frequenceCardiaqueEtat = evolutionsGrouped['frequenceCardiaque']?.[0]?.etat || 'normal';
          const temperatureEtat = evolutionsGrouped['temperature']?.[0]?.etat || 'normal';
          const saturationO2Etat = evolutionsGrouped['saturationO2']?.[0]?.etat || 'normal';
          
          const frequenceCardiaqueDate = evolutionsGrouped['frequenceCardiaque']?.[0]?.date || null;
          const temperatureDate = evolutionsGrouped['temperature']?.[0]?.date || null;
          const saturationO2Date = evolutionsGrouped['saturationO2']?.[0]?.date || null;
          
          // Déterminer l'état du patient en fonction des dernières mesures
          let status = 'Stable';
          const etatFC = evolutionsGrouped['frequenceCardiaque']?.[0]?.etat;
          const etatTemp = evolutionsGrouped['temperature']?.[0]?.etat;
          const etatO2 = evolutionsGrouped['saturationO2']?.[0]?.etat;
          
          if (etatFC === 'critique' || etatTemp === 'critique' || etatO2 === 'critique') {
            status = 'Critique';
          } else if (etatFC === 'attention' || etatTemp === 'attention' || etatO2 === 'attention') {
            status = 'Attention';
          }
          
          // Préparer l'historique des mesures pour l'affichage
          const historique = [];
          
          // Trouver les dates uniques des mesures
          const dateMesures = new Set();
          Object.values(evolutionsGrouped).forEach(mesures => {
            mesures.forEach(mesure => {
              if (mesure.date) {
                const parsedDate = typeof mesure.date === 'string' ? parseISO(mesure.date) : mesure.date
                dateMesures.add(parsedDate.toISOString());
              }
            });
          });
          
          // Créer un historique pour chaque date
          Array.from(dateMesures).sort((a, b) => {
            const dateA = typeof a === 'string' ? parseISO(a) : a
            const dateB = typeof b === 'string' ? parseISO(b) : b
            return dateB - dateA
          }).slice(0, 10).forEach(date => {
            const historiqueItem = {
              timestamp: date,
              frequenceCardiaque: '--',
              temperature: '--',
              saturationO2: '--',
              frequenceCardiaqueEtat: 'normal',
              temperatureEtat: 'normal',
              saturationO2Etat: 'normal'
            };
            
            // Trouver les mesures pour cette date
            Object.keys(evolutionsGrouped).forEach(nomMesure => {
              const mesure = evolutionsGrouped[nomMesure].find(m => {
                const mesureDate = typeof m.date === 'string' ? parseISO(m.date) : m.date
                return mesureDate.toISOString() === date
              });
              if (mesure) {
                if (nomMesure === 'frequenceCardiaque') {
                  historiqueItem.frequenceCardiaque = mesure.valeur;
                  historiqueItem.frequenceCardiaqueEtat = mesure.etat || 'normal';
                } else if (nomMesure === 'temperature') {
                  historiqueItem.temperature = mesure.valeur;
                  historiqueItem.temperatureEtat = mesure.etat || 'normal';
                } else if (nomMesure === 'saturationO2') {
                  historiqueItem.saturationO2 = mesure.valeur;
                  historiqueItem.saturationO2Etat = mesure.etat || 'normal';
                }
              }
            });
            
            historique.push(historiqueItem);
          });
          
          // Récupérer le statut de surveillance
          const monitoringActive = monitoringIntervals.value[patient._id] !== undefined;
          
          return {
            id: patient._id,
            patient_id: patient._id,
            nom: `${patient.utilisateur?.nom || patient.nom || 'Patient'} ${patient.utilisateur?.prenom || patient.prenom || ''}`,
            status: status,
            parametres: {
              frequenceCardiaque: latestFrequenceCardiaque,
              temperature: latestTemperature,
              saturationO2: latestSaturationO2,
              tension: latestTension,
              frequenceCardiaqueEtat: frequenceCardiaqueEtat,
              temperatureEtat: temperatureEtat,
              saturationO2Etat: saturationO2Etat,
              frequenceCardiaqueDate: frequenceCardiaqueDate,
              temperatureDate: temperatureDate,
              saturationO2Date: saturationO2Date
            },
            derniereMiseAJour: evolutionsGrouped['frequenceCardiaque']?.[0]?.date || 
                               evolutionsGrouped['temperature']?.[0]?.date || 
                               evolutionsGrouped['saturationO2']?.[0]?.date || 
                               new Date().toISOString(),
            historique: historique,
            surveillance: {
              active: monitoringActive,
              derniereVerification: new Date().toISOString(),
              alertes: []
            },
            // Ajouter les données brutes d'évolution pour un accès facile
            evolutionsData: patientEvolutions
          };
        } catch (err) {
          console.error('Erreur lors du traitement des évolutions du patient:', err);
          // Retourner un objet patient avec des valeurs par défaut en cas d'erreur
          return {
            id: patient._id,
            patient_id: patient._id,
            nom: `${patient.utilisateur?.nom || patient.nom || 'Patient'} ${patient.utilisateur?.prenom || patient.prenom || ''}`,
            status: 'Stable',
            parametres: {
              frequenceCardiaque: '--',
              temperature: '--',
              saturationO2: '--',
              tension: '--',
              frequenceCardiaqueEtat: 'normal',
              temperatureEtat: 'normal',
              saturationO2Etat: 'normal',
              frequenceCardiaqueDate: null,
              temperatureDate: null,
              saturationO2Date: null
            },
            derniereMiseAJour: null,
            historique: [],
            surveillance: {
              active: false,
              derniereVerification: null,
              alertes: []
            }
          };
        }
      }));
      
      patientsADomicile.value = patientsWithData;
      return patientsWithData;
    } catch (err) {
      console.error('Erreur lors de la récupération des patients à domicile:', err);
      error.value = "Erreur lors de la récupération des patients à domicile";
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  // Démarrer la surveillance d'un patient à domicile
  async function startPatientMonitoring(patientId) {
    try {
      const patient = patientsADomicile.value.find(p => p.patient_id === patientId);
      if (!patient) return;
      
      // Activer la surveillance via l'API
      await axios.post(`/patients/${patientId}/monitoring/start`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
      });
      
      // Mettre à jour le statut de surveillance
      patient.surveillance.active = true;
      patient.surveillance.derniereVerification = new Date().toISOString();
      patient.surveillance.alertes = [];
      
      // Configurer un intervalle pour mettre à jour les données
      if (!monitoringIntervals.value[patientId]) {
        monitoringIntervals.value[patientId] = setInterval(async () => {
          await updatePatientVitals(patientId);
        }, 30000); // Mise à jour toutes les 30 secondes
      }
    } catch (err) {
      console.error('Erreur lors du démarrage de la surveillance:', err);
      throw err;
    }
  }

  // Arrêter la surveillance d'un patient
  async function stopPatientMonitoring(patientId) {
    try {
      const patient = patientsADomicile.value.find(p => p.patient_id === patientId);
      if (!patient) return;

      // Arrêter la surveillance via l'API
      await axios.post(`/patients/${patientId}/monitoring/stop`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
      });
      
      // Mettre à jour le statut de surveillance
      patient.surveillance.active = false;
      patient.surveillance.alertes = [];

      // Nettoyer l'intervalle
      if (monitoringIntervals.value[patientId]) {
        clearInterval(monitoringIntervals.value[patientId]);
        delete monitoringIntervals.value[patientId];
      }
    } catch (err) {
      console.error('Erreur lors de l\'arrêt de la surveillance:', err);
      throw err;
    }
  }

  // Mettre à jour les paramètres vitaux d'un patient
  async function updatePatientVitals(patientId) {
    try {
      const patient = patientsADomicile.value.find(p => p.patient_id === patientId);
      if (!patient) return;

      // Récupérer les dernières évolutions du patient
      const evolutionsResponse = await axios.get(`/evolutions/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` },
        params: { limit: 20 } // Limiter aux 20 dernières évolutions
      });
      
      // Extraire les données des évolutions en fonction du format de réponse
      let evolutions = [];
      if (evolutionsResponse.data && Array.isArray(evolutionsResponse.data)) {
        evolutions = evolutionsResponse.data;
      } else if (evolutionsResponse.data && Array.isArray(evolutionsResponse.data.data)) {
        evolutions = evolutionsResponse.data.data;
      } else {
        console.warn('Format de réponse inattendu pour les évolutions:', evolutionsResponse.data);
        return;
      }
      
      if (evolutions.length === 0) {
        console.log(`Aucune évolution récente pour le patient ${patientId}`);
        return;
      }
      
      // Regrouper les évolutions par type de mesure
      const evolutionsGrouped = {};
      evolutions.forEach(evolution => {
        if (!evolutionsGrouped[evolution.nomMesure]) {
          evolutionsGrouped[evolution.nomMesure] = [];
        }
        evolutionsGrouped[evolution.nomMesure].push({
          valeur: evolution.valeurDeMesure,
          date: evolution.dateDeMesure || evolution.created_at,
          etat: evolution.etat
        });
      });
      
      // Trier chaque groupe par date (plus récente en premier)
      Object.keys(evolutionsGrouped).forEach(key => {
        evolutionsGrouped[key].sort((a, b) => {
          const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date
          const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date
          return dateB - dateA
        });
      });
      
      // Extraire les dernières valeurs pour chaque type de mesure
      const latestFrequenceCardiaque = evolutionsGrouped['frequenceCardiaque']?.[0]?.valeur || '--';
      const latestTemperature = evolutionsGrouped['temperature']?.[0]?.valeur || '--';
      const latestSaturationO2 = evolutionsGrouped['saturationO2']?.[0]?.valeur || '--';
      const latestTension = evolutionsGrouped['tension']?.[0]?.valeur || '--';
      
      // Ajouter les états et dates pour chaque type de mesure
      const frequenceCardiaqueEtat = evolutionsGrouped['frequenceCardiaque']?.[0]?.etat || 'normal';
      const temperatureEtat = evolutionsGrouped['temperature']?.[0]?.etat || 'normal';
      const saturationO2Etat = evolutionsGrouped['saturationO2']?.[0]?.etat || 'normal';
      
      const frequenceCardiaqueDate = evolutionsGrouped['frequenceCardiaque']?.[0]?.date || null;
      const temperatureDate = evolutionsGrouped['temperature']?.[0]?.date || null;
      const saturationO2Date = evolutionsGrouped['saturationO2']?.[0]?.date || null;
      
      // Mettre à jour les paramètres vitaux du patient
      patient.parametres = {
        frequenceCardiaque: latestFrequenceCardiaque,
        temperature: latestTemperature,
        saturationO2: latestSaturationO2,
        tension: latestTension,
        frequenceCardiaqueEtat: frequenceCardiaqueEtat,
        temperatureEtat: temperatureEtat,
        saturationO2Etat: saturationO2Etat,
        frequenceCardiaqueDate: frequenceCardiaqueDate,
        temperatureDate: temperatureDate,
        saturationO2Date: saturationO2Date
      };
      
      // Déterminer l'état du patient en fonction des dernières mesures
      let status = 'Stable';
      const etatFC = evolutionsGrouped['frequenceCardiaque']?.[0]?.etat;
      const etatTemp = evolutionsGrouped['temperature']?.[0]?.etat;
      const etatO2 = evolutionsGrouped['saturationO2']?.[0]?.etat;
      
      if (etatFC === 'critique' || etatTemp === 'critique' || etatO2 === 'critique') {
        status = 'Critique';
      } else if (etatFC === 'attention' || etatTemp === 'attention' || etatO2 === 'attention') {
        status = 'Attention';
      }
      
      patient.status = status;
      
      // Mettre à jour la date de dernière vérification
      patient.surveillance.derniereVerification = new Date().toISOString();
      
      // Vérifier s'il y a des alertes à générer
      const alertes = [];
      
      if ((latestFrequenceCardiaque !== '--' && 
          (parseFloat(latestFrequenceCardiaque) > 100 || parseFloat(latestFrequenceCardiaque) < 50)) ||
          etatFC === 'attention' || etatFC === 'critique') {
        alertes.push({
          type: 'frequenceCardiaque',
          message: `Fréquence cardiaque anormale: ${latestFrequenceCardiaque} bpm`,
          date: new Date().toISOString(),
          niveau: etatFC === 'critique' ? 'critique' : 'attention'
        });
      }
      
      if ((latestTemperature !== '--' && 
          (parseFloat(latestTemperature) > 38 || parseFloat(latestTemperature) < 36)) ||
          etatTemp === 'attention' || etatTemp === 'critique') {
        alertes.push({
          type: 'temperature',
          message: `Température anormale: ${latestTemperature} °C`,
          date: new Date().toISOString(),
          niveau: etatTemp === 'critique' ? 'critique' : 'attention'
        });
      }
      
      if ((latestSaturationO2 !== '--' && parseFloat(latestSaturationO2) < 95) ||
          etatO2 === 'attention' || etatO2 === 'critique') {
        alertes.push({
          type: 'saturationO2',
          message: `Saturation en oxygène basse: ${latestSaturationO2} %`,
          date: new Date().toISOString(),
          niveau: etatO2 === 'critique' ? 'critique' : 'attention'
        });
      }
      
      // Mettre à jour les alertes
      if (alertes.length > 0) {
        patient.surveillance.alertes = [...alertes, ...patient.surveillance.alertes].slice(0, 10); // Garder les 10 dernières alertes
      }
      
      // Mettre à jour l'historique des mesures
      const newHistoriqueEntry = {
        timestamp: new Date().toISOString(),
        frequenceCardiaque: latestFrequenceCardiaque,
        temperature: latestTemperature,
        saturationO2: latestSaturationO2,
        frequenceCardiaqueEtat: frequenceCardiaqueEtat,
        temperatureEtat: temperatureEtat,
        saturationO2Etat: saturationO2Etat
      };
      
      patient.historique = [newHistoriqueEntry, ...(patient.historique || [])].slice(0, 10); // Garder les 10 dernières mesures
      patient.derniereMiseAJour = new Date().toISOString();
      
      // Sauvegarder les évolutions dans les données du patient pour un accès facile
      patient.evolutionsData = evolutions;
      
      return {
        status,
        parametres: patient.parametres,
        alertes
      };
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres vitaux:', err);
    }
  }

  return {
    patientsADomicile,
    patientsHospitalises,
    isLoading,
    error,
    fetchPatientsHospitalises,
    fetchPatientsADomicile,
    getPatientsParChambre,
    getPatientsParService,
    refreshPatientVitals,
    startPatientMonitoring,
    stopPatientMonitoring,
    updatePatientVitals
  }
})
