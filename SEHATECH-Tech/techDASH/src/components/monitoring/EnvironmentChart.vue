<template>
  <div class="w-full h-full" ref="chartContainer"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  tempData: {
    type: Array,
    required: true
  },
  humidityData: {
    type: Array,
    required: true
  }
})

const chartContainer = ref(null)
let chart = null

onMounted(() => {
  chart = echarts.init(chartContainer.value)
  updateChart()
})

watch([() => props.tempData, () => props.humidityData], updateChart, { deep: true })

function updateChart() {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['Température', 'Humidité'],
      textStyle: {
        color: '#9CA3AF'
      }
    },
    grid: {
      top: 40,
      right: 20,
      bottom: 20,
      left: 40,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}h`),
      axisLine: {
        lineStyle: {
          color: '#4B5563'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Température (°C)',
        min: 15,
        max: 30,
        axisLine: {
          lineStyle: {
            color: '#4B5563'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#374151'
          }
        }
      },
      {
        type: 'value',
        name: 'Humidité (%)',
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            color: '#4B5563'
          }
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: 'Température',
        type: 'line',
        smooth: true,
        data: props.tempData,
        lineStyle: {
          width: 3,
          color: '#EF4444'
        },
        symbol: 'none'
      },
      {
        name: 'Humidité',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: props.humidityData,
        lineStyle: {
          width: 3,
          color: '#3B82F6'
        },
        symbol: 'none'
      }
    ]
  }

  chart?.setOption(option)
}

// Gestion du redimensionnement
window.addEventListener('resize', () => {
  chart?.resize()
})
</script> 