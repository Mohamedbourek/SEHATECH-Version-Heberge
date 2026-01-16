import { defineComponent, h } from 'vue'

const Avatar = defineComponent({
  name: 'Avatar',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full'
    }, slots.default?.())
  }
})

const AvatarImage = defineComponent({
  name: 'AvatarImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => h('img', {
      src: props.src,
      alt: props.alt,
      class: 'aspect-square h-full w-full object-cover'
    })
  }
})

const AvatarFallback = defineComponent({
  name: 'AvatarFallback',
  setup(_, { slots }) {
    return () => h('div', {
      class: 'flex h-full w-full items-center justify-center rounded-full bg-muted'
    }, slots.default?.())
  }
})

export { Avatar, AvatarImage, AvatarFallback } 