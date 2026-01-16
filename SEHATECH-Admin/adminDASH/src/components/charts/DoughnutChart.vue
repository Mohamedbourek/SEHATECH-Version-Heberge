<template>
  <div class="relative">
    <Doughnut
      :data="chartData"
      :options="mergedOptions"
    />
  </div>
</template>

<script setup name="DoughnutChart">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'

// Enregistrer les composants nécessaires
ChartJS.register(ArcElement, Tooltip, Legend, Title)

const props = defineProps({
  data: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.labels && 
             value.datasets && 
             Array.isArray(value.labels) && 
             Array.isArray(value.datasets)
    }
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

// Options par défaut pour le graphique en anneau
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${percentage}%`
        }
      }
    }
  }
}

// Fusionner les options par défaut avec les options personnalisées
const mergedOptions = computed(() => ({
  ...defaultOptions,
  ...props.options
}))

// Données du graphique
const chartData = computed(() => ({
  labels: props.data.labels,
  datasets: props.data.datasets.map(dataset => ({
    ...dataset,
    borderWidth: 2,
    borderColor: 'white',
    hoverOffset: 4
  }))
}))
</script> 