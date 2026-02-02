<template>
  <div class="space-y-6">
    
    
    <!-- Cartes statistiques -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Patients actifs"
        :value="getStats.activePatients"
        :icon="Users"
        color="blue"
        :change="getStats.patientsChange"
      />
      <StatCard
        title="Rendez-vous aujourd'hui"
        :value="getStats.todayAppointments"
        :icon="Calendar"
        color="green"
        :change="getStats.appointmentsChange"
      />
      <StatCard
        title="Taux d'occupation"
        :value="getStats.occupancyRate"
        :icon="Bed"
        color="yellow"
        :change="getStats.occupancyChange"
        suffix="%"
      />
      <StatCard
        title="Alertes actives"
        :value="getStats.activeAlerts"
        :icon="AlertCircle"
        color="red"
        :change="getStats.alertsChange"
      />
    </div>

    <!-- Occupation des chambres et notifications -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Occupation des chambres -->
      <Card class="col-span-1">
        <CardHeader>
          <CardTitle>Occupation des chambres</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="getRoomOccupancy && getRoomOccupancy.length > 0" class="space-y-4">
            <div v-for="room in getRoomOccupancy" :key="room.type" class="flex items-center">
              <div class="flex-1">
                <div class="flex items-center">
                  <Bed class="mr-2 h-4 w-4" />
                  <span class="font-medium capitalize">{{ room.type }}</span>
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ room.occupied }}/{{ room.total || 0 }} lits occupés
                </div>
              </div>
              <div class="w-32">
                <Progress :value="room.occupancy_rate || 0" />
              </div>
            </div>
          </div>
          <div v-else class="py-8 text-center">
            <AlertCircle class="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p class="text-gray-500">Données d'occupation non disponibles</p>
            <p class="text-sm text-gray-400 mt-1">Veuillez réessayer plus tard</p>
          </div>
        </CardContent>
      </Card>
      <Card class="col-span-1">
        <CardHeader>
          <CardTitle>Activités récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="currentActivities.length > 0" class="space-y-4">
            <div v-for="activity in currentActivities" :key="activity.id" class="flex items-start space-x-4">
              <Avatar>
                <AvatarFallback>
                  {{ activity.patient ? `${activity.patient.prenom.charAt(0)}${activity.patient.nom.charAt(0)}` : 'NA' }}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1">
                <div class="flex items-center">
                  <p class="text-sm font-medium">{{ activity.title }}</p>
                  <span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    {{ activity.type }}
                  </span>
                </div>
                <p class="text-sm mt-1">{{ activity.description }}</p>
                <div class="flex items-center text-xs text-muted-foreground mt-1">
                  <span class="font-medium">{{ activity.patient?.prenom }} {{ activity.patient?.nom }}</span>
                  <span class="mx-1">•</span>
                  <span>Dr. {{ activity.medecin?.prenom }} {{ activity.medecin?.nom }}</span>
                  <span class="mx-1">•</span>
                  <span>{{ formatTimeAgo(activity.created_at) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Unified Pagination -->
            <div class="flex items-center justify-between border-t pt-4 mt-4">
              <!-- Info text -->
              <div class="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                Affichage de <span class="font-medium">{{ activitiesMeta.from || 0 }}</span> à <span class="font-medium">{{ activitiesMeta.to || 0 }}</span> sur <span class="font-medium">{{ activitiesMeta.total || 0 }}</span> activités
              </div>

              <!-- Controls -->
              <div class="flex items-center space-x-2">
                <button 
                  @click="loadPreviousPage"
                  :disabled="activitiesMeta.current_page <= 1 || isLoadingActivities"
                  class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Page précédente"
                >
                  <ChevronLeft class="h-4 w-4" />
                </button>

                <div class="flex items-center space-x-1">
                  <template v-for="(page, index) in displayedPages" :key="index">
                    <span v-if="page === '...'" class="px-2 py-1 text-gray-400">...</span>
                    <button 
                      v-else
                      @click="loadActivitiesPage(page)"
                      :class="[
                        'min-w-[32px] h-8 px-2 flex items-center justify-center text-sm rounded-md transition-colors',
                        activitiesMeta.current_page === page 
                          ? 'bg-blue-600 text-white font-medium shadow-sm' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      ]"
                    >
                      {{ page }}
                    </button>
                  </template>
                </div>

                <button 
                  @click="loadNextPage"
                  :disabled="activitiesMeta.current_page >= activitiesMeta.last_page || isLoadingActivities"
                  class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Page suivante"
                >
                  <ChevronRight class="h-4 w-4" />
                </button>
                
                <div v-if="isLoadingActivities" class="ml-2">
                  <RefreshCw class="h-4 w-4 animate-spin text-blue-500" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="py-8 text-center">
            <Info class="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p class="text-gray-500">Aucune activité récente</p>
            <p class="text-sm text-gray-400 mt-1">Les activités apparaîtront ici</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Activités récentes et consultations -->
    <div class="grid gap-6 lg:grid-cols-2">
     <!-- Chiffre d'affaires mensuel -->
     <Card class="col-span-1">
        <CardHeader>
          <CardTitle>Chiffre d'affaires mensuel</CardTitle>
          <div class="text-sm text-muted-foreground">
            Évolution du chiffre d'affaires sur les 12 derniers mois
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="monthlyRevenue && monthlyRevenue.length > 0" class="h-80">
            <BarChart 
              :chart-data="revenueChartData" 
              :options="revenueChartOptions"
            />
          </div>
          <div v-else-if="isLoadingRevenue" class="h-80 flex items-center justify-center">
            <RefreshCw class="h-8 w-8 animate-spin text-gray-400" />
          </div>
          <div v-else class="py-8 text-center">
            <AlertCircle class="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p class="text-gray-500">Données de facturation non disponibles</p>
            <p class="text-sm text-gray-400 mt-1">Veuillez réessayer plus tard</p>
          </div>
        </CardContent>
      </Card>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format, formatDistanceToNow, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Users,
  Calendar,
  Bed,
  AlertTriangle,
  Bell,
  AlertCircle,
  Info,
  Settings,
  Shield,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import StatCard from '@/components/dashboard/StatCard.vue'
import { useStatsStore } from '@/stores/stats'
import { useBillingStore } from '@/stores/billing'
import { useToast } from '@/composables/useToast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'

const statsStore = useStatsStore()
const billingStore = useBillingStore()
const toast = useToast()
const isLoadingActivities = ref(false)
const isLoadingDashboard = ref(false)
const isLoadingRevenue = ref(false)
const monthlyRevenue = ref([]) // This is already initialized correctly

// Fonction pour calculer le chiffre d'affaires mensuel
const calculateMonthlyRevenue = () => {
  isLoadingRevenue.value = true
  try {
    // Récupérer les factures
    const invoices = billingStore.invoices
    
   
    const months = []
    const today = new Date()
    
    const revenueByMonth = {}
  
    for (let i = 0; i < 12; i++) {
      const date = subMonths(today, i)
      const monthKey = format(date, 'yyyy-MM')
      const monthLabel = format(date, 'MMM yyyy', { locale: fr })
      
      revenueByMonth[monthKey] = {
        month: monthLabel,
        revenue: 0
      }
      
      months.unshift(monthKey) 
    }
    
    
    if (Array.isArray(invoices)) {
      invoices.forEach(invoice => {
       
        if (invoice.statut === 'PAYEE' || invoice.statut === 'PAIEMENT_PARTIEL') {
          const invoiceDate = parseISO(invoice.datePaiement || invoice.dateEmission)
          const monthKey = format(invoiceDate, 'yyyy-MM')
          
          // Vérifier si le mois est dans notre période de 12 mois
          if (revenueByMonth[monthKey]) {
            revenueByMonth[monthKey].revenue += invoice.montantPaye || 0
          }
        }
      })
    }
    
    // Convertir l'objet en tableau pour le graphique
    monthlyRevenue.value = months.map(month => revenueByMonth[month])
    
    console.log('Monthly revenue calculated:', monthlyRevenue.value)
  } catch (error) {
    console.error('Error calculating monthly revenue:', error)
    toast.error('Erreur lors du calcul du chiffre d\'affaires mensuel')
    // Ensure monthlyRevenue is at least an empty array
    monthlyRevenue.value = []
  } finally {
    isLoadingRevenue.value = false
  }
}

// Données pour le graphique de chiffre d'affaires
const revenueChartData = computed(() => {
  return {
    labels: monthlyRevenue.value.map(item => item.month),
    datasets: [
      {
        label: 'Chiffre d\'affaires (DZD)',
        data: monthlyRevenue.value.map(item => item.revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  }
})

// Options pour le graphique de chiffre d'affaires
const revenueChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('fr-DZ') + ' DZD'
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.raw.toLocaleString('fr-DZ') + ' DZD'
          }
        }
      }
    }
  }
})

