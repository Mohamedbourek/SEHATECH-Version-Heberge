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
  },
  color: {
    type: String,
    default: '#60A5FA'
  },
  limits: {
    type: Object,
    default: () => ({ min: null, max: null })
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
  
  // Déterminer les limites du graphique
  let minY, maxY;
  
  // Si des données sont fournies, calculer le min/max automatiquement
  if (props.data && props.data.length > 0) {
    const validData = props.data.filter(value => 
      value !== null && value !== undefined && !isNaN(Number(value))
    ).map(value => Number(value));
    
    if (validData.length > 0) {
      minY = Math.min(...validData);
      maxY = Math.max(...validData);
    }
  }
  
  // Utiliser les limites fournies si disponibles
  if (props.limits) {
    if (props.limits.min !== null && props.limits.min !== undefined) {
      minY = Math.min(minY ?? Infinity, props.limits.min);
    }
    if (props.limits.max !== null && props.limits.max !== undefined) {
      maxY = Math.max(maxY ?? -Infinity, props.limits.max);
    }
  }
  
  // Ajouter une marge de 10%
  const range = maxY - minY;
  minY = minY - range * 0.1;
  maxY = maxY + range * 0.1;

  const option = {
    grid: {
      top: 2,
      right: 2,
      bottom: 2,
      left: 2,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      show: false,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      show: false,
      min: minY,
      max: maxY
    },
    series: [
      {
        type: 'line',
        data: props.data,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: props.color
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: echarts.color.modifyAlpha(props.color, 0.3)
            },
            {
              offset: 1,
              color: echarts.color.modifyAlpha(props.color, 0.05)
            }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      }
    ],
    animation: false
  }

  chart.setOption(option)
}

// Surveillance des changements de données
watch(() => props.data, updateChart, { deep: true })
watch(() => props.color, updateChart)

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