<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, toRefs } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
});

const { chartData, options } = toRefs(props);
const chartCanvas = ref(null);
let chart = null;

const createChart = () => {
  if (chart) {
    chart.destroy();
  }
  
  const ctx = chartCanvas.value.getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: chartData.value,
    options: options.value
  });
};

onMounted(() => {
  createChart();
});

watch([chartData, options], () => {
  createChart();
}, { deep: true });
</script>