// Directly use the getters from the store
const { 
  getStats, 
  getRoomOccupancy, 
  getRecentUsers, 
  getNotifications, 
  getConsultations, 
  getActivities,
  getActivitiesMeta
} = statsStore


const currentActivities = computed(() => {
  console.log("Computing currentActivities, store data:", statsStore.getActivities)
  // Create a new array to ensure reactivity
  return Array.isArray(statsStore.getActivities) ? [...statsStore.getActivities] : []
})

// Then, let's modify the loadActivitiesPage function to ensure the UI updates
const loadActivitiesPage = async (page) => {
  try {
    console.log('Loading activities page:', page)
    
   
    isLoadingActivities.value = true
    
    const pageNumber = parseInt(page, 10)
    
    activitiesMeta.value.current_page = pageNumber
    
    // Fetch activities for the specified page
    await statsStore.fetchRecentActivities(pageNumber)
    
    // Force a UI update by creating a new reference for activitiesMeta
    activitiesMeta.value = { ...statsStore.getActivitiesMeta }
    
    // Log the current state for debugging
    console.log(`After loading page ${pageNumber}:`)
    console.log(`- Activities in store:`, statsStore.getActivities)
    console.log(`- Current activities computed:`, currentActivities.value)
    console.log(`- Meta information:`, activitiesMeta.value)
    
    return true
  } catch (error) {
    console.error('Error calculating monthly revenue:', error)
    toast.error('Erreur lors du calcul du chiffre d\'affaires mensuel')
  } finally {
    // Always reset loading state
    isLoadingActivities.value = false
  }
}



