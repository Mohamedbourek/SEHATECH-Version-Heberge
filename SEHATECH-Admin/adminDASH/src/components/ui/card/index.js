import { defineComponent, h } from 'vue'

const Card = defineComponent({
  name: 'Card',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'rounded-lg border bg-card text-card-foreground shadow-sm'
    }, slots.default?.())
  }
})

const CardHeader = defineComponent({
  name: 'CardHeader',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'flex flex-col space-y-1.5 p-6'
    }, slots.default?.())
  }
})

const CardTitle = defineComponent({
  name: 'CardTitle',
  setup(_, { slots }) {
    return () => h('h3', {
      class: 'text-lg font-semibold leading-none tracking-tight'
    }, slots.default?.())
  }
})

const CardContent = defineComponent({
  name: 'CardContent',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'p-6 pt-0'
    }, slots.default?.())
  }
})

export { Card, CardHeader, CardTitle, CardContent } 