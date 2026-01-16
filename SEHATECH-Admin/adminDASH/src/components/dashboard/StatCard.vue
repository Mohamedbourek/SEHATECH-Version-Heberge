<template>
  <Card>
    <CardContent class="p-6">
      <div class="flex items-center justify-between space-x-4">
        <div class="flex-1">
          <p class="text-sm font-medium text-muted-foreground">{{ title }}</p>
          <div class="flex items-baseline">
            <h2 class="text-3xl font-bold">{{ value }}</h2>
            <span v-if="suffix" class="ml-1 text-xl">{{ suffix }}</span>
          </div>
          <p v-if="change !== undefined" class="text-xs flex items-center mt-1" :class="getChangeClass">
            <component :is="change >= 0 ? TrendingUp : TrendingDown" class="w-3 h-3 mr-1" />
            {{ Math.abs(change) }}% par rapport au mois dernier
          </p>
        </div>
        <div :class="[`p-3 rounded-full`, getIconClass]">
          <component :is="icon" class="w-5 h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: Object,
    required: true
  },
  color: {
    type: String,
    default: 'blue'
  },
  change: {
    type: Number,
    default: undefined
  },
  suffix: {
    type: String,
    default: ''
  }
})

const getIconClass = computed(() => ({
  'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400': props.color === 'blue',
  'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400': props.color === 'green',
  'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400': props.color === 'yellow',
  'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400': props.color === 'red'
}))

const getChangeClass = computed(() => ({
  'text-green-600 dark:text-green-400': props.change > 0,
  'text-red-600 dark:text-red-400': props.change < 0,
  'text-muted-foreground': props.change === 0
}))
</script> 