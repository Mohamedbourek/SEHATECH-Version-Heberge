import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '@/services/axios';

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref([
    { label: 'Patients actifs', value: 0, trend: 0, icon: 'Users', iconBg: 'bg-blue-100' },
    { label: "Rendez-vous aujourd'hui", value: 0, trend: 0, icon: 'Clock', iconBg: 'bg-green-100' },
    { label: 'Consultations prévues', value: 0, trend: 0, icon: 'Stethoscope', iconBg: 'bg-purple-100' },
    { label: 'Alertes patients', value: 0, trend: 0, icon: 'AlertTriangle', iconBg: 'bg-red-100' }
  ]);
  const isLoading = ref(false);
  const error = ref(null);

  async function fetchDashboardStats() {
    try {
      isLoading.value = true;
      error.value = null;
      
      // Récupérer les statistiques depuis l'API
      // Essayer d'abord l'endpoint spécifique aux médecins, puis celui de l'administrateur si le premier échoue
      let response;
      try {
        response = await apiClient.get('/medecins/stats/general', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
        });
      } catch (err) {
        // Si l'endpoint médecin échoue, essayer l'endpoint admin
        response = await apiClient.get('/admin/stats/dashboard', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('Token_MEDECIN')}` }
        });
      }
      
      // Analyser la réponse pour extraire les statistiques pertinentes
      if (response.data.stats) {
        // Format direct attendu de certains endpoints
        stats.value = response.data.stats;
      } else {
        // Construire les stats à partir de différentes données dans la réponse
        // Format possible: {activePatients, todayAppointments, consultations, alerts, etc.}
        let statsData = [];
        
        // Patient stats
        if (response.data.activePatients !== undefined) {
          statsData.push({
            label: 'Patients actifs',
            value: response.data.activePatients,
            trend: response.data.patientsChange || 0,
            icon: 'Users',
            iconBg: 'bg-blue-100'
          });
        }
        
        // Rendez-vous
        if (response.data.todayAppointments !== undefined) {
          statsData.push({
            label: "Rendez-vous aujourd'hui",
            value: response.data.todayAppointments,
            trend: response.data.appointmentsChange || 0,
            icon: 'Clock',
            iconBg: 'bg-green-100'
          });
        }
        
        // Consultations
        if (response.data.consultations !== undefined) {
          statsData.push({
            label: 'Consultations prévues',
            value: Array.isArray(response.data.consultations) 
              ? response.data.consultations.length 
              : response.data.consultations,
            trend: 0,
            icon: 'Stethoscope',
            iconBg: 'bg-purple-100'
          });
        }
        
        // Alertes
        if (response.data.alerts !== undefined) {
          statsData.push({
            label: 'Alertes patients',
            value: Array.isArray(response.data.alerts) 
              ? response.data.alerts.length 
              : response.data.alerts,
            trend: 0,
            icon: 'AlertTriangle',
            iconBg: 'bg-red-100',
            isAlert: true
          });
        }
        
        // Si on a des stats, les utiliser
        if (statsData.length > 0) {
          stats.value = statsData;
        }
      }
      
      console.log('Dashboard stats:', stats.value);
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch dashboard statistics';
      console.error('Dashboard stats error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    stats,
    isLoading,
    error,
    fetchDashboardStats
  };
});
