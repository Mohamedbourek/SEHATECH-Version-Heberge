<template>
  <div ref="chartContainer" class="w-full h-full"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true
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
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#666'
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: props.data.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: getFailureColor(item.name)
          }
        }))
      }
    ]
  }

  chart.setOption(option)
}

function getFailureColor(type) {
  const colors = {
    'Usure normale': '#60A5FA',
    'Erreur utilisateur': '#F97316',
    'Panne électrique': '#EAB308',
    'Calibration': '#8B5CF6',
    'Autre': '#94A3B8'
  }
  return colors[type] || '#94A3B8'
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