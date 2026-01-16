import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import axios from '@/services/axios'

export const useChambreStore = defineStore('chambre', () => {
  // État
  const chambres = ref([])
  const stats = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  
  // Getters (computed)
  const chambresDisponibles = computed(() => 
    chambres.value.filter(chambre => chambre.etat === 'disponible')
  )
  
  const chambresOccupees = computed(() => 
    chambres.value.filter(chambre => chambre.etat === 'occupee')
  )
  
  const chambresEnMaintenance = computed(() => 
    chambres.value.filter(chambre => chambre.etat === 'maintenance')
  )
  
  const chambresEnNettoyage = computed(() => 
    chambres.value.filter(chambre => chambre.etat === 'nettoyage')
  )
  
  const chambresAvecCamera = computed(() => 
    chambres.value.filter(chambre => 
      ['soins_intensifs', 'suite', 'technique'].includes(chambre.type)
    )
  )
  
  const areAllCamerasActive = computed(() => {
    const chambresWithCamera = chambresAvecCamera.value
    return chambresWithCamera.length > 0 && 
           chambresWithCamera.every(chambre => chambre.camerasActive)
  })
  
  // Actions
  async function fetchChambres() {
    try {
      console.log('[chambreStore] Récupération des chambres...');
      isLoading.value = true;
      error.value = null;
      
      const token = localStorage.getItem('Token_MEDECIN');
      const response = await axios.get('/chambres', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Traiter les données des chambres
        const chambresData = response.data.data;
        console.log(`[chambreStore] ${chambresData.length} chambres récupérées`);
        
        // Initialiser l'état des caméras pour les chambres qui en ont
        chambres.value = chambresData.map(chambre => {
          const hasCamera = hasCameraSupport(chambre.type);
          
          // Log pour chaque chambre
          console.log(`[chambreStore] Chambre ${chambre.numero}, type: ${chambre.type}, support caméra: ${hasCamera}`);
          
          return {
            ...chambre,
            camerasActive: hasCamera ? false : null
          };
        });
        
        // Compter les chambres avec caméra
        const chambresAvecCameraCount = chambres.value.filter(c => hasCameraSupport(c.type)).length;
        console.log(`[chambreStore] ${chambresAvecCameraCount} chambres avec support de caméra`);
      } else {
        throw new Error('Échec de la récupération des chambres');
      }
    } catch (err) {
      console.error('[chambreStore] Erreur lors de la récupération des chambres:', err);
      error.value = "Erreur lors de la récupération des chambres";
    } finally {
      isLoading.value = false;
    }
  }
  
  async function fetchStats() {
    try {
      isLoading.value = true
      error.value = null
      
      const token = localStorage.getItem('Token_MEDECIN')
      const response = await axios.get('/chambres/occupation', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.data.success) {
        stats.value = response.data.statistiques
      } else {
        throw new Error('Échec de la récupération des statistiques')
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err)
      error.value = "Erreur lors de la récupération des statistiques"
    } finally {
      isLoading.value = false
    }
  }
  
  async function updateChambreEtat(id, etat) {
    try {
      isLoading.value = true
      error.value = null
      
      const token = localStorage.getItem('Token_MEDECIN')
      const response = await axios.patch(`/chambres/${id}/etat`, 
        { etat }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (response.data) {
        // Mettre à jour localement
        const chambre = chambres.value.find(c => c._id === id)
        if (chambre) {
          chambre.etat = etat
        }
        
        // Rafraîchir les statistiques
        await fetchStats()
      } else {
        throw new Error('Échec de la mise à jour de l\'état de la chambre')
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'état de la chambre:', err)
      error.value = "Erreur lors de la mise à jour de l'état de la chambre"
    } finally {
      isLoading.value = false
    }
  }
  
  async function getChambreById(id) {
    try {
      isLoading.value = true
      error.value = null
      
      const token = localStorage.getItem('Token_MEDECIN')
      const response = await axios.get(`/chambres/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.data.success) {
        return {
          ...response.data.data,
          camerasActive: hasCameraSupport(response.data.data.type) ? false : null
        }
      } else {
        throw new Error('Échec de la récupération de la chambre')
      }
    } catch (err) {
      console.error(`Erreur lors de la récupération de la chambre ${id}:`, err)
      error.value = "Erreur lors de la récupération de la chambre"
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  async function toggleRoomCamera(chambreId) {
    const chambre = chambres.value.find(c => c._id === chambreId)
    if (chambre && hasCameraSupport(chambre.type)) {
      chambre.camerasActive = !chambre.camerasActive
      console.log(`[ChambreStore] Caméra de la chambre ${chambre.numero} ${chambre.camerasActive ? 'activée' : 'désactivée'}`)
      
      // Sauvegarder l'état mis à jour
      saveChambresState()
    }
  }
  
  function toggleAllCameras() {
    // Vérifier si au moins une caméra est active
    const atLeastOneActive = chambres.value.some(chambre => 
      hasCameraSupport(chambre.type) && chambre.camerasActive
    );
    
    // Si au moins une est active, on désactive toutes, sinon on active toutes
    chambres.value.forEach(chambre => {
      if (hasCameraSupport(chambre.type)) {
        chambre.camerasActive = !atLeastOneActive;
      }
    });
    
    saveChambresState();
    
    console.log(`[ChambreStore] Toutes les caméras sont maintenant ${!atLeastOneActive ? 'activées' : 'désactivées'}`);
  }
  
  // Enregistrer l'état des chambres
  const saveChambresState = () => {
    try {
      const chambresState = chambres.value.map(chambre => ({
        _id: chambre._id,
        camerasActive: chambre.camerasActive
      }));
      
      localStorage.setItem('chambresState', JSON.stringify(chambresState));
      console.log('[ChambreStore] État des chambres sauvegardé');
    } catch (error) {
      console.error('[ChambreStore] Erreur lors de la sauvegarde de l\'état des chambres:', error);
    }
  };
  
  // Charger l'état des chambres
  const loadChambresState = () => {
    try {
      const savedState = localStorage.getItem('chambresState');
      if (savedState) {
        const chambresState = JSON.parse(savedState);
        
        // Appliquer l'état sauvegardé aux chambres
        chambres.value.forEach(chambre => {
          const savedChambre = chambresState.find(c => c._id === chambre._id);
          if (savedChambre) {
            chambre.camerasActive = savedChambre.camerasActive;
          }
        });
        
        console.log('[ChambreStore] État des chambres chargé');
      }
    } catch (error) {
      console.error('[ChambreStore] Erreur lors du chargement de l\'état des chambres:', error);
    }
  };
  
  // Appliquer l'état des caméras après chargement des chambres
  watch(chambres, (newChambres) => {
    if (newChambres.length > 0) {
      // Si on a des chambres, on charge l'état
      loadChambresState();
    }
  }, { immediate: true });
  
  // Fonctions utilitaires
  function hasCameraSupport(type) {
    const supportedTypes = ['soins_intensifs', 'suite', 'technique'];
    const hasSupport = supportedTypes.includes(type);
    
    console.log(`[chambreStore] Vérification du support de caméra pour le type "${type}": ${hasSupport}`);
    
    return hasSupport;
  }
  
  function canChangeRoomState(chambre) {
    // Vérifier si la chambre a des hospitalisations actives
    const hasActiveHospitalisations = chambre.hospitalisations && 
      chambre.hospitalisations.some(h => !h.dateSortie)
    
    // Ne pas permettre de changer l'état si la chambre est occupée
    if (chambre.etat === 'occupee' && hasActiveHospitalisations) {
      return false
    }
    
    // Autoriser le changement d'état pour les chambres disponibles, en maintenance ou en nettoyage
    return ['disponible', 'maintenance', 'nettoyage'].includes(chambre.etat)
  }
  
  function getNextState(currentState) {
    switch (currentState) {
      case 'disponible':
        return 'maintenance'
      case 'maintenance':
        return 'disponible'
      case 'nettoyage':
        return 'disponible'
      default:
        return 'disponible'
    }
  }
  
  function getStateChangeLabel(currentState) {
    switch (currentState) {
      case 'disponible':
        return 'Marquer en maintenance'
      case 'maintenance':
        return 'Marquer disponible'
      case 'nettoyage':
        return 'Marquer disponible'
      default:
        return 'Changer l\'état'
    }
  }
  
  // Formatage pour l'affichage
  function formatType(type) {
    const types = {
      'simple': 'Chambre simple',
      'double': 'Chambre double',
      'suite': 'Suite',
      'soins_intensifs': 'Soins intensifs',
      'technique': 'Salle technique'
    }
    return types[type] || type
  }
  
  function formatEtat(etat) {
    const etats = {
      'disponible': 'Disponible',
      'occupee': 'Occupée',
      'maintenance': 'En maintenance',
      'nettoyage': 'En nettoyage'
    }
    return etats[etat] || etat
  }
  
  // Retourner les propriétés et méthodes exposées
  return {
    // État
    chambres,
    stats,
    isLoading,
    error,
    
    // Getters
    chambresDisponibles,
    chambresOccupees,
    chambresEnMaintenance,
    chambresEnNettoyage,
    chambresAvecCamera,
    areAllCamerasActive,
    
    // Actions
    fetchChambres,
    fetchStats,
    updateChambreEtat,
    getChambreById,
    toggleRoomCamera,
    toggleAllCameras,
    
    // Utilitaires
    hasCameraSupport,
    canChangeRoomState,
    getNextState,
    getStateChangeLabel,
    formatType,
    formatEtat
  }
}) 