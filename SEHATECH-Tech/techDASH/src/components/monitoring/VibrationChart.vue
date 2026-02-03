<template>
  <div class="w-full h-full" ref="chartContainer"></div>
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
    grid: {
      top: 10,
      right: 10,
      bottom: 20,
      left: 40,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: props.data.length }, (_, i) => i),
      axisLine: {
        lineStyle: {
          color: '#4B5563'
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
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
    series: [{
      data: props.data,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: 3,
        color: '#3B82F6'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59,130,246,0.5)' },
          { offset: 1, color: 'rgba(59,130,246,0.1)' }
        ])
      }
    }]
  }

  chart?.setOption(option)
}

// Gestion du redimensionnement
window.addEventListener('resize', () => {
  chart?.resize()
})
</script> 