// Replace the pagination variables with the new structure
const activitiesMeta = ref({
  current_page: 1,
  per_page: 4,
  last_page: 1,
  total: 0,
  from: 0,
  to: 0
})

const displayedPages = computed(() => {
  const current = activitiesMeta.value.current_page
  const total = activitiesMeta.value.last_page
  const delta = 1 // Number of pages to show around current page
  
  if (total <= 1) return [1]

  const range = []
  const rangeWithDots = []
  let l

  // Always show first page
  range.push(1)

  // Calculate range around current page
  for (let i = current - delta; i <= current + delta; i++) {
    if (i < total && i > 1) {
      range.push(i)
    }
  }

  // Always show last page
  range.push(total)

  // Add dots where needed
  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
})

const formatTimeAgo = (date) => {
  if (!date) return 'Date inconnue';
  
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Date invalide';
  }
}
// Functions to handle pagination
const loadNextPage = async () => {
  const nextPage = activitiesMeta.value.current_page + 1
  console.log('Attempting to load next page:', nextPage, 'current page:', activitiesMeta.value.current_page, 'last page:', activitiesMeta.value.last_page)
  
  if (nextPage <= activitiesMeta.value.last_page) {
    await loadActivitiesPage(nextPage)
  } else {
    console.warn('Cannot load next page: already at last page')
  }
}

const loadPreviousPage = async () => {
  const prevPage = activitiesMeta.value.current_page - 1
  console.log('Attempting to load previous page:', prevPage, 'current page:', activitiesMeta.value.current_page)
  
  if (prevPage >= 1) {
    await loadActivitiesPage(prevPage)
  } else {
    console.warn('Cannot load previous page: already at first page')
  }
}


