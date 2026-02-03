<template>
  <div ref="chartContainer" class="h-full w-full relative">
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
        let tooltip = `${data.name}<br/>MTBF: ${data.value}h`;
        
        // Add MTTR and failures if they exist
        if (props.data[data.dataIndex]) {
          const item = props.data[data.dataIndex];
          if (item.mttr !== undefined) {
            tooltip += `<br/>MTTR: ${item.mttr}h`;
          }
          if (item.failures !== undefined) {
            tooltip += `<br/>Pannes: ${item.failures}`;
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
      axisLabel: {
        formatter: '{value}h',
        color: isDark ? '#9ca3af' : '#666'
      }
    },
    series: [
      {
        name: 'MTBF',
        data: props.data.map(item => item.value),
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
        }
      }
    ]
  }

  chart.setOption(option)
}

// Watch for changes in props
watch(() => props.data, updateChart, { deep: true })

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