<template>
  <div class="w-full h-full relative" ref="chartContainer">
    <div v-if="year" class="absolute top-0 right-0 text-xs text-gray-500 dark:text-gray-400 p-2">
      Année: {{ year }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.mtbf && value.mttr && value.labels
    }
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
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        let tooltip = `${params[0].name}<br/>`;
        
        params.forEach(param => {
          const color = param.color;
          const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
          
          if (param.seriesName === 'MTBF (heures)') {
            tooltip += `${marker}${param.seriesName}: ${param.value}h<br/>`;
          } else if (param.seriesName === 'MTTR (heures)') {
            tooltip += `${marker}${param.seriesName}: ${param.value}h<br/>`;
          }
        });
        
        // Add failure count if available
        const index = params[0].dataIndex;
        if (props.data.failures && props.data.failures[index] !== undefined) {
          tooltip += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:#9CA3AF;"></span>`;
          tooltip += `Pannes: ${props.data.failures[index]}`;
        }
        
        return tooltip;
      }
    },
    legend: {
      data: ['MTBF (heures)', 'MTTR (heures)'],
      textStyle: {
        color: isDark ? '#9CA3AF' : '#4B5563'
      }
    },
    grid: {
      top: 40,
      right: 20,
      bottom: 20,
      left: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.labels,
      axisLine: {
        lineStyle: {
          color: isDark ? '#4B5563' : '#9CA3AF'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'MTBF',
        position: 'left',
        axisLine: {
          lineStyle: {
            color: '#3B82F6'
          }
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#E5E7EB'
          }
        }
      },
      {
        type: 'value',
        name: 'MTTR',
        position: 'right',
        axisLine: {
          lineStyle: {
            color: '#EF4444'
          }
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: 'MTBF (heures)',
        type: 'line',
        smooth: true,
        data: props.data.mtbf,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#3B82F6'
        },
        itemStyle: {
          color: '#3B82F6'
        }
      },
      {
        name: 'MTTR (heures)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: props.data.mttr,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#EF4444'
        },
        itemStyle: {
          color: '#EF4444'
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