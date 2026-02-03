<template>
  <div ref="chartContainer" class="w-full h-full"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.mtbf && value.mttr
    }
  }
})

const chartContainer = ref(null)
let chart = null

const initChart = () => {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)
  updateChart()
}

const updateChart = () => {
  if (!chart) return

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params) {
        const date = format(new Date(params[0].axisValue), 'PPP', { locale: fr })
        let content = `<div class="font-medium mb-1">${date}</div>`
        params.forEach(param => {
          const value = param.seriesName === 'MTBF' ? 
            `${param.value} heures` : 
            `${param.value} heures`
          content += `
            <div class="flex items-center justify-between space-x-4">
              <span style="color: ${param.color}">${param.seriesName}:</span>
              <span class="font-medium">${value}</span>
            </div>
          `
        })
        return content
      }
    },
    legend: {
      data: ['MTBF', 'MTTR'],
      top: 0,
      textStyle: {
        color: '#666'
      }
    },
    grid: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 60,
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: props.data.dates || generateDates(),
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          formatter: (value) => format(new Date(value), 'dd/MM', { locale: fr }),
          color: '#666'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'MTBF',
        min: 0,
        axisLabel: {
          formatter: '{value} h',
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#eee'
          }
        }
      },
      {
        type: 'value',
        name: 'MTTR',
        min: 0,
        axisLabel: {
          formatter: '{value} h',
          color: '#666'
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: 'MTBF',
        type: 'bar',
        data: props.data.mtbf,
        itemStyle: {
          color: '#60A5FA'
        },
        emphasis: {
          focus: 'series'
        },
        barMaxWidth: 40
      },
      {
        name: 'MTTR',
        type: 'line',
        yAxisIndex: 1,
        data: props.data.mttr,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#F97316'
        },
        itemStyle: {
          color: '#F97316',
          borderWidth: 2,
          borderColor: '#fff'
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }

  chart.setOption(option)
}

// Génère des dates pour les 30 derniers jours
function generateDates() {
  const dates = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString())
  }
  return dates
}

// Surveillance des changements
watch(() => props.data, updateChart, { deep: true })

// Gestion du cycle de vie
onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', () => chart?.resize())
})
</script>

<style scoped>
:deep(.echarts-tooltip) {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
         shadow-lg rounded-lg p-2 text-sm;
}
</style> 