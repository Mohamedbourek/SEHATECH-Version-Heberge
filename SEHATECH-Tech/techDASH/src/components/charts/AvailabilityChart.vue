<template>
  <div ref="chartContainer" class="h-full w-full relative">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
    <div v-if="year" class="absolute top-0 right-0 text-xs text-gray-500 dark:text-gray-400 p-2">
      Année: {{ year }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  average: {
    type: Number,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  year: {
    type: String,
    default: ''
  }
})

const chartContainer = ref(null)
let chart = null

function initChart() {
  if (!chartContainer.value) return

  const isDark = document.documentElement.classList.contains('dark')
  chart = echarts.init(chartContainer.value, isDark ? 'dark' : undefined)
  updateChart()
}

function updateChart() {
  if (!chart) return

  const isDark = document.documentElement.classList.contains('dark')
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0];
        let tooltip = `${data.name}<br/>Disponibilité effective: ${data.value}%`;
        
        // Add total and available resources if they exist
        if (props.data[data.dataIndex]) {
          const item = props.data[data.dataIndex];
          tooltip += `<br/>Ressources totales: ${item.total || 0}`;
          tooltip += `<br/>Ressources disponibles: ${item.available || 0}`;
          if (item.maintenance !== undefined) {
            tooltip += `<br/>Ressources en maintenance: ${item.maintenance}`;
          }
        }
        
        return tooltip;
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
      boundaryGap: false,
      data: props.data.map(item => item.date),
      axisLabel: {
        color: isDark ? '#9ca3af' : '#666'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: isDark ? '#9ca3af' : '#666'
      }
    },
    series: [
      {
        name: 'Disponibilité effective',
        data: props.data.map(item => item.effectiveValue || item.value),
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)'
            },
            {
              offset: 1,
              color: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.05)'
            }
          ])
        },
        markLine: props.average ? {
          silent: true,
          lineStyle: {
            color: '#f59e0b'
          },
          data: [
            {
              yAxis: props.average,
              name: 'Moyenne'
            }
          ],
          label: {
            formatter: 'Moyenne: {c}%',
            position: 'insideEndTop'
          }
        } : undefined
      }
    ]
  }

  chart.setOption(option)
}

// Watch for changes in props
watch(() => props.data, updateChart, { deep: true })
watch(() => props.average, updateChart)
watch(() => props.loading, (newVal) => {
  if (!newVal) updateChart()
})

// Handle theme changes
const handleThemeChange = () => {
  if (chart) {
    const isDark = document.documentElement.classList.contains('dark')
    chart.dispose()
    chart = echarts.init(chartContainer.value, isDark ? 'dark' : undefined)
    updateChart()
  }
}

// Initialize chart
onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chart && chart.resize()
  })
  document.documentElement.addEventListener('themechange', handleThemeChange)
})

// Clean up
onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', () => {
    chart && chart.resize()
  })
  document.documentElement.removeEventListener('themechange', handleThemeChange)
})
</script>