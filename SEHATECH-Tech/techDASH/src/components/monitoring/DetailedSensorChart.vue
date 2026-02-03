<template>
  <div class="w-full h-full">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { Chart, LineElement, PointElement, LineController, CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'chartjs-adapter-date-fns'

// Enregistrer les composants de Chart.js
Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend)

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  color: {
    type: String,
    default: '#22C55E'
  },
  limits: {
    type: Object,
    default: () => ({ min: 0, max: 100 })
  },
  unit: {
    type: String,
    default: ''
  }
})

const chartRef = ref(null)
let chart = null

// Traitement des données pour le graphique
const processedData = computed(() => {
  if (!props.data || props.data.length === 0) {
    return {
      labels: [],
      datasets: [{
        label: 'Aucune donnée',
        data: [],
        borderColor: props.color,
        backgroundColor: `${props.color}20`,
        tension: 0.3
      }]
    }
  }

  let labels = [];
  let values = [];
  
  // Déterminer si les données sont au format {timestamp, value, status} ou juste des valeurs
  if (typeof props.data[0] === 'object' && props.data[0].timestamp) {
    // Format avec objets {timestamp, value, status}
    props.data.forEach(item => {
      labels.push(new Date(item.timestamp));
      values.push(item.value);
    });
  } else {
    // Format avec valeurs simples, générer des timestamps
    values = props.data;
    const now = new Date();
    labels = props.data.map((_, index) => {
      const date = new Date(now);
      date.setSeconds(date.getSeconds() - (props.data.length - index) * 30);
      return date;
    });
  }

  // Créer les limites pour l'affichage
  const limitDatasets = [];
  if (props.limits) {
    if (props.limits.min !== undefined) {
      limitDatasets.push({
        label: 'Limite basse',
        data: Array(labels.length).fill(props.limits.min),
        borderColor: 'rgba(234, 179, 8, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      });
    }
    
    if (props.limits.max !== undefined) {
      limitDatasets.push({
        label: 'Limite haute',
        data: Array(labels.length).fill(props.limits.max),
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      });
    }
  }

  return {
    labels,
    datasets: [
      {
        label: 'Mesures',
        data: values,
        borderColor: props.color,
        backgroundColor: `${props.color}20`,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      ...limitDatasets
    ]
  };
});

// Configuration du graphique
const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          tooltipFormat: 'PPp',
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        adapters: {
          date: {
            locale: fr
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6
        }
      },
      y: {
        beginAtZero: false,
        grace: '5%',
        grid: {
          color: 'rgba(160, 174, 192, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value + (props.unit ? ` ${props.unit}` : '');
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: 'rgba(203, 213, 225, 0.5)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        boxPadding: 4,
        callbacks: {
          label: function(context) {
            return `Valeur: ${context.parsed.y}${props.unit ? ` ${props.unit}` : ''}`;
          }
        }
      }
    }
  };
});

onMounted(() => {
  if (chartRef.value) {
    initializeChart();
  }
})

watch(() => props.data, () => {
  updateChart();
}, { deep: true })

watch(() => props.color, () => {
  updateChart();
})

function initializeChart() {
  // Créer le graphique
  chart = new Chart(chartRef.value, {
    type: 'line',
    data: processedData.value,
    options: chartOptions.value
  });
}

function updateChart() {
  if (chart) {
    chart.data = processedData.value;
    chart.options = chartOptions.value;
    chart.update();
  }
}

onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
})
</script>

<style scoped>
:deep(.chartjs-tooltip) {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
         shadow-lg rounded-lg p-2 text-sm;
}
</style> 