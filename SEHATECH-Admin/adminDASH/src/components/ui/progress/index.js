import { defineComponent, h, computed } from 'vue'

export const Progress = defineComponent({
  name: 'Progress',
  props: {
    value: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    }
  },
  setup(props) {
    const percentage = computed(() => {
      const value = Math.min(Math.max(props.value, 0), props.max)
      return (value / props.max) * 100
    })

    return () => h('div', {
      class: 'relative h-2 w-full overflow-hidden rounded-full bg-primary-100 dark:bg-primary-800/20'
    }, [
      h('div', {
        class: 'h-full w-full flex-1 bg-primary-600 transition-all dark:bg-primary-400',
        style: `transform: translateX(-${100 - percentage.value}%)`
      })
    ])
  }
}) 