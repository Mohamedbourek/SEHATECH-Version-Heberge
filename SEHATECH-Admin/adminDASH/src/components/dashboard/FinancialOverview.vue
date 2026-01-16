<template>
  <div class="space-y-6">
    <!-- Résumé financier -->
    <div class="grid grid-cols-2 gap-4">
      <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p class="text-sm font-medium text-green-600 dark:text-green-400">
          Revenus du mois
        </p>
        <p class="mt-2 text-2xl font-semibold text-green-700 dark:text-green-300">
          {{ formatCurrency(data.monthlyRevenue) }}
        </p>
        <p class="mt-1 text-sm text-green-600 dark:text-green-400">
          <span class="inline-flex items-center">
            <TrendingUp v-if="data.revenueGrowth > 0" class="w-4 h-4 mr-1" />
            <TrendingDown v-else class="w-4 h-4 mr-1" />
            {{ Math.abs(data.revenueGrowth) }}% vs mois dernier
          </span>
        </p>
      </div>

      <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">
          Factures en attente
        </p>
        <p class="mt-2 text-2xl font-semibold text-blue-700 dark:text-blue-300">
          {{ formatCurrency(data.pendingAmount) }}
        </p>
        <p class="mt-1 text-sm text-blue-600 dark:text-blue-400">
          {{ data.pendingInvoices }} factures non réglées
        </p>
      </div>
    </div>

    <!-- Graphique des revenus -->
    <div class="h-48">
      <div ref="chartContainer" class="w-full h-full"></div>
    </div>

    <!-- Liste des dernières transactions -->
    <div class="space-y-3">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
        Dernières transactions
      </h4>
      <div class="space-y-2">
        <div 
          v-for="transaction in data.recentTransactions" 
          :key="transaction.id"
          class="flex items-center justify-between py-2"
        >
          <div class="flex items-center space-x-3">
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="transactionTypeClasses[transaction.type].bg"
            >
              <component 
                :is="transactionTypeClasses[transaction.type].icon"
                class="w-4 h-4"
                :class="transactionTypeClasses[transaction.type].iconColor"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ transaction.description }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(transaction.date) }}
              </p>
            </div>
          </div>
          <p 
            class="text-sm font-medium"
            :class="transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'"
          >
            {{ transaction.type === 'credit' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-vue-next'
import { useCurrency } from '@/composables/useCurrency'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const { formatCurrency } = useCurrency()

const chartContainer = ref(null)
let chart = null

const transactionTypeClasses = {
  credit: {
    bg: 'bg-green-100 dark:bg-green-900/50',
    iconColor: 'text-green-600 dark:text-green-400',
    icon: ArrowUpCircle
  },
  debit: {
    bg: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
    icon: ArrowDownCircle
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'Pp', { locale: fr })
}

// Configuration et initialisation du graphique
const initChart = () => {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)
  updateChart()
}

const updateChart = () => {
  if (!chart || !props.data.revenueHistory) return

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const value = params[0].value
        return `${params[0].axisValue}<br/>${formatCurrency(value)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.revenueHistory.map(item => item.date),
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => formatCurrency(value),
        color: '#666'
      }
    },
    series: [
      {
        data: props.data.revenueHistory.map(item => item.amount),
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.1
        },
        itemStyle: {
          color: '#60A5FA'
        },
        lineStyle: {
          width: 2
        }
      }
    ]
  }

  chart.setOption(option)
}

watch(() => props.data, updateChart, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', () => chart?.resize())
})
</script> 