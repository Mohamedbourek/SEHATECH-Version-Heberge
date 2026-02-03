<template>
  <div class="w-full h-64" ref="chartContainer"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
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

watch(() => props.data, updateChart, { deep: true })

function updateChart() {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>
                Disponibilité: <b>${data.value}%</b><br/>
                Tendance: ${getTrendLabel(props.data[data.dataIndex].trend)}`
      }
    },
    grid: {
      top: 10,
      right: 10,
      bottom: 20,
      left: 120,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
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
    yAxis: {
      type: 'category',
      data: props.data.map(item => item.name),
      axisLine: {
        lineStyle: {
          color: '#4B5563'
        }
      }
    },
    series: [
      {
        name: 'Disponibilité',
        type: 'bar',
        data: props.data.map(item => ({
          value: item.value,
          itemStyle: {
            color: getBarColor(item.value)
          }
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#9CA3AF'
        }
      }
    ]
  }

  chart?.setOption(option)
}

function getBarColor(value) {
  if (value >= 95) return '#10B981' // green-500
  if (value >= 90) return '#3B82F6' // blue-500
  if (value >= 85) return '#F59E0B' // yellow-500
  return '#EF4444' // red-500
}

function getTrendLabel(trend) {
  return {
    up: '↑ En hausse',
    down: '↓ En baisse',
    stable: '→ Stable'
  }[trend] || trend
}

// Gestion du redimensionnement
window.addEventListener('resize', () => {
  chart?.resize()
})
</script> 