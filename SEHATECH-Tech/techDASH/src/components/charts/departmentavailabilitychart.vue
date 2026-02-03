<template>
  <div class="w-full h-full" ref="chartContainer"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
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
  
  // Sort data by availability value in descending order for better visualization
  const sortedData = [...props.data].sort((a, b) => b.value - a.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        const data = params[0];
        const itemIndex = sortedData.findIndex(item => item.name === data.name);
        const item = itemIndex >= 0 ? sortedData[itemIndex] : null;
        
        if (!item) return '';
        
        let tooltip = `<div style="margin: 0px 0 0; line-height:1.5;">
          <div style="font-size:14px;color:${isDark ? '#fff' : '#666'};font-weight:600;margin-bottom:5px;">${item.name}</div>
          <div style="font-size:13px;color:${isDark ? '#ddd' : '#666'};font-weight:400;margin-bottom:5px;">
            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${data.color};"></span>
            Disponibilité: <span style="float:right;margin-left:10px;font-weight:900;color:${getTextColor(item.value)};">${item.value}%</span><br/>`;
        
        // Add additional information if available
        if (item.room_type !== undefined) {
          tooltip += `Type: <span style="float:right;margin-left:10px;">${item.room_type}</span><br/>`;
        }
        if (item.total !== undefined) {
          tooltip += `Équipements total: <span style="float:right;margin-left:10px;">${item.total}</span><br/>`;
        }
        if (item.available !== undefined) {
          tooltip += `Disponibles: <span style="float:right;margin-left:10px;">${item.available}</span><br/>`;
        }
        if (item.maintenance !== undefined) {
          tooltip += `En maintenance: <span style="float:right;margin-left:10px;">${item.maintenance}</span><br/>`;
        }
        
        // Add equipment details if available
        if (item.equipment_details && item.equipment_details.length > 0) {
          tooltip += `<div style="margin-top:5px;border-top:1px solid ${isDark ? '#555' : '#ddd'};padding-top:5px;">
            <div style="font-weight:600;margin-bottom:3px;">Détails des équipements:</div>`;
          
          item.equipment_details.forEach(eq => {
            const statusColor = eq.is_available ? '#10B981' : (eq.is_in_maintenance ? '#F59E0B' : '#EF4444');
            tooltip += `<div style="margin-bottom:2px;">
              <span style="display:inline-block;margin-right:5px;border-radius:10px;width:8px;height:8px;background-color:${statusColor};"></span>
              ${eq.resource_type}: <span style="float:right;margin-left:10px;color:${statusColor};">${eq.availability_percentage}%</span>
            </div>`;
          });
          
          tooltip += `</div>`;
        }
        
        tooltip += `</div></div>`;
        
        return tooltip;
      }
    },
    grid: {
      top: 10,
      right: 30,
      bottom: 20,
      left: 100,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLine: {
        lineStyle: {
          color: isDark ? '#4B5563' : '#9CA3AF'
        }
      },
      splitLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#E5E7EB'
        }
      },
      axisLabel: {
        formatter: '{value}%',
        color: isDark ? '#9CA3AF' : '#4B5563'
      }
    },
    yAxis: {
      type: 'category',
      data: sortedData.map(item => item.name),
      axisLine: {
        lineStyle: {
          color: isDark ? '#4B5563' : '#9CA3AF'
        }
      },
      axisLabel: {
        color: isDark ? '#9CA3AF' : '#4B5563',
        width: 80,
        overflow: 'truncate',
        formatter: function(value) {
          // Truncate long names
          return value.length > 15 ? value.substring(0, 12) + '...' : value;
        }
      }
    },
    series: [
      {
        name: 'Disponibilité',
        type: 'bar',
        data: sortedData.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: getBarColor(item.value)
          }
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: isDark ? '#D1D5DB' : '#4B5563'
        },
        barWidth: '60%'
      }
    ]
  }

  chart.setOption(option)
}

function getBarColor(value) {
  if (value >= 95) return '#10B981' // green-500
  if (value >= 85) return '#3B82F6' // blue-500
  if (value >= 75) return '#F59E0B' // yellow-500
  return '#EF4444' // red-500
}

function getTextColor(value) {
  if (value >= 95) return '#10B981' // green-500
  if (value >= 85) return '#3B82F6' // blue-500
  if (value >= 75) return '#F59E0B' // yellow-500
  return '#EF4444' // red-500
}

// Handle theme changes
const handleThemeChange = () => {
  if (chart) {
    const isDark = document.documentElement.classList.contains('dark')
    chart.dispose()
    chart = echarts.init(chartContainer.value, isDark ? 'dark' : undefined)
    updateChart()
  }
}

// Watch for changes in props
watch(() => props.data, updateChart, { deep: true })
watch(() => props.loading, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    // If loading changed from true to false, update the chart
    updateChart()
  }
})

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