// Update loadDashboardData to include pagination
const loadDashboardData = async () => {
  try {
    // Try to load the dashboard stats first with better error handling
    try {
      await statsStore.fetchDashboardStats()
      console.log('Dashboard stats loaded successfully:', statsStore.getStats)
    } catch (statsError) {
      console.error('Error loading dashboard stats:', statsError)
      toast.error('Erreur lors du chargement des statistiques principales')
      // Continue with other data even if main stats fail
    }
    
    // Load room occupancy with better error handling
    try {
      await statsStore.fetchRoomOccupancy()
      console.log('Room occupancy loaded successfully:', statsStore.getRoomOccupancy)
    } catch (roomError) {
      console.error('Error loading room occupancy:', roomError)
      toast.error('Erreur lors du chargement des données d\'occupation')
      // Provide fallback data if needed
      // statsStore.dashboardStats.value.roomOccupancy = [] // Uncomment if you want to set fallback data
    }
    
    // Continue with other data fetching with similar error handling
    try {
      await statsStore.fetchConsultationsStats()
      console.log('Consultations data loaded successfully')
    } catch (consultError) {
      console.error('Error loading consultation stats:', consultError)
    }
    
    try {
  console.log('Loading initial activities data (page 1)')
  await statsStore.fetchRecentActivities(1) // Explicitly pass 1 as a number
  
  // Update the meta information
  if (statsStore.getActivitiesMeta) {
    activitiesMeta.value = statsStore.getActivitiesMeta
    console.log('Initial activities meta information:', activitiesMeta.value)
  }
  
  console.log('Initial activities data loaded successfully:', getActivities)
} catch (activityError) {
  console.error('Error loading initial activities:', activityError)
}
    
  } catch (error) {
    console.error('Erreur générale lors du chargement des données:', error)
    toast.error('Erreur lors du chargement des données du tableau de bord')
  }
}



// Add this function to manually refresh the dashboard data
const refreshDashboard = async () => {
  isLoadingDashboard.value = true
  try {
    console.log('Manually refreshing dashboard data...')
    
    // Fetch all data in sequence
    await statsStore.fetchDashboardStats()
    await statsStore.fetchRoomOccupancy()
    await statsStore.fetchConsultationsStats()
    
    // Reload the current activities page
    const currentPage = activitiesMeta.value.current_page 
    await statsStore.fetchRecentActivities(currentPage)
    
    // Update the meta information
    if (statsStore.getActivitiesMeta) {
      activitiesMeta.value = { ...statsStore.getActivitiesMeta }
    }
    
    toast.success('Données actualisées avec succès')
    console.log('Dashboard data refreshed successfully')
  } catch (error) {
    console.error('Error refreshing dashboard data:', error)
    toast.error('Erreur lors de l\'actualisation des données')
  } finally {
    isLoadingDashboard.value = false
  }
}

// Update the onMounted function to include revenue calculation
onMounted(async () => {
  // Set loading state to true
  isLoadingDashboard.value = true
  isLoadingRevenue.value = true
  
  try {
    // Initial data load with retry logic
    let retryCount = 0
    const maxRetries = 5
    
    const loadInitialData = async () => {
      try {
        console.log(`Attempting to load dashboard data (attempt ${retryCount + 1}/${maxRetries})`)
        
        // Load all data in sequence
        await statsStore.fetchDashboardStats()
        await statsStore.fetchRoomOccupancy()
        await statsStore.fetchConsultationsStats()

        const currentPage = activitiesMeta.value.current_page 
        await statsStore.fetchRecentActivities(currentPage)
        
        // Update the meta information
        if (statsStore.getActivitiesMeta) {
          activitiesMeta.value = { ...statsStore.getActivitiesMeta }
        }
        
        // Load billing data and calculate monthly revenue
        try {
          await billingStore.fetchInvoices()
          calculateMonthlyRevenue()
        } catch (billingError) {
          console.error('Error loading billing data:', billingError)
          // Ensure monthlyRevenue is at least an empty array
          monthlyRevenue.value = []
        }
        
        console.log('Dashboard data loaded successfully')
        return true
      } catch (error) {
        console.error(`Error loading dashboard data (attempt ${retryCount + 1}):`, error)
        return false
      } finally {
        isLoadingRevenue.value = false
      }
    }
    
    // Try loading data with retries
    let success = await loadInitialData()
    while (!success && retryCount < maxRetries - 1) {
      retryCount++
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      success = await loadInitialData()
    }
    
    if (!success) {
      toast.error('Erreur lors du chargement des données. Veuillez actualiser manuellement.')
    }
  } finally {
    // Reset loading state
    isLoadingDashboard.value = false
  }
  
  // Set up more frequent automatic refreshes (every 30 seconds)
  const autoRefreshInterval = setInterval(async () => {
    try {
      console.log('Auto-refreshing dashboard data...')
      await statsStore.fetchDashboardStats()
      await statsStore.fetchRoomOccupancy()
      await statsStore.fetchConsultationsStats()
      const currentPage = activitiesMeta.value.current_page 
      await statsStore.fetchRecentActivities(currentPage)
    
      console.log('Auto-refresh completed successfully')
    } catch (error) {
      console.error('Error in auto-refresh:', error)
    }
  }, 1000 * 1000) 
  
  onUnmounted(() => {
    //if (refreshInterval) clearInterval(refreshInterval)
    if (autoRefreshInterval) clearInterval(autoRefreshInterval)
  })
})

// Computed properties pour les notifications
const getNotificationTypeClass = (type) => ({
  'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300': type === 'ALERT',
  'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300': type === 'INFO',
  'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300': type === 'SUCCESS',
  'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300': type === 'WARNING',
  'bg-blue-50 dark:bg-blue-900/50': type === 'SYSTEM',
  'bg-red-50 dark:bg-red-900/50': type === 'SECURITY',
  'bg-green-50 dark:bg-green-900/50': type === 'UPDATE',
  'bg-gray-50 dark:bg-gray-900/50': type === 'INFO'
})



const getNotificationIcon = (type) => {
  switch (type) {
    case 'ALERT':
      return AlertCircle
    case 'INFO':
      return Info
    case 'SUCCESS':
      return CheckCircle
    case 'WARNING':
      return AlertTriangle
    case 'SYSTEM':
      return Settings
    case 'SECURITY':
      return Shield
    case 'UPDATE':
      return RefreshCw
    default:
      return Bell
  }
}

const getNotificationIconClass = (type) => ({
  'text-red-600 dark:text-red-400': type === 'ALERT',
  'text-blue-600 dark:text-blue-400': type === 'INFO',
  'text-green-600 dark:text-green-400': type === 'SUCCESS',
  'text-yellow-600 dark:text-yellow-400': type === 'WARNING',
  'text-blue-500': type === 'SYSTEM',
  'text-red-500': type === 'SECURITY',
  'text-green-500': type === 'UPDATE',
  'text-gray-500': type === 'INFO'
})
// Chart type selector
const chartType = ref('doughnut')

// Computed property to format monthly data for bar chart
const getMonthlyChartData = computed(() => {
  if (!getConsultations || !getConsultations.monthly) return null
  
  return {
    labels: getConsultations.monthly.map(item => item.month),
    datasets: [
      {
        label: 'Consultations par mois',
        data: getConsultations.monthly.map(item => item.count),
        backgroundColor: '#4CAF50',
        borderColor: '#388E3C',
        borderWidth: 1
      }
    ]
  }
})
</script>

<style scoped>
.shortcut-card {
  @apply flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm
         hover:shadow-md transition-all duration-200 border border-gray-100
         dark:border-gray-700 hover:border-primary-100 dark:hover:border-primary-900;
}

.icon-wrapper {
  @apply p-3 rounded-lg mr-4;
}

.content h3 {
  @apply font-medium text-gray-900 dark:text-white;
}

.content p {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-1;
}
</